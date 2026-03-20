import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Image, Alert, ActivityIndicator, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCartStore } from '../../store/useCartStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useCreateOrderMutation } from '../../api/services/cartService';
import { Ionicons } from '@expo/vector-icons';
import { CONFIG } from '../../config/index';
import { useNotificationStore } from '../../store/useNotificationStore';
import { cleanErrorMessage } from '../../utils/errorUtils';

export default function CartScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const items = useCartStore((state) => state.items);
  const removeItem = useCartStore((state) => state.removeItem);
  const totalPrice = useCartStore((state) => state.totalPrice);
  const clearCart = useCartStore((state) => state.clearCart);
  const { user, token } = useAuthStore();

  const { showNotification, showAlert } = useNotificationStore();

  const createOrderMutation = useCreateOrderMutation();

  const handleCheckout = async () => {
    if (!token) {
      showAlert('Login Required', 'Please login to proceed with checkout.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Login', onPress: () => navigation.navigate('Login'), style: 'default' }
      ]);
      return;
    }

    if (items.length === 0) return;

    try {
      const orderPayload = {
        totalAmount: totalPrice(),
        products: items.map(item => item._id),
        engagmentFee: totalPrice(), // Assuming engagement fee is total for now, matching reference logic
        user: user?._id || '',
      };

      await createOrderMutation.mutateAsync(orderPayload);

      showNotification('Order placed successfully!', 'success');
      clearCart();
      navigation.navigate('Tabs', { screen: 'Home' });
    } catch (error: any) {
      const msg = cleanErrorMessage(error);
      showNotification(msg, 'error');
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.itemCard}>
      <Image
        source={{ uri: item.productImages?.[0] ? `${CONFIG.FILE_URL}/${item.productImages[0]}` : 'https://via.placeholder.com/100' }}
        style={styles.itemImage}
      />
      <View style={styles.itemInfo}>
        <Text style={styles.itemTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.itemPrice}>ETB {item.currentPrice?.toLocaleString()}</Text>
        <View style={styles.quantityContainer}>
          <Text style={styles.quantityText}>Qty: {item.quantity}</Text>
        </View>
      </View>
      <TouchableOpacity onPress={() => removeItem(item._id)} style={styles.removeBtn}>
        <Ionicons name="trash-outline" size={20} color="#FF3B30" />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Custom Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Cart</Text>
        <View style={{ width: 40 }} /> {/* Spacer */}
      </View>

      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="cart-outline" size={80} color="#CCC" />
            <Text style={styles.emptyText}>Your cart is empty</Text>
            <TouchableOpacity
              style={styles.shopBtn}
              onPress={() => navigation.navigate('Tabs', { screen: 'Home' })}
            >
              <Text style={styles.shopBtnText}>Start Shopping</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {items.length > 0 && (
        <View style={styles.footer}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalValue}>ETB {totalPrice().toLocaleString()}</Text>
          </View>
          <TouchableOpacity
            style={[styles.checkoutBtn, createOrderMutation.isPending && styles.disabledBtn]}
            onPress={handleCheckout}
            disabled={createOrderMutation.isPending}
          >
            {createOrderMutation.isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.checkoutBtnText}>Checkout Now</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  backBtn: { padding: 8 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#333' },
  listContent: { padding: 16 },
  itemCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  itemImage: { width: 80, height: 80, borderRadius: 8, backgroundColor: '#F0F0F0' },
  itemInfo: { flex: 1, marginLeft: 12 },
  itemTitle: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 4 },
  itemPrice: { fontSize: 15, fontWeight: '700', color: '#FF8C00' },
  quantityContainer: { marginTop: 8 },
  quantityText: { fontSize: 13, color: '#666' },
  removeBtn: { padding: 8 },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 100 },
  emptyText: { fontSize: 18, color: '#999', marginTop: 16, marginBottom: 24 },
  shopBtn: { backgroundColor: '#FF8C00', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 25 },
  shopBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  footer: {
    backgroundColor: '#fff',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#EEE',
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  totalLabel: { fontSize: 16, color: '#666' },
  totalValue: { fontSize: 20, fontWeight: '700', color: '#333' },
  checkoutBtn: {
    backgroundColor: '#FF8C00',
    height: 54,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledBtn: { opacity: 0.6 },
  checkoutBtnText: { color: '#fff', fontSize: 18, fontWeight: '700' },
});