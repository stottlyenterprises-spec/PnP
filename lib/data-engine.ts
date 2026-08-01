export const DATA_SCHEMA_VERSION = 3;
export const LOCAL_DATA_KEY = "deeds-data-v2";
export const LEGACY_DATA_KEY = "pnp-v1";
const DEVICE_KEY = "deeds-device-id";
const RECOVERY_KEY = "deeds-recovery-v1";
const LAST_RECOVERY_KEY = "deeds-last-recovery";
const MAX_RECOVERY_POINTS = 5;
const MAX_RECOVERY_CHARACTERS = 2_400_000;

export type CloudEnvelope<T> = {
  kind: "deeds-data";
  schemaVersion: number;
  revision: number;
  updatedAt: string;
  deviceId: string;
  data: T;
};

export type LocalEnvelope<T> = CloudEnvelope<T> & {
  cloudRevision: number;
  dirty: boolean;
  baseData?: T;
};

export type RecoveryPoint<T> = {
  id: string;
  createdAt: string;
  reason: string;
  data: T;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const same = (left: unknown, right: unknown) => JSON.stringify(left) === JSON.stringify(right);
const clone = <T,>(value: T): T => value === undefined ? value : JSON.parse(JSON.stringify(value));

function entityKey(value: unknown) {
  if (!isRecord(value)) return null;
  if (typeof value.id === "string") return `id:${value.id}`;
  if (typeof value.date === "string" && typeof value.period === "string") return `date:${value.date}|period:${value.period}`;
  if (typeof value.date === "string" && typeof value.profileId === "string") return `date:${value.date}|profile:${value.profileId}`;
  if (typeof value.date === "string" && typeof value.source === "string" && typeof value.amount === "number") return `date:${value.date}|source:${value.source}|amount:${value.amount}`;
  if (typeof value.date === "string") return `date:${value.date}`;
  return null;
}

function keyedArray(values: unknown[]) {
  const entries = values.map(value => [entityKey(value), value] as const);
  if (entries.some(([key]) => !key)) return null;
  const keys = entries.map(([key]) => key as string);
  if (new Set(keys).size !== keys.length) return null;
  return new Map(entries as [string, unknown][]);
}

function mergePrimitiveArray(base: unknown[], local: unknown[], remote: unknown[]) {
  const encode = (value: unknown) => JSON.stringify(value);
  const baseKeys = new Set(base.map(encode)), localKeys = new Set(local.map(encode)), remoteKeys = new Set(remote.map(encode));
  const result: unknown[] = [];
  const append = (value: unknown) => {
    if (!result.some(existing => same(existing, value))) result.push(clone(value));
  };
  local.forEach(value => {
    const key = encode(value);
    if (!baseKeys.has(key) || remoteKeys.has(key)) append(value);
  });
  remote.forEach(value => {
    const key = encode(value);
    if (!baseKeys.has(key) || localKeys.has(key)) append(value);
  });
  return result;
}

function mergeValue(base: unknown, local: unknown, remote: unknown, path: string, conflicts: string[]): unknown {
  if (same(local, remote)) return clone(local);
  if (same(local, base)) return clone(remote);
  if (same(remote, base)) return clone(local);
  if (base === undefined) {
    if (local === undefined) return clone(remote);
    if (remote === undefined) return clone(local);
  }
  if (local === undefined || remote === undefined) {
    conflicts.push(path);
    return clone(local === undefined ? remote : local);
  }
  if (Array.isArray(local) && Array.isArray(remote)) {
    const baseArray = Array.isArray(base) ? base : [];
    const localMap = keyedArray(local), remoteMap = keyedArray(remote), baseMap = keyedArray(baseArray);
    if (!localMap || !remoteMap || !baseMap) return mergePrimitiveArray(baseArray, local, remote);
    const orderedKeys = [...localMap.keys(), ...[...remoteMap.keys()].filter(key => !localMap.has(key))];
    const merged: unknown[] = [];
    for (const key of orderedKeys) {
      const baseItem = baseMap.get(key), localItem = localMap.get(key), remoteItem = remoteMap.get(key);
      if (baseItem !== undefined && localItem === undefined && remoteItem !== undefined) {
        if (!same(remoteItem, baseItem)) {
          conflicts.push(`${path}[${key}]`);
          merged.push(clone(remoteItem));
        }
        continue;
      }
      if (baseItem !== undefined && remoteItem === undefined && localItem !== undefined) {
        if (!same(localItem, baseItem)) {
          conflicts.push(`${path}[${key}]`);
          merged.push(clone(localItem));
        }
        continue;
      }
      if (localItem === undefined && remoteItem === undefined) continue;
      merged.push(mergeValue(baseItem, localItem, remoteItem, `${path}[${key}]`, conflicts));
    }
    return merged;
  }
  if (isRecord(local) && isRecord(remote)) {
    const baseRecord = isRecord(base) ? base : {};
    const keys = new Set([...Object.keys(baseRecord), ...Object.keys(local), ...Object.keys(remote)]);
    return Object.fromEntries([...keys].map(key => [
      key,
      mergeValue(baseRecord[key], local[key], remote[key], path ? `${path}.${key}` : key, conflicts),
    ]).filter(([, value]) => value !== undefined));
  }
  conflicts.push(path);
  return clone(local);
}

export function mergeWithBase<T>(base: T, local: T, remote: T) {
  const conflicts: string[] = [];
  return {
    data: mergeValue(base, local, remote, "", conflicts) as T,
    conflicts: [...new Set(conflicts.filter(Boolean))],
  };
}

export function getDeviceId() {
  if (typeof window === "undefined") return "server";
  const existing = localStorage.getItem(DEVICE_KEY);
  if (existing) return existing;
  const id = crypto.randomUUID();
  localStorage.setItem(DEVICE_KEY, id);
  return id;
}

export function isCloudEnvelope<T>(value: unknown): value is CloudEnvelope<T> {
  return (
    isRecord(value) &&
    value.kind === "deeds-data" &&
    typeof value.revision === "number" &&
    typeof value.updatedAt === "string" &&
    typeof value.deviceId === "string" &&
    "data" in value
  );
}

export function readLocalEnvelope<T>(
  normalize: (raw: Partial<T>) => T,
  fallback: T,
): LocalEnvelope<T> {
  const deviceId = getDeviceId();
  try {
    const current = localStorage.getItem(LOCAL_DATA_KEY);
    if (current) {
      const parsed = JSON.parse(current) as unknown;
      if (isCloudEnvelope<T>(parsed)) {
        const local = parsed as Partial<LocalEnvelope<T>> & CloudEnvelope<T>;
        return {
          ...local,
          schemaVersion: DATA_SCHEMA_VERSION,
          cloudRevision: Number(local.cloudRevision) || 0,
          dirty: Boolean(local.dirty),
          baseData: local.baseData ? normalize(local.baseData as Partial<T>) : undefined,
          data: normalize(local.data as Partial<T>),
        };
      }
    }
    const legacy = localStorage.getItem(LEGACY_DATA_KEY);
    if (legacy) {
      return {
        kind: "deeds-data",
        schemaVersion: DATA_SCHEMA_VERSION,
        revision: 1,
        cloudRevision: 0,
        dirty: true,
        updatedAt: new Date().toISOString(),
        deviceId,
        data: normalize(JSON.parse(legacy) as Partial<T>),
      };
    }
  } catch {
    // Invalid local data falls back safely without preventing the app from opening.
  }
  return {
    kind: "deeds-data",
    schemaVersion: DATA_SCHEMA_VERSION,
    revision: 0,
    cloudRevision: 0,
    dirty: false,
    updatedAt: new Date().toISOString(),
    deviceId,
    data: fallback,
  };
}

export function coerceCloudEnvelope<T>(
  payload: unknown,
  normalize: (raw: Partial<T>) => T,
): CloudEnvelope<T> | null {
  if (!payload) return null;
  if (isCloudEnvelope<T>(payload)) {
    return {
      ...payload,
      schemaVersion: DATA_SCHEMA_VERSION,
      data: normalize(payload.data as Partial<T>),
    };
  }
  if (isRecord(payload) && isRecord(payload.data)) {
    return {
      kind: "deeds-data",
      schemaVersion: DATA_SCHEMA_VERSION,
      revision: 0,
      updatedAt: typeof payload.savedAt === "string" ? payload.savedAt : new Date(0).toISOString(),
      deviceId: "legacy-cloud",
      data: normalize(payload.data as Partial<T>),
    };
  }
  return null;
}

export function writeLocalEnvelope<T>(envelope: LocalEnvelope<T>) {
  localStorage.setItem(LOCAL_DATA_KEY, JSON.stringify(envelope));
  // Keep the old key current during the migration window.
  localStorage.setItem(LEGACY_DATA_KEY, JSON.stringify(envelope.data));
}

export function markLocalChange<T>(
  previous: LocalEnvelope<T>,
  data: T,
): LocalEnvelope<T> {
  const next = {
    ...previous,
    schemaVersion: DATA_SCHEMA_VERSION,
    revision: previous.revision + 1,
    updatedAt: new Date().toISOString(),
    deviceId: getDeviceId(),
    dirty: true,
    data,
  };
  writeLocalEnvelope(next);
  return next;
}

export function acceptCloudEnvelope<T>(cloud: CloudEnvelope<T>): LocalEnvelope<T> {
  const local = {
    ...cloud,
    schemaVersion: DATA_SCHEMA_VERSION,
    cloudRevision: cloud.revision,
    dirty: false,
    baseData: clone(cloud.data),
  };
  writeLocalEnvelope(local);
  return local;
}

export function prepareMergedEnvelope<T>(
  local: LocalEnvelope<T>,
  remote: CloudEnvelope<T>,
  data: T,
): LocalEnvelope<T> {
  const next: LocalEnvelope<T> = {
    ...local,
    schemaVersion: DATA_SCHEMA_VERSION,
    revision: local.revision + 1,
    cloudRevision: remote.revision,
    updatedAt: new Date().toISOString(),
    deviceId: getDeviceId(),
    dirty: true,
    baseData: clone(remote.data),
    data,
  };
  writeLocalEnvelope(next);
  return next;
}

export function readRecoveryPoints<T>(): RecoveryPoint<T>[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(RECOVERY_KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function createRecoveryPoint<T>(data: T, reason: string, force = false) {
  const currentTime = Date.now();
  const lastTime = Number(localStorage.getItem(LAST_RECOVERY_KEY) || 0);
  if (!force && currentTime - lastTime < 6 * 60 * 60 * 1000) return readRecoveryPoints<T>();
  const point: RecoveryPoint<T> = {
    id: crypto.randomUUID(),
    createdAt: new Date(currentTime).toISOString(),
    reason,
    data,
  };
  const points = [point, ...readRecoveryPoints<T>()].slice(0, MAX_RECOVERY_POINTS);
  while (points.length > 1 && JSON.stringify(points).length > MAX_RECOVERY_CHARACTERS) points.pop();
  localStorage.setItem(RECOVERY_KEY, JSON.stringify(points));
  localStorage.setItem(LAST_RECOVERY_KEY, String(currentTime));
  return points;
}

export function deleteRecoveryPoint<T>(id: string) {
  const points = readRecoveryPoints<T>().filter((point) => point.id !== id);
  localStorage.setItem(RECOVERY_KEY, JSON.stringify(points));
  return points;
}

export function clearLocalDeedsData() {
  if (typeof window === "undefined") return;
  [LOCAL_DATA_KEY, LEGACY_DATA_KEY, RECOVERY_KEY, LAST_RECOVERY_KEY, DEVICE_KEY].forEach(key => localStorage.removeItem(key));
}
