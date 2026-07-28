import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { accountCookie,activeGoogleSlot,readGoogleAccounts } from "../token";
export async function GET(){
 const jar=await cookies(),activeSlot=await activeGoogleSlot(),storedAccounts=await readGoogleAccounts(),legacyConnected=Boolean(jar.get("google_access")?.value||jar.get("google_refresh")?.value),accounts=storedAccounts.length?storedAccounts:legacyConnected?[{slot:0,email:"Connected Google account"}]:[];
 return NextResponse.json({configured:Boolean(process.env.GOOGLE_CLIENT_ID&&process.env.GOOGLE_CLIENT_SECRET&&process.env.APP_URL),connected:Boolean(jar.get(accountCookie("access",activeSlot))?.value||jar.get(accountCookie("refresh",activeSlot))?.value),accounts,activeSlot});
}
