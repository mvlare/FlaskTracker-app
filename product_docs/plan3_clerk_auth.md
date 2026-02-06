# Plan 3 - Phase 3: Authentication Verification

## Research Request (Date: 2026-02-06)
Verify if Clerk Svelte authorization can work in this FlaskTracker project for Vercel deployment.
Reference: https://github.com/wobsoriano/svelte-clerk

## Verification Result: ✅ YES, Clerk Svelte Works with This Project

### Compatibility Analysis

| Requirement | Current State | Clerk Support | Compatible? |
|------------|---------------|---------------|-------------|
| SvelteKit 5 | ✅ Implemented | ✅ Supported (v0.18.7) | ✅ YES |
| TypeScript | ✅ Strict mode | ✅ Full support | ✅ YES |
| Vercel Deployment | ✅ Planned | ✅ Works with adapter-vercel | ✅ YES |
| SSR Support | ✅ Using +layout.server.ts | ✅ buildClerkProps available | ✅ YES |
| Database Integration | ✅ Drizzle + Neon | ✅ userId for audit fields | ✅ YES |
| Production Domain | ⚠️ Required | ⚠️ Required (no *.vercel.app) | ⚠️ REQUIRED |

### Current Architecture Notes

From `product_docs/0000_architecture.md` (line 20):
> "Try to use NeonAuth for user authentication. If it does not work out will use clerk."

**Architecture Preference**: NeonAuth first, Clerk as fallback

**Current Auth Status**:
- ❌ No authentication implemented
- ✅ Placeholder "Sign in" button exists in TopBar.svelte
- ✅ Database audit fields ready (created_by, updated_by)
- ❌ Login spec (0101_login.md) is empty stub

## Package Overview: svelte-clerk

### What is svelte-clerk?

**Official Description**: "The easiest way to add authentication and user management to your Svelte and SvelteKit applications."

**Key Details**:
- **Status**: Actively maintained (v0.18.7, updated daily)
- **Affiliation**: ⚠️ Unofficial/community package (not from Clerk Inc.)
- **Maintainer**: Robert Soriano (@wobsoriano)
- **GitHub**: 220 stars, 8 forks, 153 releases
- **License**: MIT
- **Svelte 5 Support**: ✅ YES (as of recent versions)

### Alternative Considered: clerk-sveltekit

**Status**: ❌ DEPRECATED (archived August 17, 2025)
**Recommendation from maintainer**: Use svelte-clerk instead
**Conclusion**: svelte-clerk is the current community standard

## Implementation Steps

### Prerequisites
1. ✅ SvelteKit 5 project (already have)
2. ✅ TypeScript configured (already have)
3. ⚠️ Clerk account (need to create)
4. ⚠️ Vercel account (need to set up if not already)
5. ⚠️ Custom domain for production (required)

### Step 1: Clerk Account Setup

**Actions**:
1. Create account at https://clerk.com
2. Create new application in Clerk Dashboard
3. Obtain API keys from Dashboard → API Keys page:
   - Development: `pk_test_...` and `sk_test_...`
   - Production: `pk_live_...` and `sk_live_...`

**Cost Consideration**: Review Clerk pricing tiers before proceeding

### Step 2: Install Package

```bash
npm install svelte-clerk
```

**Package Details**:
- Adds authentication components
- Provides session/user state management
- Includes TypeScript definitions
- SSR-compatible

### Step 3: Environment Variables

**Add to `.env`** (local development):
```env
PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxx
CLERK_SECRET_KEY=sk_test_xxxxxxx
```

**Add to Vercel** (deployment):
1. Navigate to Vercel project → Settings → Environment Variables
2. Add keys with environment-specific configuration:
   - **Development/Preview**: Use test keys (`pk_test_...`, `sk_test_...`)
   - **Production**: Use live keys (`pk_live_...`, `sk_live_...`)

### Step 4: Server Hooks Configuration

**Create `src/hooks.server.ts`**:
```typescript
import { withClerkHandler } from 'svelte-clerk/server';

export const handle = withClerkHandler();
```

