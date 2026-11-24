import {test} from "node:test";
import assert from "node:assert/strict";
import {MODULE_ID} from "../scripts/features.mjs";
import {LIGHTS} from "../features/courtroom/lighting.mjs";
import {CAST_FLAG,STATIONS,stationById,normalizeCast,stationTiles,castRect,stationForm,castTileData} from "../features/courtroom/cast-layout.mjs";
const d={sceneX:10,sceneY:20,sceneWidth:1000,sceneHeight:500};
const raw={name:"Witness",image:"worlds/test/witness.webp",center:50,baseline:70,height:30,mirror:true};
test("three stations match the director cues",()=>{
  assert.equal(STATIONS.length,3);
  for(const s of STATIONS)assert.ok(LIGHTS.some(l=>l.id===s.id));
  assert.throws(()=>stationById("fake"));
});
test("placement preserves aspect ratio and anchors at requested baseline",()=>{
  assert.deepEqual(castRect(raw,d,100,200),{x:473,y:220,width:75,height:150});
  const b=castRect({...raw,center:100,baseline:0,height:85},d,5000,100);
  assert.ok(b.x>=d.sceneX&&b.y>=d.sceneY&&b.x+b.width<=d.sceneX+d.sceneWidth&&b.y+b.height<=d.sceneY+d.sceneHeight);
});
test("validate artwork and adjustments",()=>{
  for(const bad of [{image:""},{image:"javascript:alert(1)"},{height:0},{center:101},{baseline:""},{height:"NaN"}])assert.throws(()=>normalizeCast("witness",{...raw,...bad}));
  assert.equal(normalizeCast("witness",{...raw,name:""}).name,"Witness platform");
});
test("native tile is visible, locked, mirrored, scoped and unlinked",()=>{
  const tile=castTileData("witness",raw,d,100,200,"level",0);
  assert.equal(tile.flags[MODULE_ID][CAST_FLAG],"witness");
  assert.equal(tile.texture.scaleX,-1);assert.equal(tile.hidden,false);assert.equal(tile.locked,true);
  assert.deepEqual(tile.levels,["level"]);assert.equal(tile.actorId,undefined);assert.equal(tile.elevation,0);
  assert.throws(()=>castTileData("witness",raw,d,100,200,null,0));
});
test("only managed tiles for the selected station are selected",()=>{
  const make=(id,role)=>({id,getFlag:(scope,key)=>scope===MODULE_ID&&key===CAST_FLAG?role:undefined});
  const a=make("a","witness"),b=make("b","defense"),c=make("c",undefined);
  assert.deepEqual(stationTiles([a,b,c],"witness"),[a]);
});
test("editor derives position from existing tile and defaults when empty",()=>{
  const tile=castTileData("witness",raw,d,100,200,"level",0);
  const form=stationForm("witness",tile,d);
  assert.equal(form.name,"Witness");assert.equal(form.image,raw.image);assert.ok(Math.abs(form.center-50)<=.11);assert.equal(form.height,30);assert.equal(form.baseline,70);assert.equal(form.mirror,true);
  assert.equal(stationForm("defense",null,d).center,80);
});
