# Habits & Care

A habit tracker + journaling web app with a care pet that grows as you check off habits.

## Run locally

1. Install [MongoDB](https://www.mongodb.com/docs/manual/installation/) locally, or use a free [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) cluster.
2. Copy `.env.example` to `.env.local` and set `MONGODB_URI` + `JWT_SECRET`.
3. Install and start both the API and Vite app:

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`). On iPad Safari, Add to Home Screen for a fuller-screen experience with Apple Pencil.

## Sign in (cross-device sync)

The app works offline with `localStorage`. To sync across devices, sign in with email + password. Accounts and app data are stored in MongoDB via the local API (`server/`).

1. Ensure MongoDB is reachable at `MONGODB_URI`.
2. Start with `npm run dev` (runs API on port 3001 and Vite with an `/api` proxy).
3. On the home screen, tap **Sign in** → create an account.

When signed in, habit checks, journal, colors, and pet progress sync to your account. Local data still saves as a backup.

### Production / Cloudflare Pages

Static hosting only serves the Vite build. You also need to host the Express API somewhere that can reach MongoDB, then:

1. Set `VITE_API_URL` to that API origin (for example `https://api.example.com`) at **build** time.
2. Keep `MONGODB_URI` and `JWT_SECRET` as **server-only** secrets on the API host (never prefix them with `VITE_`).

## Features

- **Home** — My Care Pet, Habit Tracker, Journal + sign in
- **Habit Tracker** — monthly checkbox grid, Gratitude, Daily Planner templates
- **Care Pet** — 75 lavender evolutions (every 10 habit checks) + Sky Hop mini-game
- **Journal** — Type or Write (Pencil-friendly ink), multi-page, optional 4-digit lock code
- **Colors** — rainbow wheel swatches for templates and ink
