import { format, isToday, isYesterday, differenceInDays } from 'date-fns';

/**
 * Formats an ISO date string into a user-friendly posting date representation.
 * Examples: "Posted Today", "Posted Yesterday", "Posted 3 days ago", "Posted Aug 10, 2026"
 */
export const formatPostDate = (dateString?: string): string => {
    if (!dateString) return '';
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '';

        if (isToday(date)) {
            return 'Posted Today';
        }
        if (isYesterday(date)) {
            return 'Posted Yesterday';
        }
        const daysDiff = differenceInDays(new Date(), date);
        if (daysDiff > 0 && daysDiff < 7) {
            return `Posted ${daysDiff} days ago`;
        }
        return `Posted ${format(date, 'MMM d, yyyy')}`;
    } catch (e) {
        return '';
    }
};
