import { useQuery } from '@tanstack/react-query';
import apiClient from '../apiClient';

export interface UserPackage {
    _id: string;
    description: string;
    isValid: boolean;
    remainingGoldPosts: number;
    remainingPremiumPosts: number;
    remainingBasicPosts: number;
    remainingFreeEstimationPosts: number;
    endDate: string;
}

// APIs
export const fetchUserPackages = async (): Promise<UserPackage[]> => {
    const response = await apiClient.get<UserPackage[]>('usersPackage');
    return response.data;
};

// Hooks
export const useUserPackages = () => {
    return useQuery({
        queryKey: ['userPackages'],
        queryFn: fetchUserPackages,
    });
};
