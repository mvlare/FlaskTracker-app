import { createAuthClient } from "better-auth/svelte";

export const authClient = createAuthClient({});

// Export convenience stores for easy access in components
export const session = authClient.$session;
export const user = authClient.$user;
