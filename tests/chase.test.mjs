import {test} from "node:test";
import assert from "node:assert/strict";
import {MODULE_ID} from "../scripts/features.mjs";
import {CHASE,OBJECT,OBSTACLES,FINISH,initialChase,readChase,move,adjustPoints,setRequirements,reveal,nextRound,resetChase,obstacleRows,chaseObjects,reconcilePlan} from "../features/chase/state.mjs";
const d={sceneX:10,sceneY:20,sceneWidth:2172,sceneHeight:724};
test("eight obstacles, independent movement, party reveals on arrival",()=>{
 const s=initialChase();assert.equal(OBSTACLES.length,8);move(s,"drone",1);assert.equal(s.party,0);assert.equal(s.revealed[0],false);move(s,"party",1);assert.equal(s.revealed[0],true);for(let i=0;i<20;i++)move(s,"party",1);assert.equal(s.party,FINISH);for(let i=0;i<20;i++)move(s,"drone",-1);assert.equal(s.drone,0);assert.throws(()=>move(s,"fake",1));
});
test("requirements and points are configurable, no automatic movement or overflow",()=>{
 const s=initialChase();setRequirements(s,["3","","4","","","","",""]);move(s,"party",1);adjustPoints(s,0,2);adjustPoints(s,0,2);assert.equal(s.points[0],4);assert.equal(s.party,1);assert.equal(obstacleRows(s)[0].met,true);assert.equal(s.points[1],0);adjustPoints(s,0,-9);assert.equal(s.points[0],0);assert.throws(()=>setRequirements(s,[0,1,1,1,1,1,1,1]));assert.throws(()=>adjustPoints(s,8,1));
});
test("round, reveal, persistence and reset retain configuration",()=>{
 const s=initialChase();setRequirements(s,[1,2,3,4,5,6,7,8]);nextRound(s,1);reveal(s,4,true);move(s,"party",1);adjustPoints(s,0,2);const copy=readChase(s);assert.deepEqual(copy,s);copy.points[0]=99;assert.equal(s.points[0],2);const r=resetChase(s);assert.equal(r.round,1);assert.equal(r.party,0);assert.deepEqual(r.requirements,s.requirements);assert.ok(r.revealed.every(v=>!v));
});
test("overlay positions stay in scene, covers and markers are tagged",()=>{
 const s=initialChase();let o=chaseObjects(s,d,"level",0);assert.equal(o.tiles.length,18);assert.equal(o.drawings.length,1);
 for(const t of o.tiles){assert.ok(t.flags[MODULE_ID][OBJECT]);assert.ok(t.x>=d.sceneX&&t.y>=d.sceneY&&t.x+t.width<=d.sceneX+d.sceneWidth&&t.y+t.height<=d.sceneY+d.sceneHeight);assert.deepEqual(t.levels,["level"]);}
 move(s,"party",1);o=chaseObjects(s,d,"level",0);assert.equal(o.tiles.length,16);assert.equal(o.drawings.length,2);assert.ok(!o.tiles.some(t=>t.flags[MODULE_ID][OBJECT]==="cover-0"));
});
test("reconciliation only updates managed documents and removes duplicates",()=>{
 const desired=chaseObjects(initialChase(),d,"level",0).tiles;
 const doc=(id,key)=>({id,getFlag:(scope,flag)=>scope===MODULE_ID&&flag===OBJECT?key:undefined});
 const p=reconcilePlan([doc("a","party-marker"),doc("b","party-marker"),doc("c","old"),doc("manual",undefined)],desired);
 assert.equal(p.update.length,1);assert.equal(p.update[0]._id,"a");assert.deepEqual(p.remove,["b","c"]);assert.equal(p.create.length,17);
});
