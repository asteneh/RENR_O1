import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../apiClient';

// TYPES
export interface Message {
    _id: string;
    conversationId: string;
    sender: string;
    text: string;
    content?: string; // image url?
    createdAt: string;
}

export interface Conversation {
    _id: string;
    members: string[]; // User IDs
    lastMessage?: string;
    updatedAt: string;
    receiverData?: any; // Populated by backend?
}

// APIs
export const fetchConversations = async (userId: string): Promise<Conversation[]> => {
    // Assuming /getConversations/:id returns list of conversations
    const response = await apiClient.get<Conversation[]>(`getConversations/${userId}`);
    return response.data;
};

export const fetchMessages = async (userId: string): Promise<Message[]> => {
    // This endpoint /getMessages/:user seems to fetch messages for a user? 
    // Usually we fetch by ConversationId. 
    // Let's assume fetching all messages for now or specific conversation implementation differs.
    // Based on standard Gadal, maybe `getMessages` fetches chat history with a specific user?
    // Let's stick to conversations list first.
    const response = await apiClient.get<Message[]>(`getMessages/${userId}`);
    return response.data;
};

export const createMessage = async (data: { conversationId?: string, sender: string, text: string, receiver?: string }) => {
    // payload: { conversationId, sender, text }
    const response = await apiClient.post('createMessage', data);
    return response.data;
};

export const addConversation = async (data: { senderId: string, receiverId: string }) => {
    // PUT /addConversations
    // payload probably { senderId, receiverId }
    const response = await apiClient.put('addConversations', data);
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

export const useMessages = (userId: string) => {
    // Ideally this takes conversationId. 
    // Refactoring to require conversationId or similar would be better if backend supports it.
    // For now we match backend 'getMessages/:user'.
    return useQuery({
        queryKey: ['messages', userId],
        queryFn: () => fetchMessages(userId),
        enabled: !!userId,
    });
};

export const useSendMessage = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: createMessage,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['messages'] });
            queryClient.invalidateQueries({ queryKey: ['conversations'] });
        },
    });
};

export const useStartConversation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: addConversation,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['conversations'] });
        }
    });
};
