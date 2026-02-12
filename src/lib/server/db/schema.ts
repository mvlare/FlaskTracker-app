import { integer, pgTable, text, timestamp, index } from 'drizzle-orm/pg-core';
import { user } from './auth-schema';

const timestamptz = (name: string) => timestamp(name, { withTimezone: true });

// 1. Lookup table — FK to user for audit
export const flaskRefType = pgTable('flask_ref_type', {
	id: integer('id').primaryKey().generatedByDefaultAsIdentity(),
	name: text('name').notNull().unique(),
	createdAt: timestamptz('created_at').defaultNow(),
	createdUserId: text('created_user_id').references(() => user.id, { onDelete: 'set null' }),
	updatedAt: timestamptz('updated_at').defaultNow(),
	updatedUserId: text('updated_user_id').references(() => user.id, { onDelete: 'set null' })
});

// 2. Flasks — FK to user for audit, index on name
export const flasks = pgTable(
	'flasks',
	{
		id: integer('id').primaryKey().generatedByDefaultAsIdentity(),
		name: text('name').notNull().unique(),
		remarks: text('remarks'),
		brokenAt: timestamptz('broken_at'),
		createdAt: timestamptz('created_at').defaultNow(),
		createdUserId: text('created_user_id').references(() => user.id, { onDelete: 'set null' }),
		updatedAt: timestamptz('updated_at').defaultNow(),
		updatedUserId: text('updated_user_id').references(() => user.id, { onDelete: 'set null' })
	},
	(table) => [index('flasks_index_0').on(table.name)]
);

// 3. Flask low pressure events — tracks multiple low pressure events per flask
export const flaskLowPressureEvents = pgTable(
	'flask_low_pressure_events',
	{
		id: integer('id').primaryKey().generatedByDefaultAsIdentity(),
		flaskId: integer('flask_id').notNull().references(() => flasks.id, {
			onDelete: 'no action',
			onUpdate: 'no action'
		}),
		lowPressureAt: timestamptz('low_pressure_at').notNull()
	},
	(table) => [
		index('flask_low_pressure_events_flask_id_idx').on(table.flaskId)
	]
);

// 4. Boxes — FK to user for audit, index on name
export const boxes = pgTable(
	'boxes',
	{
		id: integer('id').primaryKey().generatedByDefaultAsIdentity(),
		name: text('name').notNull().unique(),
		remarks: text('remarks'),
		createdAt: timestamptz('created_at').defaultNow(),
		createdUserId: text('created_user_id').references(() => user.id, { onDelete: 'set null' }),
		updatedAt: timestamptz('updated_at').defaultNow(),
		updatedUserId: text('updated_user_id').references(() => user.id, { onDelete: 'set null' })
	},
	(table) => [index('boxes_index_0').on(table.name)]
);

// 5. Flasks ref — FK → flasks (×2), FK → flask_ref_type, FK to user for audit
export const flasksRef = pgTable('flasks_ref', {
	id: integer('id').primaryKey().generatedByDefaultAsIdentity(),
	originalFlaskId: integer('original_flask_id')
		.notNull()
		.references(() => flasks.id),
	newFlaskId: integer('new_flask_id')
		.notNull()
		.references(() => flasks.id),
	flaskRefTypeId: integer('flask_ref_type_id').notNull().references(() => flaskRefType.id),
	createdAt: timestamptz('created_at').defaultNow(),
	createdUserId: text('created_user_id').references(() => user.id, { onDelete: 'set null' }),
	updatedAt: timestamptz('updated_at').defaultNow(),
	updatedUserId: text('updated_user_id').references(() => user.id, { onDelete: 'set null' })
});

// 6. Box content headers — FK → boxes, FK to user for audit
export const boxContentHeaders = pgTable('box_content_headers', {
	id: integer('id').primaryKey().generatedByDefaultAsIdentity(),
	boxId: integer('box_id')
		.notNull()
		.references(() => boxes.id),
	destinationText: text('destination_text'),
	readyAt: timestamptz('ready_at'),
	returnedAt: timestamptz('returned_at'),
	remarks: text('remarks'),
	createdAt: timestamptz('created_at').defaultNow(),
	createdUserId: text('created_user_id').references(() => user.id, { onDelete: 'set null' }),
	updatedAt: timestamptz('updated_at').defaultNow(),
	updatedUserId: text('updated_user_id').references(() => user.id, { onDelete: 'set null' })
});

// 7. Box content lines — FK → box_content_headers, FK → flasks, FK to user for audit
export const boxContentLines = pgTable('box_content_lines', {
	id: integer('id').primaryKey().generatedByDefaultAsIdentity(),
	boxContentHeaderId: integer('box_content_header_id')
		.notNull()
		.references(() => boxContentHeaders.id),
	flaskId: integer('flask_id')
		.notNull()
		.references(() => flasks.id),
	remarks: text('remarks'),
	createdAt: timestamptz('created_at').defaultNow(),
	createdUserId: text('created_user_id').references(() => user.id, { onDelete: 'set null' }),
	updatedAt: timestamptz('updated_at').defaultNow(),
	updatedUserId: text('updated_user_id').references(() => user.id, { onDelete: 'set null' })
});

// Export Better Auth tables
export * from './auth-schema';
