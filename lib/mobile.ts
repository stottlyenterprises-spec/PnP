export type PnpPlatform = "web" | "ios" | "android";
export type NativeSharedCapture = {
  kind: "Task" | "Note" | "Journal";
  text: string;
  queueId?: string;
  createdAt?: string;
};
export type NativePrivacyState = {
  available: boolean;
  enabled: boolean;
  biometricType?: string;
};
export type NativeDraftKind = "interview" | "health" | "journal";
export type NativeDraft<T = unknown> = {
  kind: NativeDraftKind;
  updatedAt: string;
  payload: T;
};
export type NativeHealthDay = {
  date: string;
  sleepHours?: number;
  weightPounds?: number;
  sleepSource?: string;
  weightSource?: string;
};
export type NativeHealthState = {
  provider: "Apple Health" | "Health Connect";
  available: boolean;
  authorized: boolean;
  message?: string;
  days?: NativeHealthDay[];
};
export type NativeAppleCalendarEvent = {
  id: string;
  summary: string;
  start: string;
  end: string;
  htmlLink: string;
  calendar?: string;
  allDay?: boolean;
};
export type NativeAppleState = {
  provider: "Apple iCloud";
  available: boolean;
  authorized: boolean;
  message?: string;
  events?: NativeAppleCalendarEvent[];
};

type PluginListenerHandle = {
  remove: () => Promise<void> | void;
};

type NativePlugins = {
  App?: {
    addListener: (
      event: "appUrlOpen" | "appStateChange",
      listener: (event: { url?: string; isActive?: boolean }) => void,
    ) => Promise<PluginListenerHandle>;
  };
  Haptics?: {
    impact: (options: { style: "LIGHT" | "MEDIUM" | "HEAVY" }) => Promise<void>;
  };
  LocalNotifications?: {
    requestPermissions: () => Promise<{ display: "granted" | "denied" | "prompt" | "prompt-with-rationale" }>;
    cancel: (options: { notifications: { id: number }[] }) => Promise<void>;
    schedule: (options: {
      notifications: {
        id: number;
        title: string;
        body: string;
        schedule: { on: { weekday?: number; hour: number; minute: number }; allowWhileIdle?: boolean };
        extra?: { view?: string; period?: string };
      }[];
    }) => Promise<unknown>;
    addListener: (
      event: "localNotificationActionPerformed",
      listener: (event: { notification?: { extra?: { view?: string; period?: string } } }) => void,
    ) => Promise<PluginListenerHandle>;
  };
  DeedsPrivacy?: {
    status: () => Promise<NativePrivacyState>;
    setEnabled: (options: { enabled: boolean }) => Promise<NativePrivacyState>;
    authenticate: (options: { reason: string }) => Promise<{ authenticated: boolean }>;
    secureSet: (options: { key: string; value: string }) => Promise<void>;
    secureGet: (options: { key: string }) => Promise<{ value: string | null }>;
    secureRemove: (options: { key: string }) => Promise<void>;
    queueCapture: (options: NativeSharedCapture) => Promise<{ pending: number }>;
    nextCapture: () => Promise<{ pending: number; capture: NativeSharedCapture | null }>;
    acknowledgeCapture: (options: { id: string }) => Promise<{ pending: number }>;
  };
  DeedsHealth?: {
    status: () => Promise<NativeHealthState>;
    requestAccess: () => Promise<NativeHealthState>;
    readRecent: (options: { days: number }) => Promise<NativeHealthState>;
    openSettings: () => Promise<void>;
  };
  DeedsApple?: {
    status: () => Promise<NativeAppleState>;
    requestCalendarAccess: () => Promise<NativeAppleState>;
    readCalendar: (options: { start: string; end: string }) => Promise<NativeAppleState>;
    openSettings: () => Promise<void>;
  };
};

type CapacitorRuntime = {
  isNativePlatform?: () => boolean;
  getPlatform?: () => string;
  Plugins?: NativePlugins;
};

declare global {
  interface Window {
    Capacitor?: CapacitorRuntime;
  }
}

