import {topLeftTexture} from "../../scripts/tile-geometry.mjs";
import {disableContentActions} from "../../scripts/window-busy.mjs";
import {MODULE_ID,ROOT,matchingScenes} from "../../scripts/features.mjs";
import {availableEvidence,openEvidenceManager,exclusive as evidenceOperation} from "../investigation/library.mjs";
import {RECORD,PLACEMENT,safeImage,rectPixels,fitImage,placementDocs} from "../investigation/records.mjs";
import {TRIAL,SCREEN,DISPLAY_RECT,initialTrial,trialState,resetTrialState,present,admission,setTarget,summary,trialHTML,recordEvent} from "./trial-state.mjs";
const {ApplicationV2,HandlebarsApplicationMixin}=foundry.applications.api;
const apps=new Map();
function requireGM(){if(!game.user?.isGM)throw new Error("GM permission is required.");}
function court(id){
  requireGM();const scene=game.scenes.get(id);
  if(scene?.getFlag(MODULE_ID,"feature")!=="courtroom")throw new Error("Select an imported courtroom.");
  return scene;
}
function findRecord(scene){return game.journal.contents.find(j=>j.getFlag(MODULE_ID,"trialScene")===scene.id);}
function privateRecord(entry){
  const none=CONST.DOCUMENT_OWNERSHIP_LEVELS.NONE, limited=CONST.DOCUMENT_OWNERSHIP_LEVELS.LIMITED;
  if(entry.ownership.default!==none||game.users.contents.filter(u=>!u.isGM).some(u=>entry.testUserPermission(u,limited)||entry.pages.contents.some(p=>p.testUserPermission(u,limited))))throw new Error("Trial record permissions were changed. Restore private ownership before editing.");
  return entry;
}
const availableIds=()=>availableEvidence().map(j=>j.id);
async function ensureRecord(scene){
  let entry=findRecord(scene);
  if(entry)return privateRecord(entry);
  const name="Greene Gaming — Machine Court";
  let folder=game.folders.find(f=>f.name===name&&f.type==="JournalEntry"&&!f.folder);
  if(!folder)folder=await foundry.documents.Folder.create({name,type:"JournalEntry",color:"#14788c"});
  entry=await foundry.documents.JournalEntry.create({name:"Trial Record — "+scene.name,folder:folder.id,ownership:{default:CONST.DOCUMENT_OWNERSHIP_LEVELS.NONE},flags:{[MODULE_ID]:{trialScene:scene.id,[TRIAL]:initialTrial()}},pages:[{name:"Exhibits and proceedings",type:"text",ownership:{default:CONST.DOCUMENT_OWNERSHIP_LEVELS.INHERIT},text:{format:CONST.JOURNAL_ENTRY_PAGE_FORMATS.HTML,content:trialHTML(initialTrial(),availableIds())},flags:{[MODULE_ID]:{trialRegister:true}}}]});
  if(!entry)throw new Error("Unable to create private trial record.");
  return entry;
}
async function saveRecord(entry,state){
  privateRecord(entry);
  await entry.setFlag(MODULE_ID,TRIAL,state);
  const page=entry.pages.contents.find(p=>p.getFlag(MODULE_ID,"trialRegister"));
  const text={format:CONST.JOURNAL_ENTRY_PAGE_FORMATS.HTML,content:trialHTML(state,availableIds())};
  if(page)await page.update({text});
  else await entry.createEmbeddedDocuments("JournalEntryPage",[{name:"Exhibits and proceedings",type:"text",text,ownership:{default:CONST.DOCUMENT_OWNERSHIP_LEVELS.INHERIT},flags:{[MODULE_ID]:{trialRegister:true}}}]);
}
function currentId(scene){return placementDocs(scene,SCREEN).tiles.find(t=>t.getFlag(MODULE_ID,"exhibitArt"))?.getFlag(MODULE_ID,PLACEMENT)?.journalId??null;}
async function clearDisplay(scene){
  const docs=placementDocs(scene,SCREEN);
  if(docs.notes.length)await scene.deleteEmbeddedDocuments("Note",docs.notes.map(d=>d.id));
  if(docs.tiles.length)await scene.deleteEmbeddedDocuments("Tile",docs.tiles.map(d=>d.id));
}
function imageSize(src){return new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve([img.naturalWidth,img.naturalHeight]);img.onerror=()=>reject(new Error("Evidence image could not be loaded."));img.src=src;});}
function levelData(scene){
  const l=scene.initialLevel??scene.firstLevel;
  if(!l?.id)throw new Error("Courtroom has no initial level.");
  return {levels:[l.id],elevation:Number.isFinite(l.elevation.bottom)?l.elevation.bottom:0};
}
export async function presentExhibit(sceneId,journalId,{lighting=true}={}){
  await evidenceOperation(async()=>{
    const scene=court(sceneId), journal=availableEvidence().find(j=>j.id===journalId);
    if(!journal)throw new Error("Only published, player-readable evidence can be presented.");
    const r=journal.getFlag(MODULE_ID,RECORD);
    if(!r?.image||!r?.title)throw new Error("Published evidence record is incomplete.");
    const src=safeImage(r.image), size=await imageSize(src);
    const box=rectPixels(DISPLAY_RECT,scene.getDimensions()), level=levelData(scene);
    const rect=fitImage({x:box.x+10,y:box.y+6,width:box.width-40,height:box.height-12},...size);
    if(!availableEvidence().some(j=>j.id===journalId))throw new Error("Evidence is no longer available.");
    const entry=await ensureRecord(scene), state=trialState(entry.getFlag(MODULE_ID,TRIAL)), e=present(state,journalId,r.title);
    const flags={[MODULE_ID]:{[PLACEMENT]:{slot:SCREEN,journalId}}};
    await clearDisplay(scene);
    try{
      await scene.createEmbeddedDocuments("Tile",[
        {name:"Exhibit display backing",...box,...level,sort:1000,texture:topLeftTexture(ROOT+"assets/courtroom/exhibit-screen.svg"),locked:true,hidden:false,alpha:1,flags},
        {name:"Exhibit "+e.number+" — "+e.title,...rect,...level,sort:1001,texture:topLeftTexture(src),locked:true,hidden:false,alpha:1,flags:{[MODULE_ID]:{...flags[MODULE_ID],exhibitArt:true}}}
      ]);
      await scene.createEmbeddedDocuments("Note",[{x:box.x+box.width-15,y:box.y+Math.round(box.height/2),...level,entryId:journalId,iconSize:30,texture:{src:"icons/svg/book.svg"},text:"Exhibit "+e.number+" — "+e.title,fontSize:16,textColor:"#c9f7ff",global:true,flags}]);
      await saveRecord(entry,state);
    }catch(err){try{await clearDisplay(scene);}catch(cleanup){console.error(MODULE_ID,cleanup);}throw err;}
  });
  if(lighting){try{const {applyCourtCue}=await import("./director.mjs");await applyCourtCue(sceneId,"evidence");}catch(e){ui.notifications.warn("Exhibit presented; lighting cue failed: "+e.message);}}
}
async function clear(sceneId){
  return evidenceOperation(async()=>{
    const scene=court(sceneId),id=currentId(scene),entry=findRecord(scene);
    if(entry)privateRecord(entry);
    await clearDisplay(scene);
    if(entry&&id){const state=trialState(entry.getFlag(MODULE_ID,TRIAL));recordEvent(state,"Display cleared",state.exhibits.find(e=>e.journalId===id));await saveRecord(entry,state);}
  });
}
async function resetTrial(sceneId){
  return evidenceOperation(async()=>{
    const scene=court(sceneId),entry=findRecord(scene);
    if(entry)privateRecord(entry);
    await clearDisplay(scene);
    if(entry)await saveRecord(entry,resetTrialState(entry.getFlag(MODULE_ID,TRIAL)));
  });
}
async function changeAdmission(sceneId,id,value){
  return evidenceOperation(async()=>{
    const scene=court(sceneId);
    if(value&&!availableIds().includes(id))throw new Error("Evidence is no longer published.");
    const entry=await ensureRecord(scene),state=trialState(entry.getFlag(MODULE_ID,TRIAL));
    if(admission(state,id,value))await saveRecord(entry,state);
  });
}
async function changeTarget(sceneId,value){
  return evidenceOperation(async()=>{
    const entry=await ensureRecord(court(sceneId)),state=trialState(entry.getFlag(MODULE_ID,TRIAL));
    setTarget(state,value);await saveRecord(entry,state);
  });
}
class ExhibitDirector extends HandlebarsApplicationMixin(ApplicationV2){
  static DEFAULT_OPTIONS={classes:["gg-mimc-window"],window:{title:"Machine Court — Exhibit Control",resizable:true},position:{width:555,height:700},actions:{present:ExhibitDirector.presentAction,clear:ExhibitDirector.clearAction,admit:ExhibitDirector.admitAction,unadmit:ExhibitDirector.unadmitAction,inspect:ExhibitDirector.inspectAction,record:ExhibitDirector.recordAction,target:ExhibitDirector.targetAction,library:ExhibitDirector.libraryAction,refresh:ExhibitDirector.refreshAction,reset:ExhibitDirector.resetAction}};
  static PARTS={body:{template:ROOT+"templates/court-exhibits.hbs"}};
  constructor(sceneId){super({id:"gg-mimc-exhibits-"+sceneId});this.sceneId=sceneId;}
  _busy=false;_selected=null;_lighting=true;
  _canRender(options){return game.user?.isGM&&super._canRender(options);}
  async _prepareContext(options){
    const scene=court(this.sceneId),entry=findRecord(scene),state=trialState(entry?privateRecord(entry).getFlag(MODULE_ID,TRIAL):null),available=availableEvidence();
    const id=currentId(scene),s=summary(state,available.map(j=>j.id));
    if(!available.some(j=>j.id===this._selected))this._selected=id&&available.some(j=>j.id===id)?id:available[0]?.id??null;
    return {...await super._prepareContext(options),sceneName:scene.name,...s,lighting:this._lighting,shown:s.rows.find(e=>e.journalId===id&&e.available),choices:available.map(j=>({id:j.id,title:j.getFlag(MODULE_ID,RECORD)?.title??j.name,selected:j.id===this._selected})),hasChoices:available.length>0,hasRows:s.rows.length>0};
  }
  async _onRender(context,options){
    await super._onRender(context,options);
    this.element.querySelector("[name=exhibit]")?.addEventListener("change",e=>{this._selected=e.target.value;});
    this.element.querySelector("[name=lighting]")?.addEventListener("change",e=>{this._lighting=e.target.checked;});
  }
  async run(fn){
    requireGM();if(this._busy)return;this._busy=true;
    const restoreButtons=disableContentActions(this.element);
    try{await fn();}catch(e){console.error(MODULE_ID,e);ui.notifications.error(e.message??String(e));}
    finally{this._busy=false;restoreButtons();if(this.rendered)await this.render();}
  }
  static async presentAction(){await this.run(()=>presentExhibit(this.sceneId,this._selected,{lighting:this._lighting}));}
  static async clearAction(){await this.run(()=>clear(this.sceneId));}
  static async admitAction(event,target){await this.run(()=>changeAdmission(this.sceneId,target.dataset.id,true));}
  static async unadmitAction(event,target){await this.run(()=>changeAdmission(this.sceneId,target.dataset.id,false));}
  static async inspectAction(event,target){await this.run(async()=>{const j=availableEvidence().find(j=>j.id===target.dataset.id);if(!j)throw new Error("Published evidence unavailable.");await j.sheet.render({force:true});});}
  static async recordAction(){await this.run(async()=>{const j=await evidenceOperation(async()=>{const e=await ensureRecord(court(this.sceneId));await saveRecord(e,trialState(e.getFlag(MODULE_ID,TRIAL)));return e;});await j.sheet.render({force:true});});}
  static async targetAction(){await this.run(()=>changeTarget(this.sceneId,this.element.querySelector("[name=target]").value));}
  static async libraryAction(){await this.run(()=>openEvidenceManager());}
  static async resetAction(){
    requireGM();
    if(!this.element.querySelector("[name=confirmReset]")?.checked){ui.notifications.warn("Check the confirmation box before resetting the trial.");return;}
    await this.run(async()=>{await resetTrial(this.sceneId);ui.notifications.info("Trial reset. Proceedings, admissions and exhibit display cleared; admission target and published evidence retained.");});
  }
  static async refreshAction(){requireGM();if(!this._busy)await this.render();}
  async _onClose(options){apps.delete(this.sceneId);await super._onClose(options);}
}
export async function openCourtExhibits(sceneId){
  requireGM();
  if(!sceneId){const viewed=globalThis.canvas?.scene, courts=matchingScenes(game.scenes.contents,"courtroom");sceneId=viewed?.getFlag(MODULE_ID,"feature")==="courtroom"?viewed.id:courts.length===1?courts[0].id:null;}
  court(sceneId);let app=apps.get(sceneId);if(!app){app=new ExhibitDirector(sceneId);apps.set(sceneId,app);}return app.render({force:true});
}

export async function restoreTrial(sceneId,state){return evidenceOperation(async()=>{const entry=await ensureRecord(court(sceneId));await saveRecord(entry,state);});}
