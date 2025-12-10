import React, { useState } from 'react';
import { 
  View, Text, FlatList, Image, TouchableOpacity, 
  StyleSheet, Dimensions, StatusBar 
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { MACHINES } from '../../constants/data'; // Import the new data
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/useAuthStore';
const { width } = Dimensions.get('window');

// --- CONSTANTS & THEME ---
const THEME_COLOR = '#FF8C00'; // Dark Orange
const BORDER_RADIUS = 8;       // Reduced radius as requested
const CARD_WIDTH = width * 0.75; // Featured card width

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

// Filter Tabs
const TABS = ['All', 'For Rent', 'For Sale'];

export default function HomeScreen() {
  const navigation = useNavigation<NavigationProp>();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated); 
  const [activeTab, setActiveTab] = useState('All');

  // Filter logic
  const filteredData = activeTab === 'All' 
    ? MACHINES 
    : MACHINES.filter(item => activeTab.includes(item.type));

  const featuredData = MACHINES.slice(0, 3); // Just taking first 3 as featured

  // --- RENDER SECTIONS ---

  // 1. Featured Card Component (Horizontal)
  const renderFeaturedItem = ({ item }: { item: typeof MACHINES[0] }) => (
    <TouchableOpacity 
      activeOpacity={0.9}
      style={styles.featuredCard}
      onPress={() => navigation.navigate('ProductDetails', { product: item })}
    >
      {/* Badge */}
      <View style={[
        styles.badge, 
        { backgroundColor: item.type === 'Sale' ? '#10B981' : THEME_COLOR }
      ]}>
        <Text style={styles.badgeText}>{item.type === 'Sale' ? 'For Sale' : 'For Rent'}</Text>
      </View>

      <Image source={{ uri: item.image }} style={styles.featuredImage} />
      
      <View style={styles.featuredContent}>
        <Text style={styles.featuredTitle} numberOfLines={1}>{item.name}</Text>
        <View style={styles.locationRow}>
          <Ionicons name="location-outline" size={14} color="#666" />
          <Text style={styles.locationText}>{item.location}</Text>
        </View>
        <Text style={styles.featuredPrice}>
          ETB {item.price.toLocaleString()} 
          <Text style={styles.perMonth}>{item.type === 'Rent' ? '/mo' : ''}</Text>
        </Text>
      </View>
    </TouchableOpacity>
  );

  // 2. Header Component (Contains TopBar, Featured, and Filter Tabs)
  const renderHeader = () => (
    <View style={styles.headerWrapper}>
      
      {/* Top Bar */}
      <View style={styles.topBar}>
        <View>
          <Text style={styles.greeting}>Hello,</Text>
          <Text style={styles.headline}>Find heavy machinery</Text>
        </View>
        <View style={styles.topIcons}>
        {!isAuthenticated && (
          <TouchableOpacity 
            style={styles.roundBtn}
            onPress={() => navigation.navigate('Login')} 
          >
            <Ionicons name="add" size={24} color="#333" />
          </TouchableOpacity>
        )}
          <TouchableOpacity 
        style={styles.roundBtn}
        onPress={() => navigation.navigate('Search')} // <--- LINK TO SEARCH PAGE
      >
         <Ionicons name="search" size={22} color="#333" />
      </TouchableOpacity>
        </View>
      </View>

      {/* Featured Section */}
      <Text style={styles.sectionTitle}>Featured Listings</Text>
      <FlatList
        data={featuredData}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.featuredList}
        renderItem={renderFeaturedItem}
        keyExtractor={item => 'feat-' + item.id}
        snapToInterval={CARD_WIDTH + 15}
        decelerationRate="fast"
      />

      {/* Recent Listings Title & Filter Tabs */}
      <Text style={styles.sectionTitle}>Recent Listings</Text>
      
      <View style={styles.tabContainer}>
        {TABS.map((tab) => (
          <TouchableOpacity 
            key={tab} 
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  // 3. Main Return
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAFAFA" />
      
      <FlatList
        data={filteredData}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.mainListContent}
        renderItem={({ item }) => (
          // Recent Listing Card (Vertical Layout like "Apartment" in screenshot)
          <TouchableOpacity 
            style={styles.recentCard}
            onPress={() => navigation.navigate('ProductDetails', { product: item })}
          >
            {/* Left Image */}
            <View style={styles.recentImageWrapper}>
              <Image source={{ uri: item.image }} style={styles.recentImage} />
              <View style={[styles.miniBadge, { backgroundColor: item.type === 'Sale' ? '#10B981' : THEME_COLOR }]}>
                <Text style={styles.miniBadgeText}>{item.type}</Text>
              </View>
            </View>

            {/* Right Details */}
            <View style={styles.recentDetails}>
              <Text style={styles.recentTitle} numberOfLines={1}>{item.name}</Text>
              <Text style={styles.recentLocation} numberOfLines={1}>
                 {item.location}
              </Text>
              
              <View style={styles.specsRow}>
                <MaterialCommunityIcons name="engine-outline" size={16} color="#888" />
                <Text style={styles.specsText}>{item.specs}</Text>
              </View>

              <Text style={styles.recentPrice}>
                ETB {item.price.toLocaleString()}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  mainListContent: { paddingBottom: 30 },
  headerWrapper: { paddingBottom: 10 },

  // --- TOP BAR ---
  topBar: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    paddingTop: 10,
    marginBottom: 20 
  },
  greeting: { fontSize: 14, color: '#888' },
  headline: { fontSize: 22, fontWeight: 'bold', color: '#111' },
  topIcons: { flexDirection: 'row', gap: 10 },
  roundBtn: { 
    width: 40, height: 40, borderRadius: 20, 
    backgroundColor: '#fff', 
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: '#eee' 
  },

  // --- TITLES ---
  sectionTitle: { 
    fontSize: 18, fontWeight: 'bold', 
    color: '#333', marginLeft: 20, marginBottom: 15, marginTop: 10 
  },

  // --- FEATURED CARD ---
  featuredList: { paddingHorizontal: 20, paddingBottom: 10 },
  featuredCard: {
    width: CARD_WIDTH,
    backgroundColor: '#fff',
    borderRadius: BORDER_RADIUS, // Sharp corners
    marginRight: 15,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#eee',
    // Minimal shadow
    elevation: 2,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 3,
  },
  featuredImage: { width: '100%', height: 180, resizeMode: 'cover' },
  featuredContent: { padding: 12 },
  featuredTitle: { fontSize: 16, fontWeight: '700', color: '#333', marginBottom: 4 },
  locationRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  locationText: { color: '#666', fontSize: 13, marginLeft: 4 },
  featuredPrice: { fontSize: 16, fontWeight: 'bold', color: THEME_COLOR },
  perMonth: { fontSize: 12, fontWeight: 'normal', color: '#888' },
  
  badge: {
    position: 'absolute', top: 12, left: 12, zIndex: 1,
    paddingVertical: 4, paddingHorizontal: 10, borderRadius: 4
  },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },

  // --- TABS ---
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: BORDER_RADIUS, // Sharp corners wrapper
    marginHorizontal: 20,
    overflow: 'hidden',
    backgroundColor: '#fff',
    height: 45,
  },
  tab: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#E5E5E5',
  },
  activeTab: {
    backgroundColor: '#fef3c7', // Very light orange bg for active
  },
  tabText: { fontSize: 14, color: '#888', fontWeight: '500' },
  activeTabText: { color: THEME_COLOR, fontWeight: 'bold' },

  // --- RECENT LIST ITEM (SIDE BY SIDE) ---
  recentCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 15,
    borderRadius: BORDER_RADIUS, // Sharp corners
    borderWidth: 1, borderColor: '#eee',
    elevation: 1,
    overflow: 'hidden'
  },
  recentImageWrapper: { width: 110, height: 110 },
  recentImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  recentDetails: { flex: 1, padding: 12, justifyContent: 'center' },
  recentTitle: { fontSize: 15, fontWeight: '700', color: '#333', marginBottom: 4 },
  recentLocation: { fontSize: 13, color: '#666', marginBottom: 8 },
  specsRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  specsText: { fontSize: 12, color: '#888', marginLeft: 4 },
  recentPrice: { fontSize: 15, fontWeight: 'bold', color: THEME_COLOR },
  
  miniBadge: {
    position: 'absolute', top: 8, left: 8,
    paddingVertical: 2, paddingHorizontal: 6, borderRadius: 3
  },
  miniBadgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold' }
});