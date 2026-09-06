import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, ActivityIndicator,
  TouchableOpacity, StatusBar, TextInput, Keyboard
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { useProductsQuery } from '../../api/services/productService';
import ProductCard from '../../components/ProductCard';
import SkeletonLoader from '../../components/SkeletonLoader';

const THEME_COLOR = '#FF8C00';

export default function SearchResultsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<any>();

  const { query: initialQuery = '', filters: initialFilters } = route.params || {};

  // Allow editing the search query from within results
  const [searchText, setSearchText] = useState<string>(initialQuery);
  const [activeQuery, setActiveQuery] = useState<string>(initialQuery);

  // Build API params: send both the text search and all filter fields
  const apiParams: any = {
    state: 1,
    recordStatus: 1,
  };
  if (activeQuery?.trim()) {
    apiParams.search = activeQuery.trim();
  }
  if (initialFilters) {
    // Map filter fields to backend params
    const { transactionType, productType, category, minPrice, maxPrice, ...rest } = initialFilters;
    if (transactionType != null) apiParams.transactionType = transactionType;
    if (productType != null) apiParams.productType = productType;
    if (category) apiParams.category = category;
    if (minPrice != null) apiParams.minPrice = minPrice;
    if (maxPrice != null) apiParams.maxPrice = maxPrice;
    // Pass through any extra filter keys (e.g. state, recordStatus overrides)
    Object.assign(apiParams, rest);
  }

  const { data, isLoading, isError, refetch } = useProductsQuery(apiParams);

  // Refetch when screen comes back into focus (e.g. after filter change)
  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  // Client-side text filter as fallback (catches edge cases backend may miss)
  const queryLower = activeQuery?.toLowerCase() || '';
  const products = (data?.products || []).filter(p => {
    if (!queryLower) return true;
    return (
      p.title?.toLowerCase().includes(queryLower) ||
      p.description?.toLowerCase().includes(queryLower) ||
      p.category?.name?.toLowerCase().includes(queryLower) ||
      p.consignee?.firstName?.toLowerCase().includes(queryLower) ||
      p.consignee?.lastName?.toLowerCase().includes(queryLower)
    );
  });

  const handleSearchSubmit = useCallback(() => {
    Keyboard.dismiss();
    setActiveQuery(searchText.trim());
  }, [searchText]);

  // Count active filters for badge
  const activeFilterCount = initialFilters
    ? Object.keys(initialFilters).filter(k => !['state', 'recordStatus'].includes(k) && initialFilters[k] != null).length
    : 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* ─── Search Bar Header ─── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>

        <View style={styles.searchBar}>
          <Ionicons name="search" size={16} color="#888" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            value={searchText}
            onChangeText={setSearchText}
            onSubmitEditing={handleSearchSubmit}
            returnKeyType="search"
            placeholder="Search listings..."
            placeholderTextColor="#bbb"
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => { setSearchText(''); setActiveQuery(''); }}>
              <Ionicons name="close-circle" size={16} color="#bbb" />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={styles.filterBtn}
          onPress={() => navigation.navigate('Filter', {
            query: activeQuery,
            currentFilters: initialFilters || {}
          } as any)}
        >
          <Ionicons name="options-outline" size={22} color={activeFilterCount > 0 ? THEME_COLOR : '#333'} />
          {activeFilterCount > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* ─── Results Count ─── */}
      {!isLoading && !isError && (
        <View style={styles.resultsCountRow}>
          <Text style={styles.resultsCount}>
            {products.length} result{products.length !== 1 ? 's' : ''}
            {activeQuery ? ` for "${activeQuery}"` : ''}
          </Text>
          {activeFilterCount > 0 && (
            <TouchableOpacity
              onPress={() => navigation.navigate('SearchResults', { query: activeQuery })}
            >
              <Text style={styles.clearFiltersText}>Clear filters</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* ─── Content ─── */}
      {isLoading ? (
        <FlatList
          data={[1, 2, 3, 4]}
          keyExtractor={(i) => String(i)}
          contentContainerStyle={styles.listContent}
          renderItem={() => (
            <View style={{ paddingHorizontal: 15, marginBottom: 12 }}>
              <SkeletonLoader width="100%" height={100} />
            </View>
          )}
        />
      ) : isError ? (
        <View style={styles.center}>
          <Ionicons name="wifi-outline" size={52} color="#ddd" />
          <Text style={styles.errorText}>Connection error. Please try again.</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : products.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="search-outline" size={64} color="#e0e0e0" />
          <Text style={styles.emptyTitle}>No results found</Text>
          <Text style={styles.emptySubtitle}>
            {activeQuery ? `Nothing matched "${activeQuery}".` : 'Try adjusting your filters.'}
          </Text>
          <TouchableOpacity
            style={styles.browseBtn}
            onPress={() => navigation.navigate('Search')}
          >
            <Text style={styles.browseBtnText}>Change Search</Text>
          </TouchableOpacity>
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
  container: { flex: 1, backgroundColor: '#f5f5f5' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
  },
  backBtn: { padding: 6, marginRight: 4 },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
  },
  searchInput: { flex: 1, fontSize: 14, color: '#222' },
  filterBtn: { padding: 6, position: 'relative' },
  filterBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: THEME_COLOR,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  filterBadgeText: { fontSize: 10, color: '#fff', fontWeight: '700' },

  resultsCountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  resultsCount: { fontSize: 13, color: '#666', fontWeight: '500' },
  clearFiltersText: { fontSize: 13, color: THEME_COLOR, fontWeight: '600' },

  listContent: { paddingVertical: 12, paddingBottom: 40 },

  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30 },
  errorText: { color: '#999', fontSize: 15, marginTop: 12, textAlign: 'center' },
  retryBtn: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: THEME_COLOR,
  },
  retryText: { color: '#fff', fontWeight: '700' },

  emptyTitle: { fontSize: 17, fontWeight: '700', color: '#333', marginTop: 16 },
  emptySubtitle: { fontSize: 14, color: '#aaa', marginTop: 6, textAlign: 'center' },
  browseBtn: {
    marginTop: 20,
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 24,
    backgroundColor: THEME_COLOR,
  },
  browseBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});