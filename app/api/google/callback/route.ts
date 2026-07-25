import { cookies } from "next/headers";
import { NextRequest,NextResponse } from "next/server";
export async function GET(req:NextRequest){
 const app=process.env.APP_URL||req.nextUrl.origin,jar=await cookies(),code=req.nextUrl.searchParams.get("code"),state=req.nextUrl.searchParams.get("state");
 if(!code||!state||state!==jar.get("google_state")?.value)return NextResponse.redirect(new URL("/?google=denied",app));
 const redirect=`${app.replace(/\/$/,"")}/api/google/callback`;
 const token=await fetch("https://oauth2.googleapis.com/token",{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:new URLSearchParams({code,client_id:process.env.GOOGLE_CLIENT_ID||"",client_secret:process.env.GOOGLE_CLIENT_SECRET||"",redirect_uri:redirect,grant_type:"authorization_code"})});
 if(!token.ok)return NextResponse.redirect(new URL("/?google=error",app));
 const body=await token.json(),res=NextResponse.redirect(new URL("/?google=connected",app));
 res.cookies.set("google_access",body.access_token,{httpOnly:true,secure:true,sameSite:"lax",maxAge:body.expires_in||3600,path:"/"});
 if(body.refresh_token)res.cookies.set("google_refresh",body.refresh_token,{httpOnly:true,secure:true,sameSite:"lax",maxAge:31536000,path:"/"});
 res.cookies.delete("google_state");return res;
}
