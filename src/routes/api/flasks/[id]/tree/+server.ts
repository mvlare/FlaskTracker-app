import { db } from '$lib/server/db';
import { json } from '@sveltejs/kit';
import { sql } from 'drizzle-orm';
import type { RequestHandler } from './$types';

interface FlaskTreeRow extends Record<string, unknown> {
	flask_id: number;
	flask_name: string;
	flask_broken_at: Date | null;
	flask_ref_type_name: string;
}

export const GET: RequestHandler = async ({ locals, params }) => {
	// Auth check
	if (!locals.session) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	// Validate flaskId
	const flaskId = parseInt(params.id);
	if (isNaN(flaskId)) {
		return json({ error: 'Invalid flask ID' }, { status: 400 });
	}

	try {
		// Call PostgreSQL function
		const result = await db.execute<FlaskTreeRow>(
			sql`SELECT * FROM get_flask_ref_tree(${flaskId})`
		);

		return json({
			treeData: result.rows || []
		});
	} catch (error) {
		console.error('Error loading flask tree:', error);
		return json({ error: 'Failed to load tree data' }, { status: 500 });
	}
};
