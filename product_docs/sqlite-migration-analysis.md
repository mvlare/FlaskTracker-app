# SQLite Migration Analysis

## Context

This document analyses the feasibility of replacing the current Neon PostgreSQL database with SQLite, while retaining Drizzle ORM and BetterAuth. Two deployment scenarios are considered:

1. **Cloud/serverless** — current setup (Neon)
2. **Local server** — app hosted on-premises within a company network

---

## Current Stack

| Layer | Technology |
|---|---|
| Database | Neon PostgreSQL (serverless, HTTP-based) |
| ORM | Drizzle ORM (`drizzle-orm/pg-core`, dialect: `postgresql`) |
| Auth | BetterAuth with Drizzle adapter (`provider: "pg"`) |
| Connection | `@neondatabase/serverless` (Neon HTTP client) |
| Schema | `src/lib/server/db/schema.ts` — 7 app tables + 4 BetterAuth tables |

---

## Is SQLite Possible?

**Yes.** Drizzle ORM supports a SQLite dialect and BetterAuth supports a SQLite/libsql adapter. It is not a simple configuration swap, but it is feasible.

---

## Blockers & Required Changes

### Critical rewrites

| Item | Issue | Fix Required |
|---|---|---|
| **DB connection** | Uses `@neondatabase/serverless` (HTTP-only Neon client) | Replace with `better-sqlite3` or `@libsql/client` |
| **Drizzle dialect** | Schema uses `pgTable` and `drizzle-orm/pg-core` | Rewrite entire schema using `sqliteTable` / `sqlite-core` |
| **BetterAuth adapter** | Configured with `provider: "pg"` | Change to `provider: "sqlite"` |
| **`get_flask_ref_tree()` stored function** | Calls a PostgreSQL stored procedure defined externally in Neon | Reimplement in TypeScript or as a recursive CTE |
| **`NULLS FIRST / NULLS LAST`** | PostgreSQL-specific ORDER BY syntax used in main flask list | Works in SQLite ≥ 3.30.0 and modern libsql — verify version |
| **`timestamp with timezone`** | PG-specific type | Map to SQLite `text` (ISO strings) or `integer` (unix epoch) |
| **`.generatedByDefaultAsIdentity()`** | PG-specific identity columns | Replace with `.primaryKey({ autoIncrement: true })` |
| **Error codes `23505` / `23503`** | PostgreSQL-specific error codes in `error-handling.ts` | Map to SQLite error strings (different format) |
| **`doublePrecision()`** | PG-specific type for lat/lon coordinates | Maps to SQLite `real()` — straightforward |
| **`time()` type** | PG-specific time-of-day type | Store as `text` in SQLite |

### What carries over without changes

- Drizzle query builder logic (`.select()`, `.where()`, `.orderBy()`, relations)
- BetterAuth password hashes — `hashPassword` from `better-auth/crypto` produces plain strings, not DB-dependent
- Server-side utilities (`validation.ts`, `audit.ts`, `error-handling.ts`) — mostly portable (only error code mapping needed)
- No JSONB, PostgreSQL arrays, or complex aggregate functions are used

---

## Effort Breakdown

| Area | Effort |
|---|---|
| Schema rewrite (`pgTable` → `sqliteTable`, type mapping) | Moderate |
| DB connection & Drizzle config | Small |
| BetterAuth adapter swap | Small |
| `get_flask_ref_tree()` reimplementation | Unknown — depends on function complexity |
| Error handling (error code mapping) | Small |
| Query adjustments (`NULLS LAST`, ordering) | Small |

The **stored function `get_flask_ref_tree()`** is the biggest unknown. Its definition lives externally in the Neon database and is not in the codebase. It must be located and analysed before committing to a migration.

---

## Scenario 2: Local Server on Company Network

Running the app on a local server inside a company network **significantly strengthens the case for SQLite**.

### Why it works well here

- The SvelteKit app runs as a **single Node.js process** on the server
- All user requests funnel through that one process — SQLite's single-writer model is not a bottleneck
- For an internal tool with 5–50 users doing mostly reads and occasional writes, SQLite is entirely appropriate
- **WAL mode** (one pragma) dramatically improves read concurrency:
  ```typescript
  db.pragma('journal_mode = WAL');
  ```

### Comparison: Neon (cloud) vs SQLite (local server)

| Concern | Neon PostgreSQL | SQLite Local Server |
|---|---|---|
| Connection driver | Neon HTTP (proprietary, cloud-only) | `better-sqlite3` (synchronous, fast, zero config) |
| Concurrency | Managed by Neon | One Node process + WAL mode — fine for internal use |
| Backups | Managed by Neon | Copy the `.db` file. Use `VACUUM INTO` for hot backups |
| Internet dependency | **Required** | **Zero** — fully offline capable |
| Data sovereignty | Data stored in Neon cloud (US) | Data stays on-premises |
| Cost | Neon subscription | Free |
| Outage risk | Neon downtime = app downtime | No external dependency |

### Recommended driver for local server

`better-sqlite3` — synchronous API, no connection pooling needed, very fast for local disk I/O.

```typescript
// src/lib/server/db/index.ts
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';

const sqlite = new Database('data/flasktracker.db');
sqlite.pragma('journal_mode = WAL');
export const db = drizzle(sqlite, { schema });
```

### Backup strategy

```bash
# Simple file copy (stop app first, or use VACUUM INTO for hot backup)
sqlite3 data/flasktracker.db "VACUUM INTO 'backups/flasktracker-$(date +%Y%m%d).db'"
```

### Turso (libsql) — if a managed SQLite is preferred

[Turso](https://turso.tech) is a hosted, distributed SQLite-as-a-service that uses the `@libsql/client` driver. It works well with Drizzle and would replicate Neon's managed-service role while keeping SQLite semantics. Useful if the company wants managed hosting but prefers SQLite compatibility.

---

## Recommendation

For a **local, on-premises company network deployment**, SQLite is a solid and practical choice. The code changes are mechanical (schema rewrite, adapter swap) with one meaningful unknown (the stored function). The result would be a simpler, cheaper, offline-capable stack with trivial backups and no external dependencies.

The migration is not trivial but is well within reach. Resolve the `get_flask_ref_tree()` function first — everything else has a clear path.

---

## Key Files to Change (if migrating)

- `drizzle.config.ts` — dialect and credentials
- `src/lib/server/db/schema.ts` — full schema rewrite
- `src/lib/server/db/index.ts` — connection setup
- `src/lib/server/auth.ts` — BetterAuth adapter provider
- `src/lib/server/utils/error-handling.ts` — error code mapping
- `src/routes/api/flasks/[id]/tree/+server.ts` — stored function call
- `src/routes/+page.server.ts` — `NULLS LAST` ordering (verify SQLite version)
