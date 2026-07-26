import { NextResponse } from "next/server";
import { googleAccessToken } from "../../token";

export async function POST(req:Request){
 const token=await googleAccessToken();
 if(!token)return NextResponse.json({error:"Connect Google first."},{status:401});
 const {to,subject,body}=await req.json();
 if(!String(to||"").includes("@")||!String(subject||"").trim()||!String(body||"").trim())return NextResponse.json({error:"Recipient, subject, and message are required."},{status:400});
 const clean=(value:string)=>value.replace(/[\r\n]/g," ").trim(),raw=[`To: ${clean(String(to))}`,`Subject: ${clean(String(subject))}`,"MIME-Version: 1.0",'Content-Type: text/plain; charset="UTF-8"',"",String(body)].join("\r\n"),encoded=Buffer.from(raw).toString("base64url");
 const res=await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send",{method:"POST",headers:{Authorization:`Bearer ${token}`,"Content-Type":"application/json"},body:JSON.stringify({raw:encoded})});
 if(!res.ok)return NextResponse.json({error:"Google rejected the send request. Reconnect Google to approve Mail access."},{status:502});
 return NextResponse.json({sent:true});
}
