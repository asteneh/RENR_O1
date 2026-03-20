/**
 * Cleans up backend validation errors to be more user-friendly.
 * Example: "Product validation failed: subCity: subCity is required" -> "subCity is required"
 */
export const cleanErrorMessage = (error: any): string => {
    if (typeof error === 'string') return error;

    const rawMessage = error?.response?.data?.message || error?.message || 'Something went wrong';

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
