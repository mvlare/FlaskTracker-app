# CLAUDE

## Docs
- `product_docs/architecture.md` — tech stack & architecture
- `product_docs/authentication.md` — auth implementation

## Database
**DO NOT run `npm run db:push`.** Schema changes are applied directly to Neon PostgreSQL.

## Auth & Passwords
**CRITICAL:** Use `hashPassword` from `better-auth/crypto` only. Never use bcrypt, argon2, or any external lib — they produce incompatible hashes.
- User creation: `auth.api.signUpEmail()` (hashes internally)
- Password reset/admin: `import { hashPassword } from "better-auth/crypto"`
- Key files: `src/lib/server/auth.ts` · `src/routes/admin/users/+server.ts` · `src/routes/admin/users/[id]/+server.ts`

## Dates

**Display:** Always `formatDateDisplay(date)` from `$lib/utils/dates.ts` → `DD-MM-YYYY` with hyphens.
Never use `toLocaleDateString()`, slashes, or manual formatting.

**Inputs:** Always use `FloatingLabelDatePicker` for editable date fields (not `<input type="date">`).
It displays dd-mm-yyyy to the user and submits yyyy-mm-dd to the server (`parseDateToUTC()` compatible).
For readonly date display use `formatDateDisplay()` directly.
- Component: `$lib/components/form/FloatingLabelDatePicker.svelte`
- Props: `id`, `name`, `label`, `bind:value` (yyyy-mm-dd string), `required`, `disabled`, `placeholder`

## Server-Side Utilities
Always use shared utilities. Never inline validation, error handling, or audit logic.

**`$lib/server/utils/validation.ts`**
`validateRequired` · `processRemarks` · `parseDateToUTC` · `validateDateNotFuture` · `validateDateNotPast` · `validatePassword` · `validateEmail`

**`$lib/server/utils/error-handling.ts`**
`handleDatabaseError(error, entityName)` · `isUniqueConstraintViolation` · `isForeignKeyViolation` · `logError`

**`$lib/server/utils/audit.ts`**
`createAuditFields(userId)` — INSERT · `updateAuditFields(userId)` — UPDATE

## Business Rules Template
When generating business rules for a screen, read the route files fresh each time. Structure:
- **Purpose** — what the screen does and who uses it
- **Access** — authenticated / admin-only / etc.
- **Data Displayed** — source table/query, filters, ordering
- **Actions & Rules** — per action: what it does, validations, constraints, side effects
- **Error Conditions** — messages and what triggers each
