import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, LayoutAnimation, Platform, UIManager } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RequestItem } from '../data/mockRequests';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

const THEME_COLOR = '#FF8C00';

interface RequestCardProps {
    request: RequestItem;
}

export default function RequestCard({ request }: RequestCardProps) {
    const [expanded, setExpanded] = useState(false);

    const toggleExpand = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setExpanded(!expanded);
    };

    return (
        <View style={styles.cardContainer}>
            <TouchableOpacity
                activeOpacity={0.8}
                onPress={toggleExpand}
                style={styles.header}
            >
                <View style={styles.headerLeft}>
                    <View style={styles.iconBox}>
                        <Ionicons name="document-text-outline" size={24} color={THEME_COLOR} />
                    </View>
                    <View>
                        <Text style={styles.title}>{request.title}</Text>
                        <Text style={styles.subtitle}>{request.datePosted} • {request.status}</Text>
                    </View>
                </View>
                <Ionicons
                    name={expanded ? "chevron-up" : "chevron-down"}
                    size={20}
                    color="#999"
                />
            </TouchableOpacity>

            {expanded && (
                <View style={styles.detailsContainer}>
                    <View style={styles.divider} />

                    <View style={styles.row}>
                        <Text style={styles.label}>Project Name:</Text>
                        <Text style={styles.value}>{request.projectName}</Text>
                    </View>

                    <View style={styles.row}>
                        <Text style={styles.label}>Site:</Text>
                        <Text style={styles.value}>{request.siteLocation}</Text>
                    </View>

                    <View style={styles.row}>
                        <Text style={styles.label}>Machine:</Text>
                        <Text style={styles.value}>{request.quantity}x {request.machineType}</Text>
                    </View>

                    <View style={styles.row}>
                        <Text style={styles.label}>Year Req:</Text>
                        <Text style={styles.value}>{request.yearRequirement || 'N/A'}</Text>
                    </View>

                    <View style={styles.descriptionBox}>
                        <Text style={styles.descriptionText}>{request.description}</Text>
                    </View>

                    <TouchableOpacity style={styles.actionBtn}>
                        <Text style={styles.actionBtnText}>View Matches</Text>
                        <Ionicons name="arrow-forward" size={16} color="#FFF" />
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    cardContainer: {
        backgroundColor: '#FFF',
        borderRadius: 12,
        marginBottom: 15,
        marginHorizontal: 20,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#EEE',
        elevation: 2,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 15,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconBox: {
        width: 40, height: 40,
        borderRadius: 8,
        backgroundColor: '#FFF5E5',
        justifyContent: 'center', alignItems: 'center',
        marginRight: 12,
    },
    title: {
        fontSize: 16, fontWeight: '700', color: '#333',
    },
    subtitle: {
        fontSize: 12, color: '#888', marginTop: 2,
    },
    detailsContainer: {
        paddingHorizontal: 15,
        paddingBottom: 15,
    },
    divider: {
        height: 1, backgroundColor: '#F0F0F0', marginBottom: 15,
    },
    row: {
        flexDirection: 'row',
        marginBottom: 8,
    },
    label: {
        width: 100, fontSize: 13, color: '#888', fontWeight: '500',
    },
    value: {
        flex: 1, fontSize: 13, color: '#333', fontWeight: '600',
    },
    descriptionBox: {
        backgroundColor: '#F9F9F9',
        padding: 10,
        borderRadius: 8,
        marginTop: 5,
        marginBottom: 15,
    },
    descriptionText: {
        fontSize: 13, color: '#555', lineHeight: 18, fontStyle: 'italic',
    },
    actionBtn: {
        flexDirection: 'row',
        backgroundColor: THEME_COLOR,
        paddingVertical: 10,
        justifyContent: 'center', alignItems: 'center',
        borderRadius: 8,
        gap: 5
    },
    actionBtnText: {
        color: '#FFF', fontWeight: 'bold', fontSize: 14,
    }
});
