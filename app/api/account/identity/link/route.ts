import { NextResponse } from "next/server";

function environment() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return { url, key };
}

function bearer(request: Request) {
  const value = request.headers.get("authorization") || "";
  return value.startsWith("Bearer ") ? value.slice(7) : "";
}

function safeRedirect(request: Request, candidate: unknown) {
  const fallback = process.env.APP_URL?.replace(/\/$/, "") || new URL(request.url).origin;
  const value = String(candidate || fallback);
  if (value === "deeds://open") return value;
  try {
    const parsed = new URL(value);
    const allowed = new Set([new URL(fallback).origin, new URL(request.url).origin]);
    return parsed.protocol === "https:" && allowed.has(parsed.origin) ? parsed.toString() : fallback;
  } catch {
    return fallback;
  }
}

export async function POST(request: Request) {
  const { url, key } = environment(), token = bearer(request);
  if (!url || !key) return NextResponse.json({ error: "D.E.E.D.S. accounts are not configured." }, { status: 503 });
  if (!token) return NextResponse.json({ error: "Sign in before adding another sign-in method." }, { status: 401 });
  const body = await request.json().catch(() => ({})) as { provider?: string; redirectTo?: string };
  if (body.provider !== "google" && body.provider !== "apple") {
    return NextResponse.json({ error: "That sign-in method is not supported." }, { status: 400 });
  }
  const authorize = new URL(`${url}/auth/v1/user/identities/authorize`);
  authorize.searchParams.set("provider", body.provider);
  authorize.searchParams.set("scopes", body.provider === "google" ? "openid email profile" : "email name");
  authorize.searchParams.set("redirect_to", safeRedirect(request, body.redirectTo));
  const response = await fetch(authorize, {
    headers: { apikey: key, Authorization: `Bearer ${token}` },
    redirect: "manual",
    cache: "no-store",
  });
  const location = response.headers.get("location");
  if (response.status >= 300 && response.status < 400 && location) return NextResponse.json({ url: location });
  const errorBody = await response.json().catch(() => ({})) as { msg?: string; message?: string; error_description?: string; error_code?: string };
  return NextResponse.json({
    error: errorBody.error_code === "manual_linking_disabled"
      ? "Account linking must be enabled once in the D.E.E.D.S. account service."
      : errorBody.msg || errorBody.message || errorBody.error_description || "That sign-in method could not be linked.",
  }, { status: response.status || 400 });
}
