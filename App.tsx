import React, { useEffect, useState, useRef } from 'react';
import { View, Image, StyleSheet, Animated, Dimensions, ActivityIndicator } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

// Import your Navigation
import AppNavigator from './src/navigation/AppNavigator';

// 1. Keep Native Screen visible until we are ready
SplashScreen.preventAutoHideAsync();

const { width } = Dimensions.get('window');
const THEME_COLOR = '#FF8C00'; // Orange

export default function App() {
  const [isAppReady, setIsAppReady] = useState(false);
  
  // Animation Values
  const fadeAnim = useRef(new Animated.Value(0)).current;  // Opacity
  const scaleAnim = useRef(new Animated.Value(0.5)).current; // Zoom

  useEffect(() => {
    async function prepare() {
      try {
        // 2. Hide the Native Static Splash immediately so our Custom one takes over
        await SplashScreen.hideAsync();

        // 3. Start Animations (Fade In + Zoom)
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 1000, // 1 second fade in
            useNativeDriver: true,
          }),
          Animated.spring(scaleAnim, {
            toValue: 1,
            friction: 6,
            useNativeDriver: true,
          }),
        ]).start();

        // 4. WAIT 5 SECONDS (The delay you asked for)
        await new Promise(resolve => setTimeout(resolve, 5000));

      } catch (e) {
        console.warn(e);
      } finally {
        // 5. Show the Real App
        setIsAppReady(true);
      }
    }

    prepare();
  }, []);

  // --- RENDER: CUSTOM SPLASH SCREEN ---
  if (!isAppReady) {
    return (
      <View style={styles.splashContainer}>
        <StatusBar style="dark" />
        
        {/* Animated Logo */}
        <Animated.View style={{ opacity: fadeAnim, transform: [{ scale: scaleAnim }] }}>
          <Image 
            // MAKE SURE THIS FILE EXISTS
            source={require('./assets/orange-logo.png')} 
            style={styles.logo}
          />
        </Animated.View>

        {/* Animated Loader */}
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={THEME_COLOR} />
        </View>
      </View>
    );
  }

  // --- RENDER: REAL APP ---
  return (
    <SafeAreaProvider>
      <AppNavigator />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    backgroundColor: '#ffffff', // Must match app.json background
    alignItems: 'center',
    justifyContent: 'center',
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