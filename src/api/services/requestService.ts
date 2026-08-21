import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../apiClient';

// TYPES
export interface RequestCategory {
    _id: string;
    name: string;
    serviceId: number;
    icon: string;
}

export interface RequestProductDetail {
    category: RequestCategory;
    brands: any[];
    qty: number;
    productAttributes: { name: string; value: string; _id: string }[];
    _id: string;
}

export interface RequestTransaction {
    _id: string;
    title: string;
    description: string;
    postedBy: {
        _id: string;
        firstName: string;
        lastName: string;
        phoneNumber: string;
    };
    requestType: string;
    state: string;
    viewCount: number;
    productDetails: RequestProductDetail[];
    attributes: { name: string; value: string; _id: string }[];
    location: string;
    notes: string;
    recordStatus: number;
    date: string;
    createdAt: string;
}

export interface RequestsResponse {
    requests: RequestTransaction[];
    metadata: {
        totalTransactions: number;
        pageNumber: number;
        pageSize: number;
    };
}

// SERVICE
export const fetchRequests = async (params: any = {}): Promise<RequestsResponse> => {
    const response = await apiClient.get<RequestsResponse>('requestTransactions', {
        params: { recordStatus: 1, ...params }
    });
    return response.data;
};

export const createRequest = async (requestData: any): Promise<any> => {
    const response = await apiClient.post('requestTransactions', requestData);
    return response.data;
};

// HOOKS
export const useRequestsQuery = (params: any = {}) => {
    return useQuery({
        queryKey: ['requests', params],
        queryFn: () => fetchRequests(params),
    });
};

export const useCreateRequestMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: createRequest,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['requests'] });
        },
    });
};
