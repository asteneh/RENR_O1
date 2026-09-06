import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, FlatList, ActivityIndicator, Keyboard
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useProductsQuery } from '../../api/services/productService';

const THEME_COLOR = '#FF8C00';

const POPULAR_SEARCHES = [
  'Excavator', 'Bulldozer', 'Loader', 'Dump Truck', 'Crane',
  'Toyota', 'Villa', 'Apartment', 'Generator', 'Grader',
];

const RECENT_SEARCHES_KEY = 'recent_searches';

// Simple in-memory recent searches (resets per session)
let _recentSearches: string[] = [];

export default function SearchScreen() {
  const navigation = useNavigation<any>();
  const [query, setQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>(_recentSearches);
  const inputRef = useRef<TextInput>(null);

  // Debounced live-preview query — only fires when query >= 2 chars
  const [debouncedQuery, setDebouncedQuery] = useState('');
  useEffect(() => {
    if (query.length < 2) {
      setDebouncedQuery('');
      return;
    }
    const t = setTimeout(() => setDebouncedQuery(query), 400);
    return () => clearTimeout(t);
  }, [query]);

  const { data: previewData, isLoading: previewLoading } = useProductsQuery(
    debouncedQuery
      ? { search: debouncedQuery, state: 1, recordStatus: 1, pageSize: 5 }
      : undefined
  );

  const previewProducts = (previewData?.products || []).filter(p => {
    const q = debouncedQuery.toLowerCase();
    return (
      p.title?.toLowerCase().includes(q) ||
      p.description?.toLowerCase().includes(q) ||
      p.category?.name?.toLowerCase().includes(q)
    );
  }).slice(0, 5);

  const goToResults = useCallback((q: string) => {
    if (!q.trim()) return;
    // Save to in-memory recent searches
    _recentSearches = [q, ..._recentSearches.filter(s => s !== q)].slice(0, 8);
    setRecentSearches(_recentSearches);
    Keyboard.dismiss();
    navigation.navigate('SearchResults', { query: q });
  }, [navigation]);

  const handleSubmit = useCallback(() => {
    goToResults(query.trim());
  }, [query, goToResults]);

  const clearQuery = useCallback(() => {
    setQuery('');
    setDebouncedQuery('');
    inputRef.current?.focus();
  }, []);

  const removeRecent = useCallback((term: string) => {
    _recentSearches = _recentSearches.filter(s => s !== term);
    setRecentSearches([..._recentSearches]);
  }, []);

  const showPreview = debouncedQuery.length >= 2;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>

      {/* ─── Search Header ─── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>

        <View style={styles.searchBarWrap}>
          <Ionicons name="search" size={18} color="#888" style={{ marginRight: 8 }} />
          <TextInput
            ref={inputRef}
            style={styles.input}
            placeholder="Search listings..."
            placeholderTextColor="#bbb"
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={handleSubmit}
            returnKeyType="search"
            autoFocus
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={clearQuery}>
              <Ionicons name="close-circle" size={18} color="#bbb" />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={styles.filterIconBtn}
          onPress={() => navigation.navigate('Filter', { query, currentFilters: {} })}
        >
          <Ionicons name="options-outline" size={24} color={THEME_COLOR} />
        </TouchableOpacity>
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.body}
        showsVerticalScrollIndicator={false}
      >

        {/* ─── Live Preview Suggestions ─── */}
        {showPreview && (
          <View style={styles.section}>
            {previewLoading ? (
              <ActivityIndicator size="small" color={THEME_COLOR} style={{ marginVertical: 16 }} />
            ) : previewProducts.length > 0 ? (
              <>
                <Text style={styles.sectionLabel}>Suggestions</Text>
                {previewProducts.map((p) => (
                  <TouchableOpacity
                    key={p._id}
                    style={styles.suggestionRow}
                    onPress={() => goToResults(p.title)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="search-outline" size={16} color="#bbb" style={{ marginRight: 10 }} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.suggestionTitle} numberOfLines={1}>{p.title}</Text>
                      {p.category?.name ? (
                        <Text style={styles.suggestionSub}>{p.category.name}</Text>
                      ) : null}
                    </View>
                    <TouchableOpacity onPress={() => setQuery(p.title)}>
                      <Ionicons name="arrow-undo-outline" size={16} color="#ccc" />
                    </TouchableOpacity>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity
                  style={styles.seeAllBtn}
                  onPress={() => goToResults(debouncedQuery)}
                >
                  <Text style={styles.seeAllText}>See all results for "{debouncedQuery}"</Text>
                  <Ionicons name="arrow-forward" size={14} color={THEME_COLOR} />
                </TouchableOpacity>
              </>
            ) : (
              <View style={styles.noResultsRow}>
                <Ionicons name="search-outline" size={20} color="#ccc" style={{ marginRight: 8 }} />
                <Text style={styles.noResultsText}>No suggestions for "{debouncedQuery}"</Text>
              </View>
            )}
          </View>
        )}

        {/* ─── Recent Searches ─── */}
        {!showPreview && recentSearches.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionLabel}>Recent</Text>
              <TouchableOpacity onPress={() => { _recentSearches = []; setRecentSearches([]); }}>
                <Text style={styles.clearAllText}>Clear all</Text>
              </TouchableOpacity>
            </View>
            {recentSearches.map((term) => (
              <TouchableOpacity
                key={term}
                style={styles.recentRow}
                onPress={() => goToResults(term)}
                activeOpacity={0.7}
              >
                <Ionicons name="time-outline" size={16} color="#bbb" style={{ marginRight: 10 }} />
                <Text style={styles.recentText}>{term}</Text>
                <TouchableOpacity onPress={() => removeRecent(term)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Ionicons name="close" size={16} color="#ccc" />
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* ─── Popular Searches ─── */}
        {!showPreview && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Popular Searches</Text>
            <View style={styles.chipGrid}>
              {POPULAR_SEARCHES.map((term) => (
                <TouchableOpacity
                  key={term}
                  style={styles.chip}
                  onPress={() => goToResults(term)}
                  activeOpacity={0.75}
                >
                  <Ionicons name="trending-up-outline" size={13} color={THEME_COLOR} style={{ marginRight: 4 }} />
                  <Text style={styles.chipText}>{term}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* ─── Browse by Type ─── */}
        {!showPreview && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Browse by Type</Text>
            <View style={styles.typeGrid}>
              {[
                { label: 'Machinery', icon: 'hammer-outline', q: '', pt: 1 },
                { label: 'Vehicles', icon: 'car-outline', q: '', pt: 3 },
                { label: 'Property', icon: 'home-outline', q: '', pt: 2 },
              ].map(({ label, icon, q, pt }) => (
                <TouchableOpacity
                  key={label}
                  style={styles.typeCard}
                  onPress={() => navigation.navigate('SearchResults', {
                    query: '',
                    filters: { productType: pt, state: 1, recordStatus: 1 }
                  })}
                  activeOpacity={0.8}
                >
                  <Ionicons name={icon as any} size={28} color={THEME_COLOR} />
                  <Text style={styles.typeLabel}>{label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  backBtn: { padding: 6, marginRight: 4 },
  searchBarWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginRight: 8,
  },
  input: { flex: 1, fontSize: 15, color: '#222' },
  filterIconBtn: { padding: 6 },

  body: { padding: 20, paddingBottom: 50 },

  section: { marginBottom: 28 },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
  },
  clearAllText: { fontSize: 13, color: THEME_COLOR, fontWeight: '600' },

  // Suggestions
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  suggestionTitle: { fontSize: 14, color: '#222', fontWeight: '500' },
  suggestionSub: { fontSize: 12, color: '#aaa', marginTop: 2 },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 6,
  },
  seeAllText: { fontSize: 14, color: THEME_COLOR, fontWeight: '600' },

  noResultsRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16 },
  noResultsText: { color: '#aaa', fontSize: 14 },

  // Recent
  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f8f8',
  },
  recentText: { flex: 1, fontSize: 14, color: '#333' },

  // Popular chips
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#f0e8d6',
    backgroundColor: '#FFF9F0',
    marginRight: 8,
    marginBottom: 8,
  },
  chipText: { fontSize: 13, color: '#555', fontWeight: '500' },

  // Browse by type
  typeGrid: { flexDirection: 'row', gap: 10 },
  typeCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 20,
    borderRadius: 14,
    backgroundColor: '#FFF9F0',
    borderWidth: 1,
    borderColor: '#F5E8D0',
    gap: 8,
  },
  typeLabel: { fontSize: 13, fontWeight: '600', color: '#555' },
});