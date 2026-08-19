# Financial Freedom OS

React + Vite frontend. Supabase is the only backend — there is no custom API.

## 1. Install

```bash
npm install
```

## 2. Configure environment

Copy the example file and fill in your Supabase project's values:

```bash
cp .env.example .env
```

```
VITE_SUPABASE_URL=https://<your-project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-public-key>
```

Find both in the Supabase dashboard: **Project Settings → API**. The `anon` key is safe to
ship to the browser (Row Level Security is what actually protects the data) — never put the
`service_role` key, database password, or JWT secret in this file.

## 3. Set up the Supabase project (one-time, if you're new to Supabase)

### a) Run the database migration

Creates the `profiles` table with Row Level Security. In the Supabase dashboard:
**SQL Editor → New query** → paste the contents of
[`supabase/migrations/0001_create_profiles.sql`](supabase/migrations/0001_create_profiles.sql) → **Run**.

(Or via CLI: `supabase link --project-ref <your-project-ref>` then `supabase db push`.)

### b) Turn on email/password sign-in

**Authentication → Sign In / Providers → Email** → make sure the **Email** provider is
enabled. This is on by default for new projects, but check it if login/register calls fail
with a "provider not enabled" error.

### c) Decide whether email confirmation is required

Same screen, **Authentication → Sign In / Providers → Email** → **Confirm email** toggle:

- **ON** (default, recommended for real users): after registering, Supabase emails the user a
  confirmation link and does *not* log them in yet. This app already handles that — it shows
  "Check your email to confirm your account" and sends the user to `/login`.
- **OFF** (fine for local development): registering logs the user in immediately, no email
  step. Useful while you're testing without email delivery configured.

Either setting works with this app without further code changes.

### d) Set the Site URL (needed for confirmation links to work)

**Authentication → URL Configuration → Site URL**: set this to wherever the app is running
(e.g. `http://localhost:5173` for local dev, or your deployed URL). If this is wrong, the
link inside the confirmation email will redirect somewhere broken.

## 4. Run the app

```bash
npm run dev
```

## 5. Build for production

```bash
npm run build
```

## Architecture

```
Page → Functionality Hook → TanStack Query hook (hooks/api) → Supabase service (services/supabase) → Supabase JS SDK
```

Pages and components never call the Supabase SDK directly — everything goes through
`src/services/supabase/`. See `CLAUDE.md` for the full set of project rules.
