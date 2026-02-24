import { db } from '$lib/server/db';
import { flasks, flaskLowPressureEvents, flasksRef, flaskRefType, boxContentLines } from '$lib/server/db/schema';
import type { PageServerLoad, Actions } from './$types';
import { fail, redirect, error } from '@sveltejs/kit';
import { eq, desc, and, gt } from 'drizzle-orm';
import {
	validateRequired,
	processRemarks,
	parseDateToUTC,
	validateDateNotFuture
} from '$lib/server/utils/validation';
import { handleDatabaseError, handleFlaskRefError } from '$lib/server/utils/error-handling';
import { updateAuditFields, createAuditFields } from '$lib/server/utils/audit';

export const load: PageServerLoad = async ({ params, locals }) => {
	// Require authentication
	if (!locals.session) {
		throw redirect(303, '/auth/signin');
	}

	const flaskId = parseInt(params.id);
	if (isNaN(flaskId)) {
		throw error(404, 'Flask not found');
	}

	const flask = await db.query.flasks.findFirst({
		where: eq(flasks.id, flaskId)
	});

	if (!flask) {
		throw error(404, 'Flask not found');
	}

	// Load low pressure events (most recent first)
	const lowPressureEventsData = await db.query.flaskLowPressureEvents.findMany({
		where: eq(flaskLowPressureEvents.flaskId, flaskId),
		orderBy: [desc(flaskLowPressureEvents.lowPressureAt)]
	});

	// Check if this flask is referenced in any shipment — if so, name cannot be changed
	const inShipment = await db.query.boxContentLines.findFirst({
		where: eq(boxContentLines.flaskId, flaskId),
		columns: { id: true }
	});

	// Check if broken date is locked — resolve chain root first, then check for a successor
	const flaskAsNew = await db.query.flasksRef.findFirst({
		where: eq(flasksRef.newFlaskId, flaskId),
		columns: { originalFlaskId: true }
	});
	const rootId = flaskAsNew?.originalFlaskId ?? flaskId;
	const hasRepairedSuccessor = await db.query.flasksRef.findFirst({
		where: and(eq(flasksRef.originalFlaskId, rootId), gt(flasksRef.newFlaskId, flaskId)),
		columns: { id: true }
	});

	return {
		flask,
		lowPressureEvents: lowPressureEventsData.map((e) => ({
			id: e.id,
			lowPressureAt: e.lowPressureAt.toISOString().split('T')[0] // Date only
		})),
		nameReadOnly: !!inShipment,
		brokenAtReadOnly: !!hasRepairedSuccessor
	};
};

