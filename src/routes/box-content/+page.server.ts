import type { PageServerLoad, Actions } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { boxes, boxContentHeaders, boxContentLines, flasks } from '$lib/server/db/schema';
import { eq, desc, isNull, isNotNull, and, asc } from 'drizzle-orm';
import { validateRequired, processRemarks, parseDateToUTC } from '$lib/server/utils/validation';
import { formatDateDisplay } from '$lib/utils/dates';
import { handleDatabaseError } from '$lib/server/utils/error-handling';
import { createAuditFields, updateAuditFields } from '$lib/server/utils/audit';

export const load: PageServerLoad = async ({ url, locals }) => {
	if (!locals.session) {
		throw redirect(303, '/auth/signin');
	}

	const boxId = url.searchParams.get('boxId');

	if (!boxId) {
		// No box selected yet - return empty state
		return {
			box: null,
			openShipment: null,
			closedShipments: [],
			focusedShipmentId: null,
			focusedShipmentLines: []
		};
	}

	const boxIdNum = parseInt(boxId);

	// Fetch box details
	const box = await db.query.boxes.findFirst({
		where: eq(boxes.id, boxIdNum)
	});

	if (!box) {
		return {
			box: null,
			openShipment: null,
			closedShipments: [],
			focusedShipmentId: null,
			focusedShipmentLines: [],
			error: 'Box not found'
		};
	}

	// Fetch THE ONE open shipment (returnedAt IS NULL) - Block 1
	const openShipment = await db.query.boxContentHeaders.findFirst({
		where: and(eq(boxContentHeaders.boxId, boxIdNum), isNull(boxContentHeaders.returnedAt))
	});

	// Fetch ALL closed shipments (returnedAt IS NOT NULL) - Block 2
	const closedShipments = await db.query.boxContentHeaders.findMany({
		where: and(eq(boxContentHeaders.boxId, boxIdNum), isNotNull(boxContentHeaders.returnedAt)),
		orderBy: [desc(boxContentHeaders.returnedAt)]
	});

	// Determine focused shipment ID (from URL param or default to open shipment)
	const focusedShipmentIdParam = url.searchParams.get('focusedShipmentId');
	const focusedShipmentId = focusedShipmentIdParam
		? parseInt(focusedShipmentIdParam)
		: openShipment?.id || null;

	// Load flask lines for the focused shipment only - Block 3
	let focusedShipmentLines: Array<{
		id: number;
		flask: { id: number; name: string };
		remarks: string | null;
	}> = [];

	if (focusedShipmentId) {
		const linesData = await db.query.boxContentLines.findMany({
			where: eq(boxContentLines.boxContentHeaderId, focusedShipmentId),
			with: {
				flask: {
					columns: { id: true, name: true }
				}
			}
		});

		// Sort by flask name
		focusedShipmentLines = linesData.sort((a, b) => a.flask.name.localeCompare(b.flask.name));
	}

	return {
		box,
		openShipment,
		closedShipments,
		focusedShipmentId,
		focusedShipmentLines
	};
};

