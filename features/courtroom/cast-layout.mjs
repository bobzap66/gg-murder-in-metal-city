import {topLeftTexture,tileTopLeft} from "../../scripts/tile-geometry.mjs";
import {MODULE_ID} from "../../scripts/features.mjs";
import {safeImage} from "../investigation/records.mjs";
export const CAST_FLAG="courtCastStation";
export const STATIONS=Object.freeze([
  {id:"prosecution",label:"Prosecution",center:20,baseline:84,height:33},
  {id:"defense",label:"Defense",center:80,baseline:84,height:33},
  {id:"witness",label:"Witness platform",center:50,baseline:73,height:27}
].map(Object.freeze));
export function stationById(id){
  const station=STATIONS.find(s=>s.id===id);
  if(!station)throw new Error("Unknown court station.");
  return station;
}
const percent=(v,min,max,label)=>{
  if(v===""||v==null||!Number.isFinite(Number(v))||Number(v)<min||Number(v)>max)throw new Error(label+" must be between "+min+" and "+max+".");
  return Number(v);
};
export function normalizeCast(id,raw){
  const station=stationById(id);
  const name=String(raw.name??"").trim().slice(0,100)||station.label;
  const image=safeImage(raw.image);
  if(!image)throw new Error("Select character artwork before placing it.");
  return {name,image,center:percent(raw.center,0,100,"Horizontal position"),baseline:percent(raw.baseline,0,100,"Baseline"),height:percent(raw.height,5,85,"Height"),mirror:raw.mirror===true};
}
export function stationTiles(tiles,id){
  stationById(id);
  return Array.from(tiles).filter(t=>t.getFlag(MODULE_ID,CAST_FLAG)===id);
}
export function castRect(raw,d,w,h){
  if(![d.sceneX,d.sceneY,d.sceneWidth,d.sceneHeight,w,h].every(Number.isFinite)||Math.min(d.sceneWidth,d.sceneHeight,w,h)<=0)throw new Error("Invalid character or scene dimensions.");
  const scale=Math.min(d.sceneHeight*raw.height/100/h,d.sceneWidth/w,d.sceneHeight/h);
  const width=Math.max(1,Math.round(w*scale)),height=Math.max(1,Math.round(h*scale));
  const x=Math.min(d.sceneWidth-width,Math.max(0,Math.round(d.sceneWidth*raw.center/100-width/2)));
  const y=Math.min(d.sceneHeight-height,Math.max(0,Math.round(d.sceneHeight*raw.baseline/100-height)));
  return {x:Math.round(d.sceneX+x),y:Math.round(d.sceneY+y),width,height};
}
const round=n=>Math.round(n*10)/10;
export function stationForm(id,tile,d){
  const s=stationById(id);
  if(!tile)return {name:"",image:"",center:s.center,baseline:s.baseline,height:s.height,mirror:false};
  const origin=tileTopLeft(tile);
  return {name:tile.name,image:tile.texture.src,center:round(100*(origin.x+tile.width/2-d.sceneX)/d.sceneWidth),baseline:round(100*(origin.y+tile.height-d.sceneY)/d.sceneHeight),height:round(100*tile.height/d.sceneHeight),mirror:tile.texture.scaleX<0};
}
export function castTileData(id,raw,d,w,h,levelId,elevation){
  if(!levelId||!Number.isFinite(elevation))throw new Error("Courtroom level unavailable.");
  const r=normalizeCast(id,raw);
  return {name:r.name,...castRect(r,d,w,h),levels:[levelId],elevation,sort:2000,rotation:0,hidden:false,locked:true,alpha:1,texture:topLeftTexture(r.image,{scaleX:r.mirror?-1:1,scaleY:1}),flags:{[MODULE_ID]:{[CAST_FLAG]:id}}};
}

/** Adjust geometry only, retaining the original tile and its artwork. */
export function adjustCastGeometry(id,tile,d,changes={}){
  if(!tile)throw new Error("Place a character first.");
  const base=stationForm(id,tile,d);
  const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
  const next={...base};
  for(const [key,min,max] of [["center",0,100],["baseline",0,100],["height",5,85]]){
    if(changes[key]!==undefined)next[key]=percent(changes[key],min,max,key);
    if(changes.delta?.[key]!==undefined)next[key]=clamp(next[key]+changes.delta[key],min,max);
  }
  return castRect(next,d,tile.width,tile.height);
}
