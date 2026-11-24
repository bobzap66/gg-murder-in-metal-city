import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {FORMAT,validateConfiguration,assetPaths,remapAssets,remapTrial} from "../scripts/configuration-format.mjs";
const catalog=JSON.parse(readFileSync("features/investigation/catalog.json","utf8"));
const raw=()=>({format:FORMAT,schemaVersion:1,mode:"campaign",features:["investigation"],scenes:[{feature:"investigation",name:"Board",subject:{name:"Subject",image:"art/subject.png"},placements:[{slot:"evidence-01",key:"evidence:1"}]}],drafts:[{key:"evidence:1",record:{title:"Clue",templateId:"recovered-datapad",image:"art/clue.png",values:{field1:"new private draft"},gmNotes:"secret"},published:{title:"Clue",templateId:"recovered-datapad",image:"art/public.png",values:{field1:"old public snapshot"},gmNotes:"never public"}}]});
test("private draft and public snapshot stay separate; unknown fields stripped",()=>{
 const d=validateConfiguration(raw(),catalog);assert.equal(d.drafts[0].record.gmNotes,"secret");assert.equal(d.drafts[0].published.values.field1,"old public snapshot");assert.equal(d.drafts[0].published.gmNotes,undefined);
});
test("preparation cannot restore publication or placements",()=>{
 const r=raw();r.mode="preparation";const d=validateConfiguration(r,catalog);assert.equal(d.drafts[0].published,undefined);assert.deepEqual(d.scenes[0].placements,[]);
 r.mode="setup";assert.deepEqual(validateConfiguration(r,catalog).drafts,[]);
});
test("invalid format, duplicate slots and unresolved placement refs rejected",()=>{
 const r=raw();r.schemaVersion=2;assert.throws(()=>validateConfiguration(r,catalog));r.schemaVersion=1;r.scenes[0].placements[0].key="not-found";assert.throws(()=>validateConfiguration(r,catalog));
});
test("remap asset paths without changing original",()=>{
 const d=validateConfiguration(raw(),catalog),r=remapAssets(d,{"art/clue.png":"forge/clue.png"});assert.ok(assetPaths(r).includes("forge/clue.png"));assert.ok(assetPaths(d).includes("art/clue.png"));assert.throws(()=>remapAssets(d,{"art/clue.png":"javascript:bad"}));
});
test("trial refs remapped; unavailable history never points at an existing document",()=>{
 const t={version:1,exhibits:[{journalId:"evidence:1"},{journalId:"old"}],events:[{journalId:"old"}]};const out=remapTrial(t,new Map([["evidence:1","newId"]]));assert.equal(out.exhibits[0].journalId,"newId");assert.equal(out.exhibits[1].journalId,"unavailable:old");assert.equal(out.events[0].journalId,"unavailable:old");
});
