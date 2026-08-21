import { useQuery } from '@tanstack/react-query';
import apiClient from '../apiClient';

export interface Category {
    _id: string;
    name: string;
    icon: string;
}

export interface CategoryAttribute {
    _id: string;
    name: string;
    values: string[];
    multipleSelection: boolean;
    isInsertion: boolean;
}

export interface Brand {
    _id: string;
    description: string;
    icon: string;
}

// APIs
export const fetchCategoriesByService = async (serviceId: number): Promise<Category[]> => {
    const response = await apiClient.get<Category[]>(`categories?serviceId=${serviceId}&recordStatus=1`);
    return response.data;
};

export const fetchCategoryAttributes = async (categoryId: string): Promise<CategoryAttribute[]> => {
    const response = await apiClient.get<CategoryAttribute[]>(`categoryAttributes?category=${categoryId}`);
    return response.data;
};

export const fetchBrandsByCategory = async (categoryId: string): Promise<Brand[]> => {
    const response = await apiClient.get<Brand[]>(`productBrands?category=${categoryId}&recordStatus=1`);
    return response.data;
};

// Hooks
export const useCategoriesByService = (serviceId: number) => {
    return useQuery({
        queryKey: ['categories', serviceId],
        queryFn: () => fetchCategoriesByService(serviceId),
        enabled: !!serviceId,
    });
};

export const useCategoryAttributes = (categoryId: string | null) => {
    return useQuery({
        queryKey: ['categoryAttributes', categoryId],
        queryFn: () => fetchCategoryAttributes(categoryId!),
        enabled: !!categoryId,
    });
};

export const useBrandsByCategory = (categoryId: string | null) => {
    return useQuery({
        queryKey: ['brands', categoryId],
        queryFn: () => fetchBrandsByCategory(categoryId!),
        enabled: !!categoryId,
    });
};
