import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {join} from "node:path";
import test from "node:test";
import {shouldRestoreAccount,shouldShowFirstConversation,type AccountEntryState} from "../lib/account-entry.ts";

const page=readFileSync(join(process.cwd(),"app/page.tsx"),"utf8");

test("account access stands alone before the optional setup interview",()=>{
 const entryStart=page.indexOf('<section className="onboardingInterview unifiedEntry">');
 const entryEnd=page.indexOf("</section></div>}",entryStart);
 assert.ok(entryStart>=0&&entryEnd>entryStart,"Account entry is missing");
 const unifiedEntry=page.slice(entryStart,entryEnd);
 assert.match(unifiedEntry,/!deedsAccount\.connected&&<section className="onboardingAccountAccess">/);
 assert.match(unifiedEntry,/Continue with Apple/);
 assert.match(unifiedEntry,/Continue with Google/);
 assert.match(unifiedEntry,/Email me a sign-in link/);
 assert.match(unifiedEntry,/deedsAccount\.connected&&<>/);
 assert.match(unifiedEntry,/Optional setup/);
 assert.match(unifiedEntry,/Skip for now/);
 assert.doesNotMatch(unifiedEntry,/Start blank/);
 assert.doesNotMatch(page,/setAccountGateDismissed\(false\);setOnboardingOpen\(true\);setView\("launch"\)/);
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

 const protectedEmpty={...checking,cloudReady:false,cloudRecordStatus:"empty" as const};
 assert.equal(shouldRestoreAccount(protectedEmpty),false);
 assert.equal(shouldShowFirstConversation(protectedEmpty),false);
});

test("the interview can still be opened manually after sign-in",()=>{
 const manual={...base,connected:true,cloudReady:true,cloudRecordStatus:"populated" as const,onboardingOpen:true};
 assert.equal(shouldShowFirstConversation(manual),true);
});

test("a disconnected account never opens the setup interview",()=>{
 assert.equal(shouldShowFirstConversation(base),false);
 assert.equal(shouldShowFirstConversation({...base,onboardingOpen:true}),false);
});

test("the app contains a blocking recovery state for a connected empty account",()=>{
 assert.match(page,/const accountNeedsRecovery=.*\(!hasMeaningfulLocalData\|\|explicitAccountSwitch\)/);
 assert.match(page,/Use a different account/);
 assert.match(page,/Use this device’s protected data/);
 assert.match(page,/D\.E\.E\.D\.S\. will not open a blank account or replace protected local data/);
});

test("a usable device record keeps routine account recovery in the background",()=>{
 assert.match(page,/const explicitAccountSwitch=/);
 assert.match(page,/\(!hasMeaningfulLocalData\|\|explicitAccountSwitch\)/);
});
