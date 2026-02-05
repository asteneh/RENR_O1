/**
 * Formats a phone number for the API.
 * Specifically converts Ethiopian numbers starting with +2519 to 09 format.
 * @param phone The full phone number including dial code (e.g., +2519...)
 * @returns The formatted phone number (e.g., 09...)
 */
export const formatPhoneNumber = (phone: string): string => {
    if (phone.startsWith('+2519')) {
        return '09' + phone.substring(5);
    }
    if (phone.startsWith('+2517')) {
        return '07' + phone.substring(5);
    }
    return phone;
};
