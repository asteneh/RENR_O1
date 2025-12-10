import React, { useState } from 'react';
import { 
  View, Text, TouchableOpacity, StyleSheet, ScrollView, Switch 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';

const THEME_COLOR = '#FF8C00';

export default function FilterScreen() {
  const navigation = useNavigation<any>();

  // Mock Data for Dropdowns
  const LISTING_TYPES = ['Any', 'SALE', 'RENT'];
  const PROPERTY_TYPES = ['Any', 'Villa', 'Apartment', 'Office', 'Condominium', 'Land'];

  // States
  const [listingType, setListingType] = useState('Any');
  const [propertyType, setPropertyType] = useState('Any');
  
  // Toggle Visibility for dropdowns
  const [showListingType, setShowListingType] = useState(false);
  const [showPropType, setShowPropType] = useState(false);

  const Dropdown = ({ label, value, isOpen, toggle, options, onSelect }: any) => (
    <View style={styles.dropdownContainer}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity style={styles.dropdownHeader} onPress={toggle}>
        <Text style={styles.dropdownValue}>{value}</Text>
        <Ionicons name={isOpen ? "chevron-up" : "chevron-down"} size={20} color="#666" />
      </TouchableOpacity>
      
      {isOpen && (
        <View style={styles.dropdownList}>
          {options.map((opt: string) => (
            <TouchableOpacity 
              key={opt} 
              style={[styles.dropdownItem, opt === value && { backgroundColor: '#FFF3E0' }]} 
              onPress={() => onSelect(opt)}
            >
              <Text style={[styles.dropdownItemText, opt === value && { color: THEME_COLOR, fontWeight: 'bold' }]}>
                {opt}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
        {/* Custom Header with Reset */}
        <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
                <Ionicons name="arrow-back" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Filters</Text>
            <TouchableOpacity>
                <Text style={{ color: THEME_COLOR, fontWeight: '600' }}>Reset</Text>
            </TouchableOpacity>
        </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Dropdowns */}
        <Dropdown 
          label="Listing Type" 
          value={listingType} 
          isOpen={showListingType} 
          toggle={() => setShowListingType(!showListingType)}
          options={LISTING_TYPES}
          onSelect={(val: string) => { setListingType(val); setShowListingType(false); }}
        />

        <Dropdown 
          label="Property Category" 
          value={propertyType} 
          isOpen={showPropType} 
          toggle={() => setShowPropType(!showPropType)}
          options={PROPERTY_TYPES}
          onSelect={(val: string) => { setPropertyType(val); setShowPropType(false); }}
        />

        {/* Price Range Simulation */}
        <View style={styles.section}>
            <Text style={styles.label}>Price Range</Text>
            <Text style={styles.rangeText}>1,000 Birr - 1,000,000,000 Birr</Text>
            <View style={styles.sliderTrack}>
                <View style={styles.sliderFill} />
                <View style={[styles.thumb, { left: 0 }]} />
                <View style={[styles.thumb, { right: 0 }]} />
            </View>
        </View>

        {/* Year Built Simulation */}
        <View style={styles.section}>
            <Text style={styles.label}>Year Built (1960 - 2025)</Text>
            <View style={styles.sliderTrack}>
                <View style={styles.sliderFill} />
                <View style={[styles.thumb, { left: 0 }]} />
                <View style={[styles.thumb, { right: 0 }]} />
            </View>
        </View>

        {/* Buttons Row */}
        <View style={styles.row}>
            <TouchableOpacity style={styles.smallInputBtn}><Text style={styles.smallBtnText}>Min Beds</Text></TouchableOpacity>
            <TouchableOpacity style={styles.smallInputBtn}><Text style={styles.smallBtnText}>Min Bath...</Text></TouchableOpacity>
            <TouchableOpacity style={styles.smallInputBtn}><Text style={styles.smallBtnText}>Min Gar...</Text></TouchableOpacity>
        </View>

      </ScrollView>

      {/* Footer Button */}
      <View style={styles.footer}>
        <TouchableOpacity 
            style={styles.applyBtn}
            onPress={() => navigation.navigate('SearchResults', { filters: { listingType, propertyType } })}
        >
            <Text style={styles.applyBtnText}>Apply Filters</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { 
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', 
      paddingHorizontal: 15, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#eee', marginTop: 30
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  scrollContent: { padding: 20, paddingBottom: 100 },
  
  dropdownContainer: { marginBottom: 20, zIndex: 10 },
  label: { fontSize: 14, color: '#666', marginBottom: 8 },
  dropdownHeader: { 
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      borderWidth: 1, borderColor: '#eee', borderRadius: 10, padding: 15, backgroundColor: '#fff' 
  },
  dropdownValue: { fontSize: 16, fontWeight: '500', color: '#333' },
  dropdownList: { 
      backgroundColor: '#f9f9f9', marginTop: 5, borderRadius: 10, 
      borderWidth: 1, borderColor: '#eee' 
  },
  dropdownItem: { padding: 15, borderBottomWidth: 1, borderBottomColor: '#eee' },
  dropdownItemText: { fontSize: 16, color: '#333' },

  section: { marginBottom: 25 },
  rangeText: { fontSize: 12, color: '#888', marginBottom: 10 },
  sliderTrack: { height: 4, backgroundColor: THEME_COLOR, borderRadius: 2, position: 'relative', marginTop: 10, marginHorizontal: 10 },
  sliderFill: { position: 'absolute', left: 0, right: 0, height: 4, backgroundColor: THEME_COLOR },
  thumb: { 
      position: 'absolute', top: -8, width: 20, height: 20, borderRadius: 10, 
      backgroundColor: THEME_COLOR, elevation: 3, shadowColor: '#000', shadowOffset: {width:0, height:2}, shadowOpacity: 0.2
  },

  row: { flexDirection: 'row', justifyContent: 'space-between' },
  smallInputBtn: { 
      width: '31%', borderWidth: 1, borderColor: '#eee', borderRadius: 10, 
      paddingVertical: 15, alignItems: 'center' 
  },
  smallBtnText: { color: '#666' },

  footer: { 
      padding: 20, borderTopWidth: 1, borderTopColor: '#eee', 
      position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff' 
  },
  applyBtn: { 
      backgroundColor: THEME_COLOR, paddingVertical: 18, borderRadius: 30, alignItems: 'center' 
  },
  applyBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});