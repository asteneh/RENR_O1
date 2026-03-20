import React, { useState, useMemo } from 'react';
import {
    View, Text, StyleSheet, FlatList, TextInput,
    TouchableOpacity, ActivityIndicator,
    RefreshControl
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useJobsQuery, useApplyToJobMutation } from '../../api/services/jobService';
import { useAuthStore } from '../../store/useAuthStore';
import { useNotificationStore } from '../../store/useNotificationStore';
import { cleanErrorMessage } from '../../utils/errorUtils';
import JobCard from '../../components/JobCard';

const THEME_COLOR = '#FF8C00';

export default function FindJobsScreen() {
    const navigation = useNavigation<any>();
    const insets = useSafeAreaInsets();
    const route = useRoute<any>();
    const { user, isAuthenticated } = useAuthStore();
    const { showAlert, showNotification } = useNotificationStore();

    const [searchTerm, setSearchTerm] = useState('');

    // Filters from navigation state (passed back from JobFiltersScreen)
    const filters = route.params?.filters || {};
    const selectedJobType = filters.jobType;
    const selectedMachineType = filters.machineType;

    // Data Fetching
    const {
        data: jobsData,
        isLoading: jobsLoading,
        refetch,
        isFetching
    } = useJobsQuery({
        jobStatus: 'Open',
        jobType: selectedJobType,
        machineType: selectedMachineType,
    });

    const applyMutation = useApplyToJobMutation();

    const filteredJobs = useMemo(() => {
        if (!jobsData?.jobs) return [];
        if (!searchTerm) return jobsData.jobs;

        const lowerSearch = searchTerm.toLowerCase();
        return jobsData.jobs.filter(job =>
            job.jobTitle.toLowerCase().includes(lowerSearch) ||
            job.companyName.toLowerCase().includes(lowerSearch) ||
            job.jobDescription?.toLowerCase().includes(lowerSearch)
        );
    }, [jobsData, searchTerm]);

    const handleApply = async (jobId: string, appliedUsers: any[]) => {
        const userId = user?.id || user?._id;

        showAlert(
            "Apply for Job",
            "Choose your application method:",
            [
                {
                    text: "Easy Apply",
                    onPress: async () => {
                        if (!isAuthenticated) {
                            return navigation.navigate('OperatorRegistration', { jobId });
                        }
                        if (appliedUsers.some(u => u.userId === userId)) {
                            return showAlert("Already Applied", "You have already applied for this position.");
                        }
                        try {
                            await applyMutation.mutateAsync({ jobId, userId });
                            showNotification("Application submitted successfully!", "success");
                        } catch (error: any) {
                            showNotification(cleanErrorMessage(error), "error");
                        }
                    },
                    style: 'default'
                },
                {
                    text: "Register & Apply",
                    onPress: () => navigation.navigate('OperatorRegistration', { jobId }),
                    style: 'default'
                },
                {
                    text: "Cancel",
                    style: "cancel"
                }
            ]
        );
    };

    const renderHeader = () => (
        <View>
            {/* Elegant Banner Section */}
            <View style={styles.banner}>
                <View style={styles.bannerContent}>
                    <Text style={styles.bannerTitle}>Find Machinery Operator Jobs</Text>
                    <Text style={styles.bannerSub}>Connect with top construction companies and start your next project today.</Text>

                    <TouchableOpacity
                        style={styles.joinBtn}
                        onPress={() => navigation.navigate('OperatorRegistration')}
                    >
                        <Text style={styles.joinBtnText}>Join as Operator</Text>
                    </TouchableOpacity>
                </View>
                <View style={styles.bannerIconContainer}>
                    <Ionicons name="construct" size={100} color="rgba(255,255,255,0.15)" />
                </View>
            </View>

            {/* Advanced Search & Filter */}
            <View style={styles.searchSection}>
                <View style={styles.searchContainer}>
                    <View style={styles.searchBar}>
                        <Ionicons name="search" size={20} color="#888" style={styles.searchIcon} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search by title, machine..."
                            placeholderTextColor="#888"
                            value={searchTerm}
                            onChangeText={setSearchTerm}
                        />
                        {searchTerm !== '' && (
                            <TouchableOpacity onPress={() => setSearchTerm('')}>
                                <Ionicons name="close-circle" size={18} color="#CCC" />
                            </TouchableOpacity>
                        )}
                    </View>
                    <TouchableOpacity
                        style={styles.filterBtn}
                        onPress={() => navigation.navigate('JobFilters', { currentFilters: filters })}
                    >
                        <Ionicons name="options-outline" size={24} color="#333" />
                        {(selectedJobType || selectedMachineType) && <View style={styles.filterDot} />}
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.listHeaderRow}>
                <Text style={styles.listTitle}>Latest Opportunities</Text>
                {isFetching && !jobsLoading && <ActivityIndicator size="small" color={THEME_COLOR} />}
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {jobsLoading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={THEME_COLOR} />
                </View>
            ) : (
                <FlatList
                    data={filteredJobs}
                    keyExtractor={(item) => item._id}
                    contentContainerStyle={[styles.listContent, { paddingBottom: Math.max(insets.bottom, 100) }]}
                    ListHeaderComponent={renderHeader}
                    renderItem={({ item }) => (
                        <JobCard
                            job={item}
                            isApplied={item.appliedUsers.some(u => u.userId === (user?.id || user?._id))}
                            isApplying={applyMutation.isPending && applyMutation.variables?.jobId === item._id}
                            onViewDetails={() => navigation.navigate('JobDetails', { jobId: item._id })}
                            onApply={() => handleApply(item._id, item.appliedUsers)}
                        />
                    )}
                    refreshControl={
                        <RefreshControl refreshing={isFetching} onRefresh={refetch} tintColor={THEME_COLOR} />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="briefcase-outline" size={60} color="#EEE" />
                            <Text style={styles.emptyTitle}>No Jobs Found</Text>
                            <Text style={styles.emptySub}>Try adjusting your filters or search term</Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FAFAFA' },
    banner: {
        backgroundColor: '#000',
        padding: 24,
        margin: 20,
        borderRadius: 24,
        flexDirection: 'row',
        position: 'relative',
        overflow: 'hidden',
    },
    bannerContent: { flex: 1, zIndex: 1 },
    bannerTitle: { fontSize: 22, fontWeight: 'bold', color: '#fff', marginBottom: 8 },
    bannerSub: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 20, lineHeight: 18 },
    bannerIconContainer: { position: 'absolute', right: -15, bottom: -20 },
    joinBtn: {
        backgroundColor: THEME_COLOR,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
        alignSelf: 'flex-start',
    },
    joinBtnText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
    searchSection: { paddingHorizontal: 20, marginBottom: 20 },
    searchContainer: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    searchBar: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 14,
        paddingHorizontal: 12,
        height: 52,
        elevation: 3,
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 2 },
    },
    searchIcon: { marginRight: 8 },
    searchInput: { flex: 1, fontSize: 15, color: '#333' },
    filterBtn: {
        width: 52,
        height: 52,
        backgroundColor: '#fff',
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 3,
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 2 },
    },
    filterDot: {
        position: 'absolute',
        top: 14,
        right: 14,
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: THEME_COLOR,
        borderWidth: 2,
        borderColor: '#fff',
    },
    listHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginHorizontal: 20,
        marginBottom: 15
    },
    listTitle: { fontSize: 18, fontWeight: 'bold', color: '#111' },
    listContent: { paddingBottom: 30 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyContainer: { alignItems: 'center', marginTop: 60, paddingHorizontal: 40 },
    emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#CCC', marginTop: 15 },
    emptySub: { fontSize: 14, color: '#999', textAlign: 'center', marginTop: 5 },
});
