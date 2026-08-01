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
