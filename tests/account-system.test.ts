import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8");
const page = read("app/page.tsx");
const accountData = read("app/api/account/data/route.ts");
const accountConfig = read("app/api/account/config/route.ts");
const accountClient = read("lib/deeds-account.ts");
const mobile = read("lib/mobile.ts");
const migration = read("supabase/migrations/001_deeds_accounts.sql");

test("D.E.E.D.S. offers three account identities while connections stay separate", () => {
  assert.match(page, /Continue with Apple/);
  assert.match(page, /Continue with Google/);
  assert.match(page, /Email me a sign-in link/);
  assert.match(page, /Mail, Calendar, Oura, and Google Drive are optional connections afterward/);
  assert.match(accountConfig, /\/auth\/v1\/settings/);
  assert.match(page, /Apple setup pending/);
  assert.match(page, /Google setup pending/);
});

test("a blank device cannot replace a populated account", () => {
  assert.match(accountData, /A blank profile cannot replace a populated D\.E\.E\.D\.S\. account/);
  assert.match(accountData, /This device must restore the account before it can save/);
  assert.match(accountData, /Your account changed on another device/);
});

test("account rows are user-owned and revision writes are server-only", () => {
  assert.match(migration, /alter table public\.deeds_snapshots enable row level security/);
  assert.match(migration, /auth\.uid\(\) = user_id/);
  assert.match(migration, /No client insert policy is intentionally/);
  assert.match(accountData, /SUPABASE_SECRET_KEY/);
  assert.match(accountData, /SUPABASE_SERVICE_ROLE_KEY/);
  assert.match(accountData, /serviceKey\.startsWith\("sb_secret_"\)/);
  assert.doesNotMatch(accountConfig, /SERVICE_ROLE/);
  assert.doesNotMatch(accountConfig, /SECRET_KEY/);
});

test("Google Drive remains an independent backup", () => {
  assert.match(page, /Update Drive backup/);
  assert.match(page, /Google Drive backup/);
  assert.match(page, /\/api\/google\/data/);
});

test("native account links return to the installed app", () => {
  assert.match(accountClient, /isNativePnp\(\) \? "deeds:\/\/open"/);
  assert.match(mobile, /handlers\.onAccountCallback\(url\)/);
  assert.match(page, /onAccountCallback:url/);
});
