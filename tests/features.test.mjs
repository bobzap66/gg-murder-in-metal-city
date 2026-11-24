import {test} from "node:test";
import assert from "node:assert/strict";
import {existsSync,readFileSync} from "node:fs";
import {MODULE_ID,FEATURES,findFeature,matchingScenes,makeSceneData} from "../scripts/features.mjs";

test("all three features have bundled images and unique IDs",()=>{
  assert.equal(FEATURES.length,3);
  assert.equal(new Set(FEATURES.map(f=>f.id)).size,3);
  for(const f of FEATURES){assert.ok(existsSync(f.image));if(f.foreground)assert.ok(existsSync(f.foreground));}
});
test("v14 scene data uses levels, flags, and inactive gridless scenes",()=>{
  for(const f of FEATURES){const d=makeSceneData(f,"folder",0);
    assert.equal(d.flags[MODULE_ID].feature,f.id);
    assert.equal(d.grid.type,0);assert.equal(d.navigation,false);assert.equal(d.active,false);assert.equal(d.tokenVision,false);
    assert.equal(d.width,f.width);assert.equal(d.height,f.height);
    assert.equal(d.levels.length,1);assert.equal(d.levels[0].background.src,"modules/"+MODULE_ID+"/"+f.image);
    assert.equal(d.levels[0].foreground?.src,f.foreground?"modules/"+MODULE_ID+"/"+f.foreground:undefined);
    assert.equal(d.background,undefined);
  }
});
test("scene identity uses module flag, not a potentially colliding name",()=>{
  const original={name:"Renamed scene",getFlag:(scope,key)=>scope===MODULE_ID&&key==="feature"?"chase":undefined};
  const unrelated={name:findFeature("chase").sceneName,getFlag:()=>undefined};
  assert.deepEqual(matchingScenes([original,unrelated],"chase"),[original]);
  assert.throws(()=>findFeature("unknown"));
});
test("evidence catalog references bundled images and eleven normalized slots",()=>{
  const c=JSON.parse(readFileSync("features/investigation/catalog.json","utf8"));
  assert.equal(c.templates.length,12);assert.equal(c.board.slots.length,11);
  for(const t of c.templates)assert.ok(existsSync(t.image));
  for(const s of c.board.slots){assert.ok(s.x>=0&&s.y>=0&&s.width>0&&s.height>0);assert.ok(s.x+s.width<=1&&s.y+s.height<=1);}
});
