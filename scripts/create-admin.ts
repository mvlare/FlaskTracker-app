/**
 * Script to create the first admin user using Better Auth API
 *
 * Usage:
 *   npm run create-admin
 *
 * This will create an admin user with:
 *   Email: admin@flasktracker.local
 *   Password: ChangeThisPassword123!
 *   isAdmin: true
 *
 * IMPORTANT: Change the password after first login!
 */

import { config } from 'dotenv';
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { pgTable, text, boolean, timestamp } from 'drizzle-orm/pg-core';
import { eq } from 'drizzle-orm';

// Load environment variables
config();

if (!process.env.DATABASE_URL) {
	console.error('❌ DATABASE_URL is not set in .env file');
	process.exit(1);
}

// Define minimal schema
const user = pgTable('user', {
	id: text('id').primaryKey(),
	name: text('name').notNull(),
	email: text('email').notNull().unique(),
	emailVerified: boolean('email_verified').default(false).notNull(),
	image: text('image'),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull(),
	isAdmin: boolean('is_admin').notNull().default(false),
});

// Create database connection
const client = neon(process.env.DATABASE_URL);
const db = drizzle(client);

async function createAdminUser() {
	try {
		const adminEmail = 'admin@flasktracker.local';
		const adminPassword = 'ChangeThisPassword123!';
		const adminName = 'Admin User';

		// Check if admin already exists
		const existing = await db
			.select()
			.from(user)
			.where(eq(user.email, adminEmail))
			.limit(1);

		if (existing.length > 0) {
			console.log('❌ Admin user already exists with email:', adminEmail);
			console.log('Run "npx tsx scripts/delete-admin.ts" to delete it first.');
			process.exit(1);
		}

		// Use Better Auth API to create the user
		// This ensures the password is hashed correctly
		const response = await fetch('http://localhost:5173/api/auth/sign-up/email', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Origin': 'http://localhost:5173',
			},
			body: JSON.stringify({
				email: adminEmail,
				password: adminPassword,
				name: adminName,
			}),
		});

		if (!response.ok) {
			const error = await response.text();
			console.error('❌ Failed to create user via Better Auth API:', error);
			console.log('');
			console.log('Make sure the dev server is running: npm run dev');
			process.exit(1);
		}

		const result = await response.json();
		const userId = result.user?.id;

		if (!userId) {
			console.error('❌ User created but no ID returned');
			process.exit(1);
		}

		// Update user to be admin
		await db
			.update(user)
			.set({
				isAdmin: true,
				emailVerified: true
			})
			.where(eq(user.id, userId));

		console.log('✅ Admin user created successfully!');
		console.log('');
		console.log('Login credentials:');
		console.log('  Email:', adminEmail);
		console.log('  Password:', adminPassword);
		console.log('');
		console.log('⚠️  IMPORTANT: Change the password after first login!');
		console.log('');
		console.log('You can now sign in at: http://localhost:5173/auth/signin');

		process.exit(0);
	} catch (error) {
		console.error('❌ Error creating admin user:', error);
		console.log('');
		console.log('Make sure the dev server is running: npm run dev');
		process.exit(1);
	}
}

createAdminUser();
