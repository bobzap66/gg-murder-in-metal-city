import {MODULE_ID,ROOT} from "../../scripts/features.mjs";
import {PROFILES,GUIDE_ID,journalData,missingProfiles} from "./profiles.mjs";
const {ApplicationV2,HandlebarsApplicationMixin}=foundry.applications.api;
const FOLDER="Greene Gaming — Machine Court";
let roster, importing=false;
function requireGM(){if(!game.user?.isGM)throw new Error("GM permission is required.");}
function findJournal(id){return game.journal.contents.find(j=>j.getFlag(MODULE_ID,"courtJournal")===id);}
export async function importCourtJournals(){
  requireGM();
  if(importing)throw new Error("Journal import already running on this client.");
  importing=true;
  try{
    if(!missingProfiles(game.journal.contents).length)return [];
    let folder=game.folders.find(f=>f.type==="JournalEntry"&&f.name===FOLDER&&!f.folder);
    if(!folder)folder=await foundry.documents.Folder.create({name:FOLDER,type:"JournalEntry",color:"#14788c"});
    const missing=missingProfiles(game.journal.contents);
    if(!missing.length)return [];
    const options={none:CONST.DOCUMENT_OWNERSHIP_LEVELS.NONE,inherit:CONST.DOCUMENT_OWNERSHIP_LEVELS.INHERIT,html:CONST.JOURNAL_ENTRY_PAGE_FORMATS.HTML};
    return await foundry.documents.JournalEntry.createDocuments(missing.map(p=>journalData(p,folder.id,options)));
  }finally{importing=false;}
}
export async function openCourtJournal(id){
  requireGM();
  const journal=findJournal(id);
  if(!journal)throw new Error("Import the court journals first.");
  return journal.sheet.render({force:true});
}
class CourtRoster extends HandlebarsApplicationMixin(ApplicationV2){
  static DEFAULT_OPTIONS={id:"gg-mimc-court-roster",classes:["gg-mimc-window"],window:{title:"Machine Court — GM Roster",resizable:true},position:{width:710,height:690},actions:{importJournals:CourtRoster.importAction,openJournal:CourtRoster.openAction,refresh:CourtRoster.refreshAction}};
  static PARTS={body:{template:ROOT+"templates/court-roster.hbs"}};
  _busy=false;
  _canRender(options){return game.user?.isGM&&super._canRender(options);}
  async _prepareContext(options){
    requireGM();
    const groups=["Adjudicators","Court personnel"].map(title=>({title,profiles:PROFILES.filter(p=>p.group===title).map(p=>({...p,portrait:ROOT+"assets/courtroom/"+p.id+"-portrait.webp",installed:!!findJournal(p.id)}))}));
    return {...await super._prepareContext(options),groups,guideInstalled:!!findJournal(GUIDE_ID),guideId:GUIDE_ID,missing:missingProfiles(game.journal.contents).length,busy:this._busy};
  }
  async run(fn){
    requireGM();if(this._busy)return;
    this._busy=true;
    for(const b of this.element?.querySelectorAll("button")??[])b.disabled=true;
    try{await fn();}catch(e){console.error(MODULE_ID,e);ui.notifications.error(e.message??String(e));}
    finally{this._busy=false;if(this.rendered)await this.render();}
  }
  static async importAction(){await this.run(async()=>{const docs=await importCourtJournals();ui.notifications.info(docs.length?"Imported "+docs.length+" GM journals.":"All court journals already exist.");});}
  static async openAction(event,target){await this.run(()=>openCourtJournal(target.dataset.profile));}
  static async refreshAction(){requireGM();if(!this._busy)await this.render();}
}
export async function openCourtRoster(){
  requireGM();roster??=new CourtRoster();return roster.render({force:true});
}
