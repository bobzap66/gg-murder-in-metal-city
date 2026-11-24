import {MODULE_ID,ROOT,matchingScenes} from "../../scripts/features.mjs";
import {CHASE,initialChase,readChase,positionName,move,adjustPoints,setRequirements,reveal,nextRound,resetChase,obstacleRows,chaseObjects,reconcilePlan} from "./state.mjs";
const {ApplicationV2,HandlebarsApplicationMixin}=foundry.applications.api;
const apps=new Map(),busy=new Set();
function requireGM(){if(!game.user?.isGM)throw new Error("GM permission is required.");}
function chaseScene(id){
  requireGM();const scene=game.scenes.get(id);
  if(scene?.getFlag(MODULE_ID,"feature")!=="chase")throw new Error("Choose an imported chase scene.");
  return scene;
}
async function sync(scene,state){
  const level=scene.initialLevel??scene.firstLevel;
  const desired=chaseObjects(state,scene.getDimensions(),level?.id,Number.isFinite(level?.elevation?.bottom)?level.elevation.bottom:0);
  for(const [type,existing,items] of [["Tile",scene.tiles.contents,desired.tiles],["Drawing",scene.drawings.contents,desired.drawings]]){
    const plan=reconcilePlan(existing,items);
    if(plan.remove.length)await scene.deleteEmbeddedDocuments(type,plan.remove);
    if(plan.update.length)await scene.updateEmbeddedDocuments(type,plan.update);
    if(plan.create.length)await scene.createEmbeddedDocuments(type,plan.create);
  }
}
async function operation(id,fn){
  const scene=chaseScene(id);
  if(busy.has(id))throw new Error("A chase operation is already running on this client.");
  busy.add(id);
  try{
    let state=readChase(scene.getFlag(MODULE_ID,CHASE));
    state=fn(state)??state;
    // Store authoritative progress first; repair regenerates managed overlays if rendering fails.
    await scene.setFlag(MODULE_ID,CHASE,state);
    await sync(scene,state);
  }finally{busy.delete(id);}
}
class ChaseDirector extends HandlebarsApplicationMixin(ApplicationV2){
  static DEFAULT_OPTIONS={classes:["gg-mimc-window"],window:{title:"Chase Director",resizable:true},position:{width:780,height:720},actions:{repair:ChaseDirector.repairAction,view:ChaseDirector.viewAction,move:ChaseDirector.moveAction,round:ChaseDirector.roundAction,points:ChaseDirector.pointsAction,reveal:ChaseDirector.revealAction,revealAll:ChaseDirector.revealAllAction,covers:ChaseDirector.coversAction,requirements:ChaseDirector.requirementsAction,reset:ChaseDirector.resetAction}};
  static PARTS={body:{template:ROOT+"templates/chase-director.hbs"}};
  constructor(id){super({id:"gg-mimc-chase-"+id});this.sceneId=id;}
  _busy=false;
  _canRender(options){return game.user?.isGM&&super._canRender(options);}
  async _prepareContext(options){
    const scene=chaseScene(this.sceneId),state=readChase(scene.getFlag(MODULE_ID,CHASE));
    return {...await super._prepareContext(options),sceneName:scene.name,initialized:!!scene.getFlag(MODULE_ID,CHASE),state,partyName:positionName(state.party),droneName:positionName(state.drone),rows:obstacleRows(state)};
  }
  async run(fn){
    requireGM();if(this._busy)return;
    this._busy=true;for(const b of this.element.querySelectorAll("button"))b.disabled=true;
    try{await fn();}catch(e){console.error(MODULE_ID,e);ui.notifications.error(e.message??String(e));}
    finally{this._busy=false;if(this.rendered)await this.render();}
  }
  static async repairAction(){await this.run(()=>operation(this.sceneId,s=>s));}
  static async viewAction(){await this.run(()=>chaseScene(this.sceneId).view());}
  static async moveAction(event,t){await this.run(()=>operation(this.sceneId,s=>{move(s,t.dataset.side,Number(t.dataset.delta));}));}
  static async roundAction(event,t){await this.run(()=>operation(this.sceneId,s=>{nextRound(s,Number(t.dataset.delta));}));}
  static async pointsAction(event,t){await this.run(()=>operation(this.sceneId,s=>{adjustPoints(s,Number(t.dataset.index),Number(t.dataset.delta));}));}
  static async revealAction(event,t){await this.run(()=>operation(this.sceneId,s=>{const i=Number(t.dataset.index);reveal(s,i,!s.revealed[i]);}));}
  static async revealAllAction(event,t){await this.run(()=>operation(this.sceneId,s=>{s.revealed=s.revealed.map(()=>t.dataset.value==="yes");}));}
  static async coversAction(){await this.run(()=>operation(this.sceneId,s=>{s.covers=!s.covers;}));}
  static async requirementsAction(){
    const values=Array.from(this.element.querySelectorAll("[data-required]"),e=>e.value);
    await this.run(()=>operation(this.sceneId,s=>{setRequirements(s,values);}));
  }
  static async resetAction(){
    requireGM();
    if(!this.element.querySelector("[name=confirmReset]")?.checked){ui.notifications.warn("Check the confirmation box before resetting chase progress.");return;}
    await this.run(()=>operation(this.sceneId,resetChase));
  }
  async _onClose(options){apps.delete(this.sceneId);await super._onClose(options);}
}
export async function openChaseDirector(sceneId){
  requireGM();
  if(!sceneId){const viewed=globalThis.canvas?.scene,scenes=matchingScenes(game.scenes.contents,"chase");sceneId=viewed?.getFlag(MODULE_ID,"feature")==="chase"?viewed.id:scenes.length===1?scenes[0].id:null;}
  chaseScene(sceneId);let app=apps.get(sceneId);
  if(!app){app=new ChaseDirector(sceneId);apps.set(sceneId,app);}
  return app.render({force:true});
}