**What this does**:
- Authenticates incoming requests
- Provides `Auth` object via `event.locals.auth()`
- Enables server-side user/session access

### Step 5: Type Definitions

**Update `src/app.d.ts`**:
```typescript
/// <reference types="svelte-clerk/env" />

declare global {
	namespace App {
		// Existing types...
	}
}

export {};
```

**What this does**:
- Adds TypeScript support for Clerk types
- Enables autocomplete for Clerk functions
- Prevents type errors in IDE

### Step 6: Root Layout Provider

**Update `src/routes/+layout.svelte`**:
```svelte
<script lang="ts">
	import { ClerkProvider } from 'svelte-clerk';
	const { children } = $props();
</script>

<ClerkProvider>
	{@render children()}
</ClerkProvider>
```

**What this does**:
- Wraps entire app in authentication context
- Makes auth state available to all child components
- Required for Clerk components to work

### Step 7: SSR Support

**Create `src/routes/+layout.server.ts`**:
```typescript
import { buildClerkProps } from 'svelte-clerk/server';

export const load = ({ locals }) => ({
	...buildClerkProps(locals.auth())
});
```

**What this does**:
- Passes initial auth state from server to client
- Prevents flash of unauthenticated content
- Enables server-side rendering of authenticated pages

### Step 8: Update TopBar Component

**Update `src/lib/components/flasks/TopBar.svelte`**:

Replace the placeholder sign-in button with real Clerk components:

```svelte
<script lang="ts">
	import { SignedIn, SignedOut, SignInButton, UserButton } from 'svelte-clerk';
	import { FlaskConical } from 'lucide-svelte';
</script>

<div class="bg-gradient-to-r from-yellow-400 to-yellow-500 text-white p-4 shadow-md">
	<div class="max-w-7xl mx-auto flex items-center justify-between">
		<div class="flex items-center gap-6">
			<FlaskConical class="h-6 w-6" />
			<nav class="flex gap-4">
				<a href="/" class="hover:underline font-semibold">Flasks</a>
			</nav>
		</div>

		<div class="flex items-center gap-4">
			<!-- Show sign in button when user is not authenticated -->
			<SignedOut>
				<SignInButton mode="modal" />
			</SignedOut>

			<!-- Show user button when authenticated -->
			<SignedIn>
				<UserButton />
			</SignedIn>
		</div>
	</div>
</div>
```

**Available Clerk Components**:
- `<SignedIn>` - Only renders children when user is authenticated
- `<SignedOut>` - Only renders children when user is not authenticated
- `<SignInButton>` - Button that triggers sign-in modal or redirect
- `<UserButton>` - User profile menu with sign out option
- `<SignUpButton>` - Button that triggers sign-up flow

### Step 9: Protect Routes (Server-Side)

**Update `src/routes/+page.server.ts`**:

Add authentication check to the load function:

```typescript
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { db } from '$lib/server/db';
import { flasks, boxes, boxContentHeaders, boxContentLines } from '$lib/server/db/schema';
import { eq, ilike, and, isNull, asc, desc } from 'drizzle-orm';

export const load: PageServerLoad = async ({ url, locals }) => {
	// Authentication check
	const { userId } = locals.auth();
	if (!userId) {
		return redirect(307, '/sign-in');
	}

	// Existing load logic...
	const page = parseInt(url.searchParams.get('page') || '1');
	// ... rest of existing code

	return {
		flasks: flasksList,
		totalPages,
		currentPage: page,
		userId // Pass userId to client for UI
	};
};

export const actions: Actions = {
	updateRemarks: async ({ request, locals }) => {
		// Get authenticated user
		const { userId } = locals.auth();
		if (!userId) {
			return { success: false, error: 'Unauthorized' };
		}

		const formData = await request.formData();
		const flaskId = parseInt(formData.get('flaskId') as string);
		const remarks = formData.get('remarks') as string;

		try {
			// Update with userId for audit trail
			await db.update(flasks)
				.set({
					remarks: remarks || null,
					updatedAt: new Date(),
					updatedBy: userId // Populate audit field!
				})
				.where(eq(flasks.id, flaskId));

			return { success: true };
		} catch (error) {
			console.error('Failed to update remarks:', error);
			return { success: false, error: 'Failed to save remarks' };
		}
	}
};
```

