import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TextInput,
    TouchableOpacity, ActivityIndicator, BackHandler,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { useCategoriesByService } from '../../api/services/categoryService';
import { useUserProfile, useUpdateUserProfile, useUpdateUserProfileJson } from '../../api/services/userService';
import { useNotificationStore } from '../../store/useNotificationStore';
import { cleanErrorMessage } from '../../utils/errorUtils';
import { useAuthStore } from '../../store/useAuthStore';

const THEME_COLOR = '#FF8C00';

const EXPERIENCE_OPTIONS = [
    { label: 'Less than 1 year', value: '0-1' },
    { label: '1 - 3 years', value: '1-3' },
    { label: '3 - 5 years', value: '3-5' },
    { label: 'More than 5 years', value: '5+' },
];

export default function EditOperatorProfileScreen() {
    const navigation = useNavigation<any>();
    const insets = useSafeAreaInsets();
    const route = useRoute<any>();
    const { showNotification } = useNotificationStore();

    const operatorId: string = route.params?.operatorId;

    const [activeStep, setActiveStep] = useState(0);
    const steps = ['Details', 'Experience', 'Done'];

    const [form, setForm] = useState({
        firstName: '',
        lastName: '',
        phone: '',
        email: '',
        experience: '',
        machineTypes: [] as string[],
        newLicenseFiles: [] as any[], // Newly picked files to upload
    });

    const [loaded, setLoaded] = useState(false);

    // ── Fetch current operator data ──────────────────────────────────────────
    const { data: operator, isLoading: profileLoading } = useUserProfile();

    // Pre-fill form once data arrives
    useEffect(() => {
        if (operator && !loaded) {
            const machineIds = (operator.machinesYouCanOperate || []).map((m: any) =>
                typeof m === 'string' ? m : m._id,
            );
            setForm({
                firstName: operator.firstName || '',
                lastName: operator.lastName || '',
                phone: operator.phoneNumber || '',
                email: operator.email || '',
                experience: operator.experience || '',
                machineTypes: machineIds,
                newLicenseFiles: [],
            });
            setLoaded(true);
        }
    }, [operator, loaded]);

    const { data: machineries, isLoading: categoriesLoading } = useCategoriesByService(1);
    const updateMutation = useUpdateUserProfile();
    const updateJsonMutation = useUpdateUserProfileJson();

    // ── Helpers ──────────────────────────────────────────────────────────────
    const pickDocument = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: 'images',
            allowsMultipleSelection: true,
            quality: 0.8,
        });
        if (!result.canceled) {
            setForm(prev => ({ ...prev, newLicenseFiles: [...prev.newLicenseFiles, ...result.assets] }));
        }
    };

    const toggleMachine = (id: string) => {
        setForm(prev => ({
            ...prev,
            machineTypes: prev.machineTypes.includes(id)
                ? prev.machineTypes.filter(m => m !== id)
                : [...prev.machineTypes, id],
        }));
    };

    const validateStep = () => {
        if (activeStep === 0) {
            if (!form.firstName || !form.lastName || !form.phone) {
                showNotification('Please fill in all required fields.', 'error');
                return false;
            }
        } else if (activeStep === 1) {
            if (!form.experience) {
                showNotification('Please select your years of experience.', 'error');
                return false;
            }
            if (form.machineTypes.length === 0) {
                showNotification('Please select at least one machine type.', 'error');
                return false;
            }
        }
        return true;
    };

    const handleNext = () => {
        if (validateStep()) setActiveStep(prev => prev + 1);
    };

    const handleBack = useCallback(() => {
        if (activeStep > 0 && activeStep < 2) {
            setActiveStep(prev => prev - 1);
            return true;
        }
        navigation.goBack();
        return true;
    }, [activeStep, navigation]);

    useFocusEffect(
        useCallback(() => {
            const sub = BackHandler.addEventListener('hardwareBackPress', handleBack);
            return () => sub.remove();
        }, [handleBack]),
    );

    const handleSubmit = async () => {
        if (!validateStep()) return;

        const isPending = updateMutation.isPending || updateJsonMutation.isPending;
        if (isPending) return;

        try {
            let updatedUser: any;

            if (form.newLicenseFiles.length > 0) {
                // Has files → use multipart/form-data
                const formData = new FormData();
                formData.append('firstName', form.firstName);
                formData.append('lastName', form.lastName);
                formData.append('phoneNumber', form.phone);
                if (form.email) formData.append('email', form.email);
                formData.append('experience', form.experience);
                formData.append('machinesYouCanOperate', JSON.stringify(form.machineTypes));
                // These are the operator's registration / legal documents — they must be
                // sent under `legalDocuments` (NOT `image`, which the API treats as the
                // profile picture). `legalDocumentNames` keeps a readable label per file.
                const documentNames: string[] = [];
                form.newLicenseFiles.forEach((file, index) => {
                    const uri = file.uri;
                    const name = file.fileName || uri.split('/').pop() || `document_${index + 1}.jpg`;
                    documentNames.push(name);
                    formData.append('legalDocuments', {
                        uri,
                        name,
                        type: file.mimeType || 'image/jpeg',
                    } as any);
                });
                formData.append('legalDocumentNames', JSON.stringify(documentNames));
                console.log(`[EditOpProfile] Sending FormData with ${documentNames.length} document(s)`);

                updatedUser = await updateMutation.mutateAsync(formData);
            } else {
                // No files → send plain JSON so arrays are handled correctly on the server
                const payload: Record<string, any> = {
                    firstName: form.firstName,
                    lastName: form.lastName,
                    phoneNumber: form.phone,
                    experience: form.experience,
                    machinesYouCanOperate: form.machineTypes,
                };
                if (form.email) payload.email = form.email;
                console.log('[EditOpProfile] Sending JSON payload:', JSON.stringify(payload));
                updatedUser = await updateJsonMutation.mutateAsync(payload);
            }

            if (updatedUser) {
                useAuthStore.getState().updateUser(updatedUser);
            }
            showNotification('Profile updated successfully!', 'success');
            setActiveStep(2);
        } catch (error: any) {
            const status = error?.response?.status;
            const data = error?.response?.data;
            console.error(`[EditOpProfile] Save error (HTTP ${status}):`, JSON.stringify(data || error?.message || error));
            showNotification(cleanErrorMessage(error), 'error');
        }
    };


    // ── Step content ─────────────────────────────────────────────────────────
    const renderStepContent = () => {
        if (profileLoading && !loaded) {
            return (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={THEME_COLOR} />
                    <Text style={styles.loadingText}>Loading your profile…</Text>
                </View>
            );
        }

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
                                onChangeText={t => setForm(prev => ({ ...prev, firstName: t }))}
                                placeholder="Enter first name"
                                placeholderTextColor="#888"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Last Name *</Text>
                            <TextInput
                                style={styles.input}
                                value={form.lastName}
                                onChangeText={t => setForm(prev => ({ ...prev, lastName: t }))}
                                placeholder="Enter last name"
                                placeholderTextColor="#888"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Phone Number *</Text>
                            <TextInput
                                style={styles.input}
                                value={form.phone}
                                onChangeText={t => setForm(prev => ({ ...prev, phone: t }))}
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
                                onChangeText={t => setForm(prev => ({ ...prev, email: t }))}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                placeholder="Enter email"
                                placeholderTextColor="#888"
                            />
                        </View>
                    </View>
                );

            case 1:
                return (
                    <View style={styles.stepContainer}>
                        <Text style={styles.sectionTitle}>Experience &amp; Machinery</Text>

                        <Text style={styles.label}>Years of Experience *</Text>
                        <View style={styles.optionsGrid}>
                            {EXPERIENCE_OPTIONS.map(opt => (
                                <TouchableOpacity
                                    key={opt.value}
                                    style={[styles.optionBtn, form.experience === opt.value && styles.activeOptionBtn]}
                                    onPress={() => setForm(prev => ({ ...prev, experience: opt.value }))}
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
                                        style={[styles.machineChip, form.machineTypes.includes(cat._id) && styles.activeMachineChip]}
                                        onPress={() => toggleMachine(cat._id)}
                                    >
                                        <Text style={[styles.machineText, form.machineTypes.includes(cat._id) && styles.activeMachineText]}>
                                            {cat.name}
                                        </Text>
                                        {form.machineTypes.includes(cat._id) && (
                                            <Ionicons name="checkmark-circle" size={16} color="#fff" style={{ marginLeft: 4 }} />
                                        )}
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}

                        <Text style={[styles.label, { marginTop: 20 }]}>Registration Documents</Text>

                        {(operator?.legalDocuments?.length ?? 0) > 0 && (
                            <View style={styles.fileList}>
                                {operator?.legalDocuments?.map((doc, idx) => (
                                    <View key={`existing_${idx}`} style={styles.fileItem}>
                                        <Ionicons name="document-attach-outline" size={20} color={THEME_COLOR} />
                                        <Text style={styles.fileName} numberOfLines={1}>{doc.name}</Text>
                                        <Text style={styles.uploadedTag}>Uploaded</Text>
                                    </View>
                                ))}
                            </View>
                        )}

                        <TouchableOpacity style={styles.uploadBtn} onPress={pickDocument}>
                            <Ionicons name="cloud-upload-outline" size={24} color={THEME_COLOR} />
                            <Text style={styles.uploadBtnText}>Add Documents</Text>
                        </TouchableOpacity>
                        <Text style={styles.uploadHint}>
                            New documents are added to your existing ones.
                        </Text>

                        {form.newLicenseFiles.length > 0 && (
                            <View style={styles.fileList}>
                                {form.newLicenseFiles.map((file, idx) => (
                                    <View key={idx} style={styles.fileItem}>
                                        <Ionicons name="image-outline" size={20} color="#666" />
                                        <Text style={styles.fileName} numberOfLines={1}>
                                            {file.fileName || file.uri?.split('/').pop() || `Document ${idx + 1}`}
                                        </Text>

                                        <TouchableOpacity
                                            onPress={() =>
                                                setForm(prev => ({
                                                    ...prev,
                                                    newLicenseFiles: prev.newLicenseFiles.filter((_, i) => i !== idx),
                                                }))
                                            }
                                        >
                                            <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                                        </TouchableOpacity>
                                    </View>
                                ))}
                            </View>
                        )}
                    </View>
                );

            case 2:
                return (
                    <View style={[styles.stepContainer, { alignItems: 'center', paddingVertical: 40 }]}>
                        <Ionicons name="checkmark-done-circle" size={100} color="#4CAF50" />
                        <Text style={styles.successTitle}>Profile Updated!</Text>
                        <Text style={styles.successSub}>
                            Your operator profile has been successfully updated.
                        </Text>
                        <TouchableOpacity
                            style={styles.doneBtn}
                            onPress={() => navigation.goBack()}
                        >
                            <Text style={styles.doneBtnText}>Done</Text>
                        </TouchableOpacity>
                    </View>
                );

            default:
                return null;
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={28} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Edit Operator Profile</Text>
                <View style={{ width: 28 }} />
            </View>

            {/* Progress Bar */}
            <View style={styles.progressContainer}>
                {steps.map((_, i) => (
                    <View
                        key={i}
                        style={[
                            styles.progressBar,
                            i <= activeStep && styles.activeProgressBar,
                            i < activeStep && styles.completedProgressBar,
                        ]}
                    />
                ))}
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
                {renderStepContent()}
            </ScrollView>

            {activeStep < 2 && (
                <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
                    {activeStep > 0 && (
                        <TouchableOpacity style={styles.prevBtn} onPress={handleBack}>
                            <Text style={styles.prevBtnText}>Back</Text>
                        </TouchableOpacity>
                    )}
                    <TouchableOpacity
                        style={[
                            styles.nextBtn,
                            activeStep === 0 && { width: '100%' },
                            (updateMutation.isPending || updateJsonMutation.isPending) && { opacity: 0.7 },
                        ]}
                        onPress={activeStep === 1 ? handleSubmit : handleNext}
                        disabled={updateMutation.isPending || updateJsonMutation.isPending}
                    >
                        {(updateMutation.isPending || updateJsonMutation.isPending) ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.nextBtnText}>
                                {activeStep === 1 ? 'Save Changes' : 'Continue'}
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
    loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
    loadingText: { marginTop: 12, color: '#666', fontSize: 15 },
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
        borderColor: '#EEE',
    },
    optionsGrid: { gap: 10 },
    optionBtn: {
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#EEE',
        backgroundColor: '#F9F9F9',
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
        alignItems: 'center',
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
        marginTop: 10,
    },
    uploadBtnText: { color: THEME_COLOR, fontWeight: 'bold', fontSize: 16 },
    uploadHint: { fontSize: 12, color: '#888', marginTop: 8, textAlign: 'center' },
    uploadedTag: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#4CAF50',
        backgroundColor: '#E8F5E9',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
        overflow: 'hidden',
    },
    fileList: { marginTop: 15, gap: 10 },

    fileItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        backgroundColor: '#F9F9F9',
        borderRadius: 10,
        gap: 10,
    },
    fileName: { flex: 1, fontSize: 14, color: '#444' },
    successTitle: { fontSize: 22, fontWeight: 'bold', color: '#111', marginBottom: 10, marginTop: 20 },
    successSub: { fontSize: 15, color: '#666', textAlign: 'center', marginBottom: 30, lineHeight: 22 },
    footer: {
        flexDirection: 'row',
        padding: 20,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
        gap: 15,
    },
    prevBtn: {
        flex: 1,
        paddingVertical: 16,
        borderRadius: 14,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#DDD',
    },
    prevBtnText: { fontSize: 16, fontWeight: '600', color: '#666' },
    nextBtn: {
        flex: 2,
        backgroundColor: THEME_COLOR,
        paddingVertical: 16,
        borderRadius: 14,
        alignItems: 'center',
    },
    nextBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    doneBtn: {
        backgroundColor: THEME_COLOR,
        paddingHorizontal: 40,
        paddingVertical: 16,
        borderRadius: 50,
        elevation: 4,
        marginTop: 10,
    },
    doneBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
});