export const actions: Actions = {
	update: async ({ request, params, locals }) => {
		// Require authentication
		if (!locals.session || !locals.user) {
			return fail(401, { error: 'Unauthorized' });
		}

		const flaskId = parseInt(params.id);
		if (isNaN(flaskId)) {
			return fail(404, { error: 'Flask not found' });
		}

		const formData = await request.formData();
		const name = formData.get('name') as string;
		const remarksRaw = formData.get('remarks');
		const brokenAtRaw = formData.get('brokenAt');

		// Validate required fields
		const nameError = validateRequired(name, 'Flask name');
		if (nameError) {
			return fail(400, { error: nameError });
		}

		// Block name change if the flask is used in any shipment
		const currentFlask = await db.query.flasks.findFirst({
			where: eq(flasks.id, flaskId),
			columns: { name: true, brokenAt: true }
		});

		if (currentFlask && name.trim() !== currentFlask.name) {
			const inShipment = await db.query.boxContentLines.findFirst({
				where: eq(boxContentLines.flaskId, flaskId),
				columns: { id: true }
			});
			if (inShipment) {
				return fail(400, { error: 'Flask name cannot be changed because it is used in a shipment.' });
			}
		}

		// If a repaired successor with a higher ID exists, preserve the existing broken date
		// Resolve chain root first (middle flasks appear as newFlaskId, not originalFlaskId)
		const flaskAsNew = await db.query.flasksRef.findFirst({
			where: eq(flasksRef.newFlaskId, flaskId),
			columns: { originalFlaskId: true }
		});
		const rootId = flaskAsNew?.originalFlaskId ?? flaskId;
		const hasRepairedSuccessor = await db.query.flasksRef.findFirst({
			where: and(eq(flasksRef.originalFlaskId, rootId), gt(flasksRef.newFlaskId, flaskId)),
			columns: { id: true }
		});

		try {
			// Process inputs using utilities
			const remarksValue = processRemarks(remarksRaw);
			const brokenAtDate = hasRepairedSuccessor
				? (currentFlask?.brokenAt ?? null)
				: parseDateToUTC(brokenAtRaw ? String(brokenAtRaw) : null);

			// Update the flask with audit trail
			await db
				.update(flasks)
				.set({
					name: name.trim(),
					remarks: remarksValue,
					brokenAt: brokenAtDate,
					...updateAuditFields(locals.user.id)
				})
				.where(eq(flasks.id, flaskId));
		} catch (error) {
			const { status, message } = handleDatabaseError(error, 'flask');
			return fail(status, { error: message });
		}

		// Redirect to the main flasks page (outside try-catch)
		throw redirect(303, '/?flaskSearch=' + encodeURIComponent(name.trim()));
	},

	addLowPressureEvent: async ({ request, params, locals }) => {
		// Auth check
		if (!locals.session || !locals.user) {
			return fail(401, { error: 'Unauthorized' });
		}

		const flaskId = parseInt(params.id);
		if (isNaN(flaskId)) {
			return fail(404, { error: 'Flask not found' });
		}

		const formData = await request.formData();
		const lowPressureAtRaw = formData.get('lowPressureAt');

		// Validate date presence
		const dateError = validateRequired(
			lowPressureAtRaw ? String(lowPressureAtRaw) : null,
			'Low pressure date'
		);
		if (dateError) {
			return fail(400, { error: dateError });
		}

		// Parse date (UTC midnight)
		const lowPressureAt = parseDateToUTC(String(lowPressureAtRaw));

		if (!lowPressureAt || isNaN(lowPressureAt.getTime())) {
			return fail(400, { error: 'Invalid date format' });
		}

		// Reject future dates (allow today)
		if (!validateDateNotFuture(lowPressureAt)) {
			return fail(400, { error: 'Date cannot be in the future' });
		}

		try {
			// Check for duplicates
			const existing = await db.query.flaskLowPressureEvents.findFirst({
				where: and(
					eq(flaskLowPressureEvents.flaskId, flaskId),
					eq(flaskLowPressureEvents.lowPressureAt, lowPressureAt)
				)
			});

			if (existing) {
				return fail(400, { error: 'This date already exists' });
			}

			// Insert new event
			await db.insert(flaskLowPressureEvents).values({
				flaskId,
				lowPressureAt
			});

			return { success: true };
		} catch (error) {
			console.error('Error adding low pressure event:', error);
			return fail(500, { error: 'Failed to add low pressure event' });
		}
	},

	deleteLowPressureEvent: async ({ request, params, locals }) => {
		// Auth check
		if (!locals.session || !locals.user) {
			return fail(401, { error: 'Unauthorized' });
		}

		const formData = await request.formData();
		const eventIdRaw = formData.get('eventId');
		const eventId = parseInt(String(eventIdRaw));

		if (isNaN(eventId)) {
			return fail(400, { error: 'Invalid event ID' });
		}

		try {
			await db
				.delete(flaskLowPressureEvents)
				.where(eq(flaskLowPressureEvents.id, eventId));

			return { success: true };
		} catch (error) {
			console.error('Error deleting low pressure event:', error);
			return fail(500, { error: 'Failed to delete low pressure event' });
		}
	},

	addRepairedFlask: async ({ request, params, locals }) => {
		// Auth check
		if (!locals.session || !locals.user) {
			return fail(401, { error: 'Unauthorized' });
		}

		// Parse flask ID
		const flaskId = parseInt(params.id);
		if (isNaN(flaskId)) {
			return fail(404, { error: 'Flask not found' });
		}

		// Validate repaired flask name
		const formData = await request.formData();
		const repairedFlaskName = formData.get('repairedFlaskName') as string;
		const brokenAtRaw = formData.get('brokenAt');

		const nameError = validateRequired(repairedFlaskName, 'Repaired flask name');
		if (nameError) {
			return fail(400, { error: nameError });
		}

		// Parse broken date
		const brokenAtDate = parseDateToUTC(brokenAtRaw ? String(brokenAtRaw) : null);
		if (!brokenAtDate) {
			return fail(400, { error: 'Broken date is required to create a repaired flask' });
		}

		try {
			// Query flask_ref_type by name
			const repairedType = await db.query.flaskRefType.findFirst({
				where: eq(flaskRefType.name, 'Repaired'),
				columns: { id: true }
			});

			if (!repairedType) {
				return fail(500, { error: 'Repaired reference type not found in database' });
			}

			// Find the root original_flask_id for this tree
			// If the current flask is referenced as newFlaskId, use its originalFlaskId
			// Otherwise, the current flask is the root, so use its own ID
			const currentFlaskRef = await db.query.flasksRef.findFirst({
				where: eq(flasksRef.newFlaskId, flaskId),
				columns: { originalFlaskId: true }
			});

			const rootOriginalFlaskId = currentFlaskRef ? currentFlaskRef.originalFlaskId : flaskId;

			// Update the original flask's broken date
			await db
				.update(flasks)
				.set({
					brokenAt: brokenAtDate,
					...updateAuditFields(locals.user.id)
				})
				.where(eq(flasks.id, flaskId));

			// Check if a flask with this name already exists
			const existingFlask = await db.query.flasks.findFirst({
				where: eq(flasks.name, repairedFlaskName.trim()),
				columns: { id: true }
			});

			let newFlaskId: number;
			let isNewFlask: boolean;

			if (existingFlask) {
				// Use the existing flask — skip creation
				newFlaskId = existingFlask.id;
				isNewFlask = false;
			} else {
				// Create a new flask
				const [newFlask] = await db
					.insert(flasks)
					.values({
						name: repairedFlaskName.trim(),
						remarks: null,
						brokenAt: null,
						...createAuditFields(locals.user.id)
					})
					.returning({ id: flasks.id });
				newFlaskId = newFlask.id;
				isNewFlask = true;
			}

			// Insert flask reference using the root original flask ID
			try {
				await db.insert(flasksRef).values({
					originalFlaskId: rootOriginalFlaskId,
					newFlaskId: newFlaskId,
					flaskRefTypeId: repairedType.id,
					...createAuditFields(locals.user.id)
				});
			} catch (refError) {
				const { status, message } = handleFlaskRefError(refError);
				if (isNewFlask) {
					return fail(status, {
						error: `${message}. The flask "${repairedFlaskName.trim()}" was created but the reference link failed.`
					});
				}
				return fail(status, { error: message });
			}

			return { success: true };
		} catch (error) {
			const { status, message } = handleDatabaseError(error, 'flask');
			return fail(status, { error: message });
		}
	}
};
