import {parsePackage,uploadPackageAssets,PACKAGE_LIMIT} from "./configuration-package.mjs";
import {loadEvidenceCatalog} from "../features/investigation/library.mjs";
import {ROOT,FEATURES} from "./features.mjs";
import {MAX_BYTES} from "./configuration-format.mjs";
import {exportConfiguration,previewConfiguration,importConfiguration} from "./configuration.mjs";
import {disableContentActions} from "./window-busy.mjs";
const {ApplicationV2,HandlebarsApplicationMixin}=foundry.applications.api;
let app;
function requireGM(){if(!game.user?.isGM)throw Error("GM permission is required.");}
function download(text,filename){
  const blob=new Blob([text],{type:"application/json"});
  const url=URL.createObjectURL(blob),link=document.createElement("a");
  link.href=url;link.download=filename;
  document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);
}
class ConfigurationApp extends HandlebarsApplicationMixin(ApplicationV2){
  static DEFAULT_OPTIONS={id:"gg-mimc-configuration",classes:["gg-mimc-window"],window:{title:"Greene Gaming — Portable Configuration",resizable:true},position:{width:760,height:720},actions:{export:ConfigurationApp.exportAction,preview:ConfigurationApp.previewAction,apply:ConfigurationApp.applyAction,saveFile:ConfigurationApp.saveFileAction,copyJSON:ConfigurationApp.copyAction,selectJSON:ConfigurationApp.selectAction,loadPasted:ConfigurationApp.pasteAction}};
  static PARTS={body:{template:ROOT+"templates/configuration.hbs"}};
  _busy=false;_package=null;_exportText="";_exportName="";_raw=null;_preview=null;_filename="";_mapping="{}";_log=[];_mode="preparation";_features=new Set(FEATURES.map(f=>f.id));_macros=true;_replace=false;_progress=false;
  _canRender(options){return game.user?.isGM&&super._canRender(options);}
  async _prepareContext(options){
    requireGM();return {...await super._prepareContext(options),features:FEATURES.map(f=>({...f,selected:this._features.has(f.id)})),modes:[{id:"setup",name:"Setup and configuration"},{id:"preparation",name:"Adventure preparation"},{id:"campaign",name:"Campaign state"}].map(m=>({...m,selected:m.id===this._mode})),macros:this._macros,exportText:this._exportText,exportName:this._exportName,filename:this._filename,mapping:this._mapping,preview:this._preview,packageCount:this._package?.assets.length??0,canApply:!!this._preview&&!this._preview.missing.length,campaign:this._preview?.data.mode==="campaign",replace:this._replace,progress:this._progress,log:this._log};
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
        const f=e.target.files?.[0];this._package=null;this._raw=null;this._filename="";this._preview=null;this._progress=false;this._log=[];
        if(!f)return;
        if(/\.zip$/i.test(f.name)){
          if(f.size>PACKAGE_LIMIT)throw Error("ZIP exceeds 80 MB.");
          this._package=await parsePackage(await f.arrayBuffer(),await loadEvidenceCatalog());this._raw=this._package.config;
        }else{if(f.size>MAX_BYTES)throw Error("Configuration exceeds 8 MB.");this._raw=JSON.parse(await f.text());}
        this._filename=f.name;
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
  static async exportAction(){await this.run(async()=>{
    this._exportText="";this._exportName="";
    const data=await exportConfiguration({mode:this._mode,features:[...this._features],macros:this._macros});
    this._exportText=JSON.stringify(data,null,2);
    this._exportName="gg-mimc-private-"+data.mode+"-"+new Date().toISOString().slice(0,10)+".json";
    ui.notifications.info("JSON prepared: "+this._exportName+". Choose Save file or Copy JSON below.");
  });}
  static async saveFileAction(){
    requireGM();if(this._busy||!this._exportText)return;
    // Save picker needs a direct user gesture. Electron builds may not expose it.
    if(typeof globalThis.showSaveFilePicker==="function"){
      try{
        const handle=await globalThis.showSaveFilePicker({suggestedName:this._exportName,types:[{description:"JSON configuration",accept:{"application/json":[".json"]}}]});
        const writer=await handle.createWritable();await writer.write(this._exportText);await writer.close();
        ui.notifications.info("Saved "+handle.name+" to your selected location.");return;
      }catch(e){if(e.name==="AbortError")return;ui.notifications.warn("Save dialog unavailable. Use Copy JSON or try a browser download.");}
    }
    download(this._exportText,this._exportName);
    ui.notifications.info("Requested download: "+this._exportName+". If no file appears, copy the JSON and save it with a text editor.");
  }
  static selectAction(){requireGM();if(this._busy)return;const field=this.field("exportText");field?.focus();field?.select();}
  static async copyAction(){
    requireGM();if(this._busy||!this._exportText)return;
    try{if(!navigator.clipboard?.writeText)throw Error("Clipboard API unavailable");await navigator.clipboard.writeText(this._exportText);ui.notifications.info("Private JSON copied. Paste into a text editor or the destination import panel.");}
    catch(e){ConfigurationApp.selectAction.call(this);ui.notifications.warn("JSON selected. Press Ctrl+C to copy manually.");}
  }
  static async pasteAction(){
    const value=this.field("pasted")?.value??"";
    await this.run(async()=>{
      this._package=null;this._raw=null;this._filename="";this._preview=null;this._progress=false;this._log=[];
      if(new Blob([value]).size>MAX_BYTES)throw Error("Configuration exceeds 8 MB.");
      this._raw=JSON.parse(value);this._filename="Pasted JSON";
      ui.notifications.info("Pasted JSON loaded. Validate & preview before applying.");
    });
  }
  async _onClose(options){
    this._exportText="";this._exportName="";this._package=null;this._raw=null;this._preview=null;this._filename="";this._mapping="{}";this._log=[];this._progress=false;
    await super._onClose(options);
  }
  static async previewAction(){await this.run(async()=>{if(!this._raw)throw Error("Choose a configuration JSON file first.");this._preview=null;this._progress=false;this._preview=await previewConfiguration(this._raw,JSON.parse(this._mapping||"{}"),this._package?.assets.map(a=>a.path)??[]);});}
  static async applyAction(){await this.run(async()=>{
    if(!this._preview||this._preview.missing.length)throw Error("Preview and resolve missing assets first.");
    if(!this.field("confirm")?.checked)throw Error("Confirm you have backed up the destination world and reviewed the preview.");
    if(this._replace&&!this.field("confirmReplace")?.checked)throw Error("Confirm managed replacement.");
    const opts={mapping:JSON.parse(this._mapping||"{}"),replace:this._replace,restoreProgress:this._progress};
    if(this._package?.assets.length&&!this.field("confirmAssets")?.checked)throw Error("Confirm custom asset uploads before importing.");
    this._preview=null;
    if(this._package?.assets.length){ui.notifications.info("Uploading packaged artwork to the destination asset library.");opts.mapping=await uploadPackageAssets(this._package,opts.mapping);this._mapping=JSON.stringify(opts.mapping,null,2);}
    this._log=await importConfiguration(this._raw,opts);
    ui.notifications.info("Configuration applied. Refresh open feature panels.");
  });}
}
export async function openConfiguration(){requireGM();app??=new ConfigurationApp();return app.render({force:true});}
