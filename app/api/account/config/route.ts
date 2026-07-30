import { NextResponse } from "next/server";

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const providers = { apple: false, google: false, email: false };
  if (url && publishableKey) {
    try {
      const response = await fetch(`${url}/auth/v1/settings`, {
        headers: { apikey: publishableKey },
        cache: "no-store",
      });
      if (response.ok) {
        const settings = await response.json() as { external?: Partial<typeof providers> };
        providers.apple = Boolean(settings.external?.apple);
        providers.google = Boolean(settings.external?.google);
        providers.email = Boolean(settings.external?.email);
      }
    } catch {
      // Account sign-in remains unavailable until provider status can be verified.
    }
  }
  return NextResponse.json({
    configured: Boolean(url && publishableKey),
    url: url || undefined,
    publishableKey: publishableKey || undefined,
    providers,
  });
}