export function getPnpPlatform(): PnpPlatform {
  if (typeof window === "undefined") return "web";
  if (!window.Capacitor?.isNativePlatform?.()) return "web";
  const platform = window.Capacitor.getPlatform?.();
  return platform === "ios" || platform === "android" ? platform : "web";
}

export function isNativePnp(): boolean {
  return getPnpPlatform() !== "web";
}

function plugins(): NativePlugins | undefined {
  return typeof window === "undefined" ? undefined : window.Capacitor?.Plugins;
}

export function requestedView(url = window.location.href): string | null {
  try {
    return new URL(url).searchParams.get("view");
  } catch {
    return null;
  }
}

export function consumeVoiceTask(url = window.location.href): string | null {
  try {
    const parsed = new URL(url);
    const task = parsed.searchParams.get("voiceTask")?.trim();
    return task || null;
  } catch {
    return null;
  }
}

export function consumeSharedCapture(url = window.location.href): NativeSharedCapture | null {
  try {
    const parsed = new URL(url);
    const shared = parsed.searchParams.get("share") === "1";
    const requestedKind = parsed.searchParams.get("capture");
    if (!shared && !requestedKind) return null;
    const text = [
      parsed.searchParams.get("title")?.trim(),
      parsed.searchParams.get("text")?.trim(),
      parsed.searchParams.get("url")?.trim(),
    ].filter(Boolean).join("\n\n");
    if (!text && !requestedKind) return null;
    const kind = requestedKind === "Journal" ? "Journal" : requestedKind === "Note" ? "Note" : "Task";
    return { kind, text };
  } catch {
    return null;
  }
}

export async function taskCompletionHaptic(): Promise<void> {
  if (!isNativePnp()) return;
  await plugins()?.Haptics?.impact({ style: "MEDIUM" }).catch(() => undefined);
}

export async function nativePrivacyStatus(): Promise<NativePrivacyState> {
  if (!isNativePnp()) return { available: false, enabled: false };
  return plugins()?.DeedsPrivacy?.status().catch(() => ({ available: false, enabled: false }))
    ?? { available: false, enabled: false };
}

export async function setNativePrivacyEnabled(enabled: boolean): Promise<NativePrivacyState> {
  if (!isNativePnp()) return { available: false, enabled: false };
  return plugins()?.DeedsPrivacy?.setEnabled({ enabled }).catch(() => ({ available: false, enabled: false }))
    ?? { available: false, enabled: false };
}

export async function authenticateNativePrivacy(reason = "Unlock your private D.E.E.D.S. information"): Promise<boolean> {
  if (!isNativePnp()) return true;
  const result = await plugins()?.DeedsPrivacy?.authenticate({ reason }).catch(() => ({ authenticated: false }));
  return !!result?.authenticated;
}

export async function nativeSecureSet(key: string, value: string): Promise<boolean> {
  if (!isNativePnp()) return false;
  return plugins()?.DeedsPrivacy?.secureSet({ key, value }).then(() => true).catch(() => false) ?? false;
}

export async function nativeSecureGet(key: string): Promise<string | null> {
  if (!isNativePnp()) return null;
  return plugins()?.DeedsPrivacy?.secureGet({ key }).then(result => result.value).catch(() => null) ?? null;
}

export async function nativeSecureRemove(key: string): Promise<boolean> {
  if (!isNativePnp()) return false;
  return plugins()?.DeedsPrivacy?.secureRemove({ key }).then(() => true).catch(() => false) ?? false;
}

const nativeWebSnapshotManifestKey = "deeds.web-storage-snapshot.manifest";
const nativeWebSnapshotChunkKey = (index: number) => `deeds.web-storage-snapshot.${index}`;
const nativeWebSnapshotChunkSize = 20_000;

type NativeWebSnapshotManifest = { chunks: number; updatedAt: string };

