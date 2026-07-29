export type HealthValueSources = {
  sleep?: string;
  weight?: string;
};

export type NativeHealthDay = {
  date: string;
  sleepHours?: number;
  weightPounds?: number;
  sleepSource?: string;
  weightSource?: string;
};

export type NativeHealthPayload = {
  provider: "Apple Health" | "Health Connect";
  available: boolean;
  authorized: boolean;
  days: NativeHealthDay[];
};

export type HealthEntryLike = {
  date: string;
  sleep: string;
  weight: string;
  sources?: HealthValueSources;
};

const sourcePriority = (source?: string) => {
  if (!source) return 100;
  if (source === "Manual") return 100;
  if (source === "Oura") return 80;
  if (source === "Apple Health" || source === "Health Connect") return 60;
  return 40;
};

function shouldUseIncoming(existingValue: string, existingSource: string | undefined, incomingSource: string) {
  if (!existingValue) return true;
  if (!existingSource) return false;
  return sourcePriority(incomingSource) >= sourcePriority(existingSource);
}

export function mergeNativeHealthDays<T extends HealthEntryLike>(
  entries: T[],
  incomingDays: NativeHealthDay[],
  createBlank: (date: string) => T,
): T[] {
  const merged = [...entries];
  for (const incoming of incomingDays) {
    const index = merged.findIndex(entry => entry.date === incoming.date);
    const existing = index >= 0 ? merged[index] : createBlank(incoming.date);
    const sources = { ...(existing.sources || {}) };
    let next = existing;

    if (
      Number.isFinite(incoming.sleepHours)
      && Number(incoming.sleepHours) > 0
      && shouldUseIncoming(existing.sleep, sources.sleep, incoming.sleepSource || "Connected health")
    ) {
      const source = incoming.sleepSource || "Connected health";
      next = { ...next, sleep: Number(incoming.sleepHours).toFixed(1).replace(/\.0$/, "") };
      sources.sleep = source;
    }

    if (
      Number.isFinite(incoming.weightPounds)
      && Number(incoming.weightPounds) > 0
      && shouldUseIncoming(existing.weight, sources.weight, incoming.weightSource || "Connected health")
    ) {
      const source = incoming.weightSource || "Connected health";
      next = { ...next, weight: Number(incoming.weightPounds).toFixed(1).replace(/\.0$/, "") };
      sources.weight = source;
    }

    next = { ...next, sources };
    if (index >= 0) merged[index] = next;
    else merged.push(next);
  }
  return merged.sort((a, b) => a.date.localeCompare(b.date));
}
