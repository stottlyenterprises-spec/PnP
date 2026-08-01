import { cookies } from "next/headers";
import { NextRequest,NextResponse } from "next/server";
import { activeOutlookSlot,outlookAccessToken,outlookCookie,outlookScopes,readOutlookAccounts } from "../token";

type RouteContext={params:Promise<{action:string[]}>};
type GraphEvent={id:string;subject?:string;start?:{dateTime?:string};end?:{dateTime?:string};webLink?:string};
type GraphMessage={id:string;subject?:string;from?:{emailAddress?:{name?:string;address?:string}};receivedDateTime?:string;isRead?:boolean};
const appUrl=(req:NextRequest)=>(process.env.APP_URL||req.nextUrl.origin).replace(/\/$/,"");
const utc=(value?:string)=>value&&!/(?:Z|[+-]\d{2}:\d{2})$/i.test(value)?`${value}Z`:value||"";
const graphHeaders=(token:string)=>({Authorization:`Bearer ${token}`,Prefer:'outlook.timezone="UTC"'});
const cleanHtml=(value:string)=>value.replace(/<style[\s\S]*?<\/style>/gi,"").replace(/<script[\s\S]*?<\/script>/gi,"").replace(/<[^>]+>/g," ").replace(/&nbsp;/g," ").replace(/&amp;/g,"&").replace(/\s+/g," ").trim();
const events=(value:GraphEvent[])=>value.map(event=>({id:event.id,summary:event.subject||"(Untitled event)",start:utc(event.start?.dateTime),end:utc(event.end?.dateTime),htmlLink:event.webLink||""}));
const messages=(value:GraphMessage[])=>value.map(message=>({id:message.id,subject:message.subject||"(No subject)",from:message.from?.emailAddress?.name||message.from?.emailAddress?.address||"",date:message.receivedDateTime||"",isRead:Boolean(message.isRead)}));

async function connect(req:NextRequest){
 const id=process.env.OUTLOOK_CLIENT_ID,app=process.env.APP_URL;
 if(!id||!app)return NextResponse.redirect(new URL("/?outlook=configure",app||req.nextUrl.origin));
 const accounts=await readOutlookAccounts(),jar=await cookies(),legacyConnected=Boolean(jar.get(outlookCookie("access",0))?.value||jar.get(outlookCookie("refresh",0))?.value),requested=Number(req.nextUrl.searchParams.get("slot")),slot=Number.isInteger(requested)&&requested>=0&&requested<=4?requested:([0,1,2,3,4].find(value=>!accounts.some(account=>account.slot===value)&&!(value===0&&legacyConnected))??0),state=crypto.randomUUID();
 jar.set("outlook_state",state,{httpOnly:true,secure:true,sameSite:"lax",maxAge:600,path:"/"});
 jar.set("outlook_connect_slot",String(slot),{httpOnly:true,secure:true,sameSite:"lax",maxAge:600,path:"/"});
 if(req.nextUrl.searchParams.get("native")==="1")jar.set("outlook_native_return","1",{httpOnly:true,secure:true,sameSite:"lax",maxAge:600,path:"/"});
 const url=new URL("https://login.microsoftonline.com/common/oauth2/v2.0/authorize");
 url.search=new URLSearchParams({client_id:id,response_type:"code",redirect_uri:`${app}/api/outlook/callback`,response_mode:"query",scope:outlookScopes,state,prompt:"select_account"}).toString();
 return NextResponse.redirect(url);
}

