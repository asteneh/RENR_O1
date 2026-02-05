import axios from 'axios';
import { CONFIG } from '../config';
import { useAuthStore } from '../store/useAuthStore';

const apiClient = axios.create({
    baseURL: CONFIG.BASE_URL,
    timeout: CONFIG.TIMEOUT,
    headers: {
        'Accept': 'application/json',
    },
});

// Request Interceptor to add Auth Token
apiClient.interceptors.request.use(
    async (config) => {
        const token = useAuthStore.getState().token;
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response Interceptor for error handling
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        console.error('API Error:', error?.response?.data || error.message);
        return Promise.reject(error);
    }
);

export default apiClient;
