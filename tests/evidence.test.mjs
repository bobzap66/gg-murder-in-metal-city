import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {MODULE_ID} from "../scripts/features.mjs";
import {DRAFT,PUBLIC,RECORD,normalizeDraft,publicRecord,journalData,isPublished,safeImage,rectPixels,fitImage,placementDocs} from "../features/investigation/records.mjs";
const catalog=JSON.parse(readFileSync("features/investigation/catalog.json","utf8"));
const raw={title:"Test <clue>",templateId:"drone-scan",image:"",values:{field1:"Drone A",field2:"<script>",notes:"Visible notes",secret:"NEVER"},gmNotes:"SECRET GM NOTE"};
test("private drafts retain GM notes, public snapshots whitelist only template values",()=>{
  const d=normalizeDraft(raw,catalog);assert.equal(d.gmNotes,raw.gmNotes);
  const p=publicRecord(d,catalog);assert.equal(p.gmNotes,undefined);assert.equal(p.values.secret,undefined);
  const draft=journalData(d,catalog,"private"),pub=journalData(d,catalog,"public","draft-id");
  assert.equal(draft.ownership.default,0);assert.equal(pub.ownership.default,2);
  assert.equal(draft.flags[MODULE_ID][DRAFT],true);assert.equal(pub.flags[MODULE_ID][PUBLIC],"draft-id");
  assert.equal(draft.pages.length,3);assert.equal(pub.pages.length,2);
  assert.ok(JSON.stringify(draft).includes("SECRET GM NOTE"));assert.ok(!JSON.stringify(pub).includes("SECRET GM NOTE"));
  assert.ok(pub.pages[0].text.content.includes("&lt;script&gt;"));assert.ok(!pub.pages[0].text.content.includes("<script>"));
  assert.equal(pub.flags[MODULE_ID][RECORD].image,"modules/"+MODULE_ID+"/assets/investigation/drone-scan.webp");
});
test("reject bad drafts and unsafe image paths",()=>{
  assert.throws(()=>normalizeDraft({...raw,title:" "},catalog));assert.throws(()=>normalizeDraft({...raw,templateId:"fake"},catalog));
  for(const p of ["javascript:alert(1)","data:text/html,hi","//example.com/a","bad\"path"])assert.throws(()=>safeImage(p));
  assert.equal(safeImage("https://example.org/asset.webp"),"https://example.org/asset.webp");
});
test("availability checks journal and page permissions for each player",()=>{
  const entry={getFlag:()=>true,ownership:{default:2},testUserPermission:()=>true,pages:{contents:[{testUserPermission:()=>true}]}};
  assert.ok(isPublished(entry,[{}]));assert.ok(!isPublished({...entry,ownership:{default:0}},[{}]));
  assert.ok(!isPublished({...entry,pages:{contents:[{testUserPermission:()=>false}]}},[{}]));
});
test("board uses normalized coordinates and aspect fit",()=>{
  const b=rectPixels({x:.1,y:.2,width:.4,height:.2},{sceneX:10,sceneY:20,sceneWidth:1000,sceneHeight:500});
  assert.deepEqual(b,{x:110,y:120,width:400,height:100});
  assert.deepEqual(fitImage(b,200,200),{x:260,y:120,width:100,height:100});
});
test("only tagged placements in selected slot are returned",()=>{
  const a={getFlag:()=>({slot:"evidence-01"})},b={getFlag:()=>({slot:"evidence-02"})},c={getFlag:()=>undefined};
  assert.deepEqual(placementDocs({tiles:{contents:[a,b,c]},notes:{contents:[b,a]}},"evidence-01"),{tiles:[a],notes:[a]});
});
