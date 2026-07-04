import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ActivityIndicator,
    TouchableOpacity,
    ScrollView,
    Linking,
    AppState,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
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
import { usePostTypesQuery } from '../../api/services/productService';

// ─── Constants ────────────────────────────────────────────────────────────────
const THEME_COLOR = '#FF8C00';
const TEST_PACKAGE_PRICE = 1;
const PENDING_PACKAGE_TX_REF_KEY = 'pending_package_tx_ref';
const MOBILE_PAYMENT_RETURN_URL = `${CONFIG.BASE_URL}mobile-payment-return/{txRef}?serviceType=package`;

// ─── Package type classification ──────────────────────────────────────────────
type PackageType = 'basic' | 'golden' | 'premium';

interface PackageTier {
    type: PackageType;
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
    color: string;
    bg: string;
    /** Which field on PackageDefinition holds the post count for this tier */
    countField: keyof PackageDefinition;
    postLabel: string;
    description: string;
}

const TIERS: PackageTier[] = [
    {
        type: 'basic',
        label: 'Basic',
        icon: 'layers-outline',
        color: '#4A90E2',
        bg: '#EBF4FF',
        countField: 'numberOfBasicPosts',
        postLabel: 'Posts',
        description: 'Suitable for individual users and occasional postings.',
    },
    {
        type: 'golden',
        label: 'Golden',
        icon: 'star-outline',
        color: '#F5A623',
        bg: '#FFF8E6',
        countField: 'numberOfGoldPosts',
        postLabel: 'Golden Posts',
        description: 'Suitable for active users who require more posting capacity and enhanced visibility.',
    },
    {
        type: 'premium',
        label: 'Premium',
        icon: 'diamond-outline',
        color: '#9B59B6',
        bg: '#F5EEF8',
        countField: 'numberOfPremiumPosts',
        postLabel: 'Premium Posts',
        description: 'Suitable for businesses and professional users seeking maximum exposure.',
    },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
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

/**
 * Given a list of package definitions from the API, find the one that best
 * represents the requested tier. We match by inspecting which post-count field
 * is non-zero and the others are zero (i.e. only the relevant tier is filled).
 */
function findDefinitionForTier(
    defs: PackageDefinition[],
    tier: PackageTier,
): PackageDefinition | undefined {
    if (!defs.length) return undefined;

    // Prefer the definition where only the tier's own count is > 0
    const exactMatch = defs.find((d) => {
        const tierCount = (d as any)[tier.countField] as number;
        const otherCounts = TIERS.filter((t) => t.type !== tier.type).map(
            (t) => (d as any)[t.countField] as number,
        );
        return tierCount > 0 && otherCounts.every((c) => !c);
    });
    if (exactMatch) return exactMatch;

    return defs.find((d) => ((d as any)[tier.countField] as number) > 0);
}

const getFeaturesForTier = (tierType: PackageType, definition: PackageDefinition) => {
    if (tierType === 'basic') {
        return [
            {
                value: `Up to ${definition.numberOfBasicPosts || 5} posts`,
                desc: 'Standard basic listing posts on Gadal Market.',
            },
            {
                value: 'Standard visibility',
                desc: 'Listings are visible to all users under default search and browsing.',
            },
            {
                value: 'Lifetime Validity',
                desc: 'This package never expires — use it at your own pace.',
            },
        ];
    } else if (tierType === 'golden') {
        return [
            {
                value: `Up to ${definition.numberOfGoldPosts || 15} posts`,
                desc: 'Featured category posts with high visibility.',
            },
            {
                value: 'Enhanced visibility',
                desc: 'Gold posts are prioritized in category search results.',
            },
            {
                value: 'Featured badge on posts',
                desc: 'Postings show a prominent "Featured" badge.',
            },
            {
                value: '1 free post refresh per month',
                desc: 'Refresh your listing to the top once a month for free.',
            },
            {
                value: 'Lifetime Validity',
                desc: 'This package never expires — use it at your own pace.',
            },
        ];
    } else {
        return [
            {
                value: `Up to ${definition.numberOfPremiumPosts || 25} posts`,
                desc: 'Top-tier posts with maximum reach across Gadal Market.',
            },
            {
                value: 'Highest visibility',
                desc: 'Premium posts receive maximum exposure and rank at the top.',
            },
            {
                value: 'Premium badge on posts',
                desc: 'Postings display an exclusive "Premium" badge.',
            },
            {
                value: '3 free post refreshes per month',
                desc: 'Keep your listings fresh with three complimentary refreshes per month.',
            },
            {
                value: 'Featured placement on the home page',
                desc: 'Showcase your items directly on the home page for higher conversion.',
            },
            {
                value: 'Lifetime Validity',
                desc: 'This package never expires — use it at your own pace.',
            },
        ];
    }
};

// ─── Component ────────────────────────────────────────────────────────────────
export default function MyPackagesScreen({ route }: any) {
    const navigation = useNavigation<any>();
    const user = useAuthStore((state) => state.user);
    const { showNotification, showAlert } = useNotificationStore();

    const { data: packages = [], isLoading: packagesLoading, refetch } = useUserPackages();
    const { data: packageDefinitions = [], isLoading: packageDefinitionsLoading } =
        usePackageDefinitions();
    const { data: postTypes = [] } = usePostTypesQuery();

    const getPackagePrice = (definition: PackageDefinition | undefined) => {
        if (!definition) return 0;
        const basicPrice = postTypes?.find((p: any) => p.name === 'Basic')?.price || 50;
        const goldPrice = postTypes?.find((p: any) => p.name === 'Gold')?.price || 100;
        const premiumPrice = postTypes?.find((p: any) => p.name === 'Premium')?.price || 150;

        return (definition.numberOfBasicPosts * basicPrice) +
               (definition.numberOfGoldPosts * goldPrice) +
               (definition.numberOfPremiumPosts * premiumPrice);
    };

    const purchaseMutation = useCreatePackagePurchaseMutation();
    const verifyMutation = useVerifyPackagePaymentMutation();

    const [pendingTxRef, setPendingTxRef] = useState<string | null>(null);
    const [purchasingType, setPurchasingType] = useState<PackageType | null>(null);
    const [selectedTierType, setSelectedTierType] = useState<PackageType>('basic');
    const [detailsExpanded, setDetailsExpanded] = useState(false);
    const handledTxRefs = useRef<Set<string>>(new Set());

    // ── Payment verification ────────────────────────────────────────────────
    const handleVerifyPayment = useCallback(
        (txRef?: string | null) => {
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
                    const returnTo = route?.params?.returnTo;
                    if (returnTo) {
                        navigation.goBack();
                    }
                },
                onError: (error: any) => {
                    showNotification(cleanErrorMessage(error), 'error');
                },
            });
        },
        [pendingTxRef, refetch, showNotification, verifyMutation],
    );

    const restorePendingPayment = useCallback(async () => {
        const storedTxRef = await AsyncStorage.getItem(PENDING_PACKAGE_TX_REF_KEY);
        if (storedTxRef) setPendingTxRef(storedTxRef);
    }, []);

    const verifyPaymentOnce = useCallback(
        (txRef?: string | null) => {
            if (!txRef || handledTxRefs.current.has(txRef)) return;
            handledTxRefs.current.add(txRef);
            handleVerifyPayment(txRef);
        },
        [handleVerifyPayment],
    );

    useEffect(() => {
        verifyPaymentOnce(route?.params?.txRef);
    }, [route?.params?.txRef, verifyPaymentOnce]);

    useEffect(() => {
        const handleUrl = (url: string | null) => {
            if (!url) return;
            verifyPaymentOnce(getTxRefFromUrl(url));
        };
        Linking.getInitialURL().then(handleUrl).catch(() => undefined);
        const sub = Linking.addEventListener('url', ({ url }) => handleUrl(url));
        return () => sub.remove();
    }, [verifyPaymentOnce]);

    useEffect(() => {
        restorePendingPayment().catch(() => undefined);
        const sub = AppState.addEventListener('change', (nextState) => {
            if (nextState === 'active') {
                restorePendingPayment()
                    .then(async () => {
                        const stored = await AsyncStorage.getItem(PENDING_PACKAGE_TX_REF_KEY);
                        if (stored && !verifyMutation.isPending) handleVerifyPayment(stored);
                    })
                    .catch(() => undefined);
            }
        });
        return () => sub.remove();
    }, [handleVerifyPayment, restorePendingPayment, verifyMutation.isPending]);

    // ── Purchase handler ────────────────────────────────────────────────────
    const handleBuyPackage = (definition: PackageDefinition, tierType: PackageType) => {
        const userId = user?._id || user?.id;
        if (!userId) {
            showAlert('Login Required', 'Please login before buying a package.', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Login', onPress: () => navigation.navigate('Login') },
            ]);
            return;
        }

        setPurchasingType(tierType);

        purchaseMutation.mutate(
            {
                packageDefinition: definition._id,
                user: userId,
                amount: getPackagePrice(definition),
                returnUrl: MOBILE_PAYMENT_RETURN_URL,
                description: definition.name,
                startDate: new Date().toISOString(),
                packageType: tierType,
                remainingBasicPosts:   tierType === 'basic'   ? definition.numberOfBasicPosts   : 0,
                remainingGoldPosts:    tierType === 'golden'  ? definition.numberOfGoldPosts    : 0,
                remainingPremiumPosts: tierType === 'premium' ? definition.numberOfPremiumPosts : 0,
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
                        showNotification(
                            'Complete payment in Chapa. Your package will activate automatically when you return.',
                            'info',
                            'Payment Started'
                        );
                    } catch {
                        showNotification('Could not open Chapa checkout.', 'error');
                    }
                },
                onError: (error: any) => {
                    showNotification(cleanErrorMessage(error), 'error');
                },
                onSettled: () => {
                    setPurchasingType(null);
                },
            },
        );
    };

    // ── Derived state ───────────────────────────────────────────────────────
    const loading = packagesLoading || packageDefinitionsLoading;
    const hasActivePackage = (packages as UserPackage[]).some((p) => p.isValid);
    const selectedTier = TIERS.find((t) => t.type === selectedTierType)!;
    const selectedDefinition = findDefinitionForTier(packageDefinitions, selectedTier);
    const selectedPostCount = selectedDefinition
        ? ((selectedDefinition as any)[selectedTier.countField] as number)
        : 0;

    // ── Active package display ──────────────────────────────────────────────
    const renderCurrentPackage = (item: UserPackage) => {
        // Find what tier this package primarily belongs to
        const primaryTier =
            TIERS.find((t) => {
                const val = (item as any)[`remaining${t.label}Posts`] as number;
                return val > 0;
            }) ?? TIERS[0];

        return (
            <View key={item._id} style={styles.activeCard}>
                <View style={styles.activeCardHeader}>
                    <View style={[styles.tierBadge, { backgroundColor: primaryTier.bg }]}>
                        <Ionicons
                            name={primaryTier.icon as any}
                            size={16}
                            color={primaryTier.color}
                        />
                        <Text style={[styles.tierBadgeText, { color: primaryTier.color }]}>
                            {item.description || 'Package'}
                        </Text>
                    </View>
                    <View style={[styles.statusPill, item.isValid ? styles.activePill : styles.inactivePill]}>
                        <View style={[styles.statusDot, { backgroundColor: item.isValid ? '#1E8E3E' : '#D93025' }]} />
                        <Text style={[styles.statusPillText, { color: item.isValid ? '#1E8E3E' : '#D93025' }]}>
                            {item.isValid ? 'Active' : 'Used Up'}
                        </Text>
                    </View>
                </View>

                {/* Remaining posts */}
                <View style={styles.postsRow}>
                    {[
                        { label: 'Basic', remaining: item.remainingBasicPosts, color: '#4A90E2' },
                        { label: 'Golden', remaining: item.remainingGoldPosts, color: '#F5A623' },
                        { label: 'Premium', remaining: item.remainingPremiumPosts, color: '#9B59B6' },
                    ]
                        .filter((r) => r.remaining > 0)
                        .map((r) => (
                            <View key={r.label} style={styles.postCountBox}>
                                <Text style={[styles.postCountNum, { color: r.color }]}>
                                    {r.remaining}
                                </Text>
                                <Text style={styles.postCountLabel}>{r.label} Posts</Text>
                                <Text style={styles.postCountSub}>remaining</Text>
                            </View>
                        ))}
                </View>

                <View style={styles.lifetimeRow}>
                    <Ionicons name="infinite-outline" size={14} color="#888" />
                    <Text style={styles.lifetimeText}>Lifetime Validity · Never Expires</Text>
                </View>
            </View>
        );
    };

    // ── Render ──────────────────────────────────────────────────────────────
    return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
            {/* Header */}
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
                    {/* Pending payment banner */}
                    {pendingTxRef && (
                        <View style={styles.pendingBanner}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.pendingTitle}>Payment pending</Text>
                                <Text style={styles.pendingText}>
                                    Tap verify after finishing Chapa checkout.
                                </Text>
                            </View>
                            <TouchableOpacity
                                style={[
                                    styles.verifyBtn,
                                    verifyMutation.isPending && styles.disabledBtn,
                                ]}
                                onPress={() => handleVerifyPayment()}
                                disabled={verifyMutation.isPending}
                            >
                                <Text style={styles.verifyBtnText}>Verify</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* ── Current Package Section ── */}
                    <Text style={styles.sectionTitle}>Current Package</Text>
                    {(packages as UserPackage[]).filter((p) => p.isValid).length > 0 ? (
                        (packages as UserPackage[])
                            .filter((p) => p.isValid)
                            .map(renderCurrentPackage)
                    ) : (
                        <View style={styles.emptyContainer}>
                            <Ionicons name="gift-outline" size={48} color="#DDD" />
                            <Text style={styles.emptyText}>You do not have an active package yet.</Text>
                        </View>
                    )}

                    {/* ── Buy Package Section ── */}
                    <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Package</Text>

                    {/* Tier switcher */}
                    <View style={styles.switcher}>
                        {TIERS.map((tier) => {
                            const isActive = tier.type === selectedTierType;
                            return (
                                <TouchableOpacity
                                    key={tier.type}
                                    style={[
                                        styles.switcherTab,
                                        isActive && { backgroundColor: tier.color },
                                    ]}
                                    onPress={() => {
                                        setSelectedTierType(tier.type);
                                        setDetailsExpanded(false);
                                    }}
                                    activeOpacity={0.8}
                                >
                                    <Ionicons
                                        name={tier.icon as any}
                                        size={15}
                                        color={isActive ? '#fff' : '#888'}
                                    />
                                    <Text
                                        style={[
                                            styles.switcherTabText,
                                            isActive
                                                ? styles.switcherTabTextActive
                                                : styles.switcherTabTextInactive,
                                        ]}
                                    >
                                        {tier.label}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    {/* Package card for selected tier */}
                    {selectedDefinition ? (
                        <View style={[styles.planCard, { borderColor: selectedTier.color + '40' }]}>
                            {/* Card header */}
                            <View style={styles.planHeader}>
                                <View style={[styles.planIconWrap, { backgroundColor: selectedTier.bg }]}>
                                    <Ionicons
                                        name={selectedTier.icon as any}
                                        size={24}
                                        color={selectedTier.color}
                                    />
                                </View>
                                <View style={{ flex: 1, marginLeft: 12 }}>
                                    <Text style={styles.planName}>{selectedTier.label} Package</Text>
                                    <Text style={[styles.planPostCount, { color: selectedTier.color }]}>
                                        {selectedPostCount} {selectedTier.postLabel}
                                    </Text>
                                </View>
                                <Text style={styles.planPrice}>
                                    {formatEtb(getPackagePrice(selectedDefinition))}
                                </Text>
                            </View>

                            {/* Details accordion */}
                            <TouchableOpacity
                                style={styles.accordionHeader}
                                onPress={() => setDetailsExpanded((v) => !v)}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.accordionHeaderText}>View Details & Bonuses</Text>
                                <Ionicons
                                    name={detailsExpanded ? 'chevron-up' : 'chevron-down'}
                                    size={18}
                                    color={selectedTier.color}
                                />
                            </TouchableOpacity>

                            {detailsExpanded && (
                                <View style={styles.accordionBody}>
                                    {getFeaturesForTier(selectedTier.type, selectedDefinition).map((feat, idx) => (
                                        <View key={idx} style={styles.featureRow}>
                                            <View
                                                style={[
                                                    styles.featureDot,
                                                    { backgroundColor: selectedTier.color },
                                                ]}
                                            />
                                            <View style={{ flex: 1 }}>
                                                <Text style={styles.featureValue}>{feat.value}</Text>
                                                <Text style={styles.featureDesc}>{feat.desc}</Text>
                                            </View>
                                        </View>
                                    ))}
                                </View>
                            )}

                            {/* Buy / already-have block */}
                            {hasActivePackage ? (
                                <View style={styles.alreadyHaveContainer}>
                                    <Ionicons name="warning-outline" size={18} color="#D48800" />
                                    <Text style={styles.alreadyHaveText}>
                                        You already have an active package.
                                    </Text>
                                </View>
                            ) : (
                                <TouchableOpacity
                                    style={[
                                        styles.buyBtn,
                                        { backgroundColor: selectedTier.color },
                                        purchaseMutation.isPending && styles.disabledBtn,
                                    ]}
                                    onPress={() =>
                                        handleBuyPackage(selectedDefinition, selectedTierType)
                                    }
                                    disabled={purchaseMutation.isPending}
                                    activeOpacity={0.85}
                                >
                                    {purchaseMutation.isPending &&
                                    purchasingType === selectedTierType ? (
                                        <ActivityIndicator color="#fff" />
                                    ) : (
                                        <Text style={styles.buyBtnText}>
                                            Buy {selectedTier.label} Package
                                        </Text>
                                    )}
                                </TouchableOpacity>
                            )}
                        </View>
                    ) : (
                        <View style={styles.emptyContainer}>
                            <Ionicons name="alert-circle-outline" size={48} color="#DDD" />
                            <Text style={styles.emptyText}>
                                No {selectedTier.label} package available.
                            </Text>
                        </View>
                    )}
                </ScrollView>
            )}
        </SafeAreaView>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F5F7FA' },

    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 15,
        paddingVertical: 12,
        backgroundColor: '#fff',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 3,
    },
    backBtn: { padding: 8 },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#111' },

    // Layout
    content: { padding: 16, paddingBottom: 40 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    sectionTitle: { fontSize: 15, fontWeight: '800', color: '#222', marginBottom: 12 },

    // Pending banner
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
    verifyBtn: {
        backgroundColor: '#222',
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 10,
    },
    verifyBtnText: { color: '#fff', fontWeight: '700' },

    // Active package card
    activeCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 5,
    },
    activeCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 14,
    },
    tierBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 20,
        gap: 5,
    },
    tierBadgeText: { fontSize: 13, fontWeight: '700' },
    statusPill: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
        gap: 5,
    },
    activePill: { backgroundColor: '#E6F4EA' },
    inactivePill: { backgroundColor: '#FEEBEB' },
    statusDot: { width: 6, height: 6, borderRadius: 3 },
    statusPillText: { fontSize: 11, fontWeight: 'bold' },
    postsRow: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 14,
        flexWrap: 'wrap',
    },
    postCountBox: {
        flex: 1,
        minWidth: 90,
        backgroundColor: '#F8F9FA',
        borderRadius: 12,
        padding: 12,
        alignItems: 'center',
    },
    postCountNum: { fontSize: 22, fontWeight: '800' },
    postCountLabel: { fontSize: 12, fontWeight: '600', color: '#333', marginTop: 2 },
    postCountSub: { fontSize: 10, color: '#888', marginTop: 1 },
    lifetimeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
    },
    lifetimeText: { fontSize: 12, color: '#888' },

    // Empty state
    emptyContainer: { justifyContent: 'center', alignItems: 'center', paddingVertical: 30 },
    emptyText: { marginTop: 10, color: '#AAA', textAlign: 'center', fontSize: 13 },

    // Tier switcher
    switcher: {
        flexDirection: 'row',
        backgroundColor: '#EFEFEF',
        borderRadius: 14,
        padding: 4,
        marginBottom: 16,
        gap: 4,
    },
    switcherTab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 9,
        borderRadius: 11,
        gap: 5,
    },
    switcherTabText: { fontSize: 13, fontWeight: '700' },
    switcherTabTextActive: { color: '#fff' },
    switcherTabTextInactive: { color: '#888' },

    // Plan card
    planCard: {
        backgroundColor: '#fff',
        borderRadius: 18,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1.5,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.07,
        shadowRadius: 5,
    },
    planHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 14,
    },
    planIconWrap: {
        width: 48,
        height: 48,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    planName: { fontSize: 17, fontWeight: '800', color: '#222' },
    planPostCount: { fontSize: 13, fontWeight: '700', marginTop: 2 },
    planPrice: { fontSize: 16, fontWeight: '800', color: THEME_COLOR },

    // Accordion
    accordionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 11,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: '#F0F0F0',
        marginBottom: 0,
    },
    accordionHeaderText: { fontSize: 13, fontWeight: '700', color: '#555' },
    accordionBody: {
        paddingTop: 14,
        paddingBottom: 4,
        gap: 12,
        marginBottom: 14,
    },
    featureRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10,
    },
    featureDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginTop: 5,
    },
    featureValue: { fontSize: 14, fontWeight: '700', color: '#222' },
    featureDesc: { fontSize: 12, color: '#666', marginTop: 2 },

    // Buy button
    buyBtn: {
        marginTop: 14,
        paddingVertical: 14,
        borderRadius: 14,
        alignItems: 'center',
    },
    buyBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
    disabledBtn: { opacity: 0.55 },

    // Already-have warning
    alreadyHaveContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFF9E6',
        borderColor: '#FFE0B2',
        borderWidth: 1,
        borderRadius: 12,
        paddingVertical: 13,
        marginTop: 14,
        gap: 8,
    },
    alreadyHaveText: { color: '#D48800', fontWeight: '700', fontSize: 13 },
});
