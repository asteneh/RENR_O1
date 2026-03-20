import React, { useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TextInput,
    TouchableOpacity, ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useCategoriesByService } from '../../api/services/categoryService';
import { useCreateRequestMutation } from '../../api/services/requestService';
import { useAuthStore } from '../../store/useAuthStore';
import { useNotificationStore } from '../../store/useNotificationStore';
import { cleanErrorMessage } from '../../utils/errorUtils';

const THEME_COLOR = '#FF8C00';

export default function PostRequestScreen() {
    const navigation = useNavigation<any>();
    const { user } = useAuthStore();
    const { showNotification } = useNotificationStore();
    const { data: machineries, isLoading: machineriesLoading } = useCategoriesByService(1); // Machinery
    const { data: vehicles, isLoading: vehiclesLoading } = useCategoriesByService(3); // Vehicles
    const createMutation = useCreateRequestMutation();

    const categories = [...(machineries || []), ...(vehicles || [])];
    const categoriesLoading = machineriesLoading || vehiclesLoading;

    const [form, setForm] = useState({
        title: '',
        description: '',
        requestType: 'Rent',
        location: '',
        category: '',
        qty: '1',
        postThroughGadal: false
    });

    const [loading, setLoading] = useState(false);

    const handlePost = async () => {
        if (!user) return navigation.navigate('Login');
        if (!form.title || !form.category || !form.description) {
            return showNotification("Please fill in title, category and description", "error");
        }

        try {
            const submissionData = {
                title: form.title,
                description: form.description,
                requestType: form.requestType,
                state: 'Pending',
                location: form.location,
                postedBy: user.id || user._id,
                postThroughGadal: form.postThroughGadal,
                productDetails: [{
                    category: form.category,
                    qty: parseInt(form.qty) || 1,
                    brands: [],
                    productAttributes: []
                }],
                attributes: []
            };

            await createMutation.mutateAsync(submissionData);
            showNotification("Your request has been posted!", "success");
            navigation.goBack();
        } catch (error: any) {
            showNotification(cleanErrorMessage(error), "error");
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="close" size={28} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Post a Request</Text>
                <View style={{ width: 28 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <Text style={styles.label}>Inquiry Title</Text>
                <TextInput
                    style={styles.input}
                    placeholder="e.g. Need excavator for site excavation"
                    placeholderTextColor="#888"
                    value={form.title}
                    onChangeText={(val) => setForm({ ...form, title: val })}
                />

                <Text style={styles.label}>Request Type</Text>
                <View style={styles.typeRow}>
                    {['Rent', 'Sales'].map(type => (
                        <TouchableOpacity
                            key={type}
                            style={[styles.typeBtn, form.requestType === type && styles.activeTypeBtn]}
                            onPress={() => setForm({ ...form, requestType: type })}
                        >
                            <Text style={[styles.typeBtnText, form.requestType === type && styles.activeTypeBtnText]}>{type}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <Text style={styles.label}>Machinery Category</Text>
                {categoriesLoading ? (
                    <ActivityIndicator color={THEME_COLOR} />
                ) : (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
                        {categories?.map((cat: any) => (
                            <TouchableOpacity
                                key={cat._id}
                                style={[styles.catChip, form.category === cat._id && styles.activeCatChip]}
                                onPress={() => setForm({ ...form, category: cat._id })}
                            >
                                <Text style={[styles.catText, form.category === cat._id && styles.activeCatText]}>{cat.name}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                )}

                <Text style={styles.label}>Location</Text>
                <TextInput
                    style={styles.input}
                    placeholder="City, Area"
                    placeholderTextColor="#888"
                    value={form.location}
                    onChangeText={(val) => setForm({ ...form, location: val })}
                />

                <Text style={styles.label}>Detailed Description</Text>
                <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Provide more details about your requirement..."
                    placeholderTextColor="#888"
                    multiline
                    numberOfLines={4}
                    onChangeText={(val) => setForm({ ...form, description: val })}
                />

                <TouchableOpacity 
                    style={styles.checkboxContainer} 
                    onPress={() => setForm(prev => ({ ...prev, postThroughGadal: !prev.postThroughGadal }))}
                >
                    <Ionicons 
                        name={form.postThroughGadal ? "checkbox" : "square-outline"} 
                        size={24} 
                        color={THEME_COLOR} 
                    />
                    <Text style={styles.checkboxLabel}>Post through Gadal</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.submitBtn, createMutation.isPending && styles.disabledBtn]}
                    onPress={handlePost}
                    disabled={createMutation.isPending}
                >
                    {createMutation.isPending ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.submitBtnText}>Post Inquiry</Text>
                    )}
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFF' },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0'
    },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
    scrollContent: { padding: 20 },
    label: { fontSize: 14, fontWeight: '600', color: '#666', marginBottom: 8, marginTop: 15 },
    input: {
        backgroundColor: '#F9F9F9',
        borderRadius: 10,
        padding: 12,
        fontSize: 15,
        borderWidth: 1,
        borderColor: '#EEE'
    },
    textArea: { height: 100, textAlignVertical: 'top' },
    typeRow: { flexDirection: 'row', gap: 10 },
    typeBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10, backgroundColor: '#F9F9F9', borderWidth: 1, borderColor: '#EEE' },
    activeTypeBtn: { backgroundColor: THEME_COLOR, borderColor: THEME_COLOR },
    typeBtnText: { color: '#666', fontWeight: 'bold' },
    activeTypeBtnText: { color: '#FFF' },
    categoryScroll: { flexDirection: 'row', marginBottom: 10 },
    catChip: { paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F0F0F0', marginRight: 8, borderWidth: 1, borderColor: 'transparent' },
    activeCatChip: { backgroundColor: '#FFF', borderColor: THEME_COLOR },
    catText: { fontSize: 13, color: '#666' },
    activeCatText: { color: THEME_COLOR, fontWeight: 'bold' },
    submitBtn: { backgroundColor: THEME_COLOR, paddingVertical: 15, borderRadius: 12, alignItems: 'center', marginTop: 30 },
    submitBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
    disabledBtn: { opacity: 0.7 },
    checkboxContainer: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 15 },
    checkboxLabel: { fontSize: 14, color: '#333', fontWeight: '500' }
});
