import {openCourtDirector} from "../features/courtroom/director.mjs";
import {MODULE_ID, ROOT, FEATURES, findFeature, matchingScenes, makeSceneData} from "./features.mjs";
import {renderEvidenceCard} from "../features/investigation/card.mjs";
const {ApplicationV2, HandlebarsApplicationMixin} = foundry.applications.api;
const FOLDER_NAME = "Greene Gaming — Murder in Metal City";
let importBusy = false;
let catalogPromise;

function requireGM() {
  if (!game.user?.isGM) throw new Error("GM permission is required.");
}
async function getCatalog() {
  if (!catalogPromise) catalogPromise = fetch(ROOT+"features/investigation/catalog.json")
    .then(r => { if (!r.ok) throw new Error("Unable to load evidence templates: "+r.status); return r.json(); })
    .catch(err => { catalogPromise=undefined; throw err; });
  return catalogPromise;
}

async function importBaseScene(id) {
  requireGM();
  if (importBusy) throw new Error("An import is already in progress on this client.");
  importBusy=true;
  try {
    const feature=findFeature(id);
    const existing=matchingScenes(game.scenes.contents,id);
    if (existing.length) return {scene:existing[0],created:false};
    const paths=[feature.image,feature.foreground].filter(Boolean);
    await Promise.all(paths.map(path=>new Promise((resolve,reject)=>{
      const img=new Image();
      img.onload=resolve;
      img.onerror=()=>reject(new Error("Module artwork unavailable: "+path));
      img.src=ROOT+path;
    })));
    let folder=game.folders.find(f=>f.type==="Scene" && f.name===FOLDER_NAME && !f.folder);
    if (!folder) folder=await foundry.documents.Folder.create({name:FOLDER_NAME,type:"Scene",color:"#14788c"});
    const again=matchingScenes(game.scenes.contents,id);
    if (again.length) return {scene:again[0],created:false};
    const scene=await foundry.documents.Scene.create(makeSceneData(feature,folder.id,CONST.GRID_TYPES.GRIDLESS));
    if (!scene) throw new Error("Foundry did not create the scene.");
    return {scene,created:true};
  } finally { importBusy=false; }
}

class EvidenceLibrary extends HandlebarsApplicationMixin(ApplicationV2) {
  static DEFAULT_OPTIONS={id:"gg-mimc-evidence-library",classes:["gg-mimc-window"],window:{title:"Evidence Template Library",resizable:true},position:{width:660,height:530}};
  static PARTS={body:{template:ROOT+"templates/evidence-library.hbs"}};
  _canRender(options) {return game.user?.isGM && super._canRender(options);}
  async _prepareContext(options) {
    requireGM();
    const catalog=await getCatalog();
    return {...await super._prepareContext(options),templates:catalog.templates};
  }
  async _onRender(context,options) {
    await super._onRender(context,options);
    const select=this.element.querySelector("[data-template-select]");
    const preview=this.element.querySelector("[data-preview]");
    if (!select || !preview) return;
    const draw=()=>{const t=context.templates.find(t=>t.id===select.value);if(t)preview.replaceChildren(renderEvidenceCard(t));};
    select.addEventListener("change",draw);
    draw();
  }
}

export class Dashboard extends HandlebarsApplicationMixin(ApplicationV2) {
  static DEFAULT_OPTIONS={
    id:"gg-mimc-dashboard",classes:["gg-mimc-window"],
    window:{title:"Greene Gaming | Adventure Manager",resizable:true},
    position:{width:790,height:700},
    actions:{
      importScene:Dashboard.importAction,
      openScene:Dashboard.openAction,
      refresh:Dashboard.refreshAction,
      evidenceLibrary:Dashboard.libraryAction,
      courtDirector:Dashboard.courtAction
    }
  };
  static PARTS={body:{template:ROOT+"templates/dashboard.hbs"}};
  _busy=false;
  _library=null;
  _canRender(options) {return game.user?.isGM && super._canRender(options);}
  async _prepareContext(options) {
    requireGM();
    const features=FEATURES.map(f=>{
      const scenes=matchingScenes(game.scenes.contents,f.id);
      return {...f,courtroom:f.id==="courtroom",image:ROOT+f.image,installed:scenes.length>0,scenes:scenes.map(s=>({id:s.id,name:s.name})),multiple:scenes.length>1};
    });
    return {...await super._prepareContext(options),features,version:game.modules.get(MODULE_ID)?.version??"development",busy:this._busy};
  }
  async run(action) {
    requireGM();
    if(this._busy)return;
    this._busy=true;
    for(const button of this.element?.querySelectorAll("button")??[])button.disabled=true;
    try{await action();}
    catch(err){console.error(MODULE_ID,err);ui.notifications.error(err.message??String(err));}
    finally{this._busy=false;if(this.rendered)await this.render();}
  }
  static async importAction(event,target) {
    await this.run(async()=>{
      const {scene,created}=await importBaseScene(target.dataset.feature);
      ui.notifications.info(created?"Imported "+scene.name+". No players moved.":"Already imported: "+scene.name);
    });
  }
  static async openAction(event,target) {
    await this.run(async()=>{
      const scene=game.scenes.get(target.dataset.scene);
      if(!scene || !FEATURES.some(f=>scene.getFlag(MODULE_ID,"feature")===f.id))throw new Error("Imported scene not found. Refresh the manager.");
      await scene.view();
    });
  }
  static async courtAction(event,target){await this.run(()=>openCourtDirector(target.dataset.scene));}
  static async refreshAction(){requireGM();await this.render();}
  static async libraryAction(){
    await this.run(async()=>{
      this._library??=new EvidenceLibrary();
      await this._library.render({force:true});
    });
  }
}
