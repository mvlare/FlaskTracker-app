import { db } from '$lib/server/db';
import { boxes } from '$lib/server/db/schema';
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

		// Process remarks - handle null, undefined, or empty string
		const remarksTrimmed = remarksRaw ? String(remarksRaw).trim() : '';
		const remarksValue = remarksTrimmed || null;

		// Validate required fields
		if (!name || name.trim() === '') {
			return fail(400, { error: 'Box name is required' });
		}

		try {
			// Insert the new box
			const insertData = {
				name: name.trim(),
				remarks: remarksValue,
				createdUserId: locals.user.id,
				updatedUserId: locals.user.id
			};

			await db.insert(boxes).values(insertData);
		} catch (error) {
			console.error('Error creating box:', error);

			// Check for unique constraint violation (PostgreSQL error code 23505)
			// Drizzle wraps the PostgreSQL error in error.cause
			if (
				(error as any).code === '23505' ||
				(error as any).cause?.code === '23505' ||
				(error instanceof Error && error.message.toLowerCase().includes('unique'))
			) {
				return fail(400, { error: 'A box with this name already exists' });
			}

			return fail(500, { error: 'Failed to create box' });
		}

		// Redirect to the main page (outside try-catch)
		throw redirect(303, '/');
	}
};
