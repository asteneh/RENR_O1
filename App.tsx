import 'react-native-gesture-handler';
import React, { useEffect, useState, useRef } from 'react';
import { View, Image, StyleSheet, Animated, Dimensions, ActivityIndicator } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { StatusBar } from 'expo-status-bar';

// React Query
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Import your Navigation
import AppNavigator from './src/navigation/AppNavigator';
import ToastOverlay from './src/components/common/ToastOverlay';
import CustomAlertOverlay from './src/components/common/CustomAlertOverlay';

// Sockets & Notifications
import { socket } from './src/api/socket';
import { useAuthStore } from './src/store/useAuthStore';
import { useNotificationStore } from './src/store/useNotificationStore';
import { notificationService } from './src/api/services/notificationService';

// 1. Keep Native Screen visible until we are ready
SplashScreen.preventAutoHideAsync();

const { width } = Dimensions.get('window');
const THEME_COLOR = '#FF8C00'; // Orange

// Create a client
const queryClient = new QueryClient();

export default function App() {
  const [isSplashDone, setIsSplashDone] = useState(false);
  const splashFadeAnim = useRef(new Animated.Value(1)).current; // For fading out the splash overlay

  // Animation Values for Splash Content
  const fadeAnim = useRef(new Animated.Value(0)).current;  // Opacity of logo
  const scaleAnim = useRef(new Animated.Value(0.5)).current; // Zoom of logo

  const { token, user } = useAuthStore();
  const { setUnreadNotifications, incrementUnreadNotifications, showNotification } = useNotificationStore();

  useEffect(() => {
    if (token && user?._id) {
      socket.auth = { userId: user._id };
      socket.connect();

      socket.on('notification', (notification: any) => {
        console.log('Notification received:', notification);
        console.log(`User ID in store: ${user._id}, Notification target user: ${notification?.user}`);

        if (notification?.user === user._id || notification?.isCampaign) {
          console.log('Notification match found, showing alert...');
          incrementUnreadNotifications();
          showNotification(
            notification.notification || notification.message || 'New notification',
            'info',
            notification.title || 'Notification'
          );
        } else {
          console.log('Notification ignored: target user mismatch');
        }
      });

      socket.on('connect_error', (error) => {
        console.error('Socket Connection Error:', error);
      });

      socket.on('error', (error) => {
        console.error('Socket Error:', error);
      });

      // Initial unread count fetch
      notificationService.getUnreadNotificationsCount(user._id).then((data: any) => {
        if (data && typeof data.unreadCount === 'number') {
          setUnreadNotifications(data.unreadCount);
        }
      }).catch(console.error);

      return () => {
        console.log('Cleaning up socket listeners and disconnecting...');
        socket.off('notification');
        socket.off('connect_error');
        socket.off('error');
        socket.disconnect();
      };
    }
  }, [token, user?._id]);

  useEffect(() => {
    async function prepare() {
      try {
        // 1. Hide the Native Static Splash immediately
        await SplashScreen.hideAsync();

        // 2. Start Splash Content Animations
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.spring(scaleAnim, {
            toValue: 1,
            friction: 6,
            useNativeDriver: true,
          }),
        ]).start();

        // 3. WAIT 5 SECONDS (Background loading happens during this time)
        await new Promise(resolve => setTimeout(resolve, 5000));

        // 4. Fade out the Splash Overlay
        Animated.timing(splashFadeAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }).start(() => {
          setIsSplashDone(true);
        });

      } catch (e) {
        console.warn(e);
        setIsSplashDone(true);
      }
    }

    prepare();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
          <View style={{ flex: 1 }}>
            <StatusBar style="dark" />
            <AppNavigator />
            <ToastOverlay />
            <CustomAlertOverlay />

            {!isSplashDone && (
              <Animated.View
                pointerEvents="none"
                style={[styles.splashOverlay, { opacity: splashFadeAnim }]}
              >
                {/* Custom Splash Content */}
                <Animated.View style={{ opacity: fadeAnim, transform: [{ scale: scaleAnim }] }}>
                  <Image
                    source={require('./assets/orange-logo.png')}
                    style={styles.logo}
                  />
                </Animated.View>

                <View style={styles.loaderContainer}>
                  <ActivityIndicator size="large" color={THEME_COLOR} />
                </View>
              </Animated.View>
            )}
          </View>
        </SafeAreaProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );

}

const styles = StyleSheet.create({
  splashOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  logo: {
    width: width * 0.5, // Adjust size to match app.json visual roughly
    height: width * 0.5,
    resizeMode: 'contain',
    marginBottom: 60,
  },
  loaderContainer: {
    position: 'absolute',
    bottom: 120,
  }
});