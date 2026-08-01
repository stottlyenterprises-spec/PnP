import { NextRequest,NextResponse } from "next/server";
export async function GET(req:NextRequest){
 const res=NextResponse.redirect(req.nextUrl.searchParams.get("native")==="1"?"deeds://open?view=data&oura=disconnected":new URL("/?oura=disconnected",req.nextUrl.origin));
 res.cookies.delete("oura_access");res.cookies.delete("oura_refresh");res.cookies.delete("oura_state");
 return res;
}
