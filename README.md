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
- A real D.E.E.D.S. account with Apple, Google, or passwordless email sign-in
- Account-owned cross-device synchronization with protected recovery history
- Independent private Google Drive app-data backup and revision recovery
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
- Optional Face ID, Touch ID, Optic ID, biometric, or device-credential lock
  in the native iOS and Android apps

## Run locally

This repository uses pnpm 11.9. Install dependencies, then run `pnpm dev`.
Open the local address shown in the terminal.

`sharp` is explicitly approved in `pnpm-workspace.yaml`, so clean installs and
deployments do not require an interactive build-script approval.

## Native iOS and Android projects

The Capacitor projects are included in `ios/` and `android/`.

The installed applications now package a fixed copy of the D.E.E.D.S. interface.
Vercel remains the production API and Supabase remains the account and data
service, but a web deployment no longer changes an already installed native
build. After changing the interface, Capacitor plugins, or native configuration:

```bash
pnpm mobile:sync
```

`mobile:sync` first makes a fresh optimized Next.js build, creates
`native-dist/`, and then copies that versioned interface into both native
projects.

For an existing test install that still loads the hosted interface, deploy this
transition once and open that installed app before replacing it. D.E.E.D.S.
stores a chunked, encrypted device snapshot of the local record and account
session. The packaged build restores that snapshot before account or cloud
bootstrap runs, preventing the storage-origin change from presenting a blank
profile.

Open the projects:

```bash
pnpm mobile:ios
pnpm mobile:android
```

The Android project targets API 36. The iOS project targets iOS 15 and uses
the bundle identifier `com.stottlyenterprises.progressnotperfection.deeds`.

## Deploy to Vercel

Import this GitHub repository in Vercel. It is a standard Next.js app. Supabase provides D.E.E.D.S. account identity and account-owned data storage. Oura, Google, Outlook, and Apple device services remain optional connections.

### D.E.E.D.S. accounts

Create a Supabase project, run `supabase/migrations/001_deeds_accounts.sql`
in its SQL editor, and add:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

The service-role key is server-only. It is used solely to archive recovery
copies after the signed-in user has been verified. It must never use a
`NEXT_PUBLIC_` prefix.

Configure the Supabase Site URL as `https://p-n-p.vercel.app` and allow
`https://p-n-p.vercel.app/` as a redirect URL. Enable Google and Apple in
Supabase Auth. Email sign-in uses a one-time code; the email template must
include `{{ .Token }}`. Full provider instructions are in
`docs/DEEDS_ACCOUNT_SETUP.md`.

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

The existing `APP_URL` is reused. D.E.E.D.S. requests Calendar, Gmail read/send, and access only to its private Google Drive application-data folder. D.E.E.D.S. cannot see or alter the user’s normal Drive files. Google Drive is retained as an independent backup, even when the user signs into D.E.E.D.S. with Apple or email.

### Microsoft Outlook

Create an app registration in the Microsoft Entra admin center. Set the supported account types to include both organizational Microsoft accounts and personal Microsoft accounts, then add this Web redirect URI:

`https://p-n-p.vercel.app/api/outlook/callback`

Create a client secret and add these Vercel environment variables:

- `OUTLOOK_CLIENT_ID`
- `OUTLOOK_CLIENT_SECRET`

The existing `APP_URL` is reused. D.E.E.D.S. requests delegated access to the connected account's basic profile, mail read/send, and calendar read scopes. Outlook is a selectable Mail and Calendar provider; Google remains the private cross-device app-data location.

## Data

The current record is cached on the device for fast and offline use. A signed-in
D.E.E.D.S. account owns the primary cross-device record. A blank device is
blocked from overwriting a populated account, and account switching quarantines
the device copy until the user chooses what to do with it. Google Drive and
JSON export remain independent backup and recovery options in Settings.
