import { format, parseISO } from 'date-fns';
import { CalendarDate } from '@internationalized/date';

/**
 * Format a date for display in DD-MM-YYYY format (Netherlands locale)
 * @param date - The date to format (Date object or ISO string)
 * @param timezone - User's timezone (currently unused, as we display UTC directly)
 * @returns Formatted date string or empty string if date is null/undefined
 */
export function formatDateDisplay(date: Date | string | null | undefined): string {
	if (!date) return '';

	try {
		const dateObj = typeof date === 'string' ? parseISO(date) : date;
		return format(dateObj, 'dd-MM-yyyy');
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

/**
 * Convert a JavaScript Date to CalendarDate for use with date picker
 * @param date - The date to convert (Date object)
 * @returns CalendarDate or undefined if date is null
 */
export function dateToCalendarDate(date: Date | null): CalendarDate | undefined {
	if (!date) return undefined;

	try {
		const year = date.getUTCFullYear();
		const month = date.getUTCMonth() + 1; // CalendarDate months are 1-indexed
		const day = date.getUTCDate();
		return new CalendarDate(year, month, day);
	} catch (error) {
		console.error('Error converting Date to CalendarDate:', error);
		return undefined;
	}
}

/**
 * Convert a CalendarDate to JavaScript Date (UTC midnight)
 * @param calendarDate - The CalendarDate to convert
 * @returns Date object (UTC midnight) or null if undefined
 */
export function calendarDateToDate(calendarDate: CalendarDate | undefined): Date | null {
	if (!calendarDate) return null;

	try {
		// Create UTC Date at midnight
		return new Date(Date.UTC(calendarDate.year, calendarDate.month - 1, calendarDate.day));
	} catch (error) {
		console.error('Error converting CalendarDate to Date:', error);
		return null;
	}
}

/**
 * Format a date for form submission in YYYY-MM-DD format (HTML standard)
 * @param date - The date to format (Date object)
 * @returns Date string in YYYY-MM-DD format or empty string if null
 */
export function formatForSubmission(date: Date | null): string {
	if (!date) return '';

	try {
		return format(date, 'yyyy-MM-dd');
	} catch (error) {
		console.error('Error formatting date for submission:', error);
		return '';
	}
}
