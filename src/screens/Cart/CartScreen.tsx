import React from 'react';
import { View, Text, FlatList, Button, StyleSheet } from 'react-native';
import { useCartStore } from '../../store/useCartStore';

export default function CartScreen() {
  const items = useCartStore((state) => state.items);
  const removeItem = useCartStore((state) => state.removeItem);
  const totalPrice = useCartStore((state) => state.totalPrice);
  const clearCart = useCartStore((state) => state.clearCart);

  return (
    <View style={styles.container}>
      <FlatList
        data={items}
        keyExtractor={(item) => item._id}
        ListEmptyComponent={<Text style={styles.empty}>Your cart is empty</Text>}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <View>
              <Text style={styles.name}>{item.title}</Text>
              <Text>Qty: {item.quantity} | Total: ETB {((item.currentPrice || 0) * item.quantity).toLocaleString()}</Text>
            </View>
            <Button title="Remove" color="red" onPress={() => removeItem(item._id)} />
          </View>
        )}
      />

      {items.length > 0 && (
        <View style={styles.footer}>
          <Text style={styles.total}>Total: ${totalPrice()}</Text>
          <Button title="Checkout" onPress={clearCart} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  item: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, padding: 10, backgroundColor: '#fff', borderRadius: 8 },
  name: { fontSize: 16, fontWeight: 'bold' },
  empty: { textAlign: 'center', marginTop: 50, fontSize: 18 },
  footer: { borderTopWidth: 1, borderColor: '#ddd', paddingTop: 20 },
  total: { fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
});