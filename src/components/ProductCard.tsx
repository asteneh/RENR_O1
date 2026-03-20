import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { CONFIG } from '../config';
import { Product, useAddFavMutation, useRemoveFavMutation } from '../api/services/productService';
import { useAuthStore } from '../store/useAuthStore';
import { Rating } from 'react-native-ratings';

interface ProductCardProps {
    product: Product;
    style?: ViewStyle;
    isManagementMode?: boolean;
    onEdit?: (productId: string) => void;
    onDelete?: (productId: string) => void;
    onToggleAvailability?: (productId: string, currentStatus: number) => void;
}

const THEME_COLOR = '#FF8C00';

const ProductCard: React.FC<ProductCardProps> = ({
    product,
    style,
    isManagementMode,
    onEdit,
    onDelete,
    onToggleAvailability
}) => {
    const navigation = useNavigation<any>();
    const { user } = useAuthStore();
    const addFavMutation = useAddFavMutation();
    const removeFavMutation = useRemoveFavMutation();

    const isLiked = user ? product.likedBy?.includes(user.id || user._id) : false;
    const isMyProduct = user?._id === product.consignee?._id;

    const handleFavorite = () => {
        if (!user) {
            navigation.navigate('Login');
            return;
        }

        if (isLiked) {
            removeFavMutation.mutate({ productId: product._id, userId: user.id || user._id });
        } else {
            addFavMutation.mutate({ productId: product._id, userId: user.id || user._id });
        }
    };

    const discount = product.previousPrice > product.currentPrice
        ? Math.round(((product.previousPrice - product.currentPrice) / product.previousPrice) * 100)
        : 0;

    return (
        <TouchableOpacity
            activeOpacity={0.9}
            style={[styles.card, style]}
            onPress={() => !isManagementMode && navigation.navigate('ProductDetails', { product })}
        >
            <View style={styles.imageContainer}>
                <Image
                    source={{ uri: product.productImages && product.productImages.length > 0 ? `${CONFIG.FILE_URL}/${product.productImages[0]}` : 'https://via.placeholder.com/200' }}
                    style={styles.image}
                />

                {/* badges */}
                <View style={styles.topBadges}>
                    {discount > 0 && (
                        <View style={styles.discountBadge}>
                            <Text style={styles.badgeText}>{discount}% OFF</Text>
                        </View>
                    )}
                    {product.postType?.name !== 'Basic' && (
                        <View style={[styles.postTypeBadge, { backgroundColor: product.postType?.name === 'Gold' ? '#FFD700' : '#C0C0C0' }]}>
                            <Text style={styles.badgeText}>{product.postType?.name}</Text>
                        </View>
                    )}
                </View>

                {!isMyProduct && !isManagementMode && (
                    <TouchableOpacity style={styles.favButton} onPress={handleFavorite}>
                        <Ionicons
                            name={isLiked ? "heart" : "heart-outline"}
                            size={20}
                            color={isLiked ? THEME_COLOR : "#333"}
                        />
                    </TouchableOpacity>
                )}

                <View style={styles.transactionTag}>
                    <Text style={styles.transactionText}>{product.transactionType === 1 ? 'RENT' : 'SALE'}</Text>
                </View>
            </View>

            <View style={styles.content}>
                <Text style={styles.title} numberOfLines={1}>{product.title}</Text>

                <View style={styles.metaRow}>
                    <View style={styles.profileBox}>
                        <Image
                            source={{ uri: product.consignee?.proflePic ? `${CONFIG.FILE_URL}/${product.consignee.proflePic}` : 'https://via.placeholder.com/24' }}
                            style={styles.avatar}
                        />
                        <Rating
                            readonly
                            startingValue={product.averageRating || 0}
                            imageSize={12}
                            style={{ marginLeft: 4 }}
                        />
                        <Text style={styles.reviewCount}>({product.totalReviews || 0})</Text>
                    </View>
                    <View style={styles.fixedBadge}>
                        <Text style={styles.fixedText}>{product.isFixed ? 'Fixed' : 'Negotiable'}</Text>
                    </View>
                </View>

                <View style={styles.priceRow}>
                    <Text style={styles.price}>
                        {product.currency?.sign} {product.currentPrice.toLocaleString()}
                    </Text>
                    {product.previousPrice > product.currentPrice && (
                        <Text style={styles.previousPrice}>
                            {product.currency?.sign} {product.previousPrice.toLocaleString()}
                        </Text>
                    )}
                </View>

                {isManagementMode && (
                    <View style={styles.managementRow}>
                        <TouchableOpacity
                            style={styles.mgmtBtn}
                            onPress={() => onEdit?.(product._id)}
                        >
                            <Text style={styles.mgmtBtnText}>Edit</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.mgmtBtn}
                            onPress={() => onToggleAvailability?.(product._id, product.derivedState)}
                        >
                            <Text style={styles.mgmtBtnText}>
                                {product.derivedState === 1 ? 'Not Available' : 'Available'}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.deleteBtn}
                            onPress={() => onDelete?.(product._id)}
                        >
                            <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </TouchableOpacity>
    );
};


const styles = StyleSheet.create({
    card: {
        backgroundColor: '#fff',
        borderRadius: 15,
        overflow: 'hidden',
        elevation: 3,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 5,
        shadowOffset: { width: 0, height: 2 },
        marginBottom: 15,
    },
    imageContainer: {
        height: 160,
        width: '100%',
        backgroundColor: '#F8F9FA',
    },
    image: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    topBadges: {
        position: 'absolute',
        top: 10,
        left: 10,
        flexDirection: 'row',
        gap: 5,
    },
    discountBadge: {
        backgroundColor: '#05B815',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    postTypeBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    badgeText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
    },
    favButton: {
        position: 'absolute',
        top: 10,
        right: 10,
        backgroundColor: '#fff',
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 2,
    },
    transactionTag: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        backgroundColor: 'rgba(255,140,0,0.9)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderTopRightRadius: 10,
    },
    transactionText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
    },
    content: {
        padding: 12,
    },
    title: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 6,
        textTransform: 'capitalize',
    },
    metaRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    profileBox: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: '#EEE',
    },
    reviewCount: {
        fontSize: 10,
        color: '#888',
        marginLeft: 2,
    },
    fixedBadge: {
        backgroundColor: '#F4F3F1',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    fixedText: {
        fontSize: 10,
        color: '#05B815',
        fontWeight: 'bold',
    },
    priceRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 8,
    },
    price: {
        fontSize: 18,
        fontWeight: 'bold',
        color: THEME_COLOR,
    },
    previousPrice: {
        fontSize: 14,
        color: '#AFAFAF',
        textDecorationLine: 'line-through',
    },
    managementRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 15,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
        gap: 10,
    },
    mgmtBtn: {
        flex: 1,
        backgroundColor: '#F0F0F0',
        paddingVertical: 8,
        borderRadius: 8,
        alignItems: 'center',
    },
    mgmtBtnText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#535252',
    },
    deleteBtn: {
        width: 36,
        height: 36,
        borderRadius: 8,
        backgroundColor: '#FFF0F0',
        justifyContent: 'center',
        alignItems: 'center',
    },
});


export default ProductCard;
