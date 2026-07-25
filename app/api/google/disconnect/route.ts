import { NextRequest,NextResponse } from "next/server";
export async function GET(req:NextRequest){
 const res=NextResponse.redirect(new URL("/?google=disconnected",req.nextUrl.origin));
 res.cookies.delete("google_access");res.cookies.delete("google_refresh");res.cookies.delete("google_state");return res;
}
