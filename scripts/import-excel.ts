/**
 * Usage:
 *   npm run import-excel -- /home/mvlare/Projects/FlaskTracker/FlaskTracker-utils/input/"ISAMO sample list flasks to fill in BOX1-BOX52.xlsx" --userId=<your-user-id>
 *
 * Iterates ALL Excel tabs whose name starts with "box" (case-insensitive). For each tab:
 *
 *   1. Box        — inserted if it doesn't exist yet (matched by tab name).
 *   2. Flasks     — column A, rows 4+, only values containing "-". Inserted if new, skipped if
 *                   already present.
 *   3. Box content header — one header per box; created if none exists for that box yet.
 *   4. Box content lines  — one line per flask linking it to the header; skipped if the
 *                           (header, flask) pair already exists.
 *   5. Duplicate check    — prints any flask linked to more than one box.
 *
 * Fully idempotent: safe to re-run against the same file without creating duplicates.
 */

import { config } from 'dotenv';
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { and, eq, sql } from 'drizzle-orm';
import ExcelJS from 'exceljs';
import * as schema from '../src/lib/server/db/schema';
import { createAuditFields } from '../src/lib/server/utils/audit';

config();

if (!process.env.DATABASE_URL) {
	console.error('DATABASE_URL is not set in .env');
	process.exit(1);
}

const filePath = process.argv[2];
const userIdArg = process.argv.find((a) => a.startsWith('--userId='))?.split('=')[1];

if (!filePath) {
	console.error('Usage: tsx scripts/import-excel.ts <file.xlsx> --userId=<id>');
	process.exit(1);
}
if (!userIdArg) {
	console.error('Missing --userId=<id>');
	process.exit(1);
}

const client = neon(process.env.DATABASE_URL);
const db = drizzle(client, { schema });

async function validateUser(userId: string) {
	const rows = await db
		.select({ id: schema.user.id })
		.from(schema.user)
		.where(eq(schema.user.id, userId))
		.limit(1);
	if (rows.length === 0) {
		console.error(`User not found: ${userId}`);
		process.exit(1);
	}
}

async function importTab(worksheet: ExcelJS.Worksheet, userId: string) {
	const tabName = worksheet.name;
	console.log(`\nProcessing tab: "${tabName}"`);

	// Read flask names from column A, rows 4+, only those containing '-'
	const flaskNames: string[] = [];
	worksheet.eachRow((row, rowNumber) => {
		if (rowNumber < 4) return;
		const cell = row.getCell(1);
		const value = cell.value?.toString().trim() ?? '';
		if (value.includes('-')) {
			flaskNames.push(value);
		}
	});

	console.log(`  Flasks found (containing '-'): ${flaskNames.length}`);

	// Upsert box — capture ID
	const existingBox = await db
		.select({ id: schema.boxes.id })
		.from(schema.boxes)
		.where(eq(schema.boxes.name, tabName))
		.limit(1);

	let boxId: number;
	if (existingBox.length === 0) {
		const inserted = await db
			.insert(schema.boxes)
			.values({ name: tabName, ...createAuditFields(userId) })
			.returning({ id: schema.boxes.id });
		boxId = inserted[0].id;
		console.log(`  Box "${tabName}": inserted (id=${boxId})`);
	} else {
		boxId = existingBox[0].id;
		console.log(`  Box "${tabName}": already exists (id=${boxId}, skipped)`);
	}

	// Upsert flasks — collect IDs
	const flaskIds: number[] = [];
	let flasksInserted = 0;
	let flasksSkipped = 0;
	for (const name of flaskNames) {
		const existing = await db
			.select({ id: schema.flasks.id })
			.from(schema.flasks)
			.where(eq(schema.flasks.name, name))
			.limit(1);
		if (existing.length === 0) {
			const inserted = await db
				.insert(schema.flasks)
				.values({ name, ...createAuditFields(userId) })
				.returning({ id: schema.flasks.id });
			flaskIds.push(inserted[0].id);
			flasksInserted++;
		} else {
			flaskIds.push(existing[0].id);
			flasksSkipped++;
		}
	}
	console.log(`  Flasks: ${flasksInserted} inserted, ${flasksSkipped} skipped`);

	// Box content header — create one if none exists for this box
	const existingHeader = await db
		.select({ id: schema.boxContentHeaders.id })
		.from(schema.boxContentHeaders)
		.where(eq(schema.boxContentHeaders.boxId, boxId))
		.limit(1);

	let headerId: number;
	if (existingHeader.length === 0) {
		const inserted = await db
			.insert(schema.boxContentHeaders)
			.values({ boxId, ...createAuditFields(userId) })
			.returning({ id: schema.boxContentHeaders.id });
		headerId = inserted[0].id;
		console.log(`  Box content header: inserted (id=${headerId})`);
	} else {
		headerId = existingHeader[0].id;
		console.log(`  Box content header: already exists (id=${headerId}, skipped)`);
	}

	// Box content lines — one per flask, skip if already present
	let linesInserted = 0;
	let linesSkipped = 0;
	for (const flaskId of flaskIds) {
		const existing = await db
			.select({ id: schema.boxContentLines.id })
			.from(schema.boxContentLines)
			.where(
				and(
					eq(schema.boxContentLines.boxContentHeaderId, headerId),
					eq(schema.boxContentLines.flaskId, flaskId)
				)
			)
			.limit(1);
		if (existing.length === 0) {
			await db
				.insert(schema.boxContentLines)
				.values({ boxContentHeaderId: headerId, flaskId, ...createAuditFields(userId) });
			linesInserted++;
		} else {
			linesSkipped++;
		}
	}
	console.log(`  Box content lines: ${linesInserted} inserted, ${linesSkipped} skipped`);
}

async function checkFlasksInMultipleBoxes() {
	const result = await db.execute(sql`
		SELECT f.name AS flask_name, b.name AS box_name
		FROM box_content_lines bcl
		JOIN box_content_headers bch ON bch.id = bcl.box_content_header_id
		JOIN boxes b ON b.id = bch.box_id
		JOIN flasks f ON f.id = bcl.flask_id
		WHERE bcl.flask_id IN (
			SELECT bcl2.flask_id
			FROM box_content_lines bcl2
			JOIN box_content_headers bch2 ON bch2.id = bcl2.box_content_header_id
			GROUP BY bcl2.flask_id
			HAVING COUNT(DISTINCT bch2.box_id) > 1
		)
		ORDER BY f.name, b.name
	`);

	console.log('\nFlasks appearing in more than one box:');
	if (result.rows.length === 0) {
		console.log('  None found.');
	} else {
		for (const row of result.rows) {
			console.log(`  ${row.flask_name}  →  ${row.box_name}`);
		}
	}
}

async function main() {
	await validateUser(userIdArg!);

	const workbook = new ExcelJS.Workbook();
	await workbook.xlsx.readFile(filePath);

	// Process all tabs whose name starts with 'box' (case-insensitive)
	const tabs = workbook.worksheets.filter((ws) => ws.name.toLowerCase().startsWith('box'));
	if (tabs.length === 0) {
		console.error('No tabs found with a name starting with "box"');
		process.exit(1);
	}

	console.log(`Found ${tabs.length} box tab(s): ${tabs.map((t) => t.name).join(', ')}`);
	for (const tab of tabs) {
		await importTab(tab, userIdArg!);
	}

	await checkFlasksInMultipleBoxes();

	console.log('\nDone.');
	process.exit(0);
}

main().catch((err) => {
	console.error('Fatal error:', err);
	process.exit(1);
});
