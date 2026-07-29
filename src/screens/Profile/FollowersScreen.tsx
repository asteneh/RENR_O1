import React from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useFollowers, useFollowings, useFollow, useUnfollow, useUserProfile } from '../../api/services/userService';
import { useNotificationStore } from '../../store/useNotificationStore';
import { useThemeStore } from '../../store/useThemeStore';
import { useTranslation } from '../../i18n';
import { CONFIG } from '../../config';

const THEME_COLOR = '#FF8C00';

export default function FollowersScreen() {
    const navigation = useNavigation<any>();
    const { t } = useTranslation();
    const { theme } = useThemeStore();
    const isDark = theme === 'dark';
    const { showAlert, showNotification } = useNotificationStore();

    const { data: profile } = useUserProfile();
    const userId = profile?._id || '';

    const { data: followersData, isLoading: isLoadingFollowers } = useFollowers(userId);
    const { data: followingsData, isLoading: isLoadingFollowings } = useFollowings(userId);

    const followMutation = useFollow();
    const unfollowMutation = useUnfollow();

    const isLoading = isLoadingFollowers || isLoadingFollowings;

    const followingsList = followingsData?.following || [];
    const followersList = followersData?.followers || [];

    const handleFollowToggle = (targetId: string, isCurrentlyFollowing: boolean, name: string) => {
        if (isCurrentlyFollowing) {
            showAlert(
                t('unfollow') || "Unfollow",
                `${t('unfollowConfirm') || "Are you sure you want to unfollow"} ${name}?`,
                [
                    { text: t('cancel') || "Cancel", style: 'cancel' },
                    {
                        text: t('unfollow') || "Unfollow",
                        style: 'destructive',
                        onPress: () => {
                            unfollowMutation.mutate(
                                { user: userId, userToUnfollow: targetId },
                                {
                                    onSuccess: () => showNotification(t('unfollowedSuccess') || "Unfollowed successfully", "success"),
                                    onError: () => showNotification(t('unfollowFailed') || "Failed to unfollow", "error")
                                }
                            );
                        }
                    }
                ]
            );
        } else {
            followMutation.mutate(
                { user: userId, userToFollow: targetId },
                {
                    onSuccess: () => showNotification(t('followedSuccess') || "Followed successfully", "success"),
                    onError: () => showNotification(t('followFailed') || "Failed to follow", "error")
                }
            );
        }
    };

    if (isLoading) {
        return (
            <View style={[styles.center, isDark && styles.containerDark]}>
                <ActivityIndicator size="large" color={THEME_COLOR} />
            </View>
        );
    }

    return (
        <SafeAreaView style={[styles.container, isDark && styles.containerDark]} edges={['top']}>
            <View style={[styles.header, isDark && styles.headerDark]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={28} color={isDark ? "#FFF" : "#333"} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, isDark && styles.textDark]}>{t('followers')}</Text>
                <View style={{ width: 28 }} />
            </View>

            <FlatList
                data={followersList}
                keyExtractor={(item) => item._id}
                renderItem={({ item }) => {
                    const isFollowingUser = followingsList.some((f: any) => f._id === item._id);
                    const isSelf = item._id === userId;
                    const fullName = `${item.firstName || ''} ${item.lastName || ''}`.trim() || t('user') || 'User';

                    return (
                        <View style={[styles.userCard, isDark && styles.userCardDark]}>
                            <Image
                                source={{ uri: item.proflePic ? `${CONFIG.FILE_URL}/${item.proflePic}` : 'https://via.placeholder.com/50' }}
                                style={styles.userAvatar}
                            />
                            <View style={styles.userDetails}>
                                <Text style={[styles.userName, isDark && styles.textDark]}>{fullName}</Text>
                                <Text style={[styles.userType, isDark && styles.userTypeDark]}>{item.userType || 'User'}</Text>
                            </View>

                            {!isSelf && (
                                <TouchableOpacity
                                    style={[
                                        styles.actionBtn,
                                        isFollowingUser ? styles.followingBtn : styles.followBackBtn,
                                        isDark && isFollowingUser && styles.followingBtnDark
                                    ]}
                                    onPress={() => handleFollowToggle(item._id, isFollowingUser, fullName)}
                                    disabled={followMutation.isPending || unfollowMutation.isPending}
                                >
                                    <Text
                                        style={[
                                            styles.actionBtnText,
                                            isFollowingUser ? styles.followingBtnText : styles.followBackBtnText,
                                            isDark && isFollowingUser && styles.followingBtnTextDark
                                        ]}
                                    >
                                        {isFollowingUser ? (t('following') || 'Following') : (t('followBack') || 'Follow Back')}
                                    </Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    );
                }}
                contentContainerStyle={{ padding: 20 }}
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <Ionicons name="people-outline" size={60} color={isDark ? "#444" : "#ccc"} />
                        <Text style={[styles.emptyText, isDark && styles.emptyTextDark]}>
                            {t('noFollowersYet')}
                        </Text>
                    </View>
                }
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FA' },
    containerDark: { backgroundColor: '#121212' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 15,
        paddingVertical: 12,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0'
    },
    headerDark: {
        backgroundColor: '#1E1E1E',
        borderBottomColor: '#2D2D2D'
    },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1A1A1A' },
    backButton: { padding: 4 },
    textDark: { color: '#FFFFFF' },
    userCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 14,
        borderRadius: 14,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 2,
        elevation: 1
    },
    userCardDark: {
        backgroundColor: '#1E1E1E',
        shadowColor: '#000',
        shadowOpacity: 0.2
    },
    userAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#EEE' },
    userDetails: { flex: 1, marginLeft: 12 },
    userName: { fontSize: 15, fontWeight: '700', color: '#333' },
    userType: { fontSize: 12, color: '#666', marginTop: 2 },
    userTypeDark: { color: '#AAA' },
    actionBtn: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 18,
        borderWidth: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    followBackBtn: {
        backgroundColor: THEME_COLOR,
        borderColor: THEME_COLOR
    },
    followingBtn: {
        backgroundColor: 'transparent',
        borderColor: '#DDD'
    },
    followingBtnDark: {
        borderColor: '#444'
    },
    actionBtnText: { fontSize: 12, fontWeight: '600' },
    followBackBtnText: { color: '#FFF' },
    followingBtnText: { color: '#666' },
    followingBtnTextDark: { color: '#AAA' },
    empty: { alignItems: 'center', marginTop: 100 },
    emptyText: { color: '#999', marginTop: 15, fontSize: 15, textAlign: 'center' },
    emptyTextDark: { color: '#666' }
});
