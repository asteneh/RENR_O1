import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '../apiClient';

export interface PackageDefinition {
    _id: string;
    name: string;
    numberOfGoldPosts: number;
    numberOfBasicPosts: number;
    numberOfPremiumPosts: number;
    offPercent: number;
}

export interface UserPackage {
    _id: string;
    description: string;
    isValid: boolean;
    isPayed?: boolean;
    remainingGoldPosts: number;
    remainingPremiumPosts: number;
    remainingBasicPosts: number;
    remainingFreeEstimationPosts: number;
    endDate: string;
    packageDefinition?: PackageDefinition;
    packagePrice?: number;
    transactionReference?: string;
}

export interface PackagePricing {
    subtotal: number;
    vat: number;
    total: number;
}

export interface PackagePurchasePayload {
    packageDefinition: string;
    user: string;
    returnUrl?: string;
    amount?: number;
    description?: string;
    startDate?: string;
    endDate?: string;
    packageType?: string;
    remainingGoldPosts?: number;
    remainingPremiumPosts?: number;
    remainingBasicPosts?: number;
}

export interface PackagePurchaseResponse {
    newPackage: UserPackage;
    transaction: {
        checkout_url: string;
        [key: string]: any;
    };
    txRef: string;
    pricing: PackagePricing;
}

export interface PostingEligibility {
    canPost: boolean;
    message: string;
    remainingPostsField?: string | null;
    availablePackage?: UserPackage | null;
}

export const fetchUserPackages = async (): Promise<UserPackage[]> => {
    const response = await apiClient.get<UserPackage[]>('usersPackage');
    return response.data;
};

export const fetchPackageDefinitions = async (): Promise<PackageDefinition[]> => {
    const response = await apiClient.get<PackageDefinition[]>('packageDefinition');
    return response.data;
};

export const createPackagePurchase = async (payload: PackagePurchasePayload): Promise<PackagePurchaseResponse> => {
    const response = await apiClient.post<PackagePurchaseResponse>('package', payload);
    return response.data;
};

export const verifyPackagePayment = async (txRef: string): Promise<any> => {
    const response = await apiClient.put(`Transaction/verify/${txRef}`, { serviceType: 'package' });
    return response.data;
};

export const checkPackageBeforePosting = async (postType: string): Promise<PostingEligibility> => {
    const response = await apiClient.get<PostingEligibility>('packages/check-posting', {
        params: { postType },
    });
    return response.data;
};

export const useUserPackages = () => {
    return useQuery({
        queryKey: ['userPackages'],
        queryFn: fetchUserPackages,
    });
};

export const usePackageDefinitions = () => {
    return useQuery({
        queryKey: ['packageDefinitions'],
        queryFn: fetchPackageDefinitions,
    });
};

export const useCreatePackagePurchaseMutation = () => {
    return useMutation({
        mutationFn: createPackagePurchase,
    });
};

export const useVerifyPackagePaymentMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: verifyPackagePayment,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['userPackages'] });
        },
    });
};