**What this adds**:
- Redirects unauthenticated users to sign-in
- Populates audit fields with actual user IDs
- Protects form actions from unauthorized access

### Step 10: Create Sign-In Page (Optional)

**Create `src/routes/sign-in/+page.svelte`**:
```svelte
<script lang="ts">
	import { SignIn } from 'svelte-clerk';
</script>

<div class="min-h-screen flex items-center justify-center bg-gray-50">
	<SignIn />
</div>
```

**Alternative**: Use Clerk's hosted sign-in UI (no page creation needed)

### Step 11: Vercel Deployment

**Install Vercel adapter** (if not already using adapter-auto):
```bash
npm install -D @sveltejs/adapter-vercel
```

**Update `svelte.config.js`** (if needed):
```javascript
import adapter from '@sveltejs/adapter-vercel';

export default {
	kit: {
		adapter: adapter()
	}
};
```

**Deploy to Vercel**:
1. Connect GitHub repository to Vercel
2. Vercel auto-detects SvelteKit (zero-config)
3. Add environment variables (see Step 3)
4. Deploy!

### Step 12: Production Domain Setup

⚠️ **REQUIRED FOR PRODUCTION**

**Why**: Clerk requires DNS configuration that *.vercel.app domains don't support

**Steps**:
1. Purchase/own a domain (e.g., flasktracker.yourdomain.com)
2. Add domain to Vercel project
3. Configure DNS records as instructed by Vercel
4. Use production Clerk keys in Vercel environment
5. Update Clerk Dashboard with production domain

## Testing & Verification

### Local Testing (Development)
- [ ] Run `npm run dev`
- [ ] Visit http://localhost:5173
- [ ] Click "Sign In" button
- [ ] Complete sign-in flow (email/password or OAuth)
- [ ] Verify UserButton appears when authenticated
- [ ] Test sign-out functionality
- [ ] Verify protected routes redirect to sign-in
- [ ] Test remarks save with userId populated

### Vercel Preview Testing
- [ ] Push code to Git
- [ ] Trigger Vercel preview deployment
- [ ] Test sign-in with test keys
- [ ] Verify environment variables work
- [ ] Check SSR hydration (no flash of unauthenticated state)

### Production Testing
- [ ] Configure custom domain
- [ ] Set production Clerk keys in Vercel
- [ ] Deploy to production
- [ ] Test full authentication flow
- [ ] Verify audit trails in database

## Risks & Considerations

### Risk 1: Unofficial Package
**Risk**: svelte-clerk is community-maintained, not official Clerk SDK
**Impact**: Breaking changes, maintenance gaps, feature delays
**Mitigation**:
- Pin package version in package.json
- Monitor GitHub repository for issues
- Have migration plan to official SDK if one emerges
- Consider NeonAuth as alternative (per architecture preference)

### Risk 2: Clerk Pricing
**Risk**: Clerk has usage-based pricing that may scale with user growth
**Impact**: Unexpected costs as user base grows
**Mitigation**:
- Review pricing tiers: https://clerk.com/pricing
- Set up billing alerts
- Evaluate NeonAuth first (may be more cost-effective)
- Consider self-hosted alternatives (Supabase Auth, Auth.js)

### Risk 3: Custom Domain Requirement
**Risk**: Production requires custom domain ownership
**Impact**: Additional cost, DNS setup complexity
**Mitigation**:
- Budget for domain purchase/renewal
- Document DNS configuration steps
- Use Vercel's domain setup wizard

