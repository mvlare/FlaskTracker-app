/**
 * Validation utilities for FlaskTracker application
 * Centralizes common validation logic to reduce duplication
 */

/**
 * Validates that a required field is not empty
 * @param value - The value to validate
 * @param fieldName - Name of the field for error messages
 * @returns Error message if invalid, null if valid
 */
export function validateRequired(
	value: string | null | undefined,
	fieldName: string
): string | null {
	if (!value || value.trim() === '') {
		return `${fieldName} is required`;
	}
	return null;
}

/**
 * Processes remarks field - trims whitespace and converts empty to null
 * Used consistently across flask and box creation/updates
 * @param remarksRaw - Raw remarks value from form data
 * @returns Trimmed remarks or null if empty
 */
export function processRemarks(remarksRaw: FormDataEntryValue | null): string | null {
	const remarksTrimmed = remarksRaw ? String(remarksRaw).trim() : '';
	return remarksTrimmed || null;
}

/**
 * Parses date string to UTC midnight Date object
 * Appends 'T00:00:00Z' to ensure UTC interpretation
 * @param dateString - Date string from HTML date input (YYYY-MM-DD)
 * @returns Date object at UTC midnight, or null if no date provided
 */
export function parseDateToUTC(dateString: string | null): Date | null {
	if (!dateString || String(dateString).trim() === '') {
		return null;
	}
	return new Date(String(dateString).trim() + 'T00:00:00Z');
}

/**
 * Validates that a date is not in the future
 * Allows today's date
 * @param date - Date to validate
 * @returns true if date is valid (today or past), false if future
 */
export function validateDateNotFuture(date: Date): boolean {
	const today = new Date();
	today.setHours(0, 0, 0, 0);
	return date <= today;
}

/**
 * Validates that a date is not in the past
 * Allows today's date
 * @param date - Date to validate
 * @returns true if date is valid (today or future), false if past
 */
export function validateDateNotPast(date: Date): boolean {
	const today = new Date();
	today.setHours(0, 0, 0, 0);
	return date >= today;
}

/**
 * Validates password meets minimum requirements
 * @param password - Password to validate
 * @returns Validation result with error message if invalid
 */
export function validatePassword(password: string): { valid: boolean; error?: string } {
	if (!password || password.length < 8) {
		return { valid: false, error: 'Password must be at least 8 characters long' };
	}
	return { valid: true };
}

/**
 * Basic email validation
 * @param email - Email to validate
 * @returns true if email format is valid
 */
export function validateEmail(email: string): boolean {
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	return emailRegex.test(email);
}

/**
 * Validates flask reference IDs
 * @param originalFlaskId - ID of original flask
 * @param newFlaskId - ID of new flask
 * @returns Error message if invalid, null if valid
 */
export function validateFlaskReference(
	originalFlaskId: number | null | undefined,
	newFlaskId: number | null | undefined
): string | null {
	if (!originalFlaskId || !newFlaskId) {
		return 'Both original and new flask must be specified';
	}

	if (originalFlaskId === newFlaskId) {
		return 'Original flask and new flask cannot be the same';
	}

	return null;
}
