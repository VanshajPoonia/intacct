# Intacct

Intacct is a Next.js + Supabase enterprise finance platform with role-based workspaces, dense accountant-friendly UX, and a service-layer architecture that keeps UI components insulated from backend changes.

This repository is contributor-oriented first: it explains what is live now, what is still in cutover, how the Supabase bootstrap flow works, and where to extend the app safely.

## Project Overview

- Framework: Next.js App Router + TypeScript
- UI architecture: pages and components consume `lib/services/*`, not raw data sources
- Backend/data platform: Supabase for auth, relational app data, internal APIs, and runtime datasets
- Product shape: multi-role enterprise finance app with AP, AR, GL, cash, reporting, admin, and shared platform workspaces

## Current Status

### Fully live / relational Supabase-backed

- Organization + username + password login with Supabase-backed session cookies
- Users & Access admin UI at `/admin/users`
- Saved views and shell preference persistence
- Report metadata persistence for saved, pinned, favorited, and recent reports
- Notifications summary and audit log APIs
- Receivables APIs for customers, invoices, and receipts
- Core operator workspace saved views and visible-column persistence for live AP / GL list flows

### Dynamic and Supabase-backed through `runtime_datasets`

- Shell structure and several workspace configuration datasets
- Platform overview content such as approvals, AI insights, and workflow summaries
- A number of non-core planning, asset, revenue, and adjacent workspace data sources that have already been moved off direct mock imports

### Still in later cutover batches

The app is not yet fully cut over in every domain. Some service families still retain legacy-backed paths and should not be described as production-complete yet:

- `homepages`
- `admin-workspace`
- `integrations-workspace`
- `api-developer-workspace`
- `operations-workspaces`
- some cross-cutting `detail-routes` paths and legacy re-exports in `lib/services/index.ts`

Use the status above as the source of truth when deciding whether to extend an existing Supabase-backed area or finish a remaining cutover surface.

## Local Setup

1. Copy the tracked template to your ignored local env file:

```bash
cp .env.example .env.local
```

2. Fill the hosted Supabase values in `.env.local`:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SECRET_KEY`

3. If you want the setup script to link Supabase CLI commands to a hosted project, also fill:

- `SUPABASE_ACCESS_TOKEN`
- `SUPABASE_PROJECT_REF`
- `SUPABASE_DB_PASSWORD`

4. Keep local runtime values local:

- `NEXT_PUBLIC_APP_URL=http://127.0.0.1:3000`
- `NEXT_PUBLIC_DATA_SOURCE=supabase`
- leave any compatibility flags from `.env.example` in place unless you have a specific reason to change them

5. Run the bootstrap flow:

```bash
npm run supabase:setup
```

This script:

- loads `.env.local`
- verifies Node, npm, and Docker
- installs Supabase dependencies if needed
- starts the local Supabase stack
- optionally links the CLI to your hosted project
- syncs runtime datasets into Supabase
- bootstraps auth users

6. Start the app:

```bash
npm run dev
```

The setup flow expects Docker Desktop or OrbStack to be running because `scripts/setup-supabase.sh` uses `npx supabase start`.

## Supabase Bootstrap And Sync Scripts

### `npm run supabase:setup`

Runs the end-to-end local bootstrap script in [scripts/setup-supabase.sh](/Users/vanshajpoonia/Code/Intacct/scripts/setup-supabase.sh). Use this first on a fresh checkout.

### `npm run supabase:sync-data`

Runs [scripts/sync-runtime-datasets.mjs](/Users/vanshajpoonia/Code/Intacct/scripts/sync-runtime-datasets.mjs), which backfills or refreshes Supabase data used by the current app runtime:

- `runtime_datasets`
- seeded profiles and memberships
- saved views
- notifications
- preferences
- related support records used by the current dynamic surfaces

### `npm run supabase:bootstrap-auth`

Runs [scripts/bootstrap-auth-users.mjs](/Users/vanshajpoonia/Code/Intacct/scripts/bootstrap-auth-users.mjs), which creates or syncs Supabase Auth users for the bootstrap admin and seeded workspace users.

## Deployment Environment Notes

Preferred production env names:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SECRET_KEY`
- `NEXT_PUBLIC_APP_URL`

The current production app URL is configured as:

- `https://accura.kreativvantage.com`

Treat that as deployment configuration only, not as proof that every product area is already fully cut over to the final production architecture.
