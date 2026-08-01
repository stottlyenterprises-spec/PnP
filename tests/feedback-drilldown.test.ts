import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import test from "node:test";

const page=readFileSync(new URL("../app/page.tsx",import.meta.url),"utf8");
const css=readFileSync(new URL("../app/globals.css",import.meta.url),"utf8");

test("every feedback lens is a tappable disclosure with underlying records",()=>{
 for(const lens of ["health","work","emotional","relationships","awareness"]){
  assert.ok(page.includes(`activeReportLens===\"${lens}\"`),`${lens} has no feedback drill-down`);
 }
 for(const records of ["healthRows","workRows","emotionalRows","relationshipRows","interviewRows"]){
  assert.ok(page.includes(`smartReport.${records}`),`${records} are not exposed in Feedback`);
 }
 assert.match(page,/aria-expanded=\{activeReportLens===/);
 assert.match(page,/function TrendChart/);
 assert.match(css,/\.reportLenses button\.active/);
 assert.match(css,/\.reportDetail/);
 assert.match(page,/function Metric\(\{label,value,note,onClick\}/);
 assert.match(page,/onClick=\{\(\)=>openReportLens\("health"\)\}/);
 assert.match(page,/onClick=\{\(\)=>openReportLens\("work"\)\}/);
 assert.match(page,/onClick=\{\(\)=>openReportLens\("emotional"\)\}/);
 assert.match(page,/onClick=\{\(\)=>openReportLens\("relationships"\)\}/);
 assert.match(page,/onClick=\{\(\)=>openReportLens\("awareness"\)\}/);
});

test("health and emotional drill-downs expose the supporting context",()=>{
 for(const field of ["hydration","exercise","yoga","oura","regulated","helped","trigger","response"]){
  assert.ok(page.includes(field),`${field} is not available to reporting`);
 }
 assert.match(page,/Daily physical detail/);
 assert.match(page,/Check-in context/);
});

test("feedback averages and trends use only explicitly logged days",()=>{
 assert.match(page,/healthHasManualLog\(x\)/);
 assert.match(page,/healthRows:health\.map/);
 assert.doesNotMatch(page,/Array\.from\(\{length:reportDays/);
});

test("native connection setup never renders as a dead disabled control",()=>{
 assert.match(page,/const emptyProvider:ProviderState=\{configured:true/);
 assert.match(page,/setGoogle\(g=>\(\{\.\.\.g,\.\.\.x,configured:true/);
 assert.match(page,/setOutlook\(o=>\(\{\.\.\.o,\.\.\.x,configured:true/);
 assert.match(page,/setOura\(o=>\(\{\.\.\.o,\.\.\.x,configured:true/);
});

test("market watch belongs to D.E.E.D.S. and native Oura opens the return-aware flow",()=>{
 assert.match(page,/view==="home"&&deedsTab==="assistant"&&<section className="dailyExtras deedsMarketWatch"/);
 assert.match(page,/view==="google"&&<section className="dailyExtras mailNewsOnly"/);
 assert.match(page,/\/api\/oura\/connect\?native=1/);
 assert.match(page,/openNativeOura/);
});
