/**
 * Cleans up backend validation errors to be more user-friendly.
 * Example: "Product validation failed: subCity: subCity is required" -> "subCity is required"
 */
export const cleanErrorMessage = (error: any): string => {
    if (typeof error === 'string') return error;

    if (typeof error?.response?.data === 'string') return error.response.data;

    const normalizeMessage = (value: any): string => {
        if (!value) return '';
        if (typeof value === 'string') return value;
        if (Array.isArray(value)) return value.map(normalizeMessage).filter(Boolean).join(', ');
        if (typeof value === 'object') {
            return Object.entries(value)
                .map(([key, nestedValue]) => `${key}: ${normalizeMessage(nestedValue)}`)
                .filter(Boolean)
                .join('; ');
        }
        return String(value);
    };

    const rawMessage = normalizeMessage(
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.response?.data?.details?.message ||
        error?.message
    ) || 'Something went wrong';

    // Pattern for Mongoose validation errors
    if (rawMessage.includes('validation failed:')) {
        const parts = rawMessage.split(':');
        if (parts.length > 2) {
            // Get the last part or the specific field message
            return parts[parts.length - 1].trim();
        }
    }

    // General cleanup for common patterns
    return rawMessage
        .replace('Error:', '')
        .replace('Network Error', 'Connection failed. Please check your internet.')
        .trim();
};
