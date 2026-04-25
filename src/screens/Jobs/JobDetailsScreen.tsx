import React from 'react';
import {
    View, Text, StyleSheet, ScrollView,
    TouchableOpacity, ActivityIndicator, Share
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { JobsStackParamList } from '../../navigation/JobsNavigator';
import { useJobDetailQuery, useApplyToJobMutation, Job } from '../../api/services/jobService';
import { useNotificationStore } from '../../store/useNotificationStore';
import { cleanErrorMessage } from '../../utils/errorUtils';
import { useAuthStore } from '../../store/useAuthStore';

const THEME_COLOR = '#FF8C00';

type JobDetailsRouteProp = RouteProp<JobsStackParamList, 'JobDetails'>;

export default function JobDetailsScreen() {
    const navigation = useNavigation<any>();
    const route = useRoute<JobDetailsRouteProp>();
    const { jobId } = route.params;
    const { user, isAuthenticated, token } = useAuthStore();
    const { showNotification, showAlert } = useNotificationStore();
    const insets = useSafeAreaInsets();

    const { data: job, isLoading } = useJobDetailQuery(jobId);
    const applyMutation = useApplyToJobMutation();

    const isApplied = job?.appliedUsers.some((u: any) => u.userId === (user?.id || user?._id));

    const handleApply = async () => {
        if (isApplied) return showAlert("Already Applied", "You have already applied for this position.");

        if (!token) {
            showAlert("Login Required", "Please login to apply for this job.", [
                { text: "Cancel", style: "cancel" },
                { text: "Login", onPress: () => navigation.navigate('Login'), style: 'default' }
            ]);
            return;
        }

        if (user?.userType !== 'Operator') {
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

    const handleShare = async () => {
        try {
            await Share.share({
                message: `Check out this job: ${job?.jobTitle} at ${job?.companyName}\nLocation: ${job?.location || 'Remote'}\nSalary: ${job?.salary || 'Negotiable'}\n\nDownload Gadal Market: https://play.google.com/store/apps/details?id=com.gadalmarket&pcampaignid=web_share`,
            });
        } catch (error: any) {
            showNotification(error.message, "error");
        }
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
                    </View>

                    <View style={styles.salaryContainer}>
                        <Ionicons name="cash-outline" size={20} color="#4CAF50" />
                        <Text style={styles.salaryText}>{job.salary || 'Negotiable'}</Text>
                    </View>
                </View>

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
            </ScrollView>

            <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
                <TouchableOpacity
                    style={[
                        styles.applyBtn,
                        isApplied && styles.appliedBtn,
                        applyMutation.isPending && styles.disabledBtn
                    ]}
                    onPress={handleApply}
                    disabled={isApplied || applyMutation.isPending}
                >
                    {applyMutation.isPending ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={[styles.applyBtnText, isApplied && styles.appliedBtnText]}>
                            {isApplied ? 'Applied' : 'Apply Now'}
                        </Text>
                    )}
                </TouchableOpacity>
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
    appliedBtn: { backgroundColor: '#E8F5E9' },
    appliedBtnText: { color: '#4CAF50' },
    disabledBtn: { opacity: 0.7 },
});
