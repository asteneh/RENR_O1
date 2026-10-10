import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import {
    useJobsQuery,
    useDeleteJobMutation,
    useBatchJobNotificationPreferenceMutation,
    useBatchWithdrawMutation,
    useCloseJobOfferMutation,
    useGlobalJobNotificationPreferenceMutation,
    useJobNotificationStatusQuery,
} from '../../api/services/jobService';
import { useUserProfile } from '../../api/services/userService';
import { useAuthStore } from '../../store/useAuthStore';
import { useNotificationStore } from '../../store/useNotificationStore';
import { format } from 'date-fns';
import { cleanErrorMessage } from '../../utils/errorUtils';

const THEME_COLOR = '#FF8C00';

export default function MyJobsScreen() {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const { data: profile } = useUserProfile();
    const { user, getUserRoles } = useAuthStore();
    const { showAlert } = useNotificationStore();
    const userId = user?._id || user?.id || profile?._id;
    const deleteJobMutation = useDeleteJobMutation();
    const batchNotificationMutation = useBatchJobNotificationPreferenceMutation();
    const batchWithdrawMutation = useBatchWithdrawMutation();
    const closeOfferMutation = useCloseJobOfferMutation();
    const globalNotificationMutation = useGlobalJobNotificationPreferenceMutation();
    const { showNotification } = useNotificationStore();

    // Batch selection — instead of withdrawing / switching notifications one
    // job at a time, the operator picks many jobs and acts once.
    const [selectionMode, setSelectionMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    const isOperator =
        getUserRoles().includes('OPERATOR') ||
        profile?.userType === 'Operator' ||
        profile?.userType === 'employee (Operator)' ||
        (Array.isArray(profile?.userType) && profile.userType.includes('Operator'));

    const mode = route.params?.mode || (isOperator ? 'applied' : 'posted');
    const showApplied = mode === 'applied';

    const { data: response, isLoading } = useJobsQuery(
        showApplied ? { userId } : { postedBy: userId }
    );
    const jobs = response?.jobs || [];

    // Global job-notification switch. After a "select all" withdraw it is
    // OFF, and the "Need Notification" banner below is how the operator
    // turns future job notifications back on.
    const { data: notificationStatus } = useJobNotificationStatusQuery(
        showApplied && userId ? userId : undefined,
    );
    const jobNotificationsOff = notificationStatus?.notificationsEnabled === false;

    const handleNeedNotification = () => {
        if (!userId) return;
        globalNotificationMutation.mutate(
            { userId, enabled: true },
            {
                onSuccess: (data: any) =>
                    showNotification(
                        data?.message || 'Job notifications turned on. You will get job notifications again.',
                        'success',
                    ),
                onError: (error: any) => showNotification(cleanErrorMessage(error), 'error'),
            },
        );
    };

    const hasOperatorProfile = isOperator && (
        profile?.experience ||
        (profile?.machinesYouCanOperate && profile.machinesYouCanOperate.length > 0)
    );

    // The operator's own application entry on a job (or null).
    const findMyApplication = (item: any) =>
        item?.appliedUsers?.find((u: any) => {
            const uId = u.userId && typeof u.userId === 'object' ? (u.userId._id || u.userId.id) : u.userId;
            return uId === userId;
        });

    // Jobs eligible for the batch actions: applied to, and not already filled.
    // A hired job's alerts are stopped for good, so it stays out of the batch.
    const isSelectableJob = (item: any) => {
        const application = findMyApplication(item);
        return Boolean(application) && application.status !== 'Hired';
    };

    const handleEditJob = (item: any) => {
        navigation.navigate('PostJob', { job: item });
    };

    const handleViewApplicants = (item: any) => {
        navigation.navigate('JobApplicants', { jobId: item._id, jobTitle: item.jobTitle });
    };

    const handleDeleteJob = (item: any) => {
        showAlert(
            'Delete Job',
            `Are you sure you want to delete "${item.jobTitle}"? This action cannot be undone.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => deleteJobMutation.mutate(item._id),
                },
            ]
        );
    };

    // ── Batch actions ────────────────────────────────────────────────────────
    // Withdraw and notification on/off run as ONE batch request over every
    // selected job instead of one request per job.

    const toggleJobSelection = (jobId: string) => {
        setSelectedIds((prev) =>
            prev.includes(jobId) ? prev.filter((id) => id !== jobId) : [...prev, jobId],
        );
    };

    const selectableJobIds = jobs.filter(isSelectableJob).map((item: any) => item._id);
    const allSelected = selectableJobIds.length > 0 && selectedIds.length === selectableJobIds.length;

    const handleSelectAll = () => {
        setSelectedIds(allSelected ? [] : selectableJobIds);
    };

    // The batch button offers to switch notifications ON only when every
    // selected job is currently muted; otherwise it turns them OFF.
    const selectedApplications = jobs
        .filter((item: any) => selectedIds.includes(item._id))
        .map(findMyApplication)
        .filter(Boolean);
    const turnNotificationsOn =
        selectedApplications.length > 0 &&
        selectedApplications.every((app: any) => app.notificationsEnabled === false);

    // Batch withdraw: ONE request withdraws every selected application.
    // "Select all" → withdraw additionally stops FUTURE job notifications
    // (global switch), announced by the "You will not get job notification
    // after this" message.
    const handleBatchWithdraw = () => {
        if (!userId || selectedIds.length === 0) return;
        const stopAllNotifications =
            allSelected && selectableJobIds.every((id) => selectedIds.includes(id));
        showAlert(
            'Withdraw Applications',
            stopAllNotifications
                ? `Remove all ${selectedIds.length} selected application${selectedIds.length !== 1 ? 's' : ''}? You will not get job notification after this. You can turn notifications back on anytime with the "Need Notification" button.`
                : `Remove ${selectedIds.length} application${selectedIds.length !== 1 ? 's' : ''} and stop notifications for those jobs?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Withdraw',
                    style: 'destructive',
                    onPress: () =>
                        batchWithdrawMutation.mutate(
                            { userId, jobIds: selectedIds, stopAllNotifications },
                            {
                                onSuccess: (data: any) => {
                                    showNotification(
                                        data?.message || 'Applications withdrawn. Notifications stopped.',
                                        'success',
                                    );
                                    setSelectedIds([]);
                                    setSelectionMode(false);
                                },
                                onError: (error: any) => showNotification(cleanErrorMessage(error), 'error'),
                            },
                        ),
                },
            ],
        );
    };

    // Batch notifications: ONE request flips the on/off switch for every
    // selected job. Reversible, so no confirmation needed.
    const handleBatchNotifications = () => {
        if (!userId || selectedIds.length === 0) return;
        const enabled = turnNotificationsOn;
        batchNotificationMutation.mutate(
            { userId, jobIds: selectedIds, enabled },
            {
                onSuccess: (data: any) => {
                    showNotification(
                        data?.message ||
                            (enabled
                                ? `Notifications turned on for ${selectedIds.length} job(s).`
                                : `Notifications turned off for ${selectedIds.length} job(s).`),
                        'success',
                    );
                },
                onError: (error: any) => showNotification(cleanErrorMessage(error), 'error'),
            },
        );
    };

    // Close a posted job and stop notifications for all applicants.
    const handleCloseOffer = (item: any) => {
        showAlert(
            'Close job offer',
            `Close "${item.jobTitle}"? No one can apply anymore and notifications stop for all applicants.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Close Offer',
                    style: 'destructive',
                    onPress: () =>
                        closeOfferMutation.mutate(item._id, {
                            onSuccess: (data: any) =>
                                showNotification(data?.message || 'Job offer closed.', 'success'),
                            onError: (error: any) => showNotification(cleanErrorMessage(error), 'error'),
                        }),
                },
            ],
        );
    };

    const renderItem = ({ item }: { item: any }) => {
        const applicantCount = item.appliedUsers?.length || 0;
        const myApplication = showApplied ? findMyApplication(item) : null;
        const selectable = showApplied && isSelectableJob(item);

        return (
            // NOTE: the card itself is a View, not a TouchableOpacity. Nesting a
            // Switch inside a touchable makes it swallow taps on iOS, so only the
            // header area navigates.
            <View style={styles.card}>
                {selectionMode && (
                    <TouchableOpacity
                        style={styles.checkboxRow}
                        onPress={() => selectable && toggleJobSelection(item._id)}
                        activeOpacity={0.7}
                        disabled={!selectable}
                    >
                        <Ionicons
                            name={selectedIds.includes(item._id) ? 'checkbox' : 'square-outline'}
                            size={22}
                            color={selectable ? THEME_COLOR : '#CCC'}
                        />
                        <Text style={[styles.checkboxText, !selectable && styles.checkboxTextDisabled]}>
                            {selectable ? 'Select for batch actions' : 'Not available for batch actions'}
                        </Text>
                    </TouchableOpacity>
                )}
                <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => navigation.navigate('Jobs', {
                        screen: 'JobDetails',
                        params: { jobId: item._id },
                    })}
                >
                    <View style={styles.cardHeader}>
                        <Text style={styles.title} numberOfLines={1}>{item.jobTitle}</Text>
                        <View style={[styles.statusBadge, { backgroundColor: item.jobStatus === 'Open' ? '#E6F4EA' : '#FEEFC3' }]}>
                            <Text style={[styles.statusText, { color: item.jobStatus === 'Open' ? '#1E8E3E' : '#B05E27' }]}>
                                {item.jobStatus}
                            </Text>
                        </View>
                    </View>

                    <Text style={styles.company}>{item.companyName}</Text>
                </TouchableOpacity>

                {showApplied && myApplication?.isShortListed && (
                    <View style={styles.shortlistBadge}>
                        <Ionicons name="star" size={12} color="#F5A623" />
                        <Text style={styles.shortlistText}>Shortlisted</Text>
                    </View>
                )}

                {showApplied && myApplication?.status === 'Hired' && (
                    <View style={[styles.shortlistBadge, { backgroundColor: '#E8F5E9' }]}>
                        <Ionicons name="checkmark-circle" size={12} color="#2E7D32" />
                        <Text style={[styles.shortlistText, { color: '#2E7D32' }]}>You got this job</Text>
                    </View>
                )}

                {/* Applied mode: withdraw + notification on/off happen in BATCH
                    from the selection bar, not per card. */}

                {!showApplied && (
                    <View style={styles.applicantRow}>
                        <Ionicons name="people-outline" size={14} color={THEME_COLOR} />
                        <Text style={styles.applicantText}>
                            {applicantCount > 0
                                ? `${applicantCount} application${applicantCount !== 1 ? 's' : ''} received`
                                : 'No applications yet'}
                        </Text>
                    </View>
                )}

                <View style={styles.detailsRow}>
                    <View style={[styles.detailTag, { backgroundColor: '#E8F0FE' }]}>
                        <Text style={[styles.detailTagText, { color: '#1967D2' }]}>{item.jobType}</Text>
                    </View>
                    <View style={[styles.detailTag, { backgroundColor: '#F1F3F4' }]}>
                        <Text style={[styles.detailTagText, { color: '#5F6368' }]}>{item.location}</Text>
                    </View>
                </View>

                {!showApplied && (
                    <TouchableOpacity
                        style={styles.viewApplicantsBtn}
                        onPress={() => handleViewApplicants(item)}
                    >
                        <Ionicons name="people" size={16} color="#fff" />
                        <Text style={styles.viewApplicantsText}>
                            View Applications{applicantCount > 0 ? ` (${applicantCount})` : ''}
                        </Text>
                        <Ionicons name="chevron-forward" size={16} color="#fff" />
                    </TouchableOpacity>
                )}

                <View style={styles.cardFooter}>
                    <View style={styles.cardFooterLeft}>
                        <Text style={styles.salary}>{item.salary}</Text>
                        <Text style={styles.date}>{format(new Date(item.createdAt), 'MMM dd, yyyy')}</Text>
                    </View>
                    {!showApplied && item.jobStatus !== 'Closed' && (
                        <TouchableOpacity
                            style={styles.closeOfferBtn}
                            onPress={() => handleCloseOffer(item)}
                            disabled={closeOfferMutation.isPending}
                        >
                            <Ionicons name="close-circle-outline" size={15} color="#EF4444" />
                            <Text style={styles.closeOfferBtnText}>Close offer & stop notifications</Text>
                        </TouchableOpacity>
                    )}

                    {!showApplied && (
                        <View style={styles.cardActions}>
                            <TouchableOpacity
                                style={styles.actionBtn}
                                onPress={() => handleEditJob(item)}
                            >
                                <Ionicons name="pencil" size={16} color={THEME_COLOR} />
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.actionBtn, styles.deleteBtn]}
                                onPress={() => handleDeleteJob(item)}
                                disabled={deleteJobMutation.isPending}
                            >
                                <Ionicons name="trash-outline" size={16} color="#EF4444" />
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </View>
        );
    };

    const renderOperatorRegistration = () => {
        if (!showApplied || !hasOperatorProfile) return null;

        return (
            <View style={styles.operatorCard}>
                <View style={styles.operatorCardHeader}>
                    <Ionicons name="construct" size={24} color={THEME_COLOR} />
                    <Text style={styles.operatorCardTitle}>Operator Registration</Text>
                    <View style={[styles.statusBadge, { backgroundColor: '#E6F4EA' }]}>
                        <Text style={[styles.statusText, { color: '#1E8E3E' }]}>Active</Text>
                    </View>
                </View>
                <Text style={styles.operatorCardSub}>
                    Your operator profile is registered. Employers can find you through the operator directory.
                </Text>
                {profile?.experience && (
                    <Text style={styles.operatorDetail}>Experience: {profile.experience}</Text>
                )}
            </View>
        );
    };

    const showEmpty = !isLoading && jobs.length === 0 && !hasOperatorProfile;

    return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>
                    {showApplied ? 'Applied Jobs' : 'My Posted Jobs'}
                </Text>
                {!showApplied ? (
                    <TouchableOpacity onPress={() => navigation.navigate('PostJob')} style={styles.addBtn}>
                        <Ionicons name="add-circle" size={28} color={THEME_COLOR} />
                    </TouchableOpacity>
                ) : jobs.length > 0 ? (
                    <TouchableOpacity
                        style={styles.addBtn}
                        onPress={() => {
                            setSelectionMode(!selectionMode);
                            setSelectedIds([]);
                        }}
                    >
                        <Text style={styles.selectBtnText}>{selectionMode ? 'Cancel' : 'Select'}</Text>
                    </TouchableOpacity>
                ) : (
                    <View style={{ width: 40 }} />
                )}
            </View>

            {/* "Need Notification" — shown once a select-all withdraw turned
                the global switch off. Stays visible even when the applied
                list below is empty. */}
            {showApplied && userId && jobNotificationsOff && (
                <View style={styles.notifyOffBar}>
                    <Ionicons name="notifications-off-outline" size={18} color="#B45309" />
                    <Text style={styles.notifyOffText}>
                        You will not get job notification after this.
                    </Text>
                    <TouchableOpacity
                        style={styles.needNotifyBtn}
                        onPress={handleNeedNotification}
                        disabled={globalNotificationMutation.isPending}
                    >
                        <Ionicons name="notifications-outline" size={14} color="#fff" />
                        <Text style={styles.needNotifyText}>Need Notification</Text>
                    </TouchableOpacity>
                </View>
            )}

            {showApplied && selectionMode && (
                <View style={styles.selectionBar}>
                    <Text style={styles.selectionCount}>
                        {selectedIds.length} of {selectableJobIds.length} selected
                    </Text>
                    <TouchableOpacity onPress={handleSelectAll}>
                        <Text style={styles.selectionAction}>{allSelected ? 'Clear' : 'Select all'}</Text>
                    </TouchableOpacity>
                </View>
            )}

            {isLoading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={THEME_COLOR} />
                </View>
            ) : (
                <FlatList
                    data={jobs}
                    renderItem={renderItem}
                    keyExtractor={item => item._id}
                    contentContainerStyle={styles.list}
                    ListHeaderComponent={renderOperatorRegistration}
                    ListEmptyComponent={
                        showEmpty ? (
                            <View style={styles.emptyContainer}>
                                <Ionicons name="briefcase-outline" size={64} color="#DDD" />
                                <Text style={styles.emptyText}>
                                    {showApplied ? "You haven't applied to any jobs yet." : "You haven't posted any jobs yet."}
                                </Text>
                                {showApplied && (
                                    <TouchableOpacity
                                        style={styles.findJobsBtn}
                                        onPress={() => navigation.navigate('Jobs', { screen: 'FindJobs' })}
                                    >
                                        <Text style={styles.findJobsBtnText}>Browse Jobs</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        ) : null
                    }
                />
            )}

            {/* Batch action bar — one request for every selected job. */}
            {showApplied && selectionMode && selectedIds.length > 0 && (
                <View style={styles.batchBar}>
                    <TouchableOpacity
                        style={[styles.batchBtn, styles.batchWithdrawBtn]}
                        onPress={handleBatchWithdraw}
                        disabled={batchWithdrawMutation.isPending}
                    >
                        <Ionicons name="close-circle-outline" size={16} color="#EF4444" />
                        <Text style={styles.batchWithdrawText}>Withdraw {selectedIds.length}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.batchBtn, turnNotificationsOn ? styles.batchNotifyBtnOn : styles.batchNotifyBtn]}
                        onPress={handleBatchNotifications}
                        disabled={batchNotificationMutation.isPending}
                    >
                        <Ionicons
                            name={turnNotificationsOn ? 'notifications' : 'notifications-off'}
                            size={16}
                            color="#fff"
                        />
                        <Text style={styles.batchNotifyText}>
                            {turnNotificationsOn ? 'Notif. on' : 'Notif. off'} ({selectedIds.length})
                        </Text>
                    </TouchableOpacity>
                </View>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F5F7FA' },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 15, paddingVertical: 12, backgroundColor: '#fff',
    },
    backBtn: { padding: 8 },
    addBtn: { padding: 8 },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#111' },
    list: { padding: 15 },
    card: {
        backgroundColor: '#fff', borderRadius: 12, padding: 15, marginBottom: 15,
        elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1, shadowRadius: 2,
    },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    title: { fontSize: 16, fontWeight: 'bold', color: '#333', flex: 1, marginRight: 10 },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    statusText: { fontSize: 12, fontWeight: 'bold' },
    company: { fontSize: 14, color: THEME_COLOR, fontWeight: '600', marginBottom: 10 },
    shortlistBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        backgroundColor: '#FFF8E6', alignSelf: 'flex-start',
        paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginBottom: 8,
    },
    shortlistText: { fontSize: 11, fontWeight: '700', color: '#F5A623' },
    selectBtnText: { color: THEME_COLOR, fontSize: 14, fontWeight: '700' },
    selectionBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingVertical: 10,
        backgroundColor: '#FFF8F0',
        borderBottomWidth: 1,
        borderBottomColor: '#FFE0B2',
    },
    selectionCount: { fontSize: 13, color: '#555', fontWeight: '600' },
    selectionAction: { fontSize: 13, color: THEME_COLOR, fontWeight: '700' },
    notifyOffBar: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 15,
        paddingVertical: 10,
        backgroundColor: '#FFF7ED',
        borderBottomWidth: 1,
        borderBottomColor: '#FED7AA',
    },
    notifyOffText: { flex: 1, fontSize: 12, color: '#92400E', fontWeight: '600' },
    needNotifyBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        backgroundColor: THEME_COLOR,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
    },
    needNotifyText: { color: '#fff', fontSize: 12, fontWeight: '700' },
    checkboxRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
    checkboxText: { fontSize: 13, color: '#555', fontWeight: '600' },
    checkboxTextDisabled: { color: '#BBB' },
    batchBar: {
        flexDirection: 'row',
        gap: 10,
        paddingHorizontal: 15,
        paddingTop: 10,
        paddingBottom: 12,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#EEEEEE',
    },
    batchBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 12,
        borderRadius: 10,
    },
    batchWithdrawBtn: { backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA' },
    batchWithdrawText: { color: '#EF4444', fontSize: 13, fontWeight: '700' },
    batchNotifyBtn: { backgroundColor: THEME_COLOR },
    batchNotifyBtnOn: { backgroundColor: '#1E8E3E' },
    batchNotifyText: { color: '#fff', fontSize: 13, fontWeight: '700' },
    closeOfferBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 10,
        borderRadius: 8,
        backgroundColor: '#FEF2F2',
        borderWidth: 1,
        borderColor: '#FECACA',
        marginBottom: 12,
    },
    closeOfferBtnText: { color: '#EF4444', fontSize: 13, fontWeight: '700' },
    applicantRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 },
    applicantText: { fontSize: 12, color: THEME_COLOR, fontWeight: '600' },
    viewApplicantsBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
        backgroundColor: THEME_COLOR, paddingVertical: 10, borderRadius: 8, marginBottom: 12,
    },
    viewApplicantsText: { color: '#fff', fontSize: 13, fontWeight: '700' },
    detailsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 15 },
    detailTag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    detailTagText: { fontSize: 11, fontWeight: '600' },
    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#F0F0F0', paddingTop: 12 },
    cardFooterLeft: { flex: 1 },
    cardActions: { flexDirection: 'row', gap: 8 },
    actionBtn: {
        width: 34, height: 34, borderRadius: 8, backgroundColor: '#FFF8F0',
        justifyContent: 'center', alignItems: 'center',
        borderWidth: 1, borderColor: '#FFE0B2',
    },
    deleteBtn: { backgroundColor: '#FEF2F2', borderColor: '#FECACA' },
    salary: { fontSize: 14, fontWeight: 'bold', color: '#333' },
    date: { fontSize: 12, color: '#888' },
    operatorCard: {
        backgroundColor: '#fff', borderRadius: 12, padding: 15, marginBottom: 15,
        borderWidth: 1, borderColor: '#FFE0B2',
    },
    operatorCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
    operatorCardTitle: { flex: 1, fontSize: 15, fontWeight: 'bold', color: '#333' },
    operatorCardSub: { fontSize: 13, color: '#666', lineHeight: 18 },
    operatorDetail: { fontSize: 12, color: '#888', marginTop: 6 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 100 },
    emptyText: { marginTop: 15, color: '#888', textAlign: 'center' },
    findJobsBtn: {
        marginTop: 20, backgroundColor: THEME_COLOR,
        paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10,
    },
    findJobsBtnText: { color: '#fff', fontWeight: 'bold' },
});
