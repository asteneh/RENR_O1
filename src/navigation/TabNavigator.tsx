import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TabParamList } from './types';
import { useAuthStore } from '../store/useAuthStore';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';

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
                } else if (route.name === 'Category') {
                    iconName = focused ? 'grid' : 'grid-outline';
                } else if (route.name === 'Post') {
                    iconName = focused ? 'add-circle' : 'add-circle-outline';
                }

                return <Ionicons name={iconName} size={size} color={color} />;
            },
        })}>
            <Tab.Screen name="Home" component={HomeScreen} />

            {/* Post Button (Middle) */}
            <Tab.Screen
                name="Post"
                component={Placeholder}
                listeners={({ navigation }) => ({
                    tabPress: (e) => {
                        e.preventDefault();
                        (navigation as any).navigate('PostProperty');
                    },
                })}
                options={{
                    title: 'Post',
                    tabBarLabelStyle: { fontSize: 10, marginBottom: 5 }
                }}
            />

            <Tab.Screen
                name="Category"
                component={CategoryScreen}
                options={{ title: 'Categories' }}
            />
        </Tab.Navigator>
    );
}
