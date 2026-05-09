import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Platform, TouchableWithoutFeedback } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../store/useAuthStore';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { UserRole, UserRoles, RoleLabels, RoleIcons, SELECTABLE_ROLES } from '../constants/UserRoles';

const THEME_COLOR = '#FF8C00';

interface RoleHeaderProps {
    scrollY?: any;
}

export default function RoleHeader({ scrollY }: RoleHeaderProps) {
    const navigation = useNavigation<any>();
    const insets = useSafeAreaInsets();
    const { isAuthenticated, currentRoles, addRole, removeRole } = useAuthStore();
    const [isDropdownOpen, setDropdownOpen] = useState(false);

    const toggleRole = (role: UserRole) => {
        if (currentRoles.includes(role)) {
            // Don't remove last role
            if (currentRoles.length > 1) {
                removeRole(role);
            }
        } else {
            addRole(role);
        }
    };

    const getRoleIcon = (role: UserRole): keyof typeof Ionicons.glyphMap => {
        return (RoleIcons[role] || 'person-outline') as keyof typeof Ionicons.glyphMap;
    };

    // Display text for the pill
    const pillText = currentRoles.length === 1
        ? RoleLabels[currentRoles[0]]
        : `${currentRoles.length} Roles`;

    return (
        <View style={[styles.container, { paddingTop: insets.top + 10 }]}>
            <View style={styles.contentRow}>
                <View style={styles.leftSection}>
                    <Text style={styles.greeting}>Welcome back,</Text>
                    <Text style={styles.appName}>RENR</Text>
                </View>

                {/* Role Pill */}
                <TouchableOpacity
                    activeOpacity={0.8}
                    style={[styles.rolePill, isDropdownOpen && styles.rolePillActive]}
                    onPress={() => setDropdownOpen(true)}
                >
                    {currentRoles.length === 1 && (
                        <View style={[styles.iconCircle, { backgroundColor: isDropdownOpen ? '#FFF' : '#FFF2E0' }]}>
                            <Ionicons name={getRoleIcon(currentRoles[0])} size={16} color={THEME_COLOR} />
                        </View>
                    )}
                    <Text style={styles.roleText}>{pillText}</Text>
                    <Ionicons
                        name="chevron-down" size={14} color="#555"
                        style={{ marginLeft: 4, transform: [{ rotate: isDropdownOpen ? '180deg' : '0deg' }] }}
                    />
                </TouchableOpacity>

                {/* Right Actions */}
                <View style={styles.rightSection}>
                    <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate('Search')}>
                        <Ionicons name="search" size={22} color="#333" />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.profileBtn}
                        onPress={() => isAuthenticated ? navigation.navigate('Profile') : navigation.navigate('Login')}
                    >
                        <Ionicons name={isAuthenticated ? "person" : "log-in-outline"} size={22} color="#333" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Multi-Role Selection Modal */}
            <Modal
                visible={isDropdownOpen}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setDropdownOpen(false)}
            >
                <TouchableWithoutFeedback onPress={() => setDropdownOpen(false)}>
                    <View style={styles.modalOverlay}>
                        <TouchableWithoutFeedback>
                            <View style={[styles.dropdownMenu, { top: insets.top + 60 }]}>
                                <Text style={styles.dropdownTitle}>Your Roles</Text>
                                {SELECTABLE_ROLES.map((role: UserRole) => {
                                    const isActive = currentRoles.includes(role);
                                    return (
                                        <TouchableOpacity
                                            key={role}
                                            style={[styles.dropdownItem, isActive && styles.dropdownItemActive]}
                                            onPress={() => toggleRole(role)}
                                        >
                                            <View style={[styles.dropdownIcon, isActive && styles.dropdownIconActive]}>
                                                <Ionicons
                                                    name={getRoleIcon(role)}
                                                    size={18}
                                                    color={isActive ? '#FFF' : '#666'}
                                                />
                                            </View>
                                            <Text style={[styles.dropdownText, isActive && styles.dropdownTextActive]}>
                                                {RoleLabels[role]}
                                            </Text>
                                            {isActive && (
                                                <Ionicons name="checkmark-circle" size={18} color={THEME_COLOR} style={{ marginLeft: 'auto' }} />
                                            )}
                                        </TouchableOpacity>
                                    );
                                })}
                                <TouchableOpacity
                                    style={styles.doneBtn}
                                    onPress={() => setDropdownOpen(false)}
                                >
                                    <Text style={styles.doneBtnText}>Done</Text>
                                </TouchableOpacity>
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#FCFCFC', paddingHorizontal: 20, paddingBottom: 15,
        borderBottomWidth: 1, borderBottomColor: '#F0F0F0', zIndex: 100,
    },
    contentRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    leftSection: { flex: 1 },
    greeting: { fontSize: 12, color: '#888', fontFamily: Platform.select({ ios: 'System', android: 'Roboto' }) },
    appName: { fontSize: 20, fontWeight: '900', color: '#111', letterSpacing: -0.5 },

    rolePill: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF',
        paddingVertical: 6, paddingHorizontal: 10, borderRadius: 24,
        borderWidth: 1, borderColor: '#EAEAEA',
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8,
        elevation: 2, marginHorizontal: 10,
    },
    rolePillActive: { borderColor: THEME_COLOR, backgroundColor: '#FFF9F0' },
    iconCircle: { width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 8 },
    roleText: { fontSize: 14, fontWeight: '700', color: '#333' },

    rightSection: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    iconBtn: { padding: 8 },
    profileBtn: {
        width: 38, height: 38, borderRadius: 19, backgroundColor: '#F5F5F5',
        justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#EEE',
    },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.2)' },
    dropdownMenu: {
        position: 'absolute', alignSelf: 'center', width: 240,
        backgroundColor: '#FFF', borderRadius: 16, padding: 8,
        shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.15, shadowRadius: 20, elevation: 10,
    },
    dropdownTitle: { fontSize: 12, fontWeight: '600', color: '#999', marginLeft: 12, marginBottom: 8, marginTop: 4, textTransform: 'uppercase' },
    dropdownItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10, marginBottom: 2 },
    dropdownItemActive: { backgroundColor: '#FFF9F0' },
    dropdownIcon: { width: 32, height: 32, borderRadius: 10, backgroundColor: '#F5F5F5', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
    dropdownIconActive: { backgroundColor: THEME_COLOR },
    dropdownText: { fontSize: 15, fontWeight: '500', color: '#444' },
    dropdownTextActive: { color: '#111', fontWeight: '700' },
    doneBtn: {
        backgroundColor: THEME_COLOR, marginHorizontal: 8, marginTop: 8, marginBottom: 4,
        paddingVertical: 10, borderRadius: 10, alignItems: 'center',
    },
    doneBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
});
