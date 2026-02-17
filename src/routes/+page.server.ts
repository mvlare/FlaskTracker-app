import { db } from '$lib/server/db';
import { flasks } from '$lib/server/db/schema';
import { eq, ilike, or, sql, desc, asc } from 'drizzle-orm';
import type { PageServerLoad, Actions } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { processRemarks } from '$lib/server/utils/validation';
import { updateAuditFields } from '$lib/server/utils/audit';

export const load: PageServerLoad = async ({ url, locals }) => {
	// Require authentication
	if (!locals.session) {
		throw redirect(303, '/auth/signin');
	}
	// Get query parameters
	const page = parseInt(url.searchParams.get('page') || '1');
	const limit = 15;
	const offset = (page - 1) * limit;

	const flaskSearch = url.searchParams.get('flaskSearch') ?? '';
	const boxSearch = url.searchParams.get('boxSearch') || '';
	const sortBy = url.searchParams.get('sortBy') || 'flask';
	const sortOrder = url.searchParams.get('sortOrder') || 'desc';

	try {
		// Correlated subquery: pick one box name per flask
		// Priority: open shipment (returned_at IS NULL) first, then most recently returned
		// Written as raw SQL with aliases to avoid Drizzle stripping table qualifiers
		const boxNameSubquery = sql<string | null>`(
			SELECT bx.name
			FROM box_content_lines bcl
			JOIN box_content_headers bch ON bcl.box_content_header_id = bch.id
			JOIN boxes bx ON bch.box_id = bx.id
			WHERE bcl.flask_id = flasks.id
			ORDER BY (bch.returned_at IS NOT NULL), bch.returned_at DESC NULLS LAST
			LIMIT 1
		)`;

		// Build the query — no JOINs needed, subquery handles box name
		let query = db
			.select({
				id: flasks.id,
				name: flasks.name,
				remarks: flasks.remarks,
				brokenAt: flasks.brokenAt,
				boxName: boxNameSubquery
			})
			.from(flasks)
			.$dynamic();

		// Apply filters
		const conditions = [];
		// Only filter flasks if search is not empty
		if (flaskSearch) {
			conditions.push(ilike(flasks.name, `%${flaskSearch}%`));
		}
		if (boxSearch) {
			conditions.push(sql`${boxNameSubquery} ILIKE ${`%${boxSearch}%`}`);
		}

		if (conditions.length > 0) {
			query = query.where(or(...conditions));
		}

		// Apply sorting
		if (sortBy === 'flask') {
			query = sortOrder === 'asc' ? query.orderBy(asc(flasks.name)) : query.orderBy(desc(flasks.name));
		} else if (sortBy === 'box') {
			query = sortOrder === 'asc'
				? query.orderBy(sql`${boxNameSubquery} ASC NULLS LAST`)
				: query.orderBy(sql`${boxNameSubquery} DESC NULLS FIRST`);
		}

		// Apply pagination
		query = query.limit(limit).offset(offset);

		const results = await query;

		// Get total count for pagination — no JOINs, each flask is exactly one row
		let countQuery = db
			.select({ count: sql<number>`count(*)` })
			.from(flasks)
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
		const remarksRaw = formData.get('remarks');

		// Validate input
		if (!flaskId || isNaN(flaskId)) {
			return fail(400, { error: 'Invalid flask ID' });
		}

		try {
			// Update the flask remarks with audit trail
			const updateData = {
				remarks: processRemarks(remarksRaw),
				...updateAuditFields(locals.user.id)
			};

			console.log('Updating remarks for flask', flaskId, ':', JSON.stringify(updateData, null, 2));

			await db.update(flasks).set(updateData).where(eq(flasks.id, flaskId));

			return { success: true };
		} catch (error) {
			console.error('Error updating remarks:', error);
			return fail(500, { error: 'Failed to update remarks' });
		}
	}
};
