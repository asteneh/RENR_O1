import React from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useUserPackages } from '../../api/services/packageService';
import { format } from 'date-fns';

const THEME_COLOR = '#FF8C00';

export default function MyPackagesScreen() {
    const navigation = useNavigation<any>();
    const { data: packages, isLoading } = useUserPackages();

    const renderPackage = ({ item }: { item: any }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <Text style={styles.packageName}>{item.description}</Text>
                <View style={[styles.statusBadge, { backgroundColor: item.isValid ? '#E6F4EA' : '#FEEBEB' }]}>
                    <Text style={[styles.statusText, { color: item.isValid ? '#1E8E3E' : '#D93025' }]}>
                        {item.isValid ? 'Active' : 'Expired'}
                    </Text>
                </View>
            </View>

            <View style={styles.statsGrid}>
                <StatItem label="Gold Posts" value={item.remainingGoldPosts} />
                <StatItem label="Premium Posts" value={item.remainingPremiumPosts} />
                <StatItem label="Basic Posts" value={item.remainingBasicPosts} />
                <StatItem label="Estimations" value={item.remainingFreeEstimationPosts} />
            </View>

            <View style={styles.cardFooter}>
                <Ionicons name="time-outline" size={14} color="#888" />
                <Text style={styles.expiryText}>
                    Expires on {format(new Date(item.endDate), 'MMM dd, yyyy')}
                </Text>
            </View>
        </View>
    );

    const StatItem = ({ label, value }: { label: string, value: number }) => (
        <View style={styles.statBox}>
            <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
            <Text style={styles.statValue}>{value}</Text>
            <Text style={styles.statLabel}>{label}</Text>
        </View>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>My Packages</Text>
                <View style={{ width: 40 }} />
            </View>

            {isLoading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={THEME_COLOR} />
                </View>
            ) : (
                <FlatList
                    data={packages || []}
                    renderItem={renderPackage}
                    keyExtractor={item => item._id}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="gift-outline" size={64} color="#DDD" />
                            <Text style={styles.emptyText}>You haven't subscribed to any packages yet.</Text>
                            <TouchableOpacity
                                style={styles.buyBtn}
                                onPress={() => {/* Navigate to package store when implemented */ }}
                            >
                                <Text style={styles.buyBtnText}>Buy Package</Text>
                            </TouchableOpacity>
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
        backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 15,
        elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1, shadowRadius: 4,
    },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    packageName: { fontSize: 18, fontWeight: 'bold', color: THEME_COLOR },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    statusText: { fontSize: 11, fontWeight: 'bold' },
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 15 },
    statBox: {
        width: '48%', backgroundColor: '#F8F9FA', padding: 12, borderRadius: 10,
        flexDirection: 'row', alignItems: 'center', gap: 6
    },
    statValue: { fontSize: 14, fontWeight: 'bold', color: '#333' },
    statLabel: { fontSize: 12, color: '#666', flex: 1 },
    cardFooter: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F0F0F0' },
    expiryText: { fontSize: 12, color: '#888' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 100 },
    emptyText: { marginTop: 15, color: '#888', textAlign: 'center', marginBottom: 20 },
    buyBtn: { backgroundColor: THEME_COLOR, paddingHorizontal: 25, paddingVertical: 12, borderRadius: 25 },
    buyBtnText: { color: '#fff', fontWeight: 'bold' },
});
