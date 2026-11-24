import {test} from "node:test";
import assert from "node:assert/strict";
import {existsSync} from "node:fs";
import {MODULE_ID} from "../scripts/features.mjs";
import {LIGHTS} from "../features/courtroom/lighting.mjs";
import {PROFILES,GUIDE_ID,journalData,missingProfiles,profileHTML} from "../features/courtroom/profiles.mjs";
test("eight distinct officials match art and director cues",()=>{
  assert.equal(PROFILES.length,8);assert.equal(PROFILES.filter(p=>p.group==="Adjudicators").length,5);
  assert.equal(new Set(PROFILES.map(p=>p.id)).size,8);
  for(const p of PROFILES){assert.ok(LIGHTS.some(l=>l.id===p.cue));for(const suffix of ["portrait","card"])assert.ok(existsSync("assets/courtroom/"+p.id+"-"+suffix+".webp"));assert.ok(p.dialogue.length>=4);}
});
test("all journals default to private and pages inherit ownership",()=>{
  for(const p of [null,...PROFILES]){const d=journalData(p,"folder");
    assert.deepEqual(d.ownership,{default:0});assert.equal(d.folder,"folder");
    assert.equal(d.flags[MODULE_ID].courtJournal,p?.id??GUIDE_ID);
    assert.equal(d.pages.length,p?3:1);
    for(const page of d.pages)assert.deepEqual(page.ownership,{default:-1});
    if(p){assert.equal(d.pages[0].type,"text");assert.equal(d.pages[1].type,"image");assert.equal(d.pages[2].type,"image");}
  }
});
test("imports identify by flags and preserve renamed journals",()=>{
  const entry=id=>({name:"Renamed",getFlag:(scope,key)=>scope===MODULE_ID&&key==="courtJournal"?id:undefined});
  assert.equal(missingProfiles([]).length,9);
  assert.equal(missingProfiles([entry(GUIDE_ID),entry(PROFILES[0].id)]).length,7);
  assert.equal(missingProfiles([entry(GUIDE_ID),...PROFILES.map(p=>entry(p.id))]).length,0);
});
test("journal text is safely escaped",()=>{
  const html=profileHTML({...PROFILES[0],appearance:"<script>&\""});
  assert.ok(html.includes("&lt;script&gt;&amp;&quot;"));assert.ok(!html.includes("<script>"));
});
