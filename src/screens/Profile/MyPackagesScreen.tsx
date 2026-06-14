import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, ScrollView, Linking, AppState } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { format } from 'date-fns';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    PackageDefinition,
    UserPackage,
    useCreatePackagePurchaseMutation,
    usePackageDefinitions,
    useUserPackages,
    useVerifyPackagePaymentMutation,
} from '../../api/services/packageService';
import { useAuthStore } from '../../store/useAuthStore';
import { useNotificationStore } from '../../store/useNotificationStore';
import { cleanErrorMessage } from '../../utils/errorUtils';
import { CONFIG } from '../../config';
import { formatEtb } from '../../utils/currency';

const THEME_COLOR = '#FF8C00';
const TEST_PACKAGE_PRICE = 1;
const PACKAGE_DURATION_DAYS = 30;
const PENDING_PACKAGE_TX_REF_KEY = 'pending_package_tx_ref';

const addDays = (date: Date, days: number) => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
};

const MOBILE_PAYMENT_RETURN_URL = `${CONFIG.BASE_URL}mobile-payment-return/{txRef}?serviceType=package`;

const getTxRefFromUrl = (url: string) => {
    try {
        const parsedUrl = new URL(url);
        const txRef = parsedUrl.searchParams.get('txRef');
        if (txRef) return txRef;

        const pathParts = parsedUrl.pathname.split('/').filter(Boolean);
        return pathParts[pathParts.length - 1] || null;
    } catch {
        const match = url.match(/[?&]txRef=([^&]+)/);
        return match?.[1] ? decodeURIComponent(match[1]) : null;
    }
};

