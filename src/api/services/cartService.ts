import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../apiClient';

export interface OrderPayload {
    totalAmount: number;
    products: string[];
    engagmentFee: number;
    user: string;
}

export const createOrder = async (orderData: OrderPayload): Promise<any> => {
    const response = await apiClient.post('order', orderData);
    return response.data;
};

export const useCreateOrderMutation = () => {
    return useMutation({
        mutationFn: createOrder,
    });
};
