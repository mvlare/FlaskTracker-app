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
