import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Modal, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useRequestsQuery } from '../../api/services/requestService';
import { useUserProfile } from '../../api/services/userService';
import { format } from 'date-fns';

const THEME_COLOR = '#FF8C00';

export default function MyRequestsScreen() {
    const navigation = useNavigation<any>();
    const { data: profile } = useUserProfile();
    const { data: response, isLoading } = useRequestsQuery({ postedBy: profile?._id });
    const [selectedRequest, setSelectedRequest] = useState<any>(null);

    const renderItem = ({ item }: { item: any }) => (
        <TouchableOpacity
            style={styles.card}
            activeOpacity={0.7}
            onPress={() => setSelectedRequest(item)}
        >
            <View style={styles.cardHeader}>
                <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
                <View style={[styles.statusBadge, {
                    backgroundColor: item.state === 'Approved' ? '#E6F4EA' : item.state === 'Declined' ? '#FEEBEB' : '#FFF4E5'
                }]}>
                    <Text style={[styles.statusText, {
                        color: item.state === 'Approved' ? '#1E8E3E' : item.state === 'Declined' ? '#D93025' : '#FF8C00'
                    }]}>
                        {item.state}
                    </Text>
                </View>
            </View>

            <Text style={styles.description} numberOfLines={2}>{item.description}</Text>

            <View style={styles.cardFooter}>
                <View style={styles.footerItem}>
                    <Ionicons name="location-outline" size={14} color="#666" />
                    <Text style={styles.footerText}>{item.location}</Text>
                </View>
                <View style={styles.footerItem}>
                    <Ionicons name="calendar-outline" size={14} color="#666" />
                    <Text style={styles.footerText}>{format(new Date(item.date || item.createdAt), 'MMM dd, yyyy')}</Text>
                </View>
                <View style={styles.footerItem}>
                    <Ionicons name="eye-outline" size={14} color="#666" />
                    <Text style={styles.footerText}>{item.viewCount}</Text>
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>My Requests</Text>
                <View style={{ width: 40 }} />
            </View>

            {isLoading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={THEME_COLOR} />
                </View>
            ) : (
                <FlatList
                    data={response?.requests || []}
                    renderItem={renderItem}
                    keyExtractor={item => item._id}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="document-text-outline" size={64} color="#DDD" />
                            <Text style={styles.emptyText}>You haven't posted any requests yet.</Text>
                        </View>
                    }
                />
            )}

            <Modal visible={!!selectedRequest} transparent animationType="slide" onRequestClose={() => setSelectedRequest(null)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{selectedRequest?.title}</Text>
                            <TouchableOpacity onPress={() => setSelectedRequest(null)}>
                                <Ionicons name="close" size={24} color="#333" />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.modalLabel}>Status</Text>
                        <Text style={styles.modalValue}>{selectedRequest?.state}</Text>

                        <Text style={styles.modalLabel}>Description</Text>
                        <Text style={styles.modalBody}>{selectedRequest?.description}</Text>

                        <Text style={styles.modalLabel}>Location</Text>
                        <Text style={styles.modalValue}>{selectedRequest?.location || 'Not specified'}</Text>

                        {selectedRequest?.state === 'Approved' && (
                            <View style={styles.contactSection}>
                                <Text style={styles.contactTitle}>Request Approved</Text>
                                <Text style={styles.contactSub}>
                                    Your request has been approved. Interested parties with matching inventory will be notified and may contact you.
                                </Text>
                                {profile?.phoneNumber && (
                                    <TouchableOpacity
                                        style={styles.contactBtn}
                                        onPress={() => Linking.openURL(`tel:${profile.phoneNumber}`)}
                                    >
                                        <Ionicons name="call-outline" size={18} color="#fff" />
                                        <Text style={styles.contactBtnText}>Your contact: {profile.phoneNumber}</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        )}

                        <TouchableOpacity style={styles.closeBtn} onPress={() => setSelectedRequest(null)}>
                            <Text style={styles.closeBtnText}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
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
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#111' },
    list: { padding: 15 },
    card: {
        backgroundColor: '#fff', borderRadius: 12, padding: 15, marginBottom: 15,
        elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1, shadowRadius: 2,
    },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    title: { fontSize: 16, fontWeight: 'bold', color: '#333', flex: 1, marginRight: 10 },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    statusText: { fontSize: 12, fontWeight: 'bold' },
    description: { fontSize: 14, color: '#666', lineHeight: 20, marginBottom: 15 },
    cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#F0F0F0', paddingTop: 12 },
    footerItem: { flexDirection: 'row', alignItems: 'center' },
    footerText: { fontSize: 12, color: '#666', marginLeft: 4 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 100 },
    emptyText: { marginTop: 15, color: '#888', textAlign: 'center' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, maxHeight: '80%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', flex: 1, marginRight: 10 },
    modalLabel: { fontSize: 12, fontWeight: '700', color: '#888', marginTop: 12, marginBottom: 4, textTransform: 'uppercase' },
    modalValue: { fontSize: 15, color: '#333' },
    modalBody: { fontSize: 14, color: '#555', lineHeight: 22 },
    contactSection: {
        marginTop: 16, backgroundColor: '#E6F4EA', borderRadius: 12, padding: 14,
    },
    contactTitle: { fontSize: 15, fontWeight: 'bold', color: '#1E8E3E' },
    contactSub: { fontSize: 13, color: '#555', marginTop: 6, lineHeight: 18 },
    contactBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        backgroundColor: THEME_COLOR, borderRadius: 10,
        paddingVertical: 10, paddingHorizontal: 14, marginTop: 12, alignSelf: 'flex-start',
    },
    contactBtnText: { color: '#fff', fontWeight: '600', fontSize: 13 },
    closeBtn: {
        backgroundColor: '#F0F0F0', borderRadius: 10, padding: 14,
        alignItems: 'center', marginTop: 20,
    },
    closeBtnText: { fontSize: 15, fontWeight: 'bold', color: '#333' },
});
