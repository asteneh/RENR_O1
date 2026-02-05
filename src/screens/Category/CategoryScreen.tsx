import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, StatusBar } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { TabParamList } from '../../navigation/types';

type CategoryScreenNavigationProp = BottomTabNavigationProp<TabParamList, 'Category'>;

const CATEGORIES = [
    { id: '1', name: 'All', icon: 'grid-outline' },
    { id: '2', name: 'For Rent', icon: 'key-outline' },
    { id: '3', name: 'For Sale', icon: 'pricetag-outline' },
    { id: '4', name: 'Machinery', icon: 'construct-outline' },
    { id: '5', name: 'Vehicles', icon: 'car-sport-outline' },
    { id: '6', name: 'Excavators', icon: 'hammer-outline' },
    { id: '7', name: 'Trucks', icon: 'bus-outline' },
];

export default function CategoryScreen() {
    const navigation = useNavigation<CategoryScreenNavigationProp>();

    const handleCategoryPress = (category: string) => {
        // Navigate to Home with filter
        navigation.navigate('Home', { filter: category });
    };

    const renderItem = ({ item }: { item: typeof CATEGORIES[0] }) => (
        <TouchableOpacity
            style={styles.item}
            onPress={() => handleCategoryPress(item.name)}
        >
            <View style={styles.iconContainer}>
                <Ionicons name={item.icon as any} size={24} color="#FF8C00" />
            </View>
            <Text style={styles.itemText}>{item.name}</Text>
            <Ionicons name="chevron-forward" size={20} color="#ccc" style={{ marginLeft: 'auto' }} />
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Categories</Text>
            </View>

            <FlatList
                data={CATEGORIES}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                contentContainerStyle={styles.listContent}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    header: {
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
    },
    listContent: {
        padding: 20,
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 15,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#FFF0E0',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    itemText: {
        fontSize: 16,
        color: '#333',
        fontWeight: '500',
    },
    separator: {
        height: 1,
        backgroundColor: '#f5f5f5',
    },
});
