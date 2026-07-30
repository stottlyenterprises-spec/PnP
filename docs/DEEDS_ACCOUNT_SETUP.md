# D.E.E.D.S. Account Setup

This layer creates one D.E.E.D.S. identity that can be accessed with Apple,
Google, or email. Gmail, Calendar, Outlook, Oura, Apple Health, and Google Drive
remain optional data connections after sign-in.

## 1. Create the account project

1. Create a Supabase project.
2. Open its SQL editor.
3. Run `supabase/migrations/001_deeds_accounts.sql`.
4. In **Authentication → URL Configuration**, set:
   - Site URL: `https://p-n-p.vercel.app`
   - Redirect URL: `https://p-n-p.vercel.app/`
   - Add the local development URL when needed.

## 2. Add Vercel environment variables

Add these to Production, Preview, and Development as appropriate:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

The service-role key must remain server-only. Never expose it in browser code
or give it a `NEXT_PUBLIC_` prefix.

## 3. Enable email sign-in

Email authentication is enabled by default in Supabase.

Edit the sign-in email template so it includes the one-time code:

`{{ .Token }}`

The app also accepts the secure link from the same email. Entering the code
directly is the most reliable path inside installed iPhone and Android builds.

## 4. Enable Google account sign-in

Create a dedicated Google OAuth web client for D.E.E.D.S. account identity.
This is separate from the existing Google Mail, Calendar, and Drive connector.

Use the callback URL displayed on the Supabase Google provider page, normally:

`https://YOUR_PROJECT.supabase.co/auth/v1/callback`

Add the Google client ID and secret to the Supabase Google provider.

## 5. Enable Sign in with Apple

In Apple Developer:

1. Enable Sign in with Apple for the existing App ID.
2. Create a Services ID for web authentication.
3. Configure the Supabase project domain and callback URL shown on the Supabase
   Apple provider page.
4. Create a Sign in with Apple key and store the `.p8` file securely.
5. Add the Services ID, Team ID, Key ID, and generated secret to Supabase.

Apple web authentication secrets require periodic rotation. Keep a reminder
for that maintenance.

## 6. Verify the safety behavior

Test with disposable accounts before migrating a real profile:

1. Sign in on a populated device. Confirm the account record is created.
2. Sign into the same account in a clean browser. Confirm the populated record
   restores before onboarding appears.
3. Confirm a blank browser cannot replace the populated account.
4. Switch accounts. Confirm the existing device copy is held for an explicit
   choice rather than uploaded automatically.
5. Connect Google and use **Back up to Drive**. Confirm the independent Drive
   copy and revision history remain available.
