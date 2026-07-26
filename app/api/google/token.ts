import { cookies } from "next/headers";

export async function googleAccessToken(){
 const jar=await cookies(),current=jar.get("google_access")?.value;
 if(current)return current;
 const refresh=jar.get("google_refresh")?.value;
 if(!refresh)return null;
 const res=await fetch("https://oauth2.googleapis.com/token",{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:new URLSearchParams({client_id:process.env.GOOGLE_CLIENT_ID||"",client_secret:process.env.GOOGLE_CLIENT_SECRET||"",refresh_token:refresh,grant_type:"refresh_token"})});
 if(!res.ok)return null;
 const body=await res.json();
 jar.set("google_access",body.access_token,{httpOnly:true,secure:true,sameSite:"lax",maxAge:body.expires_in||3600,path:"/"});
 return body.access_token as string;
}
