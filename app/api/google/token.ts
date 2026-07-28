import { cookies } from "next/headers";

export type GoogleAccount={slot:number;email:string;name?:string;picture?:string};
export const accountCookie=(kind:"access"|"refresh",slot:number)=>slot===0?`google_${kind}`:`google_${kind}_${slot}`;
export const activeGoogleSlot=async()=>Math.max(0,Math.min(4,Number((await cookies()).get("google_active")?.value)||0));
export const readGoogleAccounts=async():Promise<GoogleAccount[]>=>{
 const raw=(await cookies()).get("google_accounts")?.value;
 if(!raw)return[];
 try{return JSON.parse(decodeURIComponent(raw)) as GoogleAccount[]}catch{return[]}
};

export async function googleAccessToken(slotOverride?:number){
 const jar=await cookies(),slot=slotOverride??await activeGoogleSlot(),current=jar.get(accountCookie("access",slot))?.value;
 if(current)return current;
 const refresh=jar.get(accountCookie("refresh",slot))?.value;
 if(!refresh)return null;
 const res=await fetch("https://oauth2.googleapis.com/token",{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:new URLSearchParams({client_id:process.env.GOOGLE_CLIENT_ID||"",client_secret:process.env.GOOGLE_CLIENT_SECRET||"",refresh_token:refresh,grant_type:"refresh_token"})});
 if(!res.ok)return null;
 const body=await res.json();
 jar.set(accountCookie("access",slot),body.access_token,{httpOnly:true,secure:true,sameSite:"lax",maxAge:body.expires_in||3600,path:"/"});
 return body.access_token as string;
}