### Risk 4: Vendor Lock-In
**Risk**: Deep integration with Clerk makes switching difficult
**Impact**: Migration effort if pricing or service becomes unfavorable
**Mitigation**:
- Abstract authentication behind interface layer
- Store user data in own database (Neon)
- Use Clerk primarily for auth, not user management
- Keep migration path open

## Alternative: NeonAuth Investigation

**Architecture Preference** (per 0000_architecture.md): Try NeonAuth first

### Research Questions (To Be Answered):
1. Does Neon PostgreSQL offer native authentication?
2. What features does NeonAuth provide?
3. How does it compare to Clerk in terms of:
   - Features (SSO, MFA, OAuth providers)
   - Ease of integration with SvelteKit
   - Pricing (likely lower if built into Neon)
   - Security and compliance
4. Is there a SvelteKit integration package?
5. Does it support SSR like Clerk?

### Recommendation:
**Before implementing Clerk, investigate NeonAuth thoroughly** as it:
- Aligns with architecture preference
- May reduce vendor dependencies
- Could be more cost-effective (already using Neon)
- Keeps database and auth in same service

## Files That Will Be Modified (Clerk Implementation)

1. **New Files**:
   - `src/hooks.server.ts` - Server authentication handler
   - `src/routes/+layout.server.ts` - SSR auth state
   - `src/routes/sign-in/+page.svelte` - Sign-in page (optional)
   - `src/routes/sign-up/+page.svelte` - Sign-up page (optional)

2. **Modified Files**:
   - `package.json` - Add svelte-clerk dependency
   - `.env` - Add Clerk API keys (local)
   - `src/app.d.ts` - Type definitions
   - `src/routes/+layout.svelte` - Add ClerkProvider
   - `src/lib/components/flasks/TopBar.svelte` - Real auth components
   - `src/routes/+page.server.ts` - Add auth checks, populate userId

3. **Vercel Configuration**:
   - Environment variables (via Vercel Dashboard)
   - Custom domain setup (for production)

## Estimated Implementation Time

- **Clerk Account Setup**: 15 minutes
- **Package Installation & Config**: 30 minutes
- **Component Updates**: 1 hour
- **Route Protection**: 30 minutes
- **Testing**: 1 hour
- **Vercel Deployment**: 30 minutes
- **Production Domain Setup**: 1-2 hours (includes DNS propagation)

**Total**: ~4-5 hours for full Clerk implementation

## Next Steps Decision Point

**Option 1: Research NeonAuth First** (Recommended per architecture)
- [ ] Investigate NeonAuth capabilities
- [ ] Compare with Clerk feature-by-feature
- [ ] Document findings in new plan
- [ ] Make informed decision

**Option 2: Proceed with Clerk** (If NeonAuth insufficient)
- [ ] Create Clerk account
- [ ] Follow implementation steps above
- [ ] Test locally
- [ ] Deploy to Vercel

**Option 3: Consider Other Alternatives**
- Auth.js (formerly NextAuth) - has SvelteKit adapter
- Supabase Auth - open-source, similar to Clerk
- Custom JWT-based auth with Neon

## References & Documentation

- **svelte-clerk GitHub**: https://github.com/wobsoriano/svelte-clerk
- **svelte-clerk Docs**: https://svelte-clerk.netlify.app
- **Clerk Main Docs**: https://clerk.com/docs
- **Clerk Vercel Guide**: https://clerk.com/docs/guides/development/deployment/vercel
- **SvelteKit Docs**: https://svelte.dev/docs/kit
- **Vercel SvelteKit Guide**: https://vercel.com/docs/frameworks/full-stack/sveltekit

## Conclusion

✅ **Clerk Svelte authorization WILL work with this project**

**Technical Compatibility**: 100% compatible with SvelteKit 5, TypeScript, Vercel, and Neon PostgreSQL

**Recommendation**:
1. First investigate NeonAuth (aligns with architecture preference)
2. If NeonAuth is insufficient, implement Clerk using steps above
3. Both options are viable for production deployment

**Blocker**: Custom domain required for production (plan and budget accordingly)