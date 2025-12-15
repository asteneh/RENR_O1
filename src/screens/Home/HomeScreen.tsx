import React, { useRef, useState, useEffect } from 'react';
import {
  View, Text, Image, TouchableOpacity, ScrollView,
  FlatList, StyleSheet, Dimensions, StatusBar, ActivityIndicator
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, TabParamList } from '../../navigation/types';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/useAuthStore';
import { useHelloQuery } from '../../api/services/helloService';
import { useProductsQuery, Product } from '../../api/services/productService';
import { CONFIG } from '../../config';
import SkeletonLoader from '../../components/SkeletonLoader';
import RoleHeader from '../../components/RoleHeader';
import { RouteProp, useRoute } from '@react-navigation/native';

import { MOCK_REQUESTS } from '../../data/mockRequests';
import RequestCard from '../../components/RequestCard';

const { width } = Dimensions.get('window');

// --- CONSTANTS & THEME ---
const THEME_COLOR = '#FF8C00'; // Dark Orange
const BORDER_RADIUS = 12;       // Moderately rounded
const CARD_WIDTH = width - 40; // Full width minus container padding
const SPACING = 15;
const SIDE_INSET = 20; // Standard padding
const SNAP_INTERVAL = CARD_WIDTH + SPACING;

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

// Filter Tabs
const TABS = ['All', 'For Rent', 'For Sale'];

type HomeScreenRouteProp = RouteProp<TabParamList, 'Home'>;

