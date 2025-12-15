import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as NavigationBar from 'expo-navigation-bar';

// Navigators
import TabNavigator from './TabNavigator';

// Screens
import ProductDetailsScreen from '../screens/ProductDetails/ProductDetailsScreen';
import ProfileScreen from '../screens/Profile/ProfileScreen';
import LoginScreen from '../screens/Auth/LoginScreen';
import SignUpScreen from '../screens/Auth/SignUpScreen';
import PostPropertyScreen from '../screens/Property/PostPropertyScreen';
import SearchScreen from '../screens/Search/SearchScreen';
import FilterScreen from '../screens/Search/FilterScreen';
import SearchResultsScreen from '../screens/Search/SearchResultsScreen';

import { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

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
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        <Stack.Screen name="SignUp" component={SignUpScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Search" component={SearchScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Filter" component={FilterScreen} options={{ headerShown: true, title: 'Filters' }} />
        <Stack.Screen name="SearchResults" component={SearchResultsScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Profile" component={ProfileScreen} options={{ headerShown: true, title: 'My Profile' }} />
        {/* Property Screens */}
        <Stack.Screen
          name="PostProperty"
          component={PostPropertyScreen}
          options={{ title: 'Post New Property' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}