import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TextInput,
    TouchableOpacity, ActivityIndicator, Image, Modal, FlatList
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { useUserProfile, useUpdateUserProfile } from '../../api/services/userService';
import { useNotificationStore } from '../../store/useNotificationStore';
import { cleanErrorMessage } from '../../utils/errorUtils';
import { CONFIG } from '../../config';
import { useAuthStore, extractBackendRoles } from '../../store/useAuthStore';
import { UserRole, UserRoles, SELECTABLE_ROLES, RoleLabels, RoleDescriptions, RoleIcons, RoleToBackend } from '../../constants/UserRoles';

const THEME_COLOR = '#FF8C00';

export default function EditProfileScreen() {
    const navigation = useNavigation<any>();
    const insets = useSafeAreaInsets();
    const { showNotification } = useNotificationStore();
    const { data: profile, isLoading } = useUserProfile();
    const updateMutation = useUpdateUserProfile();

    const [form, setForm] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phoneNumber: '',
        region: '',
        city: '',
        subCity: '',
        tinNumber: '',
    });

    const [selectedRoles, setSelectedRoles] = useState<UserRole[]>([]);
    const [showRoleModal, setShowRoleModal] = useState(false);

    useEffect(() => {
        if (profile) {
            setForm({
                firstName: profile.firstName || '',
                lastName: profile.lastName || '',
                email: profile.email || '',
                phoneNumber: profile.phoneNumber || '',
                region: profile.region || '',
                city: profile.city || '',
                subCity: profile.subCity || '',
                tinNumber: profile.tinNumber || '',
            });
            setSelectedRoles(extractBackendRoles(profile).filter(r => r !== UserRoles.USER));
        }
    }, [profile]);

    const toggleRole = (role: UserRole) => {
        if (selectedRoles.includes(role)) {
            setSelectedRoles(selectedRoles.filter(r => r !== role));
        } else {
            setSelectedRoles([...selectedRoles, role]);
        }
    };

    const handleUpdate = async () => {
        if (selectedRoles.length === 0) {
            showNotification("Please select at least one role", "error");
            return;
        }

        const formData = new FormData();
        formData.append('firstName', form.firstName);
        formData.append('lastName', form.lastName);
        if (form.email) formData.append('email', form.email);
        if (form.region) formData.append('region', form.region);
        if (form.city) formData.append('city', form.city);
        if (form.subCity) formData.append('subCity', form.subCity);
        if (form.tinNumber) formData.append('tinNumber', form.tinNumber);

        const backendRoles = selectedRoles.map(r => RoleToBackend[r]);
        formData.append('roles', JSON.stringify(backendRoles));

        try {
            const updatedUser = await updateMutation.mutateAsync(formData);
            if (updatedUser) {
                useAuthStore.getState().updateUser(updatedUser);
            }
            showNotification("Profile updated successfully", "success");
            navigation.goBack();
        } catch (error: any) {
            showNotification(cleanErrorMessage(error), "error");
        }
    };

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: 'images',
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });

        if (!result.canceled) {
            const formData = new FormData();
            const uri = result.assets[0].uri;
            const name = uri.split('/').pop() || 'profile.jpg';
            const type = 'image/jpeg';
            formData.append('image', { uri, name, type } as any);

            try {
                await updateMutation.mutateAsync(formData);
                showNotification("Avatar updated", "success");
            } catch (error: any) {
                showNotification("Failed to upload image", "error");
            }
        }
    };

    if (isLoading) return <View style={styles.center}><ActivityIndicator size="large" color={THEME_COLOR} /></View>;

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="chevron-back" size={28} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Edit Profile</Text>
                <View style={{ width: 28 }} />
            </View>

            <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, 20) }]} keyboardShouldPersistTaps="handled">
                <TouchableOpacity onPress={pickImage} style={styles.avatarWrapper}>
                    <Image
                        source={{ uri: profile?.proflePic ? `${CONFIG.FILE_URL}/${profile.proflePic}` : 'https://via.placeholder.com/100' }}
                        style={styles.avatar}
                    />
                    <View style={styles.editBadge}>
                        <Ionicons name="camera" size={18} color="#fff" />
                    </View>
                </TouchableOpacity>

                <View style={[styles.inputRow, { marginTop: 30 }]}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>First Name</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="First Name"
                            placeholderTextColor="#888"
                            value={form.firstName}
                            onChangeText={t => setForm({ ...form, firstName: t })}
                        />
                    </View>
                    <View style={[styles.inputGroup, { marginLeft: 10 }]}>
                        <Text style={styles.label}>Last Name</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Last Name"
                            placeholderTextColor="#888"
                            value={form.lastName}
                            onChangeText={t => setForm({ ...form, lastName: t })}
                        />
                    </View>
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Email (Optional)</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Email"
                        placeholderTextColor="#888"
                        value={form.email}
                        onChangeText={t => setForm({ ...form, email: t })}
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Phone Number</Text>
                    <TextInput
                        style={[styles.input, { backgroundColor: '#F0F0F0' }]}
                        placeholder="Phone Number"
                        placeholderTextColor="#888"
                        value={form.phoneNumber}
                        editable={false}
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Region</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Region"
                        placeholderTextColor="#888"
                        value={form.region}
                        onChangeText={t => setForm({ ...form, region: t })}
                    />
                </View>

                <View style={styles.inputRow}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>City</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="City"
                            placeholderTextColor="#888"
                            value={form.city}
                            onChangeText={t => setForm({ ...form, city: t })}
                        />
                    </View>
                    <View style={[styles.inputGroup, { marginLeft: 10 }]}>
                        <Text style={styles.label}>Sub City</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Sub City"
                            placeholderTextColor="#888"
                            value={form.subCity}
                            onChangeText={t => setForm({ ...form, subCity: t })}
                        />
                    </View>
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>TIN Number (Optional)</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Taxpayer Identification Number"
                        placeholderTextColor="#888"
                        value={form.tinNumber}
                        onChangeText={t => setForm({ ...form, tinNumber: t })}
                        keyboardType="numeric"
                        maxLength={20}
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Roles (Select one or more)</Text>
                    <TouchableOpacity
                        style={styles.selector}
                        onPress={() => setShowRoleModal(true)}
                    >
                        <Text style={selectedRoles.length > 0 ? styles.selectorText : styles.selectorPlaceholder}>
                            {selectedRoles.length > 0
                                ? `${selectedRoles.length} role${selectedRoles.length > 1 ? 's' : ''} selected`
                                : 'Select your roles'}
                        </Text>
                        <Ionicons name="chevron-down" size={20} color="#666" />
                    </TouchableOpacity>

                    {selectedRoles.length > 0 && (
                        <View style={styles.selectedRolesRow}>
                            {selectedRoles.map(role => (
                                <View key={role} style={styles.roleChip}>
                                    <Ionicons name={(RoleIcons[role] || 'person-outline') as any} size={14} color={THEME_COLOR} />
                                    <Text style={styles.roleChipText}>{RoleLabels[role]}</Text>
                                    <TouchableOpacity onPress={() => toggleRole(role)}>
                                        <Ionicons name="close-circle" size={16} color={THEME_COLOR} style={{ marginLeft: 4 }} />
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </View>
                    )}
                </View>

                <TouchableOpacity
                    style={[styles.saveBtn, updateMutation.isPending && { opacity: 0.7 }]}
                    onPress={handleUpdate}
                    disabled={updateMutation.isPending}
                >
                    {updateMutation.isPending ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save Changes</Text>}
                </TouchableOpacity>
            </ScrollView>

            {/* --- MULTI-ROLE PICKER MODAL --- */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={showRoleModal}
                onRequestClose={() => setShowRoleModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.roleModalContainer}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Select Your Roles</Text>
                            <TouchableOpacity onPress={() => setShowRoleModal(false)}>
                                <Ionicons name="close" size={24} color="#333" />
                            </TouchableOpacity>
                        </View>
                        <Text style={{ color: '#888', fontSize: 13, marginBottom: 12 }}>You can select multiple roles</Text>
                        <FlatList
                            data={SELECTABLE_ROLES}
                            keyExtractor={(item) => item}
                            renderItem={({ item }) => {
                                const isSelected = selectedRoles.includes(item);
                                return (
                                    <TouchableOpacity
                                        style={[styles.modalItem, isSelected && { backgroundColor: '#FFF5E6' }]}
                                        onPress={() => toggleRole(item)}
                                    >
                                        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                                            <View style={[styles.roleCheckbox, isSelected && styles.roleCheckboxChecked]}>
                                                {isSelected && <Ionicons name="checkmark" size={14} color="#fff" />}
                                            </View>
                                            <View style={{ marginLeft: 12, flex: 1 }}>
                                                <Text style={[styles.modalItemName, isSelected && { color: THEME_COLOR, fontWeight: 'bold' }]}>
                                                    {RoleLabels[item as UserRole]}
                                                </Text>
                                                <Text style={{ fontSize: 12, color: '#999', marginTop: 2 }}>
                                                    {RoleDescriptions[item as UserRole]}
                                                </Text>
                                            </View>
                                        </View>
                                        <Ionicons name={(RoleIcons[item as UserRole] || 'person-outline') as any} size={20} color={isSelected ? THEME_COLOR : '#CCC'} />
                                    </TouchableOpacity>
                                );
                            }}
                        />
                        <TouchableOpacity
                            style={[styles.roleDoneBtn, selectedRoles.length === 0 && { backgroundColor: '#CCC' }]}
                            disabled={selectedRoles.length === 0}
                            onPress={() => setShowRoleModal(false)}
                        >
                            <Text style={styles.roleDoneBtnText}>
                                Done ({selectedRoles.length} selected)
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 15,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0'
    },
    headerTitle: { fontSize: 18, fontWeight: 'bold' },
    scrollContent: { padding: 20, alignItems: 'center' },
    avatarWrapper: { position: 'relative' },
    avatar: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#F0F0F0' },
    editBadge: {
        position: 'absolute', bottom: 0, right: 0,
        backgroundColor: THEME_COLOR, width: 36, height: 36,
        borderRadius: 18, justifyContent: 'center', alignItems: 'center',
        borderWidth: 3, borderColor: '#fff'
    },
    inputGroup: { marginBottom: 20, flex: 1, width: '100%' },
    inputRow: { flexDirection: 'row', width: '100%' },
    label: { fontSize: 13, fontWeight: '600', color: '#666', marginBottom: 6 },
    input: {
        backgroundColor: '#F9F9F9', borderRadius: 10, padding: 12,
        fontSize: 15, borderWidth: 1, borderColor: '#EEE'
    },
    saveBtn: {
        backgroundColor: '#000', paddingVertical: 16, width: '100%',
        borderRadius: 12, alignItems: 'center', marginTop: 20
    },
    saveBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
    selector: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        backgroundColor: '#F9F9F9', padding: 12, borderRadius: 10, marginBottom: 10,
        borderWidth: 1, borderColor: '#EEE', width: '100%'
    },
    selectorText: { color: '#333', fontSize: 15 },
    selectorPlaceholder: { color: '#999', fontSize: 15 },
    selectedRolesRow: {
        flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10, marginBottom: 4, width: '100%'
    },
    roleChip: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        backgroundColor: '#FFF5E6', borderRadius: 20,
        paddingHorizontal: 12, paddingVertical: 6,
        borderWidth: 1, borderColor: THEME_COLOR,
    },
    roleChipText: { fontSize: 13, color: THEME_COLOR, fontWeight: '600' },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    roleModalContainer: {
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
    modalItemName: { fontSize: 16, color: '#333' },
    roleCheckbox: {
        width: 22, height: 22, borderRadius: 6,
        borderWidth: 2, borderColor: THEME_COLOR,
        justifyContent: 'center', alignItems: 'center',
    },
    roleCheckboxChecked: {
        backgroundColor: THEME_COLOR,
    },
    roleDoneBtn: {
        backgroundColor: THEME_COLOR, marginHorizontal: 20, marginVertical: 16,
        paddingVertical: 14, borderRadius: 12, alignItems: 'center',
    },
    roleDoneBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
});
