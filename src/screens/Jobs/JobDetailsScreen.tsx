import React from 'react';
import {
    View, Text, StyleSheet, ScrollView,
    TouchableOpacity, ActivityIndicator, Share, Linking, Switch
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { JobsStackParamList } from '../../navigation/JobsNavigator';
import {
    useJobDetailQuery,
    useApplyToJobMutation,
    useJobNotificationPreferenceMutation,
    useWithdrawApplicationMutation,
    useRespondToOfferMutation,
    Job,
    JobApplicant,
} from '../../api/services/jobService';
import { useNotificationStore } from '../../store/useNotificationStore';
import { cleanErrorMessage } from '../../utils/errorUtils';
import { useAuthStore } from '../../store/useAuthStore';
import { UserRoles } from '../../constants/UserRoles';
import { formatPostDate } from '../../utils/dateUtils';

const THEME_COLOR = '#FF8C00';

type JobDetailsRouteProp = RouteProp<JobsStackParamList, 'JobDetails'>;

export default function JobDetailsScreen() {
    const navigation = useNavigation<any>();
    const route = useRoute<JobDetailsRouteProp>();
    const { jobId } = route.params;
    const { user, isAuthenticated, token, getUserRoles } = useAuthStore();
    const { showNotification, showAlert } = useNotificationStore();
    const insets = useSafeAreaInsets();

    const { data: job, isLoading } = useJobDetailQuery(jobId);
    const applyMutation = useApplyToJobMutation();
    const notificationMutation = useJobNotificationPreferenceMutation();
    const withdrawMutation = useWithdrawApplicationMutation();
    const respondMutation = useRespondToOfferMutation();

    const currentUserId = user?.id || user?._id;

    // This user's own application entry on the job (if any).
    const myApplication: JobApplicant | undefined = job?.appliedUsers?.find((u: any) => {
        const uId = u.userId && typeof u.userId === 'object' ? (u.userId._id || u.userId.id) : u.userId;
        return uId === currentUserId;
    });

    const isApplied = Boolean(myApplication);
    // Undefined means "not set" → treat as ON. Only an explicit false mutes.
    const notificationsOn = myApplication?.notificationsEnabled !== false;
    const myStatus = myApplication?.status;
    const hasOffer = myStatus === 'OfferSent' || myStatus === 'Shortlisted';
    const isHired = myStatus === 'Hired';

    // Once the role is filled there's nothing left to be alerted about.
    const isClosed = job?.jobStatus === 'Closed';
    const applicantCount = job?.appliedUsers?.length || 0;

    const isOwner = (() => {
        if (!job || !user) return false;
        const poster = job.postedBy;
        const posterId = poster && typeof poster === 'object' ? (poster._id || poster.id) : poster;
        return posterId === (user?.id || user?._id);
    })();

    const handleApply = async () => {
        if (isApplied) return showAlert("Already Applied", "You have already applied for this position.");

        if (!token) {
            showAlert("Login Required", "Please login to apply for this job.", [
                { text: "Cancel", style: "cancel" },
                { text: "Login", onPress: () => navigation.navigate('Login'), style: 'default' }
            ]);
            return;
        }

        const isOperator = user?.userType === 'Operator' || user?.roles?.includes('Operator') || getUserRoles().includes(UserRoles.OPERATOR);
        if (!isOperator) {
            showAlert("Operator Only", "Only registered operators can apply for jobs. Would you like to register as an operator?", [
                { text: "No", style: "cancel" },
                { text: "Register", onPress: () => navigation.navigate('OperatorRegistration', { jobId }), style: "default" }
            ]);
            return;
        }

        try {
            await applyMutation.mutateAsync({ jobId, userId: user?.id || user?._id });
            showNotification("Application sent successfully!", "success");
        } catch (error: any) {
            showNotification(cleanErrorMessage(error), "error");
        }
    };

    // "I don't want this offer" — silences SMS + notifications but keeps the
    // application, so the switch can be flipped back on later.
    const handleToggleNotifications = async (nextEnabled: boolean) => {
        if (!currentUserId) return;
        try {
            await notificationMutation.mutateAsync({
                jobId,
                userId: currentUserId,
                enabled: nextEnabled,
            });
            showNotification(
                nextEnabled
                    ? 'Notifications are back on for this job.'
                    : 'Notifications and SMS are off for this job.',
                'success',
            );
        } catch (error: any) {
            showNotification(cleanErrorMessage(error), 'error');
        }
    };

    // "Not interested" — removes the application AND stops notifications.
    const handleWithdraw = () => {
        if (!currentUserId) return;
        showAlert(
            'Withdraw Application',
            'This removes your application and stops all notifications for this job. You can apply again while the job is open.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Withdraw',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await withdrawMutation.mutateAsync({ jobId, userId: currentUserId });
                            showNotification('Application withdrawn. Notifications stopped.', 'success');
                        } catch (error: any) {
                            showNotification(cleanErrorMessage(error), 'error');
                        }
                    },
                },
            ],
        );
    };

    const handleRespondToOffer = (response: 'Accept' | 'Decline') => {
        if (!currentUserId) return;
        showAlert(
            response === 'Accept' ? 'Accept this job?' : 'Turn down this offer?',
            response === 'Accept'
                ? 'Accepting closes the job and stops notifications for it. The employer will contact you.'
                : 'Declining stops all notifications for this job.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: response === 'Accept' ? 'Accept' : 'Decline',
                    style: response === 'Accept' ? 'default' : 'destructive',
                    onPress: async () => {
                        try {
                            await respondMutation.mutateAsync({
                                jobId,
                                userId: currentUserId,
                                response,
                            });
                            showNotification(
                                response === 'Accept'
                                    ? 'Congratulations! You got this job.'
                                    : 'Offer declined. Notifications stopped.',
                                'success',
                            );
                        } catch (error: any) {
                            showNotification(cleanErrorMessage(error), 'error');
                        }
                    },
                },
            ],
        );
    };

    const handleShare = async () => {
        try {
            await Share.share({
                message: `Check out this job: ${job?.jobTitle} at ${job?.companyName}\nLocation: ${job?.location || 'Remote'}\nSalary: ${job?.salary || 'Negotiable'}\n\nDownload Gadal Market: https://play.google.com/store/apps/details?id=com.gadalmarket&pcampaignid=web_share`,
            });
        } catch (error: any) {
            showNotification(error.message, "error");
        }
    };

    const handleContactEmployer = () => {
        const employer = job?.postedBy;
        const employerId = employer?._id || employer;
        const phone = employer?.phoneNumber;

        if (phone) {
            showAlert(
                'Contact Employer',
                `Reach ${job?.companyName || 'the employer'} about this position.`,
                [
                    { text: 'Cancel', style: 'cancel' },
                    {
                        text: 'Call',
                        onPress: () => Linking.openURL(`tel:${phone}`),
                    },
                    {
                        text: 'Message',
                        onPress: () => navigation.navigate('Messages'),
                    },
                ]
            );
            return;
        }

        if (employerId) {
            navigation.navigate('Messages');
            return;
        }

        showNotification('Employer contact information is not available.', 'info');
    };

    if (isLoading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={THEME_COLOR} />
            </View>
        );
    }

    if (!job) {
        return (
            <View style={styles.center}>
                <Text>Job not found</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Job Details</Text>
                <TouchableOpacity style={styles.headerBtn} onPress={handleShare}>
                    <Ionicons name="share-outline" size={24} color="#333" />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.mainInfo}>
                    <Text style={styles.title}>{job.jobTitle}</Text>
                    <Text style={styles.company}>{job.companyName}</Text>

                    <View style={styles.tagRow}>
                        <View style={styles.tag}>
                            <Ionicons name="briefcase-outline" size={14} color={THEME_COLOR} />
                            <Text style={styles.tagText}>{job.jobType}</Text>
                        </View>
                        <View style={styles.tag}>
                            <Ionicons name="location-outline" size={14} color={THEME_COLOR} />
                            <Text style={styles.tagText}>{job.location || 'Remote'}</Text>
                        </View>
                        {Boolean(job.createdAt) && (
                            <View style={styles.tag}>
                                <Ionicons name="time-outline" size={14} color={THEME_COLOR} />
                                <Text style={styles.tagText}>{formatPostDate(job.createdAt)}</Text>
                            </View>
                        )}
                    </View>

                    <View style={styles.salaryContainer}>
                        <Ionicons name="cash-outline" size={20} color="#4CAF50" />
                        <Text style={styles.salaryText}>{job.salary || 'Negotiable'}</Text>
                    </View>
                </View>

                {isHired && (
                    <View style={[styles.statusBanner, styles.statusBannerSuccess]}>
                        <Ionicons name="checkmark-circle" size={20} color="#2E7D32" />
                        <Text style={[styles.statusBannerText, { color: '#2E7D32' }]}>
                            You got this job. Notifications for it are stopped.
                        </Text>
                    </View>
                )}

                {!isHired && isClosed && (
                    <View style={[styles.statusBanner, styles.statusBannerNeutral]}>
                        <Ionicons name="information-circle-outline" size={20} color="#5F6368" />
                        <Text style={[styles.statusBannerText, { color: '#5F6368' }]}>
                            This job is closed — the employer has finished hiring.
                        </Text>
                    </View>
                )}

                {hasOffer && (
                    <View style={[styles.statusBanner, styles.statusBannerOffer]}>
                        <Ionicons name="hand-left" size={20} color={THEME_COLOR} />
                        <Text style={[styles.statusBannerText, { color: '#B76900' }]}>
                            You have an offer for this job. Accept it below, or turn it down to stop notifications.
                        </Text>
                    </View>
                )}

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Description</Text>
                    <Text style={styles.sectionBody}>{job.jobDescription}</Text>
                </View>

                {job.jobRequirements && job.jobRequirements.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Requirements</Text>
                        {job.jobRequirements.map((req, index) => (
                            <View key={index} style={styles.bulletRow}>
                                <Ionicons name="checkmark-circle" size={18} color={THEME_COLOR} />
                                <Text style={styles.bulletText}>{req}</Text>
                            </View>
                        ))}
                    </View>
                )}

                {job.jobResponsiblities && job.jobResponsiblities.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Responsibilities</Text>
                        {job.jobResponsiblities.map((res, index) => (
                            <View key={index} style={styles.bulletRow}>
                                <View style={styles.dot} />
                                <Text style={styles.bulletText}>{res}</Text>
                            </View>
                        ))}
                    </View>
                )}
{/* ── Manage this application ── */}
                {isApplied && !isOwner && (
                    <View style={styles.manageCard}>
                        <Text style={styles.manageTitle}>Manage this application</Text>

                        {/* The "not want offer" toggle */}
                        <View style={styles.muteRow}>
                            <View style={styles.muteIconWrap}>
                                <Ionicons
                                    name={notificationsOn ? 'notifications-outline' : 'notifications-off-outline'}
                                    size={20}
                                    color={notificationsOn ? THEME_COLOR : '#999'}
                                />
                            </View>
                            <View style={styles.muteTextWrap}>
                                <Text style={styles.muteTitle}>
                                    {notificationsOn ? 'Job notifications on' : 'Notifications muted'}
                                </Text>
                                <Text style={styles.muteSub}>
                                    {isHired
                                        ? 'This job is filled, so alerts are stopped.'
                                        : notificationsOn
                                            ? 'Turn off SMS and alerts for this job only.'
                                            : 'You will not get SMS or alerts for this job.'}
                                </Text>
                            </View>
                            <Switch
                                value={notificationsOn}
                                onValueChange={handleToggleNotifications}
                                disabled={notificationMutation.isPending || isHired}
                                trackColor={{ false: '#DDD', true: THEME_COLOR }}
                                thumbColor="#fff"
                            />
                        </View>

                        {/* Withdraw — removes the application and stops alerts */}
                        {!isHired && (
                            <TouchableOpacity
                                style={styles.withdrawBtn}
                                onPress={handleWithdraw}
                                disabled={withdrawMutation.isPending}
                            >
                                {withdrawMutation.isPending ? (
                                    <ActivityIndicator color="#EF4444" size="small" />
                                ) : (
                                    <>
                                        <Ionicons name="close-circle-outline" size={18} color="#EF4444" />
                                        <Text style={styles.withdrawBtnText}>Not interested? Withdraw</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        )}
                    </View>
                )}
            </ScrollView>

            <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
                {isOwner ? (
                    <>
                        <TouchableOpacity
                            style={styles.viewApplicantsBtn}
                            onPress={() => navigation.navigate('JobApplicants', { jobId, jobTitle: job.jobTitle })}
                        >
                            <Ionicons name="people" size={18} color="#fff" />
                            <Text style={styles.viewApplicantsBtnText}>
                                View Applications{applicantCount > 0 ? ` (${applicantCount})` : ''}
                            </Text>
                            <Ionicons name="chevron-forward" size={16} color="#fff" />
                        </TouchableOpacity>
                        <View style={styles.ownerBanner}>
                            <Ionicons name="person-circle-outline" size={20} color={THEME_COLOR} />
                            <Text style={styles.ownerBannerText}>This is your job posting</Text>
                        </View>
                    </>
                ) : isApplied ? (
                    <>
                        {/* ── Offer actions ── */}
                        {hasOffer && (
                            <View style={styles.offerRow}>
                                <TouchableOpacity
                                    style={[styles.offerBtn, styles.acceptBtn, respondMutation.isPending && styles.disabledBtn]}
                                    onPress={() => handleRespondToOffer('Accept')}
                                    disabled={respondMutation.isPending}
                                >
                                    <Ionicons name="checkmark-circle" size={18} color="#fff" />
                                    <Text style={styles.offerBtnText}>Accept Job</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.offerBtn, styles.declineBtn, respondMutation.isPending && styles.disabledBtn]}
                                    onPress={() => handleRespondToOffer('Decline')}
                                    disabled={respondMutation.isPending}
                                >
                                    <Ionicons name="close-circle" size={18} color="#fff" />
                                    <Text style={styles.offerBtnText}>Turn Down</Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        <TouchableOpacity style={styles.contactBtn} onPress={handleContactEmployer}>
                            <Ionicons name="chatbubble-ellipses-outline" size={20} color="#fff" />
                            <Text style={styles.contactBtnText}>Contact Employer</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.applyBtn, styles.appliedBtn]}
                            disabled
                        >
                            <Text style={[styles.applyBtnText, styles.appliedBtnText]}>Applied</Text>
                        </TouchableOpacity>
                    </>
                ) : (
                    <TouchableOpacity
                        style={[
                            styles.applyBtn,
                            applyMutation.isPending && styles.disabledBtn
                        ]}
                        onPress={handleApply}
                        disabled={applyMutation.isPending}
                    >
                        {applyMutation.isPending ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.applyBtnText}>Apply Now</Text>
                        )}
                    </TouchableOpacity>
                )}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    headerBtn: { padding: 4 },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
    scrollContent: { padding: 20, paddingBottom: 100 },
    mainInfo: { marginBottom: 25 },
    title: { fontSize: 24, fontWeight: 'bold', color: '#111', marginBottom: 6 },
    company: { fontSize: 18, color: THEME_COLOR, fontWeight: '600', marginBottom: 15 },
    tagRow: { flexDirection: 'row', gap: 12, marginBottom: 15 },
    tag: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#F5F5F5',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8
    },
    tagText: { fontSize: 13, color: '#666', fontWeight: '500' },
    salaryContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#E8F5E9',
        padding: 12,
        borderRadius: 12,
    },
    salaryText: { fontSize: 18, fontWeight: 'bold', color: '#2E7D32' },
    section: { marginBottom: 25 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 12 },
    sectionBody: { fontSize: 15, color: '#555', lineHeight: 24 },
    bulletRow: { flexDirection: 'row', gap: 10, marginBottom: 10, alignItems: 'flex-start' },
    bulletText: { flex: 1, fontSize: 15, color: '#555', lineHeight: 22 },
    dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: THEME_COLOR, marginTop: 8 },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 20,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
    },
    applyBtn: {
        backgroundColor: '#000',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    applyBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    contactBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: THEME_COLOR,
        paddingVertical: 14,
        borderRadius: 12,
        marginBottom: 10,
    },
    contactBtnText: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
    appliedBtn: { backgroundColor: '#E8F5E9' },
    appliedBtnText: { color: '#4CAF50' },
    disabledBtn: { opacity: 0.7 },
    ownerBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 14,
        backgroundColor: '#FFF8F0',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#FFE0B2',
    },
    ownerBannerText: { color: THEME_COLOR, fontSize: 15, fontWeight: '700' },

    // ── Status banners ──
    statusBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        padding: 14,
        borderRadius: 12,
        marginBottom: 20,
    },
    statusBannerSuccess: { backgroundColor: '#E8F5E9' },
    statusBannerNeutral: { backgroundColor: '#F1F3F4' },
    statusBannerOffer: { backgroundColor: '#FFF8E1' },
    statusBannerText: { flex: 1, fontSize: 14, fontWeight: '600', lineHeight: 20 },

    // ── Manage application card ──
    manageCard: {
        backgroundColor: '#FFF8F0',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#FFE0B2',
        padding: 16,
        marginBottom: 10,
    },
    manageTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: '#B76900',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 12,
    },
    muteRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    muteIconWrap: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
    },
    muteTextWrap: { flex: 1 },
    muteTitle: { fontSize: 15, fontWeight: '700', color: '#333' },
    muteSub: { fontSize: 12, color: '#777', marginTop: 2, lineHeight: 17 },
    withdrawBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginTop: 14,
        paddingVertical: 12,
        borderRadius: 10,
        backgroundColor: '#FEF2F2',
        borderWidth: 1,
        borderColor: '#FECACA',
    },
    withdrawBtnText: { color: '#EF4444', fontSize: 14, fontWeight: '700' },

    // ── Offer accept / decline ──
    offerRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
    offerBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 14,
        borderRadius: 12,
    },
    acceptBtn: { backgroundColor: '#2E7D32' },
    declineBtn: { backgroundColor: '#EF4444' },
    offerBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },

    viewApplicantsBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: THEME_COLOR,
        paddingVertical: 14,
        borderRadius: 12,
        marginBottom: 10,
    },
    viewApplicantsBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
