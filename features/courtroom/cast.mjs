import {disableContentActions} from "../../scripts/window-busy.mjs";
import {MODULE_ID,ROOT,matchingScenes} from "../../scripts/features.mjs";
import {STATIONS,stationById,normalizeCast,stationTiles,stationForm,castTileData,adjustCastGeometry} from "./cast-layout.mjs";
const {ApplicationV2,HandlebarsApplicationMixin}=foundry.applications.api;
const apps=new Map(),busy=new Set();
function requireGM(){if(!game.user?.isGM)throw new Error("GM permission is required.");}
function court(id){
  requireGM();const scene=game.scenes.get(id);
  if(scene?.getFlag(MODULE_ID,"feature")!=="courtroom")throw new Error("Choose an imported courtroom.");
  return scene;
}
async function exclusive(id,fn){
  const scene=court(id);
  if(busy.has(id))throw new Error("A cast operation is already running on this client.");
  busy.add(id);try{return await fn(scene);}finally{busy.delete(id);}
}
function imageSize(src){
  return new Promise((resolve,reject)=>{
    const img=new Image(),timer=setTimeout(()=>reject(new Error("Character image did not load in time.")),15000);
    img.onload=()=>{clearTimeout(timer);resolve([img.naturalWidth,img.naturalHeight]);};
    img.onerror=()=>{clearTimeout(timer);reject(new Error("Character image could not be loaded. Check its path."));};
    img.src=src;
  });
}
async function focus(sceneId,id){
  stationById(id);court(sceneId);
  const {toggleCourtCue}=await import("./director.mjs");
  await toggleCourtCue(sceneId,id);
}
export async function placeCourtCast(sceneId,id,raw,{lighting=false}={}){
  await exclusive(sceneId,async scene=>{
    const value=normalizeCast(id,raw);
    const size=await imageSize(value.image);
    const level=scene.initialLevel??scene.firstLevel;
    if(!level?.id)throw new Error("Courtroom has no initial level.");
    const data=castTileData(id,value,scene.getDimensions(),...size,level.id,Number.isFinite(level.elevation.bottom)?level.elevation.bottom:0);
    const existing=stationTiles(scene.tiles.contents,id);
    // Update in place so a failed image load never removes the existing character.
    if(existing.length){
      await existing[0].update(data);
      if(existing.length>1)await scene.deleteEmbeddedDocuments("Tile",existing.slice(1).map(t=>t.id));
    }else await scene.createEmbeddedDocuments("Tile",[data]);
  });
  if(lighting){
    try{const {applyCourtCue}=await import("./director.mjs");await applyCourtCue(sceneId,id);}catch(e){ui.notifications.warn("Character placed; lighting cue failed: "+e.message);}
  }
}
export async function dismissCourtCast(sceneId,id){
  await exclusive(sceneId,async scene=>{
    const tiles=stationTiles(scene.tiles.contents,id);
    if(tiles.length)await scene.deleteEmbeddedDocuments("Tile",tiles.map(t=>t.id));
  });
}
class CourtCast extends HandlebarsApplicationMixin(ApplicationV2){
  static DEFAULT_OPTIONS={classes:["gg-mimc-window"],window:{title:"Machine Court — Cast & Witnesses",resizable:true},position:{width:560,height:690},actions:{selectStation:CourtCast.selectAction,place:CourtCast.placeAction,dismiss:CourtCast.dismissAction,focus:CourtCast.focusAction,actor:CourtCast.actorAction,defaults:CourtCast.defaultsAction,refresh:CourtCast.refreshAction,nudge:CourtCast.nudgeAction,drag:CourtCast.dragAction,lock:CourtCast.lockAction}};
  static PARTS={body:{template:ROOT+"templates/court-cast.hbs"}};
  constructor(sceneId){super({id:"gg-mimc-cast-"+sceneId});this.sceneId=sceneId;}
  _station="prosecution";_busy=false;_lighting=false;_step=1;_tileHook=null;
  _canRender(options){return game.user?.isGM&&super._canRender(options);}
  async _prepareContext(options){
    const scene=court(this.sceneId),d=scene.getDimensions();
    const stations=STATIONS.map(s=>{
      const tiles=stationTiles(scene.tiles.contents,s.id), tile=tiles[0];
      return {...s,selected:s.id===this._station,occupied:!!tile,occupant:tile?.name??"Empty",duplicates:tiles.length>1};
    });
    const selected=stationById(this._station),tile=stationTiles(scene.tiles.contents,selected.id)[0];
    const actors=game.actors.contents.map(a=>({id:a.id,name:a.name})).sort((a,b)=>a.name.localeCompare(b.name));
    return {...await super._prepareContext(options),sceneName:scene.name,stations,selected,form:stationForm(selected.id,tile,d),actors,lighting:this._lighting,placed:!!tile,unlocked:!!tile&&!tile.locked,fine:this._step===0.5,coarse:this._step===2};
  }
  field(name){return this.element.querySelector('[name="'+name+'"]');}
  value(name){return this.field(name)?.value??"";}
  async _onRender(context,options){
    await super._onRender(context,options);
    const picker=this.field("image");
    if(picker&&typeof picker.value==="undefined"){
      // Keep manual asset-path entry available even if a customized client lacks file-picker.
      const input=document.createElement("input");input.name="image";input.type="text";input.value=context.form.image;picker.replaceWith(input);
    }
    this.field("lighting")?.addEventListener("change",e=>{this._lighting=e.target.checked;});
    this.field("step")?.addEventListener("change",e=>{this._step=Number(e.target.value);});
    for(const key of ["center","baseline","height"])this.field(key)?.addEventListener("change",()=>{if(this.selectedTile())void this.adjust({[key]:this.value(key)});});
    this.field("mirror")?.addEventListener("change",()=>{if(this.selectedTile())void this.adjustMirror();});
    this._tileHook??=Hooks.on("updateTile",tile=>{if(this.rendered&&tile.parent?.id===this.sceneId&&tile.id===this.selectedTile()?.id)this.syncGeometry(tile);});
  }
  selectedTile(){return stationTiles(court(this.sceneId).tiles.contents,this._station)[0];}
  syncGeometry(tile=this.selectedTile()){
    if(!tile||!this.rendered)return;
    const form=stationForm(this._station,tile,court(this.sceneId).getDimensions());
    for(const key of ["center","baseline","height"]){const field=this.field(key);if(field&&document.activeElement!==field)field.value=form[key];}
    const mirror=this.field("mirror");if(mirror)mirror.checked=form.mirror;
    const status=this.element.querySelector("[data-drag-status]");if(status)status.textContent=tile.locked?"Locked":"Unlocked — drag on Tiles layer";
  }
  async live(fn){
    requireGM();if(this._busy)return;
    this._busy=true;const restore=disableContentActions(this.element);
    try{await fn();}
    catch(e){console.error(MODULE_ID,e);ui.notifications.error(e.message??String(e));}
    finally{this._busy=false;restore();if(this.rendered)this.syncGeometry();}
  }
  async adjust(changes){
    await this.live(()=>exclusive(this.sceneId,async scene=>{
      const tile=this.selectedTile();if(!tile)throw new Error("Place a character first.");
      await tile.update(adjustCastGeometry(this._station,tile,scene.getDimensions(),changes));
    }));
  }
  async adjustMirror(){
    const mirror=!!this.field("mirror")?.checked;
    await this.live(()=>exclusive(this.sceneId,async()=>{
      const tile=this.selectedTile();if(tile)await tile.update({"texture.scaleX":mirror?-1:1});
    }));
  }
  static async nudgeAction(event,target){
    const key=target.dataset.axis,sign=Number(target.dataset.sign);
    if(!["center","baseline","height"].includes(key)||![-1,1].includes(sign))return;
    await this.adjust({delta:{[key]:sign*this._step}});
  }
  static async dragAction(){
    await this.run(async()=>{
      if(globalThis.canvas?.scene?.id!==this.sceneId)throw new Error("View the courtroom before dragging a character.");
      const tile=this.selectedTile();if(!tile)throw new Error("Place a character first.");
      await tile.update({locked:false});
      const layer=canvas.getLayerByEmbeddedName("Tile");
      if(!layer){ui.notifications.warn("Select the Tiles layer manually, then drag the character.");return;}
      layer.activate();
      layer.get(tile.id)?.control({releaseOthers:true});
      ui.notifications.info("Drag the character on the canvas. Click Lock position when finished.");
    });
  }
  static async lockAction(){
    await this.run(async()=>{
      const tile=this.selectedTile();if(!tile)return;
      await tile.update({locked:true});tile.object?.release();
    });
  }
  async run(fn){
    requireGM();if(this._busy)return;
    this._busy=true;
    const restoreButtons=disableContentActions(this.element);
    try{await fn();}catch(e){console.error(MODULE_ID,e);ui.notifications.error(e.message??String(e));}
    finally{this._busy=false;restoreButtons();if(this.rendered)await this.render();}
  }
  static async selectAction(event,target){await this.run(async()=>{this._station=stationById(target.dataset.station).id;});}
  static async placeAction(){
    const raw={name:this.value("name"),image:this.value("image"),center:this.value("center"),baseline:this.value("baseline"),height:this.value("height"),mirror:!!this.field("mirror")?.checked};
    // Keep form input on validation errors so the GM can correct it.
    requireGM();if(this._busy)return;this._busy=true;
    const restoreButtons=disableContentActions(this.element);
    try{await placeCourtCast(this.sceneId,this._station,raw,{lighting:this._lighting});if(this.rendered)await this.render();}
    catch(e){console.error(MODULE_ID,e);ui.notifications.error(e.message??String(e));}
    finally{this._busy=false;restoreButtons();}
  }
  static async dismissAction(event,target){await this.run(()=>dismissCourtCast(this.sceneId,target.dataset.station));}
  static async focusAction(event,target){
    requireGM();if(this._busy)return;
    try{await focus(this.sceneId,target.dataset.station);}catch(e){ui.notifications.error(e.message??String(e));}
  }
  static async actorAction(event,target){
    requireGM();if(this._busy)return;
    const actor=game.actors.get(this.value("actorId"));
    if(!actor)return ui.notifications.warn("Select a world actor first.");
    const src=target.dataset.art==="portrait"?actor.img:actor.prototypeToken?.texture?.src;
    if(!src)return ui.notifications.warn("This actor has no selected artwork.");
    this.field("name").value=actor.name;this.field("image").value=src;
  }
  static async defaultsAction(){
    requireGM();if(this._busy)return;
    const s=stationById(this._station);
    for(const key of ["center","baseline","height"])this.field(key).value=s[key];
    this.field("mirror").checked=false;
  }
  static async refreshAction(){requireGM();if(!this._busy)await this.render();}
  async _onClose(options){if(this._tileHook!==null){Hooks.off("updateTile",this._tileHook);this._tileHook=null;}apps.delete(this.sceneId);await super._onClose(options);}
}
export async function openCourtCast(sceneId){
  requireGM();
  if(!sceneId){
    const viewed=globalThis.canvas?.scene,courts=matchingScenes(game.scenes.contents,"courtroom");
    sceneId=viewed?.getFlag(MODULE_ID,"feature")==="courtroom"?viewed.id:courts.length===1?courts[0].id:null;
  }
  court(sceneId);let app=apps.get(sceneId);if(!app){app=new CourtCast(sceneId);apps.set(sceneId,app);}
  return app.render({force:true});
}
