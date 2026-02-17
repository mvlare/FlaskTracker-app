import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { flasks, boxContentLines, boxContentHeaders } from '$lib/server/db/schema';
import { asc, eq, isNull, and, notExists } from 'drizzle-orm';

export const GET: RequestHandler = async ({ locals, url }) => {
	if (!locals.session) {
		return json([], { status: 401 });
	}

	const availableOnly = url.searchParams.get('availableOnly') === 'true';

	if (availableOnly) {
		// Exclude flasks that are currently in an active shipment (returned_at IS NULL)
		const flasksList = await db
			.select({ id: flasks.id, name: flasks.name })
			.from(flasks)
			.where(
				notExists(
					db
						.select({ id: boxContentLines.id })
						.from(boxContentLines)
						.innerJoin(
							boxContentHeaders,
							eq(boxContentLines.boxContentHeaderId, boxContentHeaders.id)
						)
						.where(
							and(
								eq(boxContentLines.flaskId, flasks.id),
								isNull(boxContentHeaders.returnedAt)
							)
						)
				)
			)
			.orderBy(asc(flasks.name));

		return json(flasksList);
	}

	const flasksList = await db.query.flasks.findMany({
		orderBy: asc(flasks.name),
		columns: { id: true, name: true }
	});

	return json(flasksList);
};
