import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity,
  ScrollView, ActivityIndicator, Image, Platform, KeyboardAvoidingView, BackHandler
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

// Services & Constants
import { ServiceEnums, TransactionTypeEnums } from '../../constants/ServiceEnums';
import {
  useCategoriesByService,
  useCategoryAttributes,
  useBrandsByCategory
} from '../../api/services/categoryService';
import { useLocations, useSubCities, useWeredas, useCurrencies } from '../../api/services/locationService';
import { usePostTypesQuery, useCreateProductMutation } from '../../api/services/productService';
import { useAuthStore } from '../../store/useAuthStore';
import { useNotificationStore } from '../../store/useNotificationStore';
import { cleanErrorMessage } from '../../utils/errorUtils';
import RoleAccessGuard from '../../components/common/RoleAccessGuard';
import { FeatureActions } from '../../constants/UserRoles';
import { TITLE_PLACEHOLDER } from '../../constants/formPlaceholders';
import { checkPackageBeforePosting, useUserPackages } from '../../api/services/packageService';
import { formatEtb, formatNumberWithCommas, getEtbCurrency, unformatNumber } from '../../utils/currency';

const THEME_COLOR = '#FF8C00';
const STEPS = ['Type', 'Category', 'Details', 'Location', 'Media', 'Options'];

