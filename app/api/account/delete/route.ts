import { NextResponse } from "next/server";

type DeleteScope = "data" | "account";

function environment() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  return { url, key, serviceKey };
}

function serviceHeaders(serviceKey: string) {
  return {
    apikey: serviceKey,
    ...(serviceKey.startsWith("sb_secret_") ? {} : { Authorization: `Bearer ${serviceKey}` }),
  };
}

function bearer(request: Request) {
  const value = request.headers.get("authorization") || "";
  return value.startsWith("Bearer ") ? value.slice(7) : "";
}

async function verifiedUser(request: Request) {
  const { url, key, serviceKey } = environment(), token = bearer(request);
  if (!url || !key || !serviceKey) return { error: "D.E.E.D.S. accounts are not configured.", status: 503 } as const;
  if (!token) return { error: "Sign in before deleting account data.", status: 401 } as const;
  const response = await fetch(`${url}/auth/v1/user`, {
    headers: { apikey: key, Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!response.ok) return { error: "Your D.E.E.D.S. session has expired. Sign in again before deleting anything.", status: 401 } as const;
  const user = await response.json() as { id?: string; email?: string };
  if (!user.id || !user.email) return { error: "Your D.E.E.D.S. account could not be verified.", status: 401 } as const;
  return { url, serviceKey, userId: user.id, email: user.email } as const;
}

async function deleteRows(url: string, serviceKey: string, table: string, userId: string) {
  const response = await fetch(`${url}/rest/v1/${table}?user_id=eq.${encodeURIComponent(userId)}`, {
    method: "DELETE",
    headers: { ...serviceHeaders(serviceKey), Prefer: "return=minimal" },
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`${table}_delete_failed`);
}

function clearConnectionCookies(response: NextResponse) {
  for (let index = 0; index <= 4; index += 1) {
    response.cookies.delete(`google_access_${index}`);
    response.cookies.delete(`google_refresh_${index}`);
    response.cookies.delete(`outlook_access_${index}`);
    response.cookies.delete(`outlook_refresh_${index}`);
  }
  [
    "google_access", "google_refresh", "google_active", "google_accounts", "google_state", "google_connect_slot",
    "outlook_access", "outlook_refresh", "outlook_active", "outlook_accounts", "outlook_state", "outlook_connect_slot",
    "oura_access", "oura_refresh", "oura_state",
  ].forEach(name => response.cookies.delete(name));
}

export async function DELETE(request: Request) {
  const account = await verifiedUser(request);
  if ("error" in account) return NextResponse.json({ error: account.error }, { status: account.status });
  const incoming = await request.json().catch(() => ({})) as unknown;
  const body = incoming && typeof incoming === "object"
    ? incoming as { scope?: DeleteScope; confirmation?: string; acknowledgePermanent?: boolean }
    : {};
  if (body.scope !== "data" && body.scope !== "account") {
    return NextResponse.json({ error: "Choose whether to delete the data or the entire account." }, { status: 400 });
  }
  if (body.scope === "data" && body.confirmation !== "DELETE MY DATA") {
    return NextResponse.json({ error: "Type DELETE MY DATA exactly to confirm." }, { status: 400 });
  }
  if (body.scope === "account" && ((body.confirmation || "").trim().toLowerCase() !== account.email.toLowerCase() || body.acknowledgePermanent !== true)) {
    return NextResponse.json({ error: "Enter the signed-in email address and confirm that account deletion is permanent." }, { status: 400 });
  }
  try {
    if (body.scope === "data") {
      await deleteRows(account.url, account.serviceKey, "deeds_snapshot_revisions", account.userId);
      await deleteRows(account.url, account.serviceKey, "deeds_snapshots", account.userId);
      const response = NextResponse.json({ deleted: true, scope: "data" });
      clearConnectionCookies(response);
      return response;
    }
    const adminResponse = await fetch(`${account.url}/auth/v1/admin/users/${encodeURIComponent(account.userId)}?should_soft_delete=false`, {
      method: "DELETE",
      headers: serviceHeaders(account.serviceKey),
      cache: "no-store",
    });
    if (!adminResponse.ok) {
      const error = await adminResponse.json().catch(() => ({})) as { msg?: string; message?: string };
      return NextResponse.json({ error: error.msg || error.message || "The account could not be deleted." }, { status: adminResponse.status });
    }
    const response = NextResponse.json({ deleted: true, scope: "account" });
    clearConnectionCookies(response);
    return response;
  } catch {
    return NextResponse.json({ error: "Deletion could not be completed. Nothing on this device was cleared." }, { status: 503 });
  }
}
