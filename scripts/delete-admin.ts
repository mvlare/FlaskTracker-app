import { config } from 'dotenv';
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { pgTable, text, timestamp, boolean } from 'drizzle-orm/pg-core';
import { eq } from 'drizzle-orm';

// Load environment variables
config();

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

const account = pgTable('account', {
	id: text('id').primaryKey(),
	userId: text('user_id').notNull(),
});

const session = pgTable('session', {
	id: text('id').primaryKey(),
	userId: text('user_id').notNull(),
});

// Create database connection
const client = neon(process.env.DATABASE_URL!);
const db = drizzle(client);

async function deleteAdmin() {
	try {
		const adminEmail = 'admin@flasktracker.local';

		// Find the user
		const users = await db.select().from(user).where(eq(user.email, adminEmail)).limit(1);

		if (users.length === 0) {
			console.log('ℹ️  No admin user found with email:', adminEmail);
			process.exit(0);
		}

		const userId = users[0].id;

		// Delete related records
		await db.delete(session).where(eq(session.userId, userId));
		await db.delete(account).where(eq(account.userId, userId));
		await db.delete(user).where(eq(user.id, userId));

		console.log('✅ Admin user deleted successfully!');
		console.log('Run "npm run create-admin" to create a new one.');
		process.exit(0);
	} catch (error) {
		console.error('❌ Error deleting admin user:', error);
		process.exit(1);
	}
}

deleteAdmin();
