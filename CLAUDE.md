# CLAUDE

## Documentation Structure

**Key reference docs:**
- `product_docs\architecture.md` - Tech stack and architectural decisions
- `product_docs\authentication.md` - Detailed auth implementation reference
- `product_docs\*.md` - Feature specifications (numbered 0100+)
- `product_docs\research\` - Option evaluations and explorations
- `product_docs\archive\` - Completed implementation plans
- `product_docs\refactorings\` - Major refactoring artifacts (testing checklists, notes)

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

**ALWAYS use DD-MM-YYYY format with HYPHENS for date display (Netherlands locale):**

This application is used in the Netherlands, so all dates must be displayed in the DD-MM-YYYY format with hyphens.

```typescript
import { formatDateDisplay } from '$lib/utils/dates';

// Display dates:
const displayDate = formatDateDisplay(date); // Returns DD-MM-YYYY (with hyphens)
```

**Critical Rules:**
- ✅ **ALWAYS** use the `formatDateDisplay()` utility function from `/src/lib/utils/dates.ts` for all date display
- ✅ **ALWAYS** use hyphens: `DD-MM-YYYY` (e.g., "16-02-2026")
- ❌ **NEVER** use slashes: `DD/MM/YYYY` or `MM/DD/YYYY`
- ❌ **NEVER** use browser methods like `toLocaleDateString()`, `toLocaleString()`, or `toDateString()`
- ❌ **NEVER** format dates manually or with other libraries
- The format is DD-MM-YYYY (day-month-year), NOT MM-DD-YYYY or YYYY-MM-DD
- This applies to ALL dates shown in the UI: flask dates, low pressure events, created/updated dates, user created dates, etc.
- When working with HTML date inputs (type="date"), remember they use YYYY-MM-DD internally but should display as DD-MM-YYYY to users

**Why this matters:**
- Consistency across the entire application - all dates look the same
- Netherlands locale expects day-month-year order
- Hyphens are more readable and consistent than slashes
- Browser methods use locale settings which vary by user and aren't reliable

**Related files:**
- `/src/lib/utils/dates.ts` - Date formatting utilities

### Date Input Components

**ALWAYS use FloatingLabelDatePicker for editable date inputs:**

For date input fields where users need to select or enter dates, use the `FloatingLabelDatePicker` component instead of native HTML date inputs (`<input type="date">`).

```typescript
import FloatingLabelDatePicker from '$lib/components/form/FloatingLabelDatePicker.svelte';

<FloatingLabelDatePicker
	id="brokenAt"
	name="brokenAt"
	label="Broken Date"
	bind:value={brokenAt}
	disabled={isSubmitting}
	placeholder="dd-mm-yyyy"
/>
```

**Why use FloatingLabelDatePicker:**
- ✅ Displays dates in **dd-mm-yyyy format** with hyphens (consistent with Netherlands locale)
- ✅ Submits dates in **yyyy-mm-dd format** to server (HTML standard, compatible with `parseDateToUTC()`)
- ✅ Maintains floating label pattern for visual consistency
- ✅ Provides better UX than native browser date inputs (no browser-controlled format hints)
- ✅ Uses a calendar popup for easy date selection
- ✅ Includes "Today" and "Clear" buttons for convenience

**Component props:**
- `id`, `name`, `label` - Standard form field properties
- `value` - Bindable string in yyyy-mm-dd format for form submission
- `required`, `disabled`, `placeholder` - Optional form controls

**Date flow:**
```
User sees:        dd-mm-yyyy (Netherlands locale with hyphens)
Component state:  CalendarDate (@internationalized/date)
Form submission:  yyyy-mm-dd (HTML standard)
Server receives:  yyyy-mm-dd (parseDateToUTC handles this)
Database stores:  timestamptz UTC
```

**When NOT to use FloatingLabelDatePicker:**
- For readonly date displays - use `formatDateDisplay()` directly instead
- For text inputs - use `FloatingLabelInput` instead

**Related files:**
- `/src/lib/components/form/FloatingLabelDatePicker.svelte` - Date picker component
- `/src/lib/components/form/FloatingLabelInput.svelte` - Text input component (for comparison)
- `/src/lib/utils/dates.ts` - Date conversion utilities used by the component

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

## Business Rules Documentation

When asked to generate business rules for a screen, always use the structure below. Read the relevant route files and components fresh each time to ensure accuracy.

### [Screen Name]

**Purpose**
One or two sentences describing what this screen is for and who uses it.

**Access**
Which users can reach this screen (authenticated, admin-only, etc.).

**Data Displayed**
List of data shown on screen, where it comes from (table/query), and any filtering or ordering applied.

**Actions & Rules**
For each action (button, form submit, etc.):
- What it does
- Validations applied (required fields, format, range)
- Business constraints (max limits, duplicate checks, state requirements)
- Side effects (records created/updated/deleted, redirects)

**Error Conditions**
List of error messages the user can see and what triggers each one.