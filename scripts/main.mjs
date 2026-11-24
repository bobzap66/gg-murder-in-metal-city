import {openChaseDirector} from "../features/chase/director.mjs";
import {openCourtCast} from "../features/courtroom/cast.mjs";
import {openCourtExhibits} from "../features/courtroom/exhibits.mjs";
import {openEvidenceManager} from "../features/investigation/library.mjs";
import {openCourtRoster,importCourtJournals} from "../features/courtroom/roster.mjs";
import {openCourtDirector} from "../features/courtroom/director.mjs";
import {MODULE_ID} from "./features.mjs";
import {Dashboard} from "./dashboard.mjs";
let dashboard;
Hooks.once("init",()=>{
  game.settings.registerMenu(MODULE_ID,"manager",{
    name:"Greene Gaming Adventure Manager",
    label:"Open Adventure Manager",
    hint:"GM-only scene imports, asset library and feature status.",
    icon:"fa-solid fa-sitemap",
    type:Dashboard,
    restricted:true
  });
});
Hooks.once("ready",()=>{
  const module=game.modules.get(MODULE_ID);
  module.api=Object.freeze({
    openEvidenceManager,
    openChaseDirector,
    openCourtDirector,
    openCourtExhibits,
    openCourtCast,
    openCourtRoster,
    importCourtJournals,
    openManager:async()=>{
      if(!game.user?.isGM)throw new Error("GM permission is required.");
      dashboard??=new Dashboard();
      return dashboard.render({force:true});
    }
  });
});
