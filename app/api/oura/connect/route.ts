import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest){
 const clientId=process.env.OURA_CLIENT_ID,appUrl=process.env.APP_URL;
 if(!clientId||!appUrl)return NextResponse.redirect(new URL("/?oura=configure",appUrl||"https://p-n-p.vercel.app"));
 const state=crypto.randomUUID(),jar=await cookies();
 jar.set("oura_state",state,{httpOnly:true,secure:true,sameSite:"lax",maxAge:600,path:"/"});
 if(req.nextUrl.searchParams.get("native")==="1")jar.set("oura_native_return","1",{httpOnly:true,secure:true,sameSite:"lax",maxAge:600,path:"/"});
 const redirect=`${appUrl.replace(/\/$/,"")}/api/oura/callback`;
 const url=new URL("https://cloud.ouraring.com/oauth/authorize");
 url.search=new URLSearchParams({response_type:"code",client_id:clientId,redirect_uri:redirect,scope:"daily",state}).toString();
 return NextResponse.redirect(url);
}
