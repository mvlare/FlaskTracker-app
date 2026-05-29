import type { PageServerLoad, Actions } from './$types';
import { fail, redirect, error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { boxContentHeaders, boxContentLines } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { validateRequired } from '$lib/server/utils/validation';
import { handleDatabaseError } from '$lib/server/utils/error-handling';
import { updateAuditFields } from '$lib/server/utils/audit';
import { parseCoordinate } from '$lib/server/utils/coordinates';

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

	const lines = linesData.sort((a, b) => a.id - b.id);

	return {
		header,
		box: header.box,
		lines,
		boxId: url.searchParams.get('boxId')
	};
};

export const actions: Actions = {
	pasteImport: async ({ request, locals }) => {
		if (!locals.session || !locals.user) {
			return fail(401, { error: 'Unauthorized' });
		}

		const formData = await request.formData();
		const rowsJson = formData.get('rows') as string;
		if (!rowsJson) return fail(400, { error: 'No paste data provided' });

		let rows: Array<{
			lineId: number;
			sampledAtDate: string;
			sampledAtTime: string;
			sampledLatRaw: string;
			sampledLonRaw: string;
			sampledInitialPressure: string;
			sampledLocalStartTime: string;
			sampledLocalStopFlushTime: string;
			sampledFinalPressure: string;
			sampledWindSpeedDirection: string;
			sampledShipSpeedDirection: string;
			sampledComments: string;
		}>;

		try {
			rows = JSON.parse(rowsJson);
		} catch {
			return fail(400, { error: 'Invalid paste data format' });
		}

		let imported = 0;
		for (const row of rows) {
			let sampledAt: Date | null = null;
			if (row.sampledAtDate && row.sampledAtTime) {
				sampledAt = new Date(`${row.sampledAtDate}T${row.sampledAtTime}:00Z`);
			} else if (row.sampledAtDate) {
				sampledAt = new Date(`${row.sampledAtDate}T00:00:00Z`);
			}

			const sampledInitialPressure = row.sampledInitialPressure ? parseFloat(row.sampledInitialPressure) : null;
			const sampledFinalPressure = row.sampledFinalPressure ? parseFloat(row.sampledFinalPressure) : null;
			const latRaw = row.sampledLatRaw?.trim() || null;
			const lonRaw = row.sampledLonRaw?.trim() || null;

			try {
				await db.update(boxContentLines).set({
					sampledAt,
					sampledLatRaw: latRaw,
					sampledLonRaw: lonRaw,
					sampledLat: latRaw ? parseCoordinate(latRaw) : null,
					sampledLon: lonRaw ? parseCoordinate(lonRaw) : null,
					sampledInitialPressure: isNaN(sampledInitialPressure!) ? null : sampledInitialPressure,
					sampledLocalStartTime: row.sampledLocalStartTime?.trim() || null,
					sampledLocalStopFlushTime: row.sampledLocalStopFlushTime?.trim() || null,
					sampledFinalPressure: isNaN(sampledFinalPressure!) ? null : sampledFinalPressure,
					sampledWindSpeedDirection: row.sampledWindSpeedDirection?.trim() || null,
					sampledShipSpeedDirection: row.sampledShipSpeedDirection?.trim() || null,
					sampledComments: row.sampledComments?.trim() || null,
					...updateAuditFields(locals.user.id)
				}).where(eq(boxContentLines.id, row.lineId));
				imported++;
			} catch {
				// skip failed rows
			}
		}

		return { success: true, pasteImported: imported };
	},

	clearLine: async ({ request, locals }) => {
		if (!locals.session || !locals.user) {
			return fail(401, { error: 'Unauthorized' });
		}

		const formData = await request.formData();
		const lineIdRaw = formData.get('lineId') as string;
		const lineId = parseInt(lineIdRaw);
		if (isNaN(lineId)) return fail(400, { error: 'Invalid line ID' });

		try {
			await db.update(boxContentLines).set({
				sampledAt: null,
				sampledLatRaw: null,
				sampledLonRaw: null,
				sampledLat: null,
				sampledLon: null,
				sampledInitialPressure: null,
				sampledLocalStartTime: null,
				sampledLocalStopFlushTime: null,
				sampledFinalPressure: null,
				sampledWindSpeedDirection: null,
				sampledShipSpeedDirection: null,
				sampledComments: null,
				...updateAuditFields(locals.user.id)
			}).where(eq(boxContentLines.id, lineId));

			return { success: true };
		} catch (err) {
			const { status, message } = handleDatabaseError(err, 'sampling data');
			return fail(status, { error: message });
		}
	},

	updateLine: async ({ request, locals }) => {
		if (!locals.session || !locals.user) {
			return fail(401, { error: 'Unauthorized' });
		}

		const formData = await request.formData();
		const lineIdRaw = formData.get('lineId') as string;
		const sampledAtDate = formData.get('sampledAtDate') as string;
		const sampledAtTime = formData.get('sampledAtTime') as string;
		const sampledLatRaw = formData.get('sampledLatRaw') as string;
		const sampledLonRaw = formData.get('sampledLonRaw') as string;
		const sampledInitialPressureRaw = formData.get('sampledInitialPressure') as string;
		const sampledLocalStartTime = formData.get('sampledLocalStartTime') as string || null;
		const sampledLocalStopFlushTime = formData.get('sampledLocalStopFlushTime') as string || null;
		const sampledFinalPressureRaw = formData.get('sampledFinalPressure') as string;
		const sampledWindSpeedDirection = formData.get('sampledWindSpeedDirection') as string;
		const sampledShipSpeedDirection = formData.get('sampledShipSpeedDirection') as string;
		const sampledComments = formData.get('sampledComments') as string;

		const lineIdError = validateRequired(lineIdRaw, 'Line');
		if (lineIdError) {
			return fail(400, { error: lineIdError });
		}

		const lineId = parseInt(lineIdRaw);

		// Build sampledAt timestamp: combine date + time if both provided
		let sampledAt: Date | null = null;
		if (sampledAtDate && sampledAtTime) {
			sampledAt = new Date(`${sampledAtDate}T${sampledAtTime}:00Z`);
		} else if (sampledAtDate) {
			sampledAt = new Date(`${sampledAtDate}T00:00:00Z`);
		}

		const sampledInitialPressure = sampledInitialPressureRaw ? parseFloat(sampledInitialPressureRaw) : null;
		const sampledFinalPressure = sampledFinalPressureRaw ? parseFloat(sampledFinalPressureRaw) : null;

		const latRawTrimmed = sampledLatRaw?.trim() || null;
		const lonRawTrimmed = sampledLonRaw?.trim() || null;
		const sampledLat = latRawTrimmed ? parseCoordinate(latRawTrimmed) : null;
		const sampledLon = lonRawTrimmed ? parseCoordinate(lonRawTrimmed) : null;

		try {
			await db
				.update(boxContentLines)
				.set({
					sampledAt,
					sampledLatRaw: latRawTrimmed,
					sampledLonRaw: lonRawTrimmed,
					sampledLat,
					sampledLon,
					sampledInitialPressure: isNaN(sampledInitialPressure!) ? null : sampledInitialPressure,
					sampledLocalStartTime: sampledLocalStartTime?.trim() || null,
					sampledLocalStopFlushTime: sampledLocalStopFlushTime?.trim() || null,
					sampledFinalPressure: isNaN(sampledFinalPressure!) ? null : sampledFinalPressure,
					sampledWindSpeedDirection: sampledWindSpeedDirection?.trim() || null,
					sampledShipSpeedDirection: sampledShipSpeedDirection?.trim() || null,
					sampledComments: sampledComments?.trim() || null,
					...updateAuditFields(locals.user.id)
				})
				.where(eq(boxContentLines.id, lineId));

			return { success: true };
		} catch (err) {
			const { status, message } = handleDatabaseError(err, 'sampling data');
			return fail(status, { error: message });
		}
	}
};
