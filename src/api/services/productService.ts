import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../apiClient';

// TYPES
export interface Consignee {
    _id: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
    proflePic?: string;
    followers: string[];
    isAdmin?: boolean;
}

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
    subCity?: {
        _id: string;
        descripton: string;
    };
    wereda?: {
        _id: string;
        descripton: string;
    };
    category: {
        _id: string;
        name: string;
        icon: string;
        serviceType?: number;
    };
    brand?: {
        _id: string;
        description: string;
    };
    productType?: number;
    postType: {
        _id: string;
        name: string;
        price: number;
    };
    attributes: {
        name: string;
        value: string;
        _id: string;
    }[];
    currency: {
        _id: string;
        name: string;
        sign: string;
    };
    consignee: Consignee;
    likedBy: string[];
    viewCount: number;
    averageRating: number;
    totalReviews: number;
    isFixed: boolean;
    transactionType: number; // 1 for Rent, 2 for Sale
    derivedState: number; // 1 for Available, 2 for Unavailable
    youtubeLink?: string;
    postThroughGadal?: boolean;
    createdAt: string;
}



export interface PostTypeDefinition {
    _id: string;
    name: string;
    description: string;
    price: number;
    duration: number; // days
    isFree: boolean;
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
export const fetchProducts = async (params?: any): Promise<ProductsResponse> => {
    const response = await apiClient.get<ProductsResponse>('products', { params });
    return response.data;
};

export const fetchSingleProduct = async (id: string): Promise<Product> => {
    const response = await apiClient.get<Product>(`products/${id}`);
    return response.data;
};

export const fetchPostTypes = async (): Promise<PostTypeDefinition[]> => {
    const response = await apiClient.get<PostTypeDefinition[]>('postTypeDefinitions');
    return response.data;
};

export const createProduct = async (formData: FormData): Promise<any> => {
    const response = await apiClient.post('products', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
};

export const addToFav = async (productId: string, userId: string): Promise<any> => {
    const response = await apiClient.put(`users/addToFav/${productId}/${userId}`);
    return response.data;
};

export const removeFromFav = async (productId: string, userId: string): Promise<any> => {
    const response = await apiClient.put(`users/removeFromFav/${productId}/${userId}`);
    return response.data;
};

export const useProductsQuery = (params?: any) => {
    return useQuery({
        queryKey: ['products', params],
        queryFn: () => fetchProducts(params),
    });
};

export const useSingleProductQuery = (id: string) => {
    return useQuery({
        queryKey: ['getSingleProduct', id],
        queryFn: () => fetchSingleProduct(id),
    });
};

export const usePostTypesQuery = () => {
    return useQuery({
        queryKey: ['postTypes'],
        queryFn: fetchPostTypes,
    });
};

export const updateProduct = async (data: any): Promise<any> => {
    // If we're passing FormData (e.g. for images), we need multipart headers
    const isFormData = data instanceof FormData;
    const productId = isFormData ? (data as any)._parts.find((p: any) => p[0] === 'productId')?.[1] : data.productId;

    const response = await apiClient.put(`products/${productId}`, data, {
        headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {}
    });
    return response.data;
};


export const useCreateProductMutation = () => {
    return useMutation({
        mutationFn: createProduct,
    });
};

export const useUpdateProductMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: updateProduct,
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
            queryClient.invalidateQueries({ queryKey: ['userAds'] });
            queryClient.invalidateQueries({ queryKey: ['getSingleProduct', variables.productId] });
        },
    });
};


export const useAddFavMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ productId, userId }: { productId: string; userId: string }) => addToFav(productId, userId),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
            queryClient.invalidateQueries({ queryKey: ['favorites'] });
            queryClient.invalidateQueries({ queryKey: ['getSingleProduct', variables.productId] });
        },
    });
};

export const useRemoveFavMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ productId, userId }: { productId: string; userId: string }) => removeFromFav(productId, userId),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
            queryClient.invalidateQueries({ queryKey: ['favorites'] });
            queryClient.invalidateQueries({ queryKey: ['getSingleProduct', variables.productId] });
        },
    });
};
