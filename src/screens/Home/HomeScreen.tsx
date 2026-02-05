import React, { useRef, useState, useEffect } from 'react';
import {
  View, Text, Image, TouchableOpacity, ScrollView,
  FlatList, StyleSheet, Dimensions, StatusBar, TextInput, useWindowDimensions
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, TabParamList } from '../../navigation/types';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/useAuthStore';
import { useHelloQuery } from '../../api/services/helloService';
import { useProductsQuery, Product } from '../../api/services/productService';
import { CONFIG } from '../../config';
import SkeletonLoader from '../../components/SkeletonLoader';
import { MOCK_REQUESTS } from '../../data/mockRequests';
import RequestCard from '../../components/RequestCard';
import ProductCard from '../../components/ProductCard';
import SupplierHomeScreen from '../Supplier/SupplierHomeScreen';
import { ViewMode } from '../../store/useAuthStore';

// Removed global width to use useWindowDimensions hook
// const { width } = Dimensions.get('window');

// --- CONSTANTS & THEME ---
const THEME_COLOR = '#FF8C00';
const BORDER_RADIUS = 16;
// const CARD_WIDTH = width;
const SPACING = 20;
// const SNAP_INTERVAL = CARD_WIDTH;

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type HomeScreenRouteProp = RouteProp<TabParamList, 'Home'>;

const PREDEFINED_CATEGORIES = ['All', 'Excavators', 'Bulldozers', 'Trucks', 'Cranes'];

