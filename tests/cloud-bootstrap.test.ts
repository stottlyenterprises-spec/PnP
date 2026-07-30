import assert from "node:assert/strict";
import test from "node:test";
import {cloudBootstrapAction} from "../lib/cloud-bootstrap.ts";

const base={
 remoteFound:false,
 localItems:0,
 remoteItems:0,
 localDirty:false,
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

test("only meaningful local data can seed or replace an empty cloud record",()=>{
 assert.equal(cloudBootstrapAction({...base,localItems:12}),"upload-local");
 assert.equal(cloudBootstrapAction({...base,remoteFound:true,localItems:12}),"upload-local");
});

test("newer dirty work wins only when both sides contain data",()=>{
 const both={...base,remoteFound:true,localItems:4,remoteItems:5,localDirty:true,localUpdatedAt:20,remoteUpdatedAt:10};
 assert.equal(cloudBootstrapAction(both),"upload-local");
 assert.equal(cloudBootstrapAction({...both,localUpdatedAt:5}),"accept-remote");
});
