import { cookies } from "next/headers";
import { NextResponse } from "next/server";
export async function GET(){
 const jar=await cookies();
 return NextResponse.json({configured:Boolean(process.env.GOOGLE_CLIENT_ID&&process.env.GOOGLE_CLIENT_SECRET&&process.env.APP_URL),connected:Boolean(jar.get("google_access")?.value||jar.get("google_refresh")?.value)});
}
