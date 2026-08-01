import { NextRequest, NextResponse } from "next/server";

const nativeOrigins = new Set([
  "capacitor://localhost",
  "http://localhost",
  "https://localhost",
]);

function applyNativeCors(request: NextRequest, response: NextResponse) {
  const origin = request.headers.get("origin") || "";
  if (!nativeOrigins.has(origin)) return response;
  response.headers.set("Access-Control-Allow-Origin", origin);
  response.headers.set("Access-Control-Allow-Credentials", "true");
  response.headers.set("Access-Control-Allow-Headers", "Authorization, Content-Type");
  response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
  response.headers.set("Vary", "Origin");
  return response;
}

export function proxy(request: NextRequest) {
  if (request.method === "OPTIONS") {
    return applyNativeCors(request, new NextResponse(null, { status: 204 }));
  }
  return applyNativeCors(request, NextResponse.next());
}

export const config = { matcher: "/api/:path*" };
