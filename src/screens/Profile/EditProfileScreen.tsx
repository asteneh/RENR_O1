import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TextInput,
    TouchableOpacity, ActivityIndicator, Image
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { useUserProfile, useUpdateUserProfile } from '../../api/services/userService';
import { useNotificationStore } from '../../store/useNotificationStore';
import { cleanErrorMessage } from '../../utils/errorUtils';
import { CONFIG } from '../../config';

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
    });

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
            });
        }
    }, [profile]);

    const handleUpdate = async () => {
        const formData = new FormData();
        formData.append('firstName', form.firstName);
        formData.append('lastName', form.lastName);
        if (form.email) formData.append('email', form.email);
        if (form.region) formData.append('region', form.region);
        if (form.city) formData.append('city', form.city);
        if (form.subCity) formData.append('subCity', form.subCity);

        try {
            await updateMutation.mutateAsync(formData);
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

                <TouchableOpacity
                    style={[styles.saveBtn, updateMutation.isPending && { opacity: 0.7 }]}
                    onPress={handleUpdate}
                    disabled={updateMutation.isPending}
                >
                    {updateMutation.isPending ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save Changes</Text>}
                </TouchableOpacity>
            </ScrollView>
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
});
