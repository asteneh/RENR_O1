import React from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useUserAds, useUserProfile } from '../../api/services/userService';
import ProductCard from '../../components/ProductCard';

const THEME_COLOR = '#FF8C00';

export default function MyListingsScreen() {
    const navigation = useNavigation<any>();
    const { data: profile, isLoading: isProfileLoading } = useUserProfile();
    const { data: ads, isLoading: isAdsLoading } = useUserAds(profile?._id || '');

    const isLoading = isProfileLoading || isAdsLoading;

    if (isLoading) return <View style={styles.center}><ActivityIndicator size="large" color={THEME_COLOR} /></View>;

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="chevron-back" size={28} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>My Listings</Text>
                <View style={{ width: 28 }} />
            </View>

            <FlatList
                data={ads?.products || []}
                keyExtractor={(item) => item._id}
                renderItem={({ item }) => (
                    <ProductCard product={item} style={{ marginHorizontal: 20, marginTop: 15 }} />
                )}
                contentContainerStyle={{ paddingBottom: 30 }}
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <Ionicons name="documents-outline" size={60} color="#ccc" />
                        <Text style={styles.emptyText}>You haven't posted any ads yet.</Text>
                    </View>
                }
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FA' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 15,
        paddingVertical: 10,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0'
    },
    headerTitle: { fontSize: 18, fontWeight: 'bold' },
    empty: { alignItems: 'center', marginTop: 100 },
    emptyText: { color: '#999', marginTop: 15, fontSize: 16 }
});
