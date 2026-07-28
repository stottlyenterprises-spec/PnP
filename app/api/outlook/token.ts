import { cookies } from "next/headers";

export type OutlookAccount={slot:number;email:string;name?:string};
export const outlookCookie=(kind:"access"|"refresh",slot:number)=>slot===0?`outlook_${kind}`:`outlook_${kind}_${slot}`;
export const activeOutlookSlot=async()=>Math.max(0,Math.min(4,Number((await cookies()).get("outlook_active")?.value)||0));
export const readOutlookAccounts=async():Promise<OutlookAccount[]>=>{
 const raw=(await cookies()).get("outlook_accounts")?.value;
 if(!raw)return[];
 try{return JSON.parse(decodeURIComponent(raw)) as OutlookAccount[]}catch{return[]}
};
export const outlookScopes="openid profile email offline_access User.Read Mail.Read Mail.Send Calendars.Read";

export async function outlookAccessToken(slotOverride?:number){
 const jar=await cookies(),slot=slotOverride??await activeOutlookSlot(),current=jar.get(outlookCookie("access",slot))?.value;
 if(current)return current;
 const refresh=jar.get(outlookCookie("refresh",slot))?.value;
 if(!refresh)return null;
 const res=await fetch("https://login.microsoftonline.com/common/oauth2/v2.0/token",{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:new URLSearchParams({client_id:process.env.OUTLOOK_CLIENT_ID||"",client_secret:process.env.OUTLOOK_CLIENT_SECRET||"",refresh_token:refresh,grant_type:"refresh_token",scope:outlookScopes})});
 if(!res.ok)return null;
 const body=await res.json();
 jar.set(outlookCookie("access",slot),body.access_token,{httpOnly:true,secure:true,sameSite:"lax",maxAge:body.expires_in||3600,path:"/"});
 if(body.refresh_token)jar.set(outlookCookie("refresh",slot),body.refresh_token,{httpOnly:true,secure:true,sameSite:"lax",maxAge:31536000,path:"/"});
 return body.access_token as string;
}
