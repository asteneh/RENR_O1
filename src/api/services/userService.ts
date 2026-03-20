import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../apiClient';

export interface UserProfile {
    _id: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
    email?: string;
    region?: string;
    city?: string;
    subCity?: string;
    proflePic?: string;
    postCount?: number;
    followers?: any[];
    userType: string;
}

// API CALLS
export const fetchUserProfile = async (): Promise<UserProfile> => {
    const response = await apiClient.get('userProfileDetail');
    return response.data;
};

export const updateUserProfile = async (formData: FormData): Promise<any> => {
    const response = await apiClient.put('users', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
};

export const fetchUserAds = async (args: {
    userId: string,
    serviceType?: number,
    derivedState?: number,
    recordStatus?: number
}) => {
    let url = `products?consignee=${args.userId}`;

    if (args.recordStatus !== undefined) {
        url += `&recordStatus=${args.recordStatus}`;
    } else {
        url += `&recordStatus=1`;
    }

    if (args.serviceType) {
        url += `&productType=${args.serviceType}`;
    }

    if (args.derivedState) {
        url += `&derivedState=${args.derivedState}`;
    }

    const response = await apiClient.get(url);
    return response.data; // Expected { products: [...], metadata: {...} }
};

// HOOKS
export const useUserProfile = () => {
    return useQuery({
        queryKey: ['userProfile'],
        queryFn: fetchUserProfile,
    });
};

export const useUpdateUserProfile = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: updateUserProfile,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['userProfile'] });
        },
    });
};

export const useUserAds = (args: {
    userId: string,
    serviceType?: number,
    derivedState?: number,
    recordStatus?: number
}) => {
    return useQuery({
        queryKey: ['userAds', args.userId, args.serviceType, args.derivedState, args.recordStatus],
        queryFn: () => fetchUserAds(args),
        enabled: !!args.userId,
    });
};


export const fetchFollowings = async (userId: string) => {
    const response = await apiClient.get(`users/followings/${userId}`);
    return response.data;
};

export const unfollowUser = async (data: { user: string, userToUnfollow: string }) => {
    const response = await apiClient.post('users/unfollow', data);
    return response.data;
};

export const useFollowings = (userId: string) => {
    return useQuery({
        queryKey: ['followings', userId],
        queryFn: () => fetchFollowings(userId),
        enabled: !!userId,
    });
};

export const useUnfollow = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: unfollowUser,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['followings'] });
        },
    });
};
