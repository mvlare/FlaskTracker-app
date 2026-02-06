# Plan 5: Better Auth Implementation Guide

**Status:** Research & Planning
**Created:** 2026-02-06
**Last Updated:** 2026-02-06

---

## Executive Summary

### What is Better Auth?

Better Auth is a modern, TypeScript-first authentication framework that is now the **official successor to Auth.js** (formerly NextAuth.js). As of September 2025, the Auth.js development team joined Better Auth, making it the unified future of the authentication ecosystem.

Better Auth is:
- **100% Free & Open-Source**: No usage limits, no premium tiers, no hidden costs
- **Framework Agnostic**: Works with any framework, with dedicated adapters for popular ones
- **Database Flexible**: Supports PostgreSQL, MySQL, SQLite via ORM adapters (Drizzle, Prisma, MongoDB)
- **TypeScript-First**: Full type safety out of the box
- **Feature-Rich**: Built-in OAuth, 2FA, multi-tenancy, multi-session, rate limiting
- **Stateful-First**: Better suited for traditional web applications (like FlaskTracker)

### Why Better Auth is Compelling for FlaskTracker

1. **Perfect Tech Stack Match**:
   - Native **SvelteKit** support via `better-auth/svelte-kit`
   - Built-in **Drizzle ORM** adapter with PostgreSQL support
   - Works seamlessly with **Neon PostgreSQL**
   - Full **TypeScript** support

2. **Zero Cost, Maximum Features**:
   - Unlike Clerk (10k MAU limit on free tier), Better Auth has no usage caps
   - More features than Auth.js (2FA, organizations, multi-session built-in)
   - No vendor lock-in - your data stays in your database

3. **Official Successor Status**:
   - Auth.js team now maintains Better Auth
   - Auth.js will receive security patches but new features go to Better Auth
   - Better Auth includes migration guide from Auth.js

4. **Developer Experience**:
   - Auto-generates Drizzle schemas via CLI
   - Minimal boilerplate code
   - Reactive state management with nano-store
   - Comprehensive documentation

### Relationship to Auth.js

Better Auth was inspired by Auth.js and has now absorbed the Auth.js team. For **new projects, Better Auth is recommended** over Auth.js. Existing Auth.js projects can continue with security support, but migration to Better Auth is encouraged for new features.

---

## Research Findings

### Official Status & Community

