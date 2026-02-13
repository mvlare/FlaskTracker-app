# Manual Testing Checklist - Business Logic Refactoring

This checklist verifies that all refactored route handlers work correctly after the utility extraction refactoring.

## Setup
1. Start the development server: `npm run dev`
2. Open browser to `http://localhost:5173`
3. Sign in as admin user

---

## ✅ Flask Creation (`/flasks/new`)

**File:** `src/routes/flasks/new/+page.server.ts`

### Test Cases

- [ ] **Valid flask creation**
  - Navigate to `/flasks/new`
  - Enter flask name: "Test Flask 001"
  - Enter remarks: "Test remarks"
  - Select broken date: today's date
  - Click "Create Flask"
  - **Expected:** Redirects to home page with flask in search results
  - **Verify:** Flask appears in database with correct audit trail (createdUserId, updatedUserId set)

- [ ] **Empty flask name**
  - Navigate to `/flasks/new`
  - Leave name field empty
  - Click "Create Flask"
  - **Expected:** Error message "Flask name is required"

- [ ] **Duplicate flask name**
  - Navigate to `/flasks/new`
  - Enter existing flask name (e.g., "Test Flask 001")
  - Click "Create Flask"
  - **Expected:** Error message "A flask with this name already exists"

- [ ] **Empty remarks converts to null**
  - Navigate to `/flasks/new`
  - Enter flask name: "Test Flask 002"
  - Leave remarks empty (or only whitespace)
  - Click "Create Flask"
  - **Expected:** Flask created with remarks = null in database

- [ ] **Date parsing to UTC**
  - Navigate to `/flasks/new`
  - Enter flask name: "Test Flask 003"
  - Select broken date: "2024-01-15"
  - Click "Create Flask"
  - **Expected:** Flask created with brokenAt = "2024-01-15T00:00:00.000Z" (UTC midnight)

---

## ✅ Flask Update (`/flasks/[id]/edit`)

**File:** `src/routes/flasks/[id]/edit/+page.server.ts`

### Test Cases

- [ ] **Valid flask update**
  - Navigate to `/flasks/[id]/edit` for existing flask
  - Change flask name to "Test Flask 001 Updated"
  - Change remarks to "Updated remarks"
  - Click "Save Changes"
  - **Expected:** Redirects to home page with updated flask
  - **Verify:** updatedUserId and updatedAt are set correctly

- [ ] **Empty flask name on update**
  - Navigate to `/flasks/[id]/edit`
  - Clear the name field
  - Click "Save Changes"
  - **Expected:** Error message "Flask name is required"

- [ ] **Duplicate flask name on update**
  - Navigate to `/flasks/[id]/edit`
  - Change name to existing flask name
  - Click "Save Changes"
  - **Expected:** Error message "A flask with this name already exists"

---

## ✅ Low Pressure Events (`/flasks/[id]/edit`)

**File:** `src/routes/flasks/[id]/edit/+page.server.ts`

### Test Cases

- [ ] **Add valid low pressure event**
  - Navigate to `/flasks/[id]/edit`
  - Enter low pressure date: today's date
  - Click "Add Low Pressure Event"
  - **Expected:** Event appears in list below
  - **Verify:** Date is stored as UTC midnight

- [ ] **Empty date**
  - Navigate to `/flasks/[id]/edit`
  - Leave low pressure date empty
  - Click "Add Low Pressure Event"
  - **Expected:** Error message "Low pressure date is required"

- [ ] **Future date rejected**
  - Navigate to `/flasks/[id]/edit`
  - Enter future date (tomorrow or later)
  - Click "Add Low Pressure Event"
  - **Expected:** Error message "Date cannot be in the future"

- [ ] **Today's date accepted**
  - Navigate to `/flasks/[id]/edit`
  - Enter today's date
  - Click "Add Low Pressure Event"
  - **Expected:** Event created successfully

- [ ] **Duplicate date**
  - Navigate to `/flasks/[id]/edit`
  - Enter a date that already exists for this flask
  - Click "Add Low Pressure Event"
  - **Expected:** Error message "This date already exists"

- [ ] **Delete low pressure event**
  - Navigate to `/flasks/[id]/edit`
  - Click "Delete" on an existing event
  - **Expected:** Event is removed from list

---

## ✅ Box Creation (`/boxes/new`)

**File:** `src/routes/boxes/new/+page.server.ts`

### Test Cases

