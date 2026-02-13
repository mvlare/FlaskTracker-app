import { db } from '$lib/server/db';
import { boxes } from '$lib/server/db/schema';
import type { PageServerLoad, Actions } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { validateRequired, processRemarks } from '$lib/server/utils/validation';
import { handleDatabaseError } from '$lib/server/utils/error-handling';
import { createAuditFields } from '$lib/server/utils/audit';

export const load: PageServerLoad = async ({ locals }) => {
	// Require authentication
	if (!locals.session) {
		throw redirect(303, '/auth/signin');
	}

	return {};
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		// Require authentication
		if (!locals.session || !locals.user) {
			return fail(401, { error: 'Unauthorized' });
		}

		const formData = await request.formData();
		const name = formData.get('name') as string;
		const remarksRaw = formData.get('remarks');

		// Validate required fields
		const nameError = validateRequired(name, 'Box name');
		if (nameError) {
			return fail(400, { error: nameError });
		}

		try {
			// Insert the new box with audit trail
			const insertData = {
				name: name.trim(),
				remarks: processRemarks(remarksRaw),
				...createAuditFields(locals.user.id)
			};

			await db.insert(boxes).values(insertData);
		} catch (error) {
			const { status, message } = handleDatabaseError(error, 'box');
			return fail(status, { error: message });
		}

		// Redirect to the main page (outside try-catch)
		throw redirect(303, '/');
	}
};
