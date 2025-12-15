import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, ViewStyle, DimensionValue, Easing } from 'react-native';

interface SkeletonProps {
    width: DimensionValue;
    height: DimensionValue;
    borderRadius?: number;
    style?: ViewStyle;
}

const SkeletonLoader: React.FC<SkeletonProps> = ({ width, height, borderRadius = 4, style }) => {
    const opacity = useRef(new Animated.Value(0.4)).current; // Start slightly higher

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(opacity, {
                    toValue: 0.8,
                    duration: 1000, // Slower
                    easing: Easing.inOut(Easing.ease), // Smooth breathing
                    useNativeDriver: true,
                }),
                Animated.timing(opacity, {
                    toValue: 0.4,
                    duration: 1000,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, [opacity]);

    return (
        <Animated.View
            style={[
                styles.skeleton,
                { width, height, borderRadius, opacity },
                style,
            ]}
        />
    );
};

const styles = StyleSheet.create({
    skeleton: {
        backgroundColor: '#E1E9EE',
        overflow: 'hidden',
    },
});

export default SkeletonLoader;
