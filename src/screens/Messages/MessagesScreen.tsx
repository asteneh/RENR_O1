import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/useAuthStore';
import { useConversations } from '../../api/services/messageService';
import { Ionicons } from '@expo/vector-icons';

const THEME_COLOR = '#FF8C00';

export default function MessagesScreen({ navigation }: any) {
    const user = useAuthStore(state => state.user);
    const userId = user?.id || user?._id; // Adapt to auth state
    const { data: conversations, isLoading, error } = useConversations(userId);

    const renderItem = ({ item }: { item: any }) => {
        const partner = item.productOwner?._id === userId ? item.interestedParty : item.productOwner;
        const partnerName = partner ? `${partner.firstName} ${partner.lastName}` : 'User';
        const lastMsgText = item.lastConversation?.message?.message || 'Start content...';

        return (
            <TouchableOpacity
                style={styles.card}
                onPress={() => navigation.navigate('Chat', { conversation: item })}
            >
                <View style={styles.avatar}>
                    <Ionicons name="person" size={20} color="#fff" />
                </View>
                <View style={styles.content}>
                    <Text style={styles.name}>{partnerName}</Text>
                    <Text style={[styles.message, item.unreadCount > 0 && styles.unreadMessage]} numberOfLines={1}>
                        {lastMsgText}
                    </Text>
                </View>
                <View style={styles.rightContent}>
                    <Text style={styles.date}>
                        {item.lastConversation?.updatedAt ? new Date(item.lastConversation.updatedAt).toLocaleDateString() : new Date(item.updatedAt).toLocaleDateString()}
                    </Text>
                    {item.unreadCount > 0 && (
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>{item.unreadCount}</Text>
                        </View>
                    )}
                </View>
            </TouchableOpacity>
        );
    };

    if (!userId) return <View style={styles.center}><Text>Please login to view messages.</Text></View>;
    if (isLoading) return <ActivityIndicator size="large" color={THEME_COLOR} style={{ flex: 1 }} />;
    if (error) return <View style={styles.center}><Text>Error loading messages</Text></View>;

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="chevron-back" size={28} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Messages</Text>
                <View style={{ width: 28 }} />
            </View>
            <FlatList
                data={conversations}
                keyExtractor={(item) => item._id}
                renderItem={renderItem}
                contentContainerStyle={styles.list}
                ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 20 }}>No conversations found.</Text>}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FA' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 15,
        paddingVertical: 10,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0'
    },
    headerTitle: { fontSize: 18, fontWeight: 'bold' },
    list: { padding: 15, paddingBottom: 30 },
    card: { flexDirection: 'row', backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 10, alignItems: 'center', elevation: 1 },
    avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#ccc', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    content: { flex: 1 },
    name: { fontWeight: 'bold', fontSize: 16 },
    message: { color: '#666', fontSize: 13 },
    unreadMessage: { color: '#000', fontWeight: '600' },
    date: { fontSize: 11, color: '#999' },
    rightContent: { alignItems: 'flex-end', justifyContent: 'center', marginLeft: 10 },
    badge: { backgroundColor: THEME_COLOR, minWidth: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginTop: 5, paddingHorizontal: 5 },
    badgeText: { color: '#fff', fontSize: 11, fontWeight: 'bold' }
});
