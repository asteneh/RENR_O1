import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useResetPassword } from '../../api/services/authService';

const THEME_COLOR = '#FF8C00';

export default function ResetPasswordScreen({ route, navigation }: any) {
    const { phone } = route.params;
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const resetMutation = useResetPassword();

    const handleReset = () => {
        if (password !== confirmPassword) return alert("Passwords do not match");

        resetMutation.mutate({ phone, pass: password }, {
            onSuccess: () => {
                alert("Password Reset Successful. Please Login.");
                navigation.navigate('Login');
            },
            onError: (err) => alert(err.message)
        });
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Reset Password</Text>
            <Text style={styles.sub}>Enter your new password.</Text>

            <TextInput
                style={styles.input}
                placeholder="New Password"
                placeholderTextColor="#888"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
            />
            <TextInput
                style={styles.input}
                placeholder="Confirm Password"
                placeholderTextColor="#888"
                secureTextEntry
                value={confirmPassword}
                onChangeText={setConfirmPassword}
            />

            <TouchableOpacity
                style={styles.btn}
                onPress={handleReset}
                disabled={resetMutation.isPending}
            >
                {resetMutation.isPending ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Reset Password</Text>}
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, backgroundColor: '#fff', justifyContent: 'center' },
    title: { fontSize: 24, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' },
    sub: { fontSize: 14, color: '#666', marginBottom: 30, textAlign: 'center' },
    input: { backgroundColor: '#f9f9f9', padding: 15, borderRadius: 10, borderWidth: 1, borderColor: '#eee', marginBottom: 15 },
    btn: { backgroundColor: 'black', padding: 15, borderRadius: 10, alignItems: 'center' },
    btnText: { color: '#fff', fontWeight: 'bold' }
});
