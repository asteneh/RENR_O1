import React, { useState, useEffect } from 'react'; // Refactored to fix hook order and syntax error
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, ActivityIndicator, Modal, Share } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../../store/useAuthStore';
import { useUserProfile } from '../../api/services/userService';
import { useNotificationStore } from '../../store/useNotificationStore';
import { CONFIG } from '../../config';
import ZoomableImageModal from '../../components/common/ZoomableImageModal';
import { useThemeStore } from '../../store/useThemeStore';
import { useTranslation } from '../../i18n';
import { useUnreadMessagesCount } from '../../api/services/messageService';

import {
  UserRoles,
  RoleLabels,
  RoleIcons,
  FeatureActions,
  canAccessMultiRole,
  UserRole,
} from '../../constants/UserRoles';

const THEME_COLOR = '#FF8C00';

const MenuOption = ({ icon, label, onPress, color = THEME_COLOR, badge }: any) => {
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <View style={styles.menuLeft}>
        <Ionicons name={icon} size={22} color={color} />
        <Text style={[styles.menuText, isDark && styles.menuTextDark]}>{label}</Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        {badge ? (
          <View style={styles.menuBadge}>
            <Text style={styles.menuBadgeText}>{badge}</Text>
          </View>
        ) : null}
        <Ionicons name="chevron-forward" size={20} color={isDark ? "#555" : "#ccc"} />
      </View>
    </TouchableOpacity>
  );
};


