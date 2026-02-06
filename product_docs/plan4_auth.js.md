# Plan 4: Authentication Implementation Decision & Roadmap

**Date Created**: 2026-02-06
**Status**: ⚠️ **SUPERSEDED BY PLAN 5**
**Purpose**: Compare authentication options and provide implementation roadmap

---

## ⚠️ IMPORTANT NOTICE

**This plan has been superseded by `plan5_betterauth.md`**

**Reason for Change:**
- In September 2025, the Auth.js development team joined Better Auth
- Better Auth is now the **official successor to Auth.js**
- Auth.js will receive security patches only - new features go to Better Auth
- Better Auth offers more features at the same cost (free) with better DX

**New Decision:**
- ✅ **Better Auth** - Official successor, more features, same free price
- ❌ Auth.js - Legacy (still supported but not recommended for new projects)
- ❌ Clerk - Not chosen (vendor lock-in, usage limits, paid features)

**Please refer to:**
📄 `/product_docs/plan5_betterauth.md` for the current implementation plan

---

## Original Plan 4 Content (Archived)

<details>
<summary>Click to expand archived Auth.js research (for reference only)</summary>

---

[Original content follows below - kept for historical reference]

# Plan 4: Authentication Implementation Decision & Roadmap

**Date Created**: 2026-02-06
**Status**: Decision Phase
**Purpose**: Compare authentication options and provide implementation roadmap

---

## Executive Summary

After investigating three authentication options (NeonAuth, Auth.js, Clerk), this document provides:
1. ✅ **Compatibility analysis** for each option with FlaskTracker tech stack
2. ✅ **Feature comparison** matrix
3. ✅ **Recommendation** based on project requirements
4. 📋 **Implementation roadmap** for chosen solution

---

## Research Findings

### Option 1: NeonAuth ❌ NOT VIABLE

**What is NeonAuth?**
- Native authentication service by Neon PostgreSQL
- Branch-aware authentication (auth state branches with database)
- Deep integration with Neon ecosystem

**Pricing:**
- Free tier: Up to 60,000 MAU (Monthly Active Users)
- Generous for small-to-medium projects

**Documentation:**
- https://neon.com/docs/auth/overview

**Critical Blocker:**
- ❌ **Does NOT support SvelteKit**
- ✅ Only supports: Next.js, React, React Router
- ❌ No SvelteKit adapter available
- ❌ No planned SvelteKit support mentioned in documentation

**Verdict:** Cannot follow architecture preference (0000_architecture.md:20) due to framework incompatibility.

---

### Option 2: Auth.js (@auth/sveltekit) ✅ VIABLE

**What is Auth.js?**
- Official authentication library (formerly NextAuth.js)
- Framework-agnostic with SvelteKit adapter
- Open-source, community-driven
- Used by major projects (Next.js, Remix, SolidStart)

**SvelteKit Integration:**
- Package: `@auth/sveltekit`
- Status: ⚠️ Experimental (but actively developed)
- Official adapter from Auth.js team

**Key Features:**
- ✅ OAuth providers (Google, GitHub, Discord, etc.)
- ✅ Email/password authentication
- ✅ Magic link login
- ✅ JWT and database sessions
- ✅ Works with Drizzle ORM (already in project)
- ✅ Can use Neon PostgreSQL as session store
- ✅ TypeScript support
- ✅ SSR compatible

**Pricing:**
- 🆓 **100% Free** (open-source, MIT license)
- No usage limits
- No vendor lock-in
- Self-hosted

**Documentation:**
- https://authjs.dev/reference/sveltekit
- https://authjs.dev/getting-started/installation

**Pros:**
- Free and open-source
- Works with existing Drizzle + Neon stack
- Active community support
- No external service dependencies
- Full control over auth logic

**Cons:**
- Experimental status (may have breaking changes)
- Requires more manual setup than managed services
- Need to implement UI components yourself
- Session management complexity
- Security responsibility on developer

**Integration Complexity:** Medium (more setup than Clerk, less than custom JWT)

---

### Option 3: Clerk (svelte-clerk) ✅ VIABLE

**What is Clerk?**
- Commercial authentication-as-a-service
- Managed service with beautiful pre-built UI
- Enterprise-grade features (MFA, SSO, audit logs)

**SvelteKit Integration:**
- Package: `svelte-clerk` (unofficial, community-maintained)
- Author: Robert Soriano (@wobsoriano)
- Status: Actively maintained (v0.18.7, 220 GitHub stars)
- Proven SvelteKit 5 support

**Key Features:**
- ✅ Pre-built UI components (sign-in, sign-up, user profile)
- ✅ OAuth providers (Google, GitHub, Microsoft, etc.)
- ✅ Multi-factor authentication (MFA)
- ✅ Single Sign-On (SSO)
- ✅ User management dashboard
- ✅ Webhooks for user events
- ✅ TypeScript support
- ✅ SSR compatible (buildClerkProps)

**Pricing:**
- Free tier: 10,000 MAU (Monthly Active Users)
- Pro: $25/month + $0.02 per additional MAU
- Enterprise: Custom pricing

**Documentation:**
- https://github.com/wobsoriano/svelte-clerk
- https://clerk.com/docs

**Pros:**
- Beautiful pre-built UI (saves development time)
- Rich feature set (MFA, SSO, audit logs)
- Managed service (no security maintenance burden)
- Fast integration (4-5 hours)
- Professional user experience

**Cons:**
- ⚠️ Unofficial package (not from Clerk Inc.)
- 💰 Usage-based pricing (costs scale with users)
- 🔒 Vendor lock-in (migration requires effort)
- ⚠️ Custom domain required for production
- 📦 Dependency on third-party maintainer

**Integration Complexity:** Low (minimal setup, pre-built components)

---

[... rest of archived content ...]

</details>

---

**Document Status**: 🗄️ Archived - Superseded by Plan 5
**Current Plan**: See `/product_docs/plan5_betterauth.md`
