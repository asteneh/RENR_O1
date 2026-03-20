import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TextInput,
    TouchableOpacity, ActivityIndicator, Image
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { useCategoriesByService } from '../../api/services/categoryService';
import { useRegister } from '../../api/services/authService';
import { useApplyToJobMutation } from '../../api/services/jobService';
import { useNotificationStore } from '../../store/useNotificationStore';
import { cleanErrorMessage } from '../../utils/errorUtils';

const THEME_COLOR = '#FF8C00';
const EXPERIENCE_OPTIONS = [
    { label: 'Less than 1 year', value: '0-1' },
    { label: '1 - 3 years', value: '1-3' },
    { label: '3 - 5 years', value: '3-5' },
    { label: 'More than 5 years', value: '5+' },
];

export default function OperatorRegistrationScreen() {
    const navigation = useNavigation<any>();
    const insets = useSafeAreaInsets();
    const route = useRoute<any>();
    const { showNotification } = useNotificationStore();
    const jobId = route.params?.jobId;

    const [activeStep, setActiveStep] = useState(0);
    const steps = ['Details', 'Experience', 'Complete'];

    // Form State
    const [form, setForm] = useState({
        firstName: '',
        lastName: '',
        phone: '',
        email: '',
        password: '',
        confirmPassword: '',
        experience: '',
        machineTypes: [] as string[],
        licenseFiles: [] as any[], // Picked images/files
        agreedToTerms: false,
    });

    const [passwordsMatch, setPasswordsMatch] = useState(true);

    const { data: machineries, isLoading: categoriesLoading } = useCategoriesByService(1);
    const registerMutation = useRegister();
    const applyMutation = useApplyToJobMutation();

    useEffect(() => {
        if (form.password && form.confirmPassword) {
            setPasswordsMatch(form.password === form.confirmPassword);
        }
    }, [form.password, form.confirmPassword]);

    const pickDocument = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: 'images',
            allowsMultipleSelection: true,
            quality: 0.8,
        });

        if (!result.canceled) {
            setForm({ ...form, licenseFiles: [...form.licenseFiles, ...result.assets] });
        }
    };

    const toggleMachine = (id: string) => {
        const next = form.machineTypes.includes(id)
            ? form.machineTypes.filter(m => m !== id)
            : [...form.machineTypes, id];
        setForm({ ...form, machineTypes: next });
    };

    const validateStep = () => {
        if (activeStep === 0) {
            if (!form.firstName || !form.lastName || !form.phone || !form.password) {
                showNotification("Please fill in all required fields.", "error");
                return false;
            }
            if (!form.agreedToTerms) {
                showNotification("Please agree to the Terms of Service and Privacy Policy.", "error");
                return false;
            }
            if (!passwordsMatch) {
                showNotification("Passwords do not match.", "error");
                return false;
            }
            return true;
        } else if (activeStep === 1) {
            if (!form.experience) {
                showNotification("Please select your years of experience.", "error");
                return false;
            }
            if (form.machineTypes.length === 0) {
                showNotification("Please select at least one machine type.", "error");
                return false;
            }
            return true;
        }
        return true;
    };

    const handleNext = () => {
        if (validateStep()) {
            setActiveStep(prev => prev + 1);
        }
    };

    const handleSubmit = async () => {
        if (!validateStep()) return;

        const formData = new FormData();
        formData.append('firstName', form.firstName);
        formData.append('lastName', form.lastName);
        formData.append('phoneNumber', form.phone);
        formData.append('password', form.password);
        if (form.email) formData.append('email', form.email);
        formData.append('experience', form.experience);
        formData.append('machinesYouCanOperate', JSON.stringify(form.machineTypes));
        formData.append('userType', 'Operator');

        form.licenseFiles.forEach((file, index) => {
            const uri = file.uri;
            const name = uri.split('/').pop() || `license_${index}.jpg`;
            const type = 'image/jpeg';
            formData.append('legalDocuments', { uri, name, type } as any);
        });

        try {
            const res = await registerMutation.mutateAsync(formData);
            if (jobId && res.id) {
                await applyMutation.mutateAsync({ jobId, userId: res.id });
            }
            setActiveStep(2);
        } catch (error: any) {
            showNotification(cleanErrorMessage(error), "error");
        }
    };

    const renderStepContent = () => {
        switch (activeStep) {
            case 0:
                return (
                    <View style={styles.stepContainer}>
                        <Text style={styles.sectionTitle}>Personal Details</Text>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>First Name *</Text>
                            <TextInput
                                style={styles.input}
                                value={form.firstName}
                                onChangeText={t => setForm({ ...form, firstName: t })}
                                placeholder="Enter first name"
                                placeholderTextColor="#888"
                            />
                        </View>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Last Name *</Text>
                            <TextInput
                                style={styles.input}
                                value={form.lastName}
                                onChangeText={t => setForm({ ...form, lastName: t })}
                                placeholder="Enter last name"
                                placeholderTextColor="#888"
                            />
                        </View>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Phone Number *</Text>
                            <TextInput
                                style={styles.input}
                                value={form.phone}
                                onChangeText={t => setForm({ ...form, phone: t })}
                                keyboardType="phone-pad"
                                placeholder="+251..."
                                placeholderTextColor="#888"
                            />
                        </View>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Email (Optional)</Text>
                            <TextInput
                                style={styles.input}
                                value={form.email}
                                onChangeText={t => setForm({ ...form, email: t })}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                placeholder="Enter email"
                                placeholderTextColor="#888"
                            />
                        </View>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Password *</Text>
                            <TextInput
                                style={styles.input}
                                value={form.password}
                                onChangeText={t => setForm({ ...form, password: t })}
                                secureTextEntry
                                placeholder="Create password"
                                placeholderTextColor="#888"
                            />
                        </View>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Confirm Password *</Text>
                            <TextInput
                                style={[styles.input, !passwordsMatch && styles.errorInput]}
                                value={form.confirmPassword}
                                onChangeText={t => setForm({ ...form, confirmPassword: t })}
                                secureTextEntry
                                placeholder="Confirm password"
                                placeholderTextColor="#888"
                            />
                            {!passwordsMatch && <Text style={styles.errorText}>Passwords do not match</Text>}
                        </View>

                        <TouchableOpacity
                            style={styles.checkboxContainer}
                            onPress={() => setForm({ ...form, agreedToTerms: !form.agreedToTerms })}
                            activeOpacity={0.7}
                        >
                            <View style={[styles.checkbox, form.agreedToTerms && styles.checkboxChecked]}>
                                {form.agreedToTerms && <Ionicons name="checkmark" size={16} color="#fff" />}
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
                    </View>
                );
            case 1:
                return (
                    <View style={styles.stepContainer}>
                        <Text style={styles.sectionTitle}>Experience & Machinery</Text>

                        <Text style={styles.label}>Years of Experience *</Text>
                        <View style={styles.optionsGrid}>
                            {EXPERIENCE_OPTIONS.map(opt => (
                                <TouchableOpacity
                                    key={opt.value}
                                    style={[styles.optionBtn, form.experience === opt.value && styles.activeOptionBtn]}
                                    onPress={() => setForm({ ...form, experience: opt.value })}
                                >
                                    <Text style={[styles.optionText, form.experience === opt.value && styles.activeOptionText]}>
                                        {opt.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Text style={[styles.label, { marginTop: 20 }]}>Machines You Can Operate *</Text>
                        {categoriesLoading ? (
                            <ActivityIndicator color={THEME_COLOR} />
                        ) : (
                            <View style={styles.machineGrid}>
                                {machineries?.map((cat: any) => (
                                    <TouchableOpacity
                                        key={cat._id}
                                        style={[
                                            styles.machineChip,
                                            form.machineTypes.includes(cat._id) && styles.activeMachineChip
                                        ]}
                                        onPress={() => toggleMachine(cat._id)}
                                    >
                                        <Text style={[
                                            styles.machineText,
                                            form.machineTypes.includes(cat._id) && styles.activeMachineText
                                        ]}>
                                            {cat.name}
                                        </Text>
                                        {form.machineTypes.includes(cat._id) && (
                                            <Ionicons name="checkmark-circle" size={16} color="#fff" style={{ marginLeft: 4 }} />
                                        )}
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}

                        <Text style={[styles.label, { marginTop: 20 }]}>License / Certification</Text>
                        <TouchableOpacity style={styles.uploadBtn} onPress={pickDocument}>
                            <Ionicons name="cloud-upload-outline" size={24} color={THEME_COLOR} />
                            <Text style={styles.uploadBtnText}>Upload Documents</Text>
                        </TouchableOpacity>

                        <View style={styles.fileList}>
                            {form.licenseFiles.map((file, idx) => (
                                <View key={idx} style={styles.fileItem}>
                                    <Ionicons name="image-outline" size={20} color="#666" />
                                    <Text style={styles.fileName} numberOfLines={1}>Document {idx + 1}.jpg</Text>
                                    <TouchableOpacity onPress={() => setForm({ ...form, licenseFiles: form.licenseFiles.filter((_, i) => i !== idx) })}>
                                        <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </View>
                    </View>
                );
            case 2:
                return (
                    <View style={[styles.stepContainer, { alignItems: 'center', paddingVertical: 40 }]}>
                        <View style={styles.successIcon}>
                            <Ionicons name="checkmark-done-circle" size={100} color="#4CAF50" />
                        </View>
                        <Text style={styles.successTitle}>Registration Complete!</Text>
                        <Text style={styles.successSub}>
                            Thank you for joining as a professional operator. Your profile is now under review.
                        </Text>
                        <TouchableOpacity
                            style={styles.doneBtn}
                            onPress={() => navigation.navigate('FindJobs')}
                        >
                            <Text style={styles.doneBtnText}>Browse Jobs</Text>
                        </TouchableOpacity>
                    </View>
                );
            default:
                return null;
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={28} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Operator Registration</Text>
                <View style={{ width: 28 }} />
            </View>

            {/* Progress Bar */}
            <View style={styles.progressContainer}>
                {steps.map((_, i) => (
                    <View key={i} style={[
                        styles.progressBar,
                        i <= activeStep && styles.activeProgressBar,
                        i < activeStep && styles.completedProgressBar
                    ]} />
                ))}
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
                {renderStepContent()}
            </ScrollView>

            {activeStep < 2 && (
                <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
                    {activeStep > 0 && (
                        <TouchableOpacity style={styles.prevBtn} onPress={() => setActiveStep(prev => prev - 1)}>
                            <Text style={styles.prevBtnText}>Back</Text>
                        </TouchableOpacity>
                    )}
                    <TouchableOpacity
                        style={[styles.nextBtn, activeStep === 0 && { width: '100%' }, registerMutation.isPending && { opacity: 0.7 }]}
                        onPress={activeStep === 1 ? handleSubmit : handleNext}
                        disabled={registerMutation.isPending}
                    >
                        {registerMutation.isPending ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.nextBtnText}>
                                {activeStep === 1 ? 'Submit' : 'Continue'}
                            </Text>
                        )}
                    </TouchableOpacity>
                </View>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 15,
        paddingVertical: 10,
    },
    backBtn: { padding: 5 },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
    progressContainer: { flexDirection: 'row', paddingHorizontal: 20, gap: 10, marginBottom: 10 },
    progressBar: { flex: 1, height: 4, borderRadius: 2, backgroundColor: '#F0F0F0' },
    activeProgressBar: { backgroundColor: THEME_COLOR },
    completedProgressBar: { backgroundColor: '#333' },
    scrollContent: { padding: 20 },
    stepContainer: { flex: 1 },
    sectionTitle: { fontSize: 24, fontWeight: 'bold', color: '#111', marginBottom: 20 },
    inputGroup: { marginBottom: 15 },
    label: { fontSize: 14, fontWeight: '600', color: '#666', marginBottom: 8 },
    input: {
        backgroundColor: '#F9F9F9',
        borderRadius: 12,
        padding: 14,
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#EEE'
    },
    errorInput: { borderColor: '#FF3B30' },
    errorText: { color: '#FF3B30', fontSize: 12, marginTop: 4 },
    optionsGrid: { gap: 10 },
    optionBtn: {
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#EEE',
        backgroundColor: '#F9F9F9'
    },
    activeOptionBtn: { borderColor: THEME_COLOR, backgroundColor: '#FFF4E5' },
    optionText: { fontSize: 16, color: '#444' },
    activeOptionText: { color: THEME_COLOR, fontWeight: 'bold' },
    machineGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 10 },
    machineChip: {
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 50,
        backgroundColor: '#F0F0F0',
        flexDirection: 'row',
        alignItems: 'center'
    },
    activeMachineChip: { backgroundColor: THEME_COLOR },
    machineText: { fontSize: 14, color: '#444' },
    activeMachineText: { color: '#fff', fontWeight: 'bold' },
    uploadBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        backgroundColor: '#FFF4E5',
        borderWidth: 1,
        borderColor: THEME_COLOR,
        borderStyle: 'dashed',
        padding: 20,
        borderRadius: 12,
        marginTop: 10
    },
    uploadBtnText: { color: THEME_COLOR, fontWeight: 'bold', fontSize: 16 },
    fileList: { marginTop: 15, gap: 10 },
    fileItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        backgroundColor: '#F9F9F9',
        borderRadius: 10,
        gap: 10
    },
    fileName: { flex: 1, fontSize: 14, color: '#444' },
    successIcon: { marginBottom: 20 },
    successTitle: { fontSize: 22, fontWeight: 'bold', color: '#111', marginBottom: 10 },
    successSub: { fontSize: 15, color: '#666', textAlign: 'center', marginBottom: 30, lineHeight: 22 },
    footer: {
        flexDirection: 'row',
        padding: 20,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
        gap: 15
    },
    prevBtn: {
        flex: 1,
        paddingVertical: 16,
        borderRadius: 14,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#DDD'
    },
    prevBtnText: { fontSize: 16, fontWeight: '600', color: '#666' },
    nextBtn: {
        flex: 2,
        backgroundColor: '#000',
        paddingVertical: 16,
        borderRadius: 14,
        alignItems: 'center'
    },
    nextBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    doneBtn: {
        backgroundColor: THEME_COLOR,
        paddingHorizontal: 40,
        paddingVertical: 16,
        borderRadius: 50,
        elevation: 4
    },
    doneBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
    checkboxContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 10,
        marginBottom: 20,
        paddingHorizontal: 2,
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
    termsText: {
        flex: 1,
        color: '#666',
        fontSize: 13,
        lineHeight: 18,
    },
    termsLink: {
        color: THEME_COLOR,
        fontWeight: 'bold',
        textDecorationLine: 'underline',
    },
});
