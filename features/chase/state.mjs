import {MODULE_ID,ROOT} from "../../scripts/features.mjs";
import {rectPixels,fitImage} from "../investigation/records.mjs";
export const CHASE="chaseState", OBJECT="chaseObject";
export const OBSTACLES=Object.freeze(["Cloaking Drone","Traffic Crossing","Safety Crossing","Crowd","Construction Site","Holo-Ads","Underground Mall","Flock of Drones"]);
export const FINISH=OBSTACLES.length+1;
const integer=(value,min,max,label)=>{
  if(value===""||value==null||!Number.isInteger(Number(value))||Number(value)<min||Number(value)>max)throw new Error(label+" must be a whole number from "+min+" to "+max+".");
  return Number(value);
};
export function initialChase(requirements=OBSTACLES.map(()=>null)){
  return {version:1,round:1,party:0,drone:0,requirements:requirements.map(v=>v==null?null:integer(v,1,999,"Required points")),points:OBSTACLES.map(()=>0),revealed:OBSTACLES.map(()=>false),covers:true};
}
export function readChase(raw){return raw?.version===1?structuredClone(raw):initialChase();}
export function positionName(pos){return pos===0?"Start":pos===FINISH?"Hideout":OBSTACLES[pos-1];}
export function move(state,side,delta){
  if(!["party","drone"].includes(side)||![-1,1].includes(delta))throw new Error("Invalid movement.");
  state[side]=Math.max(0,Math.min(FINISH,state[side]+delta));
  if(side==="party"&&state.party>0&&state.party<FINISH)state.revealed[state.party-1]=true;
}
export function adjustPoints(state,index,delta){
  integer(index,0,OBSTACLES.length-1,"Obstacle");
  integer(delta,-999,999,"Point adjustment");
  state.points[index]=Math.max(0,Math.min(999,state.points[index]+delta));
}
export function setRequirements(state,values){
  if(!Array.isArray(values)||values.length!==OBSTACLES.length)throw new Error("Eight requirements are needed.");
  state.requirements=values.map(v=>v===""||v==null?null:integer(v,1,999,"Required points"));
}
export function reveal(state,index,value){integer(index,0,OBSTACLES.length-1,"Obstacle");state.revealed[index]=!!value;}
export function nextRound(state,delta){if(![-1,1].includes(delta))throw new Error("Invalid round adjustment.");state.round=Math.max(1,Math.min(999,state.round+delta));}
export function resetChase(state){return initialChase(state.requirements);}
export function obstacleRows(state){return OBSTACLES.map((title,i)=>({index:i,number:i+1,title,required:state.requirements[i],points:state.points[i],revealed:state.revealed[i],met:state.requirements[i]!=null&&state.points[i]>=state.requirements[i],party:state.party===i+1,drone:state.drone===i+1}));}
const step=.0967;
export function panelRect(i){integer(i,0,7,"Obstacle");return {x:.1005+i*step,y:.397,width:.119,height:.475};}
export function markerX(pos){integer(pos,0,FINISH,"Position");return pos===0?.054:pos===FINISH?.946:.158+(pos-1)*step;}
const art="assets/chase/";
const flag=key=>({[MODULE_ID]:{[OBJECT]:key}});
export function chaseObjects(state,d,levelId,elevation){
  if(!levelId||!Number.isFinite(elevation))throw new Error("Chase scene has no usable level.");
  const level={levels:[levelId],elevation},tiles=[],drawings=[];
  const tile=(key,path,rect,sort)=>tiles.push({name:"Chase — "+key,...rect,...level,texture:{src:ROOT+art+path},sort,alpha:1,locked:true,hidden:false,flags:flag(key)});
  const text=(key,label,rect,size,color)=>{const b=rectPixels(rect,d);drawings.push({x:b.x,y:b.y,...level,shape:{type:"r",width:b.width,height:b.height},text:label,fontSize:Math.max(12,Math.round(d.sceneHeight*size)),textColor:color,textAlpha:1,strokeWidth:0,strokeAlpha:0,fillType:1,fillColor:"#061524",fillAlpha:.9,locked:true,hidden:false,interface:true,sort:4000,flags:flag(key)});};
  for(const row of obstacleRows(state)){
    const i=row.index, panel=panelRect(i);
    if(state.covers&&!row.revealed){
      tile("cover-"+i,"obstacle-mask.svg",rectPixels(panel,d),1000);
      const b=rectPixels({x:panel.x+.039,y:panel.y+.095,width:.045,height:.27},d);
      tile("card-"+i,"chase-card-cover.webp",fitImage(b,941,1672),1100);
    }else if(row.revealed){
      const label=row.required==null?row.points+" CP":row.points+" / "+row.required+" CP";
      text("points-"+i,label,{x:panel.x+.023,y:.807,width:.073,height:.050},.027,row.met?"#a6ffbd":"#c9f7ff");
    }
  }
  for(const side of ["party","drone"]){
    const x=markerX(state[side]), y=side==="party"?.883:.941;
    tile(side+"-marker",side+"-marker.svg",rectPixels({x:x-.038,y,width:.076,height:.052},d),2000);
  }
  text("round","ROUND "+state.round,{x:.015,y:.23,width:.105,height:.065},.033,"#c9f7ff");
  return {tiles,drawings};
}
export function objectKey(doc){return doc.getFlag(MODULE_ID,OBJECT);}
export function reconcilePlan(existing,desired){
  const wanted=new Map(desired.map(d=>[d.flags[MODULE_ID][OBJECT],d]));
  const update=[],remove=[],create=[];
  for(const doc of existing){
    const key=objectKey(doc);
    if(typeof key!=="string")continue;
    if(!wanted.has(key)){remove.push(doc.id);continue;}
    update.push({...wanted.get(key),_id:doc.id});wanted.delete(key);
  }
  create.push(...wanted.values());return {update,remove,create};
}
