import React from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useFollowings, useUnfollow, useUserProfile } from '../../api/services/userService';
import { CONFIG } from '../../config';

const THEME_COLOR = '#FF8C00';

export default function FollowingsScreen() {
    const navigation = useNavigation<any>();
    const { data: profile } = useUserProfile();
    const { data: followings, isLoading } = useFollowings(profile?._id || '');
    const unfollowMutation = useUnfollow();

    const handleUnfollow = (targetId: string) => {
        Alert.alert("Unfollow", "Are you sure you want to unfollow this user?", [
            { text: "Cancel", style: 'cancel' },
            {
                text: "Unfollow", style: 'destructive', onPress: () => {
                    unfollowMutation.mutate({ user: profile?._id || '', userToUnfollow: targetId });
                }
            }
        ]);
    };

    if (isLoading) return <View style={styles.center}><ActivityIndicator size="large" color={THEME_COLOR} /></View>;

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="chevron-back" size={28} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Following</Text>
                <View style={{ width: 28 }} />
            </View>

            <FlatList
                data={followings?.following || []}
                keyExtractor={(item) => item._id}
                renderItem={({ item }) => (
                    <View style={styles.userCard}>
                        <Image
                            source={{ uri: item.proflePic ? `${CONFIG.FILE_URL}/${item.proflePic}` : 'https://via.placeholder.com/50' }}
                            style={styles.userAvatar}
                        />
                        <View style={styles.userDetails}>
                            <Text style={styles.userName}>{item.firstName} {item.lastName}</Text>
                            <Text style={styles.userType}>{item.userType || 'User'}</Text>
                        </View>
                        <TouchableOpacity style={styles.unfollowBtn} onPress={() => handleUnfollow(item._id)}>
                            <Text style={styles.unfollowBtnText}>Unfollow</Text>
                        </TouchableOpacity>
                    </View>
                )}
                contentContainerStyle={{ padding: 20 }}
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <Ionicons name="people-outline" size={60} color="#ccc" />
                        <Text style={styles.emptyText}>You are not following anyone yet.</Text>
                    </View>
                }
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
    userCard: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
        padding: 12, borderRadius: 12, marginBottom: 12, elevation: 1
    },
    userAvatar: { width: 50, height: 50, borderRadius: 25 },
    userDetails: { flex: 1, marginLeft: 12 },
    userName: { fontSize: 15, fontWeight: 'bold', color: '#333' },
    userType: { fontSize: 12, color: '#888', marginTop: 2 },
    unfollowBtn: {
        paddingHorizontal: 12, paddingVertical: 6,
        borderRadius: 15, borderWidth: 1, borderColor: '#DDD'
    },
    unfollowBtnText: { fontSize: 12, color: '#FF3B30', fontWeight: '600' },
    empty: { alignItems: 'center', marginTop: 100 },
    emptyText: { color: '#999', marginTop: 15, fontSize: 16 }
});
