import React, { useState, useMemo, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    FlatList,
    ActivityIndicator,
    RefreshControl,
    ScrollView,
    Share,
    Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { RootStackParamList } from '../../navigation/types';
import { useAuthStore } from '../../store/useAuthStore';
import { useNotificationStore } from '../../store/useNotificationStore';
import { useThemeStore } from '../../store/useThemeStore';
import { useTranslation } from '../../i18n';
import {
    usePublicProfile,
    useUserAds,
    useFollowers,
    useFollowings,
    useFollow,
    useUnfollow,
} from '../../api/services/userService';
import { fetchConversations } from '../../api/services/messageService';
import { CONFIG } from '../../config';
import ZoomableImageModal from '../../components/common/ZoomableImageModal';
import ProductCard from '../../components/ProductCard';
import { RoleLabels, UserRole } from '../../constants/UserRoles';

const THEME_COLOR = '#FF8C00';

const CATEGORY_TABS = [
    { label: 'All', serviceType: undefined },
    { label: 'Machinery', serviceType: 1 },
    { label: 'Vehicle', serviceType: 3 },
    { label: 'Property', serviceType: 2 },
];

type UserProfileRouteProp = RouteProp<RootStackParamList, 'UserProfile'>;

export default function UserProfileScreen() {
    const route = useRoute<UserProfileRouteProp>();
    const navigation = useNavigation<any>();
    const { userId, user: initialUser } = route.params;

    const { theme } = useThemeStore();
    const isDark = theme === 'dark';
    const { t } = useTranslation();
    const { user: authUser } = useAuthStore();
    const { showNotification, showAlert } = useNotificationStore();

    const currentUserId = authUser?.id || authUser?._id;
    const isSelf = currentUserId === userId;

    // Fetch public profile detail
    const {
        data: profile,
        isLoading: isProfileLoading,
        refetch: refetchProfile,
    } = usePublicProfile(userId);

    // Merge profile data with initial fallback if available
    const displayUser = profile || initialUser || {};

    // Active tab in profile: 'posts' | 'followers'
    const [activeSection, setActiveSection] = useState<'posts' | 'followers'>('posts');
    const [selectedCategoryTab, setSelectedCategoryTab] = useState(0);

    // Zoom modal for profile picture
    const [isZoomModalVisible, setIsZoomModalVisible] = useState(false);
    const [zoomImage, setZoomImage] = useState('');

    // Fetch user ads (posts)
    const activeServiceType = CATEGORY_TABS[selectedCategoryTab].serviceType;
    const {
        data: adsData,
        isLoading: isAdsLoading,
        refetch: refetchAds,
    } = useUserAds({
        userId,
        serviceType: activeServiceType,
        derivedState: 1, // Available
        recordStatus: 1, // Active
    });

    // Fetch followers
    const {
        data: followersData,
        isLoading: isFollowersLoading,
        refetch: refetchFollowers,
    } = useFollowers(userId);

    // Fetch my own followings to check follow status for list items
    const { data: myFollowingsData } = useFollowings(currentUserId || '');
    const myFollowingsList = myFollowingsData?.following || [];

    // Follow / Unfollow mutations
    const followMutation = useFollow();
    const unfollowMutation = useUnfollow();

    // Determine whether current authenticated user follows this profile user
    const followersList = followersData?.followers || displayUser.followers || [];
    const isFollowing = useMemo(() => {
        if (!currentUserId) return false;
        return (
            myFollowingsList.some((f: any) => (f?._id || f) === userId) ||
            followersList.some((f: any) => (f?._id || f) === currentUserId)
        );
    }, [currentUserId, userId, myFollowingsList, followersList]);

    // Handle Follow Toggle for this profile user
    const handleProfileFollowToggle = () => {
        if (!authUser) {
            navigation.navigate('Login');
            return;
        }

        if (isSelf) {
            showNotification('You cannot follow yourself.', 'error');
            return;
        }

        if (isFollowing) {
            showAlert(
                t('unfollow') || 'Unfollow',
                `${t('unfollowConfirm') || 'Are you sure you want to unfollow'} ${displayUser.firstName || 'this user'}?`,
                [
                    { text: t('cancel') || 'Cancel', style: 'cancel' },
                    {
                        text: t('unfollow') || 'Unfollow',
                        style: 'destructive',
                        onPress: () => {
                            unfollowMutation.mutate(
                                { user: currentUserId, userToUnfollow: userId },
                                {
                                    onSuccess: () => {
                                        showNotification(t('unfollowedSuccess') || 'Unfollowed successfully', 'success');
                                        refetchProfile();
                                        refetchFollowers();
                                    },
                                    onError: () => showNotification(t('unfollowFailed') || 'Failed to unfollow', 'error'),
                                }
                            );
                        },
                    },
                ]
            );
        } else {
            followMutation.mutate(
                { user: currentUserId, userToFollow: userId },
                {
                    onSuccess: () => {
                        showNotification(t('followedSuccess') || 'Followed successfully', 'success');
                        refetchProfile();
                        refetchFollowers();
                    },
                    onError: () => showNotification(t('followFailed') || 'Failed to follow', 'error'),
                }
            );
        }
    };

    // Follow toggle for another follower in the list
    const handleFollowerToggle = (targetId: string, isCurrentlyFollowing: boolean, name: string) => {
        if (!authUser) {
            navigation.navigate('Login');
            return;
        }

        if (isCurrentlyFollowing) {
            showAlert(
                t('unfollow') || 'Unfollow',
                `${t('unfollowConfirm') || 'Are you sure you want to unfollow'} ${name}?`,
                [
                    { text: t('cancel') || 'Cancel', style: 'cancel' },
                    {
                        text: t('unfollow') || 'Unfollow',
                        style: 'destructive',
                        onPress: () => {
                            unfollowMutation.mutate(
                                { user: currentUserId, userToUnfollow: targetId },
                                {
                                    onSuccess: () => {
                                        showNotification(t('unfollowedSuccess') || 'Unfollowed successfully', 'success');
                                        refetchFollowers();
                                    },
                                    onError: () => showNotification(t('unfollowFailed') || 'Failed to unfollow', 'error'),
                                }
                            );
                        },
                    },
                ]
            );
        } else {
            followMutation.mutate(
                { user: currentUserId, userToFollow: targetId },
                {
                    onSuccess: () => {
                        showNotification(t('followedSuccess') || 'Followed successfully', 'success');
                        refetchFollowers();
                    },
                    onError: () => showNotification(t('followFailed') || 'Failed to follow', 'error'),
                }
            );
        }
    };

    // Chat with this user
    const handleChatPress = async () => {
        if (!authUser) {
            navigation.navigate('Login');
            return;
        }
        if (isSelf) {
            showNotification('You cannot chat with yourself.', 'error');
            return;
        }

        try {
            const conversationsList = await fetchConversations(currentUserId);
            const existing = conversationsList?.find(
                (c: any) =>
                    c.productOwner?._id === userId ||
                    c.productOwner === userId ||
                    c.interestedParty?._id === userId ||
                    c.interestedParty === userId
            );

            if (existing) {
                navigation.navigate('Chat', { conversation: existing });
            } else {
                navigation.navigate('Messages');
            }
        } catch {
            navigation.navigate('Messages');
        }
    };

    // Share profile
    const handleShare = async () => {
        try {
            const fullName = `${displayUser.firstName || ''} ${displayUser.lastName || ''}`.trim() || 'User';
            await Share.share({
                title: `${fullName} on Gadal Market`,
                message: `Check out ${fullName}'s profile and listings on Gadal Market!`,
            });
        } catch (error: any) {
            showNotification(error?.message || 'Error sharing', 'error');
        }
    };

    // Refresh control
    const [refreshing, setRefreshing] = useState(false);
    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await Promise.all([refetchProfile(), refetchAds(), refetchFollowers()]);
        setRefreshing(false);
    }, [refetchProfile, refetchAds, refetchFollowers]);

    const fullName = `${displayUser.firstName || ''} ${displayUser.lastName || ''}`.trim() || 'Seller Profile';
    const roleLabel = displayUser.userType ? RoleLabels[displayUser.userType as UserRole] || displayUser.userType : 'Member';
    const location = [displayUser.subCity, displayUser.city, displayUser.region].filter(Boolean).join(', ');
    const postCount = displayUser.postCount ?? (adsData?.products?.length || 0);
    const followersCount = followersList?.length || 0;

    const renderHeader = () => (
        <View style={styles.headerContainer}>
            {/* Profile Info Card */}
            <View style={[styles.profileCard, isDark && styles.cardDark]}>
                <View style={styles.avatarRow}>
                    <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => {
                            if (displayUser.proflePic) {
                                setZoomImage(`${CONFIG.FILE_URL}/${displayUser.proflePic}`);
                                setIsZoomModalVisible(true);
                            }
                        }}
                    >
                        <Image
                            source={{
                                uri: displayUser.proflePic
                                    ? `${CONFIG.FILE_URL}/${displayUser.proflePic}`
                                    : 'https://via.placeholder.com/100',
                            }}
                            style={styles.avatar}
                        />
                    </TouchableOpacity>

                    <View style={styles.profileTextContainer}>
                        <Text style={[styles.profileName, isDark && styles.textDark]}>{fullName}</Text>
                        <View style={styles.badgeContainer}>
                            <View style={[styles.roleBadge, { backgroundColor: isDark ? '#2C1D0A' : '#FFF5E5' }]}>
                                <Text style={styles.roleBadgeText}>{roleLabel}</Text>
                            </View>
                        </View>
                        {Boolean(location) && (
                            <View style={styles.locationRow}>
                                <Ionicons name="location-outline" size={14} color={THEME_COLOR} />
                                <Text style={[styles.locationText, isDark && styles.subtextDark]}>{location}</Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* Primary Action Buttons: Follow / Chat / Call */}
                <View style={styles.actionButtonsRow}>
                    {!isSelf ? (
                        <>
                            <TouchableOpacity
                                style={[
                                    styles.followBtn,
                                    isFollowing ? styles.followingBtn : styles.primaryFollowBtn,
                                    isDark && isFollowing && styles.followingBtnDark,
                                ]}
                                onPress={handleProfileFollowToggle}
                                disabled={followMutation.isPending || unfollowMutation.isPending}
                            >
                                {followMutation.isPending || unfollowMutation.isPending ? (
                                    <ActivityIndicator size="small" color={isFollowing ? '#333' : '#fff'} />
                                ) : (
                                    <View style={styles.btnInnerRow}>
                                        <Ionicons
                                            name={isFollowing ? 'checkmark' : 'person-add-outline'}
                                            size={16}
                                            color={isFollowing ? (isDark ? '#FFF' : '#333') : '#FFF'}
                                        />
                                        <Text
                                            style={[
                                                styles.followBtnText,
                                                isFollowing ? styles.followingBtnText : styles.primaryFollowBtnText,
                                                isDark && isFollowing && styles.followingBtnTextDark,
                                            ]}
                                        >
                                            {isFollowing ? t('following') || 'Following' : t('follow') || 'Follow'}
                                        </Text>
                                    </View>
                                )}
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.chatBtn, isDark && styles.chatBtnDark]}
                                onPress={handleChatPress}
                            >
                                <Ionicons name="chatbubbles-outline" size={18} color={THEME_COLOR} />
                                <Text style={styles.chatBtnText}>{t('messages') || 'Chat'}</Text>
                            </TouchableOpacity>

                            {Boolean(displayUser.phoneNumber) && (
                                <TouchableOpacity
                                    style={[styles.iconActionBtn, isDark && styles.iconActionBtnDark]}
                                    onPress={() => Linking.openURL(`tel:${displayUser.phoneNumber}`)}
                                >
                                    <Ionicons name="call-outline" size={18} color={THEME_COLOR} />
                                </TouchableOpacity>
                            )}
                        </>
                    ) : (
                        <TouchableOpacity
                            style={[styles.editProfileBtn, isDark && styles.editProfileBtnDark]}
                            onPress={() => navigation.navigate('EditProfile')}
                        >
                            <Ionicons name="create-outline" size={16} color={THEME_COLOR} />
                            <Text style={styles.editProfileBtnText}>{t('editProfile') || 'Edit Profile'}</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Stats Row */}
                <View style={[styles.statsRow, isDark && styles.statsRowDark]}>
                    <TouchableOpacity
                        style={[styles.statItem, activeSection === 'posts' && styles.activeStatItem]}
                        onPress={() => setActiveSection('posts')}
                    >
                        <Text style={[styles.statValue, isDark && styles.textDark]}>{postCount}</Text>
                        <Text style={[styles.statLabel, isDark && styles.subtextDark]}>{t('posts') || 'Posts'}</Text>
                    </TouchableOpacity>

                    <View style={[styles.statDivider, isDark && styles.dividerDark]} />

                    <TouchableOpacity
                        style={[styles.statItem, activeSection === 'followers' && styles.activeStatItem]}
                        onPress={() => setActiveSection('followers')}
                    >
                        <Text style={[styles.statValue, isDark && styles.textDark]}>{followersCount}</Text>
                        <Text style={[styles.statLabel, isDark && styles.subtextDark]}>{t('followers') || 'Followers'}</Text>
                    </TouchableOpacity>

                    <View style={[styles.statDivider, isDark && styles.dividerDark]} />

                    <View style={styles.statItem}>
                        <Text style={[styles.statValue, isDark && styles.textDark]}>
                            {displayUser.following?.length || 0}
                        </Text>
                        <Text style={[styles.statLabel, isDark && styles.subtextDark]}>{t('following') || 'Following'}</Text>
                    </View>
                </View>
            </View>

            {/* Segmented Section Tab (Posts vs Followers) */}
            <View style={[styles.sectionTabsContainer, isDark && styles.sectionTabsContainerDark]}>
                <TouchableOpacity
                    style={[styles.sectionTab, activeSection === 'posts' && styles.sectionTabActive]}
                    onPress={() => setActiveSection('posts')}
                >
                    <Ionicons
                        name="grid-outline"
                        size={18}
                        color={activeSection === 'posts' ? THEME_COLOR : isDark ? '#777' : '#888'}
                    />
                    <Text
                        style={[
                            styles.sectionTabText,
                            activeSection === 'posts' && styles.sectionTabTextActive,
                            isDark && activeSection !== 'posts' && styles.subtextDark,
                        ]}
                    >
                        {t('posts') || 'Posts'} ({postCount})
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.sectionTab, activeSection === 'followers' && styles.sectionTabActive]}
                    onPress={() => setActiveSection('followers')}
                >
                    <Ionicons
                        name="people-outline"
                        size={18}
                        color={activeSection === 'followers' ? THEME_COLOR : isDark ? '#777' : '#888'}
                    />
                    <Text
                        style={[
                            styles.sectionTabText,
                            activeSection === 'followers' && styles.sectionTabTextActive,
                            isDark && activeSection !== 'followers' && styles.subtextDark,
                        ]}
                    >
                        {t('followers') || 'Followers'} ({followersCount})
                    </Text>
                </TouchableOpacity>
            </View>

            {/* If Posts Tab is selected, show Category Filter Chips */}
            {activeSection === 'posts' && (
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.categoryChipsContainer}
                >
                    {CATEGORY_TABS.map((tab, index) => {
                        const isSelected = selectedCategoryTab === index;
                        return (
                            <TouchableOpacity
                                key={index}
                                onPress={() => setSelectedCategoryTab(index)}
                                style={[
                                    styles.categoryChip,
                                    isSelected && styles.categoryChipSelected,
                                    isDark && !isSelected && styles.categoryChipDark,
                                ]}
                            >
                                <Text
                                    style={[
                                        styles.categoryChipText,
                                        isSelected && styles.categoryChipTextSelected,
                                        isDark && !isSelected && styles.subtextDark,
                                    ]}
                                >
                                    {tab.label}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            )}
        </View>
    );

    const renderFollowerItem = ({ item }: { item: any }) => {
        const followerId = item._id || item;
        const isFollowerSelf = followerId === currentUserId;
        const isFollowingFollower = myFollowingsList.some((f: any) => (f?._id || f) === followerId);
        const followerName = `${item.firstName || ''} ${item.lastName || ''}`.trim() || 'User';

        return (
            <TouchableOpacity
                style={[styles.followerCard, isDark && styles.cardDark]}
                activeOpacity={0.7}
                onPress={() => {
                    if (followerId && followerId !== userId) {
                        navigation.push('UserProfile', { userId: followerId, user: item });
                    }
                }}
            >
                <Image
                    source={{
                        uri: item.proflePic ? `${CONFIG.FILE_URL}/${item.proflePic}` : 'https://via.placeholder.com/50',
                    }}
                    style={styles.followerAvatar}
                />
                <View style={styles.followerDetails}>
                    <Text style={[styles.followerName, isDark && styles.textDark]}>{followerName}</Text>
                    <Text style={[styles.followerRole, isDark && styles.subtextDark]}>{item.userType || 'Member'}</Text>
                </View>

                {!isFollowerSelf && (
                    <TouchableOpacity
                        style={[
                            styles.followerActionBtn,
                            isFollowingFollower ? styles.followingBtn : styles.followBackBtn,
                            isDark && isFollowingFollower && styles.followingBtnDark,
                        ]}
                        onPress={() => handleFollowerToggle(followerId, isFollowingFollower, followerName)}
                        disabled={followMutation.isPending || unfollowMutation.isPending}
                    >
                        <Text
                            style={[
                                styles.followerActionBtnText,
                                isFollowingFollower ? styles.followingBtnText : styles.followBackBtnText,
                                isDark && isFollowingFollower && styles.followingBtnTextDark,
                            ]}
                        >
                            {isFollowingFollower ? t('following') || 'Following' : t('follow') || 'Follow'}
                        </Text>
                    </TouchableOpacity>
                )}
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={[styles.container, isDark && styles.containerDark]} edges={['top']}>
            {/* Top Navigation Bar */}
            <View style={[styles.navBar, isDark && styles.navBarDark]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.navBarBtn}>
                    <Ionicons name="chevron-back" size={26} color={isDark ? '#FFF' : '#222'} />
                </TouchableOpacity>
                <Text style={[styles.navBarTitle, isDark && styles.textDark]} numberOfLines={1}>
                    {fullName}
                </Text>
                <TouchableOpacity onPress={handleShare} style={styles.navBarBtn}>
                    <Ionicons name="share-social-outline" size={22} color={isDark ? '#FFF' : '#222'} />
                </TouchableOpacity>
            </View>

            {isProfileLoading && !profile && !initialUser ? (
                <View style={styles.centerLoading}>
                    <ActivityIndicator size="large" color={THEME_COLOR} />
                </View>
            ) : activeSection === 'posts' ? (
                /* Posts List */
                <FlatList
                    data={adsData?.products || []}
                    keyExtractor={(item) => item._id}
                    ListHeaderComponent={renderHeader}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            colors={[THEME_COLOR]}
                            tintColor={THEME_COLOR}
                        />
                    }
                    renderItem={({ item }) => (
                        <ProductCard
                            product={item}
                            style={{ marginHorizontal: 16, marginBottom: 16 }}
                            onPreview={(prod) => navigation.navigate('ProductDetails', { product: prod })}
                        />
                    )}
                    contentContainerStyle={{ paddingBottom: 40 }}
                    ListEmptyComponent={
                        isAdsLoading ? (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="small" color={THEME_COLOR} />
                            </View>
                        ) : (
                            <View style={styles.emptyContainer}>
                                <Ionicons name="cube-outline" size={56} color={isDark ? '#444' : '#CCC'} />
                                <Text style={[styles.emptyTitle, isDark && styles.textDark]}>
                                    {t('noPostsYet') || 'No listings found'}
                                </Text>
                                <Text style={[styles.emptySubtitle, isDark && styles.subtextDark]}>
                                    {t('noActiveItems') || 'This user has no active items in this category.'}
                                </Text>
                            </View>
                        )
                    }
                />
            ) : (
                /* Followers List */
                <FlatList
                    data={followersList}
                    keyExtractor={(item, index) => item._id || item || index.toString()}
                    ListHeaderComponent={renderHeader}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            colors={[THEME_COLOR]}
                            tintColor={THEME_COLOR}
                        />
                    }
                    renderItem={renderFollowerItem}
                    contentContainerStyle={{ paddingBottom: 40, paddingHorizontal: 16 }}
                    ListEmptyComponent={
                        isFollowersLoading ? (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="small" color={THEME_COLOR} />
                            </View>
                        ) : (
                            <View style={styles.emptyContainer}>
                                <Ionicons name="people-outline" size={56} color={isDark ? '#444' : '#CCC'} />
                                <Text style={[styles.emptyTitle, isDark && styles.textDark]}>
                                    {t('noFollowersYet') || 'No followers yet'}
                                </Text>
                                <Text style={[styles.emptySubtitle, isDark && styles.subtextDark]}>
                                    Be the first one to follow this seller!
                                </Text>
                            </View>
                        )
                    }
                />
            )}

            <ZoomableImageModal
                visible={isZoomModalVisible}
                imageUri={zoomImage}
                onClose={() => setIsZoomModalVisible(false)}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FA' },
    containerDark: { backgroundColor: '#121212' },

    // Top Nav Bar
    navBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    navBarDark: {
        backgroundColor: '#1E1E1E',
        borderBottomColor: '#2C2C2C',
    },
    navBarBtn: {
        padding: 4,
    },
    navBarTitle: {
        fontSize: 17,
        fontWeight: 'bold',
        color: '#222',
        flex: 1,
        textAlign: 'center',
        marginHorizontal: 10,
    },

    headerContainer: {
        paddingTop: 12,
    },

    // Profile Card
    profileCard: {
        backgroundColor: '#FFF',
        borderRadius: 16,
        marginHorizontal: 16,
        marginBottom: 12,
        padding: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
    },
    cardDark: {
        backgroundColor: '#1E1E1E',
    },
    avatarRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#EAEAEA',
    },
    profileTextContainer: {
        flex: 1,
        marginLeft: 16,
    },
    profileName: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#222',
    },
    badgeContainer: {
        flexDirection: 'row',
        marginTop: 6,
    },
    roleBadge: {
        paddingHorizontal: 10,
        paddingVertical: 3,
        borderRadius: 12,
    },
    roleBadgeText: {
        fontSize: 12,
        fontWeight: '600',
        color: THEME_COLOR,
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 6,
        gap: 4,
    },
    locationText: {
        fontSize: 13,
        color: '#666',
    },

    // Action buttons row
    actionButtonsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 16,
        gap: 10,
    },
    btnInnerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    primaryFollowBtn: {
        flex: 1,
        backgroundColor: THEME_COLOR,
        paddingVertical: 10,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
    },
    primaryFollowBtnText: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: 14,
    },
    followBtn: {
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
    },
    followingBtn: {
        flex: 1,
        backgroundColor: '#EFEFEF',
    },
    followingBtnDark: {
        backgroundColor: '#2A2A2A',
    },
    followBtnText: {
        fontWeight: 'bold',
        fontSize: 14,
    },
    followingBtnText: {
        color: '#333',
    },
    followingBtnTextDark: {
        color: '#FFF',
    },
    chatBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 10,
        borderRadius: 22,
        backgroundColor: '#FFF5E5',
        borderWidth: 1,
        borderColor: THEME_COLOR,
    },
    chatBtnDark: {
        backgroundColor: '#2C1D0A',
    },
    chatBtnText: {
        color: THEME_COLOR,
        fontWeight: 'bold',
        fontSize: 14,
    },
    iconActionBtn: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: '#FFF5E5',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#FFE2B8',
    },
    iconActionBtnDark: {
        backgroundColor: '#2C1D0A',
        borderColor: '#3D280E',
    },
    editProfileBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 10,
        borderRadius: 22,
        backgroundColor: '#FFF5E5',
        borderWidth: 1,
        borderColor: THEME_COLOR,
    },
    editProfileBtnDark: {
        backgroundColor: '#2C1D0A',
    },
    editProfileBtnText: {
        color: THEME_COLOR,
        fontWeight: 'bold',
        fontSize: 14,
    },

    // Stats Row
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        marginTop: 16,
        paddingTop: 14,
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
    },
    statsRowDark: {
        borderTopColor: '#2C2C2C',
    },
    statItem: {
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 8,
    },
    activeStatItem: {
        backgroundColor: '#FFF8F0',
    },
    statValue: {
        fontSize: 17,
        fontWeight: 'bold',
        color: '#222',
    },
    statLabel: {
        fontSize: 12,
        color: '#777',
        marginTop: 2,
    },
    statDivider: {
        width: 1,
        height: 24,
        backgroundColor: '#EAEAEA',
    },
    dividerDark: {
        backgroundColor: '#333',
    },

    // Section Tabs (Posts vs Followers)
    sectionTabsContainer: {
        flexDirection: 'row',
        backgroundColor: '#FFF',
        marginHorizontal: 16,
        borderRadius: 12,
        padding: 4,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#ECECEC',
    },
    sectionTabsContainerDark: {
        backgroundColor: '#1E1E1E',
        borderColor: '#2C2C2C',
    },
    sectionTab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 10,
        borderRadius: 10,
    },
    sectionTabActive: {
        backgroundColor: '#FFF5E5',
    },
    sectionTabText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666',
    },
    sectionTabTextActive: {
        color: THEME_COLOR,
        fontWeight: 'bold',
    },

    // Category Filter Chips
    categoryChipsContainer: {
        paddingHorizontal: 16,
        paddingBottom: 10,
        gap: 8,
    },
    categoryChip: {
        paddingHorizontal: 16,
        paddingVertical: 7,
        borderRadius: 18,
        backgroundColor: '#EFEFEF',
    },
    categoryChipSelected: {
        backgroundColor: THEME_COLOR,
    },
    categoryChipDark: {
        backgroundColor: '#2A2A2A',
    },
    categoryChipText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#444',
    },
    categoryChipTextSelected: {
        color: '#FFF',
    },

    // Follower list item
    followerCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        padding: 12,
        borderRadius: 12,
        marginBottom: 10,
        elevation: 1,
        shadowColor: '#000',
        shadowOpacity: 0.04,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 1 },
    },
    followerAvatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#EAEAEA',
    },
    followerDetails: {
        flex: 1,
        marginLeft: 12,
    },
    followerName: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#222',
    },
    followerRole: {
        fontSize: 12,
        color: '#888',
        marginTop: 2,
    },
    followerActionBtn: {
        paddingHorizontal: 14,
        paddingVertical: 7,
        borderRadius: 16,
    },
    followBackBtn: {
        backgroundColor: THEME_COLOR,
    },
    followBackBtnText: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: 'bold',
    },
    followerActionBtnText: {
        fontSize: 12,
        fontWeight: 'bold',
    },

    // Utilities
    textDark: { color: '#FFF' },
    subtextDark: { color: '#AAA' },
    centerLoading: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingContainer: {
        paddingVertical: 30,
        alignItems: 'center',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 50,
        paddingHorizontal: 20,
    },
    emptyTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginTop: 12,
    },
    emptySubtitle: {
        fontSize: 13,
        color: '#888',
        textAlign: 'center',
        marginTop: 4,
    },
});
