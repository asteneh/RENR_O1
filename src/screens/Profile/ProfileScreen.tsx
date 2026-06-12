import React, { useState } from 'react'; // Refactored to fix hook order and syntax error
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, ActivityIndicator, Modal } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../../store/useAuthStore';
import { useUserProfile } from '../../api/services/userService';
import { useNotificationStore } from '../../store/useNotificationStore';
import { CONFIG } from '../../config';
import ZoomableImageModal from '../../components/common/ZoomableImageModal';
import { useThemeStore } from '../../store/useThemeStore';

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
  const { showNotification, showAlert, unreadNotifications } = useNotificationStore();
  const { data: profile, isLoading, error, refetch } = useUserProfile();
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';

  const [isZoomModalVisible, setIsZoomModalVisible] = useState(false);
  const [zoomImage, setZoomImage] = useState('');
  const [isAboutVisible, setIsAboutVisible] = useState(false);

  const currentRoles = getUserRoles();
  const hasActivePlan = hasMembership();

  const handleLogout = () => {
    showAlert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout", style: 'destructive', onPress: () => {
          logout();
          navigation.navigate('Login');
        }
      }
    ]);
  };

  if (isLoading) return <View style={[styles.center, isDark && styles.containerDark]}><ActivityIndicator size="large" color={THEME_COLOR} /></View>;

  if (error) return (
    <View style={[styles.center, isDark && styles.containerDark]}>
      <Ionicons name="alert-circle-outline" size={48} color="#FF6B6B" />
      <Text style={{ marginTop: 10, color: isDark ? '#aaa' : '#666' }}>Failed to load profile details</Text>
      <TouchableOpacity onPress={() => refetch()} style={{ marginTop: 20, backgroundColor: THEME_COLOR, paddingHorizontal: 30, paddingVertical: 12, borderRadius: 8, width: 200, alignItems: 'center' }}>
        <Text style={{ color: '#fff', fontWeight: 'bold' }}>Retry</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={handleLogout} style={{ marginTop: 15, padding: 10 }}>
        <Text style={{ color: '#FF6B6B', fontWeight: '600' }}>Logout from account</Text>
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
                  <Text style={[styles.statLabel, isDark && styles.statLabelDark]}>Sales</Text>
                </View>
                <View style={[styles.statDivider, isDark && styles.dividerDark]} />
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, isDark && styles.statValueDark]}>0</Text>
                  <Text style={[styles.statLabel, isDark && styles.statLabelDark]}>Buy</Text>
                </View>
                <View style={[styles.statDivider, isDark && styles.dividerDark]} />
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, isDark && styles.statValueDark]}>0</Text>
                  <Text style={[styles.statLabel, isDark && styles.statLabelDark]}>Every</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* My Account Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>My Account</Text>
          <View style={[styles.card, isDark && styles.cardDark]}>
            <MenuOption
              icon="person-outline"
              label="Edit Profile"
              onPress={() => navigation.navigate('EditProfile')}
            />
            <View style={[styles.divider, isDark && styles.dividerDark]} />
            <MenuOption
              icon="lock-closed-outline"
              label="Change Password"
              onPress={() => navigation.navigate('ResetPassword', { phone: profile?.phoneNumber })}
            />
          </View>
        </View>

        {/* Quick Actions Section (Role-Specific) */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>Quick Actions</Text>
          <View style={styles.quickActionsRow}>
            {(canPostSale || canPostRent) && (
              <TouchableOpacity
                style={[styles.quickActionCard, isDark && styles.quickActionCardDark]}
                onPress={() => navigation.navigate('PostProperty')}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: isDark ? '#2C1D0A' : '#FFF5E5' }]}>
                  <Ionicons name="add-circle-outline" size={24} color={THEME_COLOR} />
                </View>
                <Text style={[styles.quickActionLabel, isDark && styles.quickActionLabelDark]}>Post Item</Text>
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
                <Text style={[styles.quickActionLabel, isDark && styles.quickActionLabelDark]}>Post Request</Text>
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
                <Text style={[styles.quickActionLabel, isDark && styles.quickActionLabelDark]}>Post Job</Text>
              </TouchableOpacity>
            )}

          </View>
        </View>

        {/* Activities Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>Activities</Text>
          <View style={[styles.card, isDark && styles.cardDark]}>
            <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Notification')}>
              <View style={styles.menuLeft}>
                <Ionicons name="notifications-outline" size={22} color={THEME_COLOR} />
                <Text style={[styles.menuText, isDark && styles.menuTextDark]}>Notifications</Text>
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
              label="Messages"
              onPress={() => navigation.navigate('Messages')}
            />
            <View style={[styles.divider, isDark && styles.dividerDark]} />
            <MenuOption
              icon="heart-outline"
              label="My Favorites"
              onPress={() => navigation.navigate('Favorites')}
            />
            {(canPostSale || canPostRent) && (
              <>
                <View style={[styles.divider, isDark && styles.dividerDark]} />
                <MenuOption
                  icon="list-outline"
                  label="My Posts"
                  onPress={() => navigation.navigate('MyListings')}
                />
              </>
            )}
            {(canRequestBuy || canRequestRent) && (
              <>
                <View style={[styles.divider, isDark && styles.dividerDark]} />
                <MenuOption
                  icon="document-text-outline"
                  label="My Requests"
                  onPress={() => navigation.navigate('MyRequests')}
                />
              </>
            )}
            <View style={[styles.divider, isDark && styles.dividerDark]} />
            <MenuOption
              icon="people-outline"
              label="Following"
              onPress={() => navigation.navigate('Followings')}
            />
            <View style={[styles.divider, isDark && styles.dividerDark]} />
            <MenuOption
              icon="cube-outline"
              label="My Packages"
              onPress={() => navigation.navigate('MyPackages')}
            />
            {isOperator && (
              <>
                <View style={[styles.divider, isDark && styles.dividerDark]} />
                <MenuOption
                  icon="briefcase-outline"
                  label="Applied Jobs"
                  onPress={() => navigation.navigate('MyJobs', { mode: 'applied' })}
                />
              </>
            )}
            {canPostJob && (
              <>
                <View style={[styles.divider, isDark && styles.dividerDark]} />
                <MenuOption
                  icon="briefcase-outline"
                  label="Posted Jobs"
                  onPress={() => navigation.navigate('MyJobs', { mode: 'posted' })}
                />
              </>
            )}
          </View>
        </View>

        {/* Support Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>Support</Text>
          <View style={[styles.card, isDark && styles.cardDark]}>
            <MenuOption icon="settings-outline" label="App Settings" onPress={() => navigation.navigate('AppSettings')} />

            <View style={[styles.divider, isDark && styles.dividerDark]} />
            <MenuOption icon="information-circle-outline" label="About" onPress={() => setIsAboutVisible(true)} />

            <View style={[styles.divider, isDark && styles.dividerDark]} />
            <MenuOption icon="chatbubble-outline" label="Feedback" onPress={() => navigation.navigate('Feedback')} />
          </View>
        </View>

        {/* Bottom Actions */}
        <View style={styles.actionSection}>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color="#fff" style={styles.btnIcon} />
            <Text style={styles.logoutBtnText}>Logout</Text>
          </TouchableOpacity>
        </View>

        {/* App Info Footer */}
        <View style={styles.footerInfo}>
          <Text style={[styles.footerText, isDark && styles.footerTextDark]}>Gadal Market v1.0.0</Text>
          <Text style={[styles.footerSubtext, isDark && styles.footerTextDark]}>Ethiopia's Heavy Machinery & Equipment Platform</Text>
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
              <Text style={[styles.aboutHeaderTitle, isDark && styles.textDark]}>About Gadal Market</Text>
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
                <Text style={[styles.aboutAppName, isDark && styles.textDark]}>Gadal Market</Text>
                <Text style={styles.aboutAppVersion}>Version 1.0.0 (Expo)</Text>
              </View>

              <Text style={[styles.aboutDescription, isDark && styles.aboutDescriptionDark]}>
                Gadal Market is a comprehensive machinery, vehicle, and equipment marketplace platform built specifically for the industry. It connects Buyers, Sellers, Lessors (Akeray), Lessees (Tekeray), Operators, and Employers in a single, robust ecosystem.
              </Text>

              <View style={styles.featureList}>
                <Text style={[styles.featureTitle, isDark && styles.textDark]}>Key Offerings:</Text>
                <View style={styles.featureItem}>
                  <Ionicons name="checkmark-circle-outline" size={18} color={THEME_COLOR} />
                  <Text style={[styles.featureText, isDark && styles.aboutDescriptionDark]}>Buy or Rent premium heavy machinery and vehicles.</Text>
                </View>
                <View style={styles.featureItem}>
                  <Ionicons name="checkmark-circle-outline" size={18} color={THEME_COLOR} />
                  <Text style={[styles.featureText, isDark && styles.aboutDescriptionDark]}>List your equipment for sale or lease using a simple posting wizard.</Text>
                </View>
                <View style={styles.featureItem}>
                  <Ionicons name="checkmark-circle-outline" size={18} color={THEME_COLOR} />
                  <Text style={[styles.featureText, isDark && styles.aboutDescriptionDark]}>Connect with certified machine operators or post job vacancies.</Text>
                </View>
                <View style={styles.featureItem}>
                  <Ionicons name="checkmark-circle-outline" size={18} color={THEME_COLOR} />
                  <Text style={[styles.featureText, isDark && styles.aboutDescriptionDark]}>Submit demand requests to get competitive bids from suppliers.</Text>
                </View>
              </View>

              <Text style={styles.copyrightText}>
                © {new Date().getFullYear()} Gadal Market. All rights reserved.
              </Text>
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
});
