import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, StatusBar, ActivityIndicator, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCategoriesByService, Category } from '../../api/services/categoryService';
import { ServiceEnums } from '../../constants/ServiceEnums';

const THEME_COLOR = '#FF8C00';

export default function CategoryScreen() {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<any>();
    const [activeService, setActiveService] = useState<number>(ServiceEnums.Machinery);

    const { data: categories, isLoading } = useCategoriesByService(activeService);

    const handleCategoryPress = (category: Category) => {
        navigation.navigate('Tabs', {
            screen: 'Home',
            params: { filterId: category._id, filterName: category.name }
        });
    };

    const renderItem = ({ item }: { item: Category }) => (
        <TouchableOpacity
            style={styles.item}
            onPress={() => handleCategoryPress(item)}
        >
            <View style={styles.iconContainer}>
                {item.icon ? (
                    <Image source={{ uri: item.icon }} style={styles.categoryIcon} />
                ) : (
                    <Ionicons name="grid-outline" size={24} color={THEME_COLOR} />
                )}
            </View>
            <Text style={styles.itemText}>{item.name}</Text>
            <Ionicons name="chevron-forward" size={20} color="#ccc" style={{ marginLeft: 'auto' }} />
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />

            <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) }]}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Categories</Text>
                <View style={{ width: 40 }} />
            </View>

            <View style={styles.tabBar}>
                <TouchableOpacity
                    style={[styles.tab, activeService === ServiceEnums.Machinery && styles.activeTab]}
                    onPress={() => setActiveService(ServiceEnums.Machinery)}
                >
                    <Text style={[styles.tabText, activeService === ServiceEnums.Machinery && styles.activeTabText]}>Machinery</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeService === ServiceEnums.Vehicle && styles.activeTab]}
                    onPress={() => setActiveService(ServiceEnums.Vehicle)}
                >
                    <Text style={[styles.tabText, activeService === ServiceEnums.Vehicle && styles.activeTabText]}>Vehicles</Text>
                </TouchableOpacity>
            </View>

            {isLoading ? (
                <View style={styles.loaderContainer}>
                    <ActivityIndicator size="large" color={THEME_COLOR} />
                </View>
            ) : (
                <FlatList
                    data={categories}
                    keyExtractor={(item) => item._id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContent}
                    ItemSeparatorComponent={() => <View style={styles.separator} />}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>No categories found</Text>
                        </View>
                    }
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        backgroundColor: '#fff',
    },
    backBtn: { padding: 8 },
    headerTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#333',
    },
    tabBar: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    tab: {
        marginRight: 20,
        paddingVertical: 8,
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    activeTab: {
        borderBottomColor: THEME_COLOR,
    },
    tabText: {
        fontSize: 16,
        color: '#888',
        fontWeight: '500',
    },
    activeTabText: {
        color: THEME_COLOR,
        fontWeight: 'bold',
    },
    loaderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        paddingVertical: 10,
        paddingHorizontal: 20,
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
    categoryIcon: {
        width: 24,
        height: 24,
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
    emptyContainer: {
        padding: 40,
        alignItems: 'center',
    },
    emptyText: {
        color: '#888',
        fontSize: 16,
    },
});
