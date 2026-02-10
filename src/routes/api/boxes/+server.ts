import { db } from '$lib/server/db';
import { boxes } from '$lib/server/db/schema';
import { desc, asc } from 'drizzle-orm';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals, url }) => {
	if (!locals.session) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const orderBy = url.searchParams.get('orderBy') || 'name';
	const order = url.searchParams.get('order') || 'desc';

	const allBoxes = await db.query.boxes.findMany({
		orderBy: order === 'desc' ? desc(boxes.name) : asc(boxes.name),
		columns: { id: true, name: true }
	});

	return json(allBoxes);
};
