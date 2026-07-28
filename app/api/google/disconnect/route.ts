import { NextRequest,NextResponse } from "next/server";
import { accountCookie,activeGoogleSlot,readGoogleAccounts } from "../token";
export async function GET(req:NextRequest){
 const requested=Number(req.nextUrl.searchParams.get("slot")),active=await activeGoogleSlot(),slot=Number.isInteger(requested)&&requested>=0&&requested<=4?requested:active,accounts=await readGoogleAccounts(),remaining=accounts.filter(account=>account.slot!==slot),nextActive=remaining[0]?.slot??0,res=NextResponse.redirect(new URL("/?google=disconnected",req.nextUrl.origin));
 res.cookies.delete(accountCookie("access",slot));res.cookies.delete(accountCookie("refresh",slot));res.cookies.set("google_active",String(nextActive),{httpOnly:true,secure:true,sameSite:"lax",maxAge:31536000,path:"/"});res.cookies.set("google_accounts",encodeURIComponent(JSON.stringify(remaining)),{httpOnly:true,secure:true,sameSite:"lax",maxAge:31536000,path:"/"});res.cookies.delete("google_state");return res;
}
