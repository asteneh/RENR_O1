import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useAuthStore } from '../../store/useAuthStore';
import { useConversations } from '../../api/services/messageService';
import { Ionicons } from '@expo/vector-icons';

const THEME_COLOR = '#FF8C00';

export default function MessagesScreen({ navigation }: any) {
    const user = useAuthStore(state => state.user);
    const userId = user?.id || user?._id; // Adapt to auth state
    const { data: conversations, isLoading, error } = useConversations(userId);

    const renderItem = ({ item }: { item: any }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('Chat', { conversation: item })}
        >
            <View style={styles.avatar}>
                <Ionicons name="person" size={20} color="#fff" />
            </View>
            <View style={styles.content}>
                <Text style={styles.name}>User {item.members?.find((m: string) => m !== userId) || 'User'}</Text>
                <Text style={styles.message} numberOfLines={1}>{item.lastMessage || 'Start content...'}</Text>
            </View>
            <Text style={styles.date}>{new Date(item.updatedAt).toLocaleDateString()}</Text>
        </TouchableOpacity>
    );

    if (!userId) return <View style={styles.center}><Text>Please login to view messages.</Text></View>;
    if (isLoading) return <ActivityIndicator size="large" color={THEME_COLOR} style={{ flex: 1 }} />;
    if (error) return <View style={styles.center}><Text>Error loading messages</Text></View>;

    return (
        <View style={styles.container}>
            <Text style={styles.header}>Messages</Text>
            <FlatList
                data={conversations}
                keyExtractor={(item) => item._id}
                renderItem={renderItem}
                ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 20 }}>No conversations found.</Text>}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f9f9f9', padding: 15 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { fontSize: 22, fontWeight: 'bold', marginBottom: 15 },
    card: { flexDirection: 'row', backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 10, alignItems: 'center', elevation: 1 },
    avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#ccc', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    content: { flex: 1 },
    name: { fontWeight: 'bold', fontSize: 16 },
    message: { color: '#666', fontSize: 13 },
    date: { fontSize: 11, color: '#999' }
});