export default function HomeScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<HomeScreenRouteProp>(); // Access route
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const currentRole = useAuthStore((state) => state.currentRole);
  const [activeTab, setActiveTab] = useState('All');
  const [helloLoading, setHelloLoading] = useState(true); // State for greeting loading

  // Data
  const { data: helloData } = useHelloQuery();
  const helloText = helloData; // Assuming useHelloQuery returns the text directly or in a specific structure, adjust if needed.
  const { data: productsData, isLoading: productsLoading } = useProductsQuery();
  const products = productsData?.products || [];

  // Filter Data
  const featuredData = products.slice(0, 5); // Limit featured to 5 items

  // Filter logic (Adapt for API data if needed, or just filter client-side for now)
  const filteredData = activeTab === 'All'
    ? products
    : products; // TODO: Implement actual filtering based on API attributes if needed

  // --- CAROUSEL LOGIC ---
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const [isAutoPlay, setIsAutoPlay] = useState(true);

  useEffect(() => {
    if (featuredData.length === 0 || !isAutoPlay) return;

    const interval = setInterval(() => {
      let nextIndex = activeIndex + 1;
      if (nextIndex >= featuredData.length) {
        nextIndex = 0;
      }

      flatListRef.current?.scrollToIndex({
        index: nextIndex,
        animated: true,
        viewPosition: 0,
      });
      setActiveIndex(nextIndex);
    }, 3000); // 3 seconds auto-scroll

    return () => clearInterval(interval);
  }, [activeIndex, featuredData.length, isAutoPlay]);

  // Handle manual scroll interaction
  const handleScrollBeginDrag = () => {
    setIsAutoPlay(false); // Pause auto-scroll when user starts dragging
  };

  const handleScrollEnd = (event: any) => {
    // Calculate new index based on scroll position
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffsetX / SNAP_INTERVAL);
    setActiveIndex(index);
    setIsAutoPlay(true); // Resume auto-scroll
  };

  // Simulate loading delay for greeting
  useEffect(() => {
    const timer = setTimeout(() => setHelloLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  // React to route params from Drawer
  React.useEffect(() => {
    if (route.params?.filter) {
      setActiveTab(route.params.filter);
    }
  }, [route.params?.filter]);


  // --- RENDER SECTIONS ---

  // 1. Featured Card Component (Horizontal)
  const renderFeaturedItem = ({ item }: { item: Product }) => (
    <TouchableOpacity
      activeOpacity={0.9}
      style={styles.featuredCard}
      onPress={() => navigation.navigate('ProductDetails', { product: item })}
    >
      {/* Badge */}
      <View style={[
        styles.badge,
        { backgroundColor: THEME_COLOR }
      ]}>
        <Text style={styles.badgeText}>For Sale</Text>
      </View>

      <Image
        source={{ uri: item.productImages && item.productImages.length > 0 ? `${CONFIG.FILE_URL}/${item.productImages[0]}` : 'https://via.placeholder.com/200' }}
        style={styles.featuredImage}
      />

      <View style={styles.featuredContent}>
        <Text style={styles.featuredTitle} numberOfLines={1}>{item.title}</Text>
        <View style={styles.locationRow}>
          <Ionicons name="location-outline" size={14} color="#666" />
          <Text style={styles.locationText}>{item.location?.descripton || 'No Location'}</Text>
        </View>
        <Text style={styles.featuredPrice}>
          ETB {(item.currentPrice && typeof item.currentPrice === 'number') ? item.currentPrice.toLocaleString() : 'N/A'}
        </Text>
      </View>
    </TouchableOpacity>
  );

  // 2. Header Component (Contains Headline, Featured, and Filter Tabs)
  const renderListHeader = () => (
    <View style={styles.headerWrapper}>
      {/* Search / Headline - Moved distinct from top bar */}
      <View style={{ paddingHorizontal: 20, marginBottom: 20, marginTop: 10 }}>
        <Text style={styles.headline}>Find heavy machinery</Text>
      </View>

      {/* Featured Listings Carousel */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Featured Listings</Text>
        <TouchableOpacity><Text style={styles.seeAll}>See All</Text></TouchableOpacity>
      </View>

      <View>
        <FlatList
          ref={flatListRef}
          data={featuredData}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: SIDE_INSET - SPACING / 2, // Center the first item
            paddingBottom: 10
          }}
          renderItem={renderFeaturedItem}
          keyExtractor={item => 'feat-' + item._id}
          snapToAlignment="center"
          snapToInterval={SNAP_INTERVAL}
          decelerationRate="fast"
          onScrollBeginDrag={handleScrollBeginDrag}
          onMomentumScrollEnd={handleScrollEnd}
          getItemLayout={(data, index) => (
            { length: SNAP_INTERVAL, offset: SNAP_INTERVAL * index, index }
          )}
        />

        {/* Pagination Dots */}
        <View style={styles.paginationContainer}>
          {featuredData.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                activeIndex === index ? styles.activeDot : styles.inactiveDot
              ]}
            />
          ))}
        </View>
      </View>

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

  // --- TENANT DASHBOARD LOGIC ---
  const renderTenantDashboard = () => (
    <View style={styles.container}>
      <View style={styles.headerWrapper}>
        <View style={{ paddingHorizontal: 20, marginBottom: 20, marginTop: 10 }}>
          <Text style={styles.headline}>My Requests</Text>
          <Text style={{ color: '#666', marginTop: 5 }}>Manage your machine requirements</Text>
        </View>
      </View>

      <FlatList
        data={MOCK_REQUESTS}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 30 }}
        renderItem={({ item }) => <RequestCard request={item} />}
        ListEmptyComponent={
          <View style={styles.centeredLoading}>
            <Text style={{ color: '#888' }}>No requests found.</Text>
          </View>
        }
      />
    </View>
  );

  // 3. Main Return
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FCFCFC" />
      <RoleHeader />

      {currentRole === 'Tenant' ? (
        renderTenantDashboard()
      ) : (
        /* EXISTING BUYER/SELLER VIEW */
        productsLoading ? (
          // --- SKELETON LOADING STATE ---
          <View style={styles.skeletonContainer}>
            <View style={{ paddingHorizontal: 20, marginBottom: 20, marginTop: 20 }}>
              <SkeletonLoader width={200} height={30} />
            </View>
            {/* Featured Skeleton (Horizontal) */}
            <View style={{ paddingHorizontal: 20, marginBottom: 30 }}>
              <SkeletonLoader width={150} height={24} style={{ marginBottom: 15 }} />
              <View style={{ flexDirection: 'row' }}>
                <View style={{ marginRight: 15 }}>
                  <SkeletonLoader width={CARD_WIDTH} height={250} borderRadius={12} />
                </View>
              </View>
            </View>
          </View>
        ) : filteredData.length > 0 ? (
          <FlatList
            data={filteredData}
            keyExtractor={(item) => item._id}
            ListHeaderComponent={renderListHeader()}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.mainListContent}
            renderItem={({ item }) => (
              // Recent Listing Card
              <TouchableOpacity
                style={styles.recentCard}
                onPress={() => navigation.navigate('ProductDetails', { product: item })}
              >
                <View style={styles.recentImageWrapper}>
                  <Image
                    source={{ uri: item.productImages && item.productImages.length > 0 ? `${CONFIG.FILE_URL}/${item.productImages[0]}` : 'https://via.placeholder.com/200' }}
                    style={styles.recentImage}
                  />
                  <View style={[styles.miniBadge, { backgroundColor: THEME_COLOR }]}>
                    <Text style={styles.miniBadgeText}>Sale</Text>
                  </View>
                </View>

                <View style={styles.recentDetails}>
                  <Text style={styles.recentTitle} numberOfLines={1}>{item.title}</Text>
                  <Text style={styles.recentLocation} numberOfLines={1}>
                    {item.location?.descripton || 'No Location'}
                  </Text>

                  <View style={styles.specsRow}>
                    <MaterialCommunityIcons name="engine-outline" size={16} color="#888" />
                    <Text style={styles.specsText}>{item.attributes?.[0]?.value || 'N/A'}</Text>
                  </View>

                  <Text style={styles.recentPrice}>
                    ETB {(item.currentPrice && typeof item.currentPrice === 'number') ? item.currentPrice.toLocaleString() : 'N/A'}
                  </Text>
                </View>
              </TouchableOpacity>
            )}
          />
        ) : (
          <View style={styles.centeredLoading}>
            <Text style={{ color: '#888' }}>No listings found.</Text>
          </View>
        )
      )}
    </View>
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
  seeAll: {
    fontSize: 14, color: THEME_COLOR, fontWeight: '600', marginRight: 20
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5, // Adjusted margin
  },

  // --- FEATURED CARD ---
  featuredList: { paddingHorizontal: 20, paddingBottom: 10 }, // Kept for type safety, though overridden inline
  featuredCard: {
    width: CARD_WIDTH,
    backgroundColor: '#fff',
    borderRadius: BORDER_RADIUS,
    marginHorizontal: SPACING / 2, // Half spacing on each side
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#eee',
    elevation: 3, // Slightly higher elevation
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.1, shadowRadius: 5,
  },
  featuredImage: { width: '100%', height: 180, resizeMode: 'cover' },
  featuredContent: { padding: 12 },
  featuredTitle: { fontSize: 16, fontWeight: '700', color: '#333', marginBottom: 4 },
  locationRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  locationText: { color: '#666', fontSize: 13, marginLeft: 4 },
  featuredPrice: { fontSize: 16, fontWeight: 'bold', color: THEME_COLOR },

  badge: {
    position: 'absolute', top: 12, left: 12, zIndex: 1,
    paddingVertical: 4, paddingHorizontal: 10, borderRadius: 4
  },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },

  // --- TABS ---
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 0, // Reset inner padding since wrapper has margin
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
  miniBadgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },

  // Loading
  skeletonContainer: {
    flex: 1,
    paddingTop: 10,
  },
  centeredLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Pagination
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 15,
  },
  dot: {
    height: 6, // Slightly thinner
    borderRadius: 3,
    marginHorizontal: 3,
  },
  activeDot: {
    width: 25, // Longer pill
    backgroundColor: THEME_COLOR,
  },
  inactiveDot: {
    width: 6, // Circle
    backgroundColor: '#E0E0E0', // Lighter grey
  }
});