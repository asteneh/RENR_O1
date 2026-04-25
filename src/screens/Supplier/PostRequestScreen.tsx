import React, { useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TextInput,
    TouchableOpacity, ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import {
    useCategoriesByService,
    useBrandsByCategory,
    useCategoryAttributes,
} from '../../api/services/categoryService';
import { useCreateRequestMutation } from '../../api/services/requestService';
import { useAuthStore } from '../../store/useAuthStore';
import { useNotificationStore } from '../../store/useNotificationStore';
import { cleanErrorMessage } from '../../utils/errorUtils';

const THEME_COLOR = '#FF8C00';

// Map UI labels → backend enum values
const toApiRequestType = (type: string): string => {
    if (type === 'To Rent') return 'Rent';
    if (type === 'To Buy')  return 'Sales';
    return type;
};

// Main category tabs
const MAIN_CATEGORIES = [
    { id: 'machinery', label: 'Machinery', serviceId: 1 },
    { id: 'vehicle',   label: 'Vehicle',   serviceId: 3 },
];

export default function PostRequestScreen() {
    const navigation = useNavigation<any>();
    const { user } = useAuthStore();
    const { showNotification } = useNotificationStore();
    const createMutation = useCreateRequestMutation();

    // Which main tab is active: 'machinery' | 'vehicle'
    const [mainCategory, setMainCategory] = useState<'machinery' | 'vehicle'>('machinery');

    // Sub-type (sub-category) selected within the active main category
    const [selectedSubCategoryId, setSelectedSubCategoryId] = useState<string | null>(null);

    // Selected brands (multiple allowed)
    const [selectedBrands, setSelectedBrands] = useState<string[]>([]);

    // Selected attribute values: { attributeId: string[] }
    const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string[]>>({});

    const [form, setForm] = useState({
        title: '',
        description: '',
        requestType: 'To Rent',
        location: '',
        qty: '1',
        postThroughGadal: false,
    });

    // Fetch sub-categories for both main categories
    const { data: machineryTypes, isLoading: machineriesLoading } = useCategoriesByService(1);
    const { data: vehicleTypes,   isLoading: vehiclesLoading   } = useCategoriesByService(3);

    const activeTypes =
        mainCategory === 'machinery' ? machineryTypes : vehicleTypes;
    const typesLoading =
        mainCategory === 'machinery' ? machineriesLoading : vehiclesLoading;

    // When main category tab changes → clear sub-selection
    const handleMainCategoryChange = (cat: 'machinery' | 'vehicle') => {
        setMainCategory(cat);
        setSelectedSubCategoryId(null);
        setSelectedBrands([]);
        setSelectedAttributes({});
    };

    // When a sub-type chip is selected → clear brands & attributes
    const handleSubCategorySelect = (id: string) => {
        setSelectedSubCategoryId(id === selectedSubCategoryId ? null : id);
        setSelectedBrands([]);
        setSelectedAttributes({});
    };

    // Fetch brands & attributes for the selected sub-category
    const { data: brands,     isLoading: brandsLoading     } = useBrandsByCategory(selectedSubCategoryId);
    const { data: attributes, isLoading: attributesLoading } = useCategoryAttributes(selectedSubCategoryId);

    // Toggle brand selection
    const toggleBrand = (brandId: string) => {
        setSelectedBrands(prev =>
            prev.includes(brandId) ? prev.filter(b => b !== brandId) : [...prev, brandId]
        );
    };

    // Toggle attribute value selection
    const toggleAttributeValue = (attrId: string, value: string, multi: boolean) => {
        setSelectedAttributes(prev => {
            const current = prev[attrId] || [];
            if (multi) {
                return {
                    ...prev,
                    [attrId]: current.includes(value)
                        ? current.filter(v => v !== value)
                        : [...current, value],
                };
            } else {
                return { ...prev, [attrId]: current[0] === value ? [] : [value] };
            }
        });
    };

    const handlePost = async () => {
        if (!user) return navigation.navigate('Login');
        if (!form.title || !selectedSubCategoryId || !form.description) {
            return showNotification('Please fill in title, machine type and description', 'error');
        }

        try {
            // Build productAttributes array
            const productAttributes = Object.entries(selectedAttributes).flatMap(([attrId, values]) =>
                values.map(value => ({ attribute: attrId, value }))
            );

            const submissionData = {
                title: form.title,
                description: form.description,
                requestType: toApiRequestType(form.requestType), // convert UI label → API enum
                state: 'Pending',
                location: form.location,
                postedBy: user.id || user._id,
                postThroughGadal: form.postThroughGadal,
                productDetails: [{
                    category: selectedSubCategoryId,
                    qty: parseInt(form.qty) || 1,
                    brands: selectedBrands,
                    productAttributes,
                }],
                attributes: [],
            };

            await createMutation.mutateAsync(submissionData);
            showNotification('Your request has been posted!', 'success');
            navigation.goBack();
        } catch (error: any) {
            showNotification(cleanErrorMessage(error), 'error');
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="close" size={28} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Post a Request</Text>
                <View style={{ width: 28 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>

                {/* Inquiry Title */}
                <Text style={styles.label}>Inquiry Title</Text>
                <TextInput
                    style={styles.input}
                    placeholder="e.g. Need excavator for site excavation"
                    placeholderTextColor="#888"
                    value={form.title}
                    onChangeText={(val) => setForm({ ...form, title: val })}
                />

                {/* Request Type */}
                <Text style={styles.label}>Request Type</Text>
                <View style={styles.typeRow}>
                    {['To Rent', 'To Buy'].map(type => (
                        <TouchableOpacity
                            key={type}
                            style={[styles.typeBtn, form.requestType === type && styles.activeTypeBtn]}
                            onPress={() => setForm({ ...form, requestType: type })}
                        >
                            <Text style={[styles.typeBtnText, form.requestType === type && styles.activeTypeBtnText]}>
                                {type}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* ── MAIN CATEGORY TABS ── */}
                <Text style={styles.label}>Main Category</Text>
                <View style={styles.mainCatRow}>
                    {MAIN_CATEGORIES.map(cat => (
                        <TouchableOpacity
                            key={cat.id}
                            style={[
                                styles.mainCatBtn,
                                mainCategory === cat.id && styles.mainCatBtnActive,
                            ]}
                            onPress={() => handleMainCategoryChange(cat.id as 'machinery' | 'vehicle')}
                        >
                            <Ionicons
                                name={cat.id === 'machinery' ? 'construct-outline' : 'car-outline'}
                                size={18}
                                color={mainCategory === cat.id ? '#FFF' : THEME_COLOR}
                                style={{ marginRight: 6 }}
                            />
                            <Text style={[
                                styles.mainCatBtnText,
                                mainCategory === cat.id && styles.mainCatBtnTextActive,
                            ]}>
                                {cat.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* ── SUB-TYPE CHIPS ── */}
                <Text style={styles.label}>Machine Type</Text>
                {typesLoading ? (
                    <ActivityIndicator color={THEME_COLOR} />
                ) : (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                        {activeTypes?.map((cat: any) => (
                            <TouchableOpacity
                                key={cat._id}
                                style={[
                                    styles.catChip,
                                    selectedSubCategoryId === cat._id && styles.activeCatChip,
                                ]}
                                onPress={() => handleSubCategorySelect(cat._id)}
                            >
                                <Text style={[
                                    styles.catText,
                                    selectedSubCategoryId === cat._id && styles.activeCatText,
                                ]}>
                                    {cat.name}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                )}

                {/* ── BRANDS (shown only when sub-type selected) ── */}
                {selectedSubCategoryId && (
                    <>
                        <Text style={styles.label}>Brand</Text>
                        {brandsLoading ? (
                            <ActivityIndicator color={THEME_COLOR} />
                        ) : brands && brands.length > 0 ? (
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                                {brands.map((brand: any) => (
                                    <TouchableOpacity
                                        key={brand._id}
                                        style={[
                                            styles.catChip,
                                            selectedBrands.includes(brand._id) && styles.activeCatChip,
                                        ]}
                                        onPress={() => toggleBrand(brand._id)}
                                    >
                                        <Text style={[
                                            styles.catText,
                                            selectedBrands.includes(brand._id) && styles.activeCatText,
                                        ]}>
                                            {brand.description}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        ) : (
                            <Text style={styles.emptyHint}>No brands available for this type</Text>
                        )}

                        {/* ── ATTRIBUTES ── */}
                        {attributesLoading ? (
                            <ActivityIndicator color={THEME_COLOR} style={{ marginTop: 10 }} />
                        ) : attributes && attributes.length > 0 ? (
                            attributes.map((attr: any) => (
                                <View key={attr._id}>
                                    <Text style={styles.label}>{attr.name}</Text>
                                    {attr.isInsertion ? (
                                        <TextInput
                                            style={styles.input}
                                            placeholder={`Enter ${attr.name}`}
                                            placeholderTextColor="#888"
                                            value={(selectedAttributes[attr._id] || [])[0] || ''}
                                            onChangeText={val =>
                                                setSelectedAttributes(prev => ({
                                                    ...prev,
                                                    [attr._id]: val ? [val] : [],
                                                }))
                                            }
                                        />
                                    ) : (
                                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                                            {attr.values.map((val: string) => {
                                                const isSelected = (selectedAttributes[attr._id] || []).includes(val);
                                                return (
                                                    <TouchableOpacity
                                                        key={val}
                                                        style={[styles.catChip, isSelected && styles.activeCatChip]}
                                                        onPress={() => toggleAttributeValue(attr._id, val, attr.multipleSelection)}
                                                    >
                                                        <Text style={[styles.catText, isSelected && styles.activeCatText]}>
                                                            {val}
                                                        </Text>
                                                    </TouchableOpacity>
                                                );
                                            })}
                                        </ScrollView>
                                    )}
                                </View>
                            ))
                        ) : null}
                    </>
                )}

                {/* Location */}
                <Text style={styles.label}>Location</Text>
                <TextInput
                    style={styles.input}
                    placeholder="City, Area"
                    placeholderTextColor="#888"
                    value={form.location}
                    onChangeText={(val) => setForm({ ...form, location: val })}
                />

                {/* Detailed Description */}
                <Text style={styles.label}>Detailed Description</Text>
                <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Provide more details about your requirement..."
                    placeholderTextColor="#888"
                    multiline
                    numberOfLines={4}
                    value={form.description}
                    onChangeText={(val) => setForm({ ...form, description: val })}
                />

                {/* Post through Gadal */}
                <TouchableOpacity
                    style={styles.checkboxContainer}
                    onPress={() => setForm(prev => ({ ...prev, postThroughGadal: !prev.postThroughGadal }))}
                >
                    <Ionicons
                        name={form.postThroughGadal ? 'checkbox' : 'square-outline'}
                        size={24}
                        color={THEME_COLOR}
                    />
                    <Text style={styles.checkboxLabel}>Post through Gadal</Text>
                </TouchableOpacity>

                {/* Submit */}
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
        borderBottomColor: '#F0F0F0',
    },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
    scrollContent: { padding: 20, paddingBottom: 40 },
    label: { fontSize: 14, fontWeight: '600', color: '#666', marginBottom: 8, marginTop: 15 },
    input: {
        backgroundColor: '#F9F9F9',
        borderRadius: 10,
        padding: 12,
        fontSize: 15,
        borderWidth: 1,
        borderColor: '#EEE',
    },
    textArea: { height: 100, textAlignVertical: 'top' },
    typeRow: { flexDirection: 'row', gap: 10 },
    typeBtn: {
        flex: 1, paddingVertical: 10, alignItems: 'center',
        borderRadius: 10, backgroundColor: '#F9F9F9', borderWidth: 1, borderColor: '#EEE',
    },
    activeTypeBtn: { backgroundColor: THEME_COLOR, borderColor: THEME_COLOR },
    typeBtnText: { color: '#666', fontWeight: 'bold' },
    activeTypeBtnText: { color: '#FFF' },

    // Main category tabs
    mainCatRow: { flexDirection: 'row', gap: 10 },
    mainCatBtn: {
        flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        paddingVertical: 12, borderRadius: 12,
        backgroundColor: '#FFF5E6', borderWidth: 1.5, borderColor: THEME_COLOR,
    },
    mainCatBtnActive: { backgroundColor: THEME_COLOR },
    mainCatBtnText: { color: THEME_COLOR, fontWeight: '700', fontSize: 14 },
    mainCatBtnTextActive: { color: '#FFF' },

    // Chip scroll
    chipScroll: { flexDirection: 'row', marginBottom: 4 },
    catChip: {
        paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20,
        backgroundColor: '#F0F0F0', marginRight: 8, borderWidth: 1, borderColor: 'transparent',
    },
    activeCatChip: { backgroundColor: '#FFF', borderColor: THEME_COLOR },
    catText: { fontSize: 13, color: '#666' },
    activeCatText: { color: THEME_COLOR, fontWeight: 'bold' },

    emptyHint: { fontSize: 13, color: '#AAA', fontStyle: 'italic', marginBottom: 4 },

    submitBtn: {
        backgroundColor: THEME_COLOR, paddingVertical: 15,
        borderRadius: 12, alignItems: 'center', marginTop: 30,
    },
    submitBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
    disabledBtn: { opacity: 0.7 },
    checkboxContainer: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 15 },
    checkboxLabel: { fontSize: 14, color: '#333', fontWeight: '500' },
});
