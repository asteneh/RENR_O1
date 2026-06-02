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
    const [showBuyingOptions, setShowBuyingOptions] = useState(false);
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
                <Text style={styles.packageName}>{item.description || item.packageDefinition?.name || 'Package'}</Text>
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
                <Text style={styles.expiryText}>Expires on {formatDate(item.endDate)}</Text>
            </View>
        </View>
    );

    const renderPackageDefinition = (item: PackageDefinition) => {
        const isPurchasing = purchaseMutation.isPending && purchasingPackageId === item._id;

        return (
            <View key={item._id} style={styles.planCard}>
                <View style={styles.planHeader}>
                    <View>
                        <Text style={styles.planName}>{item.name}</Text>
                        <Text style={styles.planPrice}>ETB {TEST_PACKAGE_PRICE}</Text>
                    </View>
                    <Ionicons name="diamond-outline" size={26} color={THEME_COLOR} />
                </View>

                <View style={styles.planFeatureGrid}>
                    <PlanFeature label="Basic" value={item.numberOfBasicPosts} />
                    <PlanFeature label="Gold" value={item.numberOfGoldPosts} />
                    <PlanFeature label="Premium" value={item.numberOfPremiumPosts} />
                    <PlanFeature label="Estimations" value={item.numberOfFreeEstimations} />
                </View>

                <TouchableOpacity
                    style={[styles.buyBtn, isPurchasing && styles.disabledBtn]}
                    onPress={() => handleBuyPackage(item)}
                    disabled={isPurchasing}
                >
                    {isPurchasing ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.buyBtnText}>Buy with Chapa</Text>
                    )}
                </TouchableOpacity>
            </View>
        );
    };

    const loading = packagesLoading || packageDefinitionsLoading;

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

                    <TouchableOpacity
                        style={styles.showOptionsBtn}
                        onPress={() => setShowBuyingOptions(true)}
                    >
                        <Ionicons name="add-circle-outline" size={20} color="#fff" />
                        <Text style={styles.showOptionsBtnText}>Buy Package</Text>
                    </TouchableOpacity>

                    {showBuyingOptions && (
                        <>
                            <View style={styles.optionsHeader}>
                                <Text style={styles.sectionTitle}>Buying Options</Text>
                                <TouchableOpacity onPress={() => setShowBuyingOptions(false)}>
                                    <Ionicons name="close" size={22} color="#666" />
                                </TouchableOpacity>
                            </View>
                            {packageDefinitions.map(renderPackageDefinition)}
                        </>
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

const PlanFeature = ({ label, value }: { label: string, value: number }) => (
    <View style={styles.planFeature}>
        <Text style={styles.planFeatureValue}>{value ?? 0}</Text>
        <Text style={styles.planFeatureLabel}>{label}</Text>
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
    planFeatureGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
    planFeature: {
        width: '48%',
        backgroundColor: '#FFF7ED',
        borderRadius: 10,
        paddingVertical: 10,
        paddingHorizontal: 12,
    },
    planFeatureValue: { fontSize: 16, fontWeight: '800', color: '#222' },
    planFeatureLabel: { fontSize: 12, color: '#666', marginTop: 2 },
    showOptionsBtn: {
        backgroundColor: THEME_COLOR,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 8,
        marginBottom: 18,
    },
    showOptionsBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
    optionsHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 4,
    },
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
});