export default function PostPropertyScreen({ navigation }: any) {
  const [currentStep, setCurrentStep] = useState(0);
  const insets = useSafeAreaInsets();
  const { showNotification, showAlert } = useNotificationStore();

  // Form State
  const [selectedService, setSelectedService] = useState<number>(ServiceEnums.Machinery);
  const [transactionType, setTransactionType] = useState<number>(TransactionTypeEnums.Rent);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [selectedBrand, setSelectedBrand] = useState<any>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [isFixed, setIsFixed] = useState(true);
  const [selectedCurrency, setSelectedCurrency] = useState<any>(null);
  const [attributeValues, setAttributeValues] = useState<any>({});
  const [videoLink, setVideoLink] = useState('');

  // Location State
  const [selectedLocation, setSelectedLocation] = useState<any>(null);
  const [selectedSubCity, setSelectedSubCity] = useState<any>(null);
  const [selectedWereda, setSelectedWereda] = useState<any>(null);

  // Media
  const [images, setImages] = useState<any[]>([]);
  const [legalDocs, setLegalDocs] = useState<any[]>([]);
  const [selectedPostType, setSelectedPostType] = useState<any>(null);
  const [postThroughGadal, setPostThroughGadal] = useState(false);
  const [checkingPackage, setCheckingPackage] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, boolean>>({});

  const user = useAuthStore(state => state.user);

  // Queries & Mutations
  const categoriesQuery = useCategoriesByService(selectedService);
  const attributesQuery = useCategoryAttributes(selectedCategory?._id);
  const brandsQuery = useBrandsByCategory(selectedCategory?._id);
  const locationsQuery = useLocations();
  const subCitiesQuery = useSubCities(selectedLocation?._id);
  const weredasQuery = useWeredas(selectedSubCity?._id);
  const currenciesQuery = useCurrencies();
  const postTypesQuery = usePostTypesQuery();
  const createProductMutation = useCreateProductMutation();
  const etbCurrency = getEtbCurrency(currenciesQuery.data || []);
  const { data: packages = [] } = useUserPackages();
  const activePackage = packages.find((p: any) => p.isValid);

  // Auto-select postType based on active package
  useEffect(() => {
    if (!activePackage || !postTypesQuery.data) return;
    // Determine which tier the active package belongs to
    let tierName = '';
    if (activePackage.remainingPremiumPosts > 0) tierName = 'premium';
    else if (activePackage.remainingGoldPosts > 0) tierName = 'gold';
    else if (activePackage.remainingBasicPosts > 0) tierName = 'basic';

    if (tierName) {
      const matchedPostType = postTypesQuery.data.find(
        (pt: any) => pt.name.toLowerCase().includes(tierName)
      );
      if (matchedPostType) setSelectedPostType(matchedPostType);
    }
  }, [activePackage, postTypesQuery.data]);

  // --- Handlers ---

  const getServiceIcon = (key: string) => {
    switch (key) {
      case 'Property': return 'home-outline';
      case 'Vehicle': return 'car-outline';
      case 'Machinery': return 'construct-outline';
      default: return 'cube-outline';
    }
  };

  const pickImage = async (isLegal = false) => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      if (isLegal) {
        setLegalDocs([...legalDocs, result.assets[0]]);
      } else {
        setImages([...images, result.assets[0]]);
        setValidationErrors(prev => ({ ...prev, images: false }));
      }
    }
  };


  const validatePackageBeforePosting = async () => {
    // If posting through Gadal, no package needed
    if (postThroughGadal) return true;

    // If no active package, block posting
    if (!activePackage) {
      showAlert(
        'Package Required',
        'You need an active package to post. Please buy a package first.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Buy Package', onPress: () => navigation.navigate('MyPackages', { returnTo: 'PostProperty' }) },
        ]
      );
      return false;
    }

    // If we have an active package but no matching postType was found, check via API
    if (!selectedPostType?._id) {
      showNotification('Could not determine your post type from your active package.', 'error');
      return false;
    }

    setCheckingPackage(true);
    try {
      const eligibility = await checkPackageBeforePosting(selectedPostType._id);
      if (!eligibility.canPost) {
        showAlert(
          'Package Required',
          eligibility.message || 'Your package has no remaining posts. Please buy a new package.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Buy Package', onPress: () => navigation.navigate('MyPackages', { returnTo: 'PostProperty' }) },
          ]
        );
        return false;
      }
      return true;
    } catch (error: any) {
      showNotification(cleanErrorMessage(error), 'error');
      return false;
    } finally {
      setCheckingPackage(false);
    }
  };

  const validateCurrentStep = () => {
    const nextErrors: Record<string, boolean> = {};

    if (currentStep === 1) {
      nextErrors.category = !selectedCategory;
    }

    if (currentStep === 2) {
      nextErrors.title = !title.trim();
      nextErrors.description = !description.trim();
      nextErrors.price = !price.trim();
    }

    if (currentStep === 3) {
      nextErrors.location = !selectedLocation;
      nextErrors.subCity = !selectedSubCity;
      nextErrors.wereda = !selectedWereda;
    }

    if (currentStep === 4) {
      nextErrors.images = images.length === 0;
    }

    if (currentStep === 5) {
      // Must have an active package or post through Gadal
      nextErrors.postType = !activePackage && !postThroughGadal;
    }

    const visibleErrors = Object.fromEntries(Object.entries(nextErrors).filter(([, hasError]) => hasError));
    setValidationErrors(visibleErrors);
    return Object.keys(visibleErrors).length === 0;
  };

  const handleNext = async () => {
    if (currentStep === 0 && !selectedService) return showNotification("Select a service type", "error");
    if (!validateCurrentStep()) {
      return showNotification("Please complete the highlighted required fields", "error");
    }

    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      const canPost = await validatePackageBeforePosting();
      if (!canPost) return;
      submitPost();
    }
  };

  const handleBack = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
      return true;
    }

    navigation.goBack();
    return true;
  }, [currentStep, navigation]);

  useFocusEffect(
    useCallback(() => {
      const subscription = BackHandler.addEventListener('hardwareBackPress', handleBack);
      return () => subscription.remove();
    }, [handleBack])
  );

  const submitPost = async () => {
    try {
      const formData = new FormData();

      // Basic Info
      formData.append('title', title);
      formData.append('description', description);
      const numericPrice = unformatNumber(price);
      formData.append('currentPrice', numericPrice);
      formData.append('previousPrice', numericPrice);
      formData.append('isFixed', `${isFixed}`);
      formData.append('transactionType', `${transactionType}`);
      formData.append('productType', `${selectedService}`);
      formData.append('category', selectedCategory?._id);
      formData.append('consignee', user?.id || user?._id || '');
      // Only attach a postType if NOT using "Post through Gadal"
      if (selectedPostType?._id && !postThroughGadal) {
        formData.append('postType', selectedPostType._id);
      }
      formData.append('youtubeLink', videoLink);
      formData.append('postThroughGadal', `${postThroughGadal}`);
      formData.append('currency', etbCurrency?._id || selectedCurrency?._id || currenciesQuery.data?.[0]?._id);

      if (selectedBrand) {
        formData.append('brand', selectedBrand._id);
      }

      // Location
      formData.append('location', selectedLocation?._id);
      formData.append('subCity', selectedSubCity?._id);
      formData.append('wereda', selectedWereda?._id);

      // Attributes
      const productAttributes = Object.keys(attributeValues).map(key => ({
        name: key,
        value: attributeValues[key]
      }));
      if (productAttributes.length > 0) {
        formData.append('attributes', JSON.stringify(productAttributes));
      }

      // Images
      images.forEach((img, idx) => {
        formData.append('images', {
          uri: img.uri,
          name: img.fileName || `image_${idx}.jpg`,
          type: img.mimeType || 'image/jpeg'
        } as any);
      });

      // Legal Docs
      legalDocs.forEach((doc, idx) => {
        formData.append('legalDocuments', {
          uri: doc.uri,
          name: doc.fileName || `doc_${idx}.jpg`,
          type: doc.mimeType || 'image/jpeg'
        } as any);
      });

      // "Post through Gadal" flow: send sellerInformation so the backend
      // generates a unique productId (required by the database unique index).
      // Also send paymentAmount=0 to bypass the payment middleware entirely.
      if (postThroughGadal) {
        formData.append('paymentAmount', '0');
        formData.append('sellerInformation', JSON.stringify({
          postedVia: 'GadalApp',
          userId: user?.id || user?._id || '',
        }));
      }

      createProductMutation.mutate(formData, {
        onSuccess: () => {
          showNotification("Product posted successfully!", "success");
          navigation.navigate('Tabs');
        },
        onError: (err: any) => {
          showNotification(cleanErrorMessage(err), "error");
        }
      });
    } catch (error) {
      showNotification("Something went wrong building the form", "error");
    }
  };

  // Determine which feature to gate based on transaction type
  const postFeature = transactionType === TransactionTypeEnums.Rent
    ? FeatureActions.POST_RENT
    : FeatureActions.POST_SALE;

  return (
    <RoleAccessGuard feature={postFeature}>
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>New Listing</Text>
      </View>

      <View style={styles.stepperWrapper}>
        <View style={styles.stepperContainer}>
          {STEPS.map((step, index) => {
            const isActive = index <= currentStep;
            return (
              <View key={index} style={styles.stepWrapper}>
                <View style={[styles.stepCircle, isActive && styles.activeStepCircle]}>
                  {isActive ? <Ionicons name="checkmark" size={14} color="#fff" /> : <Text style={styles.stepNumber}>{index + 1}</Text>}
                </View>
                {index < STEPS.length - 1 && <View style={styles.stepLine} />}
              </View>
            );
          })}
        </View>
        <Text style={styles.stepTitle}>{STEPS[currentStep]}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {currentStep === 0 && (
          <View>
            <Text style={styles.label}>Select Service</Text>
            <View style={styles.gridContainer}>
              {Object.entries(ServiceEnums)
                .filter(([key]) => ['Machinery', 'Vehicle'].includes(key))
                .map(([key, value]) => (
                  <TouchableOpacity
                    key={key}
                    style={[styles.serviceCard, selectedService === value && styles.activeCard]}
                    onPress={() => {
                      setSelectedService(value);
                      setSelectedCategory(null);
                      setValidationErrors({});
                    }}
                  >
                    <Ionicons name={getServiceIcon(key)} size={32} color={selectedService === value ? THEME_COLOR : '#666'} />
                    <Text style={[styles.serviceText, selectedService === value && styles.activeText]}>{key}</Text>
                  </TouchableOpacity>
                ))}
            </View>

            <Text style={styles.label}>Select Type</Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity
                style={[styles.typeChip, transactionType === TransactionTypeEnums.Rent && styles.activeTypeChip]}
                onPress={() => setTransactionType(TransactionTypeEnums.Rent)}
              >
                <Text style={[styles.typeChipText, transactionType === TransactionTypeEnums.Rent && styles.activeTypeChipText]}>Rent</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.typeChip, transactionType === TransactionTypeEnums.Sale && styles.activeTypeChip]}
                onPress={() => setTransactionType(TransactionTypeEnums.Sale)}
              >
                <Text style={[styles.typeChipText, transactionType === TransactionTypeEnums.Sale && styles.activeTypeChipText]}>Sale</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {currentStep === 1 && (
          <View>
            {categoriesQuery.isLoading ? <ActivityIndicator size="large" color={THEME_COLOR} /> : (
              <ScrollView style={{ maxHeight: 400 }}>
                {categoriesQuery.data?.map((cat) => (
                  <TouchableOpacity
                    key={cat._id}
                    style={[styles.listItem, validationErrors.category && styles.validationBorder, selectedCategory?._id === cat._id && styles.activeListItem]}
                    onPress={() => {
                      setSelectedCategory(cat);
                      setValidationErrors(prev => ({ ...prev, category: false }));
                    }}
                  >
                    <Image source={{ uri: cat.icon }} style={{ width: 24, height: 24, marginRight: 10 }} />
                    <Text style={[styles.listText, selectedCategory?._id === cat._id && styles.activeText]}>{cat.name}</Text>
                    {selectedCategory?._id === cat._id && <Ionicons name="checkmark-circle" size={20} color={THEME_COLOR} />}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        )}

        {currentStep === 2 && (
          <View>
            <Text style={styles.label}>Title</Text>
            <TextInput
              style={[styles.input, validationErrors.title && styles.inputError]}
              placeholder={TITLE_PLACEHOLDER}
              placeholderTextColor="#888"
              value={title}
              onChangeText={(value) => {
                setTitle(value);
                setValidationErrors(prev => ({ ...prev, title: false }));
              }}
            />

            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, { height: 80 }, validationErrors.description && styles.inputError]}
              placeholder="Describe your item..."
              placeholderTextColor="#888"
              multiline
              value={description}
              onChangeText={(value) => {
                setDescription(value);
                setValidationErrors(prev => ({ ...prev, description: false }));
              }}
            />

            <Text style={styles.label}>Price</Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TextInput
                style={[styles.input, { flex: 1 }, validationErrors.price && styles.inputError]}
                placeholder="Amount in ETB"
                placeholderTextColor="#888"
                keyboardType="numeric"
                value={price}
                onChangeText={(value) => {
                  setPrice(formatNumberWithCommas(value));
                  setValidationErrors(prev => ({ ...prev, price: false }));
                }}
              />
              <TouchableOpacity style={styles.pickerBoxCompact}>
                <Text>ETB</Text>
              </TouchableOpacity>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10 }}>
              <TouchableOpacity
                onPress={() => setIsFixed(true)}
                style={[styles.miniChip, isFixed && styles.activeMiniChip]}
              >
                <Text style={isFixed ? styles.activeMiniChipText : styles.miniChipText}>Fixed</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setIsFixed(false)}
                style={[styles.miniChip, !isFixed && styles.activeMiniChip]}
              >
                <Text style={!isFixed ? styles.activeMiniChipText : styles.miniChipText}>Negotiable</Text>
              </TouchableOpacity>
            </View>

            {brandsQuery.data && brandsQuery.data.length > 0 && (
              <View style={{ marginTop: 15 }}>
                <Text style={styles.label}>Brand</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row' }}>
                  {brandsQuery.data.map(brand => (
                    <TouchableOpacity
                      key={brand._id}
                      style={[styles.chip, selectedBrand?._id === brand._id && styles.activeChip]}
                      onPress={() => setSelectedBrand(brand)}
                    >
                      <Text style={[styles.chipText, selectedBrand?._id === brand._id && styles.activeChipText]}>{brand.description}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {attributesQuery.isLoading ? <ActivityIndicator color={THEME_COLOR} /> : (
              <View style={{ marginTop: 20 }}>
                <Text style={styles.sectionHeader}>Specifications</Text>
                {attributesQuery.data?.map(attr => (
                  <View key={attr._id} style={{ marginTop: 10 }}>
                    <Text style={styles.labelSmall}>{attr.name}</Text>
                    {attr.isInsertion ? (
                      <TextInput
                        style={styles.input}
                        placeholder={`Enter ${attr.name}`}
                        placeholderTextColor="#888"
                        value={attributeValues[attr.name] || ''}
                        onChangeText={(val) => setAttributeValues({ ...attributeValues, [attr.name]: val })}
                      />
                    ) : (
                      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {attr.values.map(val => (
                          <TouchableOpacity
                            key={val}
                            style={[styles.chip, attributeValues[attr.name] === val && styles.activeChip]}
                            onPress={() => setAttributeValues({ ...attributeValues, [attr.name]: val })}
                          >
                            <Text style={attributeValues[attr.name] === val ? styles.activeChipText : styles.chipText}>{val}</Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    )}
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {currentStep === 3 && (
          <View>
            <Text style={styles.label}>Select Location</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 15 }}>
              {locationsQuery.data?.map(loc => (
                <TouchableOpacity
                  key={loc._id}
                  style={[styles.chip, validationErrors.location && styles.validationBorder, selectedLocation?._id === loc._id && styles.activeChip]}
                  onPress={() => {
                    setSelectedLocation(loc);
                    setSelectedSubCity(null);
                    setSelectedWereda(null);
                    setValidationErrors(prev => ({ ...prev, location: false }));
                  }}
                >
                  <Text style={selectedLocation?._id === loc._id ? styles.activeChipText : styles.chipText}>{loc.descripton}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {selectedLocation && subCitiesQuery.data && (
              <>
                <Text style={styles.label}>Select Sub-City</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 15 }}>
                  {subCitiesQuery.data?.map(sub => (
                    <TouchableOpacity
                      key={sub._id}
                      style={[styles.chip, validationErrors.subCity && styles.validationBorder, selectedSubCity?._id === sub._id && styles.activeChip]}
                      onPress={() => {
                        setSelectedSubCity(sub);
                        setSelectedWereda(null);
                        setValidationErrors(prev => ({ ...prev, subCity: false }));
                      }}
                    >
                      <Text style={selectedSubCity?._id === sub._id ? styles.activeChipText : styles.chipText}>{sub.descripton}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </>
            )}

            {selectedSubCity && weredasQuery.data && (
              <>
                <Text style={styles.label}>Select Wereda</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {weredasQuery.data?.map(wer => (
                    <TouchableOpacity
                      key={wer._id}
                      style={[styles.chip, validationErrors.wereda && styles.validationBorder, selectedWereda?._id === wer._id && styles.activeChip]}
                      onPress={() => {
                        setSelectedWereda(wer);
                        setValidationErrors(prev => ({ ...prev, wereda: false }));
                      }}
                    >
                      <Text style={selectedWereda?._id === wer._id ? styles.activeChipText : styles.chipText}>{wer.descripton}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </>
            )}
          </View>
        )}

        {currentStep === 4 && (
          <View>
            <Text style={styles.label}>Product Photos</Text>
            <TouchableOpacity style={[styles.uploadBox, validationErrors.images && styles.inputError]} onPress={() => pickImage(false)}>
              <View style={styles.cropUploadButton}>
                <Ionicons name="crop-outline" size={24} color="#fff" />
                <Text style={styles.cropUploadButtonText}>Crop & Upload Photo</Text>
              </View>
              <Text style={styles.uploadHint}>Select a photo, then adjust the crop before saving.</Text>
            </TouchableOpacity>
            <View style={styles.imageGrid}>
              {images.map((img, idx) => (
                <View key={idx} style={styles.imageWrapper}>
                  <Image source={{ uri: img.uri }} style={styles.thumbnail} />
                  <TouchableOpacity onPress={() => setImages(images.filter((_, i) => i !== idx))} style={styles.removeBtn}>
                    <Ionicons name="close-circle" size={20} color="red" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>

            <Text style={styles.label}>Legal Documents / Libre</Text>
            <TouchableOpacity style={[styles.uploadBox, { height: 100 }]} onPress={() => pickImage(true)}>
              <Ionicons name="document-text" size={30} color={THEME_COLOR} />
              <Text style={{ color: '#666', marginTop: 5 }}>Upload PDF or Image</Text>
            </TouchableOpacity>
            <View style={styles.imageGrid}>
              {legalDocs.map((doc, idx) => (
                <View key={idx} style={styles.imageWrapper}>
                  <View style={[styles.thumbnail, { backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center' }]}>
                    {doc.mimeType === 'application/pdf' ? <Text>PDF</Text> : <Image source={{ uri: doc.uri }} style={styles.thumbnail} />}
                  </View>
                  <TouchableOpacity onPress={() => setLegalDocs(legalDocs.filter((_, i) => i !== idx))} style={styles.removeBtn}>
                    <Ionicons name="close-circle" size={20} color="red" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>

            <Text style={styles.label}>YouTube Video Link</Text>
            <TextInput
              style={styles.input}
              placeholder="https://youtube.com/..."
              placeholderTextColor="#888"
              value={videoLink}
              onChangeText={setVideoLink}
            />
          </View>
        )}

        {currentStep === 5 && (
          <View>
            <Text style={styles.sectionHeader}>Posting Options</Text>

            {/* Active package info or buy prompt */}
            {activePackage ? (
              <View style={[styles.packageCard, styles.activePackageCard]}>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <Ionicons name="checkmark-circle" size={20} color="#1E8E3E" />
                    <Text style={[styles.packageName, { color: '#1E8E3E' }]}>Active Package</Text>
                  </View>
                  <Text style={{ fontSize: 13, color: '#555', marginBottom: 8 }}>
                    {activePackage.description || 'Package'}
                  </Text>
                  <View style={{ flexDirection: 'row', gap: 12, flexWrap: 'wrap' }}>
                    {activePackage.remainingBasicPosts > 0 && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#4A90E2' }} />
                        <Text style={{ fontSize: 13, color: '#333', fontWeight: '600' }}>
                          {activePackage.remainingBasicPosts} Basic Posts
                        </Text>
                      </View>
                    )}
                    {activePackage.remainingGoldPosts > 0 && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#F5A623' }} />
                        <Text style={{ fontSize: 13, color: '#333', fontWeight: '600' }}>
                          {activePackage.remainingGoldPosts} Golden Posts
                        </Text>
                      </View>
                    )}
                    {activePackage.remainingPremiumPosts > 0 && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#9B59B6' }} />
                        <Text style={{ fontSize: 13, color: '#333', fontWeight: '600' }}>
                          {activePackage.remainingPremiumPosts} Premium Posts
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text style={{ fontSize: 11, color: '#999', marginTop: 8 }}>
                    Your post will use 1 post from this package.
                  </Text>
                </View>
              </View>
            ) : (
              <View style={[styles.packageCard, validationErrors.postType && styles.validationBorder, { borderColor: '#FFE0B2', backgroundColor: '#FFF9E6' }]}>
                <View style={{ flex: 1, alignItems: 'center', paddingVertical: 10 }}>
                  <Ionicons name="alert-circle-outline" size={36} color="#D48800" />
                  <Text style={{ fontSize: 15, fontWeight: 'bold', color: '#D48800', marginTop: 8 }}>
                    No Active Package
                  </Text>
                  <Text style={{ fontSize: 12, color: '#999', marginTop: 4, textAlign: 'center' }}>
                    You need a package to post. Buy one to get started.
                  </Text>
                  <TouchableOpacity
                    style={{ backgroundColor: THEME_COLOR, borderRadius: 10, paddingHorizontal: 24, paddingVertical: 10, marginTop: 14 }}
                    onPress={() => navigation.navigate('MyPackages', { returnTo: 'PostProperty' })}
                  >
                    <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 14 }}>Buy Package</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            <View style={{ marginTop: 25, borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 20 }}>
              <TouchableOpacity 
                style={styles.checkboxContainer} 
                onPress={() => {
                  const newVal = !postThroughGadal;
                  setPostThroughGadal(newVal);
                  if (newVal) setSelectedPostType(null);
                  setValidationErrors(prev => ({ ...prev, postType: false }));
                }}
              >
                <Ionicons 
                  name={postThroughGadal ? "checkbox" : "square-outline"} 
                  size={24} 
                  color={THEME_COLOR} 
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.checkboxLabel}>Post through Gadal</Text>
                  <Text style={{ fontSize: 12, color: '#888', marginTop: 2 }}>Your post will be shared on other Gadal network platforms.</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>


      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        {currentStep > 0 && (
          <TouchableOpacity
            style={styles.backBtn}
            onPress={handleBack}
            disabled={createProductMutation.isPending}
          >
            <Text style={styles.backBtnText}>Back</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.nextBtn, (createProductMutation.isPending || checkingPackage) && { opacity: 0.6 }]}
          onPress={handleNext}
          disabled={createProductMutation.isPending || checkingPackage}
        >
          {createProductMutation.isPending || checkingPackage ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.nextBtnText}>{currentStep === STEPS.length - 1 ? "Post Item" : "Next"}</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
    </RoleAccessGuard>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { padding: 20, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#eee' },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },

  stepperWrapper: { alignItems: 'center', paddingVertical: 15 },
  stepperContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  stepWrapper: { flexDirection: 'row', alignItems: 'center' },
  stepCircle: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#ddd', justifyContent: 'center', alignItems: 'center', marginRight: 5 },
  activeStepCircle: { backgroundColor: THEME_COLOR },
  stepNumber: { fontSize: 12, color: '#fff' },
  stepLine: { width: 30, height: 2, backgroundColor: '#eee', marginHorizontal: 5 },
  stepTitle: { marginTop: 10, fontSize: 16, fontWeight: '600', color: '#333' },

  content: { padding: 20 },

  // Grid for Services
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  serviceCard: {
    width: '48%', aspectRatio: 1, backgroundColor: '#f9f9f9', borderRadius: 12,
    justifyContent: 'center', alignItems: 'center', marginBottom: 15,
    borderWidth: 2, borderColor: 'transparent'
  },
  activeCard: { borderColor: THEME_COLOR, backgroundColor: '#FFF5E5' },
  serviceText: { marginTop: 10, fontSize: 16, color: '#666', fontWeight: '500' },
  activeText: { color: THEME_COLOR, fontWeight: 'bold' },

  // List Items
  listItem: { flexDirection: 'row', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderBottomColor: '#eee' },
  activeListItem: { backgroundColor: '#FFF5E5' },
  listText: { fontSize: 16, flex: 1 },

  // Form Inputs
  label: { fontSize: 14, color: '#666', marginBottom: 5, marginTop: 15 },
  labelSmall: { fontSize: 12, color: '#888', marginBottom: 5 },
  input: {
    backgroundColor: '#f9f9f9', borderWidth: 1, borderColor: '#ddd',
    borderRadius: 8, padding: 12, fontSize: 16
  },
  inputError: { borderColor: '#E53935', backgroundColor: '#FFF7F7' },
  validationBorder: { borderWidth: 1, borderColor: '#E53935' },
  pickerBoxCompact: { padding: 12, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, justifyContent: 'center' },
  sectionHeader: { fontSize: 16, fontWeight: 'bold', marginVertical: 10 },

  // Chips
  chip: {
    paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20,
    backgroundColor: '#f0f0f0', marginRight: 10, marginBottom: 10
  },
  activeChip: { backgroundColor: THEME_COLOR },
  chipText: { color: '#333' },
  activeChipText: { color: '#fff', fontWeight: 'bold' },

  // Media
  uploadBox: {
    height: 150, borderWidth: 2, borderColor: '#ddd', borderStyle: 'dashed',
    borderRadius: 12, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fafafa'
  },
  cropUploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME_COLOR,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cropUploadButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  uploadHint: {
    color: '#666',
    fontSize: 12,
    marginTop: 10,
    textAlign: 'center',
    paddingHorizontal: 15,
  },
  imageGrid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 20 },
  imageWrapper: { width: 100, height: 100, marginRight: 10, marginBottom: 10 },
  thumbnail: { width: '100%', height: '100%', borderRadius: 8 },
  removeBtn: { position: 'absolute', top: -5, right: -5, backgroundColor: 'white', borderRadius: 10 },

  // Footer
  footer: { flexDirection: 'row', padding: 20, borderTopWidth: 1, borderTopColor: '#eee', backgroundColor: '#fff' },
  backBtn: { marginRight: 20, paddingVertical: 15 },
  backBtnText: { color: '#666', fontSize: 16 },
  nextBtn: { flex: 1, backgroundColor: THEME_COLOR, borderRadius: 30, alignItems: 'center', justifyContent: 'center', paddingVertical: 15 },
  nextBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },

  typeChip: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10, backgroundColor: '#f0f0f0', borderWidth: 1, borderColor: '#ddd' },
  activeTypeChip: { backgroundColor: THEME_COLOR, borderColor: THEME_COLOR },
  typeChipText: { color: '#666', fontWeight: 'bold' },
  activeTypeChipText: { color: '#fff' },

  miniChip: { paddingHorizontal: 15, paddingVertical: 6, borderRadius: 15, backgroundColor: '#f0f0f0', marginRight: 10 },
  activeMiniChip: { backgroundColor: '#444' },
  miniChipText: { color: '#666', fontSize: 12 },
  activeMiniChipText: { color: '#fff', fontSize: 12 },

  packageCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f9f9f9', padding: 15, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: '#eee' },
  activePackageCard: { borderColor: THEME_COLOR, backgroundColor: '#FFF5E5' },
  packageName: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  packagePrice: { fontSize: 14, color: THEME_COLOR, marginTop: 4 },
  checkboxContainer: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  checkboxLabel: { fontSize: 16, color: '#333', fontWeight: 'bold' }
});
