import { isNativePnp } from "@/lib/mobile";

export const ACCOUNT_SESSION_KEY = "deeds-account-session-v1";

export type DeedsAccountUser = {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  provider?: string;
};

export type DeedsAccountSession = {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  user: DeedsAccountUser;
};

export type DeedsAccountState = {
  configured: boolean;
  checked: boolean;
  connected: boolean;
  session: DeedsAccountSession | null;
  error: string;
};

type SupabaseUser = {
  id?: string;
  email?: string;
  app_metadata?: { provider?: string };
  user_metadata?: {
    full_name?: string;
    name?: string;
    avatar_url?: string;
    picture?: string;
  };
};

function accountUser(user: SupabaseUser): DeedsAccountUser {
  const email = String(user.email || "");
  return {
    id: String(user.id || ""),
    email,
    name: String(user.user_metadata?.full_name || user.user_metadata?.name || email.split("@")[0] || "D.E.E.D.S. user"),
    avatarUrl: String(user.user_metadata?.avatar_url || user.user_metadata?.picture || "") || undefined,
    provider: String(user.app_metadata?.provider || "") || undefined,
  };
}

export function readAccountSession() {
  if (typeof window === "undefined") return null;
  try {
    const value = localStorage.getItem(ACCOUNT_SESSION_KEY);
    return value ? JSON.parse(value) as DeedsAccountSession : null;
  } catch {
    return null;
  }
}

export function saveAccountSession(session: DeedsAccountSession) {
  localStorage.setItem(ACCOUNT_SESSION_KEY, JSON.stringify(session));
  return session;
}

export function clearAccountSession() {
  localStorage.removeItem(ACCOUNT_SESSION_KEY);
}

export function consumeAccountCallback() {
  if (typeof window === "undefined" || !window.location.hash) return null;
  const values = new URLSearchParams(window.location.hash.slice(1));
  const accessToken = values.get("access_token");
  if (!accessToken) return null;
  const refreshToken = values.get("refresh_token") || "";
  const expiresIn = Number(values.get("expires_in")) || 3600;
  history.replaceState({}, "", `${window.location.pathname}${window.location.search}`);
  return { accessToken, refreshToken, expiresAt: Date.now() + expiresIn * 1000 };
}

async function accountConfig() {
  const response = await fetch("/api/account/config", { cache: "no-store" });
  return response.json() as Promise<{ configured: boolean; url?: string; publishableKey?: string }>;
}

function accountRedirectUrl() {
  return isNativePnp() ? "deeds://open" : `${window.location.origin}/`;
}

async function fetchUser(accessToken: string, url: string, publishableKey: string) {
  const response = await fetch(`${url}/auth/v1/user`, {
    headers: { apikey: publishableKey, Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (!response.ok) throw new Error("Your D.E.E.D.S. session has expired.");
  return accountUser(await response.json() as SupabaseUser);
}

async function refreshSession(session: DeedsAccountSession, url: string, publishableKey: string) {
  if (!session.refreshToken) throw new Error("Please sign in again.");
  const response = await fetch(`${url}/auth/v1/token?grant_type=refresh_token`, {
    method: "POST",
    headers: { apikey: publishableKey, "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: session.refreshToken }),
  });
  if (!response.ok) throw new Error("Please sign in again.");
  const body = await response.json() as { access_token: string; refresh_token: string; expires_in: number; user: SupabaseUser };
  return saveAccountSession({
    accessToken: body.access_token,
    refreshToken: body.refresh_token,
    expiresAt: Date.now() + body.expires_in * 1000,
    user: accountUser(body.user),
  });
}

export async function restoreAccountSession(): Promise<{ configured: boolean; session: DeedsAccountSession | null }> {
  const config = await accountConfig();
  if (!config.configured || !config.url || !config.publishableKey) return { configured: false, session: null };
  const callback = consumeAccountCallback();
  let session = readAccountSession();
  if (callback) {
    const user = await fetchUser(callback.accessToken, config.url, config.publishableKey);
    session = saveAccountSession({ ...callback, user });
  }
  if (!session) return { configured: true, session: null };
  try {
    if (session.expiresAt < Date.now() + 60_000) session = await refreshSession(session, config.url, config.publishableKey);
    else {
      const user = await fetchUser(session.accessToken, config.url, config.publishableKey);
      session = saveAccountSession({ ...session, user });
    }
    return { configured: true, session };
  } catch {
    clearAccountSession();
    return { configured: true, session: null };
  }
}

export async function accountAuthorizationUrl(provider: "apple" | "google") {
  const config = await accountConfig();
  if (!config.configured || !config.url) throw new Error("D.E.E.D.S. accounts are not configured yet.");
  const redirectTo = accountRedirectUrl();
  return `${config.url}/auth/v1/authorize?provider=${provider}&redirect_to=${encodeURIComponent(redirectTo)}`;
}

export async function emailSignInCode(email: string) {
  const config = await accountConfig();
  if (!config.configured || !config.url || !config.publishableKey) throw new Error("D.E.E.D.S. accounts are not configured yet.");
  const response = await fetch(`${config.url}/auth/v1/otp`, {
    method: "POST",
    headers: { apikey: config.publishableKey, "Content-Type": "application/json" },
    body: JSON.stringify({ email, create_user: true, email_redirect_to: accountRedirectUrl() }),
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({})) as { msg?: string; error_description?: string };
    throw new Error(body.msg || body.error_description || "The sign-in email could not be sent.");
  }
}

export async function verifyEmailSignInCode(email: string, token: string) {
  const config = await accountConfig();
  if (!config.configured || !config.url || !config.publishableKey) throw new Error("D.E.E.D.S. accounts are not configured yet.");
  const response = await fetch(`${config.url}/auth/v1/verify`, {
    method: "POST",
    headers: { apikey: config.publishableKey, "Content-Type": "application/json" },
    body: JSON.stringify({ email, token, type: "email" }),
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({})) as { msg?: string; error_description?: string };
    throw new Error(body.msg || body.error_description || "That sign-in code was not accepted.");
  }
  const body = await response.json() as { access_token: string; refresh_token: string; expires_in: number; user: SupabaseUser };
  return saveAccountSession({
    accessToken: body.access_token,
    refreshToken: body.refresh_token,
    expiresAt: Date.now() + body.expires_in * 1000,
    user: accountUser(body.user),
  });
}

export async function accountFetch(path: string, session: DeedsAccountSession, init?: RequestInit) {
  return fetch(path, {
    ...init,
    headers: {
      ...(init?.headers || {}),
      Authorization: `Bearer ${session.accessToken}`,
    },
  });
}
