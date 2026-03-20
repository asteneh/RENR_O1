import React from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useJobsQuery } from '../../api/services/jobService';
import { useUserProfile } from '../../api/services/userService';
import { useAuthStore } from '../../store/useAuthStore';
import { format } from 'date-fns';

const THEME_COLOR = '#FF8C00';

export default function MyJobsScreen() {
    const navigation = useNavigation<any>();
    const { data: profile } = useUserProfile();
    const isOperator = profile?.userType === 'Operator';

    // If operator, fetch applied jobs. If other, fetch posted jobs.
    const { data: response, isLoading } = useJobsQuery(
        isOperator ? { userId: profile?._id } : { postedBy: profile?._id }
    );

    const renderItem = ({ item }: { item: any }) => (
        <TouchableOpacity style={styles.card} activeOpacity={0.7}>
            <View style={styles.cardHeader}>
                <Text style={styles.title} numberOfLines={1}>{item.jobTitle}</Text>
                <View style={[styles.statusBadge, { backgroundColor: item.jobStatus === 'Open' ? '#E6F4EA' : '#FEEFC3' }]}>
                    <Text style={[styles.statusText, { color: item.jobStatus === 'Open' ? '#1E8E3E' : '#B05E27' }]}>
                        {item.jobStatus}
                    </Text>
                </View>
            </View>

            <Text style={styles.company}>{item.companyName}</Text>

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

    return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>
                    {isOperator ? 'Applied Jobs' : 'My Posted Jobs'}
                </Text>
                {!isOperator ? (
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
                    data={response?.jobs || []}
                    renderItem={renderItem}
                    keyExtractor={item => item._id}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="briefcase-outline" size={64} color="#DDD" />
                            <Text style={styles.emptyText}>
                                {isOperator ? "You haven't applied to any jobs yet." : "You haven't posted any jobs yet."}
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
    detailsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 15 },
    detailTag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    detailTagText: { fontSize: 11, fontWeight: '600' },
    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#F0F0F0', paddingTop: 12 },
    salary: { fontSize: 14, fontWeight: 'bold', color: '#333' },
    date: { fontSize: 12, color: '#888' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 100 },
    emptyText: { marginTop: 15, color: '#888', textAlign: 'center' },
});
