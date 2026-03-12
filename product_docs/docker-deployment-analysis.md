# Docker Deployment Analysis

## Context

This document analyses deploying the FlaskTracker SvelteKit + PostgreSQL application as-is into a Docker container on a company server. It covers two topology options, the required code changes, process management inside the container, and maintenance considerations.

---

## Current Stack (Relevant to Docker)

| Item | Detail |
|---|---|
| Framework | SvelteKit 2.50 + Svelte 5 |
| SvelteKit adapter | `@sveltejs/adapter-auto` — **must change for Docker** |
| Database | Neon PostgreSQL (external cloud), HTTP-based client |
| DB client | `@neondatabase/serverless` |
| Auth sessions | Stored in PostgreSQL `session` table — **stateless app** |
| File uploads | None — no persistent user files |
| Background jobs | None |
| Env vars | `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL` |

---

## Deployment Topology Options

### Option A — App in Docker, Neon stays external (simplest)

```
[Company Server]
  └─ Docker container: SvelteKit Node.js app
        │
        └─ connects via HTTPS ──► Neon PostgreSQL (cloud)
```

- Minimal code changes
- Still dependent on internet connectivity to Neon
- Good transitional step if moving toward full self-hosting later

### Option B — App + PostgreSQL both in Docker (fully self-hosted)

```
[Company Server]
  └─ docker-compose
        ├─ app container: SvelteKit Node.js
        │       └─ connects via internal Docker network
        └─ db container: PostgreSQL 16
```

- Fully offline/on-premises
- Requires switching DB driver (see below)
- Recommended if data sovereignty or internet independence is a goal
- Pairs naturally with the SQLite analysis if you later want to simplify further

---

## Required Code Changes

### 1. SvelteKit Adapter (both options)

`@sveltejs/adapter-auto` detects the deployment target at build time. For a Docker/Node.js server it **must** be replaced with `@sveltejs/adapter-node`.

```bash
npm install -D @sveltejs/adapter-node
```

```js
// svelte.config.js
import adapter from '@sveltejs/adapter-node';

export default {
  kit: {
    adapter: adapter({
      out: 'build'   // output directory
    })
  }
};
```

After `npm run build`, the output in `build/` is a standard Node.js HTTP server started with `node build/index.js`.

### 2. DB Driver — Option A only (keep Neon)

No driver change needed. `@neondatabase/serverless` uses HTTPS fetch internally — it works from inside a Docker container as long as the server has outbound internet access to Neon's endpoint.

### 3. DB Driver — Option B only (self-hosted Postgres)

`@neondatabase/serverless` is Neon-specific and cannot connect to a standard PostgreSQL container. Switch to the standard driver:

```bash
npm install postgres          # 'postgres' (porsager) — recommended
npm uninstall @neondatabase/serverless
```

```typescript
// src/lib/server/db/index.ts
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from './schema';

const client = postgres(process.env.DATABASE_URL!);
export const db = drizzle(client, { schema });
```

The rest of the codebase (Drizzle queries, schema, BetterAuth adapter) stays unchanged — they all use the same `db` export.

### 4. BETTER_AUTH_URL

Must be updated to the server's actual URL:

```env
BETTER_AUTH_URL=http://192.168.1.x:3000   # or http://flasktracker.company.local
```

---

## Dockerfile

```dockerfile
# syntax=docker/dockerfile:1
FROM node:22-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# --- production image ---
FROM node:22-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

# Only copy what's needed to run
COPY --from=builder /app/build ./build
COPY --from=builder /app/package*.json ./
RUN npm ci --omit=dev

EXPOSE 3000
CMD ["node", "build/index.js"]
```

**Notes:**
- Multi-stage build keeps the final image small (no devDependencies, no source files)
- `node:22-alpine` is a minimal base (~60 MB vs ~1 GB for full Node image)
- Port 3000 is the default for `adapter-node`; configurable via `PORT` env var

---

## Docker Compose (Option B — with PostgreSQL)

```yaml
# docker-compose.yml
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgres://flasktracker:secret@db:5432/flasktracker
      BETTER_AUTH_SECRET: your-secret-here
      BETTER_AUTH_URL: http://flasktracker.company.local
    depends_on:
      db:
        condition: service_healthy
    restart: unless-stopped

  db:
    image: postgres:16-alpine
    volumes:
      - pg_data:/var/lib/postgresql/data
    environment:
      POSTGRES_DB: flasktracker
      POSTGRES_USER: flasktracker
      POSTGRES_PASSWORD: secret
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U flasktracker"]
      interval: 10s
      retries: 5
    restart: unless-stopped

volumes:
  pg_data:
```

The `pg_data` named volume persists database files across container restarts and updates.

---

## Process Management Inside the Container

### Option 1 — Plain Node.js (recommended)

```dockerfile
CMD ["node", "build/index.js"]
```

**This is the Docker-idiomatic approach.** Docker itself acts as the process supervisor:
- `restart: unless-stopped` restarts the container if it crashes
- Logs go to `docker logs` / standard stdout
- One process per container — clean, observable, simple

