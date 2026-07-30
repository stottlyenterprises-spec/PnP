import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {join} from "node:path";
import test from "node:test";
import {shouldRestoreAccount,shouldShowFirstConversation,type AccountEntryState} from "../lib/account-entry.ts";

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

const base:AccountEntryState={
 ready:true,
 identityChecked:true,
 connected:false,
 cloudReady:false,
 cloudRecordStatus:"unknown",
 onboardingOpen:false,
 onboardingComplete:false,
 showAccountGateway:true,
};

test("signing in restores the account instead of launching the interview",()=>{
 const checking={...base,connected:true};
 assert.equal(shouldRestoreAccount(checking),true);
 assert.equal(shouldShowFirstConversation(checking),false);

 for(const cloudRecordStatus of ["populated","empty"] as const){
  const restored={...checking,cloudReady:true,cloudRecordStatus};
  assert.equal(shouldRestoreAccount(restored),false);
  assert.equal(shouldShowFirstConversation(restored),false);
 }
});

test("the interview can still be opened manually after sign-in",()=>{
 const manual={...base,connected:true,cloudReady:true,cloudRecordStatus:"populated" as const,onboardingOpen:true};
 assert.equal(shouldShowFirstConversation(manual),true);
});
