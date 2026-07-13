# Habits & Care

A habit tracker + journaling web app with a care pet that grows as you check off habits.

## Run locally

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`). On iPad Safari, Add to Home Screen for a fuller-screen experience with Apple Pencil.

## Sign in (cross-device sync)

The app works offline with `localStorage`. To sync across devices, use free [Supabase](https://supabase.com) auth:

1. Create a Supabase project.
2. In **SQL Editor**, run [`supabase/schema.sql`](supabase/schema.sql).
3. Copy **Project URL** and **anon public** key from **Project Settings → API**.
4. Create `.env.local` from [`.env.example`](.env.example) and paste those values.
5. Restart `npm run dev`.
6. On the home screen, tap **Sign in** → create an account (email + password).

When signed in, habit checks, journal, colors, and pet progress sync to your account. Local data still saves as a backup.

Optional: under **Authentication → Providers**, you can disable email confirmation for faster local testing.

## Features

- **Home** — My Care Pet, Habit Tracker, Journal + sign in
- **Habit Tracker** — monthly checkbox grid, Gratitude, Daily Planner templates
- **Care Pet** — 75 lavender evolutions (every 10 habit checks)
- **Journal** — Type or Write (Pencil-friendly ink), multi-page
- **Colors** — rainbow wheel swatches for templates and ink
