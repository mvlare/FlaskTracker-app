import { db } from '$lib/server/db';
import { flaskLowPressureEvents } from '$lib/server/db/schema';
import { eq, desc } from 'drizzle-orm';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals, params }) => {
	// Require authentication
	if (!locals.session) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const flaskId = parseInt(params.id);
	if (isNaN(flaskId)) {
		return json({ error: 'Invalid flask ID' }, { status: 404 });
	}

	// Query for the most recent low pressure event
	const latestEvent = await db.query.flaskLowPressureEvents.findFirst({
		where: eq(flaskLowPressureEvents.flaskId, flaskId),
		orderBy: [desc(flaskLowPressureEvents.lowPressureAt)],
		columns: { lowPressureAt: true }
	});

	return json({
		latestLowPressureAt: latestEvent ? latestEvent.lowPressureAt.toISOString() : null
	});
};