function safeSnapshotManifest(raw: string): NativeWebSnapshotManifest | null {
  try {
    const value = JSON.parse(raw) as Partial<NativeWebSnapshotManifest>;
    const chunks = Number(value.chunks);
    return Number.isInteger(chunks) && chunks > 0 && chunks <= 500
      ? { chunks, updatedAt: String(value.updatedAt || "") }
      : null;
  } catch {
    return null;
  }
}

export async function saveNativeWebStorageSnapshot(keys: string[]): Promise<boolean> {
  if (!isNativePnp() || typeof localStorage === "undefined") return false;
  const values = Object.fromEntries(keys.map(key => [key, localStorage.getItem(key)]));
  const serialized = JSON.stringify({ updatedAt: new Date().toISOString(), values });
  const chunks = Array.from(
    { length: Math.ceil(serialized.length / nativeWebSnapshotChunkSize) },
    (_, index) => serialized.slice(index * nativeWebSnapshotChunkSize, (index + 1) * nativeWebSnapshotChunkSize),
  );
  const previousRaw = await nativeSecureGet(nativeWebSnapshotManifestKey);
  const previous = previousRaw ? safeSnapshotManifest(previousRaw) : null;
  const saved = await Promise.all(chunks.map((chunk, index) => nativeSecureSet(nativeWebSnapshotChunkKey(index), chunk)));
  if (saved.some(result => !result)) return false;
  const manifest: NativeWebSnapshotManifest = { chunks: chunks.length, updatedAt: new Date().toISOString() };
  if (!await nativeSecureSet(nativeWebSnapshotManifestKey, JSON.stringify(manifest))) return false;
  if (previous && previous.chunks > chunks.length) {
    await Promise.all(Array.from({ length: previous.chunks - chunks.length }, (_, index) =>
      nativeSecureRemove(nativeWebSnapshotChunkKey(chunks.length + index))));
  }
  return true;
}

export async function restoreNativeWebStorageSnapshot(keys: string[]): Promise<boolean> {
  if (!isNativePnp() || typeof localStorage === "undefined") return false;
  const manifestRaw = await nativeSecureGet(nativeWebSnapshotManifestKey);
  const manifest = manifestRaw ? safeSnapshotManifest(manifestRaw) : null;
  if (!manifest?.chunks) return false;
  const chunks = await Promise.all(Array.from({ length: manifest.chunks }, (_, index) =>
    nativeSecureGet(nativeWebSnapshotChunkKey(index))));
  if (chunks.some(chunk => chunk == null)) return false;
  try {
    const snapshot = JSON.parse(chunks.join("")) as { values?: Record<string, string | null> };
    let restored = false;
    keys.forEach(key => {
      const value = snapshot.values?.[key];
      if (typeof value === "string" && !localStorage.getItem(key)) {
        localStorage.setItem(key, value);
        restored = true;
      }
    });
    return restored;
  } catch {
    return false;
  }
}

const nativeDraftKey = (kind: NativeDraftKind) => `deeds.draft.${kind}`;

export async function saveNativeDraft<T>(kind: NativeDraftKind, payload: T): Promise<boolean> {
  const draft: NativeDraft<T> = { kind, updatedAt: new Date().toISOString(), payload };
  return nativeSecureSet(nativeDraftKey(kind), JSON.stringify(draft));
}

export async function loadNativeDraft<T>(kind: NativeDraftKind): Promise<NativeDraft<T> | null> {
  const raw = await nativeSecureGet(nativeDraftKey(kind));
  if (!raw) return null;
  try {
    const draft = JSON.parse(raw) as Partial<NativeDraft<T>>;
    if (draft.kind !== kind || typeof draft.updatedAt !== "string" || draft.payload == null) return null;
    return draft as NativeDraft<T>;
  } catch {
    return null;
  }
}

export async function clearNativeDraft(kind: NativeDraftKind): Promise<boolean> {
  return nativeSecureRemove(nativeDraftKey(kind));
}

