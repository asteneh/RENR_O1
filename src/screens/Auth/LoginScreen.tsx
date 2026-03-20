import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, StatusBar,
  Modal, ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/useAuthStore';
import { useNotificationStore } from '../../store/useNotificationStore';
import { cleanErrorMessage } from '../../utils/errorUtils';
import { useNavigation } from '@react-navigation/native';
import { useLogin, useGetOtp } from '../../api/services/authService';

const THEME_COLOR = '#FF8C00';

export default function LoginScreen() {
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [signinError, setSigninError] = useState<string | null>(null);
  const [showVerify, setShowVerify] = useState(false);

  const { token, user, login: loginState } = useAuthStore();
  const { setUnreadNotifications, incrementUnreadNotifications, showNotification } = useNotificationStore();
  const navigation = useNavigation<any>();
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);

  const loginMutation = useLogin();
  const getOtpMutation = useGetOtp();

  // Helper to handle input change matching the user's regex requirement (optional numbers/plus)
  const handleEmailOrPhoneChange = (text: string) => {
    // The reference strictly allows numbers/plus for "emailOrPhone". 
    // If you want to allow emails too, remove this regex check.
    // Based on user request "apply this logic", we follow the regex:
    if (/^\+?[0-9]*$/.test(text)) {
      setEmailOrPhone(text);
    }
  };

  const handleLogin = () => {
    setSigninError(null);
    setShowVerify(false);

    if (!emailOrPhone || !password) {
      showNotification("Please enter both email/phone and password", "error");
      return;
    }

    loginMutation.mutate({
      emailOrPhone,
      password
    }, {
      onSuccess: (data) => {
        // Update global auth state (persisted)
        // Adjust user object mapping based on response structure
        const user = {
          _id: (data as any).id || (data as any)._id, // Support both formats and satisfy TS
          email: data.email,
          phoneNumber: data.phoneNumber
        };
        loginState(user, data.token);

        showNotification("Welcome back!", "success");
        navigation.navigate('Tabs');
      },
      onError: (error: any) => {
        const msg = cleanErrorMessage(error);
        showNotification(msg, "error");

        const reason = error?.response?.data?.reason;
        if (reason === 'NotVerified') {
          // Set a generic error message for the UI to show the "Verify" button
          setSigninError("Account not verified.");
          setShowVerify(true);
        }
      }
    });
  };

  const handleVerify = () => {
    if (!emailOrPhone) return;

    getOtpMutation.mutate(emailOrPhone, {
      onSuccess: (data) => {
        navigation.navigate('VerifyPhone', {
          verificationId: data?.verificationId,
          phoneNumber: emailOrPhone
        });
      },
      onError: (err: any) => {
        showNotification(cleanErrorMessage(err), 'error');
      }
    });
  };

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
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

            <View style={styles.header}>
              <TouchableOpacity onPress={() => setSettingsModalVisible(true)}>
                <Ionicons name="settings-outline" size={26} color="#444" />
              </TouchableOpacity>
            </View>

            <View style={styles.titleContainer}>
              <Text style={styles.welcomeText}>Sign In</Text>
              <Text style={styles.subText}>Welcome back! Please enter your details.</Text>
            </View>

            <View style={styles.formContainer}>

              {/* Error Alert */}
              {signinError && (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{signinError}</Text>
                  {showVerify && (
                    <TouchableOpacity
                      onPress={handleVerify}
                      disabled={getOtpMutation.isPending}
                      style={styles.verifyBtn}
                    >
                      <Text style={styles.verifyBtnText}>
                        {getOtpMutation.isPending ? 'Sending...' : 'Verify'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}

              <View style={styles.inputWrapper}>
                <Ionicons name="call-outline" size={20} color="#888" style={styles.inputIcon} />
                <TextInput
                  placeholder="Phone Number"
                  placeholderTextColor="#888"
                  style={styles.textInput}
                  value={emailOrPhone}
                  onChangeText={handleEmailOrPhoneChange}
                />
              </View>

              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={20} color="#888" style={styles.inputIcon} />
                <TextInput
                  placeholder="Password"
                  placeholderTextColor="#888"
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

              <TouchableOpacity
                style={styles.forgotBtn}
                onPress={() => navigation.navigate('ForgotPassword')}
              >
                <Text style={styles.forgotText}>Forgot Password?</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.loginBtn, loginMutation.isPending && styles.disabledBtn]}
                onPress={handleLogin}
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.loginBtnText}>Sign In</Text>
                )}
              </TouchableOpacity>

              <View style={styles.footer}>
                <Text style={styles.footerText}>Don't have an account? </Text>
                <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
                  <Text style={styles.signUpText}>Register</Text>
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

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 25, flexGrow: 1, justifyContent: 'center' },

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
  disabledBtn: {
    backgroundColor: '#ccc'
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

  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFEBEE',
    padding: 10,
    borderRadius: 8,
    marginBottom: 20
  },
  errorText: { color: '#D32F2F', flex: 1 },
  verifyBtn: { backgroundColor: '#D32F2F', paddingHorizontal: 15, paddingVertical: 6, borderRadius: 20, marginLeft: 10 },
  verifyBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 12 }
});