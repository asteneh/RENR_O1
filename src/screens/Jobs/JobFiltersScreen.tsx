import React, { useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView,
    TouchableOpacity, ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { JobsStackParamList } from '../../navigation/JobsNavigator';
import { useCategoriesByService } from '../../api/services/categoryService';

const THEME_COLOR = '#FF8C00';
const JOB_TYPES = ['Full Time', 'Part Time', 'Contract'];

type JobFiltersRouteProp = RouteProp<JobsStackParamList, 'JobFilters'>;

export default function JobFiltersScreen() {
    const navigation = useNavigation<any>();
    const route = useRoute<JobFiltersRouteProp>();

    const [selectedJobTypes, setSelectedJobTypes] = useState<string[]>(
        route.params?.currentFilters?.jobType?.split(',').filter(Boolean) || []
    );
    const [selectedMachineTypes, setSelectedMachineTypes] = useState<string[]>(
        route.params?.currentFilters?.machineType?.split(',').filter(Boolean) || []
    );

    const { data: categories, isLoading } = useCategoriesByService(1); // 1 = Machinery

    const toggleJobType = (type: string) => {
        const next = selectedJobTypes.includes(type)
            ? selectedJobTypes.filter(t => t !== type)
            : [...selectedJobTypes, type];
        setSelectedJobTypes(next);
    };

    const toggleMachineType = (id: string) => {
        const next = selectedMachineTypes.includes(id)
            ? selectedMachineTypes.filter(t => t !== id)
            : [...selectedMachineTypes, id];
        setSelectedMachineTypes(next);
    };

    const applyFilters = () => {
        navigation.navigate('FindJobs', {
            filters: {
                jobType: selectedJobTypes.join(','),
                machineType: selectedMachineTypes.join(','),
            }
        });
    };

    const clearFilters = () => {
        setSelectedJobTypes([]);
        setSelectedMachineTypes([]);
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="close" size={28} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Advanced Filters</Text>
                <TouchableOpacity onPress={clearFilters}>
                    <Text style={styles.clearText}>Clear All</Text>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Job Type</Text>
                    <View style={styles.condensedList}>
                        {JOB_TYPES.map(type => (
                            <TouchableOpacity
                                key={type}
                                style={styles.listItem}
                                onPress={() => toggleJobType(type)}
                            >
                                <Text style={[
                                    styles.listItemText,
                                    selectedJobTypes.includes(type) && styles.activeItemText
                                ]}>
                                    {type}
                                </Text>
                                {selectedJobTypes.includes(type) && (
                                    <Ionicons name="checkmark" size={20} color={THEME_COLOR} />
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Machinery Category</Text>
                    {isLoading ? (
                        <ActivityIndicator color={THEME_COLOR} style={{ marginTop: 10 }} />
                    ) : (
                        <View style={styles.condensedList}>
                            {categories?.map((cat: any) => (
                                <TouchableOpacity
                                    key={cat._id}
                                    style={styles.listItem}
                                    onPress={() => toggleMachineType(cat._id)}
                                >
                                    <Text style={[
                                        styles.listItemText,
                                        selectedMachineTypes.includes(cat._id) && styles.activeItemText
                                    ]}>
                                        {cat.name}
                                    </Text>
                                    {selectedMachineTypes.includes(cat._id) && (
                                        <Ionicons name="checkmark" size={20} color={THEME_COLOR} />
                                    )}
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}
                </View>
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity style={styles.applyBtn} onPress={applyFilters}>
                    <Text style={styles.applyBtnText}>Apply Filters</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    backBtn: { padding: 4 },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
    clearText: { color: THEME_COLOR, fontWeight: '600' },
    scrollContent: { padding: 20 },
    section: { marginBottom: 30 },
    sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#888', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 15 },
    condensedList: {
        borderWidth: 1,
        borderColor: '#F0F0F0',
        borderRadius: 12,
        overflow: 'hidden',
    },
    listItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
        backgroundColor: '#fff',
    },
    listItemText: { fontSize: 16, color: '#444' },
    activeItemText: { color: THEME_COLOR, fontWeight: 'bold' },
    footer: {
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
    },
    applyBtn: {
        backgroundColor: THEME_COLOR,
        paddingVertical: 16,
        borderRadius: 14,
        alignItems: 'center',
        elevation: 2,
    },
    applyBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
