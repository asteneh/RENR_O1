import React, { useMemo, useState } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity, Image,
    ActivityIndicator, RefreshControl, Linking, Modal, ScrollView,
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
import ZoomableImageModal from '../../components/common/ZoomableImageModal';

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
    const [selectedApplicant, setSelectedApplicant] = useState<JobApplicant | null>(null);
    const [isZoomModalVisible, setIsZoomModalVisible] = useState(false);
    const [zoomImage, setZoomImage] = useState('');

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
                <TouchableOpacity
                    style={styles.cardTop}
                    activeOpacity={0.7}
                    onPress={() => setSelectedApplicant(item)}
                >
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
                    <View style={styles.cardTopRight}>
                        {item.isShortListed && (
                            <View style={styles.shortlistBadge}>
                                <Ionicons name="star" size={12} color="#F5A623" />
                                <Text style={styles.shortlistBadgeText}>Shortlisted</Text>
                            </View>
                        )}
                        <Ionicons name="chevron-forward" size={18} color="#CCC" style={{ marginTop: 4 }} />
                    </View>
                </TouchableOpacity>

                <View style={styles.cardActions}>
                    <TouchableOpacity style={styles.detailBtn} onPress={() => setSelectedApplicant(item)}>
                        <Ionicons name="document-text-outline" size={15} color="#333" />
                        <Text style={styles.detailBtnText}>Detail</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.contactBtn} onPress={() => handleContact(item)}>
                        <Ionicons name="call-outline" size={15} color={THEME_COLOR} />
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
                                    size={15}
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

            {/* Applicant Details Modal */}
            <Modal
                visible={!!selectedApplicant}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setSelectedApplicant(null)}
            >
                <View style={styles.modalOverlay}>
                    <TouchableOpacity
                        style={styles.modalBackdrop}
                        activeOpacity={1}
                        onPress={() => setSelectedApplicant(null)}
                    />
                    <View style={styles.modalContent}>
                        {(() => {
                            if (!selectedApplicant) return null;
                            const activeApp = list.find(a => getApplicantId(a) === getApplicantId(selectedApplicant)) || selectedApplicant;
                            const user = activeApp.userId && typeof activeApp.userId === 'object' ? activeApp.userId : null;
                            const applicantId = getApplicantId(activeApp);
                            const fullName = user
                                ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Applicant'
                                : 'Applicant';
                            const isPending = shortlistMutation.isPending && pendingId === applicantId;
                            const location = [user?.subCity, user?.city, user?.region].filter(Boolean).join(', ');

                            return (
                                <>
                                    {/* Modal Header */}
                                    <View style={styles.modalHeader}>
                                        <View>
                                            <Text style={styles.modalTitle}>Applicant Details</Text>
                                            <Text style={styles.modalSubtitle} numberOfLines={1}>{jobTitle}</Text>
                                        </View>
                                        <TouchableOpacity
                                            style={styles.modalCloseBtn}
                                            onPress={() => setSelectedApplicant(null)}
                                        >
                                            <Ionicons name="close" size={20} color="#333" />
                                        </TouchableOpacity>
                                    </View>

                                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalScrollBody}>
                                        {/* Applicant Hero Profile */}
                                        <View style={styles.modalHeroCard}>
                                            <TouchableOpacity
                                                activeOpacity={0.8}
                                                onPress={() => {
                                                    if (user?.proflePic) {
                                                        setZoomImage(`${CONFIG.FILE_URL}/${user.proflePic}`);
                                                        setIsZoomModalVisible(true);
                                                    }
                                                }}
                                            >
                                                <Image
                                                    source={{
                                                        uri: user?.proflePic
                                                            ? `${CONFIG.FILE_URL}/${user.proflePic}`
                                                            : 'https://via.placeholder.com/80',
                                                    }}
                                                    style={styles.modalAvatar}
                                                />
                                            </TouchableOpacity>

                                            <View style={styles.modalHeroInfo}>
                                                <View style={styles.modalNameRow}>
                                                    <Text style={styles.modalName} numberOfLines={1}>{fullName}</Text>
                                                    {user?.isVerified && (
                                                        <Ionicons name="checkmark-circle" size={17} color={THEME_COLOR} />
                                                    )}
                                                </View>
                                                <View style={styles.modalPillsRow}>
                                                    <View style={styles.modalRolePill}>
                                                        <Text style={styles.modalRolePillText}>
                                                            {user?.userType || 'Operator'}
                                                        </Text>
                                                    </View>
                                                    <View
                                                        style={[
                                                            styles.modalStatusPill,
                                                            activeApp.isShortListed ? styles.modalStatusPillShortlisted : styles.modalStatusPillNew,
                                                        ]}
                                                    >
                                                        <Ionicons
                                                            name={activeApp.isShortListed ? "star" : "time-outline"}
                                                            size={12}
                                                            color={activeApp.isShortListed ? "#B78103" : "#666"}
                                                        />
                                                        <Text
                                                            style={[
                                                                styles.modalStatusPillText,
                                                                activeApp.isShortListed && styles.modalStatusPillTextShortlisted,
                                                            ]}
                                                        >
                                                            {activeApp.isShortListed ? 'Shortlisted' : 'Under Review'}
                                                        </Text>
                                                    </View>
                                                </View>
                                            </View>
                                        </View>

                                        {/* Professional Experience */}
                                        <View style={styles.modalSectionCard}>
                                            <View style={styles.modalSectionHeader}>
                                                <Ionicons name="briefcase-outline" size={18} color={THEME_COLOR} />
                                                <Text style={styles.modalSectionTitle}>Experience</Text>
                                            </View>
                                            <Text style={styles.modalExperienceText}>
                                                {user?.experience ? `${user.experience} of experience` : 'Not specified'}
                                            </Text>
                                        </View>

                                        {/* Machines Able to Operate */}
                                        <View style={styles.modalSectionCard}>
                                            <View style={styles.modalSectionHeader}>
                                                <Ionicons name="construct-outline" size={18} color={THEME_COLOR} />
                                                <Text style={styles.modalSectionTitle}>Machines Able to Operate</Text>
                                            </View>
                                            {Array.isArray(user?.machinesYouCanOperate) && user.machinesYouCanOperate.length > 0 ? (
                                                <View style={styles.machineChipsWrap}>
                                                    {user.machinesYouCanOperate.map((machine: any, index: number) => {
                                                        const label = typeof machine === 'object'
                                                            ? (machine.name || machine.title || machine._id)
                                                            : String(machine);
                                                        return (
                                                            <View key={index} style={styles.modalChip}>
                                                                <Text style={styles.modalChipText}>{label}</Text>
                                                            </View>
                                                        );
                                                    })}
                                                </View>
                                            ) : (
                                                <Text style={styles.modalEmptySubtext}>No machinery skills specified.</Text>
                                            )}
                                        </View>

                                        {/* Legal Documents */}
                                        <View style={styles.modalSectionCard}>
                                            <View style={styles.modalSectionHeader}>
                                                <Ionicons name="document-attach-outline" size={18} color={THEME_COLOR} />
                                                <Text style={styles.modalSectionTitle}>Certifications & Documents</Text>
                                            </View>
                                            {Array.isArray(user?.legalDocuments) && user.legalDocuments.length > 0 ? (
                                                <View style={styles.documentsContainer}>
                                                    {user.legalDocuments.map((doc: any, index: number) => (
                                                        <View key={index} style={styles.documentItem}>
                                                            <View style={styles.docLeft}>
                                                                <Ionicons name="document-text" size={20} color={THEME_COLOR} />
                                                                <Text style={styles.docName} numberOfLines={1}>
                                                                    {doc.name || `Document ${index + 1}`}
                                                                </Text>
                                                            </View>
                                                            {Boolean(doc.path) && (
                                                                <TouchableOpacity
                                                                    style={styles.docActionBtn}
                                                                    onPress={() => Linking.openURL(`${CONFIG.FILE_URL}/${doc.path}`)}
                                                                >
                                                                    <Text style={styles.docActionBtnText}>View File</Text>
                                                                    <Ionicons name="open-outline" size={13} color="#FFF" />
                                                                </TouchableOpacity>
                                                            )}
                                                        </View>
                                                    ))}
                                                </View>
                                            ) : (
                                                <Text style={styles.modalEmptySubtext}>No documents uploaded.</Text>
                                            )}
                                        </View>

                                        {/* Contact & Location */}
                                        <View style={styles.modalSectionCard}>
                                            <View style={styles.modalSectionHeader}>
                                                <Ionicons name="call-outline" size={18} color={THEME_COLOR} />
                                                <Text style={styles.modalSectionTitle}>Contact & Location</Text>
                                            </View>
                                            {!!user?.phoneNumber && (
                                                <View style={styles.modalContactRow}>
                                                    <View style={styles.contactItemLeft}>
                                                        <Text style={styles.contactLabel}>Phone Number</Text>
                                                        <Text style={styles.contactValue}>{user.phoneNumber}</Text>
                                                    </View>
                                                    <View style={styles.contactActionButtons}>
                                                        <TouchableOpacity
                                                            style={styles.miniCallBtn}
                                                            onPress={() => Linking.openURL(`tel:${user.phoneNumber}`)}
                                                        >
                                                            <Ionicons name="call" size={14} color={THEME_COLOR} />
                                                            <Text style={styles.miniCallBtnText}>Call</Text>
                                                        </TouchableOpacity>
                                                        <TouchableOpacity
                                                            style={styles.miniCallBtn}
                                                            onPress={() => Linking.openURL(`sms:${user.phoneNumber}`)}
                                                        >
                                                            <Ionicons name="chatbubble-outline" size={14} color={THEME_COLOR} />
                                                            <Text style={styles.miniCallBtnText}>SMS</Text>
                                                        </TouchableOpacity>
                                                    </View>
                                                </View>
                                            )}
                                            {!!user?.email && (
                                                <View style={[styles.modalContactRow, { marginTop: 10 }]}>
                                                    <View style={styles.contactItemLeft}>
                                                        <Text style={styles.contactLabel}>Email</Text>
                                                        <Text style={styles.contactValue}>{user.email}</Text>
                                                    </View>
                                                </View>
                                            )}
                                            {Boolean(location) && (
                                                <View style={[styles.modalContactRow, { marginTop: 10 }]}>
                                                    <View style={styles.contactItemLeft}>
                                                        <Text style={styles.contactLabel}>Location</Text>
                                                        <Text style={styles.contactValue}>{location}</Text>
                                                    </View>
                                                </View>
                                            )}
                                            {!!activeApp.createdAt && (
                                                <View style={[styles.modalContactRow, { marginTop: 10 }]}>
                                                    <View style={styles.contactItemLeft}>
                                                        <Text style={styles.contactLabel}>Applied Date</Text>
                                                        <Text style={styles.contactValue}>{formatPostDate(activeApp.createdAt)}</Text>
                                                    </View>
                                                </View>
                                            )}
                                        </View>

                                        {/* View Full Profile button */}
                                        <TouchableOpacity
                                            style={styles.viewFullProfileBtn}
                                            onPress={() => {
                                                setSelectedApplicant(null);
                                                navigation.navigate('UserProfile', {
                                                    userId: applicantId,
                                                    user,
                                                });
                                            }}
                                        >
                                            <Ionicons name="person-circle-outline" size={18} color={THEME_COLOR} />
                                            <Text style={styles.viewFullProfileBtnText}>View Public Profile</Text>
                                            <Ionicons name="chevron-forward" size={16} color={THEME_COLOR} />
                                        </TouchableOpacity>
                                    </ScrollView>

                                    {/* Modal Bottom Actions */}
                                    <View style={styles.modalBottomBar}>
                                        <TouchableOpacity
                                            style={styles.modalContactMainBtn}
                                            onPress={() => handleContact(activeApp)}
                                        >
                                            <Ionicons name="call" size={16} color={THEME_COLOR} />
                                            <Text style={styles.modalContactMainBtnText}>Contact</Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            style={[
                                                styles.modalShortlistMainBtn,
                                                activeApp.isShortListed && styles.modalShortlistMainBtnActive,
                                                isPending && styles.disabledBtn,
                                            ]}
                                            onPress={() => handleToggleShortlist(activeApp)}
                                            disabled={isPending}
                                        >
                                            {isPending ? (
                                                <ActivityIndicator size="small" color={activeApp.isShortListed ? THEME_COLOR : '#FFF'} />
                                            ) : (
                                                <>
                                                    <Ionicons
                                                        name={activeApp.isShortListed ? "star" : "star-outline"}
                                                        size={16}
                                                        color={activeApp.isShortListed ? THEME_COLOR : "#FFF"}
                                                    />
                                                    <Text
                                                        style={[
                                                            styles.modalShortlistMainBtnText,
                                                            activeApp.isShortListed && styles.modalShortlistMainBtnTextActive,
                                                        ]}
                                                    >
                                                        {activeApp.isShortListed ? 'Remove Shortlist' : 'Shortlist'}
                                                    </Text>
                                                </>
                                            )}
                                        </TouchableOpacity>
                                    </View>
                                </>
                            );
                        })()}
                    </View>
                </View>
            </Modal>

            <ZoomableImageModal
                visible={isZoomModalVisible}
                imageUri={zoomImage}
                onClose={() => setIsZoomModalVisible(false)}
            />
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
    cardTopRight: { alignItems: 'flex-end', gap: 6 },
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
        flexDirection: 'row', gap: 8, marginTop: 14,
        borderTopWidth: 1, borderTopColor: '#F2F2F2', paddingTop: 12,
    },
    detailBtn: {
        flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 5, paddingVertical: 10, borderRadius: 8,
        borderWidth: 1, borderColor: '#DDD', backgroundColor: '#F8F9FA',
    },
    detailBtnText: { fontSize: 13, fontWeight: '700', color: '#333' },
    contactBtn: {
        flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 5, paddingVertical: 10, borderRadius: 8,
        borderWidth: 1, borderColor: '#FFE0B2', backgroundColor: '#FFF8F0',
    },
    contactBtnText: { fontSize: 13, fontWeight: '700', color: THEME_COLOR },
    shortlistBtn: {
        flex: 1.1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 5, paddingVertical: 10, borderRadius: 8, backgroundColor: THEME_COLOR,
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

    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalBackdrop: {
        flex: 1,
    },
    modalContent: {
        backgroundColor: '#FFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '85%',
        paddingBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 10,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#111' },
    modalSubtitle: { fontSize: 12, color: '#888', marginTop: 2 },
    modalCloseBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#F0F0F0',
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalScrollBody: {
        paddingHorizontal: 20,
        paddingVertical: 16,
        gap: 14,
    },
    modalHeroCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF8F0',
        borderRadius: 14,
        padding: 14,
        borderWidth: 1,
        borderColor: '#FFE8CC',
    },
    modalAvatar: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#EAEAEA',
    },
    modalHeroInfo: {
        flex: 1,
        marginLeft: 14,
    },
    modalNameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    modalName: {
        fontSize: 17,
        fontWeight: 'bold',
        color: '#222',
    },
    modalPillsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 6,
    },
    modalRolePill: {
        backgroundColor: '#FFF',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#E8E8E8',
    },
    modalRolePillText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#555',
    },
    modalStatusPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },
    modalStatusPillShortlisted: {
        backgroundColor: '#FFF8E6',
        borderWidth: 1,
        borderColor: '#FFE0B2',
    },
    modalStatusPillNew: {
        backgroundColor: '#F0F0F0',
    },
    modalStatusPillText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#666',
    },
    modalStatusPillTextShortlisted: {
        color: '#B78103',
    },
    modalSectionCard: {
        backgroundColor: '#FFF',
        borderRadius: 12,
        padding: 14,
        borderWidth: 1,
        borderColor: '#EAEAEA',
    },
    modalSectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 10,
    },
    modalSectionTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333',
    },
    modalExperienceText: {
        fontSize: 14,
        color: '#444',
        lineHeight: 20,
    },
    machineChipsWrap: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    modalChip: {
        backgroundColor: '#FFF5E5',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#FFE0B2',
    },
    modalChipText: {
        fontSize: 12,
        fontWeight: '600',
        color: THEME_COLOR,
    },
    modalEmptySubtext: {
        fontSize: 13,
        color: '#999',
        fontStyle: 'italic',
    },
    documentsContainer: {
        gap: 8,
    },
    documentItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#F9F9F9',
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#EEE',
    },
    docLeft: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginRight: 10,
    },
    docName: {
        fontSize: 13,
        fontWeight: '600',
        color: '#333',
        flex: 1,
    },
    docActionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: THEME_COLOR,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 6,
    },
    docActionBtnText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#FFF',
    },
    modalContactRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    contactItemLeft: {
        flex: 1,
    },
    contactLabel: {
        fontSize: 11,
        color: '#888',
    },
    contactValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#222',
        marginTop: 2,
    },
    contactActionButtons: {
        flexDirection: 'row',
        gap: 8,
    },
    miniCallBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#FFF5E5',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#FFE0B2',
    },
    miniCallBtnText: {
        fontSize: 12,
        fontWeight: '700',
        color: THEME_COLOR,
    },
    viewFullProfileBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 12,
        borderRadius: 10,
        backgroundColor: '#FFF8F0',
        borderWidth: 1,
        borderColor: '#FFE0B2',
        marginVertical: 4,
    },
    viewFullProfileBtnText: {
        fontSize: 13,
        fontWeight: '700',
        color: THEME_COLOR,
    },
    modalBottomBar: {
        flexDirection: 'row',
        gap: 10,
        paddingHorizontal: 20,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
        backgroundColor: '#FFF',
    },
    modalContactMainBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 12,
        paddingHorizontal: 18,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#FFE0B2',
        backgroundColor: '#FFF8F0',
    },
    modalContactMainBtnText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: THEME_COLOR,
    },
    modalShortlistMainBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 12,
        borderRadius: 10,
        backgroundColor: THEME_COLOR,
    },
    modalShortlistMainBtnActive: {
        backgroundColor: '#FFF8E6',
        borderWidth: 1,
        borderColor: '#FFE0B2',
    },
    modalShortlistMainBtnText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#FFF',
    },
    modalShortlistMainBtnTextActive: {
        color: THEME_COLOR,
    },
});
