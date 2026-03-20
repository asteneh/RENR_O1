import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNotificationStore } from '../../store/useNotificationStore';

const { width } = Dimensions.get('window');

const ToastOverlay = () => {
    const insets = useSafeAreaInsets();
    const { message, type, visible, hideNotification, title } = useNotificationStore();
    const slideAnim = React.useRef(new Animated.Value(-150)).current;
    const opacityAnim = React.useRef(new Animated.Value(0)).current;
    const progressAnim = React.useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            // Step 1: Show Toast
            Animated.parallel([
                Animated.spring(slideAnim, {
                    toValue: insets.top + 10,
                    useNativeDriver: true,
                    friction: 8,
                    tension: 40,
                }),
                Animated.timing(opacityAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
            ]).start();

            // Step 2: Progress Bar Animation (4s)
            progressAnim.setValue(1);
            Animated.timing(progressAnim, {
                toValue: 0,
                duration: 4000,
                useNativeDriver: false, // Width animation needs false
            }).start();
        } else {
            // Hide Toast
            Animated.parallel([
                Animated.timing(slideAnim, {
                    toValue: -150,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.timing(opacityAnim, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [visible, insets.top]);

    if (!message) return null;

    const getTheme = () => {
        switch (type) {
            case 'success':
                return {
                    icon: 'checkmark-circle' as any,
                    color: '#10B981', // Emerald 500
                    bgColor: '#F0FDF4', // Emerald 50
                };
            case 'error':
                return {
                    icon: 'close-circle' as any,
                    color: '#EF4444', // Red 500
                    bgColor: '#FEF2F2', // Red 50
                };
            default:
                return {
                    icon: 'information-circle' as any,
                    color: '#3B82F6', // Blue 500
                    bgColor: '#EFF6FF', // Blue 50
                };
        }
    };

    const theme = getTheme();

    return (
        <Animated.View
            style={[
                styles.container,
                {
                    transform: [{ translateY: slideAnim }],
                    opacity: opacityAnim,
                },
            ]}
        >
            <View style={styles.card}>
                <View style={styles.content}>
                    <View style={[styles.iconWrapper, { backgroundColor: theme.bgColor }]}>
                        <Ionicons name={theme.icon} size={22} color={theme.color} />
                    </View>

                    <View style={styles.textContainer}>
                        <Text style={styles.title}>{title || type.toUpperCase()}</Text>
                        <Text style={styles.message} numberOfLines={2}>{message}</Text>
                    </View>

                    <TouchableOpacity onPress={hideNotification} style={styles.closeBtn}>
                        <Ionicons name="close" size={20} color="#94A3B8" />
                    </TouchableOpacity>
                </View>

                {/* Progress Bar */}
                <View style={styles.progressBarBg}>
                    <Animated.View
                        style={[
                            styles.progressBar,
                            {
                                backgroundColor: theme.color,
                                width: progressAnim.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: ['0%', '100%']
                                })
                            }
                        ]}
                    />
                </View>
            </View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        left: 16,
        right: 16,
        zIndex: 10000,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        overflow: 'hidden',
        // Premium Shadow
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 15,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
    },
    iconWrapper: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    textContainer: {
        flex: 1,
    },
    title: {
        fontSize: 10,
        fontWeight: '800',
        color: '#94A3B8',
        letterSpacing: 1,
        marginBottom: 2,
    },
    message: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1E293B',
        lineHeight: 18,
    },
    closeBtn: {
        padding: 4,
    },
    progressBarBg: {
        height: 3,
        backgroundColor: '#F1F5F9',
        width: '100%',
    },
    progressBar: {
        height: '100%',
    },
});

export default ToastOverlay;
