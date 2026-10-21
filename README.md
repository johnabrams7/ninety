# Ninety

Percentage-adherence habit tracker. Aim for 90%, not perfect.

## Setup
1. Create a free project at supabase.com.
2. In the dashboard: SQL Editor -> New query -> paste `supabase/schema.sql` -> Run.
3. Authentication -> Providers -> Email is on by default. For quick local testing you can turn off "Confirm email".
4. Project Settings -> API: copy the Project URL and the anon public key into `.env.local` (see `.env.example`).
5. `npm install`, then `npm run dev`.

`npm test` runs the engine and data-mapping tests (no Supabase needed).

## Layout
- `src/engine/` pure adherence logic, no UI or database
- `src/data/` Supabase client, queries, and row-to-engine mapping
- `src/auth/` email/password sign in and session hook
- `supabase/schema.sql` tables plus row-level security (each user sees only their own rows)
- `prototype/ninety.html` the standalone visual prototype