export default function MyPackagesScreen({ route }: any) {
    const navigation = useNavigation<any>();
    const user = useAuthStore(state => state.user);
    const { showNotification, showAlert } = useNotificationStore();
    const { data: packages = [], isLoading: packagesLoading, refetch } = useUserPackages();
    const { data: packageDefinitions = [], isLoading: packageDefinitionsLoading } = usePackageDefinitions();
    const purchaseMutation = useCreatePackagePurchaseMutation();
    const verifyMutation = useVerifyPackagePaymentMutation();
    const [pendingTxRef, setPendingTxRef] = useState<string | null>(null);
    const [purchasingPackageId, setPurchasingPackageId] = useState<string | null>(null);
    const [isDropdownExpanded, setIsDropdownExpanded] = useState(false);
    const handledTxRefs = useRef<Set<string>>(new Set());

    const formatDate = (date?: string) => {
        if (!date) return 'N/A';
        return format(new Date(date), 'MMM dd, yyyy');
    };

    const handleVerifyPayment = useCallback((txRef?: string | null) => {
        const reference = txRef || pendingTxRef;
        if (!reference) {
            showNotification('No pending package payment to verify.', 'info');
            return;
        }

        verifyMutation.mutate(reference, {
            onSuccess: () => {
                setPendingTxRef(null);
                AsyncStorage.removeItem(PENDING_PACKAGE_TX_REF_KEY).catch(() => undefined);
                showNotification('Package activated successfully.', 'success');
                refetch();
            },
            onError: (error: any) => {
                showNotification(cleanErrorMessage(error), 'error');
            },
        });
    }, [pendingTxRef, refetch, showNotification, verifyMutation]);

    const restorePendingPayment = useCallback(async () => {
        const storedTxRef = await AsyncStorage.getItem(PENDING_PACKAGE_TX_REF_KEY);
        if (storedTxRef) {
            setPendingTxRef(storedTxRef);
        }
    }, []);

    const verifyPaymentOnce = useCallback((txRef?: string | null) => {
        if (!txRef || handledTxRefs.current.has(txRef)) return;
        handledTxRefs.current.add(txRef);
        handleVerifyPayment(txRef);
    }, [handleVerifyPayment]);

    useEffect(() => {
        verifyPaymentOnce(route?.params?.txRef);
    }, [route?.params?.txRef, verifyPaymentOnce]);

    useEffect(() => {
        const handleUrl = (url: string | null) => {
            if (!url) return;
            verifyPaymentOnce(getTxRefFromUrl(url));
        };

        Linking.getInitialURL().then(handleUrl).catch(() => undefined);
        const subscription = Linking.addEventListener('url', ({ url }) => handleUrl(url));

        return () => {
            subscription.remove();
        };
    }, [verifyPaymentOnce]);

    useEffect(() => {
        restorePendingPayment().catch(() => undefined);

        const subscription = AppState.addEventListener('change', (nextState) => {
            if (nextState === 'active') {
                restorePendingPayment()
                    .then(async () => {
                        const storedTxRef = await AsyncStorage.getItem(PENDING_PACKAGE_TX_REF_KEY);
                        if (storedTxRef && !verifyMutation.isPending) {
                            handleVerifyPayment(storedTxRef);
                        }
                    })
                    .catch(() => undefined);
            }
        });

        return () => subscription.remove();
    }, [handleVerifyPayment, restorePendingPayment, verifyMutation.isPending]);

    const handleBuyPackage = (packageDefinition: PackageDefinition) => {
        const userId = user?._id || user?.id;
        if (!userId) {
            showAlert('Login Required', 'Please login before buying a package.', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Login', onPress: () => navigation.navigate('Login') },
            ]);
            return;
        }

        setPurchasingPackageId(packageDefinition._id);
        const startDate = new Date();
        const endDate = addDays(startDate, PACKAGE_DURATION_DAYS);

        purchaseMutation.mutate(
            {
                packageDefinition: packageDefinition._id,
                user: userId,
                amount: TEST_PACKAGE_PRICE,
                returnUrl: MOBILE_PAYMENT_RETURN_URL,
                description: packageDefinition.name,
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString(),
                remainingGoldPosts: packageDefinition.numberOfGoldPosts,
                remainingPremiumPosts: packageDefinition.numberOfPremiumPosts,
                remainingBasicPosts: packageDefinition.numberOfBasicPosts,
                remainingFreeEstimationPosts: packageDefinition.numberOfFreeEstimations,
            },
            {
                onSuccess: async (data) => {
                    setPendingTxRef(data.txRef);
                    await AsyncStorage.setItem(PENDING_PACKAGE_TX_REF_KEY, data.txRef);
                    const checkoutUrl = data.transaction?.checkout_url;

                    if (!checkoutUrl) {
                        showNotification('Chapa checkout link was not returned.', 'error');
                        return;
                    }

                    try {
                        await Linking.openURL(checkoutUrl);
                        showAlert(
                            'Payment Started',
                            'After completing Chapa payment, tap Open App on the return page. If it does not reopen automatically, come back here and tap Verify.',
                            [
                                { text: 'Later', style: 'cancel' },
                                { text: 'Verify Payment', onPress: () => handleVerifyPayment(data.txRef) },
                            ]
                        );
                    } catch (error) {
                        showNotification('Could not open Chapa checkout.', 'error');
                    }
                },
                onError: (error: any) => {
                    showNotification(cleanErrorMessage(error), 'error');
                },
                onSettled: () => {
                    setPurchasingPackageId(null);
                },
            }
        );
    };

    const renderCurrentPackage = (item: UserPackage) => (
        <View key={item._id} style={styles.card}>
            <View style={styles.cardHeader}>
                <Text style={styles.packageName}>Package</Text>
                <View style={[styles.statusBadge, { backgroundColor: item.isValid ? '#E6F4EA' : '#FEEBEB' }]}>
                    <Text style={[styles.statusText, { color: item.isValid ? '#1E8E3E' : '#D93025' }]}>
                        {item.isValid ? 'Active' : 'Expired'}
                    </Text>
                </View>
            </View>

            <View style={styles.statsGrid}>
                <StatItem label="Basic Posts" value={item.remainingBasicPosts} />
                <StatItem label="Gold Posts" value={item.remainingGoldPosts} />
                <StatItem label="Premium Posts" value={item.remainingPremiumPosts} />
            </View>

            <View style={styles.cardFooter}>
                <Ionicons name="time-outline" size={14} color="#888" />
                <Text style={styles.expiryText}>Lifetime Validity (Never Expires)</Text>
            </View>
        </View>
    );

    const loading = packagesLoading || packageDefinitionsLoading;
    const hasActivePackage = packages.some((p: any) => p.isValid);
    const firstPackage = packageDefinitions[0];

    return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>My Packages</Text>
                <View style={{ width: 40 }} />
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={THEME_COLOR} />
                </View>
            ) : (
                <ScrollView contentContainerStyle={styles.content}>
                    {pendingTxRef && (
                        <View style={styles.pendingBanner}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.pendingTitle}>Payment pending</Text>
                                <Text style={styles.pendingText}>Tap verify after finishing Chapa checkout.</Text>
                            </View>
                            <TouchableOpacity
                                style={[styles.verifyBtn, verifyMutation.isPending && styles.disabledBtn]}
                                onPress={() => handleVerifyPayment()}
                                disabled={verifyMutation.isPending}
                            >
                                <Text style={styles.verifyBtnText}>Verify</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    <Text style={styles.sectionTitle}>Current Packages</Text>
                    {packages.length > 0 ? (
                        packages.map(renderCurrentPackage)
                    ) : (
                        <View style={styles.emptyContainer}>
                            <Ionicons name="gift-outline" size={52} color="#DDD" />
                            <Text style={styles.emptyText}>You do not have an active package yet.</Text>
                        </View>
                    )}

                    <Text style={styles.sectionTitle}>Buy Package</Text>
                    {firstPackage ? (
                        <View style={styles.planCard}>
                            <View style={styles.planHeader}>
                                <View>
                                    <Text style={styles.planName}>Package</Text>
                                    <Text style={styles.planPrice}>{formatEtb(TEST_PACKAGE_PRICE)}</Text>
                                </View>
                                <Ionicons name="diamond-outline" size={26} color={THEME_COLOR} />
                            </View>

                            <TouchableOpacity
                                style={styles.dropdownHeader}
                                onPress={() => setIsDropdownExpanded(!isDropdownExpanded)}
                            >
                                <Text style={styles.dropdownHeaderText}>View Details & Bonuses</Text>
                                <Ionicons
                                    name={isDropdownExpanded ? "chevron-up" : "chevron-down"}
                                    size={20}
                                    color={THEME_COLOR}
                                />
                            </TouchableOpacity>

                            {isDropdownExpanded && (
                                <View style={styles.dropdownContent}>
                                    <View style={styles.dropdownItem}>
                                        <Ionicons name="checkmark-circle-outline" size={18} color="#4CAF50" />
                                        <View style={styles.dropdownTextWrap}>
                                            <Text style={styles.dropdownFeatureValue}>10 Posts</Text>
                                            <Text style={styles.dropdownFeatureDesc}>Standard basic listing posts on Gadal Market.</Text>
                                        </View>
                                    </View>

                                    <View style={styles.dropdownItem}>
                                        <Ionicons name="checkmark-circle-outline" size={18} color="#4CAF50" />
                                        <View style={styles.dropdownTextWrap}>
                                            <Text style={styles.dropdownFeatureValue}>20 Golden Posts</Text>
                                            <Text style={styles.dropdownFeatureDesc}>Featured category list posts with high visibility.</Text>
                                        </View>
                                    </View>

                                    <View style={styles.dropdownItem}>
                                        <Ionicons name="checkmark-circle-outline" size={18} color="#4CAF50" />
                                        <View style={styles.dropdownTextWrap}>
                                            <Text style={styles.dropdownFeatureValue}>30 Premium Posts</Text>
                                            <Text style={styles.dropdownFeatureDesc}>Top-tier home page posts with maximum reach.</Text>
                                        </View>
                                    </View>
                                </View>
                            )}

                            {hasActivePackage ? (
                                <View style={styles.alreadyHaveContainer}>
                                    <Ionicons name="warning-outline" size={20} color="#FFA500" />
                                    <Text style={styles.alreadyHaveText}>You already have a package.</Text>
                                </View>
                            ) : (
                                <TouchableOpacity
                                    style={[styles.buyBtn, purchaseMutation.isPending && styles.disabledBtn]}
                                    onPress={() => handleBuyPackage(firstPackage)}
                                    disabled={purchaseMutation.isPending}
                                >
                                    {purchaseMutation.isPending ? (
                                        <ActivityIndicator color="#fff" />
                                    ) : (
                                        <Text style={styles.buyBtnText}>Buy Package</Text>
                                    )}
                                </TouchableOpacity>
                            )}
                        </View>
                    ) : (
                        <View style={styles.emptyContainer}>
                            <Ionicons name="alert-circle-outline" size={52} color="#DDD" />
                            <Text style={styles.emptyText}>No packages available to buy.</Text>
                        </View>
                    )}
                </ScrollView>
            )}
        </SafeAreaView>
    );
}

