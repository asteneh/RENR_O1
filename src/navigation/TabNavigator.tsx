import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TabParamList } from './types';
import { useAuthStore } from '../store/useAuthStore';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
  FeatureActions,
  canAccessMultiRole,
  UserRoles,
} from '../constants/UserRoles';
import { useTranslation } from '../i18n';

// Screens
import HomeScreen from '../screens/Home/HomeScreen';
import CategoryScreen from '../screens/Category/CategoryScreen';

const Tab = createBottomTabNavigator<TabParamList>();
const THEME_COLOR = '#FF8C00';

function Placeholder() {
    return <View style={{ flex: 1, backgroundColor: 'white' }} />;
}

export default function TabNavigator() {
    const insets = useSafeAreaInsets();
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    const getUserRoles = useAuthStore((state) => state.getUserRoles);

    const currentRoles = getUserRoles();
    const { t } = useTranslation();

    // Determine which tabs to show based on merged role capabilities
    const canPostItems = canAccessMultiRole(currentRoles, FeatureActions.POST_SALE) || canAccessMultiRole(currentRoles, FeatureActions.POST_RENT);
    const canPostJob = canAccessMultiRole(currentRoles, FeatureActions.POST_JOB);
    const canViewRequests = canAccessMultiRole(currentRoles, FeatureActions.REQUEST_BUY) || canAccessMultiRole(currentRoles, FeatureActions.REQUEST_RENT);

    // Operators and basic users can still view requests (browse is free)
    const showRequestsTab = true; // Browsing requests is free for all
    const showPostTab = isAuthenticated ? (canPostItems || canPostJob) : true;

    return (
        <Tab.Navigator screenOptions={({ route }) => ({
            headerShown: false,
            tabBarActiveTintColor: THEME_COLOR,
            tabBarInactiveTintColor: 'gray',
            tabBarStyle: {
                height: 65 + insets.bottom,
                paddingBottom: insets.bottom > 0 ? insets.bottom : 12,
                paddingTop: 10,
                backgroundColor: '#fff',
                borderTopWidth: 1,
                borderTopColor: '#f0f0f0',
                elevation: 8,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: -2 },
                shadowOpacity: 0.05,
                shadowRadius: 3,
            },
            tabBarIcon: ({ color, size, focused }) => {
                let iconName: keyof typeof Ionicons.glyphMap = 'home';

                if (route.name === 'Home') {
                    iconName = focused ? 'home' : 'home-outline';
                } else if (route.name === 'Requests') {
                    iconName = focused ? 'list-sharp' : 'list-outline';
                } else if (route.name === 'Post') {
                    iconName = focused ? 'create' : 'create-outline';
                } else if (route.name === 'Account') {
                    iconName = focused ? 'person' : 'person-outline';
                }

                return <Ionicons name={iconName} size={size} color={color} />;
            },
        })}>
            <Tab.Screen name="Home" component={HomeScreen} options={{ title: t('home') }} />

            <Tab.Screen
                name="JobsTab"
                component={Placeholder}
                listeners={({ navigation }) => ({
                    tabPress: (e) => {
                        e.preventDefault();
                        if (isAuthenticated) {
                            (navigation as any).navigate('Jobs');
                        } else {
                            (navigation as any).navigate('Login');
                        }
                    },
                })}
                options={{
                    title: t('jobs'),
                    tabBarIcon: ({ color, size, focused }) => (
                        <Ionicons name={focused ? 'briefcase' : 'briefcase-outline'} size={size} color={color} />
                    ),
                }}
            />

            {/* Post Button (Middle) - visible to roles that can post */}
            {showPostTab && (
            <Tab.Screen
                name="Post"
                component={Placeholder}
                listeners={({ navigation }) => ({
                    tabPress: (e) => {
                        e.preventDefault();
                        if (isAuthenticated) {
                            // Role guard will handle further checks inside the screen
                            (navigation as any).navigate('PostProperty');
                        } else {
                            (navigation as any).navigate('Login');
                        }
                    },
                })}
                options={{
                    title: t('post'),
                    tabBarLabelStyle: { fontSize: 10, marginBottom: 5 }
                }}
            />
            )}

            {showRequestsTab && (
            <Tab.Screen
                name="Requests"
                component={Placeholder}
                options={{ title: t('requests') }}
                listeners={({ navigation }) => ({
                    tabPress: (e) => {
                        e.preventDefault();
                        if (isAuthenticated) {
                            (navigation as any).navigate('SupplierHome');
                        } else {
                            (navigation as any).navigate('Login');
                        }
                    },
                })}
            />
            )}

            <Tab.Screen
                name="Account"
                component={Placeholder}
                options={{ title: t('account') }}
                listeners={({ navigation }) => ({
                    tabPress: (e) => {
                        e.preventDefault();
                        if (isAuthenticated) {
                            (navigation as any).navigate('Profile');
                        } else {
                            (navigation as any).navigate('Login');
                        }
                    },
                })}
            />
        </Tab.Navigator>
    );
}
