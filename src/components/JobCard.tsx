import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Job } from '../api/services/jobService';

const THEME_COLOR = '#FF8C00';

interface JobCardProps {
    job: Job;
    onViewDetails: () => void;
    onApply: () => void;
    isApplied: boolean;
    isApplying: boolean;
}

export default function JobCard({ job, onViewDetails, onApply, isApplied, isApplying }: JobCardProps) {
    return (
        <View style={styles.card}>
            <View style={styles.header}>
                <View style={styles.titleContainer}>
                    <Text style={styles.title}>{job.jobTitle}</Text>
                    <Text style={styles.company}>{job.companyName}</Text>
                </View>
                <View style={styles.typeTag}>
                    <Text style={styles.typeText}>{job.jobType}</Text>
                </View>
            </View>

            <View style={styles.metaRow}>
                <View style={styles.metaItem}>
                    <Ionicons name="location-outline" size={14} color="#666" />
                    <Text style={styles.metaText}>{job.location || 'Remote'}</Text>
                </View>
                <View style={styles.metaItem}>
                    <Ionicons name="cash-outline" size={14} color="#666" />
                    <Text style={styles.metaText}>{job.salary || 'Negotiable'}</Text>
                </View>
                <View style={styles.metaItem}>
                    <Ionicons name="time-outline" size={14} color="#666" />
                    <Text style={styles.metaText}>{new Date(job.createdAt).toLocaleDateString()}</Text>
                </View>
            </View>

            <Text style={styles.description} numberOfLines={3}>
                {job.jobDescription}
            </Text>

            <View style={styles.footer}>
                <TouchableOpacity style={styles.detailsBtn} onPress={onViewDetails}>
                    <Text style={styles.detailsBtnText}>View Details</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[
                        styles.applyBtn,
                        isApplied && styles.appliedBtn,
                        isApplying && styles.disabledBtn
                    ]}
                    onPress={onApply}
                    disabled={isApplied || isApplying}
                >
                    <Text style={[styles.applyBtnText, isApplied && styles.appliedBtnText]}>
                        {isApplied ? 'Applied' : isApplying ? 'Applying...' : 'Apply Now'}
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    titleContainer: {
        flex: 1,
        marginRight: 10,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
    },
    company: {
        fontSize: 14,
        color: THEME_COLOR,
        fontWeight: '600',
    },
    typeTag: {
        backgroundColor: '#FFF3E0',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    typeText: {
        fontSize: 12,
        color: THEME_COLOR,
        fontWeight: 'bold',
    },
    metaRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 12,
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    metaText: {
        fontSize: 12,
        color: '#666',
    },
    description: {
        fontSize: 14,
        color: '#777',
        lineHeight: 20,
        marginBottom: 16,
    },
    footer: {
        flexDirection: 'row',
        gap: 12,
    },
    detailsBtn: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#EEE',
    },
    detailsBtnText: {
        fontSize: 14,
        color: '#666',
        fontWeight: '600',
    },
    applyBtn: {
        flex: 1.5,
        backgroundColor: THEME_COLOR,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 8,
    },
    applyBtnText: {
        fontSize: 14,
        color: '#fff',
        fontWeight: 'bold',
    },
    appliedBtn: {
        backgroundColor: '#E8F5E9',
    },
    appliedBtnText: {
        color: '#4CAF50',
    },
    disabledBtn: {
        opacity: 0.7,
    }
});
