import assert from "node:assert/strict";
import test from "node:test";

import { clearNativeDraft, loadNativeDraft, saveNativeDraft } from "../lib/mobile.ts";

type TestWindow = {
  Capacitor: {
    isNativePlatform: () => boolean;
    getPlatform: () => string;
    Plugins: {
      DeedsPrivacy: {
        secureSet: (input: { key: string; value: string }) => Promise<void>;
        secureGet: (input: { key: string }) => Promise<{ value: string | null }>;
        secureRemove: (input: { key: string }) => Promise<void>;
      };
    };
  };
};

const storage = new Map<string, string>();
const testWindow: TestWindow = {
  Capacitor: {
    isNativePlatform: () => true,
    getPlatform: () => "ios",
    Plugins: {
      DeedsPrivacy: {
        secureSet: async ({ key, value }) => { storage.set(key, value); },
        secureGet: async ({ key }) => ({ value: storage.get(key) ?? null }),
        secureRemove: async ({ key }) => { storage.delete(key); },
      },
    },
  },
};

Object.assign(globalThis, { window: testWindow });

test("an encrypted native draft can be saved and restored", async () => {
  storage.clear();
  const payload = { date: "2026-07-29", title: "Still here", body: "Keep this safe." };

  assert.equal(await saveNativeDraft("journal", payload), true);
  const restored = await loadNativeDraft<typeof payload>("journal");

  assert.equal(restored?.kind, "journal");
  assert.deepEqual(restored?.payload, payload);
  assert.match(restored?.updatedAt ?? "", /^\d{4}-\d{2}-\d{2}T/);
});

test("completion clears only the requested native draft", async () => {
  storage.clear();
  await saveNativeDraft("interview", { step: 3 });
  await saveNativeDraft("health", { date: "2026-07-29", energy: 6 });

  assert.equal(await clearNativeDraft("interview"), true);
  assert.equal(await loadNativeDraft("interview"), null);
  assert.deepEqual((await loadNativeDraft<{ date: string; energy: number }>("health"))?.payload, {
    date: "2026-07-29",
    energy: 6,
  });
});

test("malformed or mismatched secure values are not restored", async () => {
  storage.clear();
  storage.set("deeds.draft.journal", "not-json");
  assert.equal(await loadNativeDraft("journal"), null);

  storage.set("deeds.draft.health", JSON.stringify({
    kind: "journal",
    updatedAt: new Date().toISOString(),
    payload: { body: "wrong destination" },
  }));
  assert.equal(await loadNativeDraft("health"), null);
});