const StatItem = ({ label, value }: { label: string, value: number }) => (
    <View style={styles.statBox}>
        <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
        <Text style={styles.statValue}>{value ?? 0}</Text>
        <Text style={styles.statLabel}>{label}</Text>
    </View>
);

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F5F7FA' },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 15, paddingVertical: 12, backgroundColor: '#fff',
    },
    backBtn: { padding: 8 },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#111' },
    content: { padding: 15, paddingBottom: 30 },
    sectionTitle: { fontSize: 16, fontWeight: '800', color: '#222', marginBottom: 12 },
    card: {
        backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 15,
        elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1, shadowRadius: 4,
    },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    packageName: { fontSize: 18, fontWeight: 'bold', color: THEME_COLOR, flex: 1, marginRight: 10 },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    statusText: { fontSize: 11, fontWeight: 'bold' },
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 15 },
    statBox: {
        width: '48%', backgroundColor: '#F8F9FA', padding: 12, borderRadius: 10,
        flexDirection: 'row', alignItems: 'center', gap: 6,
    },
    statValue: { fontSize: 14, fontWeight: 'bold', color: '#333' },
    statLabel: { fontSize: 12, color: '#666', flex: 1 },
    cardFooter: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F0F0F0' },
    expiryText: { fontSize: 12, color: '#888' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyContainer: { justifyContent: 'center', alignItems: 'center', paddingVertical: 35 },
    emptyText: { marginTop: 12, color: '#888', textAlign: 'center' },
    planCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 14,
        borderWidth: 1,
        borderColor: '#EEE',
    },
    planHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
    planName: { fontSize: 18, fontWeight: '800', color: '#222' },
    planPrice: { fontSize: 14, color: THEME_COLOR, fontWeight: '700', marginTop: 3 },
    buyBtn: { backgroundColor: THEME_COLOR, paddingVertical: 13, borderRadius: 12, alignItems: 'center' },
    buyBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
    disabledBtn: { opacity: 0.6 },
    pendingBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF7ED',
        borderColor: '#FED7AA',
        borderWidth: 1,
        borderRadius: 14,
        padding: 14,
        marginBottom: 16,
    },
    pendingTitle: { fontSize: 15, fontWeight: '800', color: '#9A5A00' },
    pendingText: { fontSize: 12, color: '#8A6A3A', marginTop: 2 },
    verifyBtn: { backgroundColor: '#222', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10 },
    verifyBtnText: { color: '#fff', fontWeight: '700' },
    dropdownHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: '#F0F0F0',
        marginBottom: 14,
        marginTop: 4,
    },
    dropdownHeaderText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#666',
    },
    dropdownContent: {
        marginBottom: 16,
        paddingHorizontal: 4,
    },
    dropdownItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10,
        marginBottom: 12,
    },
    dropdownTextWrap: {
        flex: 1,
    },
    dropdownFeatureValue: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#222',
    },
    dropdownFeatureDesc: {
        fontSize: 12,
        color: '#666',
        marginTop: 2,
    },
    alreadyHaveContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFF9E6',
        borderColor: '#FFE0B2',
        borderWidth: 1,
        borderRadius: 12,
        paddingVertical: 12,
        gap: 8,
    },
    alreadyHaveText: {
        color: '#D48800',
        fontWeight: 'bold',
        fontSize: 14,
    },
});
