import React from 'react';
import { View, Text, FlatList, StyleSheet, Image, TouchableOpacity, ActivityIndicator, Linking } from 'react-native';
import { useOperators, Operator } from '../../api/services/operatorService';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/useAuthStore';
import { UserRoles } from '../../constants/UserRoles';

const THEME_COLOR = '#FF8C00';

export default function OperatorListScreen({ navigation }: any) {
    const { data: operators, isLoading, error } = useOperators();
    const { user, getUserRoles } = useAuthStore();
    const roles = getUserRoles();
    const isOperator =
        roles.includes(UserRoles.OPERATOR) ||
        user?.userType === 'Operator' ||
        user?.userType === 'employee (Operator)' ||
        user?.roles?.includes('Operator') ||
        (Array.isArray(user?.userType) && user.userType.includes('Operator'));

    // Filter out operators who turned OFF their availability (on job / not ready)
    const visibleOperators = React.useMemo(() => {
        if (!operators) return [];
        return operators.filter((item: Operator) =>
            item.isAvailable !== false &&
            item.operatorStatus !== 'off' &&
            item.operatorStatus !== 'on_job'
        );
    }, [operators]);

    const handleContact = (item: Operator) => {
        if (item.phoneNumber) {
            Linking.openURL(`tel:${item.phoneNumber}`);
        } else {
            navigation.navigate('UserProfile', { userId: item._id, user: item });
        }
    };

    const renderItem = ({ item }: { item: Operator }) => (
        <TouchableOpacity
            style={styles.card}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('UserProfile', { userId: item._id, user: item })}
        >
            <View style={styles.header}>
                <Image
                    source={{ uri: item.proflePic || 'https://via.placeholder.com/50' }}
                    style={styles.avatar}
                />
                <View style={styles.headerText}>
                    <Text style={styles.name}>{item.firstName} {item.lastName}</Text>
                    <Text style={styles.experience}>{item.experience || 'Experienced'} • {item.machinesYouCanOperate?.length || 0} Machines</Text>
                </View>
                {item.isVerified && <Ionicons name="checkmark-circle" size={20} color={THEME_COLOR} />}
            </View>

            <View style={styles.machineList}>
                {item.machinesYouCanOperate?.slice(0, 3).map((machine, index) => (
                    <View key={index} style={styles.chip}>
                        <Text style={styles.chipText}>{machine}</Text>
                    </View>
                ))}
                {(item.machinesYouCanOperate?.length || 0) > 3 && (
                    <Text style={styles.moreText}>+{item.machinesYouCanOperate.length - 3} more</Text>
                )}
            </View>

            <View style={styles.actions}>
                <TouchableOpacity
                    style={styles.contactBtn}
                    onPress={() => handleContact(item)}
                >
                    <Ionicons name="call-outline" size={16} color={THEME_COLOR} style={{ marginRight: 6 }} />
                    <Text style={styles.contactBtnText}>Contact Operator</Text>
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );

    if (isLoading) return <ActivityIndicator size="large" color={THEME_COLOR} style={{ flex: 1 }} />;
    if (error) return <View style={styles.center}><Text>Error loading operators</Text></View>;

    return (
        <View style={styles.container}>
            <View style={styles.topBar}>
                <Text style={styles.title}>Machinery Operators</Text>
                {isOperator && (
                    <TouchableOpacity
                        style={styles.joinBtn}
                        onPress={() => navigation.navigate('EditOperatorProfile', { operatorId: user?._id || user?.id })}
                    >
                        <Text style={styles.joinBtnText}>Update Profile</Text>
                    </TouchableOpacity>
                )}
            </View>

            <FlatList
                data={visibleOperators}
                keyExtractor={(item) => item._id}
                renderItem={renderItem}
                contentContainerStyle={styles.list}
                ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 20 }}>No available operators found.</Text>}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    topBar: { padding: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff' },
    title: { fontSize: 18, fontWeight: 'bold' },
    joinBtn: { backgroundColor: 'black', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20 },
    joinBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },

    list: { padding: 15 },
    card: { backgroundColor: '#fff', borderRadius: 12, padding: 15, marginBottom: 15, elevation: 2 },
    header: { flexDirection: 'row', alignItems: 'center' },
    avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#eee' },
    headerText: { flex: 1, marginLeft: 15 },
    name: { fontSize: 16, fontWeight: 'bold' },
    experience: { color: '#666', fontSize: 12, marginTop: 2 },

    machineList: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 15 },
    chip: { backgroundColor: '#FFF5E5', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, marginRight: 8, marginBottom: 8 },
    chipText: { color: THEME_COLOR, fontSize: 12 },
    moreText: { color: '#999', fontSize: 12, alignSelf: 'center' },

    actions: { marginTop: 10, borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 10 },
    contactBtn: { alignItems: 'center' },
    contactBtnText: { color: THEME_COLOR, fontWeight: 'bold' },
});
