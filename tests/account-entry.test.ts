import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {join} from "node:path";
import test from "node:test";

const page=readFileSync(join(process.cwd(),"app/page.tsx"),"utf8");

test("the first conversation always offers account recovery when disconnected",()=>{
 const entryStart=page.indexOf('<section className="onboardingInterview unifiedEntry">');
 const entryEnd=page.indexOf("</section></div>}",entryStart);
 assert.ok(entryStart>=0&&entryEnd>entryStart,"Unified account and onboarding entry is missing");
 const unifiedEntry=page.slice(entryStart,entryEnd);
 assert.match(unifiedEntry,/!google\.connected&&<section className="onboardingAccountAccess">/);
 assert.match(unifiedEntry,/Continue with Google/);
 assert.doesNotMatch(unifiedEntry,/showAccountGateway&&<section className="onboardingAccountAccess">/);
});
