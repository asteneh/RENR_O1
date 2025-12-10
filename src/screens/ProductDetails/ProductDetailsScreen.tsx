import React, { useRef } from 'react';
import { 
  View, Text, Image, TouchableOpacity, StyleSheet, 
  Dimensions, StatusBar, Animated, ScrollView 
} from 'react-native';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useCartStore } from '../../store/useCartStore';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RootStackParamList } from '../../navigation/types';

type DetailsRouteProp = RouteProp<RootStackParamList, 'ProductDetails'>;

const { width } = Dimensions.get('window');
const HEADER_HEIGHT = 350; // Height of the image
const THEME_COLOR = '#FF8C00'; // Orange

export default function ProductDetailsScreen() {
  const route = useRoute<DetailsRouteProp>();
  const navigation = useNavigation();
  const { product } = route.params;
  const addItem = useCartStore((state) => state.addItem);

  // Animation Value
  const scrollY = useRef(new Animated.Value(0)).current;

  // Mock Gallery
  const galleryImages = [product.image, product.image, product.image];

  // 1. Image Animation Logic (Parallax + Zoom on pull down)
  const imageTranslateY = scrollY.interpolate({
    inputRange: [-HEADER_HEIGHT, 0, HEADER_HEIGHT],
    outputRange: [-HEADER_HEIGHT / 2, 0, HEADER_HEIGHT * 0.75], // Moves slower than content
    extrapolate: 'clamp',
  });

  const imageScale = scrollY.interpolate({
    inputRange: [-HEADER_HEIGHT, 0],
    outputRange: [2, 1], // Zoom in when pulling down
    extrapolateRight: 'clamp',
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* --- 1. BACKGROUND ANIMATED IMAGE --- */}
      <Animated.View style={[styles.headerImageContainer, { 
          height: HEADER_HEIGHT,
          transform: [{ translateY: imageTranslateY }, { scale: imageScale }] 
      }]}>
        <Image source={{ uri: product.image }} style={styles.image} />
        <View style={styles.imageOverlay} />
      </Animated.View>

      {/* --- 2. FIXED TOP BAR (Back Button) --- */}
      <SafeAreaView style={styles.topBar} edges={['top']}>
        <TouchableOpacity style={styles.roundBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <View style={{ flexDirection: 'row', gap: 10 }}>
           <TouchableOpacity style={styles.roundBtn}>
             <Ionicons name="share-social-outline" size={22} color="#333" />
           </TouchableOpacity>
           <TouchableOpacity style={styles.roundBtn}>
             <Ionicons name="heart-outline" size={22} color="#333" />
           </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* --- 3. SCROLLABLE CONTENT --- */}
      <Animated.ScrollView
        contentContainerStyle={{ paddingTop: HEADER_HEIGHT - 30 }} // Start slightly overlapping image
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
      >
        <View style={styles.contentContainer}>
          
          {/* Handle Bar Visual */}
          <View style={styles.handleBarWrapper}>
             <View style={styles.handleBar} />
          </View>

          {/* Header Info */}
          <View style={styles.headerInfo}>
            <Text style={styles.title}>{product.name}</Text>
            <Text style={styles.price}>ETB {product.price.toLocaleString()}</Text>
            
            <View style={styles.badgeRow}>
               <View style={[styles.badge, { backgroundColor: product.type === 'Sale' ? '#10B981' : THEME_COLOR }]}>
                  <Text style={styles.badgeText}>{product.type === 'Sale' ? 'For Sale' : 'For Rent'}</Text>
               </View>
               <View style={styles.locationRow}>
                  <Ionicons name="location-outline" size={16} color="#666" />
                  <Text style={styles.locationText}>{product.location || 'Addis Ababa'}</Text>
               </View>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Machine Specs */}
          <Text style={styles.sectionTitle}>Specifications</Text>
          <View style={styles.specsContainer}>
             <SpecItem icon="calendar" label="Year" value="2022" />
             <SpecItem icon="speedometer" label="Hours" value="1,200" />
             <SpecItem icon="weight" label="Weight" value="24 Ton" />
             <SpecItem icon="engine" label="Fuel" value="Diesel" />
          </View>

          {/* Description */}
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>
            {product.description || "Heavy-duty machinery ready for construction projects. Maintained by certified dealers with full service history available upon request."}
          </Text>

          {/* Gallery */}
          <Text style={styles.sectionTitle}>Gallery</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.galleryScroll}>
            {galleryImages.map((img, index) => (
              <Image key={index} source={{ uri: img }} style={styles.galleryImg} />
            ))}
          </ScrollView>

          {/* Seller Info */}
          <Text style={styles.sectionTitle}>Dealer Info</Text>
          <View style={styles.dealerCard}>
            <View style={styles.dealerAvatar}>
               <Text style={styles.avatarText}>DG</Text>
            </View>
            <View>
               <Text style={styles.dealerName}>Dawit Global Machinery</Text>
               <Text style={styles.dealerSub}>Authorized Dealer</Text>
            </View>
            <Ionicons name="call" size={24} color={THEME_COLOR} style={{ marginLeft: 'auto' }} />
          </View>

          {/* Bottom Padding for scroll */}
          <View style={{ height: 100 }} />
        </View>
      </Animated.ScrollView>

      {/* --- 4. BOTTOM ACTION BUTTON (Sticky) --- */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => addItem(product)}>
          <Text style={styles.actionBtnText}>Contact Dealer / Add to List</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// Helper Component for Specs
