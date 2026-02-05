import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../apiClient';

export interface Review {
    _id: string;
    user: {
        _id: string;
        firstName: string;
        lastName: string;
        proflePic?: string;
    };
    product: string;
    description: string;
    stars: number;
    updatedAt: string;
}

export interface CreateReviewPayload {
    user: string;
    product: string;
    description: string;
    stars: number;
}

export const fetchReviews = async (productId: string): Promise<Review[]> => {
    const response = await apiClient.get<Review[]>(`reviews?product=${productId}`);
    return response.data;
};

export const createReview = async (payload: CreateReviewPayload): Promise<Review> => {
    const response = await apiClient.post<Review>('reviews', payload);
    return response.data;
};

export const useReviewsQuery = (productId: string) => {
    return useQuery({
        queryKey: ['reviews', productId],
        queryFn: () => fetchReviews(productId),
        enabled: !!productId,
    });
};

export const useCreateReviewMutation = (productId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: createReview,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['reviews', productId] });
            queryClient.invalidateQueries({ queryKey: ['getSingleProduct', productId] });
            queryClient.invalidateQueries({ queryKey: ['products'] });
        },
    });
};
