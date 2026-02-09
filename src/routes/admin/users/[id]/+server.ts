import { db } from "$lib/server/db";
import { user, account, session } from "$lib/server/db/auth-schema";
import { json } from "@sveltejs/kit";
import { eq } from "drizzle-orm";
import { hashPassword } from "better-auth/crypto";
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

export const PATCH: RequestHandler = async ({ params, request, locals }) => {
	// Require admin access
	if (!locals.session || !locals.isAdmin) {
		return json({ error: "Unauthorized" }, { status: 401 });
	}

	const userId = params.id;
	const { newPassword } = await request.json();

	// Validate input
	if (!newPassword || newPassword.length < 8) {
		return json({ error: "Password must be at least 8 characters" }, { status: 400 });
	}

	try {
		// Hash the new password using better-auth's internal function
		const hashedPassword = await hashPassword(newPassword);

		// Update the password in the account table
		await db
			.update(account)
			.set({ password: hashedPassword })
			.where(eq(account.userId, userId));

		console.log('Password reset for user:', userId);

		return json({ success: true });
	} catch (error) {
		console.error("Error resetting password:", error);
		return json({ error: "Failed to reset password" }, { status: 500 });
	}
};
