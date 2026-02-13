# CLAUDE

## Documentation Structure

**Key reference docs:**
- `product_docs\architecture.md` - Tech stack and architectural decisions
- `product_docs\authentication.md` - Detailed auth implementation reference
- `product_docs\*.md` - Feature specifications (numbered 0100+)
- `product_docs\research\` - Option evaluations and explorations
- `product_docs\archive\` - Completed implementation plans
- `system_docs\refactorings\` - Major refactoring artifacts (testing checklists, notes)

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

## Coding Standards

### Server-Side Utilities

**ALWAYS use shared utilities instead of inline logic:**

The application has centralized utility modules to eliminate code duplication and ensure consistency across all route handlers. Always use these utilities instead of reimplementing the same logic inline.

#### Validation (`src/lib/server/utils/validation.ts`)

**Available functions:**
- `validateRequired(value, fieldName)` - Required field validation
- `processRemarks(remarksRaw)` - Trim and convert empty to null
- `parseDateToUTC(dateString)` - Parse HTML date input to UTC midnight
- `validateDateNotFuture(date)` - Reject future dates (allows today)
- `validateDateNotPast(date)` - Reject past dates (allows today)
- `validatePassword(password)` - Password requirements (8+ characters)
- `validateEmail(email)` - Email format validation

**Usage example:**
```typescript
import { validateRequired, processRemarks, parseDateToUTC } from '$lib/server/utils/validation';

const nameError = validateRequired(name, 'Flask name');
if (nameError) {
	return fail(400, { error: nameError });
}

const remarksValue = processRemarks(remarksRaw);
const brokenAtDate = parseDateToUTC(brokenAtRaw);
```

#### Error Handling (`src/lib/server/utils/error-handling.ts`)

**Available functions:**
- `isUniqueConstraintViolation(error)` - Detect PostgreSQL 23505 errors
- `isForeignKeyViolation(error)` - Detect PostgreSQL 23503 errors
- `handleDatabaseError(error, entityName, fieldName?)` - Centralized database error handling with proper status codes
- `logError(error, context)` - Error logging with context

**Usage example:**
```typescript
import { handleDatabaseError } from '$lib/server/utils/error-handling';

try {
	await db.insert(flasks).values(insertData);
} catch (error) {
	const { status, message } = handleDatabaseError(error, 'flask');
	return fail(status, { error: message });
}
```

#### Audit Trails (`src/lib/server/utils/audit.ts`)

**Available functions:**
- `createAuditFields(userId)` - For INSERT operations (sets createdUserId, updatedUserId, timestamps)
- `updateAuditFields(userId)` - For UPDATE operations (sets updatedUserId, timestamp)

**Usage example:**
```typescript
import { createAuditFields, updateAuditFields } from '$lib/server/utils/audit';

// For INSERT operations:
const insertData = {
	name: name.trim(),
	remarks: remarksValue,
	...createAuditFields(locals.user.id)
};

// For UPDATE operations:
await db.update(flasks).set({
	name: name.trim(),
	remarks: remarksValue,
	...updateAuditFields(locals.user.id)
}).where(eq(flasks.id, flaskId));
```

### Complete Pattern Example

**✅ CORRECT - Use utilities:**
```typescript
import { validateRequired, processRemarks, parseDateToUTC } from '$lib/server/utils/validation';
import { handleDatabaseError } from '$lib/server/utils/error-handling';
import { createAuditFields } from '$lib/server/utils/audit';

export const actions: Actions = {
	default: async ({ request, locals }) => {
		if (!locals.session || !locals.user) {
			return fail(401, { error: 'Unauthorized' });
		}

		const formData = await request.formData();
		const name = formData.get('name') as string;
		const remarksRaw = formData.get('remarks');
		const brokenAtRaw = formData.get('brokenAt');

		// Validate using utility
		const nameError = validateRequired(name, 'Flask name');
		if (nameError) {
			return fail(400, { error: nameError });
		}

		try {
			// Process inputs using utilities
			const insertData = {
				name: name.trim(),
				remarks: processRemarks(remarksRaw),
				brokenAt: parseDateToUTC(brokenAtRaw ? String(brokenAtRaw) : null),
				...createAuditFields(locals.user.id)
			};

			await db.insert(flasks).values(insertData);
		} catch (error) {
			// Handle errors using utility
			const { status, message } = handleDatabaseError(error, 'flask');
			return fail(status, { error: message });
		}

		throw redirect(303, '/?flaskSearch=' + encodeURIComponent(name.trim()));
	}
};
```

**❌ WRONG - Inline duplication:**
```typescript
// Don't do this - duplicates logic across multiple files
const remarksTrimmed = remarksRaw ? String(remarksRaw).trim() : '';
const remarksValue = remarksTrimmed || null;

if (!name || name.trim() === '') {
	return fail(400, { error: 'Name is required' });
}

const insertData = {
	name: name.trim(),
	remarks: remarksValue,
	createdUserId: locals.user.id,
	updatedUserId: locals.user.id
};

try {
	await db.insert(flasks).values(insertData);
} catch (error) {
	if ((error as any).code === '23505' || (error as any).cause?.code === '23505') {
		return fail(400, { error: 'Already exists' });
	}
	return fail(500, { error: 'Failed to save' });
}
```

### Why Use These Utilities

**Benefits:**
- ✅ **DRY Principle**: Write validation, error handling, and audit logic once
- ✅ **Consistency**: Same error messages and validation rules across the entire application
- ✅ **Maintainability**: Change validation rules in one place instead of 6+ files
- ✅ **Testability**: Utilities can be unit tested in isolation
- ✅ **Readability**: Route handlers focus on business logic, not boilerplate

**When to use:**
- ALWAYS for new route handlers
- ALWAYS when modifying existing route handlers
- ALWAYS when you see duplicated validation or error handling code

**Related files:**
- `/src/lib/server/utils/validation.ts` - Validation utilities
- `/src/lib/server/utils/error-handling.ts` - Error handling utilities
- `/src/lib/server/utils/audit.ts` - Audit trail utilities