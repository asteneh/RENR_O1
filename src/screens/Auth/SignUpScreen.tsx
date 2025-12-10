import React, { useState } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, 
  ScrollView, StatusBar 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

const THEME_COLOR = '#FF8C00'; // Green from screenshot

export default function SignUpScreen() {
  const navigation = useNavigation();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <LinearGradient
        colors={['#FFF3E0', '#FFFFFF', '#FFFFFF']}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>Create Your Account</Text>
          <Text style={styles.subtitle}>fill_in_your_details</Text>
        

          {/* Form Fields */}
          <View style={styles.inputContainer}>
            <Ionicons name="person-outline" size={20} color="#FF8C00" style={styles.icon} />
            <TextInput placeholder="First Name" style={styles.input} />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="person-outline" size={20} color="#FF8C00" style={styles.icon} />
            <TextInput placeholder="Last Name" style={styles.input} />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="mail-outline" size={20} color="#FF8C00" style={styles.icon} />
            <TextInput placeholder="Email" keyboardType="email-address" style={styles.input} />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={20} color="#FF8C00" style={styles.icon} />
            <TextInput placeholder="Password" secureTextEntry={!showPassword} style={styles.input} />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Ionicons name={showPassword ? "eye-off" : "eye-off-outline"} size={20} color="#888" />
            </TouchableOpacity>
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={20} color="#FF8C00" style={styles.icon} />
            <TextInput placeholder="Confirm Password" secureTextEntry={!showConfirm} style={styles.input} />
            <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)}>
              <Ionicons name={showConfirm ? "eye-off" : "eye-off-outline"} size={20} color="#888" />
            </TouchableOpacity>
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="business-outline" size={20} color="#FF8C00" style={styles.icon} />
            <TextInput placeholder="City (Optional)" style={styles.input} />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="map-outline" size={20} color="#FF8C00" style={styles.icon} />
            <TextInput placeholder="Street (Optional)" style={styles.input} />
          </View>

          <Text style={styles.termsText}>
            By registering, you agree to our Terms of Service and Privacy Policy
          </Text>

          <TouchableOpacity style={styles.btn}>
            <Text style={styles.btnText}>Register</Text>
          </TouchableOpacity>

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingVertical: 10 },
  scrollContent: { padding: 25 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#111', textAlign: 'center' },
  subtitle: { fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 20, marginTop: 5 },
  registeringText: { textAlign: 'center', fontSize: 16, fontWeight: '500', marginBottom: 25 },
  
  inputContainer: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 12,
    paddingHorizontal: 15, paddingVertical: 14,
    marginBottom: 15,
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 3
  },
  icon: { marginRight: 10 },
  input: { flex: 1, fontSize: 16 },
  
  termsText: { textAlign: 'center', color: '#666', fontSize: 13, marginBottom: 20, marginTop: 10 },
  btn: { backgroundColor: THEME_COLOR, padding: 16, borderRadius: 12, alignItems: 'center' },
  btnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});