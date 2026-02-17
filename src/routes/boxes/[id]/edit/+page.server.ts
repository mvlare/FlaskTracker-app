import { db } from '$lib/server/db';
import { boxes, boxContentHeaders } from '$lib/server/db/schema';
import type { PageServerLoad, Actions } from './$types';
import { fail, redirect, error } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { validateRequired, processRemarks } from '$lib/server/utils/validation';
import { handleDatabaseError } from '$lib/server/utils/error-handling';
import { updateAuditFields } from '$lib/server/utils/audit';

export const load: PageServerLoad = async ({ params, locals }) => {
	if (!locals.session) {
		throw redirect(303, '/auth/signin');
	}

	const boxId = parseInt(params.id);
	if (isNaN(boxId)) {
		throw error(404, 'Box not found');
	}

	const box = await db.query.boxes.findFirst({
		where: eq(boxes.id, boxId)
	});

	if (!box) {
		throw error(404, 'Box not found');
	}

	// Check if this box is referenced in any shipment header — if so, name cannot be changed
	const inShipment = await db.query.boxContentHeaders.findFirst({
		where: eq(boxContentHeaders.boxId, boxId),
		columns: { id: true }
	});

	return {
		box,
		nameReadOnly: !!inShipment
	};
};

export const actions: Actions = {
	default: async ({ request, params, locals }) => {
		if (!locals.session || !locals.user) {
			return fail(401, { error: 'Unauthorized' });
		}

		const boxId = parseInt(params.id);
		if (isNaN(boxId)) {
			return fail(404, { error: 'Box not found' });
		}

		const formData = await request.formData();
		const name = formData.get('name') as string;
		const remarksRaw = formData.get('remarks');

		const nameError = validateRequired(name, 'Box name');
		if (nameError) {
			return fail(400, { error: nameError });
		}

		// Block name change if the box is used in any shipment header
		const currentBox = await db.query.boxes.findFirst({
			where: eq(boxes.id, boxId),
			columns: { name: true }
		});

		if (currentBox && name.trim() !== currentBox.name) {
			const inShipment = await db.query.boxContentHeaders.findFirst({
				where: eq(boxContentHeaders.boxId, boxId),
				columns: { id: true }
			});
			if (inShipment) {
				return fail(400, { error: 'Box name cannot be changed because it is used in a shipment.' });
			}
		}

		try {
			await db
				.update(boxes)
				.set({
					name: name.trim(),
					remarks: processRemarks(remarksRaw),
					...updateAuditFields(locals.user.id)
				})
				.where(eq(boxes.id, boxId));
		} catch (err) {
			const { status, message } = handleDatabaseError(err, 'box');
			return fail(status, { error: message });
		}

		throw redirect(303, '/box-content?boxId=' + boxId);
	}
};
