/**
 * Error handling utilities for FlaskTracker application
 * Centralizes database error detection and formatting
 */

/**
 * Checks if error is a PostgreSQL unique constraint violation (error code 23505)
 * Handles Drizzle ORM's error wrapping
 * @param error - Error object from database operation
 * @returns true if unique constraint violation
 */
export function isUniqueConstraintViolation(error: unknown): boolean {
	return (
		(error as any).code === '23505' ||
		(error as any).cause?.code === '23505' ||
		(error instanceof Error && error.message.toLowerCase().includes('unique'))
	);
}

/**
 * Checks if error is a PostgreSQL foreign key violation (error code 23503)
 * @param error - Error object from database operation
 * @returns true if foreign key violation
 */
export function isForeignKeyViolation(error: unknown): boolean {
	return (error as any).code === '23503' || (error as any).cause?.code === '23503';
}

/**
 * Handles database errors and returns appropriate HTTP response
 * @param error - Error object from database operation
 * @param entityName - Name of entity for error messages (e.g., "flask", "box")
 * @param fieldName - Name of field for unique constraint errors (default: "name")
 * @returns Object with status code and error message
 */
export function handleDatabaseError(
	error: unknown,
	entityName: string,
	fieldName: string = 'name'
): { status: number; message: string } {
	// Log error for debugging
	console.error(`Error with ${entityName}:`, error);

	// Check for specific error types
	if (isUniqueConstraintViolation(error)) {
		return {
			status: 400,
			message: `A ${entityName} with this ${fieldName} already exists`
		};
	}

	if (isForeignKeyViolation(error)) {
		return {
			status: 400,
			message: `Cannot delete ${entityName} because it is referenced by other records`
		};
	}

	// Generic database error
	return {
		status: 500,
		message: `Failed to save ${entityName}`
	};
}

/**
 * Logs error with context for debugging
 * @param error - Error object
 * @param context - Context description (e.g., "creating flask", "updating user")
 */
export function logError(error: unknown, context: string): void {
	console.error(`Error ${context}:`, error);
}

/**
 * Formats unique constraint error message
 * @param entityName - Name of entity (e.g., "flask", "box")
 * @param fieldName - Name of field (default: "name")
 * @returns Formatted error message
 */
export function formatUniqueConstraintError(
	entityName: string,
	fieldName: string = 'name'
): string {
	return `A ${entityName} with this ${fieldName} already exists`;
}
