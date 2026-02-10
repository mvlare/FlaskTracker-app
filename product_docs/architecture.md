# Architecture

## Components

- Svelte and Svelte kit 5 latest
- Typescript
- Zod: the TypeScript-first schema validation library (installed but not currently used - see Form Validation Decision below)
- Drizzle ORM for svelte ( https://orm.drizzle.team/)
- Neon PostgreSQL (database is in a seperate repository)
- Better Auth for login and authorisation (https://www.better-auth.com/)
- shadcn for Svelte: https://www.shadcn-svelte.com/
- Dates Timezone compliant. date-fn

## Deployments
- Neon PostgreSQL
- Application on Vercel:

Notes on configuration. Not to pick up by claude.
## Open Points
~~Try to use NeonAuth for user authentication. If it does not work out will use clerk.~~

**Authentication Decision (2026-02-06):**

**FINAL DECISION: Better Auth** ✅

- ❌ NeonAuth: NOT VIABLE (no SvelteKit support - only Next.js, React, React Router)
- ❌ Auth.js: Superseded by Better Auth (Auth.js team now maintains Better Auth)
- ❌ Clerk: Not chosen (vendor lock-in, usage limits after 10k MAU, paid features)
- ✅ **Better Auth (https://www.better-auth.com/)**: CHOSEN
  - Official successor to Auth.js (Auth.js team joined Better Auth Sept 2025)
  - Free forever, no usage limits
  - Native SvelteKit support via `better-auth/svelte-kit`
  - Built-in Drizzle ORM adapter with PostgreSQL (Neon) support
  - TypeScript-first with auto-generated schemas
  - Advanced features built-in: 2FA, organizations, multi-session, rate limiting
  - No vendor lock-in - data stays in your database

**Implementation Approach for FlaskTracker:**
- 🔒 **Closed System**: No public signup - admin-only user management
- 👤 **Role-based Access**: Admin users can create/manage other users
- 📝 **Audit Trails**: Track who created/modified data (created_user_id, updated_user_id fields)
- 🏠 **Local Development First**: Test with Neon database locally before any deployment
- ⏸️ **No Vercel Deployment Yet**: Focus on local implementation and testing

**⚠️ CRITICAL: Password Hashing:**
- **ALWAYS use Better Auth's API** for user creation (`auth.api.signUpEmail()`)
- **NEVER manually hash passwords** using bcrypt, SHA-256, or any other method
- Better Auth uses its own internal password hashing format
- Manually hashed passwords will fail with "Invalid password hash" error
- This applies to:
  - Admin user creation scripts
  - User management endpoints
  - Any user creation functionality

See detailed implementation plan in `/product_docs/plan5_betterauth.md`

**Form Validation Decision (2026-02-10):**

**DECISION: Defer Zod + Superforms/Snapforms** ⏸️

- ✅ **Zod installed** (v4.3.6) but not currently used
- ⏸️ **Superforms/Snapforms**: Not implemented - overkill for current needs
- 📝 **Current approach**: Native HTML5 validation + basic JavaScript checks

**Rationale:**
- Application has relatively simple forms (user management, password changes, basic tracking)
- Better Auth handles its own validation internally
- Zod + Superforms adds extra boilerplate and abstraction layers
- Can be added later if form complexity grows (multi-step forms, complex nested validation, file uploads)

**Future consideration:**
- Re-evaluate if form requirements become more complex
- Consider removing Zod dependency if not needed in near term
- Alternative: Implement Zod gradually only for complex forms

**When to reconsider:**
- Complex multi-step forms required
- Heavy client-side validation needs
- Type-safe form → API → database pipelines needed
- Many forms with nested objects or conditional validation

- Neon with its objects is present in a separate Repo. 
  npx neonctl@latest init is not needed for connecting to DB. 

- Drizzle claude configuration notes:
The correct API is timestamp(name, { withTimezone: true }). 
A small helper (const timestamptz = ...) wraps    