import React, { useState } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, 
  KeyboardAvoidingView, Platform, ScrollView, StatusBar, 
  Modal, FlatList
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/useAuthStore'; 
import { useNavigation } from '@react-navigation/native';
const THEME_COLOR = '#FF8C00'; 

// 1. Define the Country Interface
interface Country {
  code: string;
  name: string;
  dial_code: string;
  flag: string;
}

// 2. Apply the interface to the data array
const COUNTRIES: Country[] = [
  { code: 'ET', name: 'Ethiopia', dial_code: '+251', flag: '🇪🇹' },
  { code: 'US', name: 'United States', dial_code: '+1', flag: '🇺🇸' },
  { code: 'KE', name: 'Kenya', dial_code: '+254', flag: '🇰🇪' },
  { code: 'GB', name: 'United Kingdom', dial_code: '+44', flag: '🇬🇧' },
  { code: 'AE', name: 'UAE', dial_code: '+971', flag: '🇦🇪' },
  { code: 'CN', name: 'China', dial_code: '+86', flag: '🇨🇳' },
];

export default function LoginScreen() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigation = useNavigation<any>();
  // 3. Type the state explicitly
  const [selectedCountry, setSelectedCountry] = useState<Country>(COUNTRIES[0]);
  const [countryModalVisible, setCountryModalVisible] = useState(false);
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);

  const login = useAuthStore((state) => state.login);
  // 4. Fix the error by typing the prop: { item: Country }
  const handleLogin = () => {
    // Perform validation here...
    login(); // <--- Updates state, Navigator switches to Profile
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
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            
            <View style={styles.header}>
              <TouchableOpacity onPress={() => setSettingsModalVisible(true)}>
                <Ionicons name="settings-outline" size={26} color="#444" />
              </TouchableOpacity>
            </View>

            <View style={styles.titleContainer}>
              <Text style={styles.welcomeText}>Welcome Back!</Text>
              <Text style={styles.subText}>Sign in to your account to continue</Text>
            </View>

            <View style={styles.formContainer}>

              <View style={styles.inputWrapper}>
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
                  keyboardType="phone-pad"
                  style={styles.textInput}
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  maxLength={15}
                />
              </View>

              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={20} color="#888" style={styles.inputIcon} />
                <TextInput 
                  placeholder="Password"
                  secureTextEntry={!showPassword}
                  style={styles.textInput}
                  value={password}
                  onChangeText={setPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons 
                    name={showPassword ? "eye-off-outline" : "eye-outline"} 
                    size={20} 
                    color="#888" 
                  />
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.forgotBtn}>
                <Text style={styles.forgotText}>Forgot Password?</Text>
              </TouchableOpacity>

             <TouchableOpacity style={styles.loginBtn} onPress={handleLogin}>
                <Text style={styles.loginBtnText}>Sign In</Text>
              </TouchableOpacity>

             <View style={styles.footer}>
                <Text style={styles.footerText}>Don't have an account? </Text>
                
                {/* --- NAVIGATE TO SIGN UP --- */}
                <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
                  <Text style={styles.signUpText}>Sign Up</Text>
                </TouchableOpacity>
              </View>

            </View>

          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {/* --- SETTINGS MODAL --- */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={settingsModalVisible}
        onRequestClose={() => setSettingsModalVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setSettingsModalVisible(false)}
        >
          <View style={styles.settingsBox}>
            <Text style={styles.settingsTitle}>Settings</Text>
            
            <TouchableOpacity style={styles.settingOption}>
              <View style={[styles.settingIconBox, { backgroundColor: '#E3F2FD' }]}>
                <Ionicons name="color-palette-outline" size={20} color="#1565C0" />
              </View>
              <Text style={styles.settingText}>Theme</Text>
              <Ionicons name="chevron-forward" size={18} color="#ccc" />
            </TouchableOpacity>

            <View style={styles.separator} />

            <TouchableOpacity style={styles.settingOption}>
              <View style={[styles.settingIconBox, { backgroundColor: '#E8F5E9' }]}>
                <Ionicons name="language-outline" size={20} color="#2E7D32" />
              </View>
              <Text style={styles.settingText}>Language</Text>
              <Ionicons name="chevron-forward" size={18} color="#ccc" />
            </TouchableOpacity>

            <View style={styles.separator} />

            <TouchableOpacity style={styles.settingOption}>
              <View style={[styles.settingIconBox, { backgroundColor: '#FFF3E0' }]}>
                <Ionicons name="information-circle-outline" size={20} color="#EF6C00" />
              </View>
              <Text style={styles.settingText}>About Us</Text>
              <Ionicons name="chevron-forward" size={18} color="#ccc" />
            </TouchableOpacity>

          </View>
        </TouchableOpacity>
      </Modal>

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

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 25, flexGrow: 1 },
  
  header: { alignItems: 'flex-end', marginBottom: 20 },
  
  titleContainer: { alignItems: 'center', marginBottom: 40 },
  welcomeText: { fontSize: 28, fontWeight: 'bold', color: '#222', marginBottom: 10 },
  subText: { fontSize: 16, color: '#666' },

  formContainer: { width: '100%' },

  inputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 15,
    paddingHorizontal: 15,
    paddingVertical: 14,
    marginBottom: 20,
    elevation: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 5,
  },
  
  flagContainer: { flexDirection: 'row', alignItems: 'center', marginRight: 10 },
  prefix: { fontSize: 16, color: '#333', marginRight: 10, fontWeight: '500' },

  inputIcon: { marginRight: 10 },
  textInput: { flex: 1, fontSize: 16, color: '#333' },

  forgotBtn: { alignSelf: 'flex-end', marginBottom: 30 },
  forgotText: { color: '#444', fontWeight: '500' },

  loginBtn: {
    backgroundColor: THEME_COLOR, 
    borderRadius: 15,
    paddingVertical: 18,
    alignItems: 'center',
    marginBottom: 30,
    elevation: 4
  },
  loginBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },

  footer: { flexDirection: 'row', justifyContent: 'center' },
  footerText: { color: '#666', fontSize: 15 },
  signUpText: { color: THEME_COLOR, fontWeight: 'bold', fontSize: 15 },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end', 
  },

  settingsBox: {
    backgroundColor: '#fff',
    width: '70%',
    alignSelf: 'center',
    marginTop: 'auto', 
    marginBottom: 'auto',
    borderRadius: 20,
    padding: 20,
    elevation: 10,
  },
  settingsTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, color: '#333' },
  settingOption: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  settingIconBox: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  settingText: { flex: 1, fontSize: 16, color: '#333', fontWeight: '500' },
  separator: { height: 1, backgroundColor: '#f0f0f0' },

  countryModalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    height: '50%',
    padding: 20,
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  modalTitle: { fontSize: 18, fontWeight: 'bold' },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalItemFlag: { fontSize: 24, marginRight: 15 },
  modalItemName: { fontSize: 16, color: '#333' },
});