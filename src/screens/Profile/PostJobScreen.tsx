import React, { useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
    ActivityIndicator, Modal, FlatList, KeyboardAvoidingView, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useCreateJobMutation } from '../../api/services/jobService';
import { useCategoriesByService } from '../../api/services/categoryService';
import { useNotificationStore } from '../../store/useNotificationStore';
import { useAuthStore } from '../../store/useAuthStore';

const THEME_COLOR = '#FF8C00';

const JOB_TYPES = ['Full Time', 'Part Time', 'Contract'];

export default function PostJobScreen() {
    const navigation = useNavigation<any>();
    const { user } = useAuthStore();
    const { showNotification } = useNotificationStore();
    const createJobMutation = useCreateJobMutation();
    const { data: machineries } = useCategoriesByService(1); // 1 for Machinery
    const { data: vehicles } = useCategoriesByService(3); // 3 for Vehicles

    const allCategories = [...(machineries || []), ...(vehicles || [])];

    const [formData, setFormData] = useState({
        companyName: '',
        jobTitle: '',
        jobType: 'Full Time',
        jobDescription: '',
        salary: '',
        machineType: [] as string[],
        location: '',
        jobRequirements: [] as string[],
        jobResponsiblities: [] as string[],
        jobStatus: 'Open',
        postedBy: user?._id || '',
        postThroughGadal: false
    });

    const [newRequirement, setNewRequirement] = useState('');
    const [newResponsibility, setNewResponsibility] = useState('');
    const [showTypeModal, setShowTypeModal] = useState(false);
    const [showMachineModal, setShowMachineModal] = useState(false);

    const handleAddRequirement = () => {
        if (newRequirement.trim()) {
            setFormData(prev => ({
                ...prev,
                jobRequirements: [...prev.jobRequirements, newRequirement.trim()]
            }));
            setNewRequirement('');
        }
    };

    const handleRemoveRequirement = (index: number) => {
        setFormData(prev => ({
            ...prev,
            jobRequirements: prev.jobRequirements.filter((_, i) => i !== index)
        }));
    };

    const handleAddResponsibility = () => {
        if (newResponsibility.trim()) {
            setFormData(prev => ({
                ...prev,
                jobResponsiblities: [...prev.jobResponsiblities, newResponsibility.trim()]
            }));
            setNewResponsibility('');
        }
    };

    const handleRemoveResponsibility = (index: number) => {
        setFormData(prev => ({
            ...prev,
            jobResponsiblities: prev.jobResponsiblities.filter((_, i) => i !== index)
        }));
    };

    const handleMachineToggle = (id: string) => {
        setFormData(prev => ({
            ...prev,
            machineType: prev.machineType.includes(id)
                ? prev.machineType.filter(m => m !== id)
                : [...prev.machineType, id]
        }));
    };

    const handleSubmit = () => {
        if (!formData.jobTitle || !formData.jobDescription || !formData.companyName) {
            showNotification('Please fill in required fields (Title, Company, Description)', 'error');
            return;
        }

        createJobMutation.mutate(formData, {
            onSuccess: () => {
                showNotification('Job posted successfully', 'success');
                navigation.goBack();
            },
            onError: (error: any) => {
                showNotification(error.message || 'Failed to post job', 'error');
            }
        });
    };

    return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Post New Job</Text>
                <View style={{ width: 40 }} />
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    <View style={styles.section}>
                        <Text style={styles.label}>Job Title *</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. Senior Excavator Operator"
                            value={formData.jobTitle}
                            onChangeText={(text) => setFormData({ ...formData, jobTitle: text })}
                        />

                        <Text style={styles.label}>Company Name *</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter company name"
                            value={formData.companyName}
                            onChangeText={(text) => setFormData({ ...formData, companyName: text })}
                        />

                        <View style={styles.row}>
                            <View style={{ flex: 1, marginRight: 10 }}>
                                <Text style={styles.label}>Job Type</Text>
                                <TouchableOpacity style={styles.selector} onPress={() => setShowTypeModal(true)}>
                                    <Text style={styles.selectorText}>{formData.jobType}</Text>
                                    <Ionicons name="chevron-down" size={20} color="#666" />
                                </TouchableOpacity>
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.label}>Salary</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="e.g. Negotiable"
                                    value={formData.salary}
                                    onChangeText={(text) => setFormData({ ...formData, salary: text })}
                                />
                            </View>
                        </View>

                        <Text style={styles.label}>Location</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="City, Region"
                            value={formData.location}
                            onChangeText={(text) => setFormData({ ...formData, location: text })}
                        />

                        <Text style={styles.label}>Job Description *</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            placeholder="Describe the job role..."
                            multiline
                            numberOfLines={4}
                            value={formData.jobDescription}
                            onChangeText={(text) => setFormData({ ...formData, jobDescription: text })}
                        />
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.label}>Required Machine Types</Text>
                        <TouchableOpacity style={styles.selector} onPress={() => setShowMachineModal(true)}>
                            <Text style={styles.selectorText}>
                                {formData.machineType.length > 0
                                    ? `${formData.machineType.length} Machines Selected`
                                    : "Select Machines"}
                            </Text>
                            <Ionicons name="add-circle-outline" size={24} color={THEME_COLOR} />
                        </TouchableOpacity>

                        <View style={styles.chipsContainer}>
                            {formData.machineType.map(id => {
                                const machine = allCategories?.find(m => m._id === id);
                                return (
                                    <View key={id} style={styles.chip}>
                                        <Text style={styles.chipText}>{machine?.name || id}</Text>
                                        <TouchableOpacity onPress={() => handleMachineToggle(id)}>
                                            <Ionicons name="close-circle" size={18} color="#FFF" />
                                        </TouchableOpacity>
                                    </View>
                                );
                            })}
                        </View>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.label}>Job Requirements</Text>
                        <View style={styles.builderRow}>
                            <TextInput
                                style={[styles.input, { flex: 1, marginBottom: 0 }]}
                                placeholder="Add a requirement"
                                value={newRequirement}
                                onChangeText={setNewRequirement}
                            />
                            <TouchableOpacity style={styles.addIconBtn} onPress={handleAddRequirement}>
                                <Ionicons name="add" size={28} color="#FFF" />
                            </TouchableOpacity>
                        </View>
                        {formData.jobRequirements.map((req, index) => (
                            <View key={index} style={styles.listItem}>
                                <Text style={styles.listItemText}>• {req}</Text>
                                <TouchableOpacity onPress={() => handleRemoveRequirement(index)}>
                                    <Ionicons name="trash-outline" size={20} color="red" />
                                </TouchableOpacity>
                            </View>
                        ))}
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.label}>Job Responsibilities</Text>
                        <View style={styles.builderRow}>
                            <TextInput
                                style={[styles.input, { flex: 1, marginBottom: 0 }]}
                                placeholder="Add a responsibility"
                                value={newResponsibility}
                                onChangeText={setNewResponsibility}
                            />
                            <TouchableOpacity style={styles.addIconBtn} onPress={handleAddResponsibility}>
                                <Ionicons name="add" size={28} color="#FFF" />
                            </TouchableOpacity>
                        </View>
                        {formData.jobResponsiblities.map((resp, index) => (
                            <View key={index} style={styles.listItem}>
                                <Text style={styles.listItemText}>• {resp}</Text>
                                <TouchableOpacity onPress={() => handleRemoveResponsibility(index)}>
                                    <Ionicons name="trash-outline" size={20} color="red" />
                                </TouchableOpacity>
                            </View>
                        ))}
                    </View>

                    <View style={styles.section}>
                        <TouchableOpacity 
                            style={styles.checkboxContainer} 
                            onPress={() => setFormData(prev => ({ ...prev, postThroughGadal: !prev.postThroughGadal }))}
                        >
                            <Ionicons 
                                name={formData.postThroughGadal ? "checkbox" : "square-outline"} 
                                size={24} 
                                color={THEME_COLOR} 
                            />
                            <Text style={styles.checkboxLabel}>Post through Gadal (Cross-platform listing)</Text>
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                        style={[styles.submitBtn, createJobMutation.isPending && styles.disabledBtn]}
                        onPress={handleSubmit}
                        disabled={createJobMutation.isPending}
                    >
                        {createJobMutation.isPending ? (
                            <ActivityIndicator color="#FFF" />
                        ) : (
                            <Text style={styles.submitBtnText}>Post Job</Text>
                        )}
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Job Type Modal */}
            <Modal visible={showTypeModal} transparent animationType="fade">
                <TouchableOpacity style={styles.modalOverlay} onPress={() => setShowTypeModal(false)}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Select Job Type</Text>
                        {JOB_TYPES.map(type => (
                            <TouchableOpacity
                                key={type}
                                style={styles.modalOption}
                                onPress={() => {
                                    setFormData({ ...formData, jobType: type });
                                    setShowTypeModal(false);
                                }}
                            >
                                <Text style={[styles.optionText, formData.jobType === type && styles.activeOptionText]}>
                                    {type}
                                </Text>
                                {formData.jobType === type && <Ionicons name="checkmark" size={20} color={THEME_COLOR} />}
                            </TouchableOpacity>
                        ))}
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* Machine Type Modal */}
            <Modal visible={showMachineModal} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { maxHeight: '70%', width: '90%' }]}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Select Machines</Text>
                            <TouchableOpacity onPress={() => setShowMachineModal(false)}>
                                <Ionicons name="close" size={24} color="#333" />
                            </TouchableOpacity>
                        </View>
                        <FlatList
                            data={allCategories}
                            keyExtractor={item => item._id}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={styles.modalOption}
                                    onPress={() => handleMachineToggle(item._id)}
                                >
                                    <Text style={[styles.optionText, formData.machineType.includes(item._id) && styles.activeOptionText]}>
                                        {item.name}
                                    </Text>
                                    <Ionicons
                                        name={formData.machineType.includes(item._id) ? "checkbox" : "square-outline"}
                                        size={24}
                                        color={formData.machineType.includes(item._id) ? THEME_COLOR : "#DDD"}
                                    />
                                </TouchableOpacity>
                            )}
                        />
                        <TouchableOpacity style={styles.modalDoneBtn} onPress={() => setShowMachineModal(false)}>
                            <Text style={styles.modalDoneBtnText}>Done</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFF' },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 15, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F0F0F0'
    },
    backBtn: { padding: 8 },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#111' },
    scrollContent: { padding: 20 },
    section: { marginBottom: 25 },
    label: { fontSize: 14, fontWeight: 'bold', color: '#555', marginBottom: 8 },
    input: {
        borderWidth: 1, borderColor: '#DDD', borderRadius: 8, padding: 12,
        fontSize: 16, color: '#333', backgroundColor: '#F9F9F9', marginBottom: 15
    },
    textArea: { height: 100, textAlignVertical: 'top' },
    row: { flexDirection: 'row', marginBottom: 5 },
    selector: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        borderWidth: 1, borderColor: '#DDD', borderRadius: 8, padding: 12,
        backgroundColor: '#F9F9F9', marginBottom: 15
    },
    selectorText: { fontSize: 16, color: '#333' },
    chipsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 5 },
    chip: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: THEME_COLOR,
        paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, gap: 6
    },
    chipText: { color: '#FFF', fontSize: 12, fontWeight: '600' },
    builderRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 15 },
    addIconBtn: {
        backgroundColor: THEME_COLOR, width: 48, height: 48, borderRadius: 8,
        justifyContent: 'center', alignItems: 'center'
    },
    listItem: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        backgroundColor: '#F5F5F5', padding: 12, borderRadius: 8, marginBottom: 8
    },
    listItemText: { flex: 1, fontSize: 14, color: '#333' },
    submitBtn: {
        backgroundColor: THEME_COLOR, padding: 18, borderRadius: 12,
        alignItems: 'center', marginTop: 10, marginBottom: 30
    },
    disabledBtn: { backgroundColor: '#CCC' },
    submitBtnText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
    modalOverlay: {
        flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center', alignItems: 'center'
    },
    modalContent: {
        backgroundColor: '#FFF', width: '80%', borderRadius: 15, padding: 20,
        elevation: 5
    },
    modalHeader: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 20
    },
    modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 15 },
    modalOption: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#F0F0F0'
    },
    optionText: { fontSize: 16, color: '#666' },
    activeOptionText: { color: THEME_COLOR, fontWeight: 'bold' },
    modalDoneBtn: {
        backgroundColor: THEME_COLOR, padding: 15, borderRadius: 10,
        alignItems: 'center', marginTop: 20
    },
    modalDoneBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
    checkboxContainer: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
    checkboxLabel: { fontSize: 14, color: '#333', fontWeight: '500' }
});
