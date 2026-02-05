import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/useAuthStore';
import { useMessages, useSendMessage } from '../../api/services/messageService';
import { Ionicons } from '@expo/vector-icons';

const THEME_COLOR = '#FF8C00';

export default function ChatScreen({ route }: any) {
    const { conversation } = route.params;
    const insets = useSafeAreaInsets();
    const user = useAuthStore(state => state.user);
    const userId = user?.id || user?._id;

    // We assume backend endpoint fetchMessages takes conversationID or partner ID. 
    // Adapting to 'useMessages' hook which uses 'fetchMessages(userId)'.
    // If backend only fetches ALL messages, client filtering is needed or hook adjustment.
    // For now we mimic chat UI.
    const { data: messages, refetch } = useMessages(conversation?._id);
    const sendMutation = useSendMessage();
    const [text, setText] = useState('');

    const handleSend = () => {
        if (!text.trim()) return;

        sendMutation.mutate({
            conversationId: conversation._id,
            sender: userId,
            text,
            receiver: conversation.members.find((m: string) => m !== userId)
        }, {
            onSuccess: () => {
                setText('');
                refetch();
            }
        });
    };

    const renderItem = ({ item }: { item: any }) => {
        const isMe = item.sender === userId;
        return (
            <View style={[styles.msgContainer, isMe ? styles.myMsg : styles.otherMsg]}>
                <Text style={[styles.msgText, isMe ? styles.myMsgText : styles.otherMsgText]}>{item.text}</Text>
            </View>
        );
    };

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
            <FlatList
                data={messages}
                keyExtractor={(item) => item._id}
                renderItem={renderItem}
                inverted
                contentContainerStyle={{ padding: 15 }}
            />
            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    placeholder="Type a message..."
                    placeholderTextColor="#888"
                    value={text}
                    onChangeText={setText}
                />
                <TouchableOpacity onPress={handleSend} style={styles.sendBtn}>
                    <Ionicons name="send" size={20} color="#fff" />
                </TouchableOpacity>
            </View>
            <View style={{ height: insets.bottom, backgroundColor: '#fff' }} />
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    msgContainer: { maxWidth: '80%', padding: 10, borderRadius: 10, marginBottom: 10 },
    myMsg: { alignSelf: 'flex-end', backgroundColor: THEME_COLOR, borderBottomRightRadius: 2 },
    otherMsg: { alignSelf: 'flex-start', backgroundColor: '#fff', borderBottomLeftRadius: 2 },
    msgText: { fontSize: 15 },
    myMsgText: { color: '#fff' },
    otherMsgText: { color: '#000' },
    inputContainer: { flexDirection: 'row', padding: 10, backgroundColor: '#fff', alignItems: 'center' },
    input: { flex: 1, backgroundColor: '#f0f0f0', borderRadius: 20, paddingHorizontal: 15, paddingVertical: 8, marginRight: 10 },
    sendBtn: { backgroundColor: THEME_COLOR, padding: 10, borderRadius: 20 },
});
