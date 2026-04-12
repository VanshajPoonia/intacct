# intacct

This is a [Next.js](https://nextjs.org) project bootstrapped with [v0](https://v0.app).

## Built with v0

This repository is linked to a [v0](https://v0.app) project. You can continue developing by visiting the link below -- start new chats to make changes, and v0 will push commits directly to this repo. Every merge to `main` will automatically deploy.

[Continue working on v0 →](https://v0.app/chat/projects/prj_XViHWiHbC9HVOxdKimVLynGLdH5p)

## Getting Started

Copy the tracked template to your ignored local env file and fill in real Supabase values:

```bash
cp .env.example .env.local
```

Use these values in `.env.local` for local development:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SECRET_KEY`
- `NEXT_PUBLIC_APP_URL=http://127.0.0.1:3000`
- `NEXT_PUBLIC_DATA_SOURCE=supabase`
- `NEXT_PUBLIC_AUTH_SOURCE=mock`

If you want the setup script to link Supabase CLI commands to a hosted project, also uncomment:

- `SUPABASE_ACCESS_TOKEN`
- `SUPABASE_PROJECT_REF`
- `SUPABASE_DB_PASSWORD`

Then run the Supabase setup script and start the app:

```bash
npm run supabase:setup
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Production Env

For Vercel production, set the same core variables in the project environment:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SECRET_KEY`
- `NEXT_PUBLIC_APP_URL=https://accura.kreativvantage.com`
- `NEXT_PUBLIC_DATA_SOURCE=supabase`
- `NEXT_PUBLIC_AUTH_SOURCE=mock`

Keep `.env.example` as placeholders only. Do not store production secrets in tracked files.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## Learn More

To learn more, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.
- [v0 Documentation](https://v0.app/docs) - learn about v0 and how to use it.

<a href="https://v0.app/chat/api/kiro/clone/VanshajPoonia/intacct" alt="Open in Kiro"><img src="https://pdgvvgmkdvyeydso.public.blob.vercel-storage.com/open%20in%20kiro.svg?sanitize=true" /></a>
