import { db } from '$lib/server/db';
import { flasks, flaskLowPressureEvents } from '$lib/server/db/schema';
import type { PageServerLoad, Actions } from './$types';
import { fail, redirect, error } from '@sveltejs/kit';
import { eq, desc, and } from 'drizzle-orm';

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

		// Process remarks - handle null, undefined, or empty string
		const remarksTrimmed = remarksRaw ? String(remarksRaw).trim() : '';
		const remarksValue = remarksTrimmed || null;

		// Validate required fields
		if (!name || name.trim() === '') {
			return fail(400, { error: 'Flask name is required' });
		}

		try {
			// Parse dates if provided (convert to UTC)
			const brokenAtDate =
				brokenAtRaw && String(brokenAtRaw).trim()
					? new Date(String(brokenAtRaw).trim() + 'T00:00:00Z')
					: null;

			// Update the flask
			await db
				.update(flasks)
				.set({
					name: name.trim(),
					remarks: remarksValue,
					brokenAt: brokenAtDate,
					updatedAt: new Date(),
					updatedUserId: locals.user.id
				})
				.where(eq(flasks.id, flaskId));
		} catch (error) {
			console.error('Error updating flask:', error);

			// Check for unique constraint violation (PostgreSQL error code 23505)
			// Drizzle wraps the PostgreSQL error in error.cause
			if (
				(error as any).code === '23505' ||
				(error as any).cause?.code === '23505' ||
				(error instanceof Error && error.message.toLowerCase().includes('unique'))
			) {
				return fail(400, { error: 'A flask with this name already exists' });
			}

			return fail(500, { error: 'Failed to update flask' });
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
		if (!lowPressureAtRaw || String(lowPressureAtRaw).trim() === '') {
			return fail(400, { error: 'Low pressure date is required' });
		}

		// Parse date (UTC midnight)
		const dateStr = String(lowPressureAtRaw).trim();
		const lowPressureAt = new Date(dateStr + 'T00:00:00Z');

		if (isNaN(lowPressureAt.getTime())) {
			return fail(400, { error: 'Invalid date format' });
		}

		// Reject future dates (allow today)
		const today = new Date();
		today.setUTCHours(0, 0, 0, 0);
		if (lowPressureAt > today) {
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
