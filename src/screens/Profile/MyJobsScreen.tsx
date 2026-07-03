import React from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useJobsQuery } from '../../api/services/jobService';
import { useUserProfile } from '../../api/services/userService';
import { useAuthStore } from '../../store/useAuthStore';
import { format } from 'date-fns';

const THEME_COLOR = '#FF8C00';

export default function MyJobsScreen() {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const { data: profile } = useUserProfile();
    const { user, getUserRoles } = useAuthStore();
    const userId = user?._id || user?.id || profile?._id;

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

    const hasOperatorProfile = isOperator && (
        profile?.experience ||
        (profile?.machinesYouCanOperate && profile.machinesYouCanOperate.length > 0)
    );

    const renderItem = ({ item }: { item: any }) => {
        const applicantCount = item.appliedUsers?.length || 0;
        const myApplication = showApplied
            ? item.appliedUsers?.find((u: any) => {
                const uId = u.userId && typeof u.userId === 'object' ? (u.userId._id || u.userId.id) : u.userId;
                return uId === userId;
            })
            : null;

        return (
            <TouchableOpacity
                style={styles.card}
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

                {showApplied && myApplication?.isShortListed && (
                    <View style={styles.shortlistBadge}>
                        <Ionicons name="star" size={12} color="#F5A623" />
                        <Text style={styles.shortlistText}>Shortlisted</Text>
                    </View>
                )}

                {!showApplied && applicantCount > 0 && (
                    <View style={styles.applicantRow}>
                        <Ionicons name="people-outline" size={14} color={THEME_COLOR} />
                        <Text style={styles.applicantText}>{applicantCount} applicant{applicantCount !== 1 ? 's' : ''}</Text>
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

                <View style={styles.cardFooter}>
                    <Text style={styles.salary}>{item.salary}</Text>
                    <Text style={styles.date}>{format(new Date(item.createdAt), 'MMM dd, yyyy')}</Text>
                </View>
            </TouchableOpacity>
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

    const jobs = response?.jobs || [];
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
                ) : (
                    <View style={{ width: 40 }} />
                )}
            </View>

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
    applicantRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 },
    applicantText: { fontSize: 12, color: THEME_COLOR, fontWeight: '600' },
    detailsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 15 },
    detailTag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    detailTagText: { fontSize: 11, fontWeight: '600' },
    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#F0F0F0', paddingTop: 12 },
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
