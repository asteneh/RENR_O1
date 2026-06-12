import React from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFavorites } from '../../api/services/favoritesService';
import { CONFIG } from '../../config';
import { Ionicons } from '@expo/vector-icons';
import { formatEtb } from '../../utils/currency';

const THEME_COLOR = '#FF8C00';

export default function FavoritesScreen({ navigation }: any) {
    const { data: favorites, isLoading, error } = useFavorites();

    if (isLoading) return <ActivityIndicator size="large" color={THEME_COLOR} style={{ flex: 1 }} />;
    if (error) return <View style={styles.center}><Text>Error loading favorites</Text></View>;

    const renderItem = ({ item }: { item: any }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('ProductDetails', { product: item })}
        >
            <Image
                source={{ uri: item.productImages?.length > 0 ? `${CONFIG.FILE_URL}/${item.productImages[0]}` : 'https://via.placeholder.com/100' }}
                style={styles.image}
            />
            <View style={styles.details}>
                <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
                <Text style={styles.price}>{formatEtb(item.currentPrice)}</Text>
                <View style={styles.locationRow}>
                    <Ionicons name="location-outline" size={12} color="#666" />
                    <Text style={styles.location}>{item.location?.descripton || 'No Location'}</Text>
                </View>
            </View>
            <TouchableOpacity style={styles.removeBtn}>
                <Ionicons name="heart" size={24} color={THEME_COLOR} />
            </TouchableOpacity>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="chevron-back" size={28} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>My Favorites</Text>
                <View style={{ width: 28 }} />
            </View>
            <FlatList
                data={favorites}
                keyExtractor={(item) => item._id}
                renderItem={renderItem}
                contentContainerStyle={styles.list}
                ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 20 }}>No favorites yet.</Text>}
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
    list: { padding: 15, paddingBottom: 30 },
    card: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 12, marginBottom: 15, padding: 10, elevation: 2 },
    image: { width: 80, height: 80, borderRadius: 8, marginRight: 15 },
    details: { flex: 1, justifyContent: 'center' },
    title: { fontSize: 16, fontWeight: 'bold', marginBottom: 5 },
    price: { fontSize: 14, color: THEME_COLOR, fontWeight: 'bold', marginBottom: 5 },
    locationRow: { flexDirection: 'row', alignItems: 'center' },
    location: { fontSize: 12, color: '#666', marginLeft: 4 },
    removeBtn: { justifyContent: 'center', padding: 5 }
});
