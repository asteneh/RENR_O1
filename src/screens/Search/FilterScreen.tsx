import React, { useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  TextInput, ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCategoriesByService } from '../../api/services/categoryService';
import { ServiceEnums, TransactionTypeEnums } from '../../constants/ServiceEnums';

const THEME_COLOR = '#FF8C00';

// ---- Option pill chip ----
const Chip = ({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) => (
  <TouchableOpacity
    style={[styles.chip, selected && styles.chipSelected]}
    onPress={onPress}
    activeOpacity={0.75}
  >
    <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
  </TouchableOpacity>
);

export default function FilterScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  // Carry over any existing query from previous screens
  const existingQuery: string = route.params?.query || '';
  const existingFilters: any = route.params?.currentFilters || {};

  // ---- Filter State ----
  const [transactionType, setTransactionType] = useState<number | null>(
    existingFilters.transactionType ?? null
  );
  const [productType, setProductType] = useState<number | null>(
    existingFilters.productType ?? null
  );
  const [categoryId, setCategoryId] = useState<string | null>(
    existingFilters.category ?? null
  );
  const [minPrice, setMinPrice] = useState<string>(
    existingFilters.minPrice ? String(existingFilters.minPrice) : ''
  );
  const [maxPrice, setMaxPrice] = useState<string>(
    existingFilters.maxPrice ? String(existingFilters.maxPrice) : ''
  );

  // Dynamic categories based on selected product type
  const machineryServiceId = productType === null || productType === ServiceEnums.Machinery ? ServiceEnums.Machinery : 0;
  const vehicleServiceId = productType === null || productType === ServiceEnums.Vehicle ? ServiceEnums.Vehicle : 0;
  const propertyServiceId = productType === null || productType === ServiceEnums.Property ? ServiceEnums.Property : 0;

  const { data: machineryCats, isLoading: mLoading } = useCategoriesByService(ServiceEnums.Machinery);
  const { data: vehicleCats, isLoading: vLoading } = useCategoriesByService(ServiceEnums.Vehicle);
  const { data: propertyCats, isLoading: pLoading } = useCategoriesByService(ServiceEnums.Property);

  const catsLoading = mLoading || vLoading || pLoading;

  const allCategories = [
    ...(machineryCats || []),
    ...(vehicleCats || []),
    ...(propertyCats || []),
  ];

  // Show only categories for selected product type
  const filteredCategories = productType === ServiceEnums.Machinery
    ? (machineryCats || [])
    : productType === ServiceEnums.Vehicle
    ? (vehicleCats || [])
    : productType === ServiceEnums.Property
    ? (propertyCats || [])
    : allCategories;

  const handleReset = useCallback(() => {
    setTransactionType(null);
    setProductType(null);
    setCategoryId(null);
    setMinPrice('');
    setMaxPrice('');
  }, []);

  const handleApply = useCallback(() => {
    const filters: any = {};
    if (transactionType !== null) filters.transactionType = transactionType;
    if (productType !== null) filters.productType = productType;
    if (categoryId) filters.category = categoryId;
    if (minPrice && !isNaN(Number(minPrice))) filters.minPrice = Number(minPrice);
    if (maxPrice && !isNaN(Number(maxPrice))) filters.maxPrice = Number(maxPrice);
    filters.state = 1;
    filters.recordStatus = 1;

    navigation.navigate('SearchResults', { query: existingQuery, filters });
  }, [transactionType, productType, categoryId, minPrice, maxPrice, existingQuery, navigation]);

  const activeFiltersCount = [
    transactionType !== null,
    productType !== null,
    !!categoryId,
    !!minPrice,
    !!maxPrice,
  ].filter(Boolean).length;

  return (
    <View style={styles.container}>
      {/* Header */}
      <SafeAreaView edges={['top']} style={{ backgroundColor: '#fff' }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Advanced Filters</Text>
          <TouchableOpacity onPress={handleReset} style={styles.resetBtn}>
            <Text style={styles.resetText}>Reset{activeFiltersCount > 0 ? ` (${activeFiltersCount})` : ''}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Transaction Type */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Transaction Type</Text>
          <View style={styles.chipRow}>
            <Chip
              label="All"
              selected={transactionType === null}
              onPress={() => setTransactionType(null)}
            />
            <Chip
              label="🔑 Rent"
              selected={transactionType === TransactionTypeEnums.Rent}
              onPress={() => setTransactionType(TransactionTypeEnums.Rent)}
            />
            <Chip
              label="🏷️ Sale"
              selected={transactionType === TransactionTypeEnums.Sale}
              onPress={() => setTransactionType(TransactionTypeEnums.Sale)}
            />
          </View>
        </View>

        {/* Product / Service Type */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Product Type</Text>
          <View style={styles.chipRow}>
            <Chip
              label="All"
              selected={productType === null}
              onPress={() => { setProductType(null); setCategoryId(null); }}
            />
            <Chip
              label="🏗️ Machinery"
              selected={productType === ServiceEnums.Machinery}
              onPress={() => { setProductType(ServiceEnums.Machinery); setCategoryId(null); }}
            />
            <Chip
              label="🚗 Vehicle"
              selected={productType === ServiceEnums.Vehicle}
              onPress={() => { setProductType(ServiceEnums.Vehicle); setCategoryId(null); }}
            />
            <Chip
              label="🏠 Property"
              selected={productType === ServiceEnums.Property}
              onPress={() => { setProductType(ServiceEnums.Property); setCategoryId(null); }}
            />
          </View>
        </View>

        {/* Category */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Category</Text>
          {catsLoading ? (
            <ActivityIndicator size="small" color={THEME_COLOR} style={{ marginTop: 10 }} />
          ) : (
            <View style={styles.chipRow}>
              <Chip
                label="All Categories"
                selected={categoryId === null}
                onPress={() => setCategoryId(null)}
              />
              {filteredCategories.map((cat) => (
                <Chip
                  key={cat._id}
                  label={cat.name}
                  selected={categoryId === cat._id}
                  onPress={() => setCategoryId(cat._id)}
                />
              ))}
            </View>
          )}
        </View>

        {/* Price Range */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Price Range (ETB)</Text>
          <View style={styles.priceRow}>
            <View style={styles.priceInputWrap}>
              <Text style={styles.priceInputLabel}>Min Price</Text>
              <TextInput
                style={styles.priceInput}
                placeholder="e.g. 5000"
                placeholderTextColor="#aaa"
                keyboardType="numeric"
                value={minPrice}
                onChangeText={setMinPrice}
              />
            </View>
            <View style={styles.priceDivider}>
              <Text style={{ color: '#ccc', fontSize: 18 }}>—</Text>
            </View>
            <View style={styles.priceInputWrap}>
              <Text style={styles.priceInputLabel}>Max Price</Text>
              <TextInput
                style={styles.priceInput}
                placeholder="e.g. 500000"
                placeholderTextColor="#aaa"
                keyboardType="numeric"
                value={maxPrice}
                onChangeText={setMaxPrice}
              />
            </View>
          </View>
        </View>

        {/* Padding for footer */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Footer: Apply button */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.applyBtn} onPress={handleApply} activeOpacity={0.85}>
          <Ionicons name="checkmark-circle" size={20} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.applyBtnText}>Show Results</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#111' },
  resetBtn: { padding: 4 },
  resetText: { color: THEME_COLOR, fontWeight: '600', fontSize: 14 },

  scrollContent: { padding: 20 },

  section: { marginBottom: 28 },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#555',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 12,
  },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
    backgroundColor: '#fafafa',
    marginRight: 8,
    marginBottom: 8,
  },
  chipSelected: {
    backgroundColor: '#FFF3E0',
    borderColor: THEME_COLOR,
  },
  chipText: { fontSize: 13, color: '#555', fontWeight: '500' },
  chipTextSelected: { color: THEME_COLOR, fontWeight: '700' },

  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  priceInputWrap: { flex: 1 },
  priceInputLabel: { fontSize: 12, color: '#999', marginBottom: 6 },
  priceInput: {
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#333',
    backgroundColor: '#fafafa',
  },
  priceDivider: { marginTop: 18, paddingHorizontal: 4 },

  footer: {
    padding: 20,
    paddingBottom: 30,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  applyBtn: {
    backgroundColor: THEME_COLOR,
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: THEME_COLOR,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  applyBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});
