import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const text = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("Capacitor loads packaged assets instead of the mutable production alias", () => {
  const config = JSON.parse(text("capacitor.config.json"));
  assert.equal(config.webDir, "native-dist");
  assert.equal(config.server?.url, undefined);
  assert.equal(config.server?.hostname, "localhost");
});

test("native API calls have an explicit production boundary", () => {
  const runtime = text("public/native-runtime.js");
  const proxy = text("proxy.ts");
  assert.match(runtime, /https:\/\/p-n-p\.vercel\.app/);
  assert.match(runtime, /credentials: "include"/);
  assert.match(runtime, /location\.assign\(target\.toString\(\)\)/);
  assert.doesNotMatch(runtime, /window\.open\(target\.toString\(\), "_blank"/);
  assert.match(proxy, /capacitor:\/\/localhost/);
  assert.match(proxy, /Access-Control-Allow-Credentials/);
});

test("native OAuth navigation allows every supported provider", () => {
  const config = JSON.parse(text("capacitor.config.json"));
  assert.ok(config.server.allowNavigation.includes("accounts.google.com"));
  assert.ok(config.server.allowNavigation.includes("moi.ouraring.com"));
  assert.ok(config.server.allowNavigation.includes("login.microsoftonline.com"));
});

test("native OAuth connections return to the installed application", () => {
  assert.match(text("app/api/google/callback/route.ts"), /deeds:\/\/open\?view=data&google=connected/);
  assert.match(text("app/api/oura/callback/route.ts"), /deeds:\/\/open\?view=data&oura=connected/);
  assert.match(text("app/api/outlook/[...action]/route.ts"), /deeds:\/\/open\?view=data&outlook=connected/);
});

test("native account callbacks survive an iOS cold start", () => {
  const mobile = text("lib/mobile.ts");
  assert.match(mobile, /getLaunchUrl/);
  assert.match(mobile, /routeUrl\(event\?\.url\)/);
  assert.match(mobile, /accountCallbackFingerprint/);
  assert.match(mobile, /deeds\.native\.account-callback/);
});

test("native builds do not follow the website version redirect", () => {
  const page = text("app/page.tsx");
  const builder = text("scripts/build-native-shell.mjs");
  assert.match(page, /__DEEDS_NATIVE_BUILD__/);
  assert.match(page, /if\(nativeBuild\).*setVersionReady\(true\)/);
  assert.match(builder, /replace\(\s*'"__DEEDS_NATIVE_BUILD__"',\s*JSON\.stringify\(version\)/);
});

test("native shell carries local records and the account session across its origin change", () => {
  const page = text("app/page.tsx");
  const mobile = text("lib/mobile.ts");
  assert.match(page, /restoreNativeWebStorageSnapshot\(nativeWebStorageKeys\)/);
  assert.match(page, /saveNativeWebStorageSnapshot\(nativeWebStorageKeys\)/);
  assert.match(page, /ACCOUNT_SESSION_KEY/);
  assert.match(mobile, /nativeWebSnapshotChunkSize = 20_000/);
  assert.match(mobile, /snapshot\.values\?\.\[key\]/);
});
