import { cookies } from "next/headers";
import { NextRequest,NextResponse } from "next/server";

export async function GET(req:NextRequest){
 const appUrl=process.env.APP_URL||req.nextUrl.origin,code=req.nextUrl.searchParams.get("code"),state=req.nextUrl.searchParams.get("state"),jar=await cookies();
 if(!code||!state||state!==jar.get("oura_state")?.value)return NextResponse.redirect(new URL("/?oura=denied",appUrl));
 const redirect=`${appUrl.replace(/\/$/,"")}/api/oura/callback`;
 const token=await fetch("https://api.ouraring.com/oauth/token",{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:new URLSearchParams({grant_type:"authorization_code",code,redirect_uri:redirect,client_id:process.env.OURA_CLIENT_ID||"",client_secret:process.env.OURA_CLIENT_SECRET||""})});
 if(!token.ok)return NextResponse.redirect(new URL("/?oura=error",appUrl));
 const body=await token.json();
 const nativeReturn=jar.get("oura_native_return")?.value==="1",res=NextResponse.redirect(nativeReturn?"deeds://open?view=data&oura=connected":new URL("/?oura=connected",appUrl));
 res.cookies.set("oura_access",body.access_token,{httpOnly:true,secure:true,sameSite:"lax",maxAge:body.expires_in||2592000,path:"/"});
 if(body.refresh_token)res.cookies.set("oura_refresh",body.refresh_token,{httpOnly:true,secure:true,sameSite:"lax",maxAge:31536000,path:"/"});
 res.cookies.delete("oura_state");res.cookies.delete("oura_native_return");
 return res;
}
