import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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

// ─── APIs ────────────────────────────────────────────────────────────────────

export const fetchOperators = async (): Promise<Operator[]> => {
    const response = await apiClient.get<Operator[]>('operators?recordStatus=1');
    return response.data;
};

export const fetchOperatorById = async (id: string): Promise<Operator> => {
    const response = await apiClient.get<Operator>(`operators/${id}`);
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

export const updateOperator = async ({
    id,
    formData,
}: {
    id: string;
    formData: FormData;
}): Promise<Operator> => {
    const response = await apiClient.put<Operator>(`operators/${id}`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
};

// ─── Hooks ───────────────────────────────────────────────────────────────────

export const useOperators = () => {
    return useQuery({
        queryKey: ['operators'],
        queryFn: fetchOperators,
    });
};

export const useOperatorById = (id: string | undefined) => {
    return useQuery({
        queryKey: ['operator', id],
        queryFn: () => fetchOperatorById(id!),
        enabled: !!id,
    });
};

export const useRegisterOperator = () => {
    return useMutation({
        mutationFn: registerOperator,
    });
};

export const useUpdateOperator = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: updateOperator,
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['operator', variables.id] });
            queryClient.invalidateQueries({ queryKey: ['operators'] });
        },
    });
};
