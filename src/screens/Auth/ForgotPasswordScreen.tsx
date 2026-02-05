import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useVerifyPhone } from '../../api/services/authService';

const THEME_COLOR = '#FF8C00';

export default function ForgotPasswordScreen({ navigation }: any) {
    const [phone, setPhone] = useState('');
    const verifyMutation = useVerifyPhone();

    const handleSend = () => {
        if (!phone) return alert("Enter valid phone number");
        verifyMutation.mutate(phone, {
            onSuccess: (data) => {
                navigation.navigate('VerifyPhone', {
                    phone,
                    verificationId: data.verificationId
                });
            },
            onError: (err) => alert(err.message)
        });
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Forgot Password</Text>
            <Text style={styles.sub}>Enter your phone number to receive a verification code.</Text>

            <TextInput
                style={styles.input}
                placeholder="Phone Number"
                placeholderTextColor="#888"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
            />

            <TouchableOpacity
                style={styles.btn}
                onPress={handleSend}
                disabled={verifyMutation.isPending}
            >
                {verifyMutation.isPending ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Send Code</Text>}
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, backgroundColor: '#fff', justifyContent: 'center' },
    title: { fontSize: 24, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' },
    sub: { fontSize: 14, color: '#666', marginBottom: 30, textAlign: 'center' },
    input: { backgroundColor: '#f9f9f9', padding: 15, borderRadius: 10, borderWidth: 1, borderColor: '#eee', marginBottom: 20 },
    btn: { backgroundColor: 'black', padding: 15, borderRadius: 10, alignItems: 'center' },
    btnText: { color: '#fff', fontWeight: 'bold' }
});