No PM2 or additional tooling needed. Docker + a restart policy gives you the same crash recovery.

### Option 2 — PM2 (only if you need clustering)

PM2 adds value in one scenario: **multi-core CPU utilisation**. Node.js is single-threaded; PM2 cluster mode can fork one worker per CPU core.

```dockerfile
RUN npm install -g pm2
CMD ["pm2-runtime", "build/index.js", "--instances", "max"]
```

**For this application:** Given it's an internal tool with low concurrency, plain Node.js is sufficient and simpler. PM2 adds complexity without meaningful benefit unless you measure CPU as a bottleneck.

### Recommendation

Use plain Node.js with `restart: unless-stopped`. Add PM2 only if load profiling shows a need.

---

## Sessions — Stateless App, Safe to Restart

Sessions are stored in the PostgreSQL `session` table (not in memory). This means:

- The app container can be restarted, updated, or replaced without logging users out
- Multiple app containers could run behind a load balancer without sticky sessions (if needed later)
- Zero session data is lost when redeploying

---

## Environment Variables

Store secrets outside the `docker-compose.yml` using a `.env` file (gitignored on the server):

```env
# .env  (on the server, never committed)
DATABASE_URL=postgres://flasktracker:secret@db:5432/flasktracker
BETTER_AUTH_SECRET=your-long-random-secret
BETTER_AUTH_URL=http://flasktracker.company.local
```

```yaml
# docker-compose.yml references it
services:
  app:
    env_file: .env
```

---

## Database Migrations (Option B)

When running your own PostgreSQL container, you need a strategy for applying schema changes.

**Recommended approach — init SQL script:**

Drizzle can generate SQL migration files:
```bash
npm run db:generate   # generates SQL in drizzle/ folder
```

Apply them against the running container:
```bash
docker exec -i flasktracker-db-1 psql -U flasktracker flasktracker < drizzle/0001_migration.sql
```

Or run `drizzle-kit migrate` from your dev machine pointing at the server's DB via a tunnelled connection.

> Note: `CLAUDE.md` says do not run `npm run db:push`. With a self-hosted Postgres you have full control, but the same caution applies — prefer explicit migration files over push.

---

## Backup Strategy

### Option A (Neon stays external)
Neon handles backups. No action needed on the Docker host.

### Option B (self-hosted Postgres)
The database lives in the `pg_data` Docker volume. Automate backups with `pg_dump`:

```bash
# cron on the host server — daily backup at 02:00
0 2 * * * docker exec flasktracker-db-1 pg_dump -U flasktracker flasktracker \
  | gzip > /backups/flasktracker-$(date +\%Y\%m\%d).sql.gz
```

Keep a retention policy (e.g., last 30 days). Store backups on a separate disk or network share.

---

## Reverse Proxy (Recommended)

Do not expose the Node.js app directly on port 80/443. Put **nginx** or **Caddy** in front:

- Handles HTTPS/TLS termination
- Serves static assets more efficiently
- Adds request buffering and timeouts
- Allows running multiple apps on the same server

Example with Caddy (simplest TLS, auto-renews certificates):

```
# Caddyfile
flasktracker.company.local {
  reverse_proxy app:3000
}
```

Or with nginx on the Docker host (outside containers) pointing to `localhost:3000`.

---

## Maintenance Summary

| Task | How |
|---|---|
| Deploy new version | `docker compose pull && docker compose up -d --build` |
| View logs | `docker logs flasktracker-app-1 -f` |
| Restart app | `docker compose restart app` |
| Apply DB migration | `docker exec` + psql or drizzle-kit migrate |
| Backup DB (Option B) | `pg_dump` via cron on host |
| Update Postgres | Change image tag in compose, `docker compose up -d` |
| Rotate secrets | Update `.env`, `docker compose up -d` |
| Monitor | `docker stats` for resource usage |

---

## Summary & Recommendation

| Aspect | Verdict |
|---|---|
| **Feasibility** | Straightforward — SvelteKit is well-suited to Docker |
| **Adapter change** | Required — swap `adapter-auto` → `adapter-node` |
| **DB driver change** | Only needed for Option B (self-hosted Postgres) |
| **Process manager** | Plain Node.js + Docker restart policy is sufficient |
| **Sessions** | Already DB-backed — safe to restart/redeploy freely |
| **File volumes** | Not needed — no user file uploads |
| **Secrets** | Use `.env` file on server, referenced by compose |
| **Reverse proxy** | Recommended — nginx or Caddy in front of port 3000 |

**For a company network deployment, Option B (app + Postgres in docker-compose) is the cleanest self-contained solution.** It removes the Neon cloud dependency, keeps all data on-premises, and is straightforward to maintain with standard Docker tooling.

The only meaningful code change is the SvelteKit adapter swap and the DB driver swap (3–5 lines of code). Everything else — schema, queries, auth, utilities — remains untouched.
