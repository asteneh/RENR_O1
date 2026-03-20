import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useUserAds, useUserProfile } from '../../api/services/userService';
import { useUpdateProductMutation } from '../../api/services/productService';
import ProductCard from '../../components/ProductCard';
import { useNotificationStore } from '../../store/useNotificationStore';


const THEME_COLOR = '#FF8C00';

const TABS = ['All', 'Available', 'Unavailable', 'Machinery', 'Vehicle'];


export default function MyListingsScreen() {
    const [activeTab, setActiveTab] = useState(0);
    const navigation = useNavigation<any>();
    const { showNotification, showAlert } = useNotificationStore();
    const { data: profile, isLoading: isProfileLoading } = useUserProfile();
    const updateMutation = useUpdateProductMutation();

    // Map tab index to API parameters
    const getFilterParams = (index: number) => {
        const params: any = { userId: profile?._id || '', recordStatus: 1 };
        if (index === 1) params.derivedState = 1; // Available
        if (index === 2) params.derivedState = 2; // Unavailable
        if (index === 3) params.serviceType = 1;  // Machinery
        if (index === 4) params.serviceType = 3;  // Vehicle
        return params;
    };

    const [refreshing, setRefreshing] = useState(false);
    const { data: ads, isLoading: isAdsLoading, refetch: refetchAds } = useUserAds(getFilterParams(activeTab));

    const onRefresh = React.useCallback(async () => {
        setRefreshing(true);
        await refetchAds();
        setRefreshing(false);
    }, [refetchAds]);

    const handleEdit = (productId: string) => {
        navigation.navigate('EditListing', { productId });
    };


    const handleToggleAvailability = (productId: string, currentStatus: number) => {
        const newStatus = currentStatus === 1 ? 2 : 1;
        updateMutation.mutate({ productId, derivedState: newStatus }, {
            onSuccess: () => {
                showNotification(`Product moved to ${newStatus === 1 ? 'Available' : 'Unavailable'}`, "success");
            }
        });
    };

    const handleDelete = (productId: string) => {
        showAlert(
            "Delete Listing",
            "Are you sure you want to delete this listing?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: () => {
                        updateMutation.mutate({ productId, recordStatus: 3 }, {
                            onSuccess: () => {
                                showNotification("Listing deleted successfully", "success");
                            }
                        });
                    }
                }
            ]
        );
    };

    const isLoading = isProfileLoading || (isAdsLoading && !ads);

    const renderTab = (item: string, index: number) => (
        <TouchableOpacity
            key={index}
            onPress={() => setActiveTab(index)}
            style={[
                styles.tab,
                activeTab === index && styles.activeTab
            ]}
        >
            <Text style={[
                styles.tabText,
                activeTab === index && styles.activeTabText
            ]}>
                {item}
            </Text>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="chevron-back" size={28} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>My Listings</Text>
                <View style={{ width: 28 }} />
            </View>

            <View>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.tabsContainer}
                >
                    {TABS.map((tab, index) => renderTab(tab, index))}
                </ScrollView>
            </View>

            {isAdsLoading && !ads ? (
                <View style={styles.center}><ActivityIndicator size="large" color={THEME_COLOR} /></View>
            ) : (
                <FlatList
                    data={ads?.products || []}
                    keyExtractor={(item) => item._id}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            colors={[THEME_COLOR]}
                            tintColor={THEME_COLOR}
                        />
                    }
                    renderItem={({ item }) => (
                        <ProductCard
                            product={item}
                            style={{ marginHorizontal: 20, marginTop: 15 }}
                            isManagementMode={true}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                            onToggleAvailability={handleToggleAvailability}
                        />
                    )}
                    contentContainerStyle={{ paddingBottom: 30 }}
                    ListEmptyComponent={
                        <View style={styles.empty}>
                            <Ionicons name="documents-outline" size={60} color="#ccc" />
                            <Text style={styles.emptyText}>No ads found for this filter.</Text>
                        </View>
                    }
                />
            )}
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
    tabsContainer: {
        paddingHorizontal: 15,
        paddingVertical: 12,
        backgroundColor: '#fff',
    },
    tab: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#F0F0F0',
        marginRight: 10,
    },
    activeTab: {
        backgroundColor: THEME_COLOR,
    },
    tabText: {
        fontSize: 14,
        color: '#666',
        fontWeight: '500',
    },
    activeTabText: {
        color: '#fff',
    },
    empty: { alignItems: 'center', marginTop: 100 },
    emptyText: { color: '#999', marginTop: 15, fontSize: 16 }
});

