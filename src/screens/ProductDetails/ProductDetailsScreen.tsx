import React, { useRef, useState } from 'react';
import {
  View, Text, Image, TouchableOpacity, StyleSheet,
  Dimensions, StatusBar, Animated as RNAnimated, ScrollView, Share, Alert, Modal, Pressable, Linking, ActivityIndicator

} from 'react-native';
import ZoomableImageModal from '../../components/common/ZoomableImageModal';
import { fetchConversations, startNewConversation } from '../../api/services/messageService';


import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useCartStore } from '../../store/useCartStore';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootStackParamList } from '../../navigation/types';
import { CONFIG } from '../../config';
import { Product, useAddFavMutation, useRemoveFavMutation, useSingleProductQuery } from '../../api/services/productService';
import { useReviewsQuery, useCreateReviewMutation } from '../../api/services/reviewService';
import { useAuthStore } from '../../store/useAuthStore';
import { useFollow, useUnfollow } from '../../api/services/userService';
import { Rating } from 'react-native-ratings';
import { format } from 'date-fns';
import { TextInput as RNTextInput } from 'react-native';
import { useNotificationStore } from '../../store/useNotificationStore';
import { cleanErrorMessage } from '../../utils/errorUtils';
import { useRoleAccess } from '../../components/common/RoleAccessGuard';
import { FeatureActions } from '../../constants/UserRoles';
import { formatEtb } from '../../utils/currency';
import { formatPostDate } from '../../utils/dateUtils';

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

  // Chat State
  const [firstMsgModalVisible, setFirstMsgModalVisible] = useState(false);
  const [firstMessageText, setFirstMessageText] = useState("Hi, is this machinery still available?");
  const [isSendingFirstMsg, setIsSendingFirstMsg] = useState(false);

  const handleChatPress = async () => {
    if (!user) {
      navigation.navigate('Login');
      return;
    }

    const buyerId = user.id || user._id;
    const sellerId = displayProduct.consignee?._id;

    if (buyerId === sellerId) {
      showNotification("You cannot chat with yourself.", "error");
      return;
    }

    try {
      const conversationsList = await fetchConversations(buyerId);
      const existing = conversationsList?.find((c: any) => 
        (c.product?._id === displayProduct._id || c.product === displayProduct._id) &&
        (c.productOwner?._id === sellerId || c.productOwner === sellerId || c.interestedParty?._id === sellerId || c.interestedParty === sellerId)
      );

      if (existing) {
        navigation.navigate('Chat', { conversation: existing });
      } else {
        setFirstMsgModalVisible(true);
      }
    } catch (error) {
      showNotification("Error starting chat", "error");
    }
  };

  const sendFirstMessage = async () => {
    if (!firstMessageText.trim()) return;
    setIsSendingFirstMsg(true);
    try {
      const buyerId = user?.id || user?._id;
      const sellerId = displayProduct.consignee?._id;
      await startNewConversation({
        product: displayProduct._id,
        owner: sellerId,
        buyer: buyerId,
        firstMessage: firstMessageText,
      });

      // Query conversations list again to find the newly created conversation
      const newList = await fetchConversations(buyerId);
      const newConvo = newList?.find((c: any) => 
        (c.product?._id === displayProduct._id || c.product === displayProduct._id)
      );

      setFirstMsgModalVisible(false);
      if (newConvo) {
        navigation.navigate('Chat', { conversation: newConvo });
      } else {
        navigation.navigate('Messages');
      }
    } catch (e) {
      showNotification("Failed to send message", "error");
    } finally {
      setIsSendingFirstMsg(false);
    }
  };

  // Role-based access check for viewing seller contact info
  const sellerInfoAccess = useRoleAccess(FeatureActions.VIEW_SELLER_INFO);

  const { data: updatedProduct } = useSingleProductQuery(product._id);
  const displayProduct = updatedProduct || product;

  const { data: reviews, isLoading: reviewsLoading, refetch: refetchReviews } = useReviewsQuery(displayProduct._id);
  const addFavMutation = useAddFavMutation();
  const removeFavMutation = useRemoveFavMutation();
  const createReviewMutation = useCreateReviewMutation(displayProduct._id);
  const followMutation = useFollow();
  const unfollowMutation = useUnfollow();

  const isLiked = user ? (displayProduct.likedBy || []).includes(user.id || user._id) : false;
  const isFollowing = user ? (displayProduct.consignee?.followers || []).some((f: any) => (f?._id || f) === (user.id || user._id)) : false;

  const handleFollowToggle = () => {
    if (!user) {
      navigation.navigate('Login');
      return;
    }
    const currentUserId = user.id || user._id;
    const targetUserId = displayProduct.consignee?._id;
    if (!targetUserId) return;

    if (currentUserId === targetUserId) {
      Alert.alert("Error", "You cannot follow yourself.");
      return;
    }

    if (isFollowing) {
      unfollowMutation.mutate(
        { user: currentUserId, userToUnfollow: targetUserId },
        {
          onSuccess: () => showNotification("Unfollowed successfully", "success"),
          onError: (err: any) => showNotification(cleanErrorMessage(err) || "Failed to unfollow", "error"),
        }
      );
    } else {
      followMutation.mutate(
        { user: currentUserId, userToFollow: targetUserId },
        {
          onSuccess: () => showNotification("Followed successfully", "success"),
          onError: (err: any) => showNotification(cleanErrorMessage(err) || "Failed to follow", "error"),
        }
      );
    }
  };

  const handleOpenSellerProfile = () => {
    const sellerId = displayProduct.consignee?._id;
    if (!sellerId) return;
    navigation.navigate('UserProfile', {
      userId: sellerId,
      user: displayProduct.consignee,
    });
  };

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

            {Boolean(displayProduct.createdAt) && (
              <View style={styles.dateContainer}>
                <Ionicons name="calendar-outline" size={14} color="#777" />
                <Text style={styles.dateText}>
                  {formatPostDate(displayProduct.createdAt)}
                </Text>
              </View>
            )}

            <View style={styles.priceRow}>
              <Text style={styles.price}>
                {formatEtb(displayProduct.currentPrice)}
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
          <View style={styles.dealerCardContainer}>
            <View style={styles.dealerCard}>
              <TouchableOpacity
                style={styles.dealerProfileTouchable}
                activeOpacity={0.7}
                onPress={handleOpenSellerProfile}
              >
                <Image
                  source={{ uri: displayProduct.consignee?.proflePic ? `${CONFIG.FILE_URL}/${displayProduct.consignee.proflePic}` : 'https://via.placeholder.com/45' }}
                  style={styles.dealerAvatar}
                />
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={styles.dealerName}>{displayProduct.consignee?.firstName} {displayProduct.consignee?.lastName}</Text>
                    <Ionicons name="chevron-forward" size={16} color="#888" style={{ marginLeft: 4 }} />
                  </View>
                  <Text style={styles.dealerSub}>{displayProduct.consignee?.followers?.length || 0} Followers</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.followBtn, isFollowing && styles.followingBtn]} 
                onPress={handleFollowToggle}
                disabled={followMutation.isPending || unfollowMutation.isPending}
              >
                {followMutation.isPending || unfollowMutation.isPending ? (
                  <ActivityIndicator size="small" color="#000" />
                ) : (
                  <Text style={styles.followBtnText}>{isFollowing ? 'Following' : 'Follow'}</Text>
                )}
              </TouchableOpacity>

            </View>

            <View style={styles.contactActionsRow}>
              {sellerInfoAccess.allowed ? (
                <>
              <TouchableOpacity 
                style={styles.contactActionBtn}
                onPress={() => setShowPhone(!showPhone)}
              >
                <Ionicons name="call-outline" size={20} color={THEME_COLOR} />
                <Text style={styles.contactActionText}>
                  {showPhone ? (displayProduct.consignee?.phoneNumber || (displayProduct.consignee as any)?.phone || 'N/A') : 'Show Phone'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.contactActionBtn}
                onPress={handleChatPress}
              >
                <Ionicons name="chatbubbles-outline" size={20} color={THEME_COLOR} />
                <Text style={styles.contactActionText}>Chat</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.contactActionBtn}
                onPress={() => {
                  const telegram = (displayProduct.consignee as any)?.telegramUsername || displayProduct.consignee?.phoneNumber || (displayProduct.consignee as any)?.phone;
                  if (telegram) {
                    Linking.openURL(`https://t.me/${telegram.replace('+', '')}`);
                  } else {
                    Alert.alert('Telegram not available');
                  }
                }}
              >
                <Ionicons name="paper-plane-outline" size={20} color={THEME_COLOR} />
                <Text style={styles.contactActionText}>Telegram</Text>
              </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity
                  style={styles.contactLockedBtn}
                  onPress={() => {
                    if (sellerInfoAccess.needsLogin) {
                      navigation.navigate('Login');
                    } else if (sellerInfoAccess.needsPayment) {
                      showNotification('Upgrade your membership to view seller contact info.', 'info');
                      navigation.navigate('MyPackages');
                    } else {
                      showNotification(sellerInfoAccess.blockedMessage || 'Your role cannot view seller info.', 'error');
                    }
                  }}
                >
                  <Ionicons name="lock-closed" size={20} color="#999" />
                  <Text style={styles.contactLockedText}>
                    {sellerInfoAccess.needsPayment ? 'Upgrade to View Contact' : sellerInfoAccess.needsLogin ? 'Login to View Contact' : 'Contact Restricted'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
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
                `Enter your offer price (Current: ${formatEtb(displayProduct.currentPrice)})`,
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



      <ZoomableImageModal
        visible={isZoomModalVisible}
        imageUri={zoomImage}
        onClose={() => setIsZoomModalVisible(false)}
      />

      {/* First Message Modal */}
      <Modal
        visible={firstMsgModalVisible}
        animationType="fade"
        transparent={true}
        statusBarTranslucent
        onRequestClose={() => setFirstMsgModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Send a Message to Seller</Text>
            <RNTextInput
              style={styles.modalInput}
              multiline
              numberOfLines={4}
              placeholder="Type your first message..."
              placeholderTextColor="#888"
              value={firstMessageText}
              onChangeText={setFirstMessageText}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setFirstMsgModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSendBtn, !firstMessageText.trim() && { opacity: 0.5 }]}
                disabled={!firstMessageText.trim() || isSendingFirstMsg}
                onPress={sendFirstMessage}
              >
                {isSendingFirstMsg ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.modalSendText}>Send</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
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
  container: { flex: 1, backgroundColor: '#F8F8F8' },

  // IMAGE STYLES
  headerImageContainer: {
    position: 'absolute', top: 0, left: 0, right: 0,
    width: '100%',
    overflow: 'hidden',
    backgroundColor: '#000',
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
  locationContainer: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 10 },
  locationValue: { color: '#666', fontSize: 14, fontWeight: 'bold' },
  dateContainer: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 15 },
  dateText: { color: '#777', fontSize: 13, fontWeight: '500' },
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
  dealerCardContainer: {
    backgroundColor: '#FAFAFA', borderRadius: 12, borderWidth: 1, borderColor: '#EEE', marginBottom: 20
  },
  dealerCard: {
    flexDirection: 'row', alignItems: 'center',
    padding: 15, borderBottomWidth: 1, borderBottomColor: '#EEE'
  },
  dealerProfileTouchable: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
  },
  dealerAvatar: {
    width: 45, height: 45, borderRadius: 25, backgroundColor: '#EEE',
    marginRight: 12
  },
  dealerName: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  dealerSub: { fontSize: 13, color: '#777' },
  followBtn: { marginLeft: 'auto', backgroundColor: '#FEE2A1', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20 },
  followingBtn: { backgroundColor: '#E0E0E0' },
  followBtnText: { color: '#000', fontWeight: 'bold', fontSize: 12 },

  contactActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 12,
  },
  contactActionBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  contactActionText: {
    marginTop: 5,
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
  },
  contactLockedBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    paddingVertical: 12,
    marginHorizontal: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
  },
  contactLockedText: {
    fontSize: 13,
    color: '#999',
    fontWeight: '600',
  },

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

  zoomFooterText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    height: 100,
    textAlignVertical: 'top',
    fontSize: 15,
    color: '#333',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 15,
  },
  modalCancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  modalCancelText: {
    color: '#666',
    fontSize: 15,
    fontWeight: '600',
  },
  modalSendBtn: {
    backgroundColor: THEME_COLOR,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalSendText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
});
