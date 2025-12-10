import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../../store/useAuthStore'; // <--- Import Store

const THEME_COLOR = '#FF8C00'; // Dark Green

export default function ProfileScreen() {
  const navigation = useNavigation<any>();
  const logout = useAuthStore((state) => state.logout); // <--- Get Logout Function

  const MenuOption = ({ icon, label, onPress }: any) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <View style={styles.menuLeft}>
        <Ionicons name={icon} size={22} color={THEME_COLOR} />
        <Text style={styles.menuText}>{label}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#ccc" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Profile</Text>
        </View>

        {/* Avatar Section */}
        <View style={styles.profileInfo}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatarPlaceholder} />
          </View>
          <Text style={styles.userName}>atseneh abate</Text>
          <Text style={styles.userEmail}>atseneha@gmail.com</Text>
        </View>

        {/* My Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My Account</Text>
          <View style={styles.card}>
            <MenuOption icon="pencil-outline" label="Edit Profile" />
            <View style={styles.divider} />
            <MenuOption icon="heart-outline" label="My Favorites" />
            <View style={styles.divider} />
            <MenuOption 
              icon="add-circle-outline" 
              label="Post Property" 
              onPress={() => navigation.navigate('PostProperty')} 
            />
            <View style={styles.divider} />
            <MenuOption icon="location-outline" label="My Listings" />
          </View>
        </View>

        {/* Settings Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          <View style={styles.card}>
            <MenuOption icon="settings-outline" label="App Settings" />
            <View style={styles.divider} />
            <MenuOption icon="help-circle-outline" label="Help & Support" />
          </View>
        </View>

        {/* --- BOTTOM ACTIONS --- */}
        <View style={styles.actionSection}>
          
          {/* Become an Agent / Operator Button */}
          <TouchableOpacity style={styles.agentBtn}>
            <Ionicons name="briefcase-outline" size={20} color={THEME_COLOR} style={styles.btnIcon} />
            <Text style={styles.agentBtnText}>Become an Agent</Text>
          </TouchableOpacity>

          {/* Logout Button */}
          <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
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
  
  header: { padding: 20 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  
  profileInfo: { alignItems: 'center', marginBottom: 30 },
  avatarContainer: { 
    width: 100, height: 100, borderRadius: 50, 
    backgroundColor: '#fff', padding: 5, elevation: 5, marginBottom: 15 
  },
  avatarPlaceholder: { flex: 1, borderRadius: 50, backgroundColor: THEME_COLOR },
  userName: { fontSize: 20, fontWeight: 'bold', color: '#111' },
  userEmail: { fontSize: 14, color: '#666', marginTop: 2 },

  section: { paddingHorizontal: 20, marginBottom: 25 },
  sectionTitle: { fontSize: 16, color: '#666', marginBottom: 10, marginLeft: 5 },
  card: { backgroundColor: '#fff', borderRadius: 16, paddingVertical: 5, elevation: 2 },
  
  menuItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  menuLeft: { flexDirection: 'row', alignItems: 'center' },
  menuText: { fontSize: 16, color: '#333', marginLeft: 15 },
  divider: { height: 1, backgroundColor: '#f0f0f0', marginHorizontal: 16 },

  // --- NEW BUTTON STYLES ---
  actionSection: { paddingHorizontal: 20, marginTop: 10 },
  
  btnIcon: { marginRight: 10 },

  // Green Outline Button
  agentBtn: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: THEME_COLOR, borderRadius: 15,
    paddingVertical: 16, backgroundColor: '#fff',
    marginBottom: 15,
  },
  agentBtnText: { color: THEME_COLOR, fontSize: 16, fontWeight: '600' },

  // Red Logout Button
  logoutBtn: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    backgroundColor: '#FF6B6B', // Salmon/Red color from screenshot
    borderRadius: 15,
    paddingVertical: 16,
    shadowColor: '#FF6B6B', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5, elevation: 4
  },
  logoutBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});