- [ ] **Valid box creation**
  - Navigate to `/boxes/new`
  - Enter box name: "Test Box 001"
  - Enter remarks: "Test box remarks"
  - Click "Create Box"
  - **Expected:** Redirects to home page
  - **Verify:** Box appears in database with correct audit trail

- [ ] **Empty box name**
  - Navigate to `/boxes/new`
  - Leave name field empty
  - Click "Create Box"
  - **Expected:** Error message "Box name is required"

- [ ] **Duplicate box name**
  - Navigate to `/boxes/new`
  - Enter existing box name
  - Click "Create Box"
  - **Expected:** Error message "A box with this name already exists"

- [ ] **Empty remarks converts to null**
  - Navigate to `/boxes/new`
  - Enter box name: "Test Box 002"
  - Leave remarks empty
  - Click "Create Box"
  - **Expected:** Box created with remarks = null

---

## ✅ Remarks Update (Home Page)

**File:** `src/routes/+page.server.ts`

### Test Cases

- [ ] **Update remarks inline**
  - Navigate to home page `/`
  - Click on remarks field for a flask
  - Enter new remarks: "Updated inline remarks"
  - Press Enter or click outside field
  - **Expected:** Remarks saved successfully
  - **Verify:** updatedUserId and updatedAt are set

- [ ] **Clear remarks (convert to null)**
  - Navigate to home page `/`
  - Click on remarks field with existing remarks
  - Clear all text
  - Press Enter
  - **Expected:** Remarks saved as null in database

---

## ✅ User Creation (Admin)

**File:** `src/routes/admin/users/+server.ts`

### Test Cases

- [ ] **Valid user creation**
  - Navigate to `/admin/users`
  - Click "Create New User"
  - Enter name: "Test User"
  - Enter email: "testuser@example.com"
  - Enter password: "TestPassword123"
  - Check/uncheck "Is Admin"
  - Click "Create User"
  - **Expected:** User created successfully

- [ ] **Empty name**
  - Try creating user without name
  - **Expected:** Error message "Name is required"

- [ ] **Empty email**
  - Try creating user without email
  - **Expected:** Error message "Email is required"

- [ ] **Invalid email format**
  - Enter email: "notanemail"
  - **Expected:** Error message "Invalid email format"

- [ ] **Empty password**
  - Try creating user without password
  - **Expected:** Error message "Password is required"

- [ ] **Short password**
  - Enter password: "short"
  - **Expected:** Error message "Password must be at least 8 characters long"

- [ ] **Duplicate email**
  - Enter existing user's email
  - **Expected:** Error message "User with this email already exists"

---

## ✅ Password Reset (Admin)

**File:** `src/routes/admin/users/[id]/+server.ts`

### Test Cases

- [ ] **Valid password reset**
  - Navigate to `/admin/users`
  - Click "Reset Password" for a user
  - Enter new password: "NewPassword123"
  - Click "Reset"
  - **Expected:** Password reset successfully
  - **Verify:** User can sign in with new password

- [ ] **Empty password**
  - Try resetting password with empty field
  - **Expected:** Error message "Password is required"

- [ ] **Short password**
  - Enter password: "short"
  - **Expected:** Error message "Password must be at least 8 characters long"

---

## Database Verification

After testing, verify in database (pgAdmin or Neon dashboard):

- [ ] **Audit trails**
  - Check flasks table: createdUserId, updatedUserId, createdAt, updatedAt populated
  - Check boxes table: same audit fields populated
  - Verify updatedAt changes on updates

- [ ] **Null handling**
  - Empty remarks are stored as NULL (not empty string)

- [ ] **Date storage**
  - Dates are stored as UTC midnight (e.g., "2024-01-15T00:00:00.000Z")

---

## Error Consistency Check

Verify that error messages are consistent across the application:

- [ ] Unique constraint violations: "A {entity} with this {field} already exists"
- [ ] Required field validation: "{Field name} is required"
- [ ] Password validation: "Password must be at least 8 characters long"
- [ ] Date validation: "Date cannot be in the future"
- [ ] Generic database errors: "Failed to save {entity}"

---

## Notes

**If any test fails:**
1. Check browser console for errors
2. Check terminal/server logs for backend errors
3. Verify utility functions are imported correctly
4. Check that the refactored code matches the patterns in CLAUDE.md

**Common issues:**
- TypeScript errors: May need to restart TS server or rebuild
- Import paths: Verify `$lib/server/utils/` paths are correct
- Null handling: Empty strings should become null, not stay as ""
