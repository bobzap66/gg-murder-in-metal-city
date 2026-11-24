import {openCourtCast} from "./cast.mjs";
import {openCourtExhibits} from "./exhibits.mjs";
import {openCourtRoster,openCourtJournal} from "./roster.mjs";
import {PROFILES} from "./profiles.mjs";
import {MODULE_ID,ROOT,matchingScenes} from "../../scripts/features.mjs";
import {LIGHTS,GROUPS,cueDefinition,lightRole,missingLights,lightData,lightUpdates} from "./lighting.mjs";
const {ApplicationV2,HandlebarsApplicationMixin}=foundry.applications.api;
const directors=new Map();
const busyScenes=new Set();
function requireGM(){if(!game.user?.isGM)throw new Error("GM permission is required.");}
function resolveScene(id){
  requireGM();
  const scene=game.scenes.get(id);
  if(!scene || scene.getFlag(MODULE_ID,"feature")!=="courtroom")throw new Error("Choose an imported Machine Court scene.");
  return scene;
}
function baseline(scene){
  return {darkness:scene.environment.darknessLevel,global:scene.environment.globalLight.enabled};
}
async function exclusive(sceneId,fn){
  const scene=resolveScene(sceneId);
  if(busyScenes.has(sceneId))throw new Error("A courtroom lighting operation is already running.");
  busyScenes.add(sceneId);
  try{return await fn(scene);}finally{busyScenes.delete(sceneId);}
}
async function installMissing(scene){
  const missing=missingLights(scene.lights.contents);
  if(!missing.length)return 0;
  const level=scene.initialLevel??scene.firstLevel;
  if(!level?.id)throw new Error("The courtroom has no initial level. Check its Scene configuration.");
  const d=scene.getDimensions();
  const elevation=Number.isFinite(level.elevation.bottom)?level.elevation.bottom:0;
  const entries=missing.map(l=>lightData(l,d,level.id,elevation));
  await scene.createEmbeddedDocuments("AmbientLight",entries);
  return entries.length;
}
export async function applyCourtCue(sceneId,id){
  const cue=cueDefinition(id);
  return exclusive(sceneId,async scene=>{
    const previous=scene.getFlag(MODULE_ID,"courtBaseline");
    if(id!=="reset"){
      if(scene.environment.darknessLevelLock)throw new Error("Scene darkness is locked. Unlock it before using the director.");
      if(!previous)await scene.setFlag(MODULE_ID,"courtBaseline",baseline(scene));
      await installMissing(scene);
    }
    // Persisted scene data, not local canvas-only effects. Do not touch manually placed lights.
    const updates=lightUpdates(scene.lights.contents,id);
    if(updates.length)await scene.updateEmbeddedDocuments("AmbientLight",updates);
    const patch={["flags."+MODULE_ID+".courtCue"]:id};
    if(id==="reset"){
      if(previous){
        patch["environment.darknessLevel"]=previous.darkness;
        patch["environment.globalLight.enabled"]=previous.global;
        patch["flags."+MODULE_ID+".-=courtBaseline"]=null;
      }
    }else{
      patch["environment.darknessLevel"]=cue.darkness;
      patch["environment.globalLight.enabled"]=false;
    }
    await scene.update(patch);
  });
}
export class CourtDirector extends HandlebarsApplicationMixin(ApplicationV2){
  static DEFAULT_OPTIONS={classes:["gg-mimc-window"],window:{title:"Machine Court — Director",resizable:true},position:{width:435,height:650},actions:{cue:CourtDirector.cueAction,install:CourtDirector.installAction,view:CourtDirector.viewAction,refresh:CourtDirector.refreshAction,roster:CourtDirector.rosterAction,profile:CourtDirector.profileAction,exhibits:CourtDirector.exhibitAction,cast:CourtDirector.castAction}};
  static PARTS={body:{template:ROOT+"templates/court-director.hbs"}};
  constructor(sceneId){super({id:"gg-mimc-director-"+sceneId});this.sceneId=sceneId;}
  _busy=false;
  _canRender(options){return game.user?.isGM&&super._canRender(options);}
  async _prepareContext(options){
    const scene=resolveScene(this.sceneId);
    const missing=missingLights(scene.lights.contents).length;
    const stored=scene.getFlag(MODULE_ID,"courtCue")??"reset";
    const groups=GROUPS.map(g=>({...g,cues:g.cues.map(c=>({...c,active:c.id===stored}))}));
    const active=groups.flatMap(g=>g.cues).find(c=>c.active);
    const profile=PROFILES.find(p=>p.cue===stored);
    const profileReady=profile&&game.journal.contents.some(j=>j.getFlag(MODULE_ID,"courtJournal")===profile.id);
    return {...await super._prepareContext(options),profile:profileReady?profile:null,groups,sceneName:scene.name,activeLabel:active?.label??"Unknown",installed:LIGHTS.length-missing,total:LIGHTS.length,missing,busy:this._busy,locked:scene.environment.darknessLevelLock};
  }
  async run(fn){
    requireGM();if(this._busy)return;
    this._busy=true;
    for(const b of this.element?.querySelectorAll("button")??[])b.disabled=true;
    try{await fn();}catch(err){console.error(MODULE_ID,err);ui.notifications.error(err.message??String(err));}
    finally{this._busy=false;if(this.rendered)await this.render();}
  }
  static async cueAction(event,target){await this.run(()=>applyCourtCue(this.sceneId,target.dataset.cue));}
  static async installAction(){await this.run(()=>exclusive(this.sceneId,async scene=>{const n=await installMissing(scene);ui.notifications.info(n?"Added "+n+" courtroom lights.":"All courtroom lights already exist.");}));}
  static async viewAction(){await this.run(()=>resolveScene(this.sceneId).view());}
  static async rosterAction(){await this.run(()=>openCourtRoster());}
  static async profileAction(event,target){await this.run(()=>openCourtJournal(target.dataset.profile));}
  static async exhibitAction(){await this.run(()=>openCourtExhibits(this.sceneId));}
  static async castAction(){await this.run(()=>openCourtCast(this.sceneId));}
  static async refreshAction(){requireGM();if(!this._busy)await this.render();}
  async _onClose(options){directors.delete(this.sceneId);await super._onClose(options);}
}
export async function openCourtDirector(sceneId){
  requireGM();
  if(!sceneId){
    const viewed=globalThis.canvas?.scene;
    const courts=matchingScenes(game.scenes.contents,"courtroom");
    sceneId=viewed?.getFlag(MODULE_ID,"feature")==="courtroom"?viewed.id:courts.length===1?courts[0].id:null;
    if(!sceneId)throw new Error("Import a courtroom or choose its Director button in Adventure Manager.");
  }
  resolveScene(sceneId);
  let app=directors.get(sceneId);
  if(!app){app=new CourtDirector(sceneId);directors.set(sceneId,app);}
  return app.render({force:true});
}
