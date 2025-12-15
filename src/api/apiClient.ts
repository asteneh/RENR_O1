import axios from 'axios';
import { CONFIG } from '../config';

const apiClient = axios.create({
    baseURL: CONFIG.BASE_URL,
    timeout: CONFIG.TIMEOUT,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
});

// Optional: Add interceptors for logging or auth token
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        console.error('API Error:', error?.response || error.message);
        return Promise.reject(error);
    }
);

export default apiClient;