export async function nativeHealthStatus(): Promise<NativeHealthState> {
  const provider = getPnpPlatform() === "ios" ? "Apple Health" : "Health Connect";
  if (!isNativePnp()) return { provider, available: false, authorized: false };
  return plugins()?.DeedsHealth?.status().catch(error => ({
    provider,
    available: false,
    authorized: false,
    message: error instanceof Error ? error.message : "Connected health is unavailable.",
  })) ?? { provider, available: false, authorized: false };
}

export async function requestNativeHealthAccess(): Promise<NativeHealthState> {
  const provider = getPnpPlatform() === "ios" ? "Apple Health" : "Health Connect";
  if (!isNativePnp()) return { provider, available: false, authorized: false };
  return plugins()?.DeedsHealth?.requestAccess().catch(error => ({
    provider,
    available: true,
    authorized: false,
    message: error instanceof Error ? error.message : "Health access was not granted.",
  })) ?? { provider, available: false, authorized: false };
}

export async function readNativeHealth(days = 14): Promise<NativeHealthState> {
  const provider = getPnpPlatform() === "ios" ? "Apple Health" : "Health Connect";
  if (!isNativePnp()) return { provider, available: false, authorized: false, days: [] };
  return plugins()?.DeedsHealth?.readRecent({ days: Math.max(1, Math.min(30, days)) }).catch(error => ({
    provider,
    available: true,
    authorized: false,
    days: [],
    message: error instanceof Error ? error.message : "Health data could not be read.",
  })) ?? { provider, available: false, authorized: false, days: [] };
}

export async function openNativeHealthSettings(): Promise<void> {
  if (!isNativePnp()) return;
  await plugins()?.DeedsHealth?.openSettings().catch(() => undefined);
}

const unavailableAppleState = (message?: string): NativeAppleState => ({
  provider: "Apple iCloud",
  available: false,
  authorized: false,
  message,
  events: [],
});

export async function nativeAppleStatus(): Promise<NativeAppleState> {
  if (getPnpPlatform() !== "ios") return unavailableAppleState("Apple iCloud is available in the iPhone and iPad app.");
  return plugins()?.DeedsApple?.status().catch(error => unavailableAppleState(
    error instanceof Error ? error.message : "Apple iCloud is unavailable.",
  )) ?? unavailableAppleState("Update the native app to connect Apple iCloud.");
}

export async function requestNativeAppleCalendarAccess(): Promise<NativeAppleState> {
  if (getPnpPlatform() !== "ios") return unavailableAppleState("Apple iCloud is available in the iPhone and iPad app.");
  return plugins()?.DeedsApple?.requestCalendarAccess().catch(error => ({
    ...unavailableAppleState(error instanceof Error ? error.message : "Calendar access was not granted."),
    available: true,
  })) ?? unavailableAppleState("Update the native app to connect Apple iCloud.");
}

export async function readNativeAppleCalendar(start: string, end: string): Promise<NativeAppleState> {
  if (getPnpPlatform() !== "ios") return unavailableAppleState("Apple iCloud is available in the iPhone and iPad app.");
  return plugins()?.DeedsApple?.readCalendar({ start, end }).catch(error => ({
    ...unavailableAppleState(error instanceof Error ? error.message : "Apple Calendar could not be refreshed."),
    available: true,
  })) ?? unavailableAppleState("Update the native app to connect Apple iCloud.");
}

export async function openNativeAppleSettings(): Promise<void> {
  if (getPnpPlatform() !== "ios") return;
  await plugins()?.DeedsApple?.openSettings().catch(() => undefined);
}

export async function queueNativeCapture(capture: NativeSharedCapture): Promise<number> {
  if (!isNativePnp()) return 0;
  const result = await plugins()?.DeedsPrivacy?.queueCapture(capture).catch(() => ({ pending: 0 }));
  return result?.pending ?? 0;
}

export async function nextNativeCapture(): Promise<NativeSharedCapture | null> {
  if (!isNativePnp()) return null;
  const result = await plugins()?.DeedsPrivacy?.nextCapture().catch(() => ({ pending: 0, capture: null }));
  return result?.capture ?? null;
}

