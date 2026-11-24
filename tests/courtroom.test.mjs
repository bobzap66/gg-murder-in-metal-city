import {test} from "node:test";
import assert from "node:assert/strict";
import {MODULE_ID} from "../scripts/features.mjs";
import {LIGHTS,GROUPS,cueDefinition,lightData,missingLights,lightUpdates} from "../features/courtroom/lighting.mjs";
const doc=(id,role,hidden=true)=>({id,hidden,getFlag:(scope,key)=>scope===MODULE_ID&&key==="courtLight"?role:undefined});
test("14 distinct light roles; all 16 buttons resolve",()=>{
  assert.equal(LIGHTS.length,14);assert.equal(new Set(LIGHTS.map(l=>l.id)).size,14);
  const cues=GROUPS.flatMap(g=>g.cues);assert.equal(cues.length,16);
  for(const c of cues)for(const role of cueDefinition(c.id).roles)assert.ok(LIGHTS.some(l=>l.id===role));
  assert.throws(()=>cueDefinition("unknown"));assert.throws(()=>cueDefinition("toString"));
});
test("normal reset, judge groups, and crisis",()=>{
  assert.deepEqual(cueDefinition("reset").roles,[]);
  assert.equal(cueDefinition("deliberation").roles.length,5);
  assert.equal(cueDefinition("verdict").roles.length,6);
  assert.ok(cueDefinition("crisis").roles.includes("crisis"));
  assert.deepEqual(cueDefinition("equilibrium").roles,["equilibrium"]);
});
test("scale light placement and convert pixel radius to scene units",()=>{
  const l=LIGHTS.find(l=>l.id==="equilibrium");
  const d={sceneX:100,sceneY:200,sceneWidth:1672,sceneHeight:941,distancePixels:20};
  const a=lightData(l,d,"level1",0);
  assert.equal(a.x,936);assert.equal(a.y,387);
  assert.equal(a.config.dim,941*l.radius/20);
  assert.deepEqual(a.levels,["level1"]);assert.equal(a.hidden,true);assert.equal(a.walls,false);
  const b=lightData(l,{...d,sceneWidth:3344,sceneHeight:1882},"level1");
  assert.equal(b.config.dim,a.config.dim*2);
  assert.throws(()=>lightData(l,{...d,distancePixels:0},"level1"));
});
test("repair only missing lights, never edit unrelated lights",()=>{
  const ds=[doc("a","equilibrium"),doc("b","record",false),doc("c",undefined,false),doc("d","unrelated",false)];
  assert.equal(missingLights(ds).length,12);
  assert.deepEqual(lightUpdates(ds,"equilibrium"),[{_id:"a",hidden:false},{_id:"b",hidden:true}]);
  assert.deepEqual(lightUpdates(ds,"reset"),[{_id:"b",hidden:true}]);
});
