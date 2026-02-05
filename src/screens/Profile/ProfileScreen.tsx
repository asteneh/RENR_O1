import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../../store/useAuthStore';
import { useUserProfile } from '../../api/services/userService';
import { CONFIG } from '../../config';

const THEME_COLOR = '#FF8C00';

export default function ProfileScreen() {
  const navigation = useNavigation<any>();
  const { logout, user: authUser } = useAuthStore();
  const { data: profile, isLoading, error, refetch } = useUserProfile();

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout", style: 'destructive', onPress: () => {
          logout();
          navigation.navigate('Login');
        }
      }
    ]);
  };

  const MenuOption = ({ icon, label, onPress, color = THEME_COLOR }: any) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <View style={styles.menuLeft}>
        <Ionicons name={icon} size={22} color={color} />
        <Text style={styles.menuText}>{label}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#ccc" />
    </TouchableOpacity>
  );

  if (isLoading) return <View style={styles.center}><ActivityIndicator size="large" color={THEME_COLOR} /></View>;

  if (error) return (
    <View style={styles.center}>
      <Ionicons name="alert-circle-outline" size={48} color="#FF6B6B" />
      <Text style={{ marginTop: 10, color: '#666' }}>Failed to load profile details</Text>
      <TouchableOpacity onPress={() => refetch()} style={{ marginTop: 20, backgroundColor: THEME_COLOR, padding: 10, borderRadius: 8 }}>
        <Text style={{ color: '#fff' }}>Retry</Text>
      </TouchableOpacity>
    </View>
  );

  const isOperator = profile?.userType === 'Operator';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.profileTop}>
            <View style={styles.avatarContainer}>
              <Image
                source={{ uri: profile?.proflePic ? `${CONFIG.FILE_URL}/${profile.proflePic}` : 'https://via.placeholder.com/100' }}
                style={styles.avatar}
              />
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{profile?.firstName} {profile?.lastName}</Text>
              <Text style={styles.userEmail}>{profile?.phoneNumber}</Text>

              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{profile?.postCount || 0}</Text>
                  <Text style={styles.statLabel}>Ads</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{profile?.followers?.length || 0}</Text>
                  <Text style={styles.statLabel}>Followers</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* My Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My Account</Text>
          <View style={styles.card}>
            <MenuOption
              icon="person-outline"
              label="Edit Profile"
              onPress={() => navigation.navigate('EditProfile')}
            />
            <View style={styles.divider} />
            <MenuOption
              icon="lock-closed-outline"
              label="Change Password"
              onPress={() => navigation.navigate('ResetPassword', { phone: profile?.phoneNumber })}
            />
          </View>
        </View>

        {/* Activities Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Activities</Text>
          <View style={styles.card}>
            <MenuOption
              icon="heart-outline"
              label="My Favorites"
              onPress={() => navigation.navigate('Favorites')}
            />
            <View style={styles.divider} />
            <MenuOption
              icon="list-outline"
              label="My Listings"
              onPress={() => navigation.navigate('MyListings')}
            />
            <View style={styles.divider} />
            <MenuOption
              icon="document-text-outline"
              label="My Requests"
              onPress={() => navigation.navigate('MyRequests')}
            />
            <View style={styles.divider} />
            <MenuOption
              icon="people-outline"
              label="Following"
              onPress={() => navigation.navigate('Followings')}
            />
            <View style={styles.divider} />
            <MenuOption
              icon="cube-outline"
              label="My Packages"
              onPress={() => navigation.navigate('MyPackages')}
            />
            <View style={styles.divider} />
            <MenuOption
              icon="briefcase-outline"
              label={isOperator ? "Applied Jobs" : "Posted Jobs"}
              onPress={() => navigation.navigate('MyJobs')}
            />
          </View>
        </View>

        {/* Support Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          <View style={styles.card}>
            <MenuOption icon="settings-outline" label="App Settings" />
            <View style={styles.divider} />
            <MenuOption icon="help-circle-outline" label="Help & Support" />
          </View>
        </View>

        {/* Bottom Actions */}
        <View style={styles.actionSection}>
          <TouchableOpacity style={styles.agentBtn} onPress={() => navigation.navigate('OperatorRegistration')}>
            <Ionicons name="briefcase-outline" size={20} color={THEME_COLOR} style={styles.btnIcon} />
            <Text style={styles.agentBtnText}>
              {isOperator ? 'Update Operator Profile' : 'Become an Operator'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color="#fff" style={styles.btnIcon} />
            <Text style={styles.logoutBtnText}>Logout</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
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
  userEmail: { fontSize: 13, color: '#666', marginTop: 2 },

  statsRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  statItem: { alignItems: 'center' },
  statValue: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  statLabel: { fontSize: 11, color: '#888' },
  statDivider: { width: 1, height: 15, backgroundColor: '#EEE', marginHorizontal: 15 },

  section: { paddingHorizontal: 20, marginTop: 25 },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: '#888', marginBottom: 10, marginLeft: 5, textTransform: 'uppercase' },
  card: { backgroundColor: '#fff', borderRadius: 16, paddingVertical: 5, elevation: 1 },

  menuItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  menuLeft: { flexDirection: 'row', alignItems: 'center' },
  menuText: { fontSize: 16, color: '#333', marginLeft: 15 },
  divider: { height: 1, backgroundColor: '#FAF9F6', marginHorizontal: 16 },

  actionSection: { paddingHorizontal: 20, marginTop: 30 },
  btnIcon: { marginRight: 10 },
  agentBtn: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: THEME_COLOR, borderRadius: 15,
    paddingVertical: 16, backgroundColor: '#fff',
    marginBottom: 15,
  },
  agentBtnText: { color: THEME_COLOR, fontSize: 16, fontWeight: '600' },

  logoutBtn: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    backgroundColor: '#FF6B6B', borderRadius: 15,
    paddingVertical: 16,
    elevation: 4
  },
  logoutBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});