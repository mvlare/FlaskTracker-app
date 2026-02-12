# CLAUDE

## Documentation Structure

**Key reference docs:**
- `product_docs\architecture.md` - Tech stack and architectural decisions
- `product_docs\authentication.md` - Detailed auth implementation reference
- `product_docs\*.md` - Feature specifications (numbered 0100+)
- `product_docs\research\` - Option evaluations and explorations
- `product_docs\archive\` - Completed implementation plans

## Database Operations

**DO NOT run `npm run db:push` from this environment.**

Database schema changes are managed separately and applied directly to the Neon PostgreSQL database. The local development environment should only update the Drizzle schema definitions to match the database state, not push changes to the database.

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

## Date Formatting

**ALWAYS use DD-MM-YYYY format for date display (Netherlands locale):**

This application is used in the Netherlands, so all dates must be displayed in the DD-MM-YYYY format.

```typescript
import { formatDateDisplay } from '$lib/utils/dates';

// Display dates:
const displayDate = formatDateDisplay(date); // Returns DD-MM-YYYY
```

**Important:**
- Use the `formatDateDisplay()` utility function from `/src/lib/utils/dates.ts` for all date display
- The format is DD-MM-YYYY (day-month-year), NOT MM-DD-YYYY or YYYY-MM-DD
- This applies to all dates shown in the UI: flask dates, low pressure events, created/updated dates, etc.
- When working with HTML date inputs (type="date"), remember they use YYYY-MM-DD internally but should display as DD-MM-YYYY to users

**Related files:**
- `/src/lib/utils/dates.ts` - Date formatting utilities