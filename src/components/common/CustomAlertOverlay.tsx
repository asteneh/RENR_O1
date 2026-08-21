import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, TouchableOpacity, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNotificationStore } from '../../store/useNotificationStore';

const CustomAlertOverlay = () => {
    const insets = useSafeAreaInsets();
    const { alert, hideAlert, setAlertValue } = useNotificationStore();
    const slideAnim = React.useRef(new Animated.Value(-400)).current;
    const opacityAnim = React.useRef(new Animated.Value(0)).current;
    const [render, setRender] = React.useState(false);

    useEffect(() => {
        if (alert.visible) {
            setRender(true);
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
        } else {
            Animated.parallel([
                Animated.timing(slideAnim, {
                    toValue: -400,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.timing(opacityAnim, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                }),
            ]).start(() => setRender(false));
        }
    }, [alert.visible, insets.top]);

    if (!render) return null;

    const handleButtonPress = (onPress?: (val?: string) => void) => {
        if (onPress) onPress(alert.inputValue);
        hideAlert();
    };

    return (
        <Animated.View
            style={[
                styles.wrapper,
                {
                    opacity: opacityAnim,
                    pointerEvents: alert.visible ? 'auto' : 'none',
                },
            ]}
        >
            {/* Background Overlay to catch touches outside */}
            <TouchableOpacity
                activeOpacity={1}
                style={styles.overlay}
                onPress={hideAlert}
            />

            <Animated.View
                style={[
                    styles.container,
                    {
                        transform: [{ translateY: slideAnim }],
                    },
                ]}
            >
                <View style={styles.card}>
                    <View style={styles.header}>
                        <View style={styles.iconCircle}>
                            <Ionicons name="alert-circle" size={24} color="#FF8C00" />
                        </View>
                        <Text style={styles.title}>{alert.title}</Text>
                    </View>

                    <Text style={styles.message}>{alert.message}</Text>

                    {alert.withInput && (
                        <TextInput
                            style={styles.input}
                            placeholder={alert.placeholder}
                            placeholderTextColor="#94A3B8"
                            value={alert.inputValue}
                            onChangeText={setAlertValue}
                            autoFocus
                            keyboardType="numeric"
                        />
                    )}

                    <View style={[styles.buttonRow, alert.buttons.length > 2 && { flexDirection: 'column', alignItems: 'stretch' }]}>
                        {alert.buttons.map((btn, index) => {
                            const isCancel = btn.style === 'cancel';
                            const isDestructive = btn.style === 'destructive';
                            const isStacked = alert.buttons.length > 2;

                            return (
                                <TouchableOpacity
                                    key={index}
                                    style={[
                                        styles.button,
                                        !isStacked && index > 0 && { marginLeft: 12 },
                                        isStacked && { width: '100%' },
                                        isStacked && index > 0 && { marginTop: 10 },
                                        isCancel ? styles.cancelButton : styles.actionButton,
                                        isDestructive && { backgroundColor: '#FEE2E2' }
                                    ]}
                                    onPress={() => handleButtonPress(btn.onPress)}
                                >
                                    <Text style={[
                                        styles.buttonText,
                                        isCancel ? styles.cancelButtonText : styles.actionButtonText,
                                        isDestructive && { color: '#EF4444' }
                                    ]}>
                                        {btn.text}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>
            </Animated.View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    wrapper: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 11000,
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
    container: {
        position: 'absolute',
        left: 16,
        right: 16,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 20,
        elevation: 20,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    iconCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#FFF7ED',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    title: {
        fontSize: 18,
        fontWeight: '800',
        color: '#1E293B',
        flex: 1,
    },
    message: {
        fontSize: 15,
        color: '#64748B',
        lineHeight: 22,
        marginBottom: 20,
    },
    input: {
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        color: '#1E293B',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        marginBottom: 24,
        fontWeight: '600',
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
    button: {
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 14,
        minWidth: 100,
        alignItems: 'center',
    },
    actionButton: {
        backgroundColor: '#FF8C00',
        shadowColor: '#FF8C00',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    actionButtonText: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 15,
    },
    cancelButton: {
        backgroundColor: '#F1F5F9',
    },
    cancelButtonText: {
        color: '#64748B',
        fontWeight: '600',
        fontSize: 15,
    },
    buttonText: {
        fontSize: 15,
    }
});

export default CustomAlertOverlay;