const SpecItem = ({ icon, label, value }: any) => (
  <View style={styles.specBox}>
    <MaterialCommunityIcons name={icon} size={22} color={THEME_COLOR} />
    <Text style={styles.specValue}>{value}</Text>
    <Text style={styles.specLabel}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },

  // IMAGE STYLES
  headerImageContainer: {
    position: 'absolute', top: 0, left: 0, right: 0,
    width: '100%',
    overflow: 'hidden',
    zIndex: -1, // Puts image behind content
  },
  image: { width: '100%', height: '100%', resizeMode: 'cover' },
  imageOverlay: { 
    ...StyleSheet.absoluteFillObject, 
    backgroundColor: 'rgba(0,0,0,0.2)' 
  },

  // TOP BAR
  topBar: {
    position: 'absolute', top: 0, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'space-between',
    paddingHorizontal: 20, zIndex: 10, paddingTop: 10
  },
  roundBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#fff', 
    justifyContent: 'center', alignItems: 'center',
    elevation: 4, shadowColor: '#000', shadowOpacity: 0.1, shadowOffset: {width:0, height:2}
  },

  // MAIN CONTENT CONTAINER
  contentContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 20,
    paddingBottom: 20,
    minHeight: 800, // Ensures scroll
    shadowColor: "#000", shadowOffset: { width: 0, height: -3 }, shadowOpacity: 0.1, shadowRadius: 5, elevation: 5
  },
  
  handleBarWrapper: { alignItems: 'center', marginTop: 10, marginBottom: 10 },
  handleBar: { width: 50, height: 5, backgroundColor: '#E0E0E0', borderRadius: 5 },

  // INFO SECTION
  headerInfo: { marginTop: 5 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#222', marginBottom: 5 },
  price: { fontSize: 22, fontWeight: 'bold', color: THEME_COLOR, marginBottom: 10 },
  
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  badge: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 6 },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  locationRow: { flexDirection: 'row', alignItems: 'center' },
  locationText: { color: '#666', marginLeft: 4, fontSize: 14 },

  divider: { height: 1, backgroundColor: '#F0F0F0', marginVertical: 20 },

  // SPECS
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 15, marginTop: 5 },
  specsContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  specBox: { 
    width: width / 4.8, backgroundColor: '#FAFAFA', 
    padding: 10, borderRadius: 12, 
    alignItems: 'center', borderWidth: 1, borderColor: '#EEE' 
  },
  specValue: { fontSize: 14, fontWeight: 'bold', marginTop: 5, color: '#333' },
  specLabel: { fontSize: 11, color: '#888' },

  description: { fontSize: 15, lineHeight: 24, color: '#555', marginBottom: 20 },

  // GALLERY
  galleryScroll: { flexDirection: 'row', marginBottom: 25 },
  galleryImg: { width: 140, height: 100, borderRadius: 10, marginRight: 10, backgroundColor: '#eee' },

  // DEALER
  dealerCard: { 
    flexDirection: 'row', alignItems: 'center', 
    padding: 15, backgroundColor: '#FAFAFA', borderRadius: 12, 
    borderWidth: 1, borderColor: '#EEE' 
  },
  dealerAvatar: { 
    width: 45, height: 45, borderRadius: 25, backgroundColor: '#333', 
    justifyContent: 'center', alignItems: 'center', marginRight: 15 
  },
  avatarText: { color: '#fff', fontWeight: 'bold' },
  dealerName: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  dealerSub: { fontSize: 13, color: '#777' },

  // BOTTOM BUTTON
  bottomContainer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#fff', padding: 20,
    borderTopWidth: 1, borderTopColor: '#eee',
  },
  actionBtn: {
    backgroundColor: '#222', paddingVertical: 16, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center'
  },
  actionBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});