import { cookies } from "next/headers";
import { NextResponse } from "next/server";
export async function GET(){
 const id=process.env.GOOGLE_CLIENT_ID,app=process.env.APP_URL;
 if(!id||!app)return NextResponse.redirect(new URL("/?google=configure",app||"https://p-n-p.vercel.app"));
 const state=crypto.randomUUID(),jar=await cookies();jar.set("google_state",state,{httpOnly:true,secure:true,sameSite:"lax",maxAge:600,path:"/"});
 const url=new URL("https://accounts.google.com/o/oauth2/v2/auth");
 url.search=new URLSearchParams({client_id:id,redirect_uri:`${app.replace(/\/$/,"")}/api/google/callback`,response_type:"code",scope:"https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/gmail.modify https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/drive.appdata",access_type:"offline",include_granted_scopes:"true",prompt:"consent",state}).toString();
 return NextResponse.redirect(url);
}
