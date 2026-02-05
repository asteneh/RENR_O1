import React from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

const THEME_COLOR = '#FF8C00';

interface Notification {
    id: string;
    title: string;
    message: string;
    time: string;
    read: boolean;
    type: 'info' | 'success' | 'alert';
}

const MOCK_NOTIFICATIONS: Notification[] = [
    {
        id: '1',
        title: 'Listing Approved',
        message: 'Your listing "Caterpillar Excavator 2020" has been approved and is now live.',
        time: '2 hrs ago',
        read: false,
        type: 'success',
    },
    {
        id: '2',
        title: 'New Message',
        message: 'You have a new message from a potential buyer concerning your Truck.',
        time: '5 hrs ago',
        read: true,
        type: 'info',
    },
    {
        id: '3',
        title: 'System Update',
        message: 'We have updated our terms of service. Please review the changes.',
        time: '1 day ago',
        read: true,
        type: 'alert',
    },
    {
        id: '4',
        title: 'Welcome!',
        message: 'Thanks for joining Gadal Market. Start posting your machinery today.',
        time: '2 days ago',
        read: true,
        type: 'info',
    },
];

export default function NotificationScreen({ navigation }: any) {
    const renderItem = ({ item }: { item: Notification }) => (
        <TouchableOpacity
            style={[styles.card, !item.read && styles.unreadCard]}
            activeOpacity={0.7}
        >
            <View style={[styles.iconBox, { backgroundColor: getIconColor(item.type) }]}>
                <Ionicons name={getIconName(item.type)} size={24} color="#fff" />
            </View>
            <View style={styles.content}>
                <View style={styles.headerRow}>
                    <Text style={[styles.title, !item.read && styles.unreadText]}>{item.title}</Text>
                    {!item.read && <View style={styles.dot} />}
                </View>
                <Text style={styles.message} numberOfLines={2}>{item.message}</Text>
                <Text style={styles.time}>{item.time}</Text>
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
                data={MOCK_NOTIFICATIONS}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                contentContainerStyle={styles.list}
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
