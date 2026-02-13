/**
 * Audit trail utilities for FlaskTracker application
 * Centralizes audit field generation for database operations
 */

export interface AuditFields {
	createdUserId: string;
	updatedUserId: string;
	createdAt: Date;
	updatedAt: Date;
}

export interface UpdateAuditFields {
	updatedUserId: string;
	updatedAt: Date;
}

/**
 * Generates audit fields for create operations
 * Sets both created and updated fields to current user and timestamp
 * @param userId - ID of user performing the operation
 * @returns Object with audit trail fields
 */
export function createAuditFields(userId: string): AuditFields {
	const now = new Date();
	return {
		createdUserId: userId,
		updatedUserId: userId,
		createdAt: now,
		updatedAt: now
	};
}

/**
 * Generates audit fields for update operations
 * Only sets updated fields to current user and timestamp
 * @param userId - ID of user performing the operation
 * @returns Object with update audit fields
 */
export function updateAuditFields(userId: string): UpdateAuditFields {
	return {
		updatedUserId: userId,
		updatedAt: new Date()
	};
}
