export const MODULE_ID = "gg-murder-in-metal-city";
export const ROOT = "modules/" + MODULE_ID + "/";
export const FEATURES = Object.freeze([
  {id:"courtroom", title:"Machine Court", sceneName:"Machine Court — Chamber of Resolution", icon:"fa-solid fa-scale-balanced", image:"assets/courtroom/courtroom-background.webp", foreground:"assets/courtroom/counsel-desk-foreground.webp", width:1672, height:941, description:"A cinematic tribunal with five original adjudicators and three court officials.", available:"Populated backdrop, desk overlay, portraits and 16 lighting cues.", pending:"Counsel positions, NPC journals and exhibit controls."},
  {id:"investigation", title:"Investigation Tracker", sceneName:"Investigation — Evidence Board", icon:"fa-solid fa-fingerprint", image:"assets/investigation/evidence-board.webp", width:1672, height:941, description:"A holographic evidence board with eleven slots and a replaceable case subject.", available:"Blank board and twelve evidence card templates.", pending:"Subject editing, journal links, evidence reveal and player interaction."},
  {id:"chase", title:"Chase Through Striving", sceneName:"The Striving Chase — Downgrid Detour", icon:"fa-solid fa-person-running", image:"assets/chase/chase-board-unbranded.webp", width:2172, height:724, description:"Eight illustrated obstacles between the café and the hideout.", available:"Unbranded chase board and card cover.", pending:"Chase points, obstacle reveal and party/drone progress controls."}
].map(Object.freeze));

export function findFeature(id) {
  const feature = FEATURES.find(f => f.id === id);
  if (!feature) throw new Error("Unknown feature: " + id);
  return feature;
}

export function matchingScenes(scenes, id) {
  return Array.from(scenes).filter(s => s.getFlag(MODULE_ID,"feature") === id);
}

export function makeSceneData(feature, folderId, gridless = 0) {
  const level = {name:"Main", elevation:{bottom:0,top:100}, background:{src:ROOT+feature.image}};
  if (feature.foreground) level.foreground = {src:ROOT+feature.foreground};
  return {
    name:feature.sceneName, folder:folderId ?? null, navigation:false, active:false,
    width:feature.width, height:feature.height, padding:0, tokenVision:false,
    grid:{type:gridless,size:100,distance:5,units:"ft"},
    backgroundColor:"#091321",
    levels:[level],
    flags:{[MODULE_ID]:{feature:feature.id,importVersion:1}}
  };
}
