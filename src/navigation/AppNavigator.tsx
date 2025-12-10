import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as NavigationBar from 'expo-navigation-bar';

// Screens
import HomeScreen from '../screens/Home/HomeScreen';
import ProductDetailsScreen from '../screens/ProductDetails/ProductDetailsScreen';
import LoginScreen from '../screens/Auth/LoginScreen';
import SignUpScreen from '../screens/Auth/SignUpScreen';
import ProfileScreen from '../screens/Profile/ProfileScreen';
import PostPropertyScreen from '../screens/Property/PostPropertyScreen';
import SearchScreen from '../screens/Search/SearchScreen';
import FilterScreen from '../screens/Search/FilterScreen';
import SearchResultsScreen from '../screens/Search/SearchResultsScreen';

import { RootStackParamList, TabParamList } from './types';
import { useAuthStore } from '../store/useAuthStore'; // <--- Import Store

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

const THEME_COLOR = '#FF8C00';

function TabNavigator() {
  const insets = useSafeAreaInsets();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated); // <--- Check Auth State

  return (
    <Tab.Navigator screenOptions={({ route }) => ({
      headerShown: false,
      tabBarActiveTintColor: THEME_COLOR,
      tabBarInactiveTintColor: 'gray',
      tabBarStyle: { 
        height: 60 + insets.bottom, 
        paddingBottom: insets.bottom > 0 ? insets.bottom : 10, 
        paddingTop: 8,
        backgroundColor: '#fff',
      },
      tabBarIcon: ({ color, size, focused }) => {
        let iconName: keyof typeof Ionicons.glyphMap = 'home';
        
        if (route.name === 'Home') {
          iconName = focused ? 'home' : 'home-outline';
        } else if (route.name === 'Profile') {
          iconName = focused ? 'person' : 'person-outline';
        } else if (route.name === 'Login') {
          iconName = focused ? 'log-in' : 'log-in-outline';
        }

        return <Ionicons name={iconName} size={size} color={color} />;
      },
    })}>
      <Tab.Screen name="Home" component={HomeScreen} />
      
      {/* --- CONDITIONAL TABS --- */}
      {isAuthenticated ? (
        // If Logged In: Show Profile
        <Tab.Screen 
          name="Profile" 
          component={ProfileScreen} 
          options={{ title: 'Profile' }}
        />
      ) : (
        // If Logged Out: Show Login
        <Tab.Screen 
          name="Login" 
          component={LoginScreen} 
        />
      )}

    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  useEffect(() => {
    if (Platform.OS === 'android') {
      NavigationBar.setBackgroundColorAsync('white'); 
      NavigationBar.setButtonStyleAsync('dark'); 
    }
  }, []);

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {/* Main Tabs */}
        <Stack.Screen name="Tabs" component={TabNavigator} options={{ headerShown: false }} />
        
        {/* Common Screens */}
        <Stack.Screen name="ProductDetails" component={ProductDetailsScreen} options={{ headerShown: false }} />
        
        {/* Auth Screens (Available in Stack) */}
        <Stack.Screen name="SignUp" component={SignUpScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Search" component={SearchScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Filter" component={FilterScreen} options={{ headerShown: true, title: 'Filters' }} />
        <Stack.Screen name="SearchResults" component={SearchResultsScreen} options={{ headerShown: false }} />
        {/* Property Screens */}
        <Stack.Screen 
          name="PostProperty" 
          component={PostPropertyScreen} 
          options={{ title: 'Post New Property'}} 
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}