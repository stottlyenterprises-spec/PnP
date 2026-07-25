# Progress, Not Perfection

A standalone, device-local personal operating system built around a real working to-do list.

## Included

- Today, patrols, personal projects, Stottly, week, watch list, month, and long-term sections
- Editable, reorderable, completable tasks
- Daily health and emotional check-ins
- Emotional trends for anxiety, stress, regulation, triggers, responses, and what helped
- Separate physical and mental health views
- Weight, personal hygiene, yoga, meals, medication, and hydration tracking
- Oura sleep, readiness, activity, stress/recovery, and resilience KPIs
- A private daily relationship model for appreciation, support, affection, follow-through, and remembering what matters
- KPI dashboard and copyable weekly report
- Income capture
- Local browser storage
- JSON backup and restore
- Responsive phone and desktop layout

## Run locally

Install dependencies, then run `npm run dev`. Open the local address shown in the terminal.

## Deploy to Vercel

Import this GitHub repository in Vercel. It is a standard Next.js app and requires no external database. Environment variables are needed only for optional Oura syncing.

### Oura connection

Create an OAuth application in the Oura developer portal with this redirect URI:

`https://p-n-p.vercel.app/api/oura/callback`

Then add these Vercel environment variables and redeploy:

- `OURA_CLIENT_ID`
- `OURA_CLIENT_SECRET`
- `APP_URL=https://p-n-p.vercel.app`

The app requests only Oura's `daily` scope and imports sleep, readiness, activity, stress/recovery, and resilience summaries.

## Data

No account or server is used. Data stays in the current browser until exported or browser storage is cleared. Use **Data & backup → Export JSON** regularly.
