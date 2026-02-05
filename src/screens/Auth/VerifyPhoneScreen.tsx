import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useConfirmOtp } from '../../api/services/authService';

const THEME_COLOR = '#FF8C00';

export default function VerifyPhoneScreen({ route, navigation }: any) {
    const { phone, verificationId } = route.params;
    const [code, setCode] = useState('');
    const confirmMutation = useConfirmOtp();

    const handleVerify = () => {
        confirmMutation.mutate({ vid: verificationId, phone, code }, {
            onSuccess: () => {
                navigation.navigate('ResetPassword', { phone });
            },
            onError: (err) => alert(err.message)
        });
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Verify Phone</Text>
            <Text style={styles.sub}>Enter the code sent to {phone}</Text>

            <TextInput
                style={styles.input}
                placeholder="Enter Code"
                placeholderTextColor="#888"
                keyboardType="number-pad"
                value={code}
                onChangeText={setCode}
            />

            <TouchableOpacity
                style={styles.btn}
                onPress={handleVerify}
                disabled={confirmMutation.isPending}
            >
                {confirmMutation.isPending ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Verify</Text>}
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, backgroundColor: '#fff', justifyContent: 'center' },
    title: { fontSize: 24, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' },
    sub: { fontSize: 14, color: '#666', marginBottom: 30, textAlign: 'center' },
    input: { backgroundColor: '#f9f9f9', padding: 15, borderRadius: 10, borderWidth: 1, borderColor: '#eee', marginBottom: 20, textAlign: 'center', fontSize: 18, letterSpacing: 5 },
    btn: { backgroundColor: THEME_COLOR, padding: 15, borderRadius: 10, alignItems: 'center' },
    btnText: { color: '#fff', fontWeight: 'bold' }
});
