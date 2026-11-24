import {escapeHTML} from "../investigation/records.mjs";
export const TRIAL="courtTrial", SCREEN="court-exhibit";
export const DISPLAY_RECT=Object.freeze({x:.338,y:.486,width:.324,height:.135});
export function initialTrial(){return {version:1,target:0,next:1,exhibits:[],events:[]};}
export function trialState(raw){return raw?.version===1?structuredClone(raw):initialTrial();}
export function recordEvent(state,action,entry=null,at=new Date().toISOString()){
  state.events.push({at,action,...(entry?{number:entry.number,title:entry.title,journalId:entry.journalId}:{})});
}
export function present(state,journalId,title,at){
  if(!journalId||!title)throw new Error("A published journal and title are required.");
  let e=state.exhibits.find(e=>e.journalId===journalId);
  if(!e){e={journalId,title:String(title),number:state.next++,admitted:false};state.exhibits.push(e);}
  recordEvent(state,"Presented",e,at);return e;
}
export function admission(state,journalId,value,at){
  const e=state.exhibits.find(e=>e.journalId===journalId);
  if(!e)throw new Error("Present the exhibit before admitting it.");
  if(e.admitted===value)return false;
  e.admitted=value;recordEvent(state,value?"Admitted":"Admission withdrawn",e,at);return true;
}
export function setTarget(state,value,at){
  const n=Number(value);if(!Number.isInteger(n)||n<0||n>999)throw new Error("Enter a whole number from 0 to 999.");
  state.target=n;recordEvent(state,"Admission target set to "+n,null,at);
}
export function summary(state,available){
  const ids=new Set(available);
  const rows=state.exhibits.map(e=>({...e,available:ids.has(e.journalId)}));
  const admitted=rows.filter(e=>e.admitted&&e.available).length;
  return {rows,admitted,target:state.target,hasTarget:state.target>0,targetReached:state.target>0&&admitted>=state.target,unavailable:rows.filter(e=>e.admitted&&!e.available).length};
}
export function trialHTML(state,available){
  const s=summary(state,available);
  return "<h2>Exhibit register</h2><p>Currently available admitted exhibits: "+s.admitted+(s.hasTarget?" / "+s.target:" (no target configured)")+". This is an administrative count, not a verdict.</p>"+
    (s.rows.length?"<ol>"+s.rows.map(e=>"<li><strong>Exhibit "+e.number+" — "+escapeHTML(e.title)+"</strong>: "+(e.admitted?"Admitted":"Not admitted")+(e.available?"":"; published evidence unavailable")+"</li>").join("")+"</ol>":"<p>No exhibits presented.</p>")+
    "<h2>Proceedings log</h2>"+(state.events.length?"<ul>"+state.events.map(e=>"<li>"+escapeHTML(e.at)+" — "+escapeHTML(e.action)+(e.number?" — Exhibit "+e.number+": "+escapeHTML(e.title):"")+"</li>").join("")+"</ul>":"<p>No exhibit actions recorded.</p>");
}
