import { NextResponse } from "next/server";
import { googleAccessToken } from "../token";

export async function GET(req:Request){
 const token=await googleAccessToken();
 if(!token)return NextResponse.json({error:"Connect Google first."},{status:401});
 const input=new URL(req.url),start=input.searchParams.get("start"),end=input.searchParams.get("end");
 if(!start||!end)return NextResponse.json({error:"A date range is required."},{status:400});
 const url=new URL("https://www.googleapis.com/calendar/v3/calendars/primary/events");
 url.search=new URLSearchParams({timeMin:new Date(`${start}T00:00:00`).toISOString(),timeMax:new Date(`${end}T23:59:59`).toISOString(),singleEvents:"true",orderBy:"startTime",maxResults:"100"}).toString();
 const res=await fetch(url,{headers:{Authorization:`Bearer ${token}`},cache:"no-store"});
 if(!res.ok)return NextResponse.json({error:"Google Calendar needs to be reconnected."},{status:502});
 const body=await res.json();
 return NextResponse.json({events:(body.items||[]).map((e:{id:string;summary?:string;start:{dateTime?:string;date?:string};end?:{dateTime?:string;date?:string};htmlLink:string})=>({id:e.id,summary:e.summary||"(Untitled event)",start:e.start.dateTime||e.start.date||"",end:e.end?.dateTime||e.end?.date||"",htmlLink:e.htmlLink}))});
}
