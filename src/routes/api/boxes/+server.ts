import { db } from '$lib/server/db';
import { boxes, boxContentHeaders } from '$lib/server/db/schema';
import { desc, asc, and, isNull, eq } from 'drizzle-orm';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals, url }) => {
	if (!locals.session) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const orderBy = url.searchParams.get('orderBy') || 'name';
	const order = url.searchParams.get('order') || 'desc';

	const result = await db
		.select({
			id: boxes.id,
			name: boxes.name,
			pickedUpAt: boxContentHeaders.pickedUpAt
		})
		.from(boxes)
		.leftJoin(
			boxContentHeaders,
			and(eq(boxContentHeaders.boxId, boxes.id), isNull(boxContentHeaders.returnedAt))
		)
		.orderBy(order === 'desc' ? desc(boxes.name) : asc(boxes.name));

	return json(result);
};
