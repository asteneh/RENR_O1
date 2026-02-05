import { useQuery, useMutation } from '@tanstack/react-query';
import apiClient from '../apiClient';

export interface Operator {
    _id: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
    email: string;
    experience: string;
    machinesYouCanOperate: string[]; // Access to strings or populated objects depending on backend
    proflePic?: string;
    isVerified: boolean;
}

// APIs
export const fetchOperators = async (): Promise<Operator[]> => {
    const response = await apiClient.get<Operator[]>('operators?recordStatus=1');
    return response.data;
};

export const registerOperator = async (formData: FormData): Promise<any> => {
    const response = await apiClient.post('operators', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
};

// Hooks
export const useOperators = () => {
    return useQuery({
        queryKey: ['operators'],
        queryFn: fetchOperators,
    });
};

export const useRegisterOperator = () => {
    return useMutation({
        mutationFn: registerOperator,
    });
};
