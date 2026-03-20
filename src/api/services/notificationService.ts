import apiClient from '../apiClient';

export const notificationService = {
    getNotifications: async (userId: string) => {
        const response = await apiClient.get(`notifications/${userId}`);
        return response.data;
    },
    getUnreadNotificationsCount: async (userId: string) => {
        const response = await apiClient.get(`notifications/unread/${userId}`);
        return response.data;
    },
    updateSeen: async (userId: string) => {
        const response = await apiClient.put(`notifications/seen/${userId}`);
        return response.data;
    }
};
