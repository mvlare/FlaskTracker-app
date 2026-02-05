# Architecture

## Components

- Svelte and Svelte kit 5 latest
- Typescript
- Zod: the TypeScript-first schema validation library
- Drizzle ORM for svelte ( https://orm.drizzle.team/)
- Neon PostgreSQL (database is in a seperate repository)
- NeonAuth for login and authorisation.
- shadcn for Svelte: https://www.shadcn-svelte.com/
- Dates Timezone compliant. date-fn

## Deployments
- Neon PostgreSQL
- Application on Vercel:

Notes on configuration. Not to pick up by claude.
## Open Points
Try to use NeonAuth for user authentication. If it does not work out will use clerk.

- Neon with its objects is present in a separate Repo. 
  npx neonctl@latest init is not needed for connecting to DB. 

- Drizzle claude configuration notes:
The correct API is timestamp(name, { withTimezone: true }). 
A small helper (const timestamptz = ...) wraps    