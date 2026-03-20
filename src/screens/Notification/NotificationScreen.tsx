import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../store/useAuthStore';
import { useNotificationStore } from '../../store/useNotificationStore';
import { notificationService } from '../../api/services/notificationService';
import { socket } from '../../api/socket';

const THEME_COLOR = '#FF8C00';

export default function NotificationScreen({ navigation }: any) {
    const { user } = useAuthStore();
    const { setUnreadNotifications } = useNotificationStore();
    const queryClient = useQueryClient();
    const userId = user?._id || '';

    const { data: notifications, isLoading, refetch } = useQuery({
        queryKey: ['notifications', userId],
        queryFn: () => notificationService.getNotifications(userId),
        enabled: !!userId,
    });

    const markSeenMutation = useMutation({
        mutationFn: () => notificationService.updateSeen(userId),
        onSuccess: () => {
            setUnreadNotifications(0);
            queryClient.invalidateQueries({ queryKey: ['notifications', userId] });
        },
    });

    useEffect(() => {
        if (userId) {
            markSeenMutation.mutate();

            socket.on('notification', (notification: any) => {
                if (notification?.user === userId || notification?.isCampaign) {
                    refetch();
                }
            });

            return () => {
                socket.off('notification');
            };
        }
    }, [userId]);

    const renderItem = ({ item }: { item: any }) => (
        <TouchableOpacity
            style={[styles.card, !item.seen && styles.unreadCard]}
            activeOpacity={0.7}
            onPress={() => {
                if (item.product) {
                    navigation.navigate('ProductDetails', { product: { _id: item.product } });
                }
            }}
        >
            <View style={[styles.iconBox, { backgroundColor: getIconColor(item.type) }]}>
                <Ionicons name={getIconName(item.type)} size={24} color="#fff" />
            </View>
            <View style={styles.content}>
                <View style={styles.headerRow}>
                    <Text style={[styles.title, !item.seen && styles.unreadText]}>
                        {item.title || (item.product ? 'New Product Update' : 'System Update')}
                    </Text>
                    {!item.seen && <View style={styles.dot} />}
                </View>
                <Text style={styles.message} numberOfLines={3}>{item.notification}</Text>
                <Text style={styles.time}>{new Date(item.createdAt).toLocaleDateString()}</Text>
            </View>
        </TouchableOpacity>
    );

    const getIconColor = (type: string) => {
        switch (type) {
            case 'success': return '#4CAF50';
            case 'alert': return '#F44336';
            default: return THEME_COLOR;
        }
    };

    const getIconName = (type: string) => {
        switch (type) {
            case 'success': return 'checkmark-circle';
            case 'alert': return 'alert-circle';
            default: return 'notifications';
        }
    };

    if (isLoading && !notifications) {
        return (
            <SafeAreaView style={styles.container}>
                <ActivityIndicator size="large" color={THEME_COLOR} style={{ marginTop: 50 }} />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 10 }}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Notifications</Text>
                <View style={{ width: 44 }} />
            </View>

            <FlatList
                data={notifications}
                keyExtractor={(item) => item._id}
                renderItem={renderItem}
                contentContainerStyle={styles.list}
                refreshControl={
                    <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={THEME_COLOR} />
                }
                ListEmptyComponent={<Text style={styles.emptyText}>No notifications yet.</Text>}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f9f9f9' },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 10, paddingVertical: 10, backgroundColor: '#fff', elevation: 2
    },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
    list: { padding: 15 },
    card: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        marginBottom: 15,
        borderRadius: 12,
        padding: 15,
        elevation: 2,
        shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, shadowOffset: { width: 0, height: 2 }
    },
    unreadCard: {
        backgroundColor: '#FFF8E1', // Light Orange/Yellow tint
        borderLeftWidth: 4,
        borderLeftColor: THEME_COLOR
    },
    iconBox: {
        width: 45, height: 45, borderRadius: 22.5,
        justifyContent: 'center', alignItems: 'center',
        marginRight: 15
    },
    content: { flex: 1, justifyContent: 'center' },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    title: { fontSize: 16, fontWeight: '600', color: '#333' },
    unreadText: { fontWeight: 'bold', color: '#000' },
    message: { fontSize: 14, color: '#666', marginBottom: 6, lineHeight: 20 },
    time: { fontSize: 12, color: '#999' },
    dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: THEME_COLOR },
    emptyText: { textAlign: 'center', marginTop: 50, color: '#888' }
});
