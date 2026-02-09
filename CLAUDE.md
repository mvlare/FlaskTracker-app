# CLAUDE

## Development approach
The product descriptions are in folder \product_docs\*.md in alpabetical order ascending.
The first plan with phases and steps is placed \product_docs\plan1.md refering to the product descriptions.
Followup of plans will be in plan[nr].md

The plans contain steps and a indicator if it is done [ ].
On executing the plan Claude will updat the plan, give findings, possible followups.

## Authentication & Security

### Password Hashing - CRITICAL
**ALWAYS use better-auth's built-in password hashing function:**

```typescript
import { hashPassword } from "better-auth/crypto";

// When creating or resetting passwords:
const hashedPassword = await hashPassword(plainPassword);
```

**DO NOT use external hashing libraries** like bcrypt, argon2, @node-rs/argon2, etc. These will create incompatible password hashes that won't work with better-auth's authentication.

**Why this matters:**
- Better-auth has its own internal password hashing implementation
- Using external libraries creates hashes that better-auth cannot verify
- This causes authentication to fail even with correct passwords
- Always let better-auth handle password hashing for consistency

**Examples:**
- ✅ **Correct:** User creation via `auth.api.signUpEmail()` - handles hashing internally
- ✅ **Correct:** Password reset using `hashPassword()` from `better-auth/crypto`
- ❌ **Wrong:** Using bcrypt, argon2, or any external hashing library
- ❌ **Wrong:** Manually implementing password hashing logic

**Related files:**
- `/src/lib/server/auth.ts` - better-auth configuration
- `/src/routes/admin/users/+server.ts` - user creation (uses auth.api)
- `/src/routes/admin/users/[id]/+server.ts` - password reset (uses hashPassword)
- `/src/routes/auth/change-password/+page.svelte` - user password change (uses authClient API)