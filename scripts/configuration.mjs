import {MODULE_ID,FEATURES,matchingScenes} from "./features.mjs";
import {FORMAT,PORTABLE,validateConfiguration,assetPaths,remapAssets,remapTrial} from "./configuration-format.mjs";
import {DRAFT,PUBLIC,RECORD,PLACEMENT,normalizeDraft,publicRecord,publishedFor,placementDocs,escapeHTML} from "../features/investigation/records.mjs";
import {loadEvidenceCatalog,availableEvidence,saveDraft,restorePublishedSnapshot,placeEvidence,setSubject} from "../features/investigation/library.mjs";
import {STATIONS,stationForm,stationTiles} from "../features/courtroom/cast-layout.mjs";
import {placeCourtCast} from "../features/courtroom/cast.mjs";
import {LIGHTS,lightRole} from "../features/courtroom/lighting.mjs";
import {applyCourtCue,installCourtLights} from "../features/courtroom/director.mjs";
import {TRIAL,SCREEN,initialTrial,trialState} from "../features/courtroom/trial-state.mjs";
import {presentExhibit,restoreTrial} from "../features/courtroom/exhibits.mjs";
import {CHASE,readChase} from "../features/chase/state.mjs";
import {restoreChase} from "../features/chase/director.mjs";
import {missingShortcuts,SHORTCUTS,installGMMacros} from "./gm-macros.mjs";
const flag=(doc,k)=>doc?.getFlag(MODULE_ID,k);
const requireGM=()=>{if(!game.user?.isGM)throw Error("GM permission is required.");};
const sceneFor=feature=>{
  const scenes=matchingScenes(game.scenes.contents,feature);
  if(scenes.length>1)throw Error("More than one imported "+feature+" scene. Keep one target scene per feature for portable configuration.");
  return scenes[0];
};
const privateJournal=j=>{
  const limited=CONST.DOCUMENT_OWNERSHIP_LEVELS.LIMITED;
  return j.ownership.default===CONST.DOCUMENT_OWNERSHIP_LEVELS.NONE&&game.users.contents.filter(u=>!u.isGM).every(u=>!j.testUserPermission(u,limited)&&j.pages.contents.every(p=>!p.testUserPermission(u,limited)));
};
const draftKey=j=>flag(j,PORTABLE)??("world:"+game.world.id+":"+j.id);
const privateDrafts=()=>game.journal.contents.filter(j=>flag(j,DRAFT));
const trialJournal=s=>game.journal.contents.find(j=>flag(j,"trialScene")===s.id);
const clone=v=>structuredClone(v);
function plainText(html){
  const doc=new DOMParser().parseFromString(String(html??""),"text/html");
  for(const e of doc.querySelectorAll("script,style,iframe,object,embed"))e.remove();
  for(const e of doc.querySelectorAll("br"))e.replaceWith("\n");
  for(const e of doc.querySelectorAll("p,h1,h2,h3,h4,h5,h6,li,div,tr"))e.append("\n");
  return doc.body.textContent.trim().slice(0,100000);
}
const htmlText=text=>"<p>"+escapeHTML(text).replace(/\n/g,"<br>")+"</p>";
const colorString=v=>v==null?null:typeof v==="number"?"#"+v.toString(16).padStart(6,"0"):String(v);
export async function exportConfiguration({mode="preparation",features=FEATURES.map(f=>f.id),macros=true}={}){
  requireGM();const catalog=await loadEvidenceCatalog();
  const full=mode==="campaign",prep=mode!=="setup",selected=new Set(features);
  const data={format:FORMAT,schemaVersion:1,mode,features,scenes:[],drafts:[],officials:[],macros:macros&&missingShortcuts(game.macros.contents).length<SHORTCUTS.length};
  const publicKeys=new Map();
  if(prep&&selected.has("investigation")){
    for(const j of privateDrafts()){
      if(!privateJournal(j))throw Error("Draft is not private: "+j.name);
      const key=draftKey(j),record=normalizeDraft(flag(j,RECORD),catalog);
      const d={key,record};
      if(full){
        const pub=publishedFor(game.journal.contents,j.id);
        if(pub&&availableEvidence().some(p=>p.id===pub.id)){d.published=publicRecord(flag(pub,RECORD),catalog);publicKeys.set(pub.id,key);}
      }
      data.drafts.push(d);
    }
  }
  if(prep&&selected.has("courtroom")){
    for(const j of game.journal.contents.filter(j=>flag(j,"courtJournal"))){
      if(!privateJournal(j))throw Error("Court journal is not private: "+j.name);
      data.officials.push({role:flag(j,"courtJournal"),name:j.name,pages:j.pages.contents.filter(p=>["text","image"].includes(p.type)).map(p=>p.type==="text"?{type:"text",name:p.name,text:plainText(p.text?.content)}:{type:"image",name:p.name,image:p.src})});
    }
  }
  for(const feature of features){
    const s=sceneFor(feature);if(!s)continue;
    const out={feature,name:s.name},d=s.getDimensions();
    const view=s.initial;
    if(view&&[view.x,view.y,view.scale].every(Number.isFinite)&&view.scale>0)out.view={x:view.x,y:view.y,scale:view.scale};
    if(feature==="courtroom"){
      out.cast=STATIONS.flatMap(st=>{const tile=stationTiles(s.tiles.contents,st.id)[0];return tile?[{station:st.id,...stationForm(st.id,tile,d)}]:[];});
      out.lights=LIGHTS.flatMap(l=>{
        const doc=s.lights.contents.find(t=>lightRole(t)===l.id);if(!doc)return [];
        const c=doc.config;
        return [{role:l.id,x:(doc.x-d.sceneX)/d.sceneWidth,y:(doc.y-d.sceneY)/d.sceneHeight,rotation:doc.rotation??0,config:{dim:c.dim,bright:c.bright,color:colorString(c.color),alpha:c.alpha,luminosity:c.luminosity,attenuation:c.attenuation,angle:c.angle}}];
      });
      out.ambient=flag(s,"courtBaseline")??{darkness:s.environment.darknessLevel,global:s.environment.globalLight.enabled};
      out.cue=full?flag(s,"courtCue")??"reset":"reset";
      const j=trialJournal(s);
      if(j){
        if(!privateJournal(j))throw Error("Trial record is not private: "+j.name);
        const state=trialState(flag(j,TRIAL));out.target=state.target;
        if(full){
          const portable=id=>publicKeys.get(id)??(id.startsWith("unavailable:")?id.slice(12):"historical:"+id);
          out.trial={...state,exhibits:state.exhibits.map(e=>({...e,journalId:portable(e.journalId)})),events:state.events.map(e=>e.journalId?{...e,journalId:portable(e.journalId)}:{...e})};
          const shown=placementDocs(s,SCREEN).tiles.find(t=>flag(t,"exhibitArt"));
          const k=publicKeys.get(flag(shown,PLACEMENT)?.journalId);if(k)out.shown=k;
        }
      }
    }else if(feature==="investigation"){
      const subject=placementDocs(s,"subject").tiles[0],label=s.drawings.contents.find(d=>flag(d,PLACEMENT)?.slot==="subject");
      if(subject||label)out.subject={image:subject?.texture.src??"",name:label?.text??""};
      out.placements=full?catalog.board.slots.flatMap(slot=>{const t=placementDocs(s,slot.id).tiles[0];const k=publicKeys.get(flag(t,PLACEMENT)?.journalId);return k?[{slot:slot.id,key:k}]:[];}):[];
    }else out.chase=readChase(flag(s,CHASE));
    data.scenes.push(out);
  }
  return validateConfiguration(data,catalog);
}
async function probeImage(src){
  return new Promise(resolve=>{
    const i=new Image();let finished=false;
    const done=ok=>{if(finished)return;finished=true;clearTimeout(timer);i.onload=i.onerror=null;resolve({path:src,ok});};
    const timer=setTimeout(()=>done(false),8000);
    i.onload=()=>done(true);i.onerror=()=>done(false);i.src=src;
  });
}
export async function previewConfiguration(raw,mapping={},bundled=[]){
  requireGM();const catalog=await loadEvidenceCatalog();
  const data=validateConfiguration(remapAssets(validateConfiguration(raw,catalog),mapping),catalog);
  const checks=[],allPaths=assetPaths(data),pending=new Set(bundled),paths=allPaths.filter(path=>!pending.has(path));
  for(let i=0;i<paths.length;i+=12)checks.push(...await Promise.all(paths.slice(i,i+12).map(probeImage)));
  const conflicts=[];
  for(const s of data.scenes){const existing=sceneFor(s.feature);if(existing)conflicts.push("Existing scene: "+existing.name+" — merge fills missing items; replacement updates selected managed settings.");}
  for(const d of data.drafts){
    const existing=privateDrafts().find(j=>draftKey(j)===d.key);
    if(existing){
      if(!privateJournal(existing))throw Error("Existing draft is not private: "+existing.name);
      conflicts.push("Existing draft: "+d.record.title);
      const pub=publishedFor(game.journal.contents,existing.id);
      if(pub&&d.published&&(!availableEvidence().some(j=>j.id===pub.id)||JSON.stringify(publicRecord(flag(pub,RECORD),catalog))!==JSON.stringify(d.published)))conflicts.push("Publication differs: "+d.record.title+" — existing public snapshot will be preserved; conflicting restoration skipped.");
    }
  }
  for(const j of data.officials){
    const existing=game.journal.contents.find(e=>flag(e,"courtJournal")===j.role);
    if(existing){if(!privateJournal(existing))throw Error("Existing court journal is not private: "+existing.name);conflicts.push("Existing court journal: "+existing.name);}
  }
  for(const s of data.scenes.filter(s=>s.feature==="courtroom")){
    const existing=sceneFor("courtroom"),trial=existing&&trialJournal(existing);
    if(trial&&!privateJournal(trial))throw Error("Existing trial record is not private.");
  }
  return {data,checks,missing:checks.filter(a=>!a.ok),conflicts,summary:{scenes:data.scenes.length,drafts:data.drafts.length,published:data.drafts.filter(d=>d.published).length,officials:data.officials.length,assets:allPaths.length}};
}
let importing=false;
async function importOfficial(j,replace){
  const existing=game.journal.contents.find(e=>flag(e,"courtJournal")===j.role);
  if(existing&&!replace)return false;
  if(existing&&!privateJournal(existing))throw Error("Court journal is not private: "+existing.name);
  const none=CONST.DOCUMENT_OWNERSHIP_LEVELS.NONE,inherit=CONST.DOCUMENT_OWNERSHIP_LEVELS.INHERIT,html=CONST.JOURNAL_ENTRY_PAGE_FORMATS.HTML;
  const pages=j.pages.map((p,i)=>({name:p.name,type:p.type,sort:(i+1)*100000,ownership:{default:inherit},...(p.type==="text"?{text:{format:html,content:htmlText(p.text)}}:{src:p.image})}));
  if(existing){
    // Merge matching pages; retain additional destination pages and all original ownership.
    for(const p of pages){const match=existing.pages.contents.find(q=>q.name===p.name&&q.type===p.type);if(match){const {ownership,...content}=p;await match.update(content);}else await existing.createEmbeddedDocuments("JournalEntryPage",[p]);}
    await existing.update({name:j.name});return true;
  }
  const name="Greene Gaming — Machine Court";
  let folder=game.folders.find(f=>f.type==="JournalEntry"&&f.name===name&&!f.folder);
  if(!folder)folder=await foundry.documents.Folder.create({name,type:"JournalEntry",color:"#14788c"});
  await foundry.documents.JournalEntry.create({name:j.name,folder:folder.id,ownership:{default:none},pages,flags:{[MODULE_ID]:{courtJournal:j.role,profileVersion:1}}});
  return true;
}
export async function importConfiguration(raw,{mapping={},replace=false,restoreProgress=false,preview=null}={}){
  requireGM();if(importing)throw Error("Configuration import already running.");
  importing=true;const log=[];
  try{
    // Never trust caller-provided preview state; validate and probe all referenced assets again.
    const p=await previewConfiguration(raw,mapping),data=p.data,full=data.mode==="campaign"&&restoreProgress;
    if(p.missing.length)throw Error("Missing assets: "+p.missing.map(a=>a.path).join(", "));
    const {importBaseScene}=await import("./dashboard.mjs");
    const lookup=new Map();
    // First create private drafts. No player-visible evidence until explicitly requested.
    for(const d of data.drafts){
      let j=privateDrafts().find(j=>draftKey(j)===d.key);
      if(j&&!privateJournal(j))throw Error("Existing draft is not private: "+j.name);
      if(!j){j=await saveDraft(null,d.record);await j.setFlag(MODULE_ID,PORTABLE,d.key);log.push("Created private draft: "+d.record.title);}
      else if(replace){await saveDraft(j.id,d.record);log.push("Updated private draft: "+d.record.title);}
      else log.push("Kept existing private draft: "+d.record.title);
      if(full&&d.published){
        const pub=publishedFor(game.journal.contents,j.id);
        if(pub&&(!availableEvidence().some(e=>e.id===pub.id)||JSON.stringify(publicRecord(flag(pub,RECORD),await loadEvidenceCatalog()))!==JSON.stringify(d.published))){log.push("Skipped conflicting publication: "+d.record.title);continue;}
        const snapshot=await restorePublishedSnapshot(j.id,d.published);lookup.set(d.key,snapshot.id);log.push("Public snapshot available: "+d.record.title);
      }
    }
    for(const j of data.officials)log.push((await importOfficial(j,replace)?"Restored":"Kept")+" court journal: "+j.name);
    for(const row of data.scenes){
      const existing=sceneFor(row.feature),s=existing??(await importBaseScene(row.feature)).scene;
      const update=replace||!existing;
      if(update){
        const patch={name:row.name};if(row.view&&s.initial)patch.initial=row.view;
        await s.update(patch);
      }
      if(row.feature==="courtroom"){
        // Reset only if applying imported ambient/cue settings, not during merge.
        if(update&&row.ambient){await applyCourtCue(s.id,"reset");await s.update({"environment.darknessLevel":row.ambient.darkness,"environment.globalLight.enabled":row.ambient.global});}
        const prior=new Set(s.lights.contents.map(lightRole));
        if(row.lights.length){
          await installCourtLights(s.id);
          const dim=s.getDimensions(),patch=[];
          for(const l of row.lights){
            const t=s.lights.contents.find(x=>lightRole(x)===l.role);
            if(t&&(update||!prior.has(l.role)))patch.push({_id:t.id,x:Math.round(dim.sceneX+l.x*dim.sceneWidth),y:Math.round(dim.sceneY+l.y*dim.sceneHeight),rotation:l.rotation,config:l.config});
          }
          if(patch.length)await s.updateEmbeddedDocuments("AmbientLight",patch);
        }
        for(const c of row.cast){if(update||!stationTiles(s.tiles.contents,c.station).length)await placeCourtCast(s.id,c.station,c);else log.push("Kept existing "+c.station+" cast");}
        const current=trialJournal(s);
        if(full&&row.trial&&(update||!current)){
          const state=remapTrial(row.trial,lookup);
          // Display the restored snapshot if available, then restore original historical log.
          if(row.shown&&lookup.has(row.shown))await presentExhibit(s.id,lookup.get(row.shown),{lighting:false});
          await restoreTrial(s.id,state);
        }else if(row.target>0&&(update||!current)){
          const state=current?trialState(flag(current,TRIAL)):initialTrial();state.target=row.target;await restoreTrial(s.id,state);
        }
        if(update&&full&&row.cue!=="reset")await applyCourtCue(s.id,row.cue);
      }else if(row.feature==="investigation"){
        if(row.subject&&(update||(!placementDocs(s,"subject").tiles.length&&!s.drawings.contents.some(d=>flag(d,PLACEMENT)?.slot==="subject"))))await setSubject(s.id,row.subject.name,row.subject.image);
        if(full)for(const place of row.placements){
          const id=lookup.get(place.key);if(!id){log.push("Skipped unavailable evidence in "+place.slot);continue;}
          if(update||!placementDocs(s,place.slot).tiles.length)await placeEvidence(s.id,place.slot,id);else log.push("Kept existing "+place.slot);
        }
      }else{
        const old=flag(s,CHASE);
        if(update||!old){
          const state=full?clone(row.chase):old?{...readChase(old),requirements:row.chase.requirements}:readChase({...row.chase,round:1,party:0,drone:0,points:Array(8).fill(0),revealed:Array(8).fill(false),covers:true});
          await restoreChase(s.id,state);
        }else log.push("Kept existing chase settings and progress");
      }
      log.push("Processed "+row.feature+" scene: "+s.name);
    }
    if(data.macros){const made=await installGMMacros();log.push("Installed "+made.length+" missing standard GM shortcuts");}
    return log;
  }catch(error){const e=new Error(error.message+" — import may be partially applied. Back up the world before import; retry merge after resolving the error. Completed: "+log.join("; "));throw e;}
  finally{importing=false;}
}
