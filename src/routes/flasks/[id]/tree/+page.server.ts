import { db } from '$lib/server/db';
import { flasks } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import type { PageServerLoad } from './$types';
import { error, redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params, locals }) => {
	// Require authentication
	if (!locals.session) {
		throw redirect(303, '/auth/signin');
	}

	const flaskId = parseInt(params.id);
	if (isNaN(flaskId)) {
		throw error(404, 'Flask not found');
	}

	// Only verify flask exists
	const flask = await db.query.flasks.findFirst({
		where: eq(flasks.id, flaskId)
	});

	if (!flask) {
		throw error(404, 'Flask not found');
	}

	return { flask };
};
