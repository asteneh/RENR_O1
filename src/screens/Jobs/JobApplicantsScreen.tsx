import React, { useMemo, useState } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity, Image,
    ActivityIndicator, RefreshControl, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import {
    useJobApplicantsQuery,
    useShortlistApplicantMutation,
    JobApplicant,
} from '../../api/services/jobService';
import { useNotificationStore } from '../../store/useNotificationStore';
import { cleanErrorMessage } from '../../utils/errorUtils';
import { CONFIG } from '../../config';
import { formatPostDate } from '../../utils/dateUtils';

const THEME_COLOR = '#FF8C00';

type FilterKey = 'all' | 'shortlisted' | 'new';

const FILTERS: { key: FilterKey; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'shortlisted', label: 'Shortlisted' },
    { key: 'new', label: 'Not Reviewed' },
];

const getApplicantId = (applicant: JobApplicant): string => {
    const user = applicant?.userId;
    if (user && typeof user === 'object') return user._id || user.id || '';
    return (user as string) || '';
};

export default function JobApplicantsScreen() {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const jobId: string = route.params?.jobId;
    const jobTitle: string = route.params?.jobTitle || 'Applicants';

    const { showNotification, showAlert } = useNotificationStore();
    const {
        data: applicants,
        isLoading,
        isFetching,
        refetch,
    } = useJobApplicantsQuery(jobId);
    const shortlistMutation = useShortlistApplicantMutation();

    const [activeFilter, setActiveFilter] = useState<FilterKey>('all');
    const [pendingId, setPendingId] = useState<string | null>(null);

    const list = applicants || [];

    const shortlistedCount = useMemo(
        () => list.filter(a => a.isShortListed).length,
        [list]
    );

    const filteredList = useMemo(() => {
        if (activeFilter === 'shortlisted') return list.filter(a => a.isShortListed);
        if (activeFilter === 'new') return list.filter(a => !a.isShortListed);
        return list;
    }, [list, activeFilter]);

    const handleToggleShortlist = (applicant: JobApplicant) => {
        const userId = getApplicantId(applicant);
        if (!userId) {
            showNotification('Applicant details are unavailable.', 'error');
            return;
        }

        setPendingId(userId);
        shortlistMutation.mutate(
            { jobId, userId, isShortListed: !applicant.isShortListed },
            {
                onSuccess: () => {
                    showNotification(
                        applicant.isShortListed
                            ? 'Applicant removed from shortlist'
                            : 'Applicant shortlisted',
                        'success'
                    );
                    setPendingId(null);
                },
                onError: (error: any) => {
                    showNotification(cleanErrorMessage(error), 'error');
                    setPendingId(null);
                },
            }
        );
    };

    const handleContact = (applicant: JobApplicant) => {
        const user = applicant?.userId;
        const phone = user && typeof user === 'object' ? user.phoneNumber : undefined;
        const name = user && typeof user === 'object'
            ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
            : 'this applicant';

        if (!phone) {
            showNotification('No phone number available for this applicant.', 'info');
            return;
        }

        showAlert(
            'Contact Applicant',
            `Reach out to ${name || 'this applicant'} at ${phone}.`,
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Call', onPress: () => Linking.openURL(`tel:${phone}`) },
                { text: 'SMS', onPress: () => Linking.openURL(`sms:${phone}`) },
            ]
        );
    };

    const renderApplicant = ({ item }: { item: JobApplicant }) => {
        const user = item.userId && typeof item.userId === 'object' ? item.userId : null;
        const applicantId = getApplicantId(item);
        const fullName = user
            ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Applicant'
            : 'Applicant';
        const machineCount = Array.isArray(user?.machinesYouCanOperate)
            ? user!.machinesYouCanOperate.length
            : 0;
        const isPending = shortlistMutation.isPending && pendingId === applicantId;

        return (
            <View style={styles.card}>
                <View style={styles.cardTop}>
                    <Image
                        source={{
                            uri: user?.proflePic
                                ? `${CONFIG.FILE_URL}/${user.proflePic}`
                                : 'https://via.placeholder.com/60',
                        }}
                        style={styles.avatar}
                    />
                    <View style={styles.identity}>
                        <View style={styles.nameRow}>
                            <Text style={styles.name} numberOfLines={1}>{fullName}</Text>
                            {user?.isVerified && (
                                <Ionicons name="checkmark-circle" size={16} color={THEME_COLOR} />
                            )}
                        </View>
                        {!!user?.phoneNumber && (
                            <Text style={styles.metaText}>{user.phoneNumber}</Text>
                        )}
                        {!!user?.experience && (
                            <Text style={styles.metaText}>Experience: {user.experience}</Text>
                        )}
                        {machineCount > 0 && (
                            <Text style={styles.metaText}>
                                {machineCount} machine{machineCount !== 1 ? 's' : ''} they can operate
                            </Text>
                        )}
                        {!!item.createdAt && (
                            <Text style={styles.appliedDate}>{formatPostDate(item.createdAt)}</Text>
                        )}
                    </View>
                    {item.isShortListed && (
                        <View style={styles.shortlistBadge}>
                            <Ionicons name="star" size={12} color="#F5A623" />
                            <Text style={styles.shortlistBadgeText}>Shortlisted</Text>
                        </View>
                    )}
                </View>

                <View style={styles.cardActions}>
                    <TouchableOpacity style={styles.contactBtn} onPress={() => handleContact(item)}>
                        <Ionicons name="call-outline" size={16} color={THEME_COLOR} />
                        <Text style={styles.contactBtnText}>Contact</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[
                            styles.shortlistBtn,
                            item.isShortListed && styles.shortlistBtnActive,
                            isPending && styles.disabledBtn,
                        ]}
                        onPress={() => handleToggleShortlist(item)}
                        disabled={isPending}
                    >
                        {isPending ? (
                            <ActivityIndicator size="small" color={item.isShortListed ? THEME_COLOR : '#FFF'} />
                        ) : (
                            <>
                                <Ionicons
                                    name={item.isShortListed ? 'star' : 'star-outline'}
                                    size={16}
                                    color={item.isShortListed ? THEME_COLOR : '#FFF'}
                                />
                                <Text
                                    style={[
                                        styles.shortlistBtnText,
                                        item.isShortListed && styles.shortlistBtnTextActive,
                                    ]}
                                >
                                    {item.isShortListed ? 'Remove' : 'Shortlist'}
                                </Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <View style={styles.headerTitles}>
                    <Text style={styles.headerTitle}>Applications</Text>
                    <Text style={styles.headerSubtitle} numberOfLines={1}>{jobTitle}</Text>
                </View>
                <View style={{ width: 40 }} />
            </View>

            <View style={styles.summaryRow}>
                <View style={styles.summaryCard}>
                    <Text style={styles.summaryValue}>{list.length}</Text>
                    <Text style={styles.summaryLabel}>Total</Text>
                </View>
                <View style={styles.summaryCard}>
                    <Text style={styles.summaryValue}>{shortlistedCount}</Text>
                    <Text style={styles.summaryLabel}>Shortlisted</Text>
                </View>
                <View style={styles.summaryCard}>
                    <Text style={styles.summaryValue}>{list.length - shortlistedCount}</Text>
                    <Text style={styles.summaryLabel}>Not Reviewed</Text>
                </View>
            </View>

            <View style={styles.filterRow}>
                {FILTERS.map(filter => (
                    <TouchableOpacity
                        key={filter.key}
                        style={[styles.filterChip, activeFilter === filter.key && styles.filterChipActive]}
                        onPress={() => setActiveFilter(filter.key)}
                    >
                        <Text
                            style={[
                                styles.filterChipText,
                                activeFilter === filter.key && styles.filterChipTextActive,
                            ]}
                        >
                            {filter.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {isLoading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={THEME_COLOR} />
                </View>
            ) : (
                <FlatList
                    data={filteredList}
                    keyExtractor={(item, index) => item._id || getApplicantId(item) || String(index)}
                    renderItem={renderApplicant}
                    contentContainerStyle={styles.list}
                    refreshControl={
                        <RefreshControl refreshing={isFetching} onRefresh={refetch} tintColor={THEME_COLOR} />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="people-outline" size={64} color="#DDD" />
                            <Text style={styles.emptyTitle}>No applications yet</Text>
                            <Text style={styles.emptyText}>
                                {activeFilter === 'all'
                                    ? 'When operators apply to this job, they will appear here.'
                                    : 'No applicants match this filter.'}
                            </Text>
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
        borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
    },
    headerBtn: { padding: 8, width: 40 },
    headerTitles: { flex: 1, alignItems: 'center' },
    headerTitle: { fontSize: 17, fontWeight: 'bold', color: '#111' },
    headerSubtitle: { fontSize: 12, color: '#888', marginTop: 2 },
    summaryRow: {
        flexDirection: 'row', gap: 10, paddingHorizontal: 15,
        paddingTop: 15, paddingBottom: 5,
    },
    summaryCard: {
        flex: 1, backgroundColor: '#fff', borderRadius: 12,
        paddingVertical: 12, alignItems: 'center',
        borderWidth: 1, borderColor: '#F0F0F0',
    },
    summaryValue: { fontSize: 18, fontWeight: 'bold', color: THEME_COLOR },
    summaryLabel: { fontSize: 11, color: '#888', marginTop: 2 },
    filterRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 15, paddingVertical: 12 },
    filterChip: {
        paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
        backgroundColor: '#EEF1F4',
    },
    filterChipActive: { backgroundColor: THEME_COLOR },
    filterChipText: { fontSize: 12, color: '#666', fontWeight: '600' },
    filterChipTextActive: { color: '#fff' },
    list: { paddingHorizontal: 15, paddingBottom: 30 },
    card: {
        backgroundColor: '#fff', borderRadius: 12, padding: 15, marginBottom: 12,
        elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08, shadowRadius: 3,
    },
    cardTop: { flexDirection: 'row', alignItems: 'flex-start' },
    avatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#EEE' },
    identity: { flex: 1, marginLeft: 12 },
    nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    name: { fontSize: 15, fontWeight: 'bold', color: '#222', flexShrink: 1 },
    metaText: { fontSize: 12, color: '#666', marginTop: 2 },
    appliedDate: { fontSize: 11, color: '#999', marginTop: 4 },
    shortlistBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        backgroundColor: '#FFF8E6', paddingHorizontal: 8, paddingVertical: 4,
        borderRadius: 6,
    },
    shortlistBadgeText: { fontSize: 10, fontWeight: '700', color: '#F5A623' },
    cardActions: {
        flexDirection: 'row', gap: 10, marginTop: 14,
        borderTopWidth: 1, borderTopColor: '#F2F2F2', paddingTop: 12,
    },
    contactBtn: {
        flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 6, paddingVertical: 10, borderRadius: 8,
        borderWidth: 1, borderColor: '#FFE0B2', backgroundColor: '#FFF8F0',
    },
    contactBtnText: { fontSize: 13, fontWeight: '700', color: THEME_COLOR },
    shortlistBtn: {
        flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 6, paddingVertical: 10, borderRadius: 8, backgroundColor: THEME_COLOR,
    },
    shortlistBtnActive: {
        backgroundColor: '#FFF8E6', borderWidth: 1, borderColor: '#FFE0B2',
    },
    shortlistBtnText: { fontSize: 13, fontWeight: '700', color: '#fff' },
    shortlistBtnTextActive: { color: THEME_COLOR },
    disabledBtn: { opacity: 0.7 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyContainer: { alignItems: 'center', marginTop: 80, paddingHorizontal: 40 },
    emptyTitle: { fontSize: 16, fontWeight: 'bold', color: '#999', marginTop: 15 },
    emptyText: { fontSize: 13, color: '#AAA', textAlign: 'center', marginTop: 6, lineHeight: 19 },
});