export default function HomeScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<HomeScreenRouteProp>();
  const { user, currentRole, viewMode, setViewMode } = useAuthStore();

  const [activeCategory, setActiveCategory] = useState('All');
  const [helloLoading, setHelloLoading] = useState(true);
  const { width } = useWindowDimensions();
  const CARD_WIDTH = width - 40;

  // Data
  const { data: helloData } = useHelloQuery();
  const { data: productsData, isLoading: productsLoading } = useProductsQuery();
  const products = productsData?.products || [];

  const featuredData = products.slice(0, 5);

  // Filter logic
  const filteredData = activeCategory === 'All'
    ? products
    : products.filter(p => p.category?.name === activeCategory); // Basic client-side filter simulation

  // --- CAROUSEL LOGIC ---
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    // Determine greeting based on time
    const timer = setTimeout(() => setHelloLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  // Auto-scroll logic
  useEffect(() => {
    if (featuredData.length === 0) return;
    const interval = setInterval(() => {
      let nextIndex = activeIndex + 1;
      if (nextIndex >= featuredData.length) {
        nextIndex = 0;
      }
      setActiveIndex(nextIndex);
      flatListRef.current?.scrollToIndex({
        index: nextIndex,
        animated: true,
      });
    }, 3000);
    return () => clearInterval(interval);
  }, [activeIndex, featuredData.length]);

  const onMomentumScrollEnd = (event: any) => {
    const slideSize = event.nativeEvent.layoutMeasurement.width;
    const index = event.nativeEvent.contentOffset.x / slideSize;
    const roundIndex = Math.round(index);
    setActiveIndex(roundIndex);
  };

  // --- RENDER SECTIONS ---

  const renderStickyHeader = () => (
    <View style={styles.stickyHeader}>
      <View style={styles.headerTop}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={styles.logoText}>Gadal <Text style={{ color: '#000' }}>Market</Text></Text>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity
            style={styles.headerIconButton}
            onPress={() => navigation.navigate('SupplierHome')}
          >
            <Ionicons name="briefcase-outline" size={24} color={THEME_COLOR} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerIconButton}
            onPress={() => navigation.navigate('Search' as any)}
          >
            <Ionicons name="search-outline" size={24} color="#333" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerIconButton}
          >
            <Ionicons name="notifications-outline" size={24} color="#333" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderWelcomeHeader = () => (
    <View style={styles.headerContainer}>
      <Text style={styles.greetingText}>Welcome 👋</Text>
      <Text style={styles.subGreeting}>Find the best machinery for your project</Text>
    </View>
  );

  const renderCategories = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.categoryList}
    >
      {PREDEFINED_CATEGORIES.map((cat, index) => (
        <TouchableOpacity
          key={index}
          style={[styles.categoryChip, activeCategory === cat && styles.activeChip]}
          onPress={() => setActiveCategory(cat)}
        >
          <Text style={[styles.categoryText, activeCategory === cat && styles.activeChipText]}>
            {cat}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderFeaturedItem = ({ item }: { item: Product }) => (
    <View style={{ width: width, alignItems: 'center' }}>
      <ProductCard
        product={item}
        style={{ width: CARD_WIDTH, marginHorizontal: 20 }}
      />
    </View>
  );

  const renderRecentItem = ({ item }: { item: Product }) => (
    <View style={{ paddingHorizontal: 20 }}>
      <ProductCard product={item} />
    </View>
  );

  const renderTenantDashboard = () => (
    <View style={styles.container}>
      {renderStickyHeader()}
      <View style={{ paddingHorizontal: 20, marginBottom: 15, marginTop: 10 }}>
        <Text style={styles.sectionTitle}>My Requests</Text>
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

  // --- MAIN RENDER ---
  if (currentRole === 'Tenant') return renderTenantDashboard();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        {renderStickyHeader()}

        <FlatList
          data={filteredData}
          keyExtractor={item => item._id}
          ListHeaderComponent={
            <>
              {renderWelcomeHeader()}

              {/* Featured Carousel */}
              <View style={{ marginBottom: 20 }}>
                <FlatList
                  ref={flatListRef}
                  data={featuredData}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  keyExtractor={(item) => item._id}
                  renderItem={renderFeaturedItem}
                  contentContainerStyle={{ paddingHorizontal: 0 }}
                  snapToInterval={width}
                  decelerationRate="fast"
                  pagingEnabled={true}
                  onMomentumScrollEnd={onMomentumScrollEnd}
                  getItemLayout={(data, index) => (
                    { length: width, offset: width * index, index }
                  )}
                />
              </View>

              {renderCategories()}

              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Recent Listings</Text>
              </View>
            </>
          }
          renderItem={renderRecentItem}
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            productsLoading ? (
              <View style={{ marginTop: 50, alignItems: 'center' }}>
                <SkeletonLoader width={width - 40} height={100} />
              </View>
            ) : (
              <View style={styles.centeredLoading}>
                <Text>No items found.</Text>
              </View>
            )
          }
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },

  // Header
  stickyHeader: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingHorizontal: 20,
    paddingVertical: 10,
    zIndex: 1000,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: THEME_COLOR,
  },
  headerIconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  headerContainer: { paddingHorizontal: 20, paddingTop: 15, marginBottom: 15 },
  greetingText: { fontSize: 24, fontWeight: 'bold', color: '#111' },
  subGreeting: { fontSize: 14, color: '#666', marginTop: 4 },
  notifButton: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: '#f0f0f0', elevation: 2
  },
  profileButtonActive: {
    backgroundColor: THEME_COLOR,
    borderColor: THEME_COLOR,
    overflow: 'hidden',
  },
  avatarContainer: {
    width: '100%', height: '100%',
    justifyContent: 'center', alignItems: 'center'
  },
  avatarText: {
    color: '#fff', fontSize: 18, fontWeight: 'bold'
  },
  notifDot: {
    position: 'absolute', top: 10, right: 12, width: 8, height: 8,
    borderRadius: 4, backgroundColor: 'red', borderWidth: 1, borderColor: '#fff'
  },


  // Categories
  categoryList: { paddingHorizontal: 20, paddingBottom: 20 },
  categoryChip: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#fff',
    marginRight: 10, borderWidth: 1, borderColor: '#eee'
  },
  activeChip: { backgroundColor: THEME_COLOR, borderColor: THEME_COLOR },
  categoryText: { color: '#666', fontWeight: '500' },
  activeChipText: { color: '#fff', fontWeight: 'bold' },

  // Sections
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 15 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#111' },
  seeAll: { color: THEME_COLOR, fontWeight: '600' },

  // Featured
  featuredCard: {
    height: 260, backgroundColor: '#fff',
    borderRadius: 18,
    marginRight: 0,
    elevation: 4, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 6,
    overflow: 'hidden'
  },
  featuredImage: { width: '100%', height: '100%' },
  featuredOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.1)' },
  featuredTag: { position: 'absolute', top: 15, left: 15, backgroundColor: 'rgba(0,0,0,0.6)', padding: 6, borderRadius: 6 },
  featuredTagText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  featuredContent: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#fff', padding: 15, borderTopLeftRadius: 18, borderTopRightRadius: 18
  },
  featuredTitle: { fontSize: 16, fontWeight: 'bold', color: '#111', marginBottom: 4 },
  featuredPrice: { fontSize: 18, fontWeight: 'bold', color: THEME_COLOR, marginBottom: 4 },
  locationRow: { flexDirection: 'row', alignItems: 'center' },
  locationText: { color: '#888', fontSize: 12, marginLeft: 4 },

  // Recent List
  listCard: {
    flexDirection: 'row', marginHorizontal: 20, marginBottom: 15,
    backgroundColor: '#fff', borderRadius: 15, padding: 10,
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.05
  },
  listImage: { width: 90, height: 90, borderRadius: 10, backgroundColor: '#eee' },
  listContent: { flex: 1, marginLeft: 12, justifyContent: 'center' },
  listTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 4 },
  listPrice: { fontSize: 16, fontWeight: 'bold', color: THEME_COLOR, marginBottom: 8 },
  listMetaRow: { flexDirection: 'row' },
  iconTag: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F5F5', paddingVertical: 4, paddingHorizontal: 8, borderRadius: 6 },
  iconTagText: { fontSize: 11, color: '#666', marginLeft: 4 },
  favButton: { position: 'absolute', right: 10, top: 10 },

  centeredLoading: { flex: 1, justifyContent: 'center', alignItems: 'center' }

});