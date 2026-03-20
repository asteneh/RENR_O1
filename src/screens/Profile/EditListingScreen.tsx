import React, { useState, useEffect } from 'react';
import {
    View, Text, TextInput, StyleSheet, TouchableOpacity,
    ScrollView, ActivityIndicator, Image, Platform, KeyboardAvoidingView
} from 'react-native';
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
import { usePostTypesQuery, useUpdateProductMutation, useSingleProductQuery } from '../../api/services/productService';
import { useAuthStore } from '../../store/useAuthStore';
import { useNotificationStore } from '../../store/useNotificationStore';
import { cleanErrorMessage } from '../../utils/errorUtils';
import { CONFIG } from '../../config';

const THEME_COLOR = '#FF8C00';
const STEPS = ['Type', 'Category', 'Details', 'Location', 'Media', 'Options'];

export default function EditListingScreen({ navigation, route }: any) {
    const { productId } = route.params;
    const [currentStep, setCurrentStep] = useState(2); // Start at Details for better UX when editing
    const insets = useSafeAreaInsets();
    const { showNotification } = useNotificationStore();

    const { data: product, isLoading: isProductLoading } = useSingleProductQuery(productId);

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
    const [existingImages, setExistingImages] = useState<string[]>([]);
    const [newImages, setNewImages] = useState<any[]>([]);
    const [selectedPostType, setSelectedPostType] = useState<any>(null);

    const user = useAuthStore(state => state.user);

    useEffect(() => {
        if (product) {
            setSelectedService(product.productType || product.category?.serviceType || 1);
            setTransactionType(product.transactionType || 1);
            setSelectedCategory(product.category);
            setSelectedBrand(product.brand);
            setTitle(product.title);
            setDescription(product.description);
            setPrice(product.currentPrice.toString());
            setIsFixed(product.isFixed);
            setSelectedCurrency(product.currency);
            setVideoLink(product.youtubeLink || '');
            setSelectedLocation(product.location);
            setSelectedSubCity(product.subCity);
            setSelectedWereda(product.wereda);
            setExistingImages(product.productImages || []);
            setSelectedPostType(product.postType);

            // Attributes
            if (product.attributes) {
                const attrs: any = {};
                product.attributes.forEach((a: any) => {
                    attrs[a.name] = a.value;
                });
                setAttributeValues(attrs);
            }
        }
    }, [product]);

    // Queries & Mutations
    const categoriesQuery = useCategoriesByService(selectedService);
    const attributesQuery = useCategoryAttributes(selectedCategory?._id);
    const brandsQuery = useBrandsByCategory(selectedCategory?._id);
    const locationsQuery = useLocations();
    const subCitiesQuery = useSubCities(selectedLocation?._id);
    const weredasQuery = useWeredas(selectedSubCity?._id);
    const currenciesQuery = useCurrencies();
    const postTypesQuery = usePostTypesQuery();
    const updateProductMutation = useUpdateProductMutation();

    if (isProductLoading) return <View style={styles.center}><ActivityIndicator size="large" color={THEME_COLOR} /></View>;

    // --- Components ---

    // --- Rendering Helpers ---
    const getServiceIcon = (key: string) => {
        switch (key) {
            case 'Vehicle': return 'car-outline';
            case 'Machinery': return 'construct-outline';
            default: return 'cube-outline';
        }
    };

    const submitUpdate = async () => {

        try {
            const formData = new FormData();
            formData.append('productId', productId);
            formData.append('title', title);
            formData.append('description', description);
            formData.append('currentPrice', price);
            formData.append('previousPrice', price);
            formData.append('isFixed', `${isFixed}`);
            formData.append('transactionType', `${transactionType}`);
            formData.append('productType', `${selectedService}`);
            formData.append('category', selectedCategory?._id);
            formData.append('postType', selectedPostType?._id);
            formData.append('youtubeLink', videoLink);
            formData.append('currency', selectedCurrency?._id || currenciesQuery.data?.[0]?._id);
            formData.append('location', selectedLocation?._id);
            formData.append('subCity', selectedSubCity?._id);
            formData.append('wereda', selectedWereda?._id);

            if (selectedBrand) formData.append('brand', selectedBrand._id);

            const productAttributes = Object.keys(attributeValues).map(key => ({
                name: key,
                value: attributeValues[key]
            }));
            if (productAttributes.length > 0) {
                formData.append('attributes', JSON.stringify(productAttributes));
            }

            // Existing images (usually backend needs to know which ones to keep/delete)
            // This part depends on backend API design. For now, we only push new ones if needed.
            // Or we can send the full list of remaining images as a stringified array.
            formData.append('existingImages', JSON.stringify(existingImages));

            // New Images
            newImages.forEach((img, idx) => {
                formData.append('images', {
                    uri: img.uri,
                    name: img.fileName || `image_${idx}.jpg`,
                    type: img.mimeType || 'image/jpeg'
                } as any);
            });

            updateProductMutation.mutate(formData, {
                onSuccess: () => {
                    showNotification("Listing updated successfully!", "success");
                    navigation.goBack();
                },
                onError: (err: any) => {
                    showNotification(cleanErrorMessage(err), "error");
                }
            });
        } catch (error) {
            showNotification("Something went wrong.", "error");
        }
    };
    const handleNext = () => {
        if (currentStep < STEPS.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            submitUpdate();
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="chevron-back" size={28} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Edit Listing</Text>
                <View style={{ width: 28 }} />
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
                                            setSelectedService(value as number);
                                            setSelectedCategory(null);
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
                        {categoriesQuery.isLoading ? (
                            <ActivityIndicator size="large" color={THEME_COLOR} />
                        ) : (
                            <ScrollView style={{ maxHeight: 400 }}>
                                {categoriesQuery.data?.map((cat) => (
                                    <TouchableOpacity
                                        key={cat._id}
                                        style={[styles.listItem, selectedCategory?._id === cat._id && styles.activeListItem]}
                                        onPress={() => setSelectedCategory(cat)}
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
                        <TextInput style={styles.input} placeholder="Item Title" placeholderTextColor="#888" value={title} onChangeText={setTitle} />

                        <Text style={styles.label}>Description</Text>
                        <TextInput style={[styles.input, { height: 80 }]} placeholder="Describe your item..." placeholderTextColor="#888" multiline value={description} onChangeText={setDescription} />

                        <Text style={styles.label}>Price</Text>
                        <View style={{ flexDirection: 'row', gap: 10 }}>
                            <TextInput
                                style={[styles.input, { flex: 1 }]}
                                placeholder="Amount"
                                placeholderTextColor="#888"
                                keyboardType="numeric"
                                value={price}
                                onChangeText={setPrice}
                            />
                            <View style={styles.pickerBoxCompact}>
                                <Text>{selectedCurrency?.sign || 'ETB'}</Text>
                            </View>
                        </View>

                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10 }}>
                            <TouchableOpacity onPress={() => setIsFixed(true)} style={[styles.miniChip, isFixed && styles.activeMiniChip]}>
                                <Text style={isFixed ? styles.activeMiniChipText : styles.miniChipText}>Fixed</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => setIsFixed(false)} style={[styles.miniChip, !isFixed && styles.activeMiniChip]}>
                                <Text style={!isFixed ? styles.activeMiniChipText : styles.miniChipText}>Negotiable</Text>
                            </TouchableOpacity>
                        </View>

                        {brandsQuery.data && brandsQuery.data.length > 0 && (
                            <View style={{ marginTop: 15 }}>
                                <Text style={styles.label}>Brand</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
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
                                    style={[styles.chip, selectedLocation?._id === loc._id && styles.activeChip]}
                                    onPress={() => {
                                        setSelectedLocation(loc);
                                        setSelectedSubCity(null);
                                        setSelectedWereda(null);
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
                                            style={[styles.chip, selectedSubCity?._id === sub._id && styles.activeChip]}
                                            onPress={() => {
                                                setSelectedSubCity(sub);
                                                setSelectedWereda(null);
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
                                            style={[styles.chip, selectedWereda?._id === wer._id && styles.activeChip]}
                                            onPress={() => setSelectedWereda(wer)}
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
                        <Text style={styles.label}>Listing Photos</Text>
                        <TouchableOpacity
                            style={styles.uploadBox}
                            onPress={async () => {
                                let result = await ImagePicker.launchImageLibraryAsync({
                                    mediaTypes: ['images'],
                                    allowsEditing: true,
                                    quality: 1,
                                });
                                if (!result.canceled) {
                                    setNewImages([...newImages, result.assets[0]]);
                                }
                            }}
                        >
                            <Ionicons name="camera" size={40} color={THEME_COLOR} />
                            <Text style={{ color: '#666', marginTop: 10 }}>Tap to add more images</Text>
                        </TouchableOpacity>
                        <View style={styles.imageGrid}>
                            {existingImages.map((img, idx) => (
                                <View key={`exist_${idx}`} style={styles.imageWrapper}>
                                    <Image source={{ uri: `${CONFIG.FILE_URL}/${img}` }} style={styles.thumbnail} />
                                    <TouchableOpacity onPress={() => setExistingImages(existingImages.filter((_, i) => i !== idx))} style={styles.removeBtn}>
                                        <Ionicons name="close-circle" size={20} color="red" />
                                    </TouchableOpacity>
                                </View>
                            ))}
                            {newImages.map((img, idx) => (
                                <View key={`new_${idx}`} style={styles.imageWrapper}>
                                    <Image source={{ uri: img.uri }} style={styles.thumbnail} />
                                    <TouchableOpacity onPress={() => setNewImages(newImages.filter((_, i) => i !== idx))} style={styles.removeBtn}>
                                        <Ionicons name="close-circle" size={20} color="red" />
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </View>

                        <Text style={styles.label}>YouTube Video Link (Optional)</Text>
                        <TextInput style={styles.input} placeholder="https://youtube.com/..." placeholderTextColor="#888" value={videoLink} onChangeText={setVideoLink} />
                    </View>
                )}

                {currentStep === 5 && (
                    <View>
                        <Text style={styles.sectionHeader}>Posting Package</Text>
                        {postTypesQuery.data?.map((option) => (
                            <TouchableOpacity
                                key={option._id}
                                style={[styles.packageCard, selectedPostType?._id === option._id && styles.activePackageCard]}
                                onPress={() => setSelectedPostType(option)}
                            >
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.packageName}>{option.name}</Text>
                                    <Text style={styles.packagePrice}>ETB {option.price}</Text>
                                </View>
                                {selectedPostType?._id === option._id && <Ionicons name="checkmark-circle" size={24} color={THEME_COLOR} />}
                            </TouchableOpacity>
                        ))}
                    </View>
                )}
            </ScrollView>


            <View style={styles.footer}>
                {currentStep > 2 && (
                    <TouchableOpacity style={styles.backBtn} onPress={() => setCurrentStep(currentStep - 1)}>
                        <Text style={styles.backBtnText}>Back</Text>
                    </TouchableOpacity>
                )}
                <TouchableOpacity
                    style={[styles.nextBtn, updateProductMutation.isPending && { opacity: 0.6 }]}
                    onPress={handleNext}
                    disabled={updateProductMutation.isPending}
                >
                    {updateProductMutation.isPending ? <ActivityIndicator color="#fff" /> : (
                        <Text style={styles.nextBtnText}>{currentStep === STEPS.length - 1 ? "Update Listing" : "Next"}</Text>
                    )}
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 15, borderBottomWidth: 1, borderBottomColor: '#eee' },
    headerTitle: { fontSize: 18, fontWeight: 'bold' },
    stepperWrapper: { alignItems: 'center', paddingVertical: 15 },
    stepperContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
    stepWrapper: { flexDirection: 'row', alignItems: 'center' },
    stepCircle: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#ddd', justifyContent: 'center', alignItems: 'center', marginRight: 5 },
    activeStepCircle: { backgroundColor: THEME_COLOR },
    stepNumber: { fontSize: 12, color: '#fff' },
    stepLine: { width: 30, height: 2, backgroundColor: '#eee', marginHorizontal: 5 },
    stepTitle: { marginTop: 10, fontSize: 16, fontWeight: '600', color: THEME_COLOR },
    content: { padding: 20 },
    gridContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    serviceCard: { width: '48%', aspectRatio: 1, backgroundColor: '#f9f9f9', borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 15, borderWidth: 2, borderColor: 'transparent' },
    activeCard: { borderColor: THEME_COLOR, backgroundColor: '#FFF5E5' },
    serviceText: { marginTop: 10, fontSize: 16, color: '#666', fontWeight: '500' },
    activeText: { color: THEME_COLOR, fontWeight: 'bold' },
    listItem: { flexDirection: 'row', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderBottomColor: '#eee' },
    activeListItem: { backgroundColor: '#FFF5E5' },
    listText: { fontSize: 16, flex: 1 },
    label: { fontSize: 14, color: '#666', marginBottom: 5, marginTop: 15 },
    labelSmall: { fontSize: 12, color: '#888', marginBottom: 5 },
    input: { backgroundColor: '#f9f9f9', borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, fontSize: 16 },
    pickerBoxCompact: { padding: 12, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, justifyContent: 'center', backgroundColor: '#f9f9f9' },
    sectionHeader: { fontSize: 16, fontWeight: 'bold', marginVertical: 10 },
    chip: { paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f0f0f0', marginRight: 10, marginBottom: 10 },
    activeChip: { backgroundColor: THEME_COLOR },
    chipText: { color: '#333' },
    activeChipText: { color: '#fff', fontWeight: 'bold' },
    uploadBox: { height: 100, borderWidth: 2, borderColor: '#ddd', borderStyle: 'dashed', borderRadius: 12, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fafafa' },
    imageGrid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 20 },
    imageWrapper: { width: 80, height: 80, marginRight: 10, marginBottom: 10 },
    thumbnail: { width: '100%', height: '100%', borderRadius: 8 },
    removeBtn: { position: 'absolute', top: -5, right: -5, backgroundColor: 'white', borderRadius: 10 },
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
});
