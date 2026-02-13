import { db } from '$lib/server/db';
import { flasks, flaskLowPressureEvents } from '$lib/server/db/schema';
import type { PageServerLoad, Actions } from './$types';
import { fail, redirect, error } from '@sveltejs/kit';
import { eq, desc, and } from 'drizzle-orm';
import {
	validateRequired,
	processRemarks,
	parseDateToUTC,
	validateDateNotFuture
} from '$lib/server/utils/validation';
import { handleDatabaseError } from '$lib/server/utils/error-handling';
import { updateAuditFields } from '$lib/server/utils/audit';

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

	return {
		flask,
		lowPressureEvents: lowPressureEventsData.map((e) => ({
			id: e.id,
			lowPressureAt: e.lowPressureAt.toISOString().split('T')[0] // Date only
		}))
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

		try {
			// Process inputs using utilities
			const remarksValue = processRemarks(remarksRaw);
			const brokenAtDate = parseDateToUTC(brokenAtRaw ? String(brokenAtRaw) : null);

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
	}
};