async function callback(req:NextRequest){
 const app=appUrl(req),jar=await cookies(),code=req.nextUrl.searchParams.get("code"),state=req.nextUrl.searchParams.get("state");
 if(!code||!state||state!==jar.get("outlook_state")?.value)return NextResponse.redirect(new URL("/?outlook=denied",app));
 const slot=Math.max(0,Math.min(4,Number(jar.get("outlook_connect_slot")?.value)||0)),redirect=`${app}/api/outlook/callback`;
 const token=await fetch("https://login.microsoftonline.com/common/oauth2/v2.0/token",{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:new URLSearchParams({code,client_id:process.env.OUTLOOK_CLIENT_ID||"",client_secret:process.env.OUTLOOK_CLIENT_SECRET||"",redirect_uri:redirect,grant_type:"authorization_code",scope:outlookScopes})});
 if(!token.ok)return NextResponse.redirect(new URL("/?outlook=error",app));
 const body=await token.json(),profileResponse=await fetch("https://graph.microsoft.com/v1.0/me?$select=displayName,mail,userPrincipalName",{headers:{Authorization:`Bearer ${body.access_token}`},cache:"no-store"}),profile=profileResponse.ok?await profileResponse.json():{},storedAccounts=await readOutlookAccounts(),email=String(profile.mail||profile.userPrincipalName||`Outlook account ${slot+1}`),name=String(profile.displayName||"").trim()||undefined,nextAccounts=[...storedAccounts.filter(account=>account.slot!==slot),{slot,email,name}].sort((a,b)=>a.slot-b.slot),nativeReturn=jar.get("outlook_native_return")?.value==="1",res=NextResponse.redirect(nativeReturn?"deeds://open?view=data&outlook=connected":new URL("/?outlook=connected",app));
 res.cookies.set(outlookCookie("access",slot),body.access_token,{httpOnly:true,secure:true,sameSite:"lax",maxAge:body.expires_in||3600,path:"/"});
 if(body.refresh_token)res.cookies.set(outlookCookie("refresh",slot),body.refresh_token,{httpOnly:true,secure:true,sameSite:"lax",maxAge:31536000,path:"/"});
 res.cookies.set("outlook_active",String(slot),{httpOnly:true,secure:true,sameSite:"lax",maxAge:31536000,path:"/"});
 res.cookies.set("outlook_accounts",encodeURIComponent(JSON.stringify(nextAccounts)),{httpOnly:true,secure:true,sameSite:"lax",maxAge:31536000,path:"/"});
 res.cookies.delete("outlook_state");res.cookies.delete("outlook_connect_slot");res.cookies.delete("outlook_native_return");
 return res;
}

async function status(){
 const jar=await cookies(),activeSlot=await activeOutlookSlot(),accounts=await readOutlookAccounts();
 return NextResponse.json({configured:Boolean(process.env.OUTLOOK_CLIENT_ID&&process.env.OUTLOOK_CLIENT_SECRET&&process.env.APP_URL),connected:Boolean(jar.get(outlookCookie("access",activeSlot))?.value||jar.get(outlookCookie("refresh",activeSlot))?.value),accounts,activeSlot});
}

async function disconnect(req:NextRequest){
 const requested=Number(req.nextUrl.searchParams.get("slot")),active=await activeOutlookSlot(),slot=Number.isInteger(requested)&&requested>=0&&requested<=4?requested:active,accounts=await readOutlookAccounts(),remaining=accounts.filter(account=>account.slot!==slot),nextActive=remaining[0]?.slot??0,res=NextResponse.redirect(req.nextUrl.searchParams.get("native")==="1"?"deeds://open?view=data&outlook=disconnected":new URL("/?outlook=disconnected",req.nextUrl.origin));
 res.cookies.delete(outlookCookie("access",slot));res.cookies.delete(outlookCookie("refresh",slot));res.cookies.set("outlook_active",String(nextActive),{httpOnly:true,secure:true,sameSite:"lax",maxAge:31536000,path:"/"});res.cookies.set("outlook_accounts",encodeURIComponent(JSON.stringify(remaining)),{httpOnly:true,secure:true,sameSite:"lax",maxAge:31536000,path:"/"});res.cookies.delete("outlook_state");
 return res;
}

async function summary(req:NextRequest){
 const token=await outlookAccessToken();if(!token)return NextResponse.json({error:"Connect Outlook first."},{status:401});
 const date=req.nextUrl.searchParams.get("date")||new Date().toISOString().slice(0,10),offset=Number(req.nextUrl.searchParams.get("offset")||0),localStart=new Date(`${date}T00:00:00`),start=new Date(localStart.getTime()+offset*60000),end=new Date(start);end.setUTCDate(end.getUTCDate()+1);
 const calendar=new URL("https://graph.microsoft.com/v1.0/me/calendarView");calendar.search=new URLSearchParams({startDateTime:start.toISOString(),endDateTime:end.toISOString(),"$top":"20","$orderby":"start/dateTime","$select":"id,subject,start,end,webLink"}).toString();
 const mail=new URL("https://graph.microsoft.com/v1.0/me/mailFolders/inbox/messages");mail.search=new URLSearchParams({"$top":"20","$orderby":"receivedDateTime desc","$select":"id,subject,from,receivedDateTime,isRead,webLink"}).toString();
 const [calRes,mailRes]=await Promise.all([fetch(calendar,{headers:graphHeaders(token),cache:"no-store"}),fetch(mail,{headers:graphHeaders(token),cache:"no-store"})]);
 if(!calRes.ok||!mailRes.ok)return NextResponse.json({error:"Outlook permissions need attention."},{status:502});
 const cal=await calRes.json(),mailData=await mailRes.json(),mappedMessages=messages(mailData.value||[]);
 return NextResponse.json({events:events(cal.value||[]),messages:mappedMessages,unread:mappedMessages.filter(message=>!message.isRead).length});
}

