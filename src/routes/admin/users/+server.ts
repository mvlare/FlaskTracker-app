import { db } from "$lib/server/db";
import { user } from "$lib/server/db/auth-schema";
import { auth } from "$lib/server/auth";
import { json } from "@sveltejs/kit";
import { eq } from "drizzle-orm";
import type { RequestHandler } from "./$types";
import { validateRequired, validatePassword, validateEmail } from "$lib/server/utils/validation";

export const POST: RequestHandler = async ({ request, locals }) => {
	// Require admin access
	if (!locals.session || !locals.isAdmin) {
		return json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const { name, email, password, isAdmin } = await request.json();

		// Validate input using utilities
		const nameError = validateRequired(name, 'Name');
		if (nameError) {
			return json({ error: nameError }, { status: 400 });
		}

		const emailError = validateRequired(email, 'Email');
		if (emailError) {
			return json({ error: emailError }, { status: 400 });
		}

		if (!validateEmail(email)) {
			return json({ error: "Invalid email format" }, { status: 400 });
		}

		const passwordError = validateRequired(password, 'Password');
		if (passwordError) {
			return json({ error: passwordError }, { status: 400 });
		}

		const passwordValidation = validatePassword(password);
		if (!passwordValidation.valid) {
			return json({ error: passwordValidation.error }, { status: 400 });
		}

		// Check if user already exists
		const existing = await db.select().from(user).where(eq(user.email, email)).limit(1);

		if (existing.length > 0) {
			return json({ error: "User with this email already exists" }, { status: 400 });
		}

		// Use Better Auth API to create the user (ensures correct password hashing)
		const result = await auth.api.signUpEmail({
			body: {
				email,
				password,
				name,
			},
		});

		if (!result || !result.user) {
			return json({ error: "Failed to create user" }, { status: 500 });
		}

		const userId = result.user.id;

		// Update user to set admin flag and email verification
		const isAdminBool = isAdmin === true; // Ensure boolean
		await db
			.update(user)
			.set({
				isAdmin: isAdminBool,
				emailVerified: true, // Auto-verify for admin-created users
			})
			.where(eq(user.id, userId));

		console.log('Created user:', email, 'isAdmin:', isAdminBool);

		return json({ success: true, userId });
	} catch (error) {
		console.error("Error creating user:", error);
		return json({ error: "Failed to create user" }, { status: 500 });
	}
};
