import {test} from "node:test";
import assert from "node:assert/strict";
import {existsSync,readFileSync} from "node:fs";
import {MODULE_ID,ROOT} from "../scripts/features.mjs";
import {MACRO_FLAG,SHORTCUTS,shortcutCommand,findShortcut,missingShortcuts,shortcutData,installGMMacros,legacyIconUpdates} from "../scripts/gm-macros.mjs";
const doc=(id,extras={})=>({getFlag:(scope,key)=>scope===MODULE_ID&&key===MACRO_FLAG?id:undefined,...extras});
test("seven distinct GM shortcuts have valid icons and API methods",()=>{
  assert.equal(SHORTCUTS.length,7);assert.equal(new Set(SHORTCUTS.map(s=>s.id)).size,7);
  const main=readFileSync("scripts/main.mjs","utf8");
  for(const s of SHORTCUTS){
    assert.ok(existsSync(s.icon),s.icon);
    assert.ok(main.includes(s.method),s.method);
    const d=shortcutData(s,"folder","gm");assert.equal(d.type,"script");assert.equal(d.ownership.default,0);assert.equal(d.ownership.gm,3);
    assert.equal(d.img,ROOT+s.icon);assert.equal(d.flags[MODULE_ID][MACRO_FLAG],s.id);
    assert.ok(d.command.includes("game.user?.isGM"));
    assert.doesNotThrow(()=>new (Object.getPrototypeOf(async function(){}).constructor)(d.command));
  }
});
test("recognize tagged and manually created equivalent macros without overwriting",()=>{
  const s=SHORTCUTS[0],edited=doc(s.id,{name:"My custom name",command:"custom"});
  const manual=doc(undefined,{type:"script",command:"await game.modules.get('"+MODULE_ID+"').api."+s.method+"();"});
  assert.equal(findShortcut([edited,manual],s),edited);
  assert.equal(findShortcut([manual],s),manual);
  assert.equal(missingShortcuts([manual]).length,6);
  assert.equal(missingShortcuts([{name:s.name,type:"chat",command:"other"}]).length,7);
});
test("GM installer creates missing macros only, uses one folder, denies player access",async()=>{
  const macros=[],folders=[];let creations=0;
  globalThis.game={user:{id:"gm",isGM:true},macros:{contents:macros},folders};
  globalThis.CONST={DOCUMENT_OWNERSHIP_LEVELS:{NONE:0,OWNER:3}};
  globalThis.foundry={documents:{Folder:{create:async data=>{const f={...data,id:"folder"};folders.push(f);return f;}},Macro:{createDocuments:async data=>{creations++;const docs=data.map(d=>({...d,getFlag:(scope,key)=>d.flags?.[scope]?.[key]}));macros.push(...docs);return docs;}}}};
  try{
    assert.equal((await installGMMacros()).length,7);assert.equal(folders.length,1);
    macros[0].command="custom";assert.deepEqual(await installGMMacros(),[]);assert.equal(creations,1);assert.equal(macros[0].command,"custom");
    macros.pop();assert.equal((await installGMMacros()).length,1);assert.equal(folders.length,1);
    game.user.isGM=false;await assert.rejects(installGMMacros(),/GM permission/);
  }finally{delete globalThis.game;delete globalThis.CONST;delete globalThis.foundry;}
});

test("upgrade only the old module-installed cast icon, preserving custom icons and commands",()=>{
  const old=ROOT+"assets/courtroom/counsel-desk-foreground.webp";
  const entries=[doc("cast",{id:"old",img:old,command:"custom"}),doc("cast",{id:"custom",img:"custom.webp"}),doc(undefined,{id:"manual",img:old}),doc("court",{id:"other",img:old})];
  assert.deepEqual(legacyIconUpdates(entries),[{_id:"old",img:ROOT+"assets/courtroom/cast-witnesses-icon.webp"}]);
  assert.equal(entries[0].command,"custom");
});
