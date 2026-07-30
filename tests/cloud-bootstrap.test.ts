import assert from "node:assert/strict";
import test from "node:test";
import {cloudBootstrapAction} from "../lib/cloud-bootstrap.ts";

const base={
 remoteFound:false,
 localItems:0,
 remoteItems:0,
 localDirty:false,
 localCloudRevision:0,
 remoteRevision:0,
 localUpdatedAt:0,
 remoteUpdatedAt:0,
};

test("a blank new device never creates or overwrites a cloud record",()=>{
 assert.equal(cloudBootstrapAction(base),"recover-history");
 assert.equal(cloudBootstrapAction({...base,remoteFound:true}),"recover-history");
});

test("a populated cloud record always restores onto a blank device",()=>{
 assert.equal(cloudBootstrapAction({...base,remoteFound:true,remoteItems:42}),"accept-remote");
});

test("unsynced local data never silently seeds or replaces an empty cloud record",()=>{
 assert.equal(cloudBootstrapAction({...base,localItems:12}),"recover-history");
 assert.equal(cloudBootstrapAction({...base,remoteFound:true,localItems:12}),"recover-history");
});

test("newer dirty work wins only when it descends from the current cloud revision",()=>{
 const both={...base,remoteFound:true,localItems:4,remoteItems:5,localDirty:true,localCloudRevision:7,remoteRevision:7,localUpdatedAt:20,remoteUpdatedAt:10};
 assert.equal(cloudBootstrapAction(both),"upload-local");
 assert.equal(cloudBootstrapAction({...both,localUpdatedAt:5}),"accept-remote");
 assert.equal(cloudBootstrapAction({...both,localCloudRevision:0}),"accept-remote");
 assert.equal(cloudBootstrapAction({...both,localCloudRevision:6}),"accept-remote");
});

test("a populated account always wins over starter data on a new device",()=>{
 assert.equal(cloudBootstrapAction({
  ...base,
  remoteFound:true,
  remoteItems:85,
  remoteRevision:14,
  localItems:6,
  localDirty:true,
  localUpdatedAt:100,
  remoteUpdatedAt:50,
 }),"accept-remote");
});
