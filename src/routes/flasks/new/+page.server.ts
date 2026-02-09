import { db } from '$lib/server/db';
import { flasks } from '$lib/server/db/schema';
import type { PageServerLoad, Actions } from './$types';
import { fail, redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals }) => {
	// Require authentication
	if (!locals.session) {
		throw redirect(303, '/auth/signin');
	}

	return {};
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		// Require authentication
		if (!locals.session || !locals.user) {
			return fail(401, { error: 'Unauthorized' });
		}

		const formData = await request.formData();
		const name = formData.get('name') as string;
		const remarksRaw = formData.get('remarks');
		const brokenAtRaw = formData.get('brokenAt');
		const lowPressureAtRaw = formData.get('lowPressureAt');

		// Process remarks - handle null, undefined, or empty string
		const remarksTrimmed = remarksRaw ? String(remarksRaw).trim() : '';
		const remarksValue = remarksTrimmed || null;

		// Validate required fields
		if (!name || name.trim() === '') {
			return fail(400, { error: 'Flask name is required' });
		}

		try {
			// Parse dates if provided (convert to UTC)
			const brokenAtDate = brokenAtRaw && String(brokenAtRaw).trim()
				? new Date(String(brokenAtRaw).trim() + 'T00:00:00Z')
				: null;
			const lowPressureAtDate = lowPressureAtRaw && String(lowPressureAtRaw).trim()
				? new Date(String(lowPressureAtRaw).trim() + 'T00:00:00Z')
				: null;

			// Insert the new flask
			const insertData = {
				name: name.trim(),
				remarks: remarksValue,
				brokenAt: brokenAtDate,
				lowPressureAt: lowPressureAtDate,
				createdUserId: locals.user.id,
				updatedUserId: locals.user.id
			};

			console.log('Inserting flask with data:', JSON.stringify(insertData, null, 2));

			await db.insert(flasks).values(insertData);

			// Redirect to the main flasks page
			throw redirect(303, '/?flaskSearch=' + encodeURIComponent(name.trim()));
		} catch (error) {
			console.error('Error creating flask:', error);

			// Check for unique constraint violation
			if (error instanceof Error && error.message.includes('unique')) {
				return fail(400, { error: 'A flask with this name already exists' });
			}

			return fail(500, { error: 'Failed to create flask' });
		}
	}
};
