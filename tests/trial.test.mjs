import {test} from "node:test";
import assert from "node:assert/strict";
import {initialTrial,trialState,present,admission,setTarget,summary,trialHTML,recordEvent,DISPLAY_RECT} from "../features/courtroom/trial-state.mjs";
test("numbering persists for a snapshot, revised publication gets new number",()=>{
  const s=initialTrial();
  assert.equal(present(s,"one","First").number,1);
  assert.equal(present(s,"two","Second").number,2);
  assert.equal(present(s,"one","First").number,1);
  assert.equal(s.exhibits.length,2);
  assert.equal(trialState(s).next,3);
  assert.equal(s.events.length,3);
});
test("admission separate from presentation and screen clear",()=>{
  const s=initialTrial();present(s,"one","First");assert.equal(summary(s,["one"]).admitted,0);
  assert.throws(()=>admission(s,"missing",true));
  assert.equal(admission(s,"one",true),true);assert.equal(admission(s,"one",true),false);
  recordEvent(s,"Display cleared",s.exhibits[0]);
  assert.equal(summary(s,["one"]).admitted,1);
  assert.equal(summary(s,[]).admitted,0);assert.equal(summary(s,[]).unavailable,1);
  assert.equal(admission(s,"one",false),true);assert.equal(summary(s,["one"]).admitted,0);
});
test("target is optional, no verdict field, valid whole number only",()=>{
  const s=initialTrial();assert.equal(summary(s,[]).targetReached,false);
  setTarget(s,1);present(s,"one","First");admission(s,"one",true);assert.equal(summary(s,["one"]).targetReached,true);
  for(const n of [-1,1.5,1000,"bad"])assert.throws(()=>setTarget(s,n));
  assert.equal(summary(s,["one"]).verdict,undefined);
});
test("private register escapes text and retains unavailable history",()=>{
  const s=initialTrial();present(s,"one","<script>&");admission(s,"one",true);
  const html=trialHTML(s,[]);assert.ok(html.includes("&lt;script&gt;&amp;"));assert.ok(!html.includes("<script>"));assert.ok(html.includes("unavailable"));
  assert.ok(DISPLAY_RECT.x+DISPLAY_RECT.width<=1&&DISPLAY_RECT.y+DISPLAY_RECT.height<=1);
});
