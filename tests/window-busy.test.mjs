import {test} from "node:test";
import assert from "node:assert/strict";
import {disableContentActions} from "../scripts/window-busy.mjs";
test("busy controls are scoped to module content and restore prior state",()=>{
  const close={disabled:false}, active={disabled:false}, unavailable={disabled:true};
  const element={querySelectorAll(selector){
    assert.equal(selector,".gg-mimc-manager button[data-action], .gg-mimc-director button[data-action]");
    return [active,unavailable];
  }};
  const restore=disableContentActions(element);
  assert.equal(active.disabled,true);assert.equal(close.disabled,false);
  restore();assert.equal(active.disabled,false);assert.equal(unavailable.disabled,true);assert.equal(close.disabled,false);
});
test("closed or absent window can be restored safely",()=>{assert.doesNotThrow(()=>disableContentActions(null)());});
