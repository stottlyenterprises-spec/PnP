# D.E.E.D.S.

Progress, Not Perfection

A standalone, device-local personal operating system built around a real working to-do list.

## Included

- Today, patrols, personal projects, Stottly, week, watch list, month, and long-term sections
- Dedicated Business tab for SE Housekeeping, StottifAI, Agentic Forge, CartCurios, Socials, R&D, and Stewardship
- Executive brief, Today’s Big Three, capacity signals, and focus mode
- Outcome portfolio with progress, status, next action, and energy requirements
- Revenue command center with monthly baseline and opportunity pipeline
- Decision log, universal capture, and guided weekly executive review
- Automatic plain-language progress narrative
- Internal notification center for interviews, priorities, blocked outcomes, calendar, mail, and important headlines
- Priority-only Executive page plus a separate All Tasks command view
- Clear maintenance versus one-time task behavior
- Google and Microsoft Outlook mail/calendar connections with multiple accounts
- Private Google Drive app-data synchronization across devices
- Editable, reorderable, completable tasks
- Task editor for moving work between Personal and Business groups
- Breakfast, lunch, and dinner interviews with optional browser reminders
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
- Installable iPhone Home Screen experience with notification permission support

## Run locally

Install dependencies, then run `npm run dev`. Open the local address shown in the terminal.

## Deploy to Vercel

Import this GitHub repository in Vercel. It is a standard Next.js app and requires no external database. Environment variables enable the optional Oura, Google, and Outlook connections.

### Oura connection

Create an OAuth application in the Oura developer portal with this redirect URI:

`https://p-n-p.vercel.app/api/oura/callback`

Then add these Vercel environment variables and redeploy:

- `OURA_CLIENT_ID`
- `OURA_CLIENT_SECRET`
- `APP_URL=https://p-n-p.vercel.app`

The app requests only Oura's `daily` scope and imports sleep, readiness, activity, stress/recovery, and resilience summaries.

### Google daily brief

Enable the Google Calendar API, Gmail API, and Google Drive API in a Google Cloud project. Create an OAuth client for a web application with:

`https://p-n-p.vercel.app/api/google/callback`

Add these Vercel environment variables:

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`

The existing `APP_URL` is reused. D.E.E.D.S. requests Calendar, Gmail read/send, and access only to its private Google Drive application-data folder. D.E.E.D.S. cannot see or alter the user’s normal Drive files.

### Microsoft Outlook

Create an app registration in the Microsoft Entra admin center. Set the supported account types to include both organizational Microsoft accounts and personal Microsoft accounts, then add this Web redirect URI:

`https://p-n-p.vercel.app/api/outlook/callback`

Create a client secret and add these Vercel environment variables:

- `OUTLOOK_CLIENT_ID`
- `OUTLOOK_CLIENT_SECRET`

The existing `APP_URL` is reused. D.E.E.D.S. requests delegated access to the connected account's basic profile, mail read/send, and calendar read scopes. Outlook is a selectable Mail and Calendar provider; Google remains the private cross-device app-data location.

## Data

The current record is cached in the browser for fast and offline use. When Google is connected, D.E.E.D.S. automatically saves the record to the private Google Drive application-data folder and links it across devices. JSON export and import remain available in Settings.
