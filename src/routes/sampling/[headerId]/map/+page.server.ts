import type { PageServerLoad } from './$types';
import { redirect, error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { boxContentHeaders, boxContentLines } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const load: PageServerLoad = async ({ params, url, locals }) => {
	if (!locals.session) {
		throw redirect(303, '/auth/signin');
	}

	const headerId = parseInt(params.headerId);
	if (isNaN(headerId)) {
		throw error(400, 'Invalid shipment ID');
	}

	const header = await db.query.boxContentHeaders.findFirst({
		where: eq(boxContentHeaders.id, headerId),
		with: { box: true }
	});

	if (!header) {
		throw error(404, 'Shipment not found');
	}

	const linesData = await db.query.boxContentLines.findMany({
		where: eq(boxContentLines.boxContentHeaderId, headerId),
		with: { flask: { columns: { id: true, name: true } } }
	});

	return {
		header,
		box: header.box,
		lines: linesData,
		boxId: url.searchParams.get('boxId')
	};
};
