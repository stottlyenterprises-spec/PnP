import { NextResponse } from "next/server";

type Envelope = {
  kind: "deeds-data";
  schemaVersion: number;
  revision: number;
  updatedAt: string;
  deviceId: string;
  data: unknown;
};

type SnapshotRow = {
  user_id: string;
  revision: number;
  updated_at: string;
  device_id: string;
  schema_version: number;
  payload: unknown;
};

function environment() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return { url, key, serviceKey };
}

function bearer(request: Request) {
  const value = request.headers.get("authorization") || "";
  return value.startsWith("Bearer ") ? value.slice(7) : "";
}

async function accountUser(request: Request) {
  const { url, key, serviceKey } = environment(), token = bearer(request);
  if (!url || !key || !serviceKey) return { error: "D.E.E.D.S. accounts are not configured.", status: 503 } as const;
  if (!token) return { error: "Sign in to your D.E.E.D.S. account.", status: 401 } as const;
  const response = await fetch(`${url}/auth/v1/user`, {
    headers: { apikey: key, Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!response.ok) return { error: "Your D.E.E.D.S. session has expired.", status: 401 } as const;
  const user = await response.json() as { id?: string };
  if (!user.id) return { error: "Your D.E.E.D.S. account could not be verified.", status: 401 } as const;
  return { url, key, serviceKey, token, userId: user.id } as const;
}

async function currentRow(url: string, key: string, token: string, userId: string) {
  const response = await fetch(`${url}/rest/v1/deeds_snapshots?user_id=eq.${encodeURIComponent(userId)}&select=*`, {
    headers: { apikey: key, Authorization: `Bearer ${token}`, Accept: "application/json" },
    cache: "no-store",
  });
  if (!response.ok) throw new Error("account_store_unavailable");
  const rows = await response.json() as SnapshotRow[];
  return rows[0] || null;
}

function envelope(row: SnapshotRow): Envelope {
  return {
    kind: "deeds-data",
    schemaVersion: row.schema_version,
    revision: row.revision,
    updatedAt: row.updated_at,
    deviceId: row.device_id,
    data: row.payload,
  };
}

function recordItemCount(data: unknown) {
  if (!data || typeof data !== "object" || Array.isArray(data)) return 0;
  const record = data as Record<string, unknown>;
  const collections = [
    "tasks", "taskCategories", "health", "mentalRecords", "revenue", "mornings",
    "relationships", "relationshipProfiles", "journal", "dailyHistory", "outcomes",
    "opportunities", "decisions", "reviews", "captures", "customTaskLists",
  ];
  return collections.reduce((total, key) => total + (Array.isArray(record[key]) ? record[key].length : 0), 0);
}

export async function GET(request: Request) {
  const account = await accountUser(request);
  if ("error" in account) return NextResponse.json({ error: account.error }, { status: account.status });
  try {
    const row = await currentRow(account.url, account.key, account.token, account.userId);
    return row ? NextResponse.json({ found: true, payload: envelope(row) }) : NextResponse.json({ found: false });
  } catch {
    return NextResponse.json({ error: "Your private D.E.E.D.S. record could not be read." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  const account = await accountUser(request);
  if ("error" in account) return NextResponse.json({ error: account.error }, { status: account.status });
  try {
    const body = await request.json() as { baseRevision?: number; force?: boolean; deviceId?: string; updatedAt?: string; data?: unknown };
    if (!("data" in body)) return NextResponse.json({ error: "No D.E.E.D.S. data was supplied." }, { status: 400 });
    const current = await currentRow(account.url, account.key, account.token, account.userId);
    const currentRevision = current?.revision || 0, baseRevision = Number(body.baseRevision) || 0;
    if (current && recordItemCount(current.payload) > 0 && recordItemCount(body.data) === 0) {
      return NextResponse.json({ error: "A blank profile cannot replace a populated D.E.E.D.S. account.", conflict: true, protected: true, payload: envelope(current) }, { status: 409 });
    }
    if (current && currentRevision > 0 && baseRevision === 0 && recordItemCount(current.payload) > 0) {
      return NextResponse.json({ error: "This device must restore the account before it can save.", conflict: true, protected: true, payload: envelope(current) }, { status: 409 });
    }
    if (current && !body.force && currentRevision !== baseRevision) {
      return NextResponse.json({ error: "Your account changed on another device.", conflict: true, payload: envelope(current) }, { status: 409 });
    }
    const row: SnapshotRow = {
      user_id: account.userId,
      revision: currentRevision + 1,
      updated_at: body.updatedAt || new Date().toISOString(),
      device_id: body.deviceId || "unknown-device",
      schema_version: 3,
      payload: body.data,
    };
    const text = JSON.stringify(row.payload);
    if (text.length > 2_000_000) return NextResponse.json({ error: "D.E.E.D.S. data is too large to sync." }, { status: 413 });
    if (current) {
      const archiveResponse = await fetch(`${account.url}/rest/v1/deeds_snapshot_revisions?on_conflict=user_id,revision`, {
        method: "POST",
        headers: {
          apikey: account.serviceKey,
          Authorization: `Bearer ${account.serviceKey}`,
          "Content-Type": "application/json",
          Prefer: "resolution=ignore-duplicates",
        },
        body: JSON.stringify({
          user_id: current.user_id,
          revision: current.revision,
          updated_at: current.updated_at,
          device_id: current.device_id,
          schema_version: current.schema_version,
          payload: current.payload,
        }),
      });
      if (!archiveResponse.ok) throw new Error("archive_failed");
    }
    const response = await fetch(`${account.url}/rest/v1/deeds_snapshots?on_conflict=user_id`, {
      method: "POST",
      headers: {
        apikey: account.key,
        Authorization: `Bearer ${account.token}`,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates,return=representation",
      },
      body: JSON.stringify(row),
    });
    if (!response.ok) throw new Error("save_failed");
    const saved = (await response.json() as SnapshotRow[])[0] || row;
    return NextResponse.json({ saved: true, payload: envelope(saved) });
  } catch (error) {
    if (error instanceof SyntaxError) return NextResponse.json({ error: "The save request was invalid." }, { status: 400 });
    return NextResponse.json({ error: "Your private D.E.E.D.S. record could not be saved." }, { status: 503 });
  }
}
