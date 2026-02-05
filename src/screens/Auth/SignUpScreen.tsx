import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, StatusBar, Modal, FlatList, ActivityIndicator, Alert,
  KeyboardAvoidingView, Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { useRegister } from '../../api/services/authService';
import { useCategoriesByService, useBrandsByCategory } from '../../api/services/categoryService';
import { formatPhoneNumber } from '../../utils/formatPhoneNumber';

const THEME_COLOR = '#FF8C00';

interface Country {
  code: string;
  name: string;
  dial_code: string;
  flag: string;
}

const COUNTRIES: Country[] = [
  { code: 'ET', name: 'Ethiopia', dial_code: '+251', flag: '🇪🇹' },
  { code: 'US', name: 'United States', dial_code: '+1', flag: '🇺🇸' },
  { code: 'KE', name: 'Kenya', dial_code: '+254', flag: '🇰🇪' },
  { code: 'GB', name: 'United Kingdom', dial_code: '+44', flag: '🇬🇧' },
  { code: 'AE', name: 'UAE', dial_code: '+971', flag: '🇦🇪' },
  { code: 'CN', name: 'China', dial_code: '+86', flag: '🇨🇳' },
];

export default function SignUpScreen() {
  const navigation = useNavigation<any>();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [selectedCountry, setSelectedCountry] = useState<Country>(COUNTRIES[0]);
  const [countryModalVisible, setCountryModalVisible] = useState(false);

  // New Fields
  const [step, setStep] = useState(1);
  const [selectedRole, setSelectedRole] = useState<'Demand Side' | 'Supply Side' | 'Both' | null>(null);

  // Step 2 Fields
  const [machineryList, setMachineryList] = useState<any[]>([]);
  const [legalDocuments, setLegalDocuments] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [selectedBrands, setSelectedBrands] = useState<any[]>([]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showBrandModal, setShowBrandModal] = useState(false);

  const { data: categories } = useCategoriesByService(1);
  const { data: brands } = useBrandsByCategory(selectedCategory?._id);

  const registerMutation = useRegister();

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      setLegalDocuments([...legalDocuments, ...result.assets]);
    }
  };

  const removeImage = (index: number) => {
    setLegalDocuments(legalDocuments.filter((_, i) => i !== index));
  };

  const addMachinery = () => {
    if (selectedCategory) {
      setMachineryList([...machineryList, {
        category: selectedCategory,
        brands: selectedBrands
      }]);
      setSelectedCategory(null);
      setSelectedBrands([]);
    }
  };

  const removeMachinery = (index: number) => {
    setMachineryList(machineryList.filter((_, i) => i !== index));
  };

  const toggleBrand = (brand: any) => {
    if (selectedBrands.some(b => b._id === brand._id)) {
      setSelectedBrands(selectedBrands.filter(b => b._id !== brand._id));
    } else {
      setSelectedBrands([...selectedBrands, brand]);
    }
  };

  const hasBelongingsRole = selectedRole === 'Supply Side' || selectedRole === 'Both';

  const handleRegister = () => {
    if (!firstName || !lastName || !phoneNumber || !password || !selectedRole) {
      Alert.alert('Error', 'Please fill in all required fields.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match.');
      return;
    }

    if (step === 1 && hasBelongingsRole) {
      setStep(2);
      return;
    }

    if (hasBelongingsRole && (machineryList.length === 0 || legalDocuments.length === 0)) {
      Alert.alert('Error', 'Please add machinery and legal documents.');
      return;
    }

    const fullPhoneNumber = `${selectedCountry.dial_code}${phoneNumber.replace(/^0+/, '')}`;
    const formattedPhone = formatPhoneNumber(fullPhoneNumber);

    const payload: any = {
      firstName,
      lastName,
      email,
      phoneNumber: formattedPhone,
      password,
      userType: selectedRole,
    };

    if (machineryList.length > 0) {
      payload.interestedProductArea = JSON.stringify(machineryList.map(item => ({
        category: item.category._id,
        brands: item.brands.map((b: any) => b._id)
      })));
    }

    // Prepare FormData for legalDocuments
    const formData = new FormData();
    Object.keys(payload).forEach(key => {
      formData.append(key, payload[key]);
    });

    legalDocuments.forEach((doc, index) => {
      formData.append('legalDocuments', {
        uri: doc.uri,
        name: doc.fileName || `document_${index}.jpg`,
        type: doc.mimeType || 'image/jpeg',
      } as any);
    });

    registerMutation.mutate(formData, {
      onSuccess: () => {
        Alert.alert('Success', 'Account created! Please login.', [
          { text: 'OK', onPress: () => navigation.navigate('Login') }
        ]);
      },
      onError: (error: any) => {
        const errorMsg = error?.response?.data?.error || error?.message || 'Could not create account';
        Alert.alert('Registration Failed', errorMsg);
      }
    });
  };

  const renderCountryItem = ({ item }: { item: Country }) => (
    <TouchableOpacity
      style={styles.modalItem}
      onPress={() => {
        setSelectedCountry(item);
        setCountryModalVisible(false);
      }}
    >
      <Text style={styles.modalItemFlag}>{item.flag}</Text>
      <Text style={styles.modalItemName}>{item.name} ({item.dial_code})</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <LinearGradient
        colors={['#FFF3E0', '#FFFFFF', '#FFFFFF']}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {step === 1 ? (
              <>
                <Text style={styles.title}>Create Your Account</Text>
                <Text style={styles.subtitle}>Fill in your details</Text>

                <View style={styles.inputContainer}>
                  <Ionicons name="person-outline" size={20} color="#FF8C00" style={styles.icon} />
                  <TextInput
                    placeholder="First Name"
                    placeholderTextColor="#888"
                    style={styles.input}
                    value={firstName}
                    onChangeText={setFirstName}
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Ionicons name="person-outline" size={20} color="#FF8C00" style={styles.icon} />
                  <TextInput
                    placeholder="Last Name"
                    placeholderTextColor="#888"
                    style={styles.input}
                    value={lastName}
                    onChangeText={setLastName}
                  />
                </View>

                <View style={styles.inputContainer}>
                  <TouchableOpacity
                    style={styles.flagContainer}
                    onPress={() => setCountryModalVisible(true)}
                  >
                    <Text style={{ fontSize: 24 }}>{selectedCountry.flag}</Text>
                    <Ionicons name="caret-down" size={12} color="#333" style={{ marginLeft: 4 }} />
                  </TouchableOpacity>
                  <Text style={styles.prefix}>{selectedCountry.dial_code}</Text>
                  <TextInput
                    placeholder="Phone Number"
                    placeholderTextColor="#888"
                    keyboardType="phone-pad"
                    maxLength={15}
                    style={styles.input}
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Ionicons name="mail-outline" size={20} color="#FF8C00" style={styles.icon} />
                  <TextInput
                    placeholder="Email"
                    placeholderTextColor="#888"
                    keyboardType="email-address"
                    style={styles.input}
                    value={email}
                    onChangeText={setEmail}
                  />
                </View>


                <View style={styles.inputContainer}>
                  <Ionicons name="lock-closed-outline" size={20} color="#FF8C00" style={styles.icon} />
                  <TextInput
                    placeholder="Password"
                    placeholderTextColor="#888"
                    secureTextEntry={!showPassword}
                    style={styles.input}
                    value={password}
                    onChangeText={setPassword}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    <Ionicons name={showPassword ? "eye-outline" : "eye-off-outline"} size={20} color="#888" />
                  </TouchableOpacity>
                </View>

                <View style={styles.inputContainer}>
                  <Ionicons name="lock-closed-outline" size={20} color="#FF8C00" style={styles.icon} />
                  <TextInput
                    placeholder="Confirm Password"
                    placeholderTextColor="#888"
                    secureTextEntry={!showConfirm}
                    style={styles.input}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                  />
                  <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)}>
                    <Ionicons name={showConfirm ? "eye-outline" : "eye-off-outline"} size={20} color="#888" />
                  </TouchableOpacity>
                </View>

                <Text style={styles.roleLabel}>I AM A:</Text>
                <View style={styles.roleContainer}>
                  {['Demand Side', 'Supply Side', 'Both'].map((role: any) => (
                    <TouchableOpacity
                      key={role}
                      style={[
                        styles.roleButton,
                        selectedRole === role && styles.selectedRoleButton
                      ]}
                      onPress={() => setSelectedRole(role)}
                    >
                      <Text style={[
                        styles.roleButtonText,
                        selectedRole === role && styles.selectedRoleButtonText
                      ]}>{role}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.termsText}>
                  By registering, you agree to our Terms of Service and Privacy Policy
                </Text>

                <TouchableOpacity
                  style={[styles.btn, registerMutation.isPending && styles.disabledBtn]}
                  onPress={handleRegister}
                  disabled={registerMutation.isPending}
                >
                  {registerMutation.isPending ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.btnText}>
                      {hasBelongingsRole ? "Next Step" : "Register"}
                    </Text>
                  )}
                </TouchableOpacity>
              </>
            ) : (
              <>
                <View style={styles.stepTitleContainer}>
                  <TouchableOpacity onPress={() => setStep(1)} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                  </TouchableOpacity>
                  <Text style={styles.title}>Supplier Assets</Text>
                </View>

                <View style={styles.assetForm}>
                  <TouchableOpacity
                    style={styles.selector}
                    onPress={() => setShowCategoryModal(true)}
                  >
                    <Text style={selectedCategory ? styles.selectorText : styles.selectorPlaceholder}>
                      {selectedCategory ? selectedCategory.name : "Select Machinery Type"}
                    </Text>
                    <Ionicons name="chevron-down" size={20} color="#666" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.selector}
                    onPress={() => setShowBrandModal(true)}
                    disabled={!selectedCategory}
                  >
                    <Text style={selectedBrands.length > 0 ? styles.selectorText : styles.selectorPlaceholder}>
                      {selectedBrands.length > 0
                        ? `${selectedBrands.length} Brand(s) Selected`
                        : "Select Brand(s)"}
                    </Text>
                    <Ionicons name="chevron-down" size={20} color="#666" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.addBtn, !selectedCategory && styles.disabledAddBtn]}
                    onPress={addMachinery}
                    disabled={!selectedCategory}
                  >
                    <Text style={styles.addBtnText}>Add to List</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.listContainer}>
                  {machineryList.map((item, index) => (
                    <View key={index} style={styles.listItem}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.listItemTitle}>{item.category.name}</Text>
                        <Text style={styles.listItemSubtitle}>
                          {item.brands.map((b: any) => b.description).join(', ') || 'No brands'}
                        </Text>
                      </View>
                      <TouchableOpacity onPress={() => removeMachinery(index)}>
                        <Ionicons name="trash-outline" size={20} color="red" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>

                <View style={styles.documentSection}>
                  <View style={styles.docHeader}>
                    <Text style={styles.docTitle}>Legal Documents</Text>
                    <TouchableOpacity style={styles.uploadBtn} onPress={handlePickImage}>
                      <Text style={styles.uploadBtnText}>Upload Files</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.docSubtitle}>Please attach relevant legal documents (Images).</Text>

                  {legalDocuments.map((doc, index) => (
                    <View key={index} style={styles.docItem}>
                      <Text style={styles.docName} numberOfLines={1}>Document {index + 1}</Text>
                      <TouchableOpacity onPress={() => removeImage(index)}>
                        <Ionicons name="close-circle" size={20} color="red" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>

                <TouchableOpacity
                  style={[styles.btn, registerMutation.isPending && styles.disabledBtn, { marginTop: 20 }]}
                  onPress={handleRegister}
                  disabled={registerMutation.isPending}
                >
                  {registerMutation.isPending ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.btnText}>Agree and Register</Text>
                  )}
                </TouchableOpacity>
              </>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {/* --- COUNTRY PICKER MODAL --- */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={countryModalVisible}
        onRequestClose={() => setCountryModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.countryModalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Country</Text>
              <TouchableOpacity onPress={() => setCountryModalVisible(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={COUNTRIES}
              keyExtractor={(item) => item.code}
              renderItem={renderCountryItem}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </View>
      </Modal>

      {/* --- CATEGORY MODAL --- */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showCategoryModal}
        onRequestClose={() => setShowCategoryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.countryModalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Machinery</Text>
              <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={categories}
              keyExtractor={(item) => item._id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => {
                    setSelectedCategory(item);
                    setSelectedBrands([]);
                    setShowCategoryModal(false);
                  }}
                >
                  <Text style={styles.modalItemName}>{item.name}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* --- BRAND MODAL --- */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showBrandModal}
        onRequestClose={() => setShowBrandModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.countryModalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Brands</Text>
              <TouchableOpacity onPress={() => setShowBrandModal(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={brands}
              keyExtractor={(item) => item._id}
              renderItem={({ item }) => {
                const isSelected = selectedBrands.some(b => b._id === item._id);
                return (
                  <TouchableOpacity
                    style={styles.modalItem}
                    onPress={() => toggleBrand(item)}
                  >
                    <Text style={[styles.modalItemName, isSelected && { color: THEME_COLOR, fontWeight: 'bold' }]}>
                      {item.description}
                    </Text>
                    {isSelected && <Ionicons name="checkmark" size={20} color={THEME_COLOR} />}
                  </TouchableOpacity>
                );
              }}
            />
            <TouchableOpacity
              style={[styles.btn, { marginTop: 10 }]}
              onPress={() => setShowBrandModal(false)}
            >
              <Text style={styles.btnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingVertical: 10 },
  scrollContent: { padding: 25 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#111', textAlign: 'center' },
  subtitle: { fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 20, marginTop: 5 },

  inputContainer: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 12,
    paddingHorizontal: 15, paddingVertical: 14,
    marginBottom: 15,
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 3
  },
  flagContainer: { flexDirection: 'row', alignItems: 'center', marginRight: 10 },
  prefix: { fontSize: 16, color: '#333', marginRight: 10, fontWeight: '500' },

  icon: { marginRight: 10 },
  input: { flex: 1, fontSize: 16 },
  inputRow: { flexDirection: 'row', width: '100%' },

  roleLabel: { fontSize: 14, fontWeight: 'bold', color: '#555', marginBottom: 10, marginTop: 10 },
  roleContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  roleButton: {
    flex: 1, paddingVertical: 10, alignItems: 'center',
    borderWidth: 1, borderColor: '#ddd', borderRadius: 8, marginHorizontal: 4
  },
  selectedRoleButton: { borderColor: THEME_COLOR, backgroundColor: '#FFF3E0' },
  roleButtonText: { fontSize: 12, color: '#666', fontWeight: 'bold' },
  selectedRoleButtonText: { color: THEME_COLOR },

  termsText: { textAlign: 'center', color: '#666', fontSize: 13, marginBottom: 20, marginTop: 10 },
  btn: { backgroundColor: THEME_COLOR, padding: 16, borderRadius: 12, alignItems: 'center' },
  disabledBtn: { backgroundColor: '#ccc' },
  btnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },

  stepTitleContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  backButton: { marginRight: 15 },
  assetForm: { backgroundColor: '#f9f9f9', padding: 15, borderRadius: 12, borderStyle: 'dashed', borderWidth: 1, borderColor: '#ccc' },
  selector: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#fff', padding: 12, borderRadius: 8, marginBottom: 10,
    borderWidth: 1, borderColor: '#eee'
  },
  selectorText: { color: '#333', fontSize: 14 },
  selectorPlaceholder: { color: '#999', fontSize: 14 },
  addBtn: { backgroundColor: '#333', padding: 12, borderRadius: 8, alignItems: 'center' },
  disabledAddBtn: { backgroundColor: '#999' },
  addBtnText: { color: '#fff', fontWeight: 'bold' },

  listContainer: { marginTop: 20, minHeight: 100 },
  listItem: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    padding: 12, borderRadius: 10, marginBottom: 8, elevation: 1
  },
  listItemTitle: { fontWeight: 'bold', fontSize: 15 },
  listItemSubtitle: { fontSize: 12, color: '#666' },

  documentSection: { marginTop: 20 },
  docHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  docTitle: { fontWeight: 'bold', fontSize: 16 },
  uploadBtn: { borderWidth: 1, borderColor: THEME_COLOR, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  uploadBtnText: { color: THEME_COLOR, fontSize: 12, fontWeight: 'bold' },
  docSubtitle: { fontSize: 12, color: '#666', marginVertical: 5 },
  docItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#fff', padding: 10, borderRadius: 8, marginTop: 5,
    borderWidth: 1, borderColor: '#eee'
  },
  docName: { fontSize: 13, color: '#333', flex: 1 },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  countryModalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    maxHeight: '80%',
    padding: 20,
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  modalTitle: { fontSize: 18, fontWeight: 'bold' },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalItemFlag: { fontSize: 24, marginRight: 15 },
  modalItemName: { fontSize: 16, color: '#333' },
});
