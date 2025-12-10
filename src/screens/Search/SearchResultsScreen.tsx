import React from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
const THEME_COLOR = '#FF8C00';

const MOCK_RESULTS = [
  {
    id: '1',
    price: '14,000,000 Birr',
    title: 'Villa For Sale',
    location: 'WPXJ+CQ4, Addis Ababa, Ethiopia, Nifas Silk-Lafto',
    beds: 2, baths: 1, area: '105 Square Meter',
    image: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b91d?ixlib=rb-1.2.1&auto=format&fit=crop&w=1334&q=80',
  },
  {
    id: '2',
    price: '5,100,000 Birr',
    title: 'Apartment For Sale',
    location: 'XQHG+F96, Qelebet Menged, Addis Ababa, Ethiopia',
    beds: 1, baths: 1, area: '53 Square Meter',
    image: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
  }
];

export default function SearchResultsScreen({ route }: any) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { query, filters } = route.params || {};

  const renderCard = ({ item }: any) => (
    <View style={styles.card}>
      {/* Image Section */}
      <View style={styles.imageContainer}>
        <Image source={{ uri: item.image }} style={styles.cardImage} />
        <View style={styles.priceTag}>
          <Text style={styles.priceText}>{item.price}</Text>
        </View>
      </View>

      {/* Content Section */}
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>{item.title}</Text>
        <Text style={styles.cardLocation} numberOfLines={2}>{item.location}</Text>
        
        <View style={styles.divider} />

        <View style={styles.featuresRow}>
          <View style={styles.featureItem}>
            <Ionicons name="bed-outline" size={16} color={THEME_COLOR} />
            <Text style={styles.featureText}>{item.beds} Beds</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="water-outline" size={16} color={THEME_COLOR} />
            <Text style={styles.featureText}>{item.baths} Baths</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="scan-outline" size={16} color={THEME_COLOR} />
            <Text style={styles.featureText}>{item.area}</Text>
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Search Bar Header (Read Only here to go back) */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.fakeSearch} onPress={() => navigation.navigate('Search')}>
            <Ionicons name="search" size={18} color="#666" />
            <Text style={styles.fakeSearchText}>{query || 'Enter keyword (e.g., "villa")'}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('Filter')}>
            <Ionicons name="options-outline" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      <FlatList 
        data={MOCK_RESULTS}
        keyExtractor={(item) => item.id}
        renderItem={renderCard}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
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
  
  listContent: { padding: 15 },

  // Card Styles
  card: { 
    backgroundColor: '#fff', borderRadius: 15, marginBottom: 20, 
    overflow: 'hidden', elevation: 3, shadowColor: '#000', 
    shadowOpacity: 0.1, shadowRadius: 5 
  },
  imageContainer: { height: 200, width: '100%' },
  cardImage: { width: '100%', height: '100%' },
  priceTag: { 
    position: 'absolute', bottom: 15, left: 15, 
    backgroundColor: THEME_COLOR, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 5 
  },
  priceText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  
  cardContent: { padding: 15 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 5 },
  cardLocation: { fontSize: 14, color: '#666', marginBottom: 10, lineHeight: 20 },
  divider: { height: 1, backgroundColor: '#eee', marginVertical: 10 },
  
  featuresRow: { flexDirection: 'row', justifyContent: 'space-between' },
  featureItem: { flexDirection: 'row', alignItems: 'center' },
  featureText: { marginLeft: 5, color: '#555', fontSize: 13 },
});