export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { logout, user: authUser, getUserRoles, hasMembership } = useAuthStore();
  const { showNotification, showAlert, unreadNotifications, unreadMessages, setUnreadMessages } = useNotificationStore();
  const { data: profile, isLoading, error, refetch } = useUserProfile();

  const userId = authUser?.id || authUser?._id;
  const { data: unreadMessagesData } = useUnreadMessagesCount(userId);
  const displayUnreadMessages = unreadMessagesData?.unreadCount ?? unreadMessages;

  useEffect(() => {
    if (unreadMessagesData && typeof unreadMessagesData.unreadCount === 'number') {
      setUnreadMessages(unreadMessagesData.unreadCount);
    }
  }, [unreadMessagesData]);
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';
  const { t } = useTranslation();

  const [isZoomModalVisible, setIsZoomModalVisible] = useState(false);
  const [zoomImage, setZoomImage] = useState('');
  const [isAboutVisible, setIsAboutVisible] = useState(false);
  const [isReferralModalVisible, setIsReferralModalVisible] = useState(false);

  const currentRoles = getUserRoles();
  const hasActivePlan = hasMembership();

  const handleLogout = () => {
    showAlert(t('logout'), t('logoutConfirm'), [
      { text: t('cancel'), style: "cancel" },
      {
        text: t('logout'), style: 'destructive', onPress: () => {
          logout();
          navigation.navigate('Login');
        }
      }
    ]);
  };

  const handleCopyReferralCode = async () => {
    if (profile?.referralCode) {
      await Clipboard.setStringAsync(profile.referralCode);
      showNotification(t('codeCopied') || 'Referral code copied to clipboard!', 'success');
    }
  };

  const handleShareReferral = async () => {
    if (profile?.referralCode) {
      try {
        const message = `Join me on Gadal Market! Use my referral code ${profile.referralCode} to sign up.\nDownload the app and start: gadalmarket://referral/${profile.referralCode}\nOr signup online: https://gadalmarket.com/referral/${profile.referralCode}`;
        await Share.share({
          message,
          title: 'Refer a Friend',
        });
      } catch (error) {
        console.error('Share error:', error);
      }
    }
  };

  if (isLoading) return <View style={[styles.center, isDark && styles.containerDark]}><ActivityIndicator size="large" color={THEME_COLOR} /></View>;

  if (error) return (
    <View style={[styles.center, isDark && styles.containerDark]}>
      <Ionicons name="alert-circle-outline" size={48} color="#FF6B6B" />
      <Text style={{ marginTop: 10, color: isDark ? '#aaa' : '#666' }}>{t('failedToLoadProfile')}</Text>
      <TouchableOpacity onPress={() => refetch()} style={{ marginTop: 20, backgroundColor: THEME_COLOR, paddingHorizontal: 30, paddingVertical: 12, borderRadius: 8, width: 200, alignItems: 'center' }}>
        <Text style={{ color: '#fff', fontWeight: 'bold' }}>{t('retry')}</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={handleLogout} style={{ marginTop: 15, padding: 10 }}>
        <Text style={{ color: '#FF6B6B', fontWeight: '600' }}>{t('logoutFromAccount')}</Text>
      </TouchableOpacity>
    </View>
  );

  const isOperator = currentRoles.includes(UserRoles.OPERATOR);

  // Multi-role capability checks (if ANY role grants access, user has it)
  const canPostJob = canAccessMultiRole(currentRoles, FeatureActions.POST_JOB);
  const canPostSale = canAccessMultiRole(currentRoles, FeatureActions.POST_SALE);
  const canPostRent = canAccessMultiRole(currentRoles, FeatureActions.POST_RENT);
  const canRequestBuy = canAccessMultiRole(currentRoles, FeatureActions.REQUEST_BUY);
  const canRequestRent = canAccessMultiRole(currentRoles, FeatureActions.REQUEST_RENT);
  const canJoinOperator = canAccessMultiRole(currentRoles, FeatureActions.JOIN_OPERATOR);

  return (
    <SafeAreaView style={[styles.container, isDark && styles.containerDark]} edges={['top', 'bottom']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

        {/* Header */}
        <View style={[styles.header, isDark && styles.headerDark]}>
          <View style={styles.profileTop}>
            <TouchableOpacity
              activeOpacity={0.9}
              style={styles.avatarContainer}
              onPress={() => {
                if (profile?.proflePic) {
                  setZoomImage(`${CONFIG.FILE_URL}/${profile.proflePic}`);
                  setIsZoomModalVisible(true);
                }
              }}
            >
              <Image
                source={{ uri: profile?.proflePic ? `${CONFIG.FILE_URL}/${profile.proflePic}` : 'https://via.placeholder.com/100' }}
                style={styles.avatar}
              />
            </TouchableOpacity>
            <View style={styles.userInfo}>
              <Text style={[styles.userName, isDark && styles.userNameDark]}>
                {profile?.firstName} {profile?.lastName}
              </Text>
              <Text style={styles.userRoleText}>
                {currentRoles.map(role => RoleLabels[role]).join(' · ')}
              </Text>
              {/* <View style={styles.roleBadgeRow}>
                {hasActivePlan ? (
                  <View style={[styles.membershipBadge, styles.membershipActive]}>
                    <Ionicons name="diamond" size={10} color="#FFD700" />
                    <Text style={styles.membershipText}>Premium</Text>
                  </View>
                ) : (
                  <View style={[styles.membershipBadge, styles.membershipFree]}>
                    <Text style={styles.membershipFreeText}>Free</Text>
                  </View>
                )}
              </View> */}
              <Text style={[styles.userEmail, isDark && styles.userEmailDark]}>{profile?.phoneNumber}</Text>

              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, isDark && styles.statValueDark]}>{profile?.postCount || 0}</Text>
                  <Text style={[styles.statLabel, isDark && styles.statLabelDark]}>{t('sales')}</Text>
                </View>
                <View style={[styles.statDivider, isDark && styles.dividerDark]} />
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, isDark && styles.statValueDark]}>0</Text>
                  <Text style={[styles.statLabel, isDark && styles.statLabelDark]}>{t('buy')}</Text>
                </View>
                <View style={[styles.statDivider, isDark && styles.dividerDark]} />
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, isDark && styles.statValueDark]}>0</Text>
                  <Text style={[styles.statLabel, isDark && styles.statLabelDark]}>{t('every')}</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* My Account Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>{t('myAccount')}</Text>
          <View style={[styles.card, isDark && styles.cardDark]}>
            <MenuOption
              icon="person-outline"
              label={t('editProfile')}
              onPress={() => navigation.navigate('EditProfile')}
            />
            {isOperator && (
              <>
                <View style={[styles.divider, isDark && styles.dividerDark]} />
                <MenuOption
                  icon="construct-outline"
                  label="Edit Operator Profile"
                  onPress={() =>
                    navigation.navigate('EditOperatorProfile', {
                      operatorId: authUser?._id || authUser?.id,
                    })
                  }
                />
              </>
            )}
            <View style={[styles.divider, isDark && styles.dividerDark]} />
            <MenuOption
              icon="lock-closed-outline"
              label={t('changePassword')}
              onPress={() => navigation.navigate('ResetPassword', { phone: profile?.phoneNumber })}
            />
            <View style={[styles.divider, isDark && styles.dividerDark]} />
            <MenuOption
              icon="gift-outline"
              label={t('referFriend') || 'Refer a Friend'}
              onPress={() => setIsReferralModalVisible(true)}
            />
          </View>
        </View>

        {/* Quick Actions Section (Role-Specific) */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>{t('quickActions')}</Text>
          <View style={styles.quickActionsRow}>
            {(canPostSale || canPostRent) && (
              <TouchableOpacity
                style={[styles.quickActionCard, isDark && styles.quickActionCardDark]}
                onPress={() => navigation.navigate('PostProperty')}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: isDark ? '#2C1D0A' : '#FFF5E5' }]}>
                  <Ionicons name="add-circle-outline" size={24} color={THEME_COLOR} />
                </View>
                <Text style={[styles.quickActionLabel, isDark && styles.quickActionLabelDark]}>{t('postItem')}</Text>
              </TouchableOpacity>
            )}
            {(canRequestBuy || canRequestRent) && (
              <TouchableOpacity
                style={[styles.quickActionCard, isDark && styles.quickActionCardDark]}
                onPress={() => navigation.navigate('PostRequest')}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: isDark ? '#0A2535' : '#E5F6FF' }]}>
                  <Ionicons name="document-text-outline" size={24} color="#2196F3" />
                </View>
                <Text style={[styles.quickActionLabel, isDark && styles.quickActionLabelDark]}>{t('postRequest')}</Text>
              </TouchableOpacity>
            )}
            {canPostJob && (
              <TouchableOpacity
                style={[styles.quickActionCard, isDark && styles.quickActionCardDark]}
                onPress={() => navigation.navigate('PostJob')}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: isDark ? '#0F2C0F' : '#E5FFE5' }]}>
                  <Ionicons name="briefcase-outline" size={24} color="#4CAF50" />
                </View>
                <Text style={[styles.quickActionLabel, isDark && styles.quickActionLabelDark]}>{t('postJob')}</Text>
              </TouchableOpacity>
            )}

          </View>
        </View>

        {/* Activities Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>{t('activities')}</Text>
          <View style={[styles.card, isDark && styles.cardDark]}>
            <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Notification')}>
              <View style={styles.menuLeft}>
                <Ionicons name="notifications-outline" size={22} color={THEME_COLOR} />
                <Text style={[styles.menuText, isDark && styles.menuTextDark]}>{t('notifications')}</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                {unreadNotifications > 0 && (
                  <View style={styles.menuBadge}>
                    <Text style={styles.menuBadgeText}>{unreadNotifications}</Text>
                  </View>
                )}
                <Ionicons name="chevron-forward" size={20} color={isDark ? "#555" : "#ccc"} />
              </View>
            </TouchableOpacity>
            <View style={[styles.divider, isDark && styles.dividerDark]} />
            <MenuOption
              icon="chatbubble-ellipses-outline"
              label={t('messages')}
              onPress={() => navigation.navigate('Messages')}
              badge={displayUnreadMessages > 0 ? displayUnreadMessages : undefined}
            />
            <View style={[styles.divider, isDark && styles.dividerDark]} />
            <MenuOption
              icon="heart-outline"
              label={t('myFavorites')}
              onPress={() => navigation.navigate('Favorites')}
            />
            {(canPostSale || canPostRent) && (
              <>
                <View style={[styles.divider, isDark && styles.dividerDark]} />
                <MenuOption
                  icon="list-outline"
                  label={t('myPosts')}
                  onPress={() => navigation.navigate('MyListings')}
                />
              </>
            )}
            {(canRequestBuy || canRequestRent) && (
              <>
                <View style={[styles.divider, isDark && styles.dividerDark]} />
                <MenuOption
                  icon="document-text-outline"
                  label={t('myRequests')}
                  onPress={() => navigation.navigate('MyRequests')}
                />
              </>
            )}
            <View style={[styles.divider, isDark && styles.dividerDark]} />
            <MenuOption
              icon="people-outline"
              label={t('following')}
              onPress={() => navigation.navigate('Followings')}
            />
            <View style={[styles.divider, isDark && styles.dividerDark]} />
            <MenuOption
              icon="people-outline"
              label={t('followers')}
              onPress={() => navigation.navigate('Followers')}
            />
            <View style={[styles.divider, isDark && styles.dividerDark]} />
            <MenuOption
              icon="cube-outline"
              label={t('myPackages')}
              onPress={() => navigation.navigate('MyPackages')}
            />
            {isOperator && (
              <>
                <View style={[styles.divider, isDark && styles.dividerDark]} />
                <MenuOption
                  icon="briefcase-outline"
                  label={t('appliedJobs')}
                  onPress={() => navigation.navigate('MyJobs', { mode: 'applied' })}
                />
              </>
            )}
            {canPostJob && (
              <>
                <View style={[styles.divider, isDark && styles.dividerDark]} />
                <MenuOption
                  icon="briefcase-outline"
                  label={t('postedJobs')}
                  onPress={() => navigation.navigate('MyJobs', { mode: 'posted' })}
                />
              </>
            )}
          </View>
        </View>

        {/* Support Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>{t('support')}</Text>
          <View style={[styles.card, isDark && styles.cardDark]}>
            <MenuOption icon="settings-outline" label={t('appSettings')} onPress={() => navigation.navigate('AppSettings')} />

            <View style={[styles.divider, isDark && styles.dividerDark]} />
            <MenuOption icon="information-circle-outline" label={t('about')} onPress={() => setIsAboutVisible(true)} />

            <View style={[styles.divider, isDark && styles.dividerDark]} />
            <MenuOption icon="chatbubble-outline" label={t('feedback')} onPress={() => navigation.navigate('Feedback')} />
          </View>
        </View>

        {/* Bottom Actions */}
        <View style={styles.actionSection}>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color="#fff" style={styles.btnIcon} />
            <Text style={styles.logoutBtnText}>{t('logout')}</Text>
          </TouchableOpacity>
        </View>

        {/* App Info Footer */}
        <View style={styles.footerInfo}>
          <Text style={[styles.footerText, isDark && styles.footerTextDark]}>{t('gadalMarket')} v1.0.0</Text>
          <Text style={[styles.footerSubtext, isDark && styles.footerTextDark]}>{t('footerTagline')}</Text>
        </View>

      </ScrollView>

      <ZoomableImageModal
        visible={isZoomModalVisible}
        imageUri={zoomImage}
        onClose={() => setIsZoomModalVisible(false)}
      />

      {/* About App Modal */}
      <Modal
        visible={isAboutVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsAboutVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.aboutModalContent, isDark && styles.cardDark]}>
            <View style={styles.aboutHeader}>
              <Text style={[styles.aboutHeaderTitle, isDark && styles.textDark]}>{t('aboutGadalMarket')}</Text>
              <TouchableOpacity onPress={() => setIsAboutVisible(false)}>
                <Ionicons name="close-circle" size={28} color={THEME_COLOR} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.aboutScrollContent}>
              <View style={styles.aboutLogoContainer}>
                <Image
                  source={require('../../../assets/orange-logo.png')}
                  style={styles.aboutLogo}
                />
                <Text style={[styles.aboutAppName, isDark && styles.textDark]}>{t('gadalMarket')}</Text>
                <Text style={styles.aboutAppVersion}>{t('version')}</Text>
              </View>

              <Text style={[styles.aboutDescription, isDark && styles.aboutDescriptionDark]}>
                {t('aboutDescription')}
              </Text>

              <View style={styles.featureList}>
                <Text style={[styles.featureTitle, isDark && styles.textDark]}>{t('keyOfferings')}</Text>
                <View style={styles.featureItem}>
                  <Ionicons name="checkmark-circle-outline" size={18} color={THEME_COLOR} />
                  <Text style={[styles.featureText, isDark && styles.aboutDescriptionDark]}>{t('offering1')}</Text>
                </View>
                <View style={styles.featureItem}>
                  <Ionicons name="checkmark-circle-outline" size={18} color={THEME_COLOR} />
                  <Text style={[styles.featureText, isDark && styles.aboutDescriptionDark]}>{t('offering2')}</Text>
                </View>
                <View style={styles.featureItem}>
                  <Ionicons name="checkmark-circle-outline" size={18} color={THEME_COLOR} />
                  <Text style={[styles.featureText, isDark && styles.aboutDescriptionDark]}>{t('offering3')}</Text>
                </View>
                <View style={styles.featureItem}>
                  <Ionicons name="checkmark-circle-outline" size={18} color={THEME_COLOR} />
                  <Text style={[styles.featureText, isDark && styles.aboutDescriptionDark]}>{t('offering4')}</Text>
                </View>
              </View>

              <Text style={styles.copyrightText}>
                © {new Date().getFullYear()} Gadal Market. All rights reserved.
              </Text>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Referral Modal */}
      <Modal
        visible={isReferralModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsReferralModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.referralModalContent, isDark && styles.cardDark]}>
            <View style={styles.referralHeader}>
              <Text style={[styles.referralHeaderTitle, isDark && styles.textDark]}>{t('referralTitle') || 'Refer & Earn'}</Text>
              <TouchableOpacity onPress={() => setIsReferralModalVisible(false)}>
                <Ionicons name="close-circle" size={28} color={THEME_COLOR} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.referralScrollContent}>
              <View style={styles.referralHeroContainer}>
                <View style={styles.giftIconContainer}>
                  <Ionicons name="gift-outline" size={48} color="#fff" />
                </View>
                <Text style={[styles.referralDescriptionText, isDark && styles.aboutDescriptionDark]}>
                  {t('referralDescription')}
                </Text>
              </View>

              <View style={[styles.codeBox, isDark && styles.codeBoxDark]}>
                <Text style={styles.codeLabel}>{t('referralCode')}</Text>
                <Text style={[styles.codeText, isDark && styles.textDark]}>{profile?.referralCode || 'N/A'}</Text>
                
                {profile?.referralCode ? (
                  <TouchableOpacity style={styles.copyBtn} onPress={handleCopyReferralCode}>
                    <Ionicons name="copy-outline" size={16} color="#fff" style={{ marginRight: 6 }} />
                    <Text style={styles.copyBtnText}>{t('copyCode')}</Text>
                  </TouchableOpacity>
                ) : null}
              </View>

              <TouchableOpacity style={styles.shareBtn} onPress={handleShareReferral}>
                <Ionicons name="share-social-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.shareBtnText}>{t('shareCode')}</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header: { padding: 20, backgroundColor: '#fff', borderBottomLeftRadius: 30, borderBottomRightRadius: 30, elevation: 2 },
  profileTop: { flexDirection: 'row', alignItems: 'center' },
  avatarContainer: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#F0F0F0', elevation: 3, overflow: 'hidden'
  },
  avatar: { width: '100%', height: '100%' },
  userInfo: { marginLeft: 20, flex: 1 },
  userName: { fontSize: 20, fontWeight: 'bold', color: '#111' },
  userRoleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF8C00',
    marginTop: 3,
  },
  userEmail: { fontSize: 13, color: '#666', marginTop: 2 },

  // Role & Membership Badges
  roleBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4, flexWrap: 'wrap' },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: THEME_COLOR,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  roleBadgeText: { fontSize: 10, color: '#fff', fontWeight: 'bold', textTransform: 'uppercase' },
  membershipBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  membershipActive: { backgroundColor: '#1A1A2E' },
  membershipText: { fontSize: 10, color: '#FFD700', fontWeight: 'bold' },
  membershipFree: { backgroundColor: '#E0E0E0' },
  membershipFreeText: { fontSize: 10, color: '#888', fontWeight: 'bold' },

  statsRow: { flexDirection: 'row', alignItems: 'center', marginTop: 15 },
  statItem: { alignItems: 'center', minWidth: 50 },
  statValue: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  statLabel: { fontSize: 10, color: '#888', marginTop: 2 },
  statDivider: { width: 1, height: 15, backgroundColor: '#EEE', marginHorizontal: 10 },

  // Quick Actions
  quickActionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickActionCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    width: '30%',
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickActionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#555',
    textAlign: 'center',
  },

  section: { paddingHorizontal: 20, marginTop: 25 },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: '#888', marginBottom: 10, marginLeft: 5, textTransform: 'uppercase' },
  card: { backgroundColor: '#fff', borderRadius: 16, paddingVertical: 5, elevation: 1 },

  menuItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  menuLeft: { flexDirection: 'row', alignItems: 'center' },
  menuText: { fontSize: 16, color: '#333', marginLeft: 15 },
  divider: { height: 1, backgroundColor: '#FAF9F6', marginHorizontal: 16 },

  actionSection: { paddingHorizontal: 20, marginTop: 30 },
  btnIcon: { marginRight: 10 },

  // Upgrade Banner
  upgradeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1A1A2E',
    borderRadius: 16,
    padding: 18,
    elevation: 3,
  },
  upgradeBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  upgradeTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  upgradeSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 2,
  },

  logoutBtn: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    backgroundColor: '#FF6B6B', borderRadius: 15,
    paddingVertical: 16,
    elevation: 4
  },
  logoutBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  menuBadge: {
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    paddingHorizontal: 6,
  },
  menuBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  // Dark Mode Overrides
  containerDark: { backgroundColor: '#121212' },
  headerDark: { backgroundColor: '#1E1E1E', borderBottomLeftRadius: 30, borderBottomRightRadius: 30, elevation: 0 },
  userNameDark: { color: '#fff' },
  userEmailDark: { color: '#aaa' },
  statValueDark: { color: '#eee' },
  statLabelDark: { color: '#777' },
  sectionTitleDark: { color: '#888' },
  cardDark: { backgroundColor: '#1E1E1E', elevation: 0 },
  menuTextDark: { color: '#fff' },
  dividerDark: { backgroundColor: '#2C2C2C' },
  quickActionCardDark: { backgroundColor: '#1E1E1E', elevation: 0 },
  quickActionLabelDark: { color: '#ccc' },
  textDark: { color: '#fff' },

  // App Info Footer
  footerInfo: {
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 10,
  },
  footerText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#888',
  },
  footerSubtext: {
    fontSize: 10,
    color: '#aaa',
    marginTop: 2,
  },
  footerTextDark: {
    color: '#666',
  },

  // About App Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  aboutModalContent: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  aboutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingBottom: 12,
    marginBottom: 15,
  },
  aboutHeaderTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111',
  },
  aboutScrollContent: {
    alignItems: 'center',
  },
  aboutLogoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  aboutLogo: {
    width: 80,
    height: 80,
    resizeMode: 'contain',
  },
  aboutAppName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#111',
    marginTop: 8,
  },
  aboutAppVersion: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  aboutDescription: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 20,
  },
  aboutDescriptionDark: {
    color: '#ccc',
  },
  featureList: {
    alignSelf: 'stretch',
    marginBottom: 20,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#111',
    marginBottom: 10,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 8,
  },
  featureText: {
    fontSize: 13,
    color: '#555',
    flex: 1,
    lineHeight: 18,
  },
  copyrightText: {
    fontSize: 11,
    color: '#999',
    marginTop: 15,
    textAlign: 'center',
  },
  referralModalContent: {
    width: '90%',
    maxHeight: '85%',
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  referralHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingBottom: 12,
    marginBottom: 15,
  },
  referralHeaderTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111',
  },
  referralScrollContent: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  referralHeroContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  giftIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: THEME_COLOR,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },
  referralDescriptionText: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
    textAlign: 'center',
    paddingHorizontal: 10,
  },
  codeBox: {
    width: '100%',
    backgroundColor: '#FFF5E5',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFE0B2',
    borderStyle: 'dashed',
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  codeBoxDark: {
    backgroundColor: '#2C1D0A',
    borderColor: '#4E3618',
  },
  codeLabel: {
    fontSize: 12,
    color: '#FF8C00',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  codeText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111',
    letterSpacing: 2,
    marginBottom: 12,
  },
  copyBtn: {
    flexDirection: 'row',
    backgroundColor: THEME_COLOR,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: 'center',
  },
  copyBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  shareBtn: {
    flexDirection: 'row',
    backgroundColor: '#2196F3',
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  shareBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
});
