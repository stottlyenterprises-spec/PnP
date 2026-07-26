import { NextResponse } from "next/server";
import { googleAccessToken } from "../../token";

type Part={mimeType?:string;body?:{data?:string};parts?:Part[]};
const decode=(value="")=>Buffer.from(value.replace(/-/g,"+").replace(/_/g,"/"),"base64").toString("utf8");
function content(part:Part):string{
 if(part.mimeType==="text/plain"&&part.body?.data)return decode(part.body.data);
 for(const child of part.parts||[]){const text=content(child);if(text)return text}
 if(part.mimeType==="text/html"&&part.body?.data)return decode(part.body.data).replace(/<style[\s\S]*?<\/style>/gi,"").replace(/<[^>]+>/g," ").replace(/\s+/g," ").trim();
 return "";
}
export async function GET(_:Request,{params}:{params:Promise<{id:string}>}){
 const token=await googleAccessToken(),{id}=await params;
 if(!token)return NextResponse.json({error:"Connect Google first."},{status:401});
 const res=await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${encodeURIComponent(id)}?format=full`,{headers:{Authorization:`Bearer ${token}`},cache:"no-store"});
 if(!res.ok)return NextResponse.json({error:"That message could not be opened."},{status:502});
 const message=await res.json(),headers=message.payload?.headers||[],get=(name:string)=>headers.find((h:{name:string})=>h.name.toLowerCase()===name.toLowerCase())?.value||"";
 return NextResponse.json({id,subject:get("Subject")||"(No subject)",from:get("From"),to:get("To"),date:get("Date"),body:content(message.payload)||message.snippet||""});
}
