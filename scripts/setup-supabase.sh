#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$REPO_ROOT"

if [ -f ".env.local" ]; then
  echo "Loading environment from .env.local"
  set -a
  # shellcheck disable=SC1091
  source ".env.local"
  set +a
else
  echo "No .env.local found. Copy .env.example to .env.local and fill in real values for hosted Supabase access."
fi

command -v node >/dev/null 2>&1 || { echo "Node.js is required."; exit 1; }
command -v npm >/dev/null 2>&1 || { echo "npm is required."; exit 1; }
command -v docker >/dev/null 2>&1 || { echo "Docker Desktop / OrbStack is required."; exit 1; }
docker info >/dev/null 2>&1 || { echo "Start Docker Desktop / OrbStack first."; exit 1; }

npm install @supabase/supabase-js @supabase/ssr
npm install -D supabase

if [ ! -d supabase ]; then
  npx supabase init
fi

if { [ -n "${SUPABASE_PROJECT_REF:-}" ] && [ -z "${SUPABASE_DB_PASSWORD:-}" ]; } || { [ -z "${SUPABASE_PROJECT_REF:-}" ] && [ -n "${SUPABASE_DB_PASSWORD:-}" ]; }; then
  echo "Hosted Supabase linking requires both SUPABASE_PROJECT_REF and SUPABASE_DB_PASSWORD in .env.local."
  exit 1
fi

npx supabase start

if [ -n "${SUPABASE_ACCESS_TOKEN:-}" ]; then
  npx supabase login --token "$SUPABASE_ACCESS_TOKEN"
fi

if [ -n "${SUPABASE_PROJECT_REF:-}" ]; then
  if [ -n "${SUPABASE_DB_PASSWORD:-}" ]; then
    npx supabase link --project-ref "$SUPABASE_PROJECT_REF" -p "$SUPABASE_DB_PASSWORD"
  else
    npx supabase link --project-ref "$SUPABASE_PROJECT_REF"
  fi
fi

echo "Syncing runtime datasets into Supabase..."
npm run supabase:sync-data

echo "Bootstrapping Supabase auth users..."
npm run supabase:bootstrap-auth

echo ""
echo "Local Supabase Studio: http://127.0.0.1:54323"
echo "Use NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY and SUPABASE_SECRET_KEY for hosted projects."
echo "Legacy NEXT_PUBLIC_SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY are still accepted for local CLI/self-hosted compatibility."
echo "For local development, keep NEXT_PUBLIC_APP_URL=http://127.0.0.1:3000 in .env.local."
echo "For Vercel production, set NEXT_PUBLIC_APP_URL=https://accura.kreativvantage.com."
echo "Next recommended commands:"
echo "  npx supabase migration new init_ar_invoices"
echo "  npx supabase gen types typescript --linked > lib/types/supabase.ts"
echo "  npm run dev"
