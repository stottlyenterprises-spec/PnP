import { cookies } from "next/headers";
import { NextResponse } from "next/server";

type Doc={day:string;score?:number;total_sleep_duration?:number;stress_high?:number;recovery_high?:number;level?:string};
async function oura(path:string,token:string,start:string,end:string){
 const url=new URL(`https://api.ouraring.com/v2/usercollection/${path}`);
 url.search=new URLSearchParams({start_date:start,end_date:end}).toString();
 const res=await fetch(url,{headers:{Authorization:`Bearer ${token}`},cache:"no-store"});
 if(!res.ok)throw new Error(`Oura ${path} request failed`);
 return (await res.json()).data as Doc[];
}
export async function GET(){
 const token=(await cookies()).get("oura_access")?.value;
 if(!token)return NextResponse.json({error:"Connect Oura first."},{status:401});
 const end=new Date(),start=new Date();start.setDate(end.getDate()-30);
 const iso=(d:Date)=>d.toISOString().slice(0,10);
 try{
  const [dailySleep,sleep,readiness,activity,stress]=await Promise.all(["daily_sleep","sleep","daily_readiness","daily_activity","daily_stress"].map(p=>oura(p,token,iso(start),iso(end))));
  const resilience=await oura("daily_resilience",token,iso(start),iso(end)).catch(()=>[] as Doc[]);
  const map=new Map<string,{date:string;sleepHours?:number;oura:Record<string,number|string>}>();
  const row=(day:string)=>{if(!map.has(day))map.set(day,{date:day,oura:{}});return map.get(day)!};
  dailySleep.forEach(x=>row(x.day).oura.sleepScore=x.score||0);
  sleep.forEach(x=>{if(x.total_sleep_duration)row(x.day).sleepHours=Math.round(x.total_sleep_duration/360)/10});
  readiness.forEach(x=>row(x.day).oura.readinessScore=x.score||0);
  activity.forEach(x=>row(x.day).oura.activityScore=x.score||0);
  stress.forEach(x=>{row(x.day).oura.stressMinutes=x.stress_high||0;row(x.day).oura.recoveryMinutes=x.recovery_high||0});
  resilience.forEach(x=>row(x.day).oura.resilience=x.level||"");
  return NextResponse.json({days:[...map.values()].sort((a,b)=>a.date.localeCompare(b.date))});
 }catch(e){return NextResponse.json({error:e instanceof Error?e.message:"Oura sync failed"},{status:502})}
}
