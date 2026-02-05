import React from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useRequestsQuery } from '../../api/services/requestService';
import { useUserProfile } from '../../api/services/userService';
import { useAuthStore } from '../../store/useAuthStore';
import { format } from 'date-fns';

const THEME_COLOR = '#FF8C00';

export default function MyRequestsScreen() {
    const navigation = useNavigation<any>();
    const { data: profile } = useUserProfile();
    const { data: response, isLoading } = useRequestsQuery({ postedBy: profile?._id });

    const renderItem = ({ item }: { item: any }) => (
        <TouchableOpacity style={styles.card} activeOpacity={0.7}>
            <View style={styles.cardHeader}>
                <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
                <View style={[styles.statusBadge, { backgroundColor: item.state === 'Pending' ? '#FFF4E5' : '#E6F4EA' }]}>
                    <Text style={[styles.statusText, { color: item.state === 'Pending' ? '#FF8C00' : '#1E8E3E' }]}>
                        {item.state}
                    </Text>
                </View>
            </View>

            <Text style={styles.description} numberOfLines={2}>{item.description}</Text>

            <View style={styles.cardFooter}>
                <View style={styles.footerItem}>
                    <Ionicons name="location-outline" size={14} color="#666" />
                    <Text style={styles.footerText}>{item.location}</Text>
                </View>
                <View style={styles.footerItem}>
                    <Ionicons name="calendar-outline" size={14} color="#666" />
                    <Text style={styles.footerText}>{format(new Date(item.date), 'MMM dd, yyyy')}</Text>
                </View>
                <View style={styles.footerItem}>
                    <Ionicons name="eye-outline" size={14} color="#666" />
                    <Text style={styles.footerText}>{item.viewCount}</Text>
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container} edges={['bottom']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>My Requests</Text>
                <View style={{ width: 40 }} />
            </View>

            {isLoading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={THEME_COLOR} />
                </View>
            ) : (
                <FlatList
                    data={response?.requests || []}
                    renderItem={renderItem}
                    keyExtractor={item => item._id}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="document-text-outline" size={64} color="#DDD" />
                            <Text style={styles.emptyText}>You haven't posted any requests yet.</Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F5F7FA' },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 15, paddingVertical: 12, backgroundColor: '#fff',
    },
    backBtn: { padding: 8 },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#111' },
    list: { padding: 15 },
    card: {
        backgroundColor: '#fff', borderRadius: 12, padding: 15, marginBottom: 15,
        elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1, shadowRadius: 2,
    },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    title: { fontSize: 16, fontWeight: 'bold', color: '#333', flex: 1, marginRight: 10 },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    statusText: { fontSize: 12, fontWeight: 'bold' },
    description: { fontSize: 14, color: '#666', lineHeight: 20, marginBottom: 15 },
    cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#F0F0F0', paddingTop: 12 },
    footerItem: { flexDirection: 'row', alignItems: 'center' },
    footerText: { fontSize: 12, color: '#666', marginLeft: 4 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 100 },
    emptyText: { marginTop: 15, color: '#888', textAlign: 'center' },
});
