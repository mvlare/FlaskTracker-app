import { createAuthClient } from "better-auth/svelte";

export const authClient = createAuthClient({
	baseURL: "http://localhost:5173", // Use BETTER_AUTH_URL in production
});

// Export convenience stores for easy access in components
export const session = authClient.$session;
export const user = authClient.$user;
