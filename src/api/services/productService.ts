import { useQuery } from '@tanstack/react-query';
import apiClient from '../apiClient';

// TYPES based on User JSON
export interface Product {
    _id: string;
    title: string;
    description: string;
    currentPrice: number;
    previousPrice: number;
    productImages: string[];
    location: {
        _id: string;
        descripton: string;
    };
    category: {
        _id: string;
        name: string;
        icon: string;
    };
    postType: {
        name: string;
        price: number;
    };
    attributes: {
        name: string;
        value: string;
        _id: string;
    }[];
    viewCount: number;
    createdAt: string;
    // Fallback for UI if needed
    type?: 'Sale' | 'Rent';
}

export interface ProductsResponse {
    products: Product[];
    metadata: {
        totalProducts: number;
        pageNumber: number;
        pageSize: number;
    };
}

// SERVICE
export const fetchProducts = async (): Promise<ProductsResponse> => {
    const response = await apiClient.get<ProductsResponse>('/products');
    return response.data;
};

// HOOK
export const useProductsQuery = () => {
    return useQuery({
        queryKey: ['products'],
        queryFn: fetchProducts,
    });
};
