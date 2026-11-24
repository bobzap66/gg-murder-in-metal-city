import {MODULE_ID,ROOT} from "./features.mjs";
export const MACRO_FLAG="gmShortcut";
export const MACRO_FOLDER="Greene Gaming — GM Shortcuts";
export const SHORTCUTS=Object.freeze([
  ["manager","Adventure Manager","openManager","assets/courtroom/courtroom-background.webp"],
  ["court","Courtroom Director","openCourtDirector","assets/courtroom/courtroom-background.webp"],
  ["cast","Cast & Witnesses","openCourtCast","assets/courtroom/cast-witnesses-icon.webp"],
  ["exhibits","Courtroom Exhibit Control","openCourtExhibits","assets/investigation/recovered-datapad.webp"],
  ["roster","Court Officials","openCourtRoster","assets/courtroom/equilibrium-prime-portrait.webp"],
  ["evidence","Investigation Tracker","openEvidenceManager","assets/investigation/evidence-board.webp"],
  ["chase","Chase Director","openChaseDirector","assets/chase/chase-board-unbranded.webp"]
].map(([id,name,method,icon])=>Object.freeze({id,name,method,icon})));
export function shortcutCommand(shortcut){
  return [
    'if (!game.user?.isGM) return ui.notifications.warn("GM permission is required.");',
    'const api = game.modules.get("'+MODULE_ID+'")?.api;',
    'if (typeof api?.'+shortcut.method+' !== "function") return ui.notifications.error("Enable Greene Gaming: Murder in Metal City Add-Ons and reload the world.");',
    'try { await api.'+shortcut.method+'(); } catch (error) { ui.notifications.error(error.message ?? String(error)); console.error(error); }'
  ].join("\n");
}
export function findShortcut(macros,shortcut){
  const entries=Array.from(macros);
  const simple='await game.modules.get("'+MODULE_ID+'").api.'+shortcut.method+'()';
  const canonical=command=>String(command??"").trim().replace(/;$/,"").replace(/'/g,'"');
  return entries.find(m=>m.getFlag?.(MODULE_ID,MACRO_FLAG)===shortcut.id) ??
    entries.find(m=>m.type==="script"&&(canonical(m.command)===simple||m.command===shortcutCommand(shortcut)));
}
export function missingShortcuts(macros){
  return SHORTCUTS.filter(s=>!findShortcut(macros,s));
}
export function shortcutData(shortcut,folderId,ownerId,{none=0,owner=3}={}){
  return {name:shortcut.name,type:"script",img:ROOT+shortcut.icon,command:shortcutCommand(shortcut),folder:folderId,ownership:{default:none,[ownerId]:owner},flags:{[MODULE_ID]:{[MACRO_FLAG]:shortcut.id}}};
}
let installing=false;
export async function installGMMacros(){
  if(!game.user?.isGM)throw new Error("GM permission is required.");
  if(installing)throw new Error("GM macro installation already running on this client.");
  installing=true;
  try{
    let missing=missingShortcuts(game.macros.contents);
    if(!missing.length)return [];
    let folder=game.folders.find(f=>f.type==="Macro"&&f.name===MACRO_FOLDER&&!f.folder);
    if(!folder)folder=await foundry.documents.Folder.create({name:MACRO_FOLDER,type:"Macro",color:"#14788c"});
    if(!folder?.id)throw new Error("Could not create GM macro folder.");
    missing=missingShortcuts(game.macros.contents);
    if(!missing.length)return [];
    return await foundry.documents.Macro.createDocuments(missing.map(s=>shortcutData(s,folder.id,game.user.id,{none:CONST.DOCUMENT_OWNERSHIP_LEVELS.NONE,owner:CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER})));
  }finally{installing=false;}
}

/** Upgrade only the old shipped icon on module-installed shortcuts. */
export function legacyIconUpdates(macros){
  return Array.from(macros).filter(m=>m.getFlag?.(MODULE_ID,MACRO_FLAG)==="cast"&&m.img===ROOT+"assets/courtroom/counsel-desk-foreground.webp").map(m=>({_id:m.id,img:ROOT+"assets/courtroom/cast-witnesses-icon.webp"}));
}
export async function repairGMShortcutIcons(){
  if(!game.user?.isGM)throw new Error("GM permission is required.");
  const updates=legacyIconUpdates(game.macros.contents);
  if(updates.length)await foundry.documents.Macro.updateDocuments(updates);
  return updates.length;
}
