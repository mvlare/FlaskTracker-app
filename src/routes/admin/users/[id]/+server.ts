import { db } from "$lib/server/db";
import { user, account, session } from "$lib/server/db/auth-schema";
import { json } from "@sveltejs/kit";
import { eq } from "drizzle-orm";
import type { RequestHandler } from "./$types";

export const DELETE: RequestHandler = async ({ params, locals }) => {
	// Require admin access
	if (!locals.session || !locals.isAdmin) {
		return json({ error: "Unauthorized" }, { status: 401 });
	}

	const userId = params.id;

	// Prevent deleting yourself
	if (locals.user?.id === userId) {
		return json({ error: "Cannot delete your own account" }, { status: 400 });
	}

	try {
		// Delete related records first (cascade should handle this, but being explicit)
		await db.delete(session).where(eq(session.userId, userId));
		await db.delete(account).where(eq(account.userId, userId));
		await db.delete(user).where(eq(user.id, userId));

		return json({ success: true });
	} catch (error) {
		console.error("Error deleting user:", error);
		return json({ error: "Failed to delete user" }, { status: 500 });
	}
};
