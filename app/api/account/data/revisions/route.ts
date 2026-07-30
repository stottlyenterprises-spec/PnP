import { NextResponse } from "next/server";

function environment() {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, ""),
    key: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  };
}

async function context(request: Request) {
  const { url, key } = environment(), authorization = request.headers.get("authorization") || "";
  if (!url || !key) return null;
  const userResponse = await fetch(`${url}/auth/v1/user`, { headers: { apikey: key, Authorization: authorization }, cache: "no-store" });
  if (!userResponse.ok) return null;
  const user = await userResponse.json() as { id?: string };
  return user.id ? { url, key, authorization, userId: user.id } : null;
}

export async function GET(request: Request) {
  const account = await context(request);
  if (!account) return NextResponse.json({ error: "Sign in to view account history." }, { status: 401 });
  const response = await fetch(`${account.url}/rest/v1/deeds_snapshot_revisions?user_id=eq.${encodeURIComponent(account.userId)}&select=id,revision,created_at,updated_at,device_id,schema_version,payload&order=revision.desc&limit=10`, {
    headers: { apikey: account.key, Authorization: account.authorization },
    cache: "no-store",
  });
  if (!response.ok) return NextResponse.json({ error: "Account history could not be read." }, { status: 503 });
  const rows = await response.json() as Array<Record<string, unknown>>;
  return NextResponse.json({ revisions: rows.map(row => ({ ...row, modifiedTime: row.created_at, updatedAt: row.updated_at })) });
}

export async function POST(request: Request) {
  const account = await context(request);
  if (!account) return NextResponse.json({ error: "Sign in to restore account history." }, { status: 401 });
  const { revisionId } = await request.json() as { revisionId?: string };
  const response = await fetch(`${account.url}/rest/v1/deeds_snapshot_revisions?id=eq.${encodeURIComponent(revisionId || "")}&user_id=eq.${encodeURIComponent(account.userId)}&select=*`, {
    headers: { apikey: account.key, Authorization: account.authorization },
    cache: "no-store",
  });
  if (!response.ok) return NextResponse.json({ error: "That account version could not be read." }, { status: 503 });
  const row = (await response.json() as Array<Record<string, unknown>>)[0];
  if (!row) return NextResponse.json({ error: "That account version no longer exists." }, { status: 404 });
  return NextResponse.json({
    payload: {
      kind: "deeds-data",
      schemaVersion: row.schema_version,
      revision: row.revision,
      updatedAt: row.updated_at,
      deviceId: row.device_id,
      data: row.payload,
    },
  });
}
