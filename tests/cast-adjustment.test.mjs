import {test} from "node:test";
import assert from "node:assert/strict";
import {adjustCastGeometry,stationForm} from "../features/courtroom/cast-layout.mjs";
import {toggledCue} from "../features/courtroom/lighting.mjs";
const d={sceneX:0,sceneY:0,sceneWidth:1000,sceneHeight:1000};
const tile={name:"Counsel",texture:{src:"assets/counsel.png",scaleX:1},x:200,y:400,width:100,height:300};
test("nudge geometry moves the existing tile without changing size",()=>{
 assert.deepEqual(adjustCastGeometry("prosecution",tile,d,{delta:{center:1,baseline:-2}}),{x:210,y:380,width:100,height:300});
});
test("resize retains aspect ratio and bottom baseline",()=>{
 const r=adjustCastGeometry("prosecution",tile,d,{delta:{height:-3}});
 assert.deepEqual(r,{x:205,y:430,width:90,height:270});
 assert.equal(stationForm("prosecution",{...tile,...r},d).baseline,70);
});
test("movement clamps at edges and rejects invalid numeric fields",()=>{
 assert.equal(adjustCastGeometry("prosecution",tile,d,{delta:{center:-100}}).x,0);
 assert.throws(()=>adjustCastGeometry("prosecution",tile,d,{height:""}));
});
test("active cue toggles to reset and a different cue activates",()=>{
 assert.equal(toggledCue("prosecution","prosecution"),"reset");
 assert.equal(toggledCue("prosecution","defense"),"defense");
 assert.equal(toggledCue("reset","reset"),"reset");
});
