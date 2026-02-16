import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { flasks } from '$lib/server/db/schema';
import { asc } from 'drizzle-orm';

export const GET: RequestHandler = async ({ locals }) => {
	if (!locals.session) {
		return json([], { status: 401 });
	}

	const flasksList = await db.query.flasks.findMany({
		orderBy: asc(flasks.name),
		columns: { id: true, name: true }
	});

	return json(flasksList);
};
