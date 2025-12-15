import { useQuery } from '@tanstack/react-query';
import apiClient from '../apiClient';

// Service Function
export const fetchHello = async () => {
    const response = await apiClient.get('/');
    // Return the full data payload to ensure we see whatever it sends
    return response.data;
};

// Hook
export const useHelloQuery = () => {
    return useQuery({
        queryKey: ['hello'],
        queryFn: fetchHello,
    });
};
