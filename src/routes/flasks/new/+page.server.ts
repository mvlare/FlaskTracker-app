import { db } from '$lib/server/db';
import { flasks } from '$lib/server/db/schema';
import type { PageServerLoad, Actions } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { validateRequired, processRemarks, parseDateToUTC } from '$lib/server/utils/validation';
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
		const brokenAtRaw = formData.get('brokenAt');

		// Validate required fields
		const nameError = validateRequired(name, 'Flask name');
		if (nameError) {
			return fail(400, { error: nameError });
		}

		try {
			// Process inputs using utilities
			const remarksValue = processRemarks(remarksRaw);
			const brokenAtDate = parseDateToUTC(brokenAtRaw ? String(brokenAtRaw) : null);

			// Insert the new flask with audit trail
			const insertData = {
				name: name.trim(),
				remarks: remarksValue,
				brokenAt: brokenAtDate,
				...createAuditFields(locals.user.id)
			};

			console.log('Inserting flask with data:', JSON.stringify(insertData, null, 2));

			await db.insert(flasks).values(insertData);
		} catch (error) {
			const { status, message } = handleDatabaseError(error, 'flask');
			return fail(status, { error: message });
		}

		// Redirect to the main flasks page (outside try-catch)
		throw redirect(303, '/?flaskSearch=' + encodeURIComponent(name.trim()));
	}
};
