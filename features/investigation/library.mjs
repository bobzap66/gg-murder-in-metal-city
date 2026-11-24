import {disableContentActions} from "../../scripts/window-busy.mjs";
import {MODULE_ID,ROOT,matchingScenes} from "../../scripts/features.mjs";
import {DRAFT,PUBLIC,RECORD,PLACEMENT,normalizeDraft,publicRecord,journalData,publishedFor,isPublished,safeImage,rectPixels,fitImage,placementDocs} from "./records.mjs";
import {renderEvidenceCard} from "./card.mjs";
const {ApplicationV2,HandlebarsApplicationMixin}=foundry.applications.api;
const DRAFT_FOLDER="Greene Gaming — Private Evidence Drafts";
const PUBLIC_FOLDER="Greene Gaming — Discovered Evidence";
let app,catalogPromise,busy=false;
function requireGM(){if(!game.user?.isGM)throw new Error("GM permission is required.");}
export function loadEvidenceCatalog(){
  catalogPromise??=fetch(ROOT+"features/investigation/catalog.json").then(r=>{if(!r.ok)throw new Error("Evidence catalog unavailable: "+r.status);return r.json();}).catch(e=>{catalogPromise=undefined;throw e;});
  return catalogPromise;
}
const options=()=>({none:CONST.DOCUMENT_OWNERSHIP_LEVELS.NONE,observer:CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER,inherit:CONST.DOCUMENT_OWNERSHIP_LEVELS.INHERIT,html:CONST.JOURNAL_ENTRY_PAGE_FORMATS.HTML});
const players=()=>game.users.contents.filter(u=>!u.isGM);
export function availableEvidence(){
  return game.journal.contents.filter(j=>isPublished(j,players(),options().observer));
}
function draftById(id){
  requireGM();
  const entry=game.journal.get(id);
  if(!entry?.getFlag(MODULE_ID,DRAFT))throw new Error("Evidence draft not found.");
  if(entry.ownership.default!==options().none||players().some(p=>entry.testUserPermission(p,CONST.DOCUMENT_OWNERSHIP_LEVELS.LIMITED)||entry.pages.contents.some(page=>page.testUserPermission(p,CONST.DOCUMENT_OWNERSHIP_LEVELS.LIMITED))))throw new Error("Draft permissions were changed. Restore private ownership before editing.");
  return entry;
}
async function folder(name){
  return game.folders.find(f=>f.type==="JournalEntry"&&f.name===name&&!f.folder)??await foundry.documents.Folder.create({name,type:"JournalEntry",color:"#14788c"});
}
export async function exclusive(fn){requireGM();if(busy)throw new Error("Evidence operation already running on this client.");busy=true;try{return await fn();}finally{busy=false;}}
async function saveDraft(id,raw){
  return exclusive(async()=>{
    const catalog=await loadEvidenceCatalog(), d=normalizeDraft(raw,catalog);
    if(!id){
      const f=await folder(DRAFT_FOLDER);
      return foundry.documents.JournalEntry.create(journalData(d,catalog,f.id,null,options()));
    }
    const entry=draftById(id), data=journalData(d,catalog,entry.folder?.id??null,null,options());
    // The editor is authoritative for draft fields; retain other manually added pages.
    const updates=data.pages.map(p=>{const old=entry.pages.contents.find(q=>q.name===p.name&&q.type===p.type);return old?{...p,_id:old.id}:null;}).filter(Boolean);
    const missing=data.pages.filter(p=>!entry.pages.contents.some(q=>q.name===p.name&&q.type===p.type));
    if(updates.length)await entry.updateEmbeddedDocuments("JournalEntryPage",updates);
    if(missing.length)await entry.createEmbeddedDocuments("JournalEntryPage",missing);
    await entry.update({name:data.name,["flags."+MODULE_ID+"."+RECORD]:d});
    return entry;
  });
}
async function publishDraft(id){
  return exclusive(async()=>{
    const entry=draftById(id), catalog=await loadEvidenceCatalog();
    if(publishedFor(game.journal.contents,id))throw new Error("A published version already exists. Withdraw it before publishing a revised version.");
    const data=journalData(entry.getFlag(MODULE_ID,RECORD),catalog,(await folder(PUBLIC_FOLDER)).id,id,options());
    // Create privately first; no public permissions until all pages exist.
    data.ownership.default=options().none;
    const published=await foundry.documents.JournalEntry.create(data);
    if(!published)throw new Error("Could not create player evidence.");
    await published.update({"ownership.default":options().observer});
    return published;
  });
}
function assertBoard(id){
  requireGM();
  const scene=game.scenes.get(id);
  if(scene?.getFlag(MODULE_ID,"feature")!=="investigation")throw new Error("Select an imported investigation board.");
  return scene;
}
function sceneLevel(scene){
  const l=scene.initialLevel??scene.firstLevel;
  if(!l?.id)throw new Error("Scene has no initial level.");
  return {levels:[l.id],elevation:Number.isFinite(l.elevation.bottom)?l.elevation.bottom:0};
}
async function imageSize(src){
  return new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve({width:img.naturalWidth,height:img.naturalHeight});img.onerror=()=>reject(new Error("Unable to load image. Check the asset path."));img.src=src;});
}
async function clearSlot(scene,slot){
  const docs=placementDocs(scene,slot);
  if(docs.notes.length)await scene.deleteEmbeddedDocuments("Note",docs.notes.map(d=>d.id));
  if(docs.tiles.length)await scene.deleteEmbeddedDocuments("Tile",docs.tiles.map(d=>d.id));
}
async function withdrawDraft(id){
  return exclusive(async()=>{
    draftById(id);
    const entry=publishedFor(game.journal.contents,id);
    if(!entry)return;
    // Revoke first, then remove all tagged representations. Never rely on hidden tiles for secrecy.
    await entry.update({"ownership.default":options().none});
    for(const scene of game.scenes.contents){
      const matches=d=>d.getFlag(MODULE_ID,PLACEMENT)?.journalId===entry.id;
      const notes=scene.notes.contents.filter(matches);
      const tiles=scene.tiles.contents.filter(matches);
      if(notes.length)await scene.deleteEmbeddedDocuments("Note",notes.map(d=>d.id));
      if(tiles.length)await scene.deleteEmbeddedDocuments("Tile",tiles.map(d=>d.id));
    }
    await entry.delete();
  });
}
async function placeEvidence(sceneId,slotId,journalId){
  return exclusive(async()=>{
    const scene=assertBoard(sceneId), catalog=await loadEvidenceCatalog(), slot=catalog.board.slots.find(s=>s.id===slotId);
    if(!slot)throw new Error("Choose an evidence slot.");
    const entry=availableEvidence().find(j=>j.id===journalId);
    if(!entry)throw new Error("Only published evidence can be placed.");
    const record=entry.getFlag(MODULE_ID,RECORD);
    if(!record)throw new Error("Published evidence record missing.");
    const src=safeImage(record.image), size=await imageSize(src), box=rectPixels(slot,scene.getDimensions()), level=sceneLevel(scene);
    const rect=fitImage({...box,width:Math.max(1,box.width-30)},size.width,size.height);
    const flags={[MODULE_ID]:{[PLACEMENT]:{slot:slotId,journalId:entry.id}}};
    // Remove only module-managed items in this slot. Never place unrevealed content.
    await clearSlot(scene,slotId);
    await scene.createEmbeddedDocuments("Tile",[{name:record.title,...rect,...level,texture:{src},locked:true,hidden:false,alpha:1,flags}]);
    await scene.createEmbeddedDocuments("Note",[{x:box.x+box.width-13,y:box.y+Math.round(box.height/2),...level,entryId:entry.id,iconSize:30,texture:{src:"icons/svg/book.svg"},text:record.title,fontSize:16,textColor:"#c9f7ff",global:true,locked:true,flags}]);
  });
}
async function removeSlot(sceneId,slotId){return exclusive(()=>clearSlot(assertBoard(sceneId),slotId));}
async function setSubject(sceneId,name,image){
  return exclusive(async()=>{
    const scene=assertBoard(sceneId), catalog=await loadEvidenceCatalog(), level=sceneLevel(scene);
    const title=String(name??"").trim().slice(0,80), src=safeImage(image);
    const flags={[MODULE_ID]:{[PLACEMENT]:{slot:"subject"}}};
    const dims=scene.getDimensions();
    const rect=src?fitImage(rectPixels(catalog.board.subjectPortrait,dims),...(await imageSize(src).then(s=>[s.width,s.height]))):null;
    await clearSlot(scene,"subject");
    const drawings=scene.drawings.contents.filter(d=>d.getFlag(MODULE_ID,PLACEMENT)?.slot==="subject");
    if(drawings.length)await scene.deleteEmbeddedDocuments("Drawing",drawings.map(d=>d.id));
    if(src)await scene.createEmbeddedDocuments("Tile",[{name:"Investigation subject",...rect,...level,texture:{src},locked:true,hidden:false,flags}]);
    if(title){
      const b=rectPixels(catalog.board.subjectName,dims);
      await scene.createEmbeddedDocuments("Drawing",[{name:"Subject name",x:b.x,y:b.y,...level,shape:{type:"r",width:b.width,height:b.height},text:title,fontSize:Math.min(22,Math.round(b.height*.65)),textColor:"#c9f7ff",textAlpha:1,strokeWidth:0,strokeAlpha:0,fillType:0,locked:true,hidden:false,interface:true,flags}]);
    }
  });
}
class EvidenceManager extends HandlebarsApplicationMixin(ApplicationV2){
  static DEFAULT_OPTIONS={id:"gg-mimc-evidence-manager",classes:["gg-mimc-window"],window:{title:"Greene Gaming — Shared Evidence Library",resizable:true},position:{width:850,height:760},actions:{newDraft:EvidenceManager.newAction,editDraft:EvidenceManager.editAction,saveDraft:EvidenceManager.saveAction,publish:EvidenceManager.publishAction,withdraw:EvidenceManager.withdrawAction,openJournal:EvidenceManager.openAction,place:EvidenceManager.placeAction,remove:EvidenceManager.removeAction,subject:EvidenceManager.subjectAction,refresh:EvidenceManager.refreshAction}};
  static PARTS={body:{template:ROOT+"templates/evidence-manager.hbs"}};
  _id=null;_board=null;_busy=false;
  _canRender(options){return game.user?.isGM&&super._canRender(options);}
  async _prepareContext(options){
    requireGM();
    const catalog=await loadEvidenceCatalog();
    const drafts=game.journal.contents.filter(j=>j.getFlag(MODULE_ID,DRAFT)).map(j=>{
      const record=j.getFlag(MODULE_ID,RECORD), pub=publishedFor(game.journal.contents,j.id);
      return {id:j.id,title:record?.title??j.name,published:!!pub,visible:!!pub&&availableEvidence().some(p=>p.id===pub.id),publicId:pub?.id,selected:j.id===this._id};
    });
    const current=this._id?draftById(this._id).getFlag(MODULE_ID,RECORD):{title:"",templateId:catalog.templates[0].id,image:"",values:{},gmNotes:""};
    const templates=catalog.templates.map(t=>({...t,selected:t.id===current.templateId}));
    const fields=(catalog.templates.find(t=>t.id===current.templateId)??catalog.templates[0]).fields.map(f=>({...f,value:current.values?.[f.id]??""}));
    const boards=matchingScenes(game.scenes.contents,"investigation");
    if(!boards.some(s=>s.id===this._board))this._board=boards[0]?.id??null;
    const scene=boards.find(s=>s.id===this._board);
    const slots=catalog.board.slots.map((s,i)=>{const tile=scene?placementDocs(scene,s.id).tiles[0]:null;return {...s,label:"Slot "+(i+1)+(tile?" — "+tile.name:" — empty")};});
    const evidence=availableEvidence().map(j=>({id:j.id,title:j.getFlag(MODULE_ID,RECORD)?.title??j.name}));
    return {...await super._prepareContext(options),drafts,current,fields,templates,boards:boards.map(s=>({id:s.id,name:s.name,selected:s.id===this._board})),slots,evidence,hasBoard:!!scene,editing:!!this._id};
  }
  async _onRender(context,options){
    await super._onRender(context,options);
    const select=this.element.querySelector("[name=templateId]");
    const update=()=>{const t=context.templates.find(t=>t.id===select.value);for(const f of t?.fields??[]){const label=this.element.querySelector('[data-label="'+f.id+'"]');if(label)label.textContent=f.label;}};
    select?.addEventListener("change",update);
    this.element.querySelector("[name=boardId]")?.addEventListener("change",e=>{this._board=e.target.value;this.render();});
  }
  value(name){return this.element.querySelector('[name="'+name+'"]')?.value??"";}
  async run(fn){
    requireGM();if(this._busy)return;
    this._busy=true;const restoreButtons=disableContentActions(this.element);
    try{await fn();}catch(e){console.error(MODULE_ID,e);ui.notifications.error(e.message??String(e));}
    finally{this._busy=false;restoreButtons();if(this.rendered)await this.render();}
  }
  static async newAction(){await this.run(async()=>{this._id=null;});}
  static async editAction(event,target){await this.run(async()=>{draftById(target.dataset.id);this._id=target.dataset.id;});}
  static async saveAction(){await this.run(async()=>{const d=await saveDraft(this._id,{title:this.value("title"),templateId:this.value("templateId"),image:this.value("image"),values:{field1:this.value("field1"),field2:this.value("field2"),notes:this.value("notes")},gmNotes:this.value("gmNotes")});this._id=d.id;ui.notifications.info("Private evidence draft saved.");});}
  static async publishAction(event,target){await this.run(async()=>{await publishDraft(target.dataset.id);ui.notifications.info("Evidence published to player journals. Place it on the board when ready.");});}
  static async withdrawAction(event,target){await this.run(async()=>{await withdrawDraft(target.dataset.id);ui.notifications.info("Published version withdrawn and managed placements removed. Draft retained.");});}
  static async openAction(event,target){await this.run(async()=>{const j=availableEvidence().find(j=>j.id===target.dataset.id);if(!j)throw new Error("Published journal unavailable.");await j.sheet.render({force:true});});}
  static async placeAction(){await this.run(()=>placeEvidence(this._board,this.value("slotId"),this.value("journalId")));}
  static async removeAction(){await this.run(()=>removeSlot(this._board,this.value("slotId")));}
  static async subjectAction(){await this.run(()=>setSubject(this._board,this.value("subjectName"),this.value("subjectImage")));}
  static async refreshAction(){requireGM();if(!this._busy)await this.render();}
}
export async function openEvidenceManager(sceneId){
  requireGM();app??=new EvidenceManager();if(sceneId){assertBoard(sceneId);app._board=sceneId;}return app.render({force:true});
}
