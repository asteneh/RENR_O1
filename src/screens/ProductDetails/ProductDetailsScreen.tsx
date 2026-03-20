import React, { useRef, useState } from 'react';
import {
  View, Text, Image, TouchableOpacity, StyleSheet,
  Dimensions, StatusBar, Animated as RNAnimated, ScrollView, Share, Alert, Modal, Pressable

} from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';


import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useCartStore } from '../../store/useCartStore';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootStackParamList } from '../../navigation/types';
import { CONFIG } from '../../config';
import { Product, useAddFavMutation, useRemoveFavMutation, useSingleProductQuery } from '../../api/services/productService';
import { useReviewsQuery, useCreateReviewMutation } from '../../api/services/reviewService';
import { useAuthStore } from '../../store/useAuthStore';
import { Rating } from 'react-native-ratings';
import { format } from 'date-fns';
import { TextInput as RNTextInput } from 'react-native';
import { useNotificationStore } from '../../store/useNotificationStore';
import { cleanErrorMessage } from '../../utils/errorUtils';

type DetailsRouteProp = RouteProp<RootStackParamList, 'ProductDetails'>;

const { width } = Dimensions.get('window');
const HEADER_HEIGHT = 350;
const THEME_COLOR = '#FF8C00'; // Orange

export default function ProductDetailsScreen() {
  const { showNotification, showAlert } = useNotificationStore();
  const route = useRoute<DetailsRouteProp>();
  const navigation = useNavigation<any>();
  const product = route.params.product as Product;
  const { user } = useAuthStore();
  const insets = useSafeAreaInsets();

  const [showPhone, setShowPhone] = useState(false);
  const [activeTab, setActiveTab] = useState<'Description' | 'Reviews'>('Description');

  const { data: updatedProduct } = useSingleProductQuery(product._id);
  const displayProduct = updatedProduct || product;

  const { data: reviews, isLoading: reviewsLoading, refetch: refetchReviews } = useReviewsQuery(displayProduct._id);
  const addFavMutation = useAddFavMutation();
  const removeFavMutation = useRemoveFavMutation();
  const createReviewMutation = useCreateReviewMutation(displayProduct._id);

  const isLiked = user ? (displayProduct.likedBy || []).includes(user.id || user._id) : false;

  const [reviewText, setReviewText] = useState('');
  const [reviewRating, setReviewRating] = useState(0);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const [activeImage, setActiveImage] = useState(
    (product.productImages && product.productImages.length > 0)
      ? `${CONFIG.FILE_URL}/${product.productImages[0]}`
      : 'https://via.placeholder.com/400'
  );

  const [isZoomModalVisible, setIsZoomModalVisible] = useState(false);
  const [zoomImage, setZoomImage] = useState('');

  // Reanimated values for pinch-to-zoom
  const scale = useSharedValue(1);
  const focalX = useSharedValue(0);
  const focalY = useSharedValue(0);

  const pinchGesture = Gesture.Pinch()
    .onUpdate((event) => {
      scale.value = event.scale;
      focalX.value = event.focalX;
      focalY.value = event.focalY;
    })
    .onEnd(() => {
      scale.value = withSpring(1);
    });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: focalX.value },
        { translateY: focalY.value },
        { translateX: -width / 2 },
        { translateY: -HEADER_HEIGHT / 2 },
        { scale: scale.value },
        { translateX: -focalX.value },
        { translateY: -focalY.value },
        { translateX: width / 2 },
        { translateY: HEADER_HEIGHT / 2 },
      ],
    };
  });


  // Animation Value
  const scrollY = useRef(new RNAnimated.Value(0)).current;


  // Gallery Images (Full URLs) - use displayProduct for reactivity
  const galleryImages = React.useMemo(() => {
    return (displayProduct.productImages && displayProduct.productImages.length > 0)
      ? displayProduct.productImages.map(img => `${CONFIG.FILE_URL}/${img}`)
      : [];
  }, [displayProduct.productImages]);

  // Update active image when displayProduct changes (e.g. after fetch)
  React.useEffect(() => {
    if (galleryImages.length > 0 && (!activeImage || activeImage === 'https://via.placeholder.com/400')) {
      setActiveImage(galleryImages[0]);
    }
  }, [galleryImages, activeImage]);

  // 1. Image Animation Logic (Parallax + Zoom on pull down)
  const imageTranslateY = scrollY.interpolate({
    inputRange: [-HEADER_HEIGHT, 0, HEADER_HEIGHT],
    outputRange: [-HEADER_HEIGHT / 2, 0, HEADER_HEIGHT * 0.5], // Moves slower for depth effect
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
      <RNAnimated.View style={[styles.headerImageContainer, {
        height: HEADER_HEIGHT,
        transform: [{ translateY: imageTranslateY }, { scale: imageScale }]
      }]}>
        <TouchableOpacity
          activeOpacity={0.9}
          style={{ flex: 1 }}
          onPress={() => {
            setZoomImage(activeImage);
            setIsZoomModalVisible(true);
          }}
        >
          <Image
            source={{ uri: activeImage }}
            style={styles.image}
          />
        </TouchableOpacity>
        <View style={styles.imageOverlay} />
      </RNAnimated.View>


      {/* --- 2. FIXED TOP BAR (Back Button) --- */}
      <View style={[styles.topBar, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity style={styles.roundBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <TouchableOpacity style={styles.roundBtn} onPress={async () => {
            try {
              await Share.share({
                message: `Check out this product: ${displayProduct.title} - ${galleryImages[0]}`,
                url: galleryImages[0],
                title: displayProduct.title
              });
            } catch (error: any) {
              Alert.alert('Error', error.message);
            }
          }}>
            <Ionicons name="share-social-outline" size={22} color="#333" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.roundBtn} onPress={async () => {
            if (!user) return navigation.navigate('Login');
            try {
              const params = { productId: displayProduct._id, userId: user.id || user._id };
              if (isLiked) {
                await removeFavMutation.mutateAsync(params);
              } else {
                await addFavMutation.mutateAsync(params);
              }
            } catch (e) {
              Alert.alert("Error", "Could not update favorites");
            }
          }}>
            <Ionicons name={isLiked ? "heart" : "heart-outline"} size={22} color={isLiked ? THEME_COLOR : "#333"} />
          </TouchableOpacity>
        </View>
      </View>

      {/* --- 3. SCROLLABLE CONTENT --- */}
      <RNAnimated.ScrollView
        contentContainerStyle={{ paddingTop: HEADER_HEIGHT - 50, paddingBottom: 100 }}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        onScroll={RNAnimated.event(
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
          <View style={[styles.headerInfo, { marginTop: 10 }]}>
            <View style={styles.breadcrumbRow}>
              <Text style={styles.breadcrumbText}>
                {displayProduct.category?.name} / {displayProduct.transactionType === 1 ? 'Rent' : 'Sale'}
              </Text>
            </View>
            <Text style={styles.title}>{displayProduct.title}</Text>

            <View style={styles.locationContainer}>
              <Ionicons name="location" size={16} color={THEME_COLOR} />
              <Text style={styles.locationValue}>
                {displayProduct.location?.descripton} {displayProduct.subCity ? `, ${displayProduct.subCity.descripton}` : ''} {displayProduct.wereda ? `, ${displayProduct.wereda.descripton}` : ''}
              </Text>
            </View>

            <View style={styles.priceRow}>
              <Text style={styles.price}>
                {displayProduct.currency?.sign} {displayProduct.currentPrice.toLocaleString()}
              </Text>
              <View style={styles.fixedBadge}>
                <Text style={styles.fixedText}>{displayProduct.isFixed ? 'Fixed' : 'Negotiable'}</Text>
              </View>
            </View>

            <View style={styles.ratingRow}>
              <Rating
                readonly
                startingValue={displayProduct.averageRating || 0}
                imageSize={16}
              />
              <Text style={styles.ratingText}> | {displayProduct.totalReviews || 0} Reviews</Text>

              <TouchableOpacity
                style={styles.writeReviewBtn}
                onPress={() => setActiveTab('Reviews')}
              >
                <Text style={styles.writeReviewBtnText}>Write a Review</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Machine Specs (Dynamic) */}
          {displayProduct.attributes && displayProduct.attributes.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Specifications</Text>
              <View style={styles.specsContainer}>
                {displayProduct.attributes.map((attr, index) => (
                  <View key={index} style={styles.specListItem}>
                    <Text style={styles.specName}>{attr.name}</Text>
                    <Text style={styles.specValue}>{attr.value}</Text>
                  </View>
                ))}
              </View>
            </>
          )}

          {/* Tabs */}
          <View style={styles.tabHeader}>
            <TouchableOpacity onPress={() => setActiveTab('Description')}>
              <Text style={[styles.tabText, activeTab === 'Description' && styles.activeTabText]}>Description</Text>
              {activeTab === 'Description' && <View style={styles.tabIndicator} />}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setActiveTab('Reviews')}>
              <Text style={[styles.tabText, activeTab === 'Reviews' && styles.activeTabText]}>Reviews ({reviews?.length || 0})</Text>
              {activeTab === 'Reviews' && <View style={styles.tabIndicator} />}
            </TouchableOpacity>
          </View>

          {activeTab === 'Description' ? (
            <Text style={styles.description}>
              {displayProduct.description || "No description provided."}
            </Text>
          ) : (
            <View style={styles.reviewsList}>
              {reviews?.map((review: any) => (
                <View key={review._id} style={styles.reviewItem}>
                  <View style={styles.reviewHeader}>
                    <Image
                      source={{ uri: review.user?.proflePic ? `${CONFIG.FILE_URL}/${review.user.proflePic}` : 'https://via.placeholder.com/24' }}
                      style={styles.reviewAvatar}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.reviewUser}>{review.user?.firstName} {review.user?.lastName}</Text>
                      <Rating readonly startingValue={review.stars} imageSize={12} style={{ alignSelf: 'flex-start' }} />
                    </View>
                    <Text style={styles.reviewDate}>{review.updatedAt ? format(new Date(review.updatedAt), 'MMM dd, yyyy') : ''}</Text>
                  </View>
                  <Text style={styles.reviewText}>{review.description}</Text>
                </View>
              ))}

              {user && (
                <View style={styles.addReviewContainer}>
                  <Text style={styles.addReviewTitle}>Add Your Review</Text>
                  <Rating
                    startingValue={reviewRating}
                    imageSize={30}
                    onFinishRating={(rating: number) => setReviewRating(rating)}
                    style={{ paddingVertical: 10, alignSelf: 'flex-start' }}
                  />
                  <RNTextInput
                    style={styles.reviewInput}
                    placeholder="Write your feedback here..."
                    placeholderTextColor="#888"
                    multiline
                    numberOfLines={4}
                    value={reviewText}
                    onChangeText={setReviewText}
                  />
                  <TouchableOpacity
                    style={[styles.submitReviewBtn, (!reviewText || reviewRating === 0 || createReviewMutation.isPending) && styles.disabledBtn]}
                    disabled={!reviewText || reviewRating === 0 || createReviewMutation.isPending}
                    onPress={() => {
                      createReviewMutation.mutate({
                        product: displayProduct._id,
                        user: user.id || user._id,
                        description: reviewText,
                        stars: reviewRating
                      }, {
                        onSuccess: () => {
                          setReviewText('');
                          setReviewRating(0);
                          refetchReviews();
                          showNotification("Your review has been posted!", "success");
                        }
                      });
                    }}
                  >
                    <Text style={styles.submitReviewText}>
                      {createReviewMutation.isPending ? 'Posting...' : 'Post Review'}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
              {(!reviews || reviews.length === 0) && !user && <Text style={styles.emptyText}>No reviews yet.</Text>}
            </View>
          )}

          {/* Gallery - Clickable */}
          {galleryImages.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Gallery</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.galleryScroll}>
                {galleryImages.map((img, index) => (
                  <TouchableOpacity
                    key={index}
                    onPress={() => {
                      setActiveImage(img);
                      setZoomImage(img);
                      setIsZoomModalVisible(true);
                    }}
                  >

                    <Image
                      source={{ uri: img }}
                      style={[
                        styles.galleryImg,
                        activeImage === img && { borderWidth: 2, borderColor: THEME_COLOR }
                      ]}
                    />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </>
          )}

          {/* Seller Info */}
          <Text style={styles.sectionTitle}>Seller Info</Text>
          <View style={styles.dealerCard}>
            <Image
              source={{ uri: displayProduct.consignee?.proflePic ? `${CONFIG.FILE_URL}/${displayProduct.consignee.proflePic}` : 'https://via.placeholder.com/45' }}
              style={styles.dealerAvatar}
            />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.dealerName}>{displayProduct.consignee?.firstName} {displayProduct.consignee?.lastName}</Text>
              <Text style={styles.dealerSub}>{displayProduct.consignee?.followers?.length || 0} Followers</Text>
            </View>

            <TouchableOpacity style={styles.followBtn}>
              <Text style={styles.followBtnText}>Follow</Text>
            </TouchableOpacity>

          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtonRow}>
            <TouchableOpacity style={styles.actionIconButton} onPress={() => {
              if (!user) return navigation.navigate('Login');
              if (isLiked) {
                removeFavMutation.mutate({ productId: displayProduct._id, userId: user.id || user._id });
              } else {
                addFavMutation.mutate({ productId: displayProduct._id, userId: user.id || user._id });
              }
            }}>
              <Ionicons name={isLiked ? "heart" : "heart-outline"} size={22} color={isLiked ? THEME_COLOR : "#333"} />
              <Text style={[styles.actionIconText, isLiked && { color: THEME_COLOR }]}>Favorite</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionIconButton} onPress={() => {
              showAlert(
                "Offer Price",
                `Enter your offer price (Current: ${displayProduct.currency?.sign} ${displayProduct.currentPrice.toLocaleString()})`,
                [
                  { text: "Cancel", style: "cancel" },
                  { text: "Send", onPress: (price?: string) => showNotification(`Your offer of ${price} has been sent.`, "success"), style: "default" }
                ],
                true,
                "Ex: 50,000"
              );
            }}>
              <Ionicons name="pricetag-outline" size={22} color="#333" />
              <Text style={styles.actionIconText}>Offer Price</Text>
            </TouchableOpacity>
          </View>
        </View>
      </RNAnimated.ScrollView>



      {/* --- 4. IMAGE ZOOM MODAL --- */}
      <Modal
        visible={isZoomModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsZoomModalVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.95)' }}>
          <SafeAreaView style={{ flex: 1 }}>
            <View style={styles.zoomModalHeader}>
              <TouchableOpacity
                style={styles.zoomCloseBtn}
                onPress={() => setIsZoomModalVisible(false)}
              >
                <Ionicons name="close" size={30} color="#fff" />
              </TouchableOpacity>
            </View>

            <View style={styles.zoomImageContainer}>
              <GestureDetector gesture={pinchGesture}>
                <Animated.View style={[{ width: '100%', height: '80%' }, animatedStyle]}>
                  <Image
                    source={{ uri: zoomImage }}
                    style={{ width: '100%', height: '100%', resizeMode: 'contain' }}
                  />
                </Animated.View>
              </GestureDetector>
            </View>

            <View style={styles.zoomFooter}>
              <Text style={styles.zoomFooterText}>Pinch to zoom</Text>
            </View>
          </SafeAreaView>
        </View>

      </Modal>
    </View>

  );
}

