import {ROOT,FEATURES} from "./features.mjs";
import {MAX_BYTES} from "./configuration-format.mjs";
import {exportConfiguration,previewConfiguration,importConfiguration} from "./configuration.mjs";
import {disableContentActions} from "./window-busy.mjs";
const {ApplicationV2,HandlebarsApplicationMixin}=foundry.applications.api;
let app;
function requireGM(){if(!game.user?.isGM)throw Error("GM permission is required.");}
function download(data){
  const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"});
  const url=URL.createObjectURL(blob),link=document.createElement("a");
  link.href=url;link.download="gg-mimc-private-"+data.mode+"-"+new Date().toISOString().slice(0,10)+".json";
  document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
class ConfigurationApp extends HandlebarsApplicationMixin(ApplicationV2){
  static DEFAULT_OPTIONS={id:"gg-mimc-configuration",classes:["gg-mimc-window"],window:{title:"Greene Gaming — Portable Configuration",resizable:true},position:{width:760,height:720},actions:{export:ConfigurationApp.exportAction,preview:ConfigurationApp.previewAction,apply:ConfigurationApp.applyAction}};
  static PARTS={body:{template:ROOT+"templates/configuration.hbs"}};
  _busy=false;_raw=null;_preview=null;_filename="";_mapping="{}";_log=[];_mode="preparation";_features=new Set(FEATURES.map(f=>f.id));_macros=true;_replace=false;_progress=false;
  _canRender(options){return game.user?.isGM&&super._canRender(options);}
  async _prepareContext(options){
    requireGM();return {...await super._prepareContext(options),features:FEATURES.map(f=>({...f,selected:this._features.has(f.id)})),modes:[{id:"setup",name:"Setup and configuration"},{id:"preparation",name:"Adventure preparation"},{id:"campaign",name:"Campaign state"}].map(m=>({...m,selected:m.id===this._mode})),macros:this._macros,filename:this._filename,mapping:this._mapping,preview:this._preview,canApply:!!this._preview&&!this._preview.missing.length,campaign:this._preview?.data.mode==="campaign",replace:this._replace,progress:this._progress,log:this._log};
  }
  field(name){return this.element.querySelector('[name="'+name+'"]');}
  invalidate(){this._preview=null;this._progress=false;this._log=[];if(this.rendered)this.render();}
  async _onRender(context,options){
    await super._onRender(context,options);
    this.field("mode")?.addEventListener("change",e=>this._mode=e.target.value);
    this.field("macros")?.addEventListener("change",e=>this._macros=e.target.checked);
    for(const b of this.element.querySelectorAll("[data-feature]"))b.addEventListener("change",()=>b.checked?this._features.add(b.dataset.feature):this._features.delete(b.dataset.feature));
    this.field("file")?.addEventListener("change",async e=>{
      try{
        const f=e.target.files?.[0];this._raw=null;this._filename="";this._preview=null;this._progress=false;this._log=[];
        if(!f)return;
        if(f.size>MAX_BYTES)throw Error("Configuration exceeds 8 MB.");
        this._raw=JSON.parse(await f.text());this._filename=f.name;
      }catch(err){ui.notifications.error(err.message);}finally{if(this.rendered)await this.render();}
    });
    this.field("mapping")?.addEventListener("input",e=>{
      this._mapping=e.target.value;this._preview=null;this._progress=false;
      const button=this.element.querySelector('[data-action="apply"]');if(button)button.disabled=true;
      const status=this.element.querySelector("[data-preview-status]");if(status)status.textContent="Mapping changed. Preview again before applying.";
    });
    this.field("replace")?.addEventListener("change",e=>this._replace=e.target.checked);
    this.field("progress")?.addEventListener("change",e=>this._progress=e.target.checked);
  }
  async run(fn){
    requireGM();if(this._busy)return;this._busy=true;const restore=disableContentActions(this.element);
    try{await fn();}catch(e){console.error(e);ui.notifications.error(e.message??String(e));}
    finally{this._busy=false;restore();if(this.rendered)await this.render();}
  }
  static async exportAction(){await this.run(async()=>{download(await exportConfiguration({mode:this._mode,features:[...this._features],macros:this._macros}));ui.notifications.info("Private configuration JSON exported.");});}
  static async previewAction(){await this.run(async()=>{if(!this._raw)throw Error("Choose a configuration JSON file first.");this._preview=null;this._progress=false;this._preview=await previewConfiguration(this._raw,JSON.parse(this._mapping||"{}"));});}
  static async applyAction(){await this.run(async()=>{
    if(!this._preview||this._preview.missing.length)throw Error("Preview and resolve missing assets first.");
    if(!this.field("confirm")?.checked)throw Error("Confirm you have backed up the destination world and reviewed the preview.");
    if(this._replace&&!this.field("confirmReplace")?.checked)throw Error("Confirm managed replacement.");
    const opts={mapping:JSON.parse(this._mapping||"{}"),replace:this._replace,restoreProgress:this._progress};
    this._preview=null;
    this._log=await importConfiguration(this._raw,opts);
    ui.notifications.info("Configuration applied. Refresh open feature panels.");
  });}
}
export async function openConfiguration(){requireGM();app??=new ConfigurationApp();return app.render({force:true});}