export const actions: Actions = {
	createHeader: async ({ request, locals, url }) => {
		if (!locals.session || !locals.user) {
			return fail(401, { error: 'Unauthorized' });
		}

		const formData = await request.formData();
		const boxId = formData.get('boxId') as string;
		const destinationText = formData.get('destinationText') as string;
		const readyAtRaw = formData.get('readyAt');
		const returnedAtRaw = formData.get('returnedAt');
		const remarksRaw = formData.get('remarks');

		// Validate required fields
		const boxIdError = validateRequired(boxId, 'Box');
		if (boxIdError) {
			return fail(400, { error: boxIdError });
		}

		try {
			const insertData = {
				boxId: parseInt(boxId),
				destinationText: destinationText?.trim() || null,
				readyAt: parseDateToUTC(readyAtRaw ? String(readyAtRaw) : null),
				returnedAt: parseDateToUTC(returnedAtRaw ? String(returnedAtRaw) : null),
				remarks: processRemarks(remarksRaw),
				...createAuditFields(locals.user.id)
			};

			await db.insert(boxContentHeaders).values(insertData);

			return { success: true };
		} catch (error) {
			const { status, message } = handleDatabaseError(error, 'shipment');
			return fail(status, { error: message });
		}
	},

	updateHeader: async ({ request, locals }) => {
		if (!locals.session || !locals.user) {
			return fail(401, { error: 'Unauthorized' });
		}

		const formData = await request.formData();
		const headerId = formData.get('headerId') as string;
		const destinationText = formData.get('destinationText') as string;
		const readyAtRaw = formData.get('readyAt');
		const returnedAtRaw = formData.get('returnedAt');
		const remarksRaw = formData.get('remarks');

		// Validate required fields
		const headerIdError = validateRequired(headerId, 'Shipment');
		if (headerIdError) {
			return fail(400, { error: headerIdError });
		}

		const readyAt = parseDateToUTC(readyAtRaw ? String(readyAtRaw) : null);
		const returnedAt = parseDateToUTC(returnedAtRaw ? String(returnedAtRaw) : null);

		// Validate: readyAt cannot be before the most recent returnedAt of a closed shipment
		if (readyAt) {
			const header = await db.query.boxContentHeaders.findFirst({
				where: eq(boxContentHeaders.id, parseInt(headerId)),
				columns: { boxId: true }
			});

			if (header) {
				const latestClosed = await db.query.boxContentHeaders.findFirst({
					where: and(
						eq(boxContentHeaders.boxId, header.boxId),
						isNotNull(boxContentHeaders.returnedAt)
					),
					orderBy: [desc(boxContentHeaders.returnedAt)],
					columns: { returnedAt: true }
				});

				if (latestClosed?.returnedAt && readyAt < latestClosed.returnedAt) {
					return fail(400, {
						error: `Ready date cannot be before the last returned date (${formatDateDisplay(latestClosed.returnedAt)}).`
					});
				}
			}
		}

		try {
			await db
				.update(boxContentHeaders)
				.set({
					destinationText: destinationText?.trim() || null,
					readyAt,
					returnedAt,
					remarks: processRemarks(remarksRaw),
					...updateAuditFields(locals.user.id)
				})
				.where(eq(boxContentHeaders.id, parseInt(headerId)));

			return { success: true };
		} catch (error) {
			const { status, message } = handleDatabaseError(error, 'shipment');
			return fail(status, { error: message });
		}
	},

	addLine: async ({ request, locals }) => {
		if (!locals.session || !locals.user) {
			return fail(401, { error: 'Unauthorized' });
		}

		const formData = await request.formData();
		const headerId = formData.get('headerId') as string;
		const flaskId = formData.get('flaskId') as string;
		const remarksRaw = formData.get('remarks');

		// Validate required fields
		const headerIdError = validateRequired(headerId, 'Shipment');
		if (headerIdError) {
			return fail(400, { error: headerIdError });
		}

		const flaskIdError = validateRequired(flaskId, 'Flask');
		if (flaskIdError) {
			return fail(400, { error: flaskIdError });
		}

		try {
			// Check line count (max 15)
			const existingLines = await db.query.boxContentLines.findMany({
				where: eq(boxContentLines.boxContentHeaderId, parseInt(headerId))
			});

			if (existingLines.length >= 15) {
				return fail(400, { error: 'Maximum 15 flasks per shipment' });
			}

			const insertData = {
				boxContentHeaderId: parseInt(headerId),
				flaskId: parseInt(flaskId),
				remarks: processRemarks(remarksRaw),
				...createAuditFields(locals.user.id)
			};

			await db.insert(boxContentLines).values(insertData);

			return { success: true };
		} catch (error) {
			const { status, message } = handleDatabaseError(error, 'flask line');
			return fail(status, { error: message });
		}
	},

	updateLine: async ({ request, locals }) => {
		if (!locals.session || !locals.user) {
			return fail(401, { error: 'Unauthorized' });
		}

		const formData = await request.formData();
		const lineId = formData.get('lineId') as string;
		const remarksRaw = formData.get('remarks');

		// Validate required fields
		const lineIdError = validateRequired(lineId, 'Flask line');
		if (lineIdError) {
			return fail(400, { error: lineIdError });
		}

		try {
			await db
				.update(boxContentLines)
				.set({
					remarks: processRemarks(remarksRaw),
					...updateAuditFields(locals.user.id)
				})
				.where(eq(boxContentLines.id, parseInt(lineId)));

			return { success: true };
		} catch (error) {
			const { status, message } = handleDatabaseError(error, 'flask line');
			return fail(status, { error: message });
		}
	},

	deleteLine: async ({ request, locals }) => {
		if (!locals.session || !locals.user) {
			return fail(401, { error: 'Unauthorized' });
		}

		const formData = await request.formData();
		const lineId = formData.get('lineId') as string;

		// Validate required fields
		const lineIdError = validateRequired(lineId, 'Flask line');
		if (lineIdError) {
			return fail(400, { error: lineIdError });
		}

		try {
			await db.delete(boxContentLines).where(eq(boxContentLines.id, parseInt(lineId)));

			return { success: true };
		} catch (error) {
			const { status, message } = handleDatabaseError(error, 'flask line');
			return fail(status, { error: message });
		}
	},

	copyLastReturn: async ({ request, locals }) => {
		if (!locals.session || !locals.user) {
			return fail(401, { error: 'Unauthorized' });
		}

		const formData = await request.formData();
		const headerId = formData.get('headerId') as string;
		const boxId = formData.get('boxId') as string;

		const headerIdError = validateRequired(headerId, 'Shipment');
		if (headerIdError) return fail(400, { error: headerIdError });

		const boxIdError = validateRequired(boxId, 'Box');
		if (boxIdError) return fail(400, { error: boxIdError });

		try {
			// Find the most recent closed shipment for this box
			const latestClosed = await db.query.boxContentHeaders.findFirst({
				where: and(
					eq(boxContentHeaders.boxId, parseInt(boxId)),
					isNotNull(boxContentHeaders.returnedAt)
				),
				orderBy: [desc(boxContentHeaders.returnedAt)]
			});

			if (!latestClosed) {
				return fail(400, { error: 'No returned shipment found to copy from.' });
			}

			// Get source flask lines
			const sourceLines = await db.query.boxContentLines.findMany({
				where: eq(boxContentLines.boxContentHeaderId, latestClosed.id)
			});

			if (sourceLines.length === 0) {
				return fail(400, { error: 'The last returned shipment has no flasks.' });
			}

			// Get existing lines to check limit and avoid duplicates
			const existingLines = await db.query.boxContentLines.findMany({
				where: eq(boxContentLines.boxContentHeaderId, parseInt(headerId))
			});

			const existingFlaskIds = new Set(existingLines.map((l) => l.flaskId));
			const linesToInsert = sourceLines
				.filter((l) => !existingFlaskIds.has(l.flaskId))
				.map((l) => ({
					boxContentHeaderId: parseInt(headerId),
					flaskId: l.flaskId,
					remarks: l.remarks,
					...createAuditFields(locals.user.id)
				}));

			if (existingLines.length + linesToInsert.length > 15) {
				return fail(400, {
					error: `Cannot copy: would exceed the maximum of 15 flasks (current: ${existingLines.length}, to copy: ${linesToInsert.length}).`
				});
			}

			if (linesToInsert.length > 0) {
				await db.insert(boxContentLines).values(linesToInsert);
			}

			return { success: true };
		} catch (error) {
			const { status, message } = handleDatabaseError(error, 'flask line');
			return fail(status, { error: message });
		}
	}
};
