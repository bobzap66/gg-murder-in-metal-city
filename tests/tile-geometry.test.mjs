import {test} from "node:test";
import assert from "node:assert/strict";
import {topLeftTexture,tileTopLeft,topLeftPatch} from "../scripts/tile-geometry.mjs";
import {evidenceSlotGeometry} from "../features/investigation/records.mjs";
import {stationForm,adjustCastGeometry,castTileData} from "../features/courtroom/cast-layout.mjs";
test("explicit anchor prevents v14 center-origin offset",()=>{
 assert.deepEqual(topLeftTexture("foo.webp"),{src:"foo.webp",anchorX:0,anchorY:0});
 assert.deepEqual(tileTopLeft({x:150,y:200,width:100,height:80,texture:{anchorX:.5,anchorY:.5}}),{x:100,y:160});
 assert.deepEqual(topLeftPatch({x:10,y:20}),{x:10,y:20,"texture.anchorX":0,"texture.anchorY":0});
});
test("evidence art and small pin fit within the slot",()=>{
 const d={sceneX:0,sceneY:0,sceneWidth:1672,sceneHeight:941},slot={x:.227549,y:.088362,width:.157767,height:.123922};
 const {rect,note}=evidenceSlotGeometry(slot,d,1000,1000);
 assert.ok(rect.x>=380&&rect.y>=83&&rect.y+rect.height<=200);
 assert.equal(rect.width,rect.height);assert.ok(note.iconSize<=18);
 assert.ok(note.x-note.iconSize/2>rect.x+rect.width);
});
test("legacy centered cast uses actual visible geometry; new cast sets explicit anchor",()=>{
 const d={sceneX:0,sceneY:0,sceneWidth:1000,sceneHeight:1000};
 const tile={name:"Counsel",x:250,y:550,width:100,height:300,texture:{src:"foo.webp",anchorX:.5,anchorY:.5,scaleX:1}};
 const f=stationForm("prosecution",tile,d);
 assert.equal(f.center,25);assert.equal(f.baseline,70);
 assert.deepEqual(adjustCastGeometry("prosecution",tile,d,{delta:{center:1}}),{x:210,y:400,width:100,height:300});
 const created=castTileData("prosecution",f,d,100,300,"level",0);
 assert.equal(created.texture.anchorX,0);assert.equal(created.texture.anchorY,0);
});
