import assert from "node:assert/strict";
import test from "node:test";

import { PERSONAL_HOUSEHOLD_MIGRATION, upgradePersonalHousehold } from "../lib/personal-household.ts";

const input=()=>({
 today:"2026-08-02",
 migrations:[] as string[],
 lists:[{id:"home-list",title:"Household"}],
 categories:[
  {id:"monthly",title:"Monthly Tasks",section:"custom",listId:"home-list",order:0},
  {id:"semi",title:"Every 6 Months",section:"custom",listId:"home-list",order:1},
 ],
 tasks:[
  {id:"fridge",title:"Refrigerator shelves",notes:"Keep my note",section:"custom",listId:"home-list",categoryId:"monthly",done:true,created:"2026-07-01T12:00:00.000Z",completed:"2026-07-29T18:00:00.000Z"},
  {id:"garage",title:"Garage: Sweep floor",section:"custom",listId:"home-list",categoryId:"semi",done:false,created:"2026-07-01T12:00:00.000Z"},
  {id:"personal",title:"Call dentist",section:"today",done:false,created:"2026-07-01T12:00:00.000Z"},
 ],
});

test("personal household migration replaces cadence categories with physical areas",()=>{
 const result=upgradePersonalHousehold(input());
 const householdCategories=result.categories.filter(category=>category.listId==="home-list");
 assert.equal(householdCategories.some(category=>/monthly|quarter|annual/i.test(category.title)),false);
 assert.equal(householdCategories.some(category=>category.title==="Kitchen"),true);
 assert.equal(householdCategories.some(category=>category.title==="Garage"),true);
 assert.equal(householdCategories.some(category=>category.title==="Back Patio & Lanai"),true);
 assert.equal(householdCategories.some(category=>category.title==="Pool & Spa"),true);
});

test("existing data is preserved while recurrence and area are corrected",()=>{
 const result=upgradePersonalHousehold(input()),fridge=result.tasks.find(task=>task.id==="fridge")!,garage=result.tasks.find(task=>task.id==="garage")!;
 assert.match(fridge.notes||"",/Keep my note/);
 assert.match(fridge.notes||"",/Suggested timing: monthly/);
 assert.equal(fridge.done,true);
 assert.equal(fridge.completed,"2026-07-29T18:00:00.000Z");
 assert.equal(fridge.recurring,true);
 assert.equal(fridge.repeatUnit,"month");
 assert.equal(fridge.repeatInterval,1);
 assert.equal(result.categories.find(category=>category.id===fridge.categoryId)?.title,"Kitchen");
 assert.equal(garage.title,"Garage floor: Sweep or vacuum debris");
 assert.equal(result.categories.find(category=>category.id===garage.categoryId)?.title,"Garage");
 assert.equal(result.tasks.find(task=>task.id==="personal")?.categoryId,undefined);
});

test("the second pass repairs vague labels, timing, and This Month household work",()=>{
 const value=input();value.migrations=["personal-household-areas-v1"];
 value.categories=[{id:"kitchen",title:"Kitchen",section:"custom",listId:"home-list",order:0}];
 value.tasks=[
  {id:"vague",title:"Remove shelves and drawers",section:"custom",listId:"home-list",categoryId:"kitchen",done:false,created:"2026-07-01T12:00:00.000Z"},
  {id:"ac",title:"Clear AC line",section:"month",done:false,created:"2026-07-01T12:00:00.000Z"},
  {id:"returns",title:"Returns",section:"month",done:false,created:"2026-07-01T12:00:00.000Z"},
 ];
 const result=upgradePersonalHousehold(value),vague=result.tasks.find(task=>task.id==="vague")!,ac=result.tasks.find(task=>task.id==="ac")!;
 assert.equal(vague.title,"Refrigerator: Remove shelves and drawers");
 assert.equal(vague.repeatUnit,"month");
 assert.equal(vague.repeatInterval,3);
 assert.match(vague.notes||"",/every 3 months/);
 assert.equal(ac.title,"HVAC drain line: Clear and inspect");
 assert.equal(ac.section,"custom");
 assert.equal(result.categories.find(category=>category.id===ac.categoryId)?.title,"Laundry & Utility");
 assert.equal(result.tasks.find(task=>task.id==="returns")?.section,"month");
});

test("missing patio pool play and garage tasks are added once with staggered next dates",()=>{
 const first=upgradePersonalHousehold(input());
 assert.ok(first.tasks.some(task=>task.title==="Pool: Test and record water chemistry"));
 assert.ok(first.tasks.some(task=>task.title==="Lanai screens and frames: Wash gently"));
 assert.ok(first.tasks.some(task=>task.title==="Playhouse: Wash exterior and accessible interior surfaces"));
 assert.ok(first.tasks.some(task=>task.title==="Garage-door photo eyes: Clean and test alignment response"));
 assert.equal(first.tasks.filter(task=>task.title==="Garage floor: Sweep or vacuum debris").length,1);
 assert.ok(first.tasks.filter(task=>task.listId==="home-list"&&task.id.startsWith("personal-")).every(task=>Boolean(task.repeatAnchor)&&task.scheduledDate===undefined));
 assert.ok(first.migrations.includes(PERSONAL_HOUSEHOLD_MIGRATION));
 const second=upgradePersonalHousehold(first);
 assert.equal(second.tasks.length,first.tasks.length);
 assert.deepEqual(second.categories,first.categories);
});

test("accounts without a household list are not marked migrated",()=>{
 const value=input();value.lists=[];
 const result=upgradePersonalHousehold(value);
 assert.equal(result.migrations.includes(PERSONAL_HOUSEHOLD_MIGRATION),false);
 assert.equal(result.tasks.length,value.tasks.length);
});
