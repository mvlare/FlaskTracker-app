# FlaskTracker Architecture

## Authentication System

### Overview
FlaskTracker uses **better-auth** for authentication, a modern authentication library for SvelteKit applications.

### Technology Stack
- **Auth Library:** better-auth v1.4.18
- **Database:** PostgreSQL (via Neon)
- **ORM:** Drizzle
- **Framework:** SvelteKit

### Authentication Schema

#### Tables
1. **user** - User accounts
   - `id` (text, primary key)
   - `name` (text)
   - `email` (text, unique)
   - `emailVerified` (boolean)
   - `isAdmin` (boolean) - Role-based access control
   - Timestamps: `createdAt`, `updatedAt`

2. **account** - Authentication credentials
   - `id` (text, primary key)
   - `userId` (foreign key to user)
   - `providerId` (text) - "credential" for email/password
   - `password` (text) - **Hashed password**
   - OAuth fields (not used in closed system)
   - Timestamps: `createdAt`, `updatedAt`

3. **session** - Active user sessions
   - `id` (text, primary key)
   - `userId` (foreign key to user)
   - `token` (text, unique)
   - `expiresAt` (timestamp)
   - Session metadata: `ipAddress`, `userAgent`

4. **verification** - Email verification tokens (not currently used)

### Password Security

#### Hashing Algorithm
Better-auth uses its own password hashing implementation via `better-auth/crypto`.

**CRITICAL:** Always use better-auth's `hashPassword()` function:

```typescript
import { hashPassword } from "better-auth/crypto";
const hashedPassword = await hashPassword(plainPassword);
```

#### Password Operations

1. **User Creation (Admin):**
   ```typescript
   // /admin/users/+server.ts
   const result = await auth.api.signUpEmail({
     body: { email, password, name }
   });
   // Password is automatically hashed by better-auth
   ```

2. **Password Reset (Admin):**
   ```typescript
   // /admin/users/[id]/+server.ts
   import { hashPassword } from "better-auth/crypto";
   const hashedPassword = await hashPassword(newPassword);
   await db.update(account).set({ password: hashedPassword });
   ```

3. **Password Change (User):**
   ```typescript
   // Client-side via authClient
   await authClient.changePassword({
     currentPassword: oldPassword,
     newPassword: newPassword
   });
   // Better-auth handles hashing internally
   ```

4. **Login:**
   ```typescript
   // Client-side
   await authClient.signIn.email({ email, password });
   // Better-auth verifies the hash internally
   ```

#### Security Features
- ✅ One-way password hashing (cannot be decrypted)
- ✅ Automatic salt generation
- ✅ Consistent hashing across all operations
- ✅ Session-based authentication
- ✅ Role-based access control (admin/user)

### Authorization

#### Admin Access
- Admins can manage users (create, delete, reset passwords)
- Admin status stored in `user.isAdmin` field
- Server-side checks: `locals.isAdmin` in protected routes
- Protected routes: `/admin/*`

#### User Access
- All authenticated users can:
  - View and manage flasks
  - Change their own password
  - Access the main application

### Routes

#### Authentication Routes
- `/auth/signin` - Login page
- `/auth/change-password` - Change own password (authenticated users)

#### Admin Routes (Admin Only)
- `/admin/users` - User management dashboard
- `/admin/users/[id]` - User operations (DELETE, PATCH)

#### Protected Routes
- `/` - Main flask tracking (requires authentication)
- All other application routes require authentication

### Session Management
- Sessions stored in database
- Automatic session refresh
- Session invalidation on logout
- `invalidateAll()` called after login to refresh page data

### Configuration
```typescript
// /src/lib/server/auth.ts
export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg" }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // Closed system
  },
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
});
```

### Important Notes
1. **Never use external password hashing libraries** - Always use better-auth's functions
2. **Admin-created users** are auto-verified (`emailVerified: true`)
3. **Closed system** - No social auth, no public registration
4. **Data invalidation** - Call `invalidateAll()` after auth state changes to refresh UI
