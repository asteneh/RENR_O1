import React from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { useProductsQuery } from '../../api/services/productService';
import ProductCard from '../../components/ProductCard';
import SkeletonLoader from '../../components/SkeletonLoader';
const THEME_COLOR = '#FF8C00';

export default function SearchResultsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<any>();
  const { query, filters } = route.params || {};

  const { data, isLoading, isError } = useProductsQuery({ 
    search: query,
    state: 1, // Available
    ...filters 
  });

  const products = data?.products || [];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Search Bar Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.fakeSearch} onPress={() => navigation.navigate('Search')}>
            <Ionicons name="search" size={18} color="#666" />
            <Text style={styles.fakeSearchText}>{query || 'Enter keyword'}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('Filter')}>
            <Ionicons name="options-outline" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={THEME_COLOR} />
        </View>
      ) : isError ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>Something went wrong. Please try again.</Text>
        </View>
      ) : products.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="search-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>No results found for "{query}"</Text>
        </View>
      ) : (
        <FlatList 
          data={products}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <View style={{ paddingHorizontal: 15 }}>
              <ProductCard product={item} />
            </View>
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f2f2f2' },
  header: { 
    flexDirection: 'row', alignItems: 'center', padding: 15, 
    backgroundColor: '#fff', elevation: 2 
  },
  fakeSearch: { 
    flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#f5f5f5', 
    borderRadius: 8, padding: 8, marginHorizontal: 15 
  },
  fakeSearchText: { marginLeft: 8, color: '#333' },
  
  listContent: { paddingVertical: 15 },

  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  emptyText: { marginTop: 10, color: '#999', fontSize: 16 },
  errorText: { color: 'red', fontSize: 14 },
});