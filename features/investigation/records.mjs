import {MODULE_ID,ROOT} from "../../scripts/features.mjs";
export const DRAFT="evidenceDraft", PUBLIC="evidencePublished", RECORD="evidenceRecord", PLACEMENT="evidencePlacement";
const clean=(value,max)=>String(value??"").trim().slice(0,max);
export const escapeHTML=value=>String(value??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
export function safeImage(path){
  const value=clean(path,2048);
  if(!value)return "";
  if(/[<>"'\\\u0000-\u001f]/.test(value)||value.startsWith("//")||/^(?!https?:)[a-z][a-z0-9+.-]*:/i.test(value)||/^[.]{1,2}\//.test(value))throw new Error("Use a Foundry asset path or HTTP(S) image URL.");
  return value;
}
export function normalizeDraft(raw,catalog){
  const t=catalog.templates.find(t=>t.id===raw.templateId);
  if(!t)throw new Error("Choose a valid evidence template.");
  const title=clean(raw.title,100);
  if(!title)throw new Error("An evidence title is required.");
  const values=Object.fromEntries(t.fields.map(f=>[f.id,clean(raw.values?.[f.id],6000)]));
  return {title,templateId:t.id,image:safeImage(raw.image),values,gmNotes:clean(raw.gmNotes,12000)};
}
export function publicRecord(draft,catalog){
  const d=normalizeDraft(draft,catalog);
  const t=catalog.templates.find(t=>t.id===d.templateId);
  return {title:d.title,templateId:d.templateId,image:d.image||ROOT+t.image,values:d.values};
}
export function recordHTML(record,catalog){
  const t=catalog.templates.find(t=>t.id===record.templateId);
  if(!t)throw new Error("Evidence template missing.");
  return "<h2>"+escapeHTML(record.title)+"</h2><p><strong>"+escapeHTML(t.title)+"</strong></p>"+
    t.fields.map(f=>"<h3>"+escapeHTML(f.label)+"</h3><p>"+(escapeHTML(record.values[f.id]).replace(/\n/g,"<br>")||"—")+"</p>").join("");
}
export function journalData(record,catalog,folder,sourceId=null,{none=0,observer=2,inherit=-1,html=1}={}){
  const isPublic=sourceId!==null;
  const safe=isPublic?publicRecord(record,catalog):normalizeDraft(record,catalog);
  const pages=[{name:"Evidence",type:"text",ownership:{default:inherit},text:{format:html,content:recordHTML(safe,catalog)},sort:100000}];
  const image=safe.image||ROOT+catalog.templates.find(t=>t.id===safe.templateId).image;
  pages.push({name:"Evidence image",type:"image",src:image,ownership:{default:inherit},sort:200000});
  if(!isPublic)pages.push({name:"GM notes — private",type:"text",ownership:{default:inherit},sort:300000,text:{format:html,content:"<p>"+escapeHTML(safe.gmNotes).replace(/\n/g,"<br>")+"</p>"}});
  return {name:(isPublic?"":"Draft — ")+safe.title,folder,ownership:{default:isPublic?observer:none},pages,flags:{[MODULE_ID]:{[isPublic?PUBLIC:DRAFT]:isPublic?sourceId:true,[RECORD]:safe}}};
}
export function publishedFor(entries,id){return Array.from(entries).find(j=>j.getFlag(MODULE_ID,PUBLIC)===id);}
export function isPublished(entry,players,observer=2){
  return !!entry?.getFlag(MODULE_ID,PUBLIC)&&entry.ownership.default>=observer&&Array.from(players).every(p=>entry.testUserPermission(p,observer)&&entry.pages.contents.every(page=>page.testUserPermission(p,observer)));
}
export function rectPixels(rect,d){
  if(![d.sceneX,d.sceneY,d.sceneWidth,d.sceneHeight].every(Number.isFinite)||d.sceneWidth<=0||d.sceneHeight<=0)throw new Error("Invalid board dimensions.");
  return {x:Math.round(d.sceneX+rect.x*d.sceneWidth),y:Math.round(d.sceneY+rect.y*d.sceneHeight),width:Math.round(rect.width*d.sceneWidth),height:Math.round(rect.height*d.sceneHeight)};
}
export function fitImage(box,w,h){
  if(!Number.isFinite(w)||!Number.isFinite(h)||w<=0||h<=0)throw new Error("Invalid image size.");
  const scale=Math.min(box.width/w,box.height/h),width=Math.max(1,Math.round(w*scale)),height=Math.max(1,Math.round(h*scale));
  return {x:box.x+Math.round((box.width-width)/2),y:box.y+Math.round((box.height-height)/2),width,height};
}
export function placementDocs(scene,slot){
  const matches=d=>{const p=d.getFlag(MODULE_ID,PLACEMENT);return p&&p.slot===slot;};
  return {tiles:scene.tiles.contents.filter(matches),notes:scene.notes.contents.filter(matches)};
}
