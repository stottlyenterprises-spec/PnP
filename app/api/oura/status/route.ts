import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(){
 const jar=await cookies();
 return NextResponse.json({
  configured:Boolean(process.env.OURA_CLIENT_ID&&process.env.OURA_CLIENT_SECRET&&process.env.APP_URL),
  connected:Boolean(jar.get("oura_access")?.value)
 });
}
