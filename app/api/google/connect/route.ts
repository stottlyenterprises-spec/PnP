import { cookies } from "next/headers";
import { NextRequest,NextResponse } from "next/server";
import { readGoogleAccounts } from "../token";
export async function GET(req:NextRequest){
 const id=process.env.GOOGLE_CLIENT_ID,app=process.env.APP_URL;
 if(!id||!app)return NextResponse.redirect(new URL("/?google=configure",app||"https://p-n-p.vercel.app"));
 const accounts=await readGoogleAccounts(),jar=await cookies(),legacyConnected=Boolean(jar.get("google_access")?.value||jar.get("google_refresh")?.value),requested=Number(req.nextUrl.searchParams.get("slot")),slot=Number.isInteger(requested)&&requested>=0&&requested<=4?requested:([0,1,2,3,4].find(value=>!accounts.some(account=>account.slot===value)&&!(value===0&&legacyConnected))??0);
 const state=crypto.randomUUID();jar.set("google_state",state,{httpOnly:true,secure:true,sameSite:"lax",maxAge:600,path:"/"});jar.set("google_connect_slot",String(slot),{httpOnly:true,secure:true,sameSite:"lax",maxAge:600,path:"/"});
 if(req.nextUrl.searchParams.get("native")==="1")jar.set("google_native_return","1",{httpOnly:true,secure:true,sameSite:"lax",maxAge:600,path:"/"});
 const url=new URL("https://accounts.google.com/o/oauth2/v2/auth");
 url.search=new URLSearchParams({client_id:id,redirect_uri:`${app.replace(/\/$/,"")}/api/google/callback`,response_type:"code",scope:"openid email https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/gmail.modify https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/drive.appdata",access_type:"offline",include_granted_scopes:"true",prompt:"consent select_account",state}).toString();
 return NextResponse.redirect(url);
}