export async function acknowledgeNativeCapture(id?: string): Promise<number> {
  if (!isNativePnp() || !id) return 0;
  const result = await plugins()?.DeedsPrivacy?.acknowledgeCapture({ id }).catch(() => ({ pending: 0 }));
  return result?.pending ?? 0;
}

export async function enableNativeCheckInReminders(): Promise<boolean> {
  if (!isNativePnp()) return false;
  const notifications = plugins()?.LocalNotifications;
  if (!notifications) return false;
  const permission = await notifications.requestPermissions().catch(() => ({ display: "denied" as const }));
  if (permission.display !== "granted") return false;
  const ids = [1101, 1102, 1103, 1104];
  await notifications.cancel({ notifications: ids.map(id => ({ id })) }).catch(() => undefined);
  await notifications.schedule({
    notifications: [
      {
        id: 1101,
        title: "D.E.E.D.S. breakfast check-in",
        body: "Start with context, not pressure.",
        schedule: { on: { hour: 8, minute: 0 }, allowWhileIdle: true },
        extra: { view: "home", period: "breakfast" },
      },
      {
        id: 1102,
        title: "D.E.E.D.S. lunch check-in",
        body: "Notice what changed and what the afternoon needs.",
        schedule: { on: { hour: 12, minute: 30 }, allowWhileIdle: true },
        extra: { view: "home", period: "lunch" },
      },
      {
        id: 1103,
        title: "D.E.E.D.S. dinner check-in",
        body: "Close the active part of the day with useful information.",
        schedule: { on: { hour: 18, minute: 30 }, allowWhileIdle: true },
        extra: { view: "home", period: "dinner" },
      },
      {
        id: 1104,
        title: "D.E.E.D.S. weekly review",
        body: "Notice what moved. Progress, Not Perfection.",
        schedule: { on: { weekday: 1, hour: 17, minute: 0 }, allowWhileIdle: true },
        extra: { view: "review" },
      },
    ],
  });
  return true;
}

export async function installNativeBridge(handlers: {
  onView: (view: string) => void;
  onVoiceTask: (task: string) => void;
  onSharedCapture: (capture: NativeSharedCapture) => void;
  onInterview: (period: string) => void;
  onAccountCallback: (url: string) => void;
  onResume: () => void;
}): Promise<() => void> {
  if (!isNativePnp()) return () => undefined;
  const native = plugins();
  const handles: PluginListenerHandle[] = [];
  const deliverQueuedCapture = async () => {
    const capture = await native?.DeedsPrivacy?.nextCapture().then(result => result.capture).catch(() => null);
    if (capture) handlers.onSharedCapture(capture);
  };
  const routeUrl = (url?: string) => {
    if (!url) return;
    if (url.startsWith("deeds://open") && /(?:access_token|error(?:_description)?)=/.test(url)) {
      handlers.onAccountCallback(url);
      return;
    }
    if (url.startsWith("deeds://open") && /(?:google|outlook|oura)=(?:connected|disconnected)/.test(url)) {
      window.location.reload();
      return;
    }
    const task = consumeVoiceTask(url);
    const capture = consumeSharedCapture(url);
    const view = requestedView(url);
    if (task) handlers.onVoiceTask(task);
    if (capture) handlers.onSharedCapture(capture);
    if (view) handlers.onView(view);
  };
  if (native?.App) {
    handles.push(await native.App.addListener("appUrlOpen", event => routeUrl(event.url)));
    handles.push(await native.App.addListener("appStateChange", event => {
      if (event.isActive) {
        void deliverQueuedCapture();
        handlers.onResume();
      }
    }));
  }
  if (native?.LocalNotifications) {
    handles.push(await native.LocalNotifications.addListener("localNotificationActionPerformed", event => {
      const extra = event.notification?.extra;
      if (extra?.period) handlers.onInterview(extra.period);
      else if (extra?.view) handlers.onView(extra.view);
    }));
  }
  void deliverQueuedCapture();
  return () => {
    handles.forEach(handle => void handle.remove());
  };
}
