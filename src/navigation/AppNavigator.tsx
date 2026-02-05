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
import JobsNavigator from './JobsNavigator';
import ForgotPasswordScreen from '../screens/Auth/ForgotPasswordScreen';
import VerifyPhoneScreen from '../screens/Auth/VerifyPhoneScreen';
import ResetPasswordScreen from '../screens/Auth/ResetPasswordScreen';
import FavoritesScreen from '../screens/Profile/FavoritesScreen';
import NotificationScreen from '../screens/Notification/NotificationScreen';
import MessagesScreen from '../screens/Messages/MessagesScreen';
import ChatScreen from '../screens/Messages/ChatScreen';
import SearchScreen from '../screens/Search/SearchScreen';
import FilterScreen from '../screens/Search/FilterScreen';
import SearchResultsScreen from '../screens/Search/SearchResultsScreen';
import PostRequestScreen from '../screens/Supplier/PostRequestScreen';
import SupplierHomeScreen from '../screens/Supplier/SupplierHomeScreen';
import EditProfileScreen from '../screens/Profile/EditProfileScreen';
import MyListingsScreen from '../screens/Profile/MyListingsScreen';
import FollowingsScreen from '../screens/Profile/FollowingsScreen';
import MyRequestsScreen from '../screens/Profile/MyRequestsScreen';
import MyJobsScreen from '../screens/Profile/MyJobsScreen';
import MyPackagesScreen from '../screens/Profile/MyPackagesScreen';
import OperatorRegistrationScreen from '../screens/Jobs/OperatorRegistrationScreen';

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
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} options={{ title: 'Recovery' }} />
        <Stack.Screen name="VerifyPhone" component={VerifyPhoneScreen} options={{ title: 'Verify' }} />
        <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} options={{ title: 'Reset Password' }} />
        <Stack.Screen name="Favorites" component={FavoritesScreen} options={{ title: 'My Favorites' }} />
        <Stack.Screen name="Notification" component={NotificationScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Messages" component={MessagesScreen} options={{ title: 'Messages' }} />
        <Stack.Screen name="Chat" component={ChatScreen} options={{ title: 'Chat' }} />
        <Stack.Screen name="Search" component={SearchScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Filter" component={FilterScreen} options={{ headerShown: true, title: 'Filters' }} />
        <Stack.Screen name="SearchResults" component={SearchResultsScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Profile" component={ProfileScreen} options={{ headerShown: true, title: 'My Profile' }} />
        {/* Property Screens */}
        <Stack.Screen
          name="PostProperty"
          component={PostPropertyScreen}
          options={{ title: 'Post New Listing' }}
        />
        <Stack.Screen
          name="Jobs"
          component={JobsNavigator}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="PostRequest"
          component={PostRequestScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="SupplierHome"
          component={SupplierHomeScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="EditProfile"
          component={EditProfileScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="MyListings"
          component={MyListingsScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Followings"
          component={FollowingsScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="MyRequests"
          component={MyRequestsScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="MyJobs"
          component={MyJobsScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="MyPackages"
          component={MyPackagesScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="OperatorRegistration"
          component={OperatorRegistrationScreen}
          options={{ title: 'Operator Registration' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}