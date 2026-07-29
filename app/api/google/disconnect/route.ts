import { NextRequest,NextResponse } from "next/server";
import { accountCookie,activeGoogleSlot,readGoogleAccounts } from "../token";
export async function GET(req:NextRequest){
 const disconnectAll=req.nextUrl.searchParams.get("all")==="1",requested=Number(req.nextUrl.searchParams.get("slot")),active=await activeGoogleSlot(),slot=Number.isInteger(requested)&&requested>=0&&requested<=4?requested:active,accounts=await readGoogleAccounts(),remaining=disconnectAll?[]:accounts.filter(account=>account.slot!==slot),nextActive=remaining[0]?.slot??0,res=NextResponse.redirect(new URL(disconnectAll?"/?account=choose":"/?google=disconnected",req.nextUrl.origin));
 if(disconnectAll){for(let index=0;index<=4;index+=1){res.cookies.delete(accountCookie("access",index));res.cookies.delete(accountCookie("refresh",index))}}else{res.cookies.delete(accountCookie("access",slot));res.cookies.delete(accountCookie("refresh",slot))}
 res.cookies.set("google_active",String(nextActive),{httpOnly:true,secure:true,sameSite:"lax",maxAge:31536000,path:"/"});res.cookies.set("google_accounts",encodeURIComponent(JSON.stringify(remaining)),{httpOnly:true,secure:true,sameSite:"lax",maxAge:31536000,path:"/"});res.cookies.delete("google_state");return res;
}
