export type PnpPlatform = "web" | "ios" | "android";

type CapacitorRuntime = {
  isNativePlatform?: () => boolean;
  getPlatform?: () => string;
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
