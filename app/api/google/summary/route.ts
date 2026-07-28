import { NextResponse } from "next/server";
import { googleAccessToken } from "../token";
export async function GET(req:Request){
 const token=await googleAccessToken();if(!token)return NextResponse.json({error:"Connect Google first."},{status:401});
 const headers={Authorization:`Bearer ${token}`},urlIn=new URL(req.url),date=urlIn.searchParams.get("date")||new Date().toISOString().slice(0,10),offset=Number(urlIn.searchParams.get("offset")||0),localStart=new Date(`${date}T00:00:00`),start=new Date(localStart.getTime()+offset*60000),end=new Date(start);end.setUTCDate(end.getUTCDate()+1);
 const calendar=new URL("https://www.googleapis.com/calendar/v3/calendars/primary/events");calendar.search=new URLSearchParams({timeMin:start.toISOString(),timeMax:end.toISOString(),singleEvents:"true",orderBy:"startTime",maxResults:"12"}).toString();
 const mail=new URL("https://gmail.googleapis.com/gmail/v1/users/me/messages");mail.search=new URLSearchParams({q:"in:inbox newer_than:14d",maxResults:"12"}).toString();
 const [calRes,mailRes]=await Promise.all([fetch(calendar,{headers,cache:"no-store"}),fetch(mail,{headers,cache:"no-store"})]);
 if(!calRes.ok||!mailRes.ok)return NextResponse.json({error:"Google permissions or APIs need attention."},{status:502});
 const cal=await calRes.json(),mailData=await mailRes.json(),ids=(mailData.messages||[]).slice(0,12);
 const messages=await Promise.all(ids.map(async(x:{id:string})=>{const r=await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${x.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date`,{headers,cache:"no-store"}),m=await r.json(),hs=m.payload?.headers||[];const get=(n:string)=>hs.find((h:{name:string})=>h.name===n)?.value||"";return{id:x.id,subject:get("Subject")||"(No subject)",from:get("From"),date:get("Date")}}));
 return NextResponse.json({events:(cal.items||[]).map((e:{id:string;summary?:string;start:{dateTime?:string;date?:string};htmlLink:string})=>({id:e.id,summary:e.summary||"(Untitled event)",start:e.start.dateTime||e.start.date||"",htmlLink:e.htmlLink})),messages,unread:mailData.resultSizeEstimate||messages.length});
}
