import React, { useState, useMemo, useCallback } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    useWindowDimensions, TextInput, ActivityIndicator,
    RefreshControl, ScrollView, Modal, Pressable, Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRequestsQuery, RequestTransaction } from '../../api/services/requestService';
import {
    useCategoriesByService,
    useBrandsByCategory,
} from '../../api/services/categoryService';
import { format } from 'date-fns';
import { useNavigation } from '@react-navigation/native';

const THEME_COLOR = '#FF8C00';

// Normalize legacy 'Rent' → 'To Rent' and 'Sales' → 'To Buy'
const normalizeRequestType = (type?: string): string => {
    if (!type) return 'N/A';
    if (type === 'Rent')  return 'To Rent';
    if (type === 'Sales') return 'To Buy';
    return type;
};

const MAIN_CATS = [
    { id: 'all',       label: 'All',       serviceId: null },
    { id: 'machinery', label: 'Machinery', serviceId: 1    },
    { id: 'vehicle',   label: 'Vehicle',   serviceId: 3    },
];

const REQUEST_TYPES = ['All', 'To Rent', 'To Buy'];

export default function SupplierHomeScreen() {
    const { width } = useWindowDimensions();
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<any>();
    const numColumns = width > 600 ? 2 : 1;
    const cardWidth = (width - 60) / numColumns;

    // ── Search ──────────────────────────────────────────────
    const [searchQuery, setSearchQuery] = useState('');

    // ── Filter state ─────────────────────────────────────────
    const [showFilter, setShowFilter] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState<RequestTransaction | null>(null);
    const [activeCat, setActiveCat] = useState<'all' | 'machinery' | 'vehicle'>('all');
    const [selectedTypeId, setSelectedTypeId]   = useState<string | null>(null);
    const [selectedBrandId, setSelectedBrandId] = useState<string | null>(null);
    const [selectedReqType, setSelectedReqType] = useState<string>('All');

    // Active filter count badge
    const activeFilterCount = [
        activeCat !== 'all',
        !!selectedTypeId,
        !!selectedBrandId,
        selectedReqType !== 'All',
    ].filter(Boolean).length;

    // ── Data ─────────────────────────────────────────────────
    const { data: requestsData, isLoading, refetch, isFetching } = useRequestsQuery();

    // Sub-type lists
    const { data: machineryTypes, isLoading: mLoading } = useCategoriesByService(1);
    const { data: vehicleTypes,   isLoading: vLoading  } = useCategoriesByService(3);

    const activeSubTypes = activeCat === 'machinery'
        ? (machineryTypes || [])
        : activeCat === 'vehicle'
            ? (vehicleTypes || [])
            : [];
    const subTypesLoading = activeCat === 'machinery' ? mLoading : vLoading;

    // Brands for selected type
    const { data: brands, isLoading: brandsLoading } = useBrandsByCategory(selectedTypeId);

    // ── Change handlers ────────────────────────────────────────
    const handleMainCatChange = useCallback((cat: 'all' | 'machinery' | 'vehicle') => {
        setActiveCat(cat);
        setSelectedTypeId(null);
        setSelectedBrandId(null);
    }, []);

    const handleTypeSelect = useCallback((id: string) => {
        setSelectedTypeId(prev => prev === id ? null : id);
        setSelectedBrandId(null);
    }, []);

    const handleBrandSelect = useCallback((id: string) => {
        setSelectedBrandId(prev => prev === id ? null : id);
    }, []);

    const clearFilters = () => {
        setActiveCat('all');
        setSelectedTypeId(null);
        setSelectedBrandId(null);
        setSelectedReqType('All');
    };

    // ── Filtering logic ───────────────────────────────────────
    const filteredRequests = useMemo(() => {
        if (!requestsData?.requests) return [];
        return requestsData.requests.filter(req => {
            // Text search
            const search = searchQuery.toLowerCase();
            if (search && !req.title.toLowerCase().includes(search) && !req.description.toLowerCase().includes(search)) return false;

            // Request type (handle both old and new values)
            if (selectedReqType !== 'All' && normalizeRequestType(req.requestType) !== selectedReqType) return false;

            const primary = req.productDetails?.[0];

            // Main category (by serviceId on the category object)
            if (activeCat !== 'all') {
                const serviceId = activeCat === 'machinery' ? 1 : 3;
                if (primary?.category?.serviceId !== serviceId) return false;
            }

            // Sub-type
            if (selectedTypeId && primary?.category?._id !== selectedTypeId) return false;

            // Brand
            if (selectedBrandId) {
                const hasBrand = primary?.brands?.some((b: any) =>
                    (typeof b === 'string' ? b : b?._id) === selectedBrandId
                );
                if (!hasBrand) return false;
            }

            return true;
        });
    }, [requestsData, searchQuery, activeCat, selectedTypeId, selectedBrandId, selectedReqType]);

    // ── Card renderer ─────────────────────────────────────────
    const renderItem = ({ item }: { item: RequestTransaction }) => {
        const primary = item.productDetails?.[0];
        const machineryType = primary?.category?.name || 'N/A';
        const brandName = primary?.brands?.[0]
            ? (typeof primary.brands[0] === 'string' ? primary.brands[0] : primary.brands[0]?.description)
            : null;

        const displayType = normalizeRequestType(item.requestType);
        const poster = item.postedBy;
        const posterName = typeof poster === 'object' && (poster?.firstName || poster?.lastName)
            ? `${poster.firstName || ''} ${poster.lastName || ''}`.trim()
            : 'Requester';
        const posterPhone = typeof poster === 'object' ? poster?.phoneNumber : null;
        const posterId = typeof poster === 'object' ? (poster?._id || (poster as any)?.id) : poster;

        const handleCall = (e: any) => {
            e?.stopPropagation?.();
            if (posterPhone) {
                Linking.openURL(`tel:${posterPhone}`);
            }
        };

        const handleSms = (e: any) => {
            e?.stopPropagation?.();
            if (posterPhone) {
                Linking.openURL(`sms:${posterPhone}`);
            }
        };

        const handleUserPress = (e: any) => {
            e?.stopPropagation?.();
            if (posterId) {
                navigation.navigate('UserProfile', { userId: posterId, user: poster });
            }
        };

        return (
            <TouchableOpacity
                style={[styles.card, { width: cardWidth }]}
                activeOpacity={0.7}
                onPress={() => setSelectedRequest(item)}
            >
                <View style={styles.cardHeader}>
                    <View style={[styles.tag, { backgroundColor: displayType === 'To Rent' ? '#FFAD00' : '#28a745' }]}>
                        <Text style={styles.tagText}>{displayType.toUpperCase()}</Text>
                    </View>
                    <Text style={styles.dateText}>{item.createdAt ? format(new Date(item.createdAt), 'MMM dd, yyyy') : ''}</Text>
                </View>

                <Text style={styles.title} numberOfLines={2}>{item.title}</Text>

                <View style={styles.infoRow}>
                    <Ionicons name="construct-outline" size={14} color="#666" />
                    <Text style={styles.infoLabel}>Type: <Text style={styles.infoValue}>{machineryType}</Text></Text>
                </View>

                {brandName && (
                    <View style={styles.infoRow}>
                        <Ionicons name="pricetag-outline" size={14} color="#666" />
                        <Text style={styles.infoLabel}>Brand: <Text style={styles.infoValue}>{brandName}</Text></Text>
                    </View>
                )}

                <View style={styles.infoRow}>
                    <Ionicons name="location-outline" size={14} color="#666" />
                    <Text style={styles.infoLabel}>Location: <Text style={styles.infoValue}>{item.location || 'N/A'}</Text></Text>
                </View>

                <View style={styles.requirementNote}>
                    <Text style={styles.noteText} numberOfLines={3}>"{item.description}"</Text>
                </View>

                <View style={styles.cardFooter}>
                    <TouchableOpacity
                        style={styles.userSection}
                        onPress={handleUserPress}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="person-circle-outline" size={24} color={THEME_COLOR} />
                        <View style={{ flex: 1 }}>
                            <Text style={styles.userName} numberOfLines={1}>{posterName}</Text>
                            {posterPhone ? (
                                <Text style={styles.userPhone} numberOfLines={1}>{posterPhone}</Text>
                            ) : null}
                        </View>
                    </TouchableOpacity>

                    <View style={styles.cardActionRow}>
                        {posterPhone && (
                            <>
                                <TouchableOpacity style={styles.quickCallBtn} onPress={handleCall}>
                                    <Ionicons name="call" size={12} color="#fff" />
                                    <Text style={styles.quickCallBtnText}>Call</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.quickSmsBtn} onPress={handleSms}>
                                    <Ionicons name="chatbubble-ellipses" size={12} color="#fff" />
                                </TouchableOpacity>
                            </>
                        )}
                        <Ionicons name="chevron-forward" size={18} color={THEME_COLOR} />
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            {/* ── Header ── */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.headerTitle}>Posted Requests</Text>
                    <Text style={styles.headerSub}>Browse latest machinery inquiries</Text>
                </View>
            </View>

            {/* ── Search + Filter row ── */}
            <View style={styles.searchRow}>
                <View style={styles.searchContainer}>
                    <Ionicons name="search" size={20} color="#888" style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search requests..."
                        placeholderTextColor="#888"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    {searchQuery !== '' && (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <Ionicons name="close-circle" size={18} color="#CCC" />
                        </TouchableOpacity>
                    )}
                </View>

                <TouchableOpacity
                    style={[styles.filterBtn, activeFilterCount > 0 && styles.filterBtnActive]}
                    onPress={() => setShowFilter(true)}
                >
                    <Ionicons name="options-outline" size={20} color={activeFilterCount > 0 ? '#FFF' : THEME_COLOR} />
                    {activeFilterCount > 0 && (
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>{activeFilterCount}</Text>
                        </View>
                    )}
                </TouchableOpacity>
            </View>

            {/* ── Active filter chips ── */}
            {activeFilterCount > 0 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.activeFiltersRow} contentContainerStyle={{ paddingHorizontal: 20, gap: 8, alignItems: 'center' }}>
                    {activeCat !== 'all' && (
                        <View style={styles.activeChip}>
                            <Text style={styles.activeChipText}>{activeCat === 'machinery' ? 'Machinery' : 'Vehicle'}</Text>
                            <TouchableOpacity onPress={() => handleMainCatChange('all')}>
                                <Ionicons name="close" size={13} color={THEME_COLOR} />
                            </TouchableOpacity>
                        </View>
                    )}
                    {selectedTypeId && (
                        <View style={styles.activeChip}>
                            <Text style={styles.activeChipText}>
                                {[...(machineryTypes || []), ...(vehicleTypes || [])].find(c => c._id === selectedTypeId)?.name || 'Type'}
                            </Text>
                            <TouchableOpacity onPress={() => { setSelectedTypeId(null); setSelectedBrandId(null); }}>
                                <Ionicons name="close" size={13} color={THEME_COLOR} />
                            </TouchableOpacity>
                        </View>
                    )}
                    {selectedBrandId && (
                        <View style={styles.activeChip}>
                            <Text style={styles.activeChipText}>
                                {brands?.find((b: any) => b._id === selectedBrandId)?.description || 'Brand'}
                            </Text>
                            <TouchableOpacity onPress={() => setSelectedBrandId(null)}>
                                <Ionicons name="close" size={13} color={THEME_COLOR} />
                            </TouchableOpacity>
                        </View>
                    )}
                    {selectedReqType !== 'All' && (
                        <View style={styles.activeChip}>
                            <Text style={styles.activeChipText}>{selectedReqType}</Text>
                            <TouchableOpacity onPress={() => setSelectedReqType('All')}>
                                <Ionicons name="close" size={13} color={THEME_COLOR} />
                            </TouchableOpacity>
                        </View>
                    )}
                    <TouchableOpacity onPress={clearFilters} style={styles.clearAllBtn}>
                        <Text style={styles.clearAllText}>Clear all</Text>
                    </TouchableOpacity>
                </ScrollView>
            )}

            {/* ── List ── */}
            {isLoading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={THEME_COLOR} />
                </View>
            ) : (
                <FlatList
                    data={filteredRequests}
                    keyExtractor={(item) => item._id}
                    renderItem={renderItem}
                    numColumns={numColumns}
                    key={numColumns}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} colors={[THEME_COLOR]} />}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="document-text-outline" size={60} color="#DDD" />
                            <Text style={styles.emptyText}>No requests found</Text>
                            {activeFilterCount > 0 && (
                                <TouchableOpacity onPress={clearFilters} style={styles.clearFiltersBtn}>
                                    <Text style={styles.clearFiltersBtnText}>Clear filters</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    }
                />
            )}

            {/* ── FAB ── */}
            <TouchableOpacity
                style={[styles.fab, { bottom: Math.max(insets.bottom, 25) }]}
                onPress={() => navigation.navigate('PostRequest')}
            >
                <Ionicons name="add" size={30} color="#fff" />
            </TouchableOpacity>

            {/* ── Filter Modal ── */}
            <Modal visible={showFilter} transparent animationType="slide" onRequestClose={() => setShowFilter(false)}>
                <Pressable style={styles.overlay} onPress={() => setShowFilter(false)} />
                <View style={styles.filterSheet}>
                    {/* Sheet handle */}
                    <View style={styles.sheetHandle} />

                    <View style={styles.sheetHeader}>
                        <Text style={styles.sheetTitle}>Filter Requests</Text>
                        <TouchableOpacity onPress={clearFilters}>
                            <Text style={styles.resetText}>Reset</Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false}>

                        {/* Request Type */}
                        <Text style={styles.filterLabel}>Request Type</Text>
                        <View style={styles.chipRow}>
                            {REQUEST_TYPES.map(t => (
                                <TouchableOpacity
                                    key={t}
                                    style={[styles.chip, selectedReqType === t && styles.chipActive]}
                                    onPress={() => setSelectedReqType(t)}
                                >
                                    <Text style={[styles.chipText, selectedReqType === t && styles.chipTextActive]}>{t}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Main Category */}
                        <Text style={styles.filterLabel}>Main Category</Text>
                        <View style={styles.chipRow}>
                            {MAIN_CATS.map(cat => (
                                <TouchableOpacity
                                    key={cat.id}
                                    style={[styles.chip, activeCat === cat.id && styles.chipActive]}
                                    onPress={() => handleMainCatChange(cat.id as any)}
                                >
                                    <Text style={[styles.chipText, activeCat === cat.id && styles.chipTextActive]}>{cat.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Machine Type */}
                        {activeCat !== 'all' && (
                            <>
                                <Text style={styles.filterLabel}>Machine Type</Text>
                                {subTypesLoading ? (
                                    <ActivityIndicator color={THEME_COLOR} />
                                ) : (
                                    <View style={styles.chipRow}>
                                        {activeSubTypes.map((t: any) => (
                                            <TouchableOpacity
                                                key={t._id}
                                                style={[styles.chip, selectedTypeId === t._id && styles.chipActive]}
                                                onPress={() => handleTypeSelect(t._id)}
                                            >
                                                <Text style={[styles.chipText, selectedTypeId === t._id && styles.chipTextActive]}>{t.name}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                )}
                            </>
                        )}

                        {/* Brand */}
                        {selectedTypeId && (
                            <>
                                <Text style={styles.filterLabel}>Brand</Text>
                                {brandsLoading ? (
                                    <ActivityIndicator color={THEME_COLOR} />
                                ) : brands && brands.length > 0 ? (
                                    <View style={styles.chipRow}>
                                        {brands.map((b: any) => (
                                            <TouchableOpacity
                                                key={b._id}
                                                style={[styles.chip, selectedBrandId === b._id && styles.chipActive]}
                                                onPress={() => handleBrandSelect(b._id)}
                                            >
                                                <Text style={[styles.chipText, selectedBrandId === b._id && styles.chipTextActive]}>{b.description}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                ) : (
                                    <Text style={styles.emptyHint}>No brands available for this type</Text>
                                )}
                            </>
                        )}

                    </ScrollView>

                    <TouchableOpacity
                        style={styles.applyBtn}
                        onPress={() => setShowFilter(false)}
                    >
                        <Text style={styles.applyBtnText}>
                            Show Results ({filteredRequests.length})
                        </Text>
                    </TouchableOpacity>
                </View>
            </Modal>

            {/* ── Request Details & Contact Modal ── */}
            <Modal
                visible={!!selectedRequest}
                transparent
                animationType="slide"
                onRequestClose={() => setSelectedRequest(null)}
            >
                <Pressable style={styles.overlay} onPress={() => setSelectedRequest(null)} />
                <View style={styles.detailSheet}>
                    <View style={styles.sheetHandle} />

                    <View style={styles.detailSheetHeader}>
                        <View style={{ flex: 1, marginRight: 10 }}>
                            <View style={[styles.tag, {
                                alignSelf: 'flex-start',
                                marginBottom: 6,
                                backgroundColor: normalizeRequestType(selectedRequest?.requestType) === 'To Rent' ? '#FFAD00' : '#28a745'
                            }]}>
                                <Text style={styles.tagText}>
                                    {normalizeRequestType(selectedRequest?.requestType).toUpperCase()}
                                </Text>
                            </View>
                            <Text style={styles.detailSheetTitle}>{selectedRequest?.title}</Text>
                            <Text style={styles.dateText}>
                                Posted {selectedRequest?.createdAt ? format(new Date(selectedRequest.createdAt), 'MMMM dd, yyyy') : ''}
                            </Text>
                        </View>
                        <TouchableOpacity onPress={() => setSelectedRequest(null)} style={styles.closeBtn}>
                            <Ionicons name="close" size={24} color="#666" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 450 }}>
                        {/* Requirement description */}
                        <Text style={styles.detailSectionHeading}>Requirement Details</Text>
                        <View style={styles.detailBodyWrap}>
                            <Text style={styles.detailBodyText}>{selectedRequest?.description}</Text>
                        </View>

                        {/* Metadata items */}
                        <View style={styles.detailMetaGrid}>
                            <View style={styles.detailMetaBox}>
                                <Text style={styles.detailMetaLabel}>Type</Text>
                                <Text style={styles.detailMetaValue}>
                                    {selectedRequest?.productDetails?.[0]?.category?.name || 'N/A'}
                                </Text>
                            </View>

                            <View style={styles.detailMetaBox}>
                                <Text style={styles.detailMetaLabel}>Location</Text>
                                <Text style={styles.detailMetaValue}>{selectedRequest?.location || 'Not specified'}</Text>
                            </View>
                        </View>

                        {/* Contact User Section */}
                        <View style={styles.requesterCard}>
                            <Text style={styles.requesterCardHeading}>POSTED BY (USER CONTACT INFO)</Text>
                            <View style={styles.requesterInfoRow}>
                                <Ionicons name="person-circle" size={48} color={THEME_COLOR} />
                                <View style={{ flex: 1, marginLeft: 12 }}>
                                    <Text style={styles.requesterName}>
                                        {typeof selectedRequest?.postedBy === 'object'
                                            ? `${selectedRequest?.postedBy?.firstName || ''} ${selectedRequest?.postedBy?.lastName || ''}`.trim() || 'Requester'
                                            : 'Requester'}
                                    </Text>
                                    <Text style={styles.requesterPhone}>
                                        {typeof selectedRequest?.postedBy === 'object' && selectedRequest?.postedBy?.phoneNumber
                                            ? `📞 ${selectedRequest.postedBy.phoneNumber}`
                                            : 'No phone number provided'}
                                    </Text>
                                </View>
                            </View>

                            {/* Contact action buttons */}
                            <View style={styles.modalActionButtonsRow}>
                                {typeof selectedRequest?.postedBy === 'object' && selectedRequest?.postedBy?.phoneNumber ? (
                                    <>
                                        <TouchableOpacity
                                            style={styles.modalCallBtn}
                                            onPress={() => Linking.openURL(`tel:${selectedRequest.postedBy.phoneNumber}`)}
                                        >
                                            <Ionicons name="call" size={16} color="#fff" />
                                            <Text style={styles.modalActionBtnText}>Call</Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            style={styles.modalSmsBtn}
                                            onPress={() => Linking.openURL(`sms:${selectedRequest.postedBy.phoneNumber}`)}
                                        >
                                            <Ionicons name="chatbubble-ellipses" size={16} color="#fff" />
                                            <Text style={styles.modalActionBtnText}>SMS</Text>
                                        </TouchableOpacity>
                                    </>
                                ) : null}

                                {selectedRequest?.postedBy && (
                                    <TouchableOpacity
                                        style={styles.modalProfileBtn}
                                        onPress={() => {
                                            const poster = selectedRequest.postedBy;
                                            const pId = typeof poster === 'object' ? (poster._id || (poster as any)?.id) : poster;
                                            setSelectedRequest(null);
                                            navigation.navigate('UserProfile', { userId: pId, user: poster });
                                        }}
                                    >
                                        <Ionicons name="person-outline" size={16} color="#333" />
                                        <Text style={styles.modalProfileBtnText}>Profile</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>
                    </ScrollView>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FAFAFA' },
    header: {
        paddingHorizontal: 20, paddingTop: 20, paddingBottom: 10,
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    },
    headerTitle: { fontSize: 26, fontWeight: 'bold', color: '#333' },
    headerSub: { fontSize: 14, color: '#888', marginTop: 2 },

    // Search row
    searchRow: {
        flexDirection: 'row', alignItems: 'center',
        marginHorizontal: 20, marginVertical: 10, gap: 10,
    },
    searchContainer: {
        flex: 1, flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#fff', paddingHorizontal: 12,
        borderRadius: 10, height: 45, borderWidth: 1, borderColor: '#EEE',
    },
    searchIcon: { marginRight: 8 },
    searchInput: { flex: 1, fontSize: 14, color: '#333' },
    filterBtn: {
        width: 45, height: 45, borderRadius: 10,
        backgroundColor: '#FFF5E6', justifyContent: 'center', alignItems: 'center',
        borderWidth: 1.5, borderColor: THEME_COLOR,
    },
    filterBtnActive: { backgroundColor: THEME_COLOR, borderColor: THEME_COLOR },
    badge: {
        position: 'absolute', top: -5, right: -5,
        width: 16, height: 16, borderRadius: 8,
        backgroundColor: '#FF3B30', justifyContent: 'center', alignItems: 'center',
    },
    badgeText: { color: '#FFF', fontSize: 9, fontWeight: 'bold' },

    // Active filter chips
    activeFiltersRow: { maxHeight: 40, marginBottom: 6 },
    activeChip: {
        flexDirection: 'row', alignItems: 'center', gap: 5,
        backgroundColor: '#FFF5E6', borderRadius: 20,
        paddingHorizontal: 10, paddingVertical: 5,
        borderWidth: 1, borderColor: THEME_COLOR,
    },
    activeChipText: { color: THEME_COLOR, fontSize: 12, fontWeight: '600' },
    clearAllBtn: { paddingHorizontal: 8, paddingVertical: 5 },
    clearAllText: { color: '#FF3B30', fontSize: 12, fontWeight: '600' },

    // List
    listContent: { paddingHorizontal: 20, paddingBottom: 100 },
    card: {
        backgroundColor: '#fff', borderRadius: 12, padding: 16,
        marginBottom: 15, marginHorizontal: 5, elevation: 2,
        shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5,
        shadowOffset: { width: 0, height: 2 },
    },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    tag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 5 },
    tagText: { color: '#fff', fontSize: 9, fontWeight: 'bold' },
    dateText: { color: '#AAA', fontSize: 10 },
    title: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 10, lineHeight: 22 },
    infoRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
    infoLabel: { fontSize: 12, color: '#777' },
    infoValue: { color: '#444', fontWeight: '500' },
    requirementNote: {
        backgroundColor: '#FAFAFA', padding: 10, borderRadius: 8,
        marginTop: 8, borderWidth: 1, borderColor: '#F0F0F0',
    },
    noteText: { fontSize: 12, fontStyle: 'italic', color: '#666', lineHeight: 18 },
    cardFooter: {
        flexDirection: 'row', justifyContent: 'space-between',
        alignItems: 'center', marginTop: 15, paddingTop: 12,
        borderTopWidth: 1, borderTopColor: '#F5F5F5',
    },
    userSection: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
    userName: { fontSize: 13, color: '#333', fontWeight: '600' },
    userPhone: { fontSize: 11, color: THEME_COLOR, fontWeight: '500', marginTop: 1 },
    cardActionRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    quickCallBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        backgroundColor: '#28a745', paddingHorizontal: 8, paddingVertical: 5,
        borderRadius: 12,
    },
    quickCallBtnText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
    quickSmsBtn: {
        backgroundColor: '#007AFF', paddingHorizontal: 8, paddingVertical: 5,
        borderRadius: 12, justifyContent: 'center', alignItems: 'center',
    },

    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyContainer: { alignItems: 'center', marginTop: 100, opacity: 0.5 },
    emptyText: { marginTop: 10, fontSize: 16, color: '#999' },
    clearFiltersBtn: { marginTop: 12, paddingHorizontal: 20, paddingVertical: 8, backgroundColor: THEME_COLOR, borderRadius: 20 },
    clearFiltersBtnText: { color: '#FFF', fontSize: 13, fontWeight: '600' },
    emptyHint: { fontSize: 13, color: '#AAA', fontStyle: 'italic', marginBottom: 8 },

    fab: {
        position: 'absolute', right: 25,
        backgroundColor: THEME_COLOR, width: 56, height: 56,
        borderRadius: 28, justifyContent: 'center', alignItems: 'center',
        elevation: 5, shadowColor: '#000', shadowOpacity: 0.3,
        shadowRadius: 5, shadowOffset: { width: 0, height: 4 },
    },

    // Filter Modal / Bottom Sheet
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
    filterSheet: {
        backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24,
        paddingHorizontal: 20, paddingBottom: 30, maxHeight: '80%',
    },
    sheetHandle: {
        width: 40, height: 4, borderRadius: 2, backgroundColor: '#DDD',
        alignSelf: 'center', marginTop: 12, marginBottom: 4,
    },
    sheetHeader: {
        flexDirection: 'row', justifyContent: 'space-between',
        alignItems: 'center', paddingVertical: 16,
        borderBottomWidth: 1, borderBottomColor: '#F0F0F0', marginBottom: 4,
    },
    sheetTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
    resetText: { fontSize: 14, color: '#FF3B30', fontWeight: '600' },
    filterLabel: { fontSize: 13, fontWeight: '700', color: '#555', marginTop: 16, marginBottom: 10 },
    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: {
        paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
        backgroundColor: '#F0F0F0', borderWidth: 1, borderColor: 'transparent',
    },
    chipActive: { backgroundColor: '#FFF', borderColor: THEME_COLOR },
    chipText: { fontSize: 13, color: '#666' },
    chipTextActive: { color: THEME_COLOR, fontWeight: '700' },
    applyBtn: {
        backgroundColor: THEME_COLOR, paddingVertical: 15,
        borderRadius: 14, alignItems: 'center', marginTop: 20,
    },
    applyBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },

    // Details Sheet
    detailSheet: {
        backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24,
        paddingHorizontal: 20, paddingBottom: 30, maxHeight: '85%',
    },
    detailSheetHeader: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
        paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
    },
    detailSheetTitle: { fontSize: 18, fontWeight: 'bold', color: '#222', marginBottom: 4 },
    closeBtn: { padding: 4 },
    detailSectionHeading: { fontSize: 13, fontWeight: '700', color: '#777', textTransform: 'uppercase', marginTop: 16, marginBottom: 8 },
    detailBodyWrap: { backgroundColor: '#F8F9FA', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#EEE' },
    detailBodyText: { fontSize: 14, color: '#333', lineHeight: 21 },
    detailMetaGrid: { flexDirection: 'row', gap: 10, marginTop: 12 },
    detailMetaBox: { flex: 1, backgroundColor: '#F8F9FA', borderRadius: 10, padding: 10, borderWidth: 1, borderColor: '#EEE' },
    detailMetaLabel: { fontSize: 11, color: '#888', fontWeight: '600', marginBottom: 2 },
    detailMetaValue: { fontSize: 13, color: '#333', fontWeight: 'bold' },

    requesterCard: {
        backgroundColor: '#FFF9F0', borderRadius: 14, padding: 16,
        marginTop: 18, borderWidth: 1.5, borderColor: '#FFE0B2',
    },
    requesterCardHeading: { fontSize: 11, fontWeight: '800', color: THEME_COLOR, letterSpacing: 0.5, marginBottom: 10 },
    requesterInfoRow: { flexDirection: 'row', alignItems: 'center' },
    requesterName: { fontSize: 16, fontWeight: 'bold', color: '#222' },
    requesterPhone: { fontSize: 13, color: '#555', marginTop: 2, fontWeight: '500' },
    modalActionButtonsRow: { flexDirection: 'row', gap: 8, marginTop: 14 },
    modalCallBtn: {
        flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
        backgroundColor: '#28a745', paddingVertical: 10, borderRadius: 10,
    },
    modalSmsBtn: {
        flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
        backgroundColor: '#007AFF', paddingVertical: 10, borderRadius: 10,
    },
    modalProfileBtn: {
        flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
        backgroundColor: '#FFF', paddingVertical: 10, borderRadius: 10,
        borderWidth: 1, borderColor: '#DDD',
    },
    modalActionBtnText: { color: '#FFF', fontSize: 13, fontWeight: 'bold' },
    modalProfileBtnText: { color: '#333', fontSize: 13, fontWeight: 'bold' },
});
