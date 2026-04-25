import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, StatusBar, Modal, FlatList, ActivityIndicator,
  KeyboardAvoidingView, Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { useRegister, useGetOtp, useConfirmOtp } from '../../api/services/authService';
import { useCategoriesByService, useBrandsByCategory } from '../../api/services/categoryService';
import { formatPhoneNumber } from '../../utils/formatPhoneNumber';
import { useNotificationStore } from '../../store/useNotificationStore';
import { cleanErrorMessage } from '../../utils/errorUtils';

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

const ROLES = [
  "Akeray (leesor)",
  "Buyer",
  "Seller",
  "Tekeray (lessee)",
  "employee (Operator)",
  "Employer"
];



const MEMBERSHIP_PLANS: any = {
  "Akeray (leesor)": [
    { id: 'basic', title: "Basic", price: 100, features: ["10 items to post/month", "3 Job vacancies/month"] },
    { id: 'gold', title: "Gold", price: 200, features: ["25 items to post/month", "6 Job vacancies/month"] },
    { id: 'premium', title: "Premium", price: 400, features: ["Unlimited items to Post/month", "Unlimited Job vacancies/month"] }
  ],
  "Buyer": [
    { id: 'basic', title: "Basic", price: 50, features: ["10 buying request post/month"] },
    { id: 'gold', title: "Gold", price: 100, features: ["15 buying request post/month"] },
    { id: 'premium', title: "Premium", price: 200, features: ["Unlimited buying request post/month"] }
  ],
  "Seller": [
    { id: 'basic', title: "Basic", price: 100, features: ["10 items to post/month", "3 Job vacancies/month"] },
    { id: 'gold', title: "Gold", price: 200, features: ["30 units per month", "6 Job vacancies/month"] },
    { id: 'premium', title: "Premium", price: 400, features: ["Unlimited items per month", "12 Job vacancies/month"] }
  ],
  "Tekeray (lessee)": [
    { id: 'basic', title: "Basic", price: 100, features: ["10 items request post/month", "3 Job vacancies/month"] },
    { id: 'gold', title: "Gold", price: 200, features: ["15 items request post/month", "6 Job vacancies/month"] },
    { id: 'premium', title: "Premium", price: 400, features: ["Unlimited items to Post/month", "12 Job vacancies/month"] }
  ],
  "employee (Operator)": [
    { id: 'basic', title: "Basic", price: 50, features: ["Standard operator status"] }
  ]
};

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
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const [selectedCountry, setSelectedCountry] = useState<Country>(COUNTRIES[0]);
  const [countryModalVisible, setCountryModalVisible] = useState(false);

  // New Fields
  const [step, setStep] = useState(1);
  const [otpCode, setOtpCode] = useState(['', '', '', '']);
  const [verificationId, setVerificationId] = useState('');
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);

  // TODO: Change to string[] when backend supports multiple roles
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [showRoleModal, setShowRoleModal] = useState(false);

  // Step 2 Fields (Now Step 4)
  const [machineryList, setMachineryList] = useState<{ category: any; brand: any; }[]>([]);
  const [legalDocuments, setLegalDocuments] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [selectedBrand, setSelectedBrand] = useState<any>(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showBrandModal, setShowBrandModal] = useState(false);

  // Membership Selection (Now Step 5)
  const [selectedMembership, setSelectedMembership] = useState<any>(null);
  const [postThroughGadal, setPostThroughGadal] = useState(false);

  // Error States
  const [errors, setErrors] = useState<any>({});

  const { data: categories } = useCategoriesByService(1);
  const { data: brands } = useBrandsByCategory(selectedCategory?._id);

  const registerMutation = useRegister();
  const otpMutation = useGetOtp();
  const confirmMutation = useConfirmOtp();

  const validateFirstName = (val: string) => {
    if (!val.trim()) return "First name is required";
    if (!/^\S+$/.test(val.trim())) return "First name should be a single word";
    return "";
  };

  const validateLastName = (val: string) => {
    if (!val.trim()) return "Last name is required";
    if (!/^\S+$/.test(val.trim())) return "Last name should be a single word";
    return "";
  };

  const validateEmail = (val: string) => {
    if (!val) return ""; // Email is optional in some contexts, but if provided, must be valid
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(val)) return "Please enter a valid email address";
    return "";
  };

  const validatePhone = (val: string) => {
    if (!val.trim()) return "Phone number is required";
    const phoneRegex = /^\d{9,10}$/;
    if (!phoneRegex.test(val.replace(/\s/g, ''))) return "Please enter a valid phone (9-10 digits)";
    return "";
  };

  const validatePassword = (val: string) => {
    if (!val) return "Password is required";
    if (val.length < 6) return "Password must be at least 6 characters";
    return "";
  };

  const validateConfirmPassword = (val: string, pass: string) => {
    if (val !== pass) return "Passwords do not match";
    return "";
  };

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
    if (selectedCategory && selectedBrand) {
      setMachineryList([...machineryList, {
        category: selectedCategory,
        brand: selectedBrand,
      }]);
      setSelectedCategory(null);
      setSelectedBrand(null);
    } else {
      showNotification('Please select both category and brand.', 'error');
    }
  };

  const removeMachinery = (index: number) => {
    const newList = [...machineryList];
    newList.splice(index, 1);
    setMachineryList(newList);
  };

  const hasBelongingsRole = selectedRole === 'Seller' || selectedRole === 'Akeray (leesor)';

  const { showNotification } = useNotificationStore();

  const handleVerifyPhone = () => {
    const currentErrors = {
      firstName: validateFirstName(firstName),
      lastName: validateLastName(lastName),
      phone: validatePhone(phoneNumber),
    };
    setErrors(currentErrors);

    if (currentErrors.firstName || currentErrors.lastName || currentErrors.phone) {
      showNotification('Please fill in your name and phone correctly.', 'error');
      return;
    }

    const fullPhone = `${selectedCountry.dial_code}${phoneNumber.replace(/^0+/, '')}`;
    otpMutation.mutate(fullPhone, {
      onSuccess: (data: any) => {
        setVerificationId(data.verificationId);
        setStep(2);
        showNotification('Verification code sent!', 'success');
      },
      onError: (error: any) => {
        showNotification(cleanErrorMessage(error), 'error');
      }
    });
  };

  const handleConfirmOtp = () => {
    const fullCode = otpCode.join('');
    if (fullCode.length < 4) {
      showNotification('Please enter the 4-digit code.', 'error');
      return;
    }

    const fullPhone = `${selectedCountry.dial_code}${phoneNumber.replace(/^0+/, '')}`;
    confirmMutation.mutate({
      vid: verificationId,
      phone: formatPhoneNumber(fullPhone),
      code: fullCode
    }, {
      onSuccess: () => {
        setIsPhoneVerified(true);
        setStep(3);
        showNotification('Phone verified successfully!', 'success');
      },
      onError: (error: any) => {
        showNotification('Invalid verification code.', 'error');
      }
    });
  };

  const handleRegister = () => {
    if (step === 1) {
      handleVerifyPhone();
      return;
    }

    if (step === 2) {
      handleConfirmOtp();
      return;
    }

    if (step === 3) {
      const currentErrors = {
        email: validateEmail(email),
        password: validatePassword(password),
        confirmPassword: validateConfirmPassword(confirmPassword, password),
      };
      setErrors(currentErrors);

      if (currentErrors.email || currentErrors.password || currentErrors.confirmPassword) {
        showNotification('Please fix the errors.', 'error');
        return;
      }

      if (!selectedRole) {
        showNotification('Please select a role.', 'error');
        return;
      }

      if (!agreedToTerms) {
        showNotification('Please agree to the Terms and Privacy Policy.', 'error');
        return;
      }

      if (hasBelongingsRole) {
        setStep(4);
      } else {
        setStep(5);
      }
      return;
    }

    if (step === 4) {
      if (machineryList.length === 0 || legalDocuments.length === 0) {
        showNotification('Please add machinery and legal documents.', 'error');
        return;
      }
      setStep(5);
      return;
    }

    // Step 5 - Final Submit
    if (selectedRole !== 'Employer' && !postThroughGadal && !selectedMembership) {
      showNotification('Please choose a membership or select "Process Through Gadal".', 'error');
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
        brands: [item.brand._id]
      })));
    }

    if (selectedMembership) {
      payload.membershipType = selectedMembership.id;
      payload.membershipTitle = selectedMembership.title;
    }
    payload.postThroughGadal = postThroughGadal;

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
        showNotification('Account created successfully!', 'success');
        navigation.navigate('Login');
      },
      onError: (error: any) => {
        showNotification(cleanErrorMessage(error), 'error');
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
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
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
                <Text style={styles.subtitle}>Enter your name and phone to verify</Text>

                <View style={styles.inputContainer}>
                  <Ionicons name="person-outline" size={20} color="#FF8C00" style={styles.icon} />
                  <TextInput
                    placeholder="First Name"
                    placeholderTextColor="#888"
                    style={styles.input}
                    value={firstName}
                    onChangeText={(val) => {
                      setFirstName(val);
                      setErrors({ ...errors, firstName: validateFirstName(val) });
                    }}
                  />
                </View>
                {errors.firstName ? <Text style={styles.errorText}>{errors.firstName}</Text> : null}

                <View style={styles.inputContainer}>
                  <Ionicons name="person-outline" size={20} color="#FF8C00" style={styles.icon} />
                  <TextInput
                    placeholder="Last Name"
                    placeholderTextColor="#888"
                    style={styles.input}
                    value={lastName}
                    onChangeText={(val) => {
                      setLastName(val);
                      setErrors({ ...errors, lastName: validateLastName(val) });
                    }}
                  />
                </View>
                {errors.lastName ? <Text style={styles.errorText}>{errors.lastName}</Text> : null}

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
                    onChangeText={(val) => {
                      setPhoneNumber(val);
                      setErrors({ ...errors, phone: validatePhone(val) });
                    }}
                  />
                </View>
                {errors.phone ? <Text style={styles.errorText}>{errors.phone}</Text> : null}

                <TouchableOpacity
                  style={[styles.btn, otpMutation.isPending && styles.disabledBtn]}
                  onPress={handleRegister}
                  disabled={otpMutation.isPending}
                >
                  {otpMutation.isPending ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.btnText}>Verify Phone</Text>
                  )}
                </TouchableOpacity>
              </>
            ) : step === 2 ? (
              <>
                <View style={styles.stepTitleContainer}>
                  <TouchableOpacity onPress={() => setStep(1)} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                  </TouchableOpacity>
                  <Text style={styles.title}>Verify OTP</Text>
                </View>
                <Text style={styles.subtitle}>Enter the 4-digit code sent to {selectedCountry.dial_code}{phoneNumber}</Text>

                <View style={styles.otpRow}>
                  {otpCode.map((digit, idx) => (
                    <TextInput
                      key={idx}
                      style={styles.otpBox}
                      value={digit}
                      onChangeText={(val) => {
                        const newOtp = [...otpCode];
                        newOtp[idx] = val.replace(/[^0-9]/g, '').slice(-1);
                        setOtpCode(newOtp);
                      }}
                      keyboardType="number-pad"
                      maxLength={1}
                      textAlign="center"
                    />
                  ))}
                </View>

                <TouchableOpacity
                  style={[styles.btn, confirmMutation.isPending && styles.disabledBtn]}
                  onPress={handleConfirmOtp}
                  disabled={confirmMutation.isPending}
                >
                  {confirmMutation.isPending ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.btnText}>Verify & Continue</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.resendBtn}
                  onPress={handleVerifyPhone}
                  disabled={otpMutation.isPending}
                >
                  <Text style={styles.resendBtnText}>Resend Code</Text>
                </TouchableOpacity>
              </>
            ) : step === 3 ? (
              <>
                <View style={styles.stepTitleContainer}>
                  <TouchableOpacity onPress={() => setStep(1)} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                  </TouchableOpacity>
                  <Text style={styles.title}>Account Details</Text>
                </View>

                <View style={styles.inputContainer}>
                  <Ionicons name="mail-outline" size={20} color="#FF8C00" style={styles.icon} />
                  <TextInput
                    placeholder="Email"
                    placeholderTextColor="#888"
                    keyboardType="email-address"
                    style={styles.input}
                    value={email}
                    onChangeText={(val) => {
                      setEmail(val);
                      setErrors({ ...errors, email: validateEmail(val) });
                    }}
                  />
                </View>
                {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}

                <View style={styles.inputContainer}>
                  <Ionicons name="lock-closed-outline" size={20} color="#FF8C00" style={styles.icon} />
                  <TextInput
                    placeholder="Password"
                    placeholderTextColor="#888"
                    secureTextEntry={!showPassword}
                    style={styles.input}
                    value={password}
                    onChangeText={(val) => {
                      setPassword(val);
                      setErrors({
                        ...errors,
                        password: validatePassword(val),
                        confirmPassword: validateConfirmPassword(confirmPassword, val)
                      });
                    }}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    <Ionicons name={showPassword ? "eye-outline" : "eye-off-outline"} size={20} color="#888" />
                  </TouchableOpacity>
                </View>
                {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}

                <View style={styles.inputContainer}>
                  <Ionicons name="lock-closed-outline" size={20} color="#FF8C00" style={styles.icon} />
                  <TextInput
                    placeholder="Confirm Password"
                    placeholderTextColor="#888"
                    secureTextEntry={!showConfirm}
                    style={styles.input}
                    value={confirmPassword}
                    onChangeText={(val) => {
                      setConfirmPassword(val);
                      setErrors({ ...errors, confirmPassword: validateConfirmPassword(val, password) });
                    }}
                  />
                  <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)}>
                    <Ionicons name={showConfirm ? "eye-outline" : "eye-off-outline"} size={20} color="#888" />
                  </TouchableOpacity>
                </View>
                {errors.confirmPassword ? <Text style={styles.errorText}>{errors.confirmPassword}</Text> : null}

                <Text style={styles.roleLabel}>I AM A:</Text>
                <TouchableOpacity
                  style={styles.selector}
                  onPress={() => setShowRoleModal(true)}
                >
                  <Text style={selectedRole ? styles.selectorText : styles.selectorPlaceholder}>
                    {selectedRole || 'Select your role'}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color="#666" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.checkboxContainer}
                  onPress={() => setAgreedToTerms(!agreedToTerms)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.checkbox, agreedToTerms && styles.checkboxChecked]}>
                    {agreedToTerms && <Ionicons name="checkmark" size={16} color="#fff" />}
                  </View>
                  <Text style={styles.termsText}>
                    I agree to the{' '}
                    <Text style={styles.termsLink} onPress={() => navigation.navigate('TermsAndPrivacy')}>
                      Terms of Service
                    </Text>{' '}
                    and{' '}
                    <Text style={styles.termsLink} onPress={() => navigation.navigate('TermsAndPrivacy')}>
                      Privacy Policy
                    </Text>
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.btn]}
                  onPress={handleRegister}
                >
                  <Text style={styles.btnText}>
                    {hasBelongingsRole ? "Next Step" : "Complete Registration"}
                  </Text>
                </TouchableOpacity>
              </>
            ) : step === 4 ? (
              <>
                <View style={styles.stepTitleContainer}>
                  <TouchableOpacity onPress={() => setStep(3)} style={styles.backButton}>
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
                    <Text style={selectedBrand ? styles.selectorText : styles.selectorPlaceholder}>
                      {selectedBrand
                        ? selectedBrand.description
                        : "Select Brand"}
                    </Text>
                    <Ionicons name="chevron-down" size={20} color="#666" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.addBtn, (!selectedCategory || !selectedBrand) && styles.disabledAddBtn]}
                    onPress={addMachinery}
                    disabled={!selectedCategory || !selectedBrand}
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
                          {item.brand.description}
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
                  style={[styles.btn, { marginTop: 20 }]}
                  onPress={handleRegister}
                >
                  <Text style={styles.btnText}>Next: Membership</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <View style={styles.stepTitleContainer}>
                  <TouchableOpacity onPress={() => setStep(hasBelongingsRole ? 4 : 3)} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                  </TouchableOpacity>
                  <Text style={styles.title}>Membership Plan</Text>
                </View>

                {selectedRole && selectedRole !== 'Employer' && (
                  <TouchableOpacity
                    style={[styles.gadalBtn, postThroughGadal && styles.activeGadalBtn]}
                    onPress={() => {
                      setPostThroughGadal(!postThroughGadal);
                      setSelectedMembership(null);
                    }}
                  >
                    <Ionicons name={postThroughGadal ? "checkbox" : "square-outline"} size={24} color={postThroughGadal ? "#fff" : THEME_COLOR} />
                    <Text style={[styles.gadalBtnText, postThroughGadal && { color: '#fff' }]}>Process Through Gadal</Text>
                  </TouchableOpacity>
                )}

                {(!postThroughGadal && MEMBERSHIP_PLANS[selectedRole || '']) ? (
                  <View style={styles.plansContainer}>
                    {MEMBERSHIP_PLANS[selectedRole || ''].map((plan: any) => (
                      <TouchableOpacity
                        key={plan.id}
                        style={[styles.planCard, selectedMembership?.id === plan.id && styles.activePlanCard]}
                        onPress={() => setSelectedMembership(plan)}
                      >
                        <View style={styles.planHeader}>
                          <Text style={styles.planTitle}>{plan.title}</Text>
                          <Text style={styles.planPrice}>{plan.price} Birr</Text>
                        </View>
                        {plan.features.map((feature: string, idx: number) => (
                          <View key={idx} style={styles.featureRow}>
                            <Ionicons name="checkmark-circle" size={16} color={THEME_COLOR} />
                            <Text style={styles.featureText}>{feature}</Text>
                          </View>
                        ))}
                      </TouchableOpacity>
                    ))}
                  </View>
                ) : !postThroughGadal && selectedRole !== 'Employer' && (
                  <Text style={styles.noPlanText}>Please select a role first to see plans.</Text>
                )}

                {selectedRole === 'Employer' && (
                  <Text style={styles.noPlanText}>Employers can register directly without a specific membership plan at this stage.</Text>
                )}

                <TouchableOpacity
                  style={[styles.btn, registerMutation.isPending && styles.disabledBtn, { marginTop: 20 }]}
                  onPress={handleRegister}
                  disabled={registerMutation.isPending}
                >
                  {registerMutation.isPending ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.btnText}>Complete Registration</Text>
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
                    setSelectedBrand(null); // Clear selected brand when category changes
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
                const isSelected = selectedBrand?._id === item._id;
                return (
                  <TouchableOpacity
                    key={item._id}
                    style={styles.modalItem}
                    onPress={() => {
                      setSelectedBrand(item);
                      setShowBrandModal(false);
                    }}
                  >
                    <Ionicons
                      name={isSelected ? "radio-button-on" : "radio-button-off"}
                      size={20}
                      color={isSelected ? THEME_COLOR : "#666"}
                    />
                    <Text style={[styles.modalItemName, isSelected && { color: THEME_COLOR, fontWeight: 'bold' }]}>
                      {item.description}
                    </Text>
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </View>
      </Modal>

      {/* --- ROLE PICKER MODAL --- */}
      {/* TODO: Update to multi-select when backend supports string[] for userType */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showRoleModal}
        onRequestClose={() => setShowRoleModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.countryModalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Role</Text>
              <TouchableOpacity onPress={() => setShowRoleModal(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={ROLES}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => {
                    setSelectedRole(item);
                    setShowRoleModal(false);
                  }}
                >
                  <Text style={[styles.modalItemName, selectedRole === item && { color: THEME_COLOR, fontWeight: 'bold' }]}>
                    {item}
                  </Text>
                  {selectedRole === item && <Ionicons name="checkmark" size={20} color={THEME_COLOR} />}
                </TouchableOpacity>
              )}
            />
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
  errorText: { color: 'red', fontSize: 12, marginTop: -10, marginBottom: 10, marginLeft: 5 },
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

  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 10,
    paddingHorizontal: 5
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: THEME_COLOR,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  checkboxChecked: {
    backgroundColor: THEME_COLOR,
  },
  termsText: { flex: 1, color: '#666', fontSize: 13 },
  termsLink: { color: THEME_COLOR, fontWeight: 'bold', textDecorationLine: 'underline' },
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

  plansContainer: { marginTop: 10 },
  planCard: {
    backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 15,
    borderWidth: 2, borderColor: '#eee', elevation: 2
  },
  activePlanCard: { borderColor: THEME_COLOR, backgroundColor: '#FFF3E0' },
  planHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  planTitle: { fontSize: 18, fontWeight: 'bold', color: '#222' },
  planPrice: { fontSize: 16, fontWeight: 'bold', color: THEME_COLOR },
  featureRow: { flexDirection: 'row', alignItems: 'center', marginTop: 5 },
  featureText: { fontSize: 14, color: '#666', marginLeft: 8 },
  noPlanText: { textAlign: 'center', color: '#888', marginTop: 40, fontSize: 16 },

  gadalBtn: {
    flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: 12,
    borderWidth: 2, borderColor: THEME_COLOR, marginBottom: 20, backgroundColor: '#fff'
  },
  activeGadalBtn: { backgroundColor: THEME_COLOR },
  gadalBtnText: { fontSize: 16, fontWeight: 'bold', color: THEME_COLOR, marginLeft: 10 },

  // Multi-role selector
  selectedRolesRow: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10, marginBottom: 4,
  },
  roleChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#FFF5E6', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 6,
    borderWidth: 1, borderColor: THEME_COLOR,
  },
  roleChipText: { fontSize: 13, color: THEME_COLOR, fontWeight: '600' },

  // Done button in role modal
  roleDoneBtn: {
    backgroundColor: THEME_COLOR, marginHorizontal: 20, marginVertical: 16,
    paddingVertical: 14, borderRadius: 12, alignItems: 'center',
  },
  roleDoneBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },

  // OTP Styles
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 30,
    marginTop: 20,
  },
  otpBox: {
    width: 60,
    height: 70,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    backgroundColor: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  resendBtn: {
    marginTop: 20,
    alignItems: 'center',
  },
  resendBtnText: {
    color: THEME_COLOR,
    fontWeight: 'bold',
    fontSize: 16,
  },
});