// Helper Component for Specs
const SpecItem = ({ icon, label, value }: any) => (
  <View style={styles.specBox}>
    <MaterialCommunityIcons name={icon} size={22} color={THEME_COLOR} />
    <Text style={styles.specValue} numberOfLines={1}>{value}</Text>
    <Text style={styles.specLabel} numberOfLines={1}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' }, // Dark background for the image to sit on

  // IMAGE STYLES
  headerImageContainer: {
    position: 'absolute', top: 0, left: 0, right: 0,
    width: '100%',
    overflow: 'hidden',
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
    paddingHorizontal: 20, zIndex: 100
  },
  roundBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#fff',
    justifyContent: 'center', alignItems: 'center',
    elevation: 4, shadowColor: '#000', shadowOpacity: 0.1, shadowOffset: { width: 0, height: 2 }
  },

  // MAIN CONTENT CONTAINER
  contentContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 20,
    paddingBottom: 20,
    minHeight: 800,
    shadowColor: "#000", shadowOffset: { width: 0, height: -3 }, shadowOpacity: 0.1, shadowRadius: 5, elevation: 5
  },

  handleBarWrapper: { alignItems: 'center', marginTop: 12, marginBottom: 8 },
  handleBar: { width: 40, height: 4, backgroundColor: '#E0E0E0', borderRadius: 2 },

  // INFO SECTION
  headerInfo: { marginTop: 5 },
  breadcrumbRow: { marginBottom: 5 },
  breadcrumbText: { fontSize: 12, color: '#888' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#222', marginBottom: 10 },
  locationContainer: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 15 },
  locationValue: { color: '#666', fontSize: 14, fontWeight: 'bold' },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  price: { fontSize: 22, fontWeight: 'bold', color: THEME_COLOR },
  fixedBadge: { backgroundColor: '#F4F3F1', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  fixedText: { color: '#05B815', fontWeight: 'bold', fontSize: 12 },
  ratingRow: { flexDirection: 'row', alignItems: 'center' },
  ratingText: { color: '#888', marginLeft: 5 },

  divider: { height: 1, backgroundColor: '#F0F0F0', marginVertical: 20 },

  // SPECS
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 15, marginTop: 5 },
  specsContainer: { marginBottom: 20 },
  specListItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  specName: { fontSize: 14, color: '#666' },
  specValue: { fontSize: 14, fontWeight: 'bold', color: '#333' },

  description: { fontSize: 15, lineHeight: 24, color: '#555', marginBottom: 20, marginTop: 15 },

  // TABS
  tabHeader: { flexDirection: 'row', gap: 30, marginBottom: 10, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  tabText: { fontSize: 18, fontWeight: 'bold', color: '#ABABAB', paddingBottom: 10 },
  activeTabText: { color: '#333' },
  tabIndicator: { height: 3, backgroundColor: THEME_COLOR, width: '100%', position: 'absolute', bottom: -1 },

  // REVIEWS
  reviewsList: { marginTop: 15 },
  reviewItem: { marginBottom: 20, borderBottomWidth: 1, borderBottomColor: '#F0F0F0', paddingBottom: 15 },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  reviewAvatar: { width: 30, height: 30, borderRadius: 15 },
  reviewUser: { fontWeight: 'bold', flex: 1 },
  reviewDate: { fontSize: 12, color: '#888' },
  reviewText: { fontSize: 14, color: '#535252', lineHeight: 20 },
  emptyText: { color: '#888', textAlign: 'center', marginTop: 20 },

  // GALLERY
  galleryScroll: { flexDirection: 'row', marginBottom: 25 },
  galleryImg: { width: 80, height: 60, borderRadius: 8, marginRight: 10, backgroundColor: '#eee' },

  // DEALER
  dealerCard: {
    flexDirection: 'row', alignItems: 'center',
    padding: 15, backgroundColor: '#FAFAFA', borderRadius: 12,
    borderWidth: 1, borderColor: '#EEE', marginBottom: 20
  },
  dealerAvatar: {
    width: 45, height: 45, borderRadius: 25, backgroundColor: '#EEE',
    marginRight: 15
  },
  dealerName: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  dealerSub: { fontSize: 13, color: '#777' },
  followBtn: { marginLeft: 'auto', backgroundColor: '#FEE2A1', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20 },
  followBtnText: { color: '#000', fontWeight: 'bold', fontSize: 12 },

  actionButtonRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  actionIconButton: { alignItems: 'center', gap: 5, flex: 1 },
  actionIconText: { fontSize: 12, color: '#333' },

  // REVIEW FORM
  writeReviewBtn: { marginLeft: 'auto', backgroundColor: '#F0F0F0', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 15 },
  writeReviewBtnText: { fontSize: 12, color: THEME_COLOR, fontWeight: 'bold' },
  addReviewContainer: { marginTop: 30, padding: 15, backgroundColor: '#FAFAFA', borderRadius: 12, borderWidth: 1, borderColor: '#EEE' },
  addReviewTitle: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  reviewInput: { backgroundColor: '#fff', borderRadius: 8, padding: 12, height: 100, textAlignVertical: 'top', borderWidth: 1, borderColor: '#DDD', marginTop: 10 },
  submitReviewBtn: { backgroundColor: THEME_COLOR, paddingVertical: 12, borderRadius: 8, alignItems: 'center', marginTop: 15 },
  submitReviewText: { color: '#fff', fontWeight: 'bold' },
  disabledBtn: { backgroundColor: '#CCC' },

  // BOTTOM BUTTON
  bottomContainer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#fff',
    paddingHorizontal: 20, paddingVertical: 15,
    borderTopWidth: 1, borderTopColor: '#eee',
    elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.1, shadowRadius: 4
  },
  actionBtn: {
    backgroundColor: '#222', paddingVertical: 16, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center', flexDirection: 'row'
  },
  actionBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },

  specBox: {
    width: (width - 60) / 4,
    backgroundColor: '#FAFAFA',
    padding: 10, borderRadius: 12,
    alignItems: 'center', borderWidth: 1, borderColor: '#EEE'
  },
  specLabel: { fontSize: 10, color: '#888' },

  // ZOOM MODAL STYLES
  zoomModalHeader: {
    paddingHorizontal: 20,
    paddingTop: 10,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    zIndex: 1000,
  },
  zoomCloseBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  zoomImageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  zoomFooter: {
    padding: 20,
    alignItems: 'center',
  },
  zoomFooterText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
  },
});

