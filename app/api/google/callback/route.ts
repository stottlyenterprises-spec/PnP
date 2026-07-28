import { cookies } from "next/headers";
import { NextRequest,NextResponse } from "next/server";
import { accountCookie,readGoogleAccounts } from "../token";
export async function GET(req:NextRequest){
 const app=process.env.APP_URL||req.nextUrl.origin,jar=await cookies(),code=req.nextUrl.searchParams.get("code"),state=req.nextUrl.searchParams.get("state");
 if(!code||!state||state!==jar.get("google_state")?.value)return NextResponse.redirect(new URL("/?google=denied",app));
 const slot=Math.max(0,Math.min(4,Number(jar.get("google_connect_slot")?.value)||0));
 const redirect=`${app.replace(/\/$/,"")}/api/google/callback`;
 const token=await fetch("https://oauth2.googleapis.com/token",{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:new URLSearchParams({code,client_id:process.env.GOOGLE_CLIENT_ID||"",client_secret:process.env.GOOGLE_CLIENT_SECRET||"",redirect_uri:redirect,grant_type:"authorization_code"})});
 if(!token.ok)return NextResponse.redirect(new URL("/?google=error",app));
 const body=await token.json(),profileResponse=await fetch("https://www.googleapis.com/oauth2/v2/userinfo",{headers:{Authorization:`Bearer ${body.access_token}`},cache:"no-store"}),profile=profileResponse.ok?await profileResponse.json():{},storedAccounts=await readGoogleAccounts(),accounts=storedAccounts.length?storedAccounts:slot>0&&(jar.get("google_access")?.value||jar.get("google_refresh")?.value)?[{slot:0,email:"Connected Google account"}]:[],email=String(profile.email||`Google account ${slot+1}`),name=String(profile.name||"").trim()||undefined,picture=String(profile.picture||"").trim()||undefined,nextAccounts=[...accounts.filter(account=>account.slot!==slot),{slot,email,name,picture}].sort((a,b)=>a.slot-b.slot),res=NextResponse.redirect(new URL("/?google=connected",app));
 res.cookies.set(accountCookie("access",slot),body.access_token,{httpOnly:true,secure:true,sameSite:"lax",maxAge:body.expires_in||3600,path:"/"});
 if(body.refresh_token)res.cookies.set(accountCookie("refresh",slot),body.refresh_token,{httpOnly:true,secure:true,sameSite:"lax",maxAge:31536000,path:"/"});
 res.cookies.set("google_active",String(slot),{httpOnly:true,secure:true,sameSite:"lax",maxAge:31536000,path:"/"});
 res.cookies.set("google_accounts",encodeURIComponent(JSON.stringify(nextAccounts)),{httpOnly:true,secure:true,sameSite:"lax",maxAge:31536000,path:"/"});
 res.cookies.delete("google_state");res.cookies.delete("google_connect_slot");return res;
}
