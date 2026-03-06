import { auth } from "$lib/server/auth";
import { svelteKitHandler } from "better-auth/svelte-kit";
import { db } from "$lib/server/db";
import { user } from "$lib/server/db/auth-schema";
import { eq } from "drizzle-orm";
import type { Handle } from "@sveltejs/kit";

export const handle: Handle = async ({ event, resolve }) => {
	// Populate session in event.locals
	const session = await auth.api.getSession({
		headers: event.request.headers,
	});

	if (session) {
		event.locals.session = session.session;
		event.locals.user = session.user;

		// Fetch isAdmin flag from database
		const userRecord = await db
			.select({ isAdmin: user.isAdmin })
			.from(user)
			.where(eq(user.id, session.user.id))
			.limit(1);

		event.locals.isAdmin = userRecord[0]?.isAdmin || false;

} else {
		event.locals.isAdmin = false;
	}

	return svelteKitHandler({ event, resolve, auth });
};
