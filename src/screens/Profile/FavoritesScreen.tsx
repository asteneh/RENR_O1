import React from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useFavorites } from '../../api/services/favoritesService';
import { CONFIG } from '../../config';
import { Ionicons } from '@expo/vector-icons';

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
                <Text style={styles.price}>ETB {item.currentPrice?.toLocaleString()}</Text>
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
        <View style={styles.container}>
            <Text style={styles.header}>My Favorites</Text>
            <FlatList
                data={favorites}
                keyExtractor={(item) => item._id}
                renderItem={renderItem}
                contentContainerStyle={styles.list}
                ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 20 }}>No favorites yet.</Text>}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f9f9f9', padding: 15 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { fontSize: 22, fontWeight: 'bold', marginBottom: 15 },
    list: { paddingBottom: 20 },
    card: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 12, marginBottom: 15, padding: 10, elevation: 2 },
    image: { width: 80, height: 80, borderRadius: 8, marginRight: 15 },
    details: { flex: 1, justifyContent: 'center' },
    title: { fontSize: 16, fontWeight: 'bold', marginBottom: 5 },
    price: { fontSize: 14, color: THEME_COLOR, fontWeight: 'bold', marginBottom: 5 },
    locationRow: { flexDirection: 'row', alignItems: 'center' },
    location: { fontSize: 12, color: '#666', marginLeft: 4 },
    removeBtn: { justifyContent: 'center', padding: 5 }
});
