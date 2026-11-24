/** Portable data only. No raw Foundry document payloads, IDs, ownership, macros, or executable content. */
import {MODULE_ID,FEATURES} from "./features.mjs";
import {normalizeDraft,publicRecord,safeImage} from "../features/investigation/records.mjs";
import {normalizeCast,STATIONS} from "../features/courtroom/cast-layout.mjs";
import {LIGHTS,cueDefinition} from "../features/courtroom/lighting.mjs";
import {PROFILES,GUIDE_ID} from "../features/courtroom/profiles.mjs";
import {initialChase,setRequirements,FINISH} from "../features/chase/state.mjs";
export const FORMAT=MODULE_ID+"/configuration", PORTABLE="portableEvidenceKey";
export const MODES=["setup","preparation","campaign"], MAX_BYTES=8*1024*1024;
const obj=(v,l)=>{if(!v||typeof v!=="object"||Array.isArray(v))throw Error("Invalid "+l);return v;};
const arr=(v,max,l)=>{if(!Array.isArray(v)||v.length>max)throw Error("Invalid "+l);return v;};
const str=(v,max,l,blank=false)=>{if(typeof v!=="string"||v.length>max||(!blank&&!v.trim()))throw Error("Invalid "+l);return v;};
const num=(v,min,max,l)=>{if(typeof v!=="number"||!Number.isFinite(v)||v<min||v>max)throw Error("Invalid "+l);return v;};
const int=(v,min,max,l)=>{num(v,min,max,l);if(!Number.isInteger(v))throw Error("Invalid "+l);return v;};
const bool=(v,l)=>{if(typeof v!=="boolean")throw Error("Invalid "+l);return v;};
const key=v=>{str(v,200,"portable key");if(!/^[A-Za-z0-9_.:-]+$/.test(v))throw Error("Invalid portable key");return v;};
const unique=(a,fn,l)=>{if(new Set(a.map(fn)).size!==a.length)throw Error("Duplicate "+l);return a;};
const img=v=>safeImage(str(v??"",2048,"image path",true));
const ref=(v,known,l)=>{if(!known.has(v))throw Error("Unknown "+l);return v;};
const ids=new Set(FEATURES.map(f=>f.id)),stations=new Set(STATIONS.map(s=>s.id)),roles=new Set(LIGHTS.map(l=>l.id)),profiles=new Set([GUIDE_ID,...PROFILES.map(p=>p.id)]);
export function validateConfiguration(raw,catalog){
  obj(raw,"configuration");
  if(raw.format!==FORMAT||raw.schemaVersion!==1||!MODES.includes(raw.mode))throw Error("Unsupported configuration format, version or mode.");
  const mode=raw.mode, full=mode==="campaign", prep=mode!=="setup";
  const features=unique(arr(raw.features,3,"features").map(f=>ref(f,ids,"feature")),x=>x,"feature");
  if(!features.length)throw Error("Select at least one feature.");
  const drafts=prep&&features.includes("investigation")?unique(arr(raw.drafts??[],1000,"drafts").map(d=>({key:key(d.key),record:normalizeDraft(obj(d.record,"draft"),catalog),...(full&&d.published?{published:publicRecord(obj(d.published,"snapshot"),catalog)}:{})})),d=>d.key,"draft key"):[];
  const pubs=new Set(drafts.filter(d=>d.published).map(d=>d.key));
  const officials=prep&&features.includes("courtroom")?unique(arr(raw.officials??[],9,"officials").map(j=>({role:ref(j.role,profiles,"court official"),name:str(j.name,200,"journal name"),pages:unique(arr(j.pages,30,"pages").map(p=>{
    const base={name:str(p.name,200,"page name"),type:ref(p.type,new Set(["text","image"]),"page type")};
    return p.type==="text"?{...base,text:str(p.text,100000,"journal text",true)}:{...base,image:img(p.image)};
  }),p=>p.name+":"+p.type,"journal page")})),j=>j.role,"court official"):[];
  const scenes=unique(arr(raw.scenes??[],3,"scenes").map(s=>{
    const feature=ref(s.feature,new Set(features),"selected feature"),out={feature,name:str(s.name,200,"scene name")};
    if(s.view)out.view={x:num(s.view.x,-100000,100000,"view x"),y:num(s.view.y,-100000,100000,"view y"),scale:num(s.view.scale,.01,10,"view scale")};
    if(feature==="courtroom"){
      out.cast=unique(arr(s.cast??[],3,"cast").map(c=>({station:ref(c.station,stations,"cast station"),...normalizeCast(c.station,c)})),c=>c.station,"cast station");
      out.lights=unique(arr(s.lights??[],14,"lights").map(l=>{
        const c=obj(l.config,"light config");
        if(c.color!=null&&(typeof c.color!=="string"||!/^#[0-9a-f]{6}$/i.test(c.color)))throw Error("Invalid light color");
        return {role:ref(l.role,roles,"light role"),x:num(l.x,-1,2,"light x"),y:num(l.y,-1,2,"light y"),rotation:num(l.rotation??0,-360,360,"light rotation"),config:{dim:num(c.dim,0,10000,"dim"),bright:num(c.bright,0,10000,"bright"),color:c.color??null,alpha:num(c.alpha,0,1,"alpha"),luminosity:num(c.luminosity,-1,1,"luminosity"),attenuation:num(c.attenuation,0,1,"attenuation"),angle:num(c.angle,0,360,"angle")}};
      }),l=>l.role,"light role");
      if(s.ambient)out.ambient={darkness:num(s.ambient.darkness,0,1,"darkness"),global:bool(s.ambient.global,"global light")};
      out.cue=full?s.cue??"reset":"reset";cueDefinition(out.cue);
      out.target=int(s.target??0,0,999,"trial target");
      if(full&&s.trial){
        const t=obj(s.trial,"trial");
        out.trial={version:1,target:out.target,next:int(t.next,1,100000,"next exhibit"),exhibits:unique(arr(t.exhibits,1000,"exhibits").map(e=>({journalId:key(e.journalId),title:str(e.title,100,"exhibit title"),number:int(e.number,1,99999,"exhibit number"),admitted:bool(e.admitted,"admission")})),e=>e.journalId,"exhibit reference"),events:arr(t.events,10000,"trial events").map(e=>({at:str(e.at,80,"event date"),action:str(e.action,300,"event action"),...(e.journalId?{journalId:key(e.journalId),number:int(e.number,1,99999,"event number"),title:str(e.title,100,"event title")}:{})}))};
        if(new Set(out.trial.exhibits.map(e=>e.number)).size!==out.trial.exhibits.length||out.trial.exhibits.some(e=>e.number>=out.trial.next))throw Error("Invalid exhibit numbering.");
        if(s.shown)out.shown=ref(s.shown,pubs,"published exhibit");
      }
    }else if(feature==="investigation"){
      if(s.subject)out.subject={name:str(s.subject.name??"",80,"subject name",true),image:img(s.subject.image)};
      out.placements=full?unique(arr(s.placements??[],11,"placements").map(p=>({slot:ref(p.slot,new Set(catalog.board.slots.map(s=>s.id)),"board slot"),key:ref(p.key,pubs,"published evidence")})),p=>p.slot,"board slot"):[];
    }else{
      const c=obj(s.chase,"chase state"),state=initialChase();
      setRequirements(state,c.requirements);
      if(full){
        state.round=int(c.round,1,999,"round");state.party=int(c.party,0,FINISH,"party");state.drone=int(c.drone,0,FINISH,"drone");
        state.points=arr(c.points,8,"points").map(n=>int(n,0,999,"points"));
        state.revealed=arr(c.revealed,8,"revealed").map(v=>bool(v,"revealed"));
        if(state.points.length!==8||state.revealed.length!==8)throw Error("Eight obstacles required.");
        state.covers=bool(c.covers,"covers");
      }
      out.chase=state;
    }
    return out;
  }),s=>s.feature,"scene feature");
  return {format:FORMAT,schemaVersion:1,mode,features,scenes,drafts,officials,macros:raw.macros===true};
}
export function assetPaths(data){
  const paths=new Set();
  const add=v=>{if(v)paths.add(v);};
  for(const d of data.drafts){add(d.record.image);add(d.published?.image);}
  for(const j of data.officials)for(const p of j.pages)if(p.type==="image")add(p.image);
  for(const s of data.scenes){for(const c of s.cast??[])add(c.image);add(s.subject?.image);}
  return [...paths].sort();
}
export function remapAssets(data,map){
  obj(map,"asset mapping");
  const copy=structuredClone(data),swap=v=>v&&Object.hasOwn(map,v)?img(map[v]):v;
  for(const d of copy.drafts){d.record.image=swap(d.record.image);if(d.published)d.published.image=swap(d.published.image);}
  for(const j of copy.officials)for(const p of j.pages)if(p.type==="image")p.image=swap(p.image);
  for(const s of copy.scenes){for(const c of s.cast??[])c.image=swap(c.image);if(s.subject)s.subject.image=swap(s.subject.image);}
  return copy;
}
export function remapTrial(state,lookup){
  const remap=id=>lookup.get(id)??"unavailable:"+id;
  return {...state,exhibits:state.exhibits.map(e=>({...e,journalId:remap(e.journalId)})),events:state.events.map(e=>e.journalId?{...e,journalId:remap(e.journalId)}:{...e})};
}
