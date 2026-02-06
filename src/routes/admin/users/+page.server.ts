import { db } from "$lib/server/db";
import { user } from "$lib/server/db/auth-schema";
import { error, redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals }) => {
	// Require admin access
	if (!locals.session || !locals.isAdmin) {
		throw redirect(303, "/");
	}

	const allUsers = await db.select().from(user);

	return {
		users: allUsers,
	};
};
