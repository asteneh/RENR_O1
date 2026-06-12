import React, { useState } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/useAuthStore';
import { useMessages, useSendMessage } from '../../api/services/messageService';
import { Ionicons } from '@expo/vector-icons';
import { CONFIG } from '../../config';
import { formatEtb } from '../../utils/currency';

const THEME_COLOR = '#FF8C00';

export default function ChatScreen({ route, navigation }: any) {
    const { conversation } = route.params;
    const insets = useSafeAreaInsets();
    const user = useAuthStore(state => state.user);
    const userId = user?.id || user?._id;

    // Fetch full conversation details
    const { data: conversationDetail, refetch } = useMessages(conversation?._id);
    const sendMutation = useSendMessage();
    const [text, setText] = useState('');

    const messages = conversationDetail?.conversations || [];
    const product = conversationDetail?.product;

    // Reverse messages for inverted FlatList (newest at bottom, oldest at top)
    const sortedMessages = React.useMemo(() => {
        return messages ? [...messages].reverse() : [];
    }, [messages]);

    const handleSend = () => {
        if (!text.trim()) return;

        const partnerId = conversation.productOwner?._id === userId 
            ? (conversation.interestedParty?._id || conversation.interestedParty)
            : (conversation.productOwner?._id || conversation.productOwner);

        sendMutation.mutate({
            conversationId: conversation._id,
            sender: userId,
            text,
            receiver: partnerId
        }, {
            onSuccess: () => {
                setText('');
                refetch();
            }
        });
    };

    const renderItem = ({ item }: { item: any }) => {
        const isMe = item.sender === userId;
        const msgText = item.message?.message || (typeof item.message === 'string' ? item.message : '');

        return (
            <View style={[styles.msgContainer, isMe ? styles.myMsg : styles.otherMsg]}>
                <Text style={[styles.msgText, isMe ? styles.myMsgText : styles.otherMsgText]}>{msgText}</Text>
            </View>
        );
    };

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
            {product && (
                <TouchableOpacity
                    style={styles.productHeader}
                    onPress={() => navigation.navigate('ProductDetails', { product })}
                >
                    <Image
                        source={{ uri: product.productImages && product.productImages.length > 0 ? `${CONFIG.FILE_URL}/${product.productImages[0]}` : 'https://via.placeholder.com/60' }}
                        style={styles.productImg}
                    />
                    <View style={styles.productInfo}>
                        <Text style={styles.productTitle} numberOfLines={1}>{product.title}</Text>
                        <Text style={styles.productPrice}>{formatEtb(product.currentPrice)}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color="#666" />
                </TouchableOpacity>
            )}

            <FlatList
                data={sortedMessages}
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
    productHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    productImg: { width: 45, height: 45, borderRadius: 6, marginRight: 10, backgroundColor: '#eee' },
    productInfo: { flex: 1 },
    productTitle: { fontSize: 14, fontWeight: 'bold', color: '#333' },
    productPrice: { fontSize: 13, color: THEME_COLOR, fontWeight: '600', marginTop: 2 },
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
