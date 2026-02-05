import { format, parseISO } from 'date-fns';

/**
 * Format a date for display in YYYY-MM-DD format
 * @param date - The date to format (Date object or ISO string)
 * @param timezone - User's timezone (currently unused, as we display UTC directly)
 * @returns Formatted date string or empty string if date is null/undefined
 */
export function formatDateDisplay(date: Date | string | null | undefined): string {
	if (!date) return '';

	try {
		const dateObj = typeof date === 'string' ? parseISO(date) : date;
		return format(dateObj, 'yyyy-MM-dd');
	} catch (error) {
		console.error('Error formatting date:', error);
		return '';
	}
}

/**
 * Parse a date string to UTC Date object
 * @param dateString - Date string to parse
 * @param timezone - User's timezone (for future implementation)
 * @returns Date object or null if invalid
 */
export function parseToUTC(dateString: string | null | undefined): Date | null {
	if (!dateString) return null;

	try {
		return parseISO(dateString);
	} catch (error) {
		console.error('Error parsing date:', error);
		return null;
	}
}
