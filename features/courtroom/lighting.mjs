import {MODULE_ID} from "../../scripts/features.mjs";

// Positions measured against the populated courtroom, relative to the scene rectangle.
// Radius is a fraction of the shorter image dimension, converted to scene distance units.
export const LIGHTS = Object.freeze([
  ["veracity","Veracity-7",.212,.280,.145,"#b9edff"],
  ["compassion","Compassionate Inquiry",.345,.259,.140,"#c2efff"],
  ["equilibrium","Equilibrium-Prime",.500,.199,.185,"#d4eeff"],
  ["directive","Directive-Immutable",.666,.265,.145,"#c0e5ff"],
  ["recursive","Recursive Wisdom",.797,.260,.145,"#c9eaff"],
  ["record","Permanent Record",.151,.570,.108,"#b9edff"],
  ["checksum","Checksum-Delta",.790,.559,.108,"#b9edff"],
  ["orderly","Orderly Passage",.944,.580,.115,"#b9edff"],
  ["prosecution","Prosecution",.180,.688,.158,"#b9edff"],
  ["defense","Defense",.815,.688,.158,"#b9edff"],
  ["witness","Witness Platform",.500,.660,.145,"#e7faff"],
  ["evidence","Evidence Display",.500,.543,.220,"#92eaff"],
  ["verdict","Verdict Aura",.500,.270,.460,"#ffe1a0"],
  ["crisis","Amber Alert",.500,.500,.950,"#ff9a38"]
].map(([id,label,x,y,radius,color])=>Object.freeze({id,label,x,y,radius,color})));

const judges=["veracity","compassion","equilibrium","directive","recursive"];
export const GROUPS=Object.freeze([
  {title:"Proceedings",cues:[
    {id:"reset",label:"Normal / Reset",icon:"fa-sun"},
    {id:"deliberation",label:"Deliberation",icon:"fa-comments"},
    {id:"verdict",label:"Verdict",icon:"fa-gavel"},
    {id:"crisis",label:"Procedural Crisis",icon:"fa-triangle-exclamation"}]},
  {title:"Adjudicators",cues:judges.map(id=>({id,label:LIGHTS.find(l=>l.id===id).label,icon:"fa-scale-balanced"}))},
  {title:"Counsel and testimony",cues:["prosecution","defense","witness","evidence"].map(id=>({id,label:LIGHTS.find(l=>l.id===id).label,icon:"fa-lightbulb"}))},
  {title:"Court personnel",cues:["record","checksum","orderly"].map(id=>({id,label:LIGHTS.find(l=>l.id===id).label,icon:"fa-lightbulb"}))}
]);
const presets={
  reset:{darkness:null,roles:[]},
  deliberation:{darkness:.52,roles:judges},
  verdict:{darkness:.64,roles:[...judges,"verdict"]},
  crisis:{darkness:.62,roles:["crisis","prosecution","defense","evidence"]}
};
export function cueDefinition(id){
  if(Object.hasOwn(presets,id))return presets[id];
  if(LIGHTS.some(l=>l.id===id && !["verdict","crisis"].includes(id)))return {darkness:.66,roles:[id]};
  throw new Error("Unknown courtroom cue: "+id);
}
export function lightRole(doc){return doc.getFlag(MODULE_ID,"courtLight");}
export function missingLights(documents){const present=new Set(Array.from(documents,lightRole));return LIGHTS.filter(l=>!present.has(l.id));}
export function lightData(light,d,levelId,elevation=0){
  if(![d.sceneX,d.sceneY,d.sceneWidth,d.sceneHeight,d.distancePixels,elevation].every(Number.isFinite)||d.distancePixels<=0||d.sceneWidth<=0||d.sceneHeight<=0||!levelId)throw new Error("Invalid courtroom geometry or level.");
  const radius=Math.min(d.sceneWidth,d.sceneHeight)*light.radius/d.distancePixels;
  const wash=["crisis","verdict"].includes(light.id);
  return {name:"Machine Court — "+light.label,x:Math.round(d.sceneX+light.x*d.sceneWidth),y:Math.round(d.sceneY+light.y*d.sceneHeight),elevation,levels:[levelId],hidden:true,walls:false,vision:false,rotation:0,
    config:{dim:radius,bright:radius*(wash?.18:.54),color:light.color,alpha:wash?.28:.38,luminosity:.5,attenuation:.55,angle:360,darkness:{min:0,max:1}},
    flags:{[MODULE_ID]:{courtLight:light.id}}};
}
export function lightUpdates(documents,id){
  const roles=new Set(cueDefinition(id).roles);
  const known=new Set(LIGHTS.map(l=>l.id));
  return Array.from(documents).filter(d=>known.has(lightRole(d))).map(d=>({_id:d.id,hidden:!roles.has(lightRole(d))})).filter((u)=>Array.from(documents).find(d=>d.id===u._id)?.hidden!==u.hidden);
}
