import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../apiClient';

// TYPES
export interface Message {
    _id: string;
    sender: string;
    receiver: string;
    seen: boolean;
    message?: {
        message: string;
        messageType: string;
    };
    createdAt: string;
    updatedAt: string;
}

export interface Conversation {
    _id: string;
    productOwner: any; // User object
    interestedParty: any; // User object
    conversations: Message[];
    product?: any; // Product object
    lastConversation?: {
        message?: {
            message: string;
            messageType: string;
        };
        sender: string;
        receiver: string;
        seen: boolean;
        updatedAt: string;
    };
    unreadCount?: number;
    updatedAt: string;
}

// APIs
// Fetch all conversation threads for a user
export const fetchConversations = async (userId: string): Promise<Conversation[]> => {
    const response = await apiClient.get<Conversation[]>(`getMessages/${userId}`);
    return response.data;
};

// Fetch full conversation document by conversationId (which contains the array of messages and product details)
export const fetchMessages = async (conversationId: string): Promise<Conversation> => {
    const response = await apiClient.get<Conversation>(`getConversations/${conversationId}`);
    return response.data;
};

// Reply to an existing conversation thread (adds a message to the thread)
export const createMessage = async (data: { conversationId: string, sender: string, text: string, receiver: string }) => {
    const payload = {
        messageId: data.conversationId,
        sender: data.sender,
        receiver: data.receiver,
        message: JSON.stringify({
            message: data.text,
            messageType: 'text'
        })
    };
    const response = await apiClient.put('addConversations', payload);
    return response.data;
};

// Start a new conversation thread (POST /createMessage)
export const startNewConversation = async (data: { product: string, owner: string, buyer: string, firstMessage: string }) => {
    const payload = {
        product: data.product,
        owner: data.owner,
        buyer: data.buyer,
        message: {
            message: data.firstMessage,
            messageType: 'text'
        }
    };
    const response = await apiClient.post('createMessage', payload);
    return response.data;
};

// Fetch total unread messages count for a user
export const fetchUnreadMessagesCount = async (userId: string): Promise<{ unreadCount: number }> => {
    const response = await apiClient.get<{ unreadCount: number }>(`getUnreadMessages/${userId}`);
    return response.data;
};

// Mark messages in a conversation as seen
export const markMessagesAsSeen = async (data: { conversationId: string, receiverId: string }) => {
    const response = await apiClient.put(`updateSeen/${data.conversationId}/${data.receiverId}`);
    return response.data;
};

// Hooks
export const useConversations = (userId: string) => {
    return useQuery({
        queryKey: ['conversations', userId],
        queryFn: () => fetchConversations(userId),
        enabled: !!userId,
    });
};

export const useMessages = (conversationId: string) => {
    return useQuery({
        queryKey: ['messages', conversationId],
        queryFn: () => fetchMessages(conversationId),
        enabled: !!conversationId,
    });
};

export const useSendMessage = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: createMessage,
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['messages', variables.conversationId] });
            queryClient.invalidateQueries({ queryKey: ['conversations'] });
        },
    });
};

export const useStartConversation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: startNewConversation,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['conversations'] });
        }
    });
};

export const useUnreadMessagesCount = (userId: string) => {
    return useQuery({
        queryKey: ['unreadMessagesCount', userId],
        queryFn: () => fetchUnreadMessagesCount(userId),
        enabled: !!userId,
    });
};

export const useMarkMessagesAsSeen = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: markMessagesAsSeen,
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['conversations'] });
            queryClient.invalidateQueries({ queryKey: ['messages', variables.conversationId] });
            queryClient.invalidateQueries({ queryKey: ['unreadMessagesCount', variables.receiverId] });
        },
    });
};
