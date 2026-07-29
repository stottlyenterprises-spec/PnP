export type PnpPlatform = "web" | "ios" | "android";
export type NativeSharedCapture = {
  kind: "Task" | "Note" | "Journal";
  text: string;
};
export type NativePrivacyState = {
  available: boolean;
  enabled: boolean;
  biometricType?: string;
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
  onResume: () => void;
}): Promise<() => void> {
  if (!isNativePnp()) return () => undefined;
  const native = plugins();
  const handles: PluginListenerHandle[] = [];
  const routeUrl = (url?: string) => {
    if (!url) return;
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
      if (event.isActive) handlers.onResume();
    }));
  }
  if (native?.LocalNotifications) {
    handles.push(await native.LocalNotifications.addListener("localNotificationActionPerformed", event => {
      const extra = event.notification?.extra;
      if (extra?.period) handlers.onInterview(extra.period);
      else if (extra?.view) handlers.onView(extra.view);
    }));
  }
  return () => {
    handles.forEach(handle => void handle.remove());
  };
}
