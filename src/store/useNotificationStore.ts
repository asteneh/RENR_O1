import { create } from 'zustand';
import { cleanErrorMessage } from '../utils/errorUtils';

export type NotificationType = 'success' | 'error' | 'info';

interface AlertButton {
    text: string;
    onPress?: (value?: string) => void;
    style?: 'default' | 'cancel' | 'destructive';
}

interface AlertState {
    title: string;
    message: string;
    buttons: AlertButton[];
    visible: boolean;
    withInput?: boolean;
    placeholder?: string;
    inputValue: string;
}

interface NotificationState {
    // Toast
    message: string;
    type: NotificationType;
    visible: boolean;
    title?: string;
    showNotification: (message: string, type?: NotificationType, title?: string) => void;
    showSuccess: (message: string) => void;
    showError: (error: any, title?: string) => void;
    showInfo: (message: string) => void;
    hideNotification: () => void;

    // Interactive Alert
    alert: AlertState;
    showAlert: (title: string, message: string, buttons?: AlertButton[], withInput?: boolean, placeholder?: string) => void;
    setAlertValue: (value: string) => void;
    hideAlert: () => void;

    // Activity Notifications
    unreadNotifications: number;
    setUnreadNotifications: (count: number) => void;
    incrementUnreadNotifications: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
    // Toast
    message: '',
    type: 'info',
    visible: false,
    title: undefined,
    showNotification: (message, type = 'info', title) => {
        set({
            message,
            type,
            visible: true,
            title: title || (type === 'success' ? 'Success' : type === 'error' ? 'Error' : 'Heads up')
        });
        setTimeout(() => set({ visible: false }), 4000);
    },
    showSuccess: (message) => {
        set({ message, type: 'success', visible: true, title: 'Success' });
        setTimeout(() => set({ visible: false }), 4000);
    },
    showError: (error, title = 'Error') => {
        set({ message: cleanErrorMessage(error), type: 'error', visible: true, title });
        setTimeout(() => set({ visible: false }), 4000);
    },
    showInfo: (message) => {
        set({ message, type: 'info', visible: true, title: 'Heads up' });
        setTimeout(() => set({ visible: false }), 4000);
    },
    hideNotification: () => set({ visible: false }),

    // Alert
    alert: {
        title: '',
        message: '',
        buttons: [],
        visible: false,
        withInput: false,
        placeholder: '',
        inputValue: '',
    },
    showAlert: (title, message, buttons = [{ text: 'OK' }], withInput = false, placeholder = '') => {
        set({ alert: { title, message, buttons, visible: true, withInput, placeholder, inputValue: '' } });
    },
    setAlertValue: (inputValue) => set((state) => ({ alert: { ...state.alert, inputValue } })),
    hideAlert: () => set((state) => ({ alert: { ...state.alert, visible: false } })),

    // Activity Notifications
    unreadNotifications: 0,
    setUnreadNotifications: (unreadNotifications) => set({ unreadNotifications }),
    incrementUnreadNotifications: () => set((state) => ({ unreadNotifications: state.unreadNotifications + 1 })),
}));
