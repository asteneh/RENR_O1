import React, { useState, useRef, useEffect } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    ActivityIndicator, KeyboardAvoidingView, Platform, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useConfirmOtp, useGetOtp } from '../../api/services/authService';
import { useNotificationStore } from '../../store/useNotificationStore';
import { formatPhoneNumber } from '../../utils/formatPhoneNumber';

const THEME_COLOR = '#FF8C00';
const CODE_LENGTH = 4;

export default function OtpVerifyRegistrationScreen({ route, navigation }: any) {
    const { phone, verificationId: initialVid } = route.params;

    const [code, setCode] = useState(['', '', '', '']);
    const [verificationId, setVerificationId] = useState(initialVid);
    const [resendCountdown, setResendCountdown] = useState(60);
    const [canResend, setCanResend] = useState(false);

    const inputRefs = useRef<(TextInput | null)[]>([]);
    const shakeAnim = useRef(new Animated.Value(0)).current;

    const confirmMutation = useConfirmOtp();
    const resendMutation = useGetOtp();
    const { showNotification } = useNotificationStore();

    // --- Countdown timer for resend ---
    useEffect(() => {
        if (resendCountdown <= 0) {
            setCanResend(true);
            return;
        }
        const timer = setTimeout(() => setResendCountdown(prev => prev - 1), 1000);
        return () => clearTimeout(timer);
    }, [resendCountdown]);

    // --- Shake animation on wrong code ---
    const triggerShake = () => {
        Animated.sequence([
            Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: 6, duration: 60, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: -6, duration: 60, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
        ]).start();
    };

    // --- OTP box input handler ---
    const handleCodeChange = (value: string, index: number) => {
        const newCode = [...code];
        newCode[index] = value.replace(/[^0-9]/g, '').slice(-1);
        setCode(newCode);

        if (value && index < CODE_LENGTH - 1) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyPress = (e: any, index: number) => {
        if (e.nativeEvent.key === 'Backspace' && !code[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    // --- Verify the entered OTP ---
    const handleVerify = () => {
        const fullCode = code.join('');
        if (fullCode.length < CODE_LENGTH) {
            showNotification('Please enter the full 4-digit code.', 'error');
            triggerShake();
            return;
        }

        confirmMutation.mutate(
            { vid: verificationId, phone: formatPhoneNumber(phone), code: fullCode },
            {
                onSuccess: () => {
                    showNotification('Phone verified! Please log in.', 'success');
                    navigation.reset({
                        index: 0,
                        routes: [{ name: 'Login' }],
                    });
                },
                onError: () => {
                    showNotification('Invalid code. Please try again.', 'error');
                    triggerShake();
                    setCode(['', '', '', '']);
                    inputRefs.current[0]?.focus();
                },
            }
        );
    };

    // --- Resend OTP ---
    const handleResend = () => {
        if (!canResend) return;
        resendMutation.mutate(phone, {
            onSuccess: (data: any) => {
                setVerificationId(data.verificationId);
                setCode(['', '', '', '']);
                setResendCountdown(60);
                setCanResend(false);
                showNotification('A new code has been sent.', 'success');
                inputRefs.current[0]?.focus();
            },
            onError: () => {
                showNotification('Failed to resend code. Please try again.', 'error');
            },
        });
    };

    const fullCode = code.join('');
    const isPending = confirmMutation.isPending;

    return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={{ flex: 1 }}
            >
                <View style={styles.inner}>
                    {/* Back Button */}
                    <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={24} color="#333" />
                    </TouchableOpacity>

                    {/* Icon */}
                    <View style={styles.iconCircle}>
                        <Ionicons name="phone-portrait-outline" size={36} color={THEME_COLOR} />
                    </View>

                    <Text style={styles.title}>Verify Your Phone</Text>
                    <Text style={styles.subtitle}>
                        We sent a {CODE_LENGTH}-digit code to{'\n'}
                        <Text style={styles.phone}>{phone}</Text>
                    </Text>

                    {/* OTP Boxes */}
                    <Animated.View style={[styles.otpRow, { transform: [{ translateX: shakeAnim }] }]}>
                        {code.map((digit, idx) => (
                            <TextInput
                                key={idx}
                                ref={ref => { inputRefs.current[idx] = ref; }}
                                style={[styles.otpBox, digit ? styles.otpBoxFilled : null]}
                                value={digit}
                                onChangeText={val => handleCodeChange(val, idx)}
                                onKeyPress={e => handleKeyPress(e, idx)}
                                keyboardType="number-pad"
                                maxLength={1}
                                textAlign="center"
                                selectTextOnFocus
                                editable={!isPending}
                            />
                        ))}
                    </Animated.View>

                    {/* Verify Button */}
                    <TouchableOpacity
                        style={[styles.btn, (isPending || fullCode.length < CODE_LENGTH) && styles.btnDisabled]}
                        onPress={handleVerify}
                        disabled={isPending || fullCode.length < CODE_LENGTH}
                    >
                        {isPending ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.btnText}>Verify & Activate Account</Text>
                        )}
                    </TouchableOpacity>

                    {/* Resend */}
                    <View style={styles.resendRow}>
                        <Text style={styles.resendLabel}>Didn't receive the code?{'  '}</Text>
                        {resendMutation.isPending ? (
                            <ActivityIndicator size="small" color={THEME_COLOR} />
                        ) : canResend ? (
                            <TouchableOpacity onPress={handleResend}>
                                <Text style={styles.resendLink}>Resend</Text>
                            </TouchableOpacity>
                        ) : (
                            <Text style={styles.countdown}>Resend in {resendCountdown}s</Text>
                        )}
                    </View>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    inner: {
        flex: 1,
        paddingHorizontal: 28,
        paddingTop: 20,
        alignItems: 'center',
    },
    backBtn: {
        alignSelf: 'flex-start',
        marginBottom: 30,
    },
    iconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#FFF3E0',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#111',
        textAlign: 'center',
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 15,
        color: '#666',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 36,
    },
    phone: {
        fontWeight: 'bold',
        color: '#333',
    },
    otpRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 36,
    },
    otpBox: {
        width: 58,
        height: 64,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#E0E0E0',
        backgroundColor: '#F9F9F9',
        fontSize: 26,
        fontWeight: 'bold',
        color: '#111',
        textAlign: 'center',
    },
    otpBoxFilled: {
        borderColor: THEME_COLOR,
        backgroundColor: '#FFF3E0',
    },
    btn: {
        width: '100%',
        backgroundColor: THEME_COLOR,
        paddingVertical: 16,
        borderRadius: 14,
        alignItems: 'center',
        marginBottom: 20,
        shadowColor: THEME_COLOR,
        shadowOpacity: 0.35,
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 8,
        elevation: 5,
    },
    btnDisabled: {
        backgroundColor: '#FFCC99',
        shadowOpacity: 0,
        elevation: 0,
    },
    btnText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    resendRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    resendLabel: {
        color: '#888',
        fontSize: 14,
    },
    resendLink: {
        color: THEME_COLOR,
        fontWeight: 'bold',
        fontSize: 14,
    },
    countdown: {
        color: '#aaa',
        fontSize: 14,
    },
});
