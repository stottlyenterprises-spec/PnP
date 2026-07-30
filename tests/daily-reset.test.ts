import assert from "node:assert/strict";
import test from "node:test";
import {resetCompletedTasksForNewDay} from "../lib/daily-reset.ts";

const task=(section:string,done=true,recurring=false)=>({
 id:`${section}-${recurring}`,
 title:section,
 section,
 done,
 recurring,
 completed:"2026-07-30T20:00:00.000Z",
});

test("completed Business items repopulate for the next day",()=>{
 const result=resetCompletedTasksForNewDay([
  task("stottly"),
  task("businessLong"),
 ]);
 assert.equal(result.length,2);
 assert.ok(result.every(item=>item.done===false));
 assert.ok(result.every(item=>item.completed===undefined));
});

test("one-time personal work clears while recurring work remains",()=>{
 const result=resetCompletedTasksForNewDay([
  task("today"),
  task("patrols",true,true),
  task("projects",false),
 ]);
 assert.deepEqual(result.map(item=>item.section),["patrols","projects"]);
});
