import { useQuery } from '@tanstack/react-query';
import apiClient from '../apiClient';

export interface Location {
    _id: string;
    descripton: string;
}

export interface Currency {
    _id: string;
    description: string; // e.g., "ETB", "USD"
}

// APIs
export const fetchLocations = async (): Promise<Location[]> => {
    const response = await apiClient.get<Location[]>('locations?recordStatus=1');
    return response.data;
};

export const fetchSubCities = async (locationId: string): Promise<Location[]> => {
    const response = await apiClient.get<Location[]>(`subCities?location=${locationId}&recordStatus=1`);
    return response.data;
};

export const fetchWeredas = async (subCityId: string): Promise<Location[]> => {
    const response = await apiClient.get<Location[]>(`wereda?subCity=${subCityId}&recordStatus=1`);
    return response.data;
};

export const fetchCurrencies = async (): Promise<Currency[]> => {
    const response = await apiClient.get<Currency[]>('currencies?recordStatus=1');
    return response.data;
};

// Hooks
export const useLocations = () => {
    return useQuery({
        queryKey: ['locations'],
        queryFn: fetchLocations,
    });
};

export const useSubCities = (locationId: string | null) => {
    return useQuery({
        queryKey: ['subCities', locationId],
        queryFn: () => fetchSubCities(locationId!),
        enabled: !!locationId,
    });
};

export const useWeredas = (subCityId: string | null) => {
    return useQuery({
        queryKey: ['weredas', subCityId],
        queryFn: () => fetchWeredas(subCityId!),
        enabled: !!subCityId,
    });
};

export const useCurrencies = () => {
    return useQuery({
        queryKey: ['currencies'],
        queryFn: fetchCurrencies,
    });
};
