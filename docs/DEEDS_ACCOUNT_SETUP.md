# D.E.E.D.S. Account Setup

This layer creates one D.E.E.D.S. identity that can be accessed with Apple,
Google, or email. Gmail, Calendar, Outlook, Oura, Apple Health, and Google Drive
remain optional data connections after sign-in.

## 1. Create the account project

1. Open the existing D.E.E.D.S. Supabase project:
   `aaporxufmmljejqnloqv`.
2. Open its SQL editor.
3. Run `supabase/migrations/001_deeds_accounts.sql`.
4. In **Authentication → URL Configuration**, set:
   - Site URL: `https://p-n-p.vercel.app`
   - Redirect URL: `https://p-n-p.vercel.app/`
   - Native redirect URL: `deeds://open`
   - Add the local development URL when needed.

## 2. Add Vercel environment variables

Add these to Production, Preview, and Development as appropriate:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SECRET_KEY`

The secret key must remain server-only. Never expose it in browser code
or give it a `NEXT_PUBLIC_` prefix.

## 3. Enable email sign-in

Email authentication is enabled by default in Supabase.

The default secure magic link works on the web and returns directly to the
installed iPhone or Android app through `deeds://open`. If custom SMTP is added
later, the template may also include `{{ .Token }}` to offer direct code entry.

## 4. Enable Google account sign-in

Create a dedicated Google OAuth web client for D.E.E.D.S. account identity.
This is separate from the existing Google Mail, Calendar, and Drive connector.

Use the callback URL displayed on the Supabase Google provider page, normally:

`https://aaporxufmmljejqnloqv.supabase.co/auth/v1/callback`

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

## 7. Enable safe identity linking

In Supabase Authentication settings, enable **Manual identity linking**. This
allows a signed-in user to add Google or Apple as another way to open the same
D.E.E.D.S. account, including when the provider uses a different email address.

Identity linking is deliberately separate from connected-service consent.
Adding Google as a sign-in method does not grant Gmail, Calendar, or Drive
access. The user approves those permissions afterward from Settings.

## 8. Verify account and data deletion

Settings offers two deliberately separate permanent actions:

- **Delete my data** removes the account's synced D.E.E.D.S. snapshot,
  revision history, local browser copy, native drafts, and connected-service
  session cookies. The D.E.E.D.S. sign-in identity remains available.
- **Delete my account** permanently deletes the Supabase Auth user. The
  database foreign keys use `on delete cascade`, so the owned snapshot and
  revision history are removed with the account. Local data and
  connected-service session cookies are also cleared.

Both actions require a current authenticated session and explicit typed
confirmation. Account deletion also requires a separate permanent-action
acknowledgement. The browser clears local data only after the server confirms
success.

Google Drive backups are user-owned Drive files and are not deleted by either
action. The confirmation screen tells the user to remove those separately in
Google Drive if desired.

The deletion endpoint requires `SUPABASE_SECRET_KEY` or the legacy
`SUPABASE_SERVICE_ROLE_KEY`. Keep that credential server-only. Before launch,
test both actions with disposable users and confirm that a failed server
request leaves the device copy untouched.
