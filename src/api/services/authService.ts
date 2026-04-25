import { useMutation } from '@tanstack/react-query';
import apiClient from '../apiClient';
import { formatPhoneNumber } from '../../utils/formatPhoneNumber';

// TYPES
export interface LoginPayload {
    emailOrPhone: string;
    password: string;
}

export interface RegisterPayload {
    firstName: string;
    lastName: string;
    phoneNumber: string; // Used as unique ID mostly
    password: string;
    // Add other fields as per backend (city, subCity, etc.)
}

export interface AuthResponse {
    token: string;
    id: string;
    email: string;
    phoneNumber: string;
}

// API CALLS
export const loginUser = async (data: LoginPayload): Promise<AuthResponse> => {
    // Apply phone formatting if it's a phone number
    const formattedData = {
        ...data,
        emailOrPhone: formatPhoneNumber(data.emailOrPhone)
    };
    // Backend expects JSON for signin based on Gadal_Market_Frontend reference
    const response = await apiClient.post('auth/signin', formattedData);
    return response.data;
};

export const registerUser = async (data: any) => {
    try {
        let payload = data;
        if (!(data instanceof FormData)) {
            payload = new FormData();
            Object.keys(data).forEach(key => {
                payload.append(key, data[key]);
            });
        }

        const response = await apiClient.post('auth/signup', payload, {
            headers: { "Content-Type": 'multipart/form-data' }
        });
        return response.data;
    } catch (error: any) {
        console.error(error);
        throw new Error(error?.response?.data || error.message);
    }
};

export const getOtp = async (phoneNumber: string) => {
    const formattedPhone = formatPhoneNumber(phoneNumber);
    const formData = new FormData();
    formData.append('phoneNumber', formattedPhone);
    const response = await apiClient.post('auth/manuallyVerifyPhone', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data; // returns { verificationId }
};

export const verifyPhoneRequest = async (phoneNumber: string) => {
    const formattedPhone = formatPhoneNumber(phoneNumber);
    // Kept for backward compatibility if used elsewhere, but getOtp is preferred based on new requirements
    const formData = new FormData();
    formData.append('phoneNumber', formattedPhone);
    const response = await apiClient.post('auth/manuallyVerifyPhone', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data; // returns { verificationId }
};

export const confirmOtp = async (verificationId: string, phoneNumber: string, code: string) => {
    const formData = new FormData();
    formData.append('verificationId', verificationId);
    formData.append('phoneNumber', phoneNumber);
    formData.append('code', code);

    const response = await apiClient.post('auth/confirmOtp', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
};

export const resetPassword = async (phoneNumber: string, password: string) => {
    // The backend route is PUT /auth/resetPassword and req.body destructures password, phoneNumber
    // It does not use multer().none() middleware in the router definition?
    // router.put("/auth/resetPassword", async (req, res) => { ... })
    // So JSON should be fine here.

    const formattedPhone = formatPhoneNumber(phoneNumber);
    const response = await apiClient.put('auth/resetPassword', { phoneNumber: formattedPhone, password });
    return response.data;
};

// HOOKS
export const useLogin = () => {
    return useMutation({ mutationFn: loginUser });
};

export const useRegister = () => {
    return useMutation({ mutationFn: registerUser });
};

export const useVerifyPhone = () => {
    return useMutation({ mutationFn: verifyPhoneRequest });
};

export const useGetOtp = () => {
    return useMutation({ mutationFn: getOtp });
};

export const useConfirmOtp = () => {
    return useMutation({
        mutationFn: (data: { vid: string, phone: string, code: string }) => confirmOtp(data.vid, data.phone, data.code)
    });
};

export const useResetPassword = () => {
    return useMutation({
        mutationFn: (data: { phone: string, pass: string }) => resetPassword(data.phone, data.pass)
    });
};
