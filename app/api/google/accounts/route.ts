import { cookies } from "next/headers";
import { NextRequest,NextResponse } from "next/server";
import { accountCookie,readGoogleAccounts } from "../token";

export async function POST(req:NextRequest){
 const {slot}=await req.json(),nextSlot=Number(slot),accounts=await readGoogleAccounts();
 if(!Number.isInteger(nextSlot)||!accounts.some(account=>account.slot===nextSlot))return NextResponse.json({error:"Google account not found."},{status:404});
 const jar=await cookies();
 if(!jar.get(accountCookie("access",nextSlot))?.value&&!jar.get(accountCookie("refresh",nextSlot))?.value)return NextResponse.json({error:"Reconnect that Google account."},{status:401});
 jar.set("google_active",String(nextSlot),{httpOnly:true,secure:true,sameSite:"lax",maxAge:31536000,path:"/"});
 return NextResponse.json({activeSlot:nextSlot});
}
