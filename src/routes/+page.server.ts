import { db } from '$lib/server/db';
import { flasks, boxes, boxContentLines, boxContentHeaders } from '$lib/server/db/schema';
import { eq, ilike, or, sql, desc, asc } from 'drizzle-orm';
import type { PageServerLoad, Actions } from './$types';
import { fail, redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ url, locals }) => {
	// Require authentication
	if (!locals.session) {
		throw redirect(303, '/auth/signin');
	}
	// Get query parameters
	const page = parseInt(url.searchParams.get('page') || '1');
	const limit = 15;
	const offset = (page - 1) * limit;

	const flaskSearch = url.searchParams.get('flaskSearch') ?? 'UU-1-';
	const boxSearch = url.searchParams.get('boxSearch') || '';
	const sortBy = url.searchParams.get('sortBy') || 'flask';
	const sortOrder = url.searchParams.get('sortOrder') || 'desc';

	try {
		// Build the query with left joins to get box information
		let query = db
			.select({
				id: flasks.id,
				name: flasks.name,
				remarks: flasks.remarks,
				brokenAt: flasks.brokenAt,
				lowPressureAt: flasks.lowPressureAt,
				boxName: boxes.name
			})
			.from(flasks)
			.leftJoin(boxContentLines, eq(flasks.id, boxContentLines.flaskId))
			.leftJoin(
				boxContentHeaders,
				eq(boxContentLines.boxContentHeaderId, boxContentHeaders.id)
			)
			.leftJoin(boxes, eq(boxContentHeaders.boxId, boxes.id))
			.$dynamic();

		// Apply filters
		const conditions = [];
		// Only filter flasks if search is not empty and not just the default prefix
		if (flaskSearch && flaskSearch !== 'UU-1-') {
			conditions.push(ilike(flasks.name, `%${flaskSearch}%`));
		}
		if (boxSearch) {
			conditions.push(ilike(boxes.name, `%${boxSearch}%`));
		}

		if (conditions.length > 0) {
			query = query.where(or(...conditions));
		}

		// Apply sorting
		if (sortBy === 'flask') {
			query = sortOrder === 'asc' ? query.orderBy(asc(flasks.name)) : query.orderBy(desc(flasks.name));
		} else if (sortBy === 'box') {
			query = sortOrder === 'asc' ? query.orderBy(asc(boxes.name)) : query.orderBy(desc(boxes.name));
		}

		// Apply pagination
		query = query.limit(limit).offset(offset);

		const results = await query;

		// Get total count for pagination
		let countQuery = db
			.select({ count: sql<number>`count(DISTINCT ${flasks.id})` })
			.from(flasks)
			.leftJoin(boxContentLines, eq(flasks.id, boxContentLines.flaskId))
			.leftJoin(
				boxContentHeaders,
				eq(boxContentLines.boxContentHeaderId, boxContentHeaders.id)
			)
			.leftJoin(boxes, eq(boxContentHeaders.boxId, boxes.id))
			.$dynamic();

		if (conditions.length > 0) {
			countQuery = countQuery.where(or(...conditions));
		}

		const [{ count: totalCount }] = await countQuery;
		const totalPages = Math.ceil(totalCount / limit);

		return {
			flasks: results,
			pagination: {
				page,
				limit,
				totalCount,
				totalPages
			},
			filters: {
				flaskSearch,
				boxSearch,
				sortBy,
				sortOrder
			}
		};
	} catch (error) {
		console.error('Error loading flasks:', error);
		return {
			flasks: [],
			pagination: {
				page: 1,
				limit: 15,
				totalCount: 0,
				totalPages: 0
			},
			filters: {
				flaskSearch: '',
				boxSearch: '',
				sortBy: 'flask',
				sortOrder: 'desc'
			},
			error: 'Failed to load flasks data'
		};
	}
};

export const actions: Actions = {
	updateRemarks: async ({ request, locals }) => {
		// Require authentication
		if (!locals.session || !locals.user) {
			return fail(401, { error: 'Unauthorized' });
		}

		const formData = await request.formData();
		const flaskId = parseInt(formData.get('flaskId') as string);
		const remarks = formData.get('remarks') as string;

		// Validate input
		if (!flaskId || isNaN(flaskId)) {
			return fail(400, { error: 'Invalid flask ID' });
		}

		try {
			// Update the flask remarks in the database with audit trail
			await db
				.update(flasks)
				.set({
					remarks: remarks || null,
					updatedAt: new Date(),
					updatedUserId: locals.user.id // Populate audit field
				})
				.where(eq(flasks.id, flaskId));

			return { success: true };
		} catch (error) {
			console.error('Error updating remarks:', error);
			return fail(500, { error: 'Failed to update remarks' });
		}
	}
};
