import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "$lib/server/db";
import { env } from "$env/dynamic/private";

export const auth = betterAuth({
	database: drizzleAdapter(db, {
		provider: "pg", // PostgreSQL (Neon)
	}),
	emailAndPassword: {
		enabled: true,
		requireEmailVerification: false, // Disable for closed system
	},
	secret: env.BETTER_AUTH_SECRET,
	baseURL: env.BETTER_AUTH_URL,
	// NO social providers for closed system
});