async function calendar(req:NextRequest){
 const token=await outlookAccessToken();if(!token)return NextResponse.json({error:"Connect Outlook first."},{status:401});
 const start=req.nextUrl.searchParams.get("start"),end=req.nextUrl.searchParams.get("end");
 if(!start||!end)return NextResponse.json({error:"A date range is required."},{status:400});
 const url=new URL("https://graph.microsoft.com/v1.0/me/calendarView");url.search=new URLSearchParams({startDateTime:new Date(`${start}T00:00:00`).toISOString(),endDateTime:new Date(`${end}T23:59:59`).toISOString(),"$top":"100","$orderby":"start/dateTime","$select":"id,subject,start,end,webLink"}).toString();
 const res=await fetch(url,{headers:graphHeaders(token),cache:"no-store"});
 if(!res.ok)return NextResponse.json({error:"Outlook Calendar needs to be reconnected."},{status:502});
 const body=await res.json();
 return NextResponse.json({events:events(body.value||[])});
}

async function openMail(id:string){
 const token=await outlookAccessToken();if(!token)return NextResponse.json({error:"Connect Outlook first."},{status:401});
 const url=`https://graph.microsoft.com/v1.0/me/messages/${encodeURIComponent(id)}?$select=id,subject,from,toRecipients,receivedDateTime,body`;
 const res=await fetch(url,{headers:{Authorization:`Bearer ${token}`,"Prefer":'outlook.body-content-type="html"'},cache:"no-store"});
 if(!res.ok)return NextResponse.json({error:"That Outlook message could not be opened."},{status:502});
 const message=await res.json(),from=message.from?.emailAddress,to=(message.toRecipients||[]).map((recipient:{emailAddress?:{name?:string;address?:string}})=>recipient.emailAddress?.name||recipient.emailAddress?.address||"").filter(Boolean).join(", "),body=message.body?.contentType==="html"?cleanHtml(message.body?.content||""):message.body?.content||"";
 return NextResponse.json({id,subject:message.subject||"(No subject)",from:from?.name||from?.address||"",to,date:message.receivedDateTime||"",body});
}

async function selectAccount(req:NextRequest){
 const {slot}=await req.json(),nextSlot=Number(slot),accounts=await readOutlookAccounts();
 if(!Number.isInteger(nextSlot)||!accounts.some(account=>account.slot===nextSlot))return NextResponse.json({error:"Outlook account not found."},{status:404});
 const jar=await cookies();
 if(!jar.get(outlookCookie("access",nextSlot))?.value&&!jar.get(outlookCookie("refresh",nextSlot))?.value)return NextResponse.json({error:"Reconnect that Outlook account."},{status:401});
 jar.set("outlook_active",String(nextSlot),{httpOnly:true,secure:true,sameSite:"lax",maxAge:31536000,path:"/"});
 return NextResponse.json({activeSlot:nextSlot});
}

async function sendMail(req:NextRequest){
 const token=await outlookAccessToken();if(!token)return NextResponse.json({error:"Connect Outlook first."},{status:401});
 const {to,subject,body}=await req.json();
 if(!String(to||"").includes("@")||!String(subject||"").trim()||!String(body||"").trim())return NextResponse.json({error:"Recipient, subject, and message are required."},{status:400});
 const res=await fetch("https://graph.microsoft.com/v1.0/me/sendMail",{method:"POST",headers:{Authorization:`Bearer ${token}`,"Content-Type":"application/json"},body:JSON.stringify({message:{subject:String(subject),body:{contentType:"Text",content:String(body)},toRecipients:[{emailAddress:{address:String(to).trim()}}]},saveToSentItems:true})});
 if(!res.ok)return NextResponse.json({error:"Outlook rejected the send request. Reconnect Outlook to approve Mail access."},{status:502});
 return NextResponse.json({sent:true});
}

export async function GET(req:NextRequest,{params}:RouteContext){
 const action=(await params).action;
 if(action[0]==="connect")return connect(req);
 if(action[0]==="callback")return callback(req);
 if(action[0]==="status")return status();
 if(action[0]==="disconnect")return disconnect(req);
 if(action[0]==="summary")return summary(req);
 if(action[0]==="calendar")return calendar(req);
 if(action[0]==="mail"&&action[1])return openMail(action[1]);
 return NextResponse.json({error:"Outlook route not found."},{status:404});
}

export async function POST(req:NextRequest,{params}:RouteContext){
 const action=(await params).action;
 if(action[0]==="accounts")return selectAccount(req);
 if(action[0]==="mail"&&action[1]==="send")return sendMail(req);
 return NextResponse.json({error:"Outlook route not found."},{status:404});
}