- **Official Announcement**: [Auth.js is now part of Better Auth](https://www.better-auth.com/blog/authjs-joins-better-auth) (September 2025)
- **Migration Guide**: Auth.js documentation now includes [official migration guide to Better Auth](https://authjs.dev/getting-started/migrate-to-better-auth)
- **Active Ecosystem**: Growing community with SvelteKit examples and starter templates

### Key Features

#### Authentication Methods
- Email/Password authentication
- OAuth providers (Google, GitHub, Twitter, etc.)
- Passwordless (magic links)
- Passkeys (WebAuthn)

#### Security Features
- Two-Factor Authentication (OTP & TOTP)
- Email verification
- Password reset flows
- Rate limiting (built-in)
- CSRF protection
- Signed cookies
- Password policies

#### Advanced Capabilities
- Multi-session support
- Organizations & teams
- Invitation management
- Multi-tenancy (native)
- Trusted device management
- Backup codes for 2FA

#### Developer Features
- Auto-generated database schemas
- Full TypeScript type safety
- Plugin architecture for extensibility
- Reactive client state (nano-store)
- Framework-specific handlers

### SvelteKit Integration Details

**Package**: `better-auth/svelte-kit`

**Requirements**:
- SvelteKit 2.20.0 or later (for server actions cookie support)
- Better Auth core package

**Integration Points**:
1. **Server Hooks** (`hooks.server.ts`): Mount `svelteKitHandler` for request handling
2. **Cookies Plugin** (`sveltekitCookies`): Ensures proper cookie handling in server actions
3. **Session Population**: Access session data via `event.locals` in server code
4. **Client Setup**: Reactive auth client using `createAuthClient` from `better-auth/svelte`

### Drizzle ORM + PostgreSQL Support

**Adapter**: `better-auth/adapters/drizzle`

**Supported Databases**:
- PostgreSQL (via `pg` provider) ✅ **Perfect for FlaskTracker with Neon**
- MySQL (via `mysql` provider)
- SQLite (via `sqlite` provider)

**Schema Generation**:
```bash
npx @better-auth/cli generate  # Generates Drizzle schema
npx drizzle-kit generate       # Creates migration files
npx drizzle-kit migrate        # Applies migrations
```

**Performance Optimizations**:
- Experimental joins feature (2x-3x faster for `/get-session`)
- Table name customization
- Field mapping support
- Plural naming conventions

### Pricing Comparison

| Feature | Better Auth | Auth.js | Clerk |
|---------|-------------|---------|-------|
| **Base Cost** | Free forever | Free forever | Free (10k MAU limit) |
| **Usage Limits** | None | None | 10k MAU, then $25/month |
| **Premium Features** | All included | All included | Many behind paywall |
| **Enterprise Features** | All free | All free | Paid tiers required |
| **Data Ownership** | Your database | Your database | Clerk's database |
| **Vendor Lock-in** | None | None | High |

**Verdict**: Better Auth = **$0/month forever**, Clerk = **$25+/month** after 10k users

---

## Compatibility Analysis

### ✅ SvelteKit 5 Compatibility

**FlaskTracker Current**: SvelteKit 5 (latest)
**Better Auth Requirement**: SvelteKit 2.20.0+

✅ **FULLY COMPATIBLE** - SvelteKit 5 exceeds minimum requirement

**Integration Method**:
- `svelteKitHandler` in `hooks.server.ts`
- `sveltekitCookies` plugin for server actions
- Reactive client with `better-auth/svelte`

### ✅ TypeScript Support

**FlaskTracker Current**: TypeScript enabled
**Better Auth**: TypeScript-first design

✅ **PERFECT MATCH** - Full type safety, auto-generated types

### ✅ Drizzle ORM Integration

**FlaskTracker Current**: Drizzle ORM for PostgreSQL
**Better Auth**: Native `drizzleAdapter`

✅ **NATIVE INTEGRATION** - Better Auth designed for Drizzle

**Setup**:
```typescript
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "./db"; // Your existing Drizzle instance

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg" }),
});
```

### ✅ Neon PostgreSQL Compatibility

**FlaskTracker Current**: Neon PostgreSQL (serverless)
**Better Auth**: Supports any PostgreSQL database via Drizzle

✅ **FULLY COMPATIBLE** - Neon works like standard PostgreSQL

**Connection**: Uses existing `DATABASE_URL` from `.env`

### ✅ Vercel Deployment Support

**FlaskTracker Target**: Vercel hosting
**Better Auth**: Framework-agnostic, Vercel-compatible

✅ **PRODUCTION READY** - Works on Vercel, Netlify, Cloudflare, etc.

**Requirements**:
- Set environment variables (BETTER_AUTH_SECRET, BETTER_AUTH_URL)
- OAuth provider credentials (if using social login)

---

## Feature Comparison Matrix

### Better Auth vs Auth.js vs Clerk

| Feature | Better Auth | Auth.js | Clerk |
|---------|-------------|---------|-------|
| **Pricing** | Free, no limits | Free, no limits | Free (10k MAU), then paid |
| **SvelteKit Support** | ✅ Native (`better-auth/svelte-kit`) | ✅ Native (`@auth/sveltekit`) | ⚠️ Community package (`svelte-clerk`) |
| **Drizzle ORM Adapter** | ✅ Built-in | ✅ Built-in | ❌ Not available |
| **PostgreSQL** | ✅ Native support | ✅ Native support | ✅ Supported |
| **TypeScript** | ✅ TypeScript-first | ✅ TypeScript support | ✅ TypeScript support |
| **OAuth Providers** | ✅ All major providers | ✅ All major providers | ✅ All major providers |
| **Email/Password** | ✅ Built-in | ✅ Built-in | ✅ Pre-built UI |
| **2FA (OTP)** | ✅ Built-in | ❌ Manual implementation | ✅ Built-in (paid tiers) |
| **2FA (TOTP)** | ✅ Built-in | ❌ Manual implementation | ✅ Built-in (paid tiers) |
| **Email Verification** | ✅ Built-in | ⚠️ Requires setup | ✅ Built-in |
| **Password Reset** | ✅ Built-in | ⚠️ Requires setup | ✅ Built-in |
| **Multi-session** | ✅ Built-in | ❌ Not available | ✅ Built-in |
| **Organizations** | ✅ Built-in | ❌ Not available | ✅ Built-in (paid) |
| **Rate Limiting** | ✅ Built-in | ❌ Manual implementation | ✅ Built-in |
| **Passkeys (WebAuthn)** | ✅ Built-in | ⚠️ Experimental | ✅ Built-in (paid) |
| **Custom Domain** | ✅ Not needed (self-hosted) | ✅ Not needed (self-hosted) | ⚠️ Required for production |
| **Data Ownership** | ✅ Your database | ✅ Your database | ❌ Clerk's database |
| **Vendor Lock-in** | ❌ None | ❌ None | ✅ High |
| **Auto Schema Generation** | ✅ CLI command | ⚠️ Manual setup | ✅ Not applicable |
| **Reactive Client State** | ✅ nano-store | ❌ Manual state management | ✅ Built-in hooks |
| **Session Management** | ✅ Database + cookie | ✅ Database or JWT | ✅ Managed service |
| **Plugin System** | ✅ Extensible | ⚠️ Limited | ❌ Closed system |
| **Community Size** | 🆕 Growing (Auth.js team joined) | 🌟 Large, established | 🌟 Large, commercial |
| **Documentation** | ✅ Comprehensive | ✅ Comprehensive | ✅ Comprehensive |
| **Maintenance** | ✅ Active (Auth.js team) | ⚠️ Security patches only | ✅ Commercial support |

### Security Features Comparison

| Security Feature | Better Auth | Auth.js | Clerk |
|------------------|-------------|---------|-------|
| CSRF Protection | ✅ Built-in | ✅ Built-in | ✅ Built-in |
| Signed Cookies | ✅ Yes | ✅ Yes | ✅ Yes |
| Password Policies | ✅ Configurable | ⚠️ Manual | ✅ Configurable |
| Rate Limiting | ✅ Built-in | ❌ External library | ✅ Built-in |
| Brute Force Protection | ✅ Yes | ⚠️ Manual | ✅ Yes |
| Session Hijacking Prevention | ✅ Yes | ✅ Yes | ✅ Yes |
| XSS Protection | ✅ Yes | ✅ Yes | ✅ Yes |
| SQL Injection Protection | ✅ ORM-based | ✅ ORM-based | ✅ Managed service |

### Developer Experience Comparison

| Aspect | Better Auth | Auth.js | Clerk |
|--------|-------------|---------|-------|
| Setup Complexity | ⭐⭐⭐⭐⭐ Easy | ⭐⭐⭐ Moderate | ⭐⭐⭐⭐⭐ Very Easy |
| Boilerplate Code | Minimal | Moderate | Minimal |
| Type Safety | Full (auto-generated) | Good | Full |
| Learning Curve | Low | Moderate | Low |
| Customization | High | High | Low (closed system) |
| Debugging | Good (self-hosted) | Good (self-hosted) | Limited (black box) |

---

## Implementation Strategy for Closed System

**🔒 IMPORTANT: FlaskTracker is a CLOSED SYSTEM**

This implementation differs from the standard Better Auth setup:
- ❌ **NO public signup page** - users cannot self-register
- ✅ **Admin-only user management** - admins create user accounts
- ✅ **First admin via database** - manual insert of first admin user
- ✅ **Local development first** - test thoroughly before any deployment
- ✅ **Role-based access control** - distinguish admins from regular users

### Modified Implementation Flow

1. Set up Better Auth with authentication disabled initially
2. Manually create first admin user in database
3. Build admin user management interface
4. Enable authentication and protect routes
5. Test locally with Neon database (remote but fine for dev)
6. Deploy to Vercel only when ready

---

## Implementation Roadmap

### Phase 1: Installation & Setup ⏱️ 10 minutes

**Step 1.1: Install Better Auth**
```bash
npm install better-auth
```

**Step 1.2: Generate Secret Key**
```bash
openssl rand -base64 32
```

**Step 1.3: Configure Environment Variables**
Create or update `.env`:
```env
# Existing database connection (Neon PostgreSQL for local dev)
DATABASE_URL="postgresql://..."

# Better Auth Configuration
BETTER_AUTH_SECRET="<generated-secret-from-step-1.2>"
BETTER_AUTH_URL="http://localhost:5173"

# OAuth Providers - NOT NEEDED for closed system
# GOOGLE_CLIENT_ID=""
# GOOGLE_CLIENT_SECRET=""
# GITHUB_CLIENT_ID=""
# GITHUB_CLIENT_SECRET=""
```

**Note for Local Development:**
- Continue using Neon database connection for local dev (it's fine - just a remote PostgreSQL)
- OR switch to local PostgreSQL if you prefer: `DATABASE_URL="postgresql://localhost:5432/flasktracker"`
- No Vercel deployment yet - local testing only

**Step 1.4: Update `.gitignore`**
Verify `.env` is already ignored (should be present from Drizzle setup).

---

### Phase 2: Server Configuration ⏱️ 20 minutes

**Step 2.1: Create Auth Instance with Drizzle Adapter**

Create `src/lib/server/auth.ts`:
```typescript
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "$lib/server/db"; // Your existing Drizzle instance

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg", // PostgreSQL (Neon)
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // Disable for closed system
  },
  // NO social providers for closed system
});
```

**Step 2.2: Generate Database Schema**

Run CLI to generate Better Auth tables:
```bash
npx @better-auth/cli generate
```

This creates tables:
- `user` (id, name, email, emailVerified, image, createdAt, updatedAt)
- `session` (id, expiresAt, token, createdAt, updatedAt, ipAddress, userAgent, userId)
- `account` (id, accountId, providerId, userId, accessToken, refreshToken, idToken, accessTokenExpiresAt, refreshTokenExpiresAt, scope, password, createdAt, updatedAt)
- `verification` (id, identifier, value, expiresAt, createdAt, updatedAt)

**Step 2.3: Extend Schema with Admin Role**

Before generating migrations, extend the user table to include admin role.

Update `src/lib/server/db/schema.ts` (or wherever Better Auth generated the schema):
```typescript
// After Better Auth CLI generates the user table, add:
export const users = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("emailVerified").notNull(),
  image: text("image"),
  createdAt: timestamp("createdAt").notNull(),
  updatedAt: timestamp("updatedAt").notNull(),
  // ADD THIS for role-based access:
  isAdmin: boolean("isAdmin").notNull().default(false),
});
```

**Step 2.4: Apply Migrations**
```bash
npx drizzle-kit generate
npx drizzle-kit migrate
```

**Step 2.5: Manually Create First Admin User**

After migrations are applied, insert the first admin user directly into the database:

```sql
-- Connect to your Neon database and run:
INSERT INTO "user" (id, name, email, "emailVerified", "createdAt", "updatedAt", "isAdmin")
VALUES (
  gen_random_uuid()::text,
  'Admin User',
  'admin@flasktracker.local',
  true,
  NOW(),
  NOW(),
  true
);

-- Then insert password in the account table
-- You'll need to hash the password first using Better Auth's utility
-- OR use Better Auth's signUp API once to create the user programmatically
```

**Better approach - Create via script:**

Create `scripts/create-admin.ts`:
```typescript
import { auth } from "../src/lib/server/auth";

async function createAdmin() {
  const admin = await auth.api.signUp({
    email: "admin@flasktracker.local",
    password: "ChangeThisPassword123!",
    name: "Admin User",
  });

  // Update to admin role
  await db
    .update(users)
    .set({ isAdmin: true })
    .where(eq(users.id, admin.user.id));

  console.log("Admin user created:", admin.user.email);
}

createAdmin();
```

Run with: `tsx scripts/create-admin.ts`

**Step 2.6: Configure SvelteKit Hooks**

Update `src/hooks.server.ts`:
```typescript
import { auth } from "$lib/server/auth";
import { svelteKitHandler } from "better-auth/svelte-kit";
import type { Handle } from "@sveltejs/kit";

export const handle: Handle = async ({ event, resolve }) => {
  return svelteKitHandler({ event, resolve, auth });
};
```

**Step 2.5: Add Cookie Plugin for Server Actions**

Update `src/lib/server/auth.ts`:
```typescript
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { sveltekitCookies } from "better-auth/svelte-kit";
import { getRequestEvent } from "$app/server";
import { db } from "$lib/server/db";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  emailAndPassword: {
    enabled: true,
  },
  plugins: [
    sveltekitCookies(getRequestEvent), // Must be last plugin
  ],
});
```

**Step 2.8: Populate `event.locals` with Session Data + Admin Role**

Update `src/hooks.server.ts`:
```typescript
import { auth } from "$lib/server/auth";
import { svelteKitHandler } from "better-auth/svelte-kit";
import { db } from "$lib/server/db";
import { users } from "$lib/server/db/schema";
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
      .select({ isAdmin: users.isAdmin })
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);

    event.locals.isAdmin = userRecord[0]?.isAdmin || false;
  }

  return svelteKitHandler({ event, resolve, auth });
};
```

**Step 2.9: Update TypeScript Types**

Create or update `src/app.d.ts`:
```typescript
// See https://kit.svelte.dev/docs/types#app
declare global {
  namespace App {
    interface Locals {
      session: {
        id: string;
        userId: string;
        expiresAt: Date;
      } | null;
      user: {
        id: string;
        email: string;
        name: string;
        emailVerified: boolean;
        image?: string;
        createdAt: Date;
        updatedAt: Date;
      } | null;
      isAdmin: boolean; // ADD THIS for role-based access
    }
    // interface Error {}
    // interface PageData {}
    // interface PageState {}
    // interface Platform {}
  }
}

export {};
```

---

### Phase 3: Client Setup ⏱️ 15 minutes

**Step 3.1: Create Auth Client**

Create `src/lib/auth-client.ts`:
```typescript
import { createAuthClient } from "better-auth/svelte";

export const authClient = createAuthClient({
  baseURL: "http://localhost:5173", // Use BETTER_AUTH_URL in production
});

// Export convenience stores
export const session = authClient.session;
export const user = authClient.user;
```

**Step 3.2: Configure Reactive State**

The client automatically uses **nano-store** for reactive state management. Access session and user data in components using `$session` and `$user` stores.

**Step 3.3: Create Sign-In Page (NO Sign-Up Link)**

Create `src/routes/auth/signin/+page.svelte`:
```svelte
<script lang="ts">
  import { authClient } from "$lib/auth-client";
  import { goto } from "$app/navigation";

  let email = "";
  let password = "";
  let error = "";
  let loading = false;

  async function handleSignIn() {
    loading = true;
    error = "";

    try {
      await authClient.signIn.email({
        email,
        password,
      });

      // Redirect to home page after successful sign-in
      goto("/");
    } catch (e) {
      error = e instanceof Error ? e.message : "Failed to sign in";
    } finally {
      loading = false;
    }
  }
</script>

<div class="container mx-auto max-w-md p-6">
  <h1 class="text-2xl font-bold mb-6">Sign In</h1>

  {#if error}
    <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
      {error}
    </div>
  {/if}

  <form on:submit|preventDefault={handleSignIn} class="space-y-4">
    <div>
      <label for="email" class="block text-sm font-medium mb-1">Email</label>
      <input
        id="email"
        type="email"
        bind:value={email}
        required
        class="w-full px-3 py-2 border rounded"
      />
    </div>

    <div>
      <label for="password" class="block text-sm font-medium mb-1">Password</label>
      <input
        id="password"
        type="password"
        bind:value={password}
        required
        class="w-full px-3 py-2 border rounded"
      />
    </div>

    <button
      type="submit"
      disabled={loading}
      class="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 disabled:opacity-50"
    >
      {loading ? "Signing in..." : "Sign In"}
    </button>
  </form>

  <!-- REMOVED: No sign-up link for closed system -->
</div>
```

**Step 3.4: ~~Create Sign-Up Page~~ SKIP - Closed System**

**DO NOT create a public signup page.** This is a closed system where only admins can create users.
**Instead, create Admin User Management in Phase 3A below.**

---

### Phase 3A: Admin User Management (CLOSED SYSTEM) ⏱️ 30 minutes

**🔑 This replaces the public signup page with admin-only user management**

**Step 3A.1: Create Admin User Management Page**

Create `src/routes/admin/users/+page.svelte`:
```svelte
<script lang="ts">
  import { Button } from "$lib/components/ui/button";
  import type { PageData } from "./$types";

  export let data: PageData;

  let showCreateForm = false;
  let newUser = {
    name: "",
    email: "",
    password: "",
    isAdmin: false,
  };

  async function createUser() {
    const res = await fetch("/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newUser),
    });

    if (res.ok) {
      location.reload();
    } else {
      alert("Failed to create user");
    }
  }

  async function deleteUser(userId: string) {
    if (!confirm("Delete this user?")) return;

    const res = await fetch(`/admin/users/${userId}`, {
      method: "DELETE",
    });

    if (res.ok) {
      location.reload();
    }
  }
</script>

<div class="container mx-auto p-6">
  <div class="flex justify-between items-center mb-6">
    <h1 class="text-2xl font-bold">User Management</h1>
    <Button on:click={() => (showCreateForm = !showCreateForm)}>
      {showCreateForm ? "Cancel" : "Create User"}
    </Button>
  </div>

  {#if showCreateForm}
    <div class="bg-white rounded-lg shadow p-6 mb-6">
      <h2 class="text-xl font-semibold mb-4">Create New User</h2>
      <form on:submit|preventDefault={createUser} class="space-y-4">
        <div>
          <label class="block text-sm font-medium mb-1">Name</label>
          <input
            type="text"
            bind:value={newUser.name}
            required
            class="w-full px-3 py-2 border rounded"
          />
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            bind:value={newUser.email}
            required
            class="w-full px-3 py-2 border rounded"
          />
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">Password</label>
          <input
            type="password"
            bind:value={newUser.password}
            required
            minlength="8"
            class="w-full px-3 py-2 border rounded"
          />
        </div>
        <div>
          <label class="flex items-center gap-2">
            <input type="checkbox" bind:checked={newUser.isAdmin} />
            <span class="text-sm font-medium">Admin User</span>
          </label>
        </div>
        <Button type="submit">Create User</Button>
      </form>
    </div>
  {/if}

  <div class="bg-white rounded-lg shadow">
    <table class="w-full">
      <thead class="bg-gray-50">
        <tr>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-gray-200">
        {#each data.users as user}
          <tr>
            <td class="px-6 py-4">{user.name}</td>
            <td class="px-6 py-4">{user.email}</td>
            <td class="px-6 py-4">
              {#if user.isAdmin}
                <span class="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded">Admin</span>
              {:else}
                <span class="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded">User</span>
              {/if}
            </td>
            <td class="px-6 py-4">{new Date(user.createdAt).toLocaleDateString()}</td>
            <td class="px-6 py-4">
              <button
                on:click={() => deleteUser(user.id)}
                class="text-red-600 hover:underline"
              >
                Delete
              </button>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>
```

**Step 3A.2: Create Server Load Function**

Create `src/routes/admin/users/+page.server.ts`:
```typescript
import { db } from "$lib/server/db";
import { users } from "$lib/server/db/schema";
import { error, redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals }) => {
  // Require admin access
  if (!locals.session || !locals.isAdmin) {
    throw redirect(303, "/");
  }

  const allUsers = await db.select().from(users);

  return {
    users: allUsers,
  };
};
```

**Step 3A.3: Create User Management API**

Create `src/routes/admin/users/+server.ts`:
```typescript
import { db } from "$lib/server/db";
import { users, account } from "$lib/server/db/schema";
import { auth } from "$lib/server/auth";
import { json } from "@sveltejs/kit";
import { eq } from "drizzle-orm";
import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ({ request, locals }) => {
  // Require admin access
  if (!locals.session || !locals.isAdmin) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name, email, password, isAdmin } = await request.json();

  try {
    // Create user via Better Auth (handles password hashing)
    const newUser = await auth.api.signUp({
      email,
      password,
      name,
    });

    // Update isAdmin flag
    await db
      .update(users)
      .set({ isAdmin: isAdmin || false })
      .where(eq(users.id, newUser.user.id));

    return json({ success: true, user: newUser.user });
  } catch (e) {
    return json({ error: "Failed to create user" }, { status: 500 });
  }
};
```

Create `src/routes/admin/users/[id]/+server.ts`:
```typescript
import { db } from "$lib/server/db";
import { users, account, session } from "$lib/server/db/schema";
import { json } from "@sveltejs/kit";
import { eq } from "drizzle-orm";
import type { RequestHandler } from "./$types";

export const DELETE: RequestHandler = async ({ params, locals }) => {
  // Require admin access
  if (!locals.session || !locals.isAdmin) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = params.id;

  try {
    // Delete related records first
    await db.delete(session).where(eq(session.userId, userId));
    await db.delete(account).where(eq(account.userId, userId));
    await db.delete(users).where(eq(users.id, userId));

    return json({ success: true });
  } catch (e) {
    return json({ error: "Failed to delete user" }, { status: 500 });
  }
};
```

**Step 3A.4: Add Admin Link to TopBar**

Update TopBar to include admin link for admin users (will do in Phase 4).

---

### Phase 4: UI Components ⏱️ 20 minutes

**Step 4.1: Update TopBar with Sign-In/Sign-Out**

Update `src/lib/components/flasks/TopBar.svelte`:
```svelte
<script lang="ts">
  import { Beaker } from "lucide-svelte";
  import { Button } from "$lib/components/ui/button";
  import { authClient, session, user } from "$lib/auth-client";
  import { goto } from "$app/navigation";

  async function handleSignOut() {
    await authClient.signOut();
    goto("/");
  }
</script>

<div class="bg-yellow-400 px-6 py-3 flex items-center justify-between border-b border-gray-300">
  <div class="flex items-center gap-6">
    <div class="flex items-center gap-2">
      <Beaker class="w-6 h-6" />
      <span class="font-semibold text-lg">FlaskTracker</span>
    </div>
    <nav class="flex gap-4">
      <a href="/" class="hover:underline">Flasks</a>
    </nav>
  </div>

  <div class="flex items-center gap-4">
    {#if $session}
      <span class="text-sm">Welcome, {$user?.name || $user?.email}</span>
      <!-- ADD ADMIN LINK for closed system -->
      {#if data.isAdmin}
        <Button variant="outline" size="sm" on:click={() => goto("/admin/users")}>
          Manage Users
        </Button>
      {/if}
      <Button variant="outline" size="sm" on:click={handleSignOut}>
        Sign out
      </Button>
    {:else}
      <Button variant="outline" size="sm" on:click={() => goto("/auth/signin")}>
        Sign in
      </Button>
    {/if}
  </div>
</div>
```

**Note:** You'll need to pass `isAdmin` flag from `+layout.server.ts` to make it available in TopBar.

**Step 4.2: Create User Profile Display (Optional)**

Create `src/routes/profile/+page.svelte`:
```svelte
<script lang="ts">
  import { user } from "$lib/auth-client";
  import { goto } from "$app/navigation";

  // Redirect if not authenticated
  $: if (!$user) {
    goto("/auth/signin");
  }
</script>

{#if $user}
  <div class="container mx-auto max-w-2xl p-6">
    <h1 class="text-2xl font-bold mb-6">Profile</h1>

    <div class="bg-white rounded-lg shadow p-6 space-y-4">
      <div>
        <label class="block text-sm font-medium text-gray-700">Name</label>
        <p class="mt-1 text-lg">{$user.name}</p>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700">Email</label>
        <p class="mt-1 text-lg">{$user.email}</p>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700">Email Verified</label>
        <p class="mt-1">
          {#if $user.emailVerified}
            <span class="text-green-600">✓ Verified</span>
          {:else}
            <span class="text-yellow-600">⚠ Not verified</span>
          {/if}
        </p>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700">Member Since</label>
        <p class="mt-1">{new Date($user.createdAt).toLocaleDateString()}</p>
      </div>
    </div>
  </div>
{/if}
```

**Step 4.3: Load Session + Admin Flag in Root Layout**

Create `src/routes/+layout.server.ts`:
```typescript
import type { LayoutServerLoad } from "./$types";

export const load: LayoutServerLoad = async ({ locals }) => {
  return {
    session: locals.session,
    user: locals.user,
    isAdmin: locals.isAdmin, // ADD THIS for role-based UI
  };
};
```

---

### Phase 5: Route Protection & Audit Trails ⏱️ 25 minutes

**Step 5.1: Protect Routes with Session Checks**

Update `src/routes/+page.server.ts` (Flasks page):
```typescript
import { db } from "$lib/server/db";
import { flasks, boxContentLines, boxContentHeader, boxes } from "$lib/server/db/schema";
import { eq, or, like, asc, desc, sql } from "drizzle-orm";
import { error, redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals, url }) => {
  // Require authentication
  if (!locals.session) {
    throw redirect(303, "/auth/signin");
  }

  const page = parseInt(url.searchParams.get("page") || "1");
  const flaskSearch = url.searchParams.get("flask") || "";
  const boxSearch = url.searchParams.get("box") || "";
  const sortBy = url.searchParams.get("sort") || "flask";
  const sortDir = url.searchParams.get("dir") || "asc";
  const limit = 15;
  const offset = (page - 1) * limit;

  // Build query with filters
  const conditions = [];
  if (flaskSearch) {
    conditions.push(like(flasks.name, `%${flaskSearch}%`));
  }
  if (boxSearch) {
    conditions.push(like(boxes.name, `%${boxSearch}%`));
  }

  // Sorting
  const orderColumn = sortBy === "box" ? boxes.name : flasks.name;
  const orderFn = sortDir === "desc" ? desc : asc;

  // Query flasks with joins
  const results = await db
    .select({
      id: flasks.id,
      name: flasks.name,
      remarks: flasks.remarks,
      broken: flasks.broken,
      low_pressure: flasks.low_pressure,
      boxName: boxes.name,
    })
    .from(flasks)
    .leftJoin(boxContentLines, eq(flasks.id, boxContentLines.flask_id))
    .leftJoin(boxContentHeader, eq(boxContentLines.box_content_header_id, boxContentHeader.id))
    .leftJoin(boxes, eq(boxContentHeader.box_id, boxes.id))
    .where(conditions.length > 0 ? or(...conditions) : undefined)
    .orderBy(orderFn(orderColumn))
    .limit(limit)
    .offset(offset);

  // Count total for pagination
  const totalResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(flasks)
    .leftJoin(boxContentLines, eq(flasks.id, boxContentLines.flask_id))
    .leftJoin(boxContentHeader, eq(boxContentLines.box_content_header_id, boxContentHeader.id))
    .leftJoin(boxes, eq(boxContentHeader.box_id, boxes.id))
    .where(conditions.length > 0 ? or(...conditions) : undefined);

  const total = Number(totalResult[0]?.count || 0);

  return {
    flasks: results,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
    filters: {
      flask: flaskSearch,
      box: boxSearch,
      sort: sortBy,
      dir: sortDir,
    },
  };
};
```

**Step 5.2: Add Audit Fields to Database Schema**

Update `src/lib/server/db/schema.ts` (example for flasks table):
```typescript
export const flasks = pgTable("flasks", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  remarks: text("remarks"),
  broken: timestamptz("broken"),
  low_pressure: timestamptz("low_pressure"),
  // Audit trail fields
  created_by: text("created_by").notNull(),
  created_at: timestamptz("created_at").notNull().defaultNow(),
  updated_by: text("updated_by").notNull(),
  updated_at: timestamptz("updated_at").notNull().defaultNow(),
});
```

Run migration:
```bash
npx drizzle-kit generate
npx drizzle-kit migrate
```

**Step 5.3: Populate Audit Fields in Form Actions**

Example: Create/Update Flask action with audit trail:
```typescript
import { db } from "$lib/server/db";
import { flasks } from "$lib/server/db/schema";
import { fail, redirect } from "@sveltejs/kit";
import type { Actions } from "./$types";

export const actions: Actions = {
  createFlask: async ({ request, locals }) => {
    // Require authentication
    if (!locals.user) {
      return fail(401, { message: "Unauthorized" });
    }

    const formData = await request.formData();
    const name = formData.get("name") as string;
    const remarks = formData.get("remarks") as string;

    try {
      await db.insert(flasks).values({
        name,
        remarks,
        created_by: locals.user.email,
        updated_by: locals.user.email,
      });

      return { success: true };
    } catch (e) {
      return fail(500, { message: "Failed to create flask" });
    }
  },

  updateFlask: async ({ request, locals }) => {
    // Require authentication
    if (!locals.user) {
      return fail(401, { message: "Unauthorized" });
    }

    const formData = await request.formData();
    const id = parseInt(formData.get("id") as string);
    const name = formData.get("name") as string;
    const remarks = formData.get("remarks") as string;

    try {
      await db
        .update(flasks)
        .set({
          name,
          remarks,
          updated_by: locals.user.email,
          updated_at: new Date(),
        })
        .where(eq(flasks.id, id));

      return { success: true };
    } catch (e) {
      return fail(500, { message: "Failed to update flask" });
    }
  },
};
```

---

### Phase 6: ~~Advanced Features~~ NOT NEEDED for Closed System

**❌ SKIP - Not applicable for closed system**

The following features are NOT needed for FlaskTracker's closed system:
- ❌ OAuth Providers (Google, GitHub) - Internal users only
- ❌ Public sign-up flows - Admin-only user creation
- ❌ Email verification - Admins create verified users
- ❌ Password reset via email - Admins can reset passwords manually

**Optional Features You MAY Want:**
- ✅ 2FA for admin accounts - Extra security for administrators
- ✅ Password change functionality - Users can change their own passwords
- ✅ Audit logging - Track who created/modified what

**Step 6.1: ~~Add OAuth Providers~~ SKIP**

**NOT NEEDED** for closed system.

<details>
<summary>Original OAuth setup (collapsed - skip this)</summary>

**Step 6.1: Add OAuth Providers (Google, GitHub)**

Update `src/lib/server/auth.ts`:
```typescript
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { sveltekitCookies } from "better-auth/svelte-kit";
import { getRequestEvent } from "$app/server";
import { db } from "$lib/server/db";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID as string,
      clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
    },
  },
  plugins: [
    sveltekitCookies(getRequestEvent),
  ],
});
```

**OAuth Setup Steps**:
1. **Google**: Create OAuth app in [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
   - Authorized redirect URI: `https://your-domain.com/api/auth/callback/google`
2. **GitHub**: Create OAuth app in [GitHub Developer Settings](https://github.com/settings/developers)
   - Authorization callback URL: `https://your-domain.com/api/auth/callback/github`

**Update Sign-In Page** to include OAuth buttons:
```svelte
<!-- Add to signin page -->
<div class="mt-4 space-y-2">
  <button
    type="button"
    on:click={() => authClient.signIn.social({ provider: "google" })}
    class="w-full bg-white border py-2 rounded hover:bg-gray-50"
  >
    Sign in with Google
  </button>

  <button
    type="button"
    on:click={() => authClient.signIn.social({ provider: "github" })}
    class="w-full bg-gray-800 text-white py-2 rounded hover:bg-gray-700"
  >
    Sign in with GitHub
  </button>
</div>
```

</details>

**Step 6.2: (Optional) Add Two-Factor Authentication for Admins**

Install 2FA plugin:
```typescript
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { sveltekitCookies } from "better-auth/svelte-kit";
import { twoFactor } from "better-auth/plugins";
import { getRequestEvent } from "$app/server";
import { db } from "$lib/server/db";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  emailAndPassword: {
    enabled: true,
  },
  plugins: [
    twoFactor({
      issuer: "FlaskTracker",
    }),
    sveltekitCookies(getRequestEvent),
  ],
});
```

Generate 2FA tables:
```bash
npx @better-auth/cli generate
npx drizzle-kit generate
npx drizzle-kit migrate
```

**2FA Features**:
- **TOTP**: Authenticator app support (Google Authenticator, Authy)
- **OTP**: Email/SMS one-time passwords
- **Backup Codes**: 10 single-use recovery codes
- **Trusted Devices**: Remember devices for 30 days

---

### Phase 7: ~~Vercel Deployment~~ EXCLUDED FROM THIS PLAN

**⏸️ NOT IN SCOPE - Local Development & Testing Only**

**This plan focuses on local implementation and testing.**

Vercel deployment will be handled separately in a future plan when ready.

For now:
- ✅ Continue local development with Neon database connection (remote but fine for dev)
- ✅ Test all authentication features locally
- ✅ Verify admin user management works
- ❌ NO deployment to Vercel yet

---

<details>
<summary>Future Vercel Deployment Steps (collapsed - not for now)</summary>

When ready to deploy to Vercel later (in a future plan):

**Step 7.1: Update Environment Variables**

In Vercel dashboard, add environment variables:
```env
DATABASE_URL=<neon-postgresql-connection-string>
BETTER_AUTH_SECRET=<generated-secret>
BETTER_AUTH_URL=https://your-app.vercel.app
# NO OAuth providers for closed system
```

**Step 7.2: Deploy to Vercel**

```bash
git add .
git commit -m "Add Better Auth authentication"
git push origin main
```

Vercel will automatically deploy.

**Step 7.3: Test Production Deployment**

1. Visit `https://your-app.vercel.app`
2. Test sign-in with admin account
3. Test admin user management (create/delete users)
4. Test sign-out
5. Test regular user access (non-admin)
6. Verify audit trail (created_by, updated_by) in database

</details>

---

## Updated Recommendation

### Final Comparison: All Four Options

| Criteria | NeonAuth | Auth.js | Clerk | Better Auth |
|----------|----------|---------|-------|-------------|
| **SvelteKit Support** | ❌ None | ✅ Native | ⚠️ Community | ✅ Native |
| **Drizzle ORM** | ❌ N/A | ✅ Adapter | ❌ No | ✅ Native |
| **Cost** | Free | Free | Free (10k limit) | **Free Forever** |
| **Maintenance** | Active | Security only | Commercial | **Active (Auth.js team)** |
| **Features** | N/A | Good | Excellent | **Excellent (built-in)** |
| **Official Status** | Independent | Legacy | Commercial | **Official successor** |
| **Vendor Lock-in** | None | None | High | **None** |
| **Type Safety** | N/A | Good | Good | **Full (auto-gen)** |
| **2FA** | N/A | Manual | Paid | **Built-in (free)** |
| **Organizations** | N/A | Manual | Paid | **Built-in (free)** |
| **Developer Experience** | N/A | Moderate | Easy | **Easy (auto-schema)** |

### 🏆 RECOMMENDED: Better Auth

**Why Better Auth is the Best Choice for FlaskTracker:**

1. **Official Auth.js Successor**
   - Auth.js team now maintains Better Auth
   - Represents the future of the authentication ecosystem
   - Auth.js itself recommends Better Auth for new projects

2. **Perfect Technical Fit**
   - Native SvelteKit 5 support via `better-auth/svelte-kit`
   - Built-in Drizzle ORM adapter (zero friction)
   - Works seamlessly with Neon PostgreSQL
   - Full TypeScript type safety

3. **Superior Features at Zero Cost**
   - Everything Auth.js has, plus more (2FA, organizations, multi-session)
   - No usage limits (unlike Clerk's 10k MAU cap)
   - No premium tiers - all features included
   - Advanced security features built-in (rate limiting, CSRF, password policies)

4. **Excellent Developer Experience**
   - Auto-generates database schemas via CLI
   - Minimal boilerplate code
   - Reactive state management with nano-store
   - Comprehensive documentation

5. **Future-Proof Choice**
   - Active development by the Auth.js team
   - Growing community and ecosystem
   - No vendor lock-in - data stays in your database
   - Migration path from Auth.js if needed

### Alternative: Auth.js (Fallback)

**When to choose Auth.js instead:**
- If you need stateless JWT sessions without a database (now supported in Better Auth too)
- If you're already familiar with Auth.js and don't want to learn new API
- If you need a more mature, battle-tested solution (though Better Auth inherits this)

**Verdict**: Auth.js is a good option, but Better Auth is objectively superior for new projects.

### Alternative: Clerk (Not Recommended)

**When to choose Clerk:**
- If you need pre-built, beautiful UI components and don't want to customize
- If you want a fully managed service with customer support
- If you have enterprise requirements like advanced SSO

**Why we don't recommend it for FlaskTracker**:
- Costs $25+/month after 10k users (Better Auth is free forever)
- Vendor lock-in (data in Clerk's database)
- Requires custom domain for production
- Overkill for a small-to-medium application

### Implementation Plan Update

**Recommended Path Forward:**

1. ✅ **Phase 3 Complete**: Authentication research complete
2. 🆕 **Implement Better Auth** (Phases 1-7 above) - **5-7 hours total**
3. ⏭️ **Continue with other features** (New/Edit Flask, Issue tracking, etc.)

**Better Auth delivers more features than Auth.js, at the same cost (free), with better developer experience.**

---

## Migration Considerations

### From Auth.js to Better Auth

If you've already implemented Auth.js, Better Auth provides an official migration guide:
- [Migrating from Auth.js to Better Auth](https://authjs.dev/getting-started/migrate-to-better-auth)
- [Better Auth Migration Guide](https://www.better-auth.com/docs/guides/next-auth-migration-guide)

**Key Migration Steps**:
1. Install Better Auth packages
2. Update auth instance configuration (similar API)
3. Run schema migration (Better Auth CLI)
4. Update client code (similar method signatures)
5. Test authentication flows

**Data Compatibility**:
- Better Auth can read existing Auth.js user/session tables
- Migration is non-destructive (keeps existing users)
- OAuth accounts carry over automatically

### From Clerk to Better Auth

If you've already implemented Clerk:
- More complex migration (different database schema)
- Need to export user data from Clerk
- Re-map fields to Better Auth schema
- Users need to reset passwords (unless using OAuth only)

**Verdict**: Better to start with Better Auth from the beginning.

---

## Testing Checklist

### Local Development Testing (Closed System)

**Setup:**
- [ ] Install Better Auth package
- [ ] Generate and configure environment variables (local Neon connection)
- [ ] Create auth instance with Drizzle adapter (no OAuth)
- [ ] Generate database schema via CLI
- [ ] Extend schema with `isAdmin` field
- [ ] Apply migrations to Neon PostgreSQL (remote, but fine for dev)
- [ ] Configure SvelteKit hooks with isAdmin check
- [ ] Set up client with reactive stores
- [ ] Update TypeScript types (add isAdmin to locals)

**Admin User Setup:**
- [ ] Create first admin user via script or SQL
- [ ] Verify admin user exists in database
- [ ] Test admin sign-in

**User Interface:**
- [ ] ❌ NO signup page created (closed system)
- [ ] Create sign-in page (without signup link)
- [ ] Create admin user management page (`/admin/users`)
- [ ] Update TopBar with "Manage Users" link (admins only)
- [ ] Create user management API endpoints

**Authentication Testing:**
- [ ] Test admin sign-in (email/password)
- [ ] Test regular user sign-in (email/password)
- [ ] Test sign-out
- [ ] Verify session persistence across page loads
- [ ] Test route protection (redirect to signin)
- [ ] Test admin-only routes (regular users blocked)

**User Management Testing:**
- [ ] Test creating new user as admin
- [ ] Test creating admin user as admin
- [ ] Test deleting user as admin
- [ ] Verify regular users cannot access `/admin/users`
- [ ] Test password hashing (cannot see plaintext passwords)

**Audit Trail Testing:**
- [ ] Test audit trail (created_by, updated_by) in Flask operations
- [ ] Verify user email is recorded in audit fields

### ~~OAuth Provider Testing~~ NOT APPLICABLE (Closed System)

**SKIP** - No OAuth providers for closed system

### Advanced Features Testing (Optional)

- [ ] Enable 2FA plugin
- [ ] Test TOTP setup with authenticator app
- [ ] Test OTP via email
- [ ] Test backup codes
- [ ] Test trusted device functionality

### ~~Vercel Testing~~ NOT YET

**SKIP FOR NOW** - Local development only, no deployment yet

When ready to deploy later:
- [ ] Set environment variables in Vercel
- [ ] Update BETTER_AUTH_URL to production domain
- [ ] Deploy to production
- [ ] Test admin sign-in on production
- [ ] Test admin user management on production
- [ ] Verify session security (HTTPS only)
- [ ] Test sign-out on production
- [ ] Verify database connection (Neon production)
- [ ] Monitor error logs for auth issues

### Security & Performance

- [ ] Verify CSRF protection enabled
- [ ] Test rate limiting (multiple failed logins)
- [ ] Verify password policies enforced
- [ ] Test XSS protection (malicious input)
- [ ] Verify session expiration
- [ ] Test cookie security (httpOnly, secure flags)
- [ ] Monitor database query performance
- [ ] Test concurrent sessions

---

## Research Sources

This plan was compiled using the following sources:

### Official Documentation
- [Auth.js is now part of Better Auth](https://www.better-auth.com/blog/authjs-joins-better-auth) - Official announcement
- [Migrating from Auth.js to Better Auth](https://authjs.dev/getting-started/migrate-to-better-auth) - Official migration guide
- [Better Auth Official Docs](https://www.better-auth.com/) - Primary documentation
- [SvelteKit Integration](https://www.better-auth.com/docs/integrations/svelte-kit) - SvelteKit adapter
- [Drizzle ORM Adapter](https://www.better-auth.com/docs/adapters/drizzle) - Database integration
- [Installation Guide](https://www.better-auth.com/docs/installation) - Setup instructions
- [Two-Factor Authentication](https://www.better-auth.com/docs/plugins/2fa) - 2FA plugin
- [SvelteKit Example](https://www.better-auth.com/docs/examples/svelte-kit) - Code examples

### Comparisons & Analysis
- [Better Auth vs NextAuth (Authjs) vs Auth0](https://betterstack.com/community/guides/scaling-nodejs/better-auth-vs-nextauth-authjs-vs-autho/) - Comprehensive comparison
- [Better Auth vs Auth.js](https://avishka.dev/blog/better-auth-vs-auth-js) - Developer perspective
- [Better Auth: the future of Auth.js](https://www.premieroctet.com/blog/en/better-auth-future-of-authjs) - Future outlook
- [Auth.js vs Better Auth Features & Pricing](https://toolquestor.com/vs/authjs-vs-better-auth) - Feature matrix
- [Next-auth.js vs Better-auth (2025)](https://indie-starter.dev/blog/next-auth-js-vs-better-auth) - 2025 comparison

### Code Examples & Tutorials
- [GitHub: better-auth-sveltekit5-example](https://github.com/vanbenj/better-auth-sveltekit5-example) - SvelteKit 5 example
- [SvelteKit + Drizzle + Better Auth](https://medium.com/@dasfacc/sveltekit-better-auth-using-cloudflare-d1-and-drizzle-91d9d9a6d0b4) - Full stack tutorial
- [Adding Better Auth to Svelte 5](https://awingender.com/blog/better-auth-svelte-5-authentication/) - Step-by-step guide
- [GitHub: svelte-starter (Better Auth + Drizzle)](https://github.com/dotnize/svelte-starter) - Starter template

### Community Discussion
- [Auth.js joins Better Auth (GitHub Discussion)](https://github.com/nextauthjs/next-auth/discussions/13252) - Community reaction

---

## Next Steps

1. **Review this plan** with stakeholders
2. **Decide**: Better Auth vs Auth.js vs Clerk
3. **If Better Auth is chosen**: Follow Phases 1-7 implementation roadmap
4. **Estimate**: 5-7 hours for full implementation (all phases)
5. **Timeline**: Can complete in 1-2 development sessions

**Recommendation**: Proceed with Better Auth implementation. It's the most future-proof, cost-effective, and feature-rich solution for FlaskTracker.

---

**Document Status**: ✅ Complete and ready for implementation
**Next Document**: TBD (based on decision)
