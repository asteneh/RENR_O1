import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, useWindowDimensions, TextInput, ActivityIndicator, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRequestsQuery, RequestTransaction } from '../../api/services/requestService';
import { format } from 'date-fns';
import { useNavigation } from '@react-navigation/native';

const THEME_COLOR = '#FF8C00';

export default function SupplierHomeScreen() {
    const { width } = useWindowDimensions();
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<any>();
    const numColumns = width > 600 ? 2 : 1;
    const cardWidth = (width - 60) / numColumns;

    const [searchQuery, setSearchQuery] = React.useState('');
    const { data: requestsData, isLoading, refetch, isFetching } = useRequestsQuery();

    const filteredRequests = React.useMemo(() => {
        if (!requestsData?.requests) return [];
        return requestsData.requests.filter(req =>
            req.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            req.description.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [requestsData, searchQuery]);

    const renderRequirementItem = ({ item }: { item: RequestTransaction }) => {
        const primaryDetail = item.productDetails?.[0];
        const machineryType = primaryDetail?.category?.name || 'N/A';

        return (
            <TouchableOpacity
                style={[styles.card, { width: cardWidth }]}
                onPress={() => {/* Navigate to details if exists */ }}
            >
                <View style={styles.cardHeader}>
                    <View style={[styles.tag, { backgroundColor: item.requestType === 'Rent' ? '#FFAD00' : '#28a745' }]}>
                        <Text style={styles.tagText}>{item.requestType?.toUpperCase()}</Text>
                    </View>
                    <Text style={styles.dateText}>{item.createdAt ? format(new Date(item.createdAt), 'MMM dd, yyyy') : ''}</Text>
                </View>

                <Text style={styles.title} numberOfLines={2}>{item.title}</Text>

                <View style={styles.infoRow}>
                    <Ionicons name="construct-outline" size={14} color="#666" />
                    <Text style={styles.infoLabel}>Machinery: <Text style={styles.infoValue}>{machineryType}</Text></Text>
                </View>

                <View style={styles.infoRow}>
                    <Ionicons name="location-outline" size={14} color="#666" />
                    <Text style={styles.infoLabel}>Location: <Text style={styles.infoValue}>{item.location || 'N/A'}</Text></Text>
                </View>

                <View style={styles.requirementNote}>
                    <Text style={styles.noteText} numberOfLines={3}>"{item.description}"</Text>
                </View>

                <View style={styles.cardFooter}>
                    <View style={styles.userSection}>
                        <Ionicons name="person-circle-outline" size={20} color="#888" />
                        <Text style={styles.userName}>{item.postedBy?.firstName} {item.postedBy?.lastName}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={THEME_COLOR} />
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Posted Requests</Text>
                <Text style={styles.headerSub}>Browse latest machinery inquiries</Text>
            </View>

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

            {isLoading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={THEME_COLOR} />
                </View>
            ) : (
                <FlatList
                    data={filteredRequests}
                    keyExtractor={(item) => item._id}
                    renderItem={renderRequirementItem}
                    numColumns={numColumns}
                    key={numColumns}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={isFetching} onRefresh={refetch} colors={[THEME_COLOR]} />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="document-text-outline" size={60} color="#DDD" />
                            <Text style={styles.emptyText}>No requests found</Text>
                        </View>
                    }
                />
            )}

            <TouchableOpacity
                style={[styles.fab, { bottom: Math.max(insets.bottom, 25) }]}
                onPress={() => navigation.navigate('PostRequest')}
            >
                <Ionicons name="add" size={30} color="#fff" />
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FAFAFA',
    },
    header: {
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 10,
    },
    headerTitle: {
        fontSize: 26,
        fontWeight: 'bold',
        color: '#333',
    },
    headerSub: {
        fontSize: 14,
        color: '#888',
        marginTop: 2,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        marginHorizontal: 20,
        marginVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 10,
        height: 45,
        borderWidth: 1,
        borderColor: '#EEE',
    },
    searchIcon: { marginRight: 8 },
    searchInput: { flex: 1, fontSize: 14, color: '#333' },

    listContent: {
        paddingHorizontal: 20,
        paddingBottom: 100, // Space for FAB
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 15,
        marginHorizontal: 5,
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 5,
        shadowOffset: { width: 0, height: 2 },
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    tag: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 5,
    },
    tagText: {
        color: '#fff',
        fontSize: 9,
        fontWeight: 'bold',
    },
    dateText: {
        color: '#AAA',
        fontSize: 10,
    },
    title: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 10,
        lineHeight: 22,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 6,
    },
    infoLabel: {
        fontSize: 12,
        color: '#777',
    },
    infoValue: {
        color: '#444',
        fontWeight: '500',
    },
    requirementNote: {
        backgroundColor: '#FAFAFA',
        padding: 10,
        borderRadius: 8,
        marginTop: 8,
        borderWidth: 1,
        borderColor: '#F0F0F0',
    },
    noteText: {
        fontSize: 12,
        fontStyle: 'italic',
        color: '#666',
        lineHeight: 18,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 15,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#F5F5F5',
    },
    userSection: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    userName: {
        fontSize: 12,
        color: '#888',
        fontWeight: '500',
    },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyContainer: { alignItems: 'center', marginTop: 100, opacity: 0.5 },
    emptyText: { marginTop: 10, fontSize: 16, color: '#999' },
    fab: {
        position: 'absolute',
        bottom: 25,
        right: 25,
        backgroundColor: THEME_COLOR,
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 5,
        shadowColor: '#000',
        shadowOpacity: 0.3,
        shadowRadius: 5,
        shadowOffset: { width: 0, height: 4 },
    },
});
