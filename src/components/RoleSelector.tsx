import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';

interface RoleSelectorProps {
    roles: string[];
    selectedRole: string;
    onSelect: (role: string) => void;
}

const THEME_COLOR = '#FF8C00';

const RoleSelector: React.FC<RoleSelectorProps> = ({ roles, selectedRole, onSelect }) => {
    return (
        <View style={styles.container}>
            {roles.map((role) => {
                const isSelected = selectedRole === role;
                return (
                    <TouchableOpacity
                        key={role}
                        style={[
                            styles.roleButton,
                            isSelected && styles.activeRoleButton
                        ]}
                        onPress={() => onSelect(role)}
                        activeOpacity={0.7}
                    >
                        <Text style={[
                            styles.roleText,
                            isSelected && styles.activeRoleText
                        ]}>
                            {role}
                        </Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        backgroundColor: '#F0F0F0',
        borderRadius: 25,
        padding: 4,
        marginHorizontal: 20,
        marginBottom: 15,
        height: 44,
    },
    roleButton: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 20,
    },
    activeRoleButton: {
        backgroundColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 1,
        elevation: 2,
    },
    roleText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#666',
    },
    activeRoleText: {
        color: THEME_COLOR,
        fontWeight: '700',
    },
});

export default RoleSelector;
