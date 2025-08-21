# KidVisions — GitHub App Bundle (Next.js + PWA + API stubs)

This is your drop-in app repo. Push this to GitHub.

## What’s included
- Next.js (App Router, TS, Tailwind)
- PWA: `public/manifest.webmanifest`, `public/sw.js`, offline page, icons
- API stubs (`app/api/*`) for invites, accepting invites, observations, standards
- Supabase client helpers (`lib/*`)
- Logo placeholder at `public/kidvision-logo.png` (replace with your real PNG)

## Quick start
```bash
pnpm i          # or npm/yarn
cp .env.example .env.local  # fill Supabase env vars
pnpm dev        # http://localhost:3000
```

## Deploy
- Push to GitHub
- Connect to Vercel (or Netlify)
- Set env vars: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
