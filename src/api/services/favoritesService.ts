import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../apiClient';
import { Product } from './productService';

// APIs
export const fetchFavorites = async (): Promise<Product[]> => {
    const response = await apiClient.get<Product[]>('users/favorites');
    return response.data;
};

export const addToFavorites = async (productId: string, userId: string): Promise<any> => {
    const response = await apiClient.put(`users/addToFav/${productId}/${userId}`);
    return response.data;
};

export const removeFromFavorites = async (productId: string, userId: string): Promise<any> => {
    const response = await apiClient.put(`users/removeFromFav/${productId}/${userId}`);
    return response.data;
};

// Hooks
export const useFavorites = () => {
    return useQuery({
        queryKey: ['favorites'],
        queryFn: fetchFavorites,
    });
};

export const useToggleFavorite = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: { productId: string, userId: string, isFav: boolean }) => {
            if (data.isFav) return removeFromFavorites(data.productId, data.userId);
            return addToFavorites(data.productId, data.userId);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['favorites'] });
            queryClient.invalidateQueries({ queryKey: ['products'] }); // To update liked status in list if needed
        }
    });
};
