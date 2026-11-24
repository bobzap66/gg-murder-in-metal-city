import {assetPaths,validateConfiguration,MAX_BYTES} from "./configuration-format.mjs";
export const PACKAGE_LIMIT=80*1024*1024;
const IMAGE_LIMIT=12*1024*1024;
const MIME={png:"image/png",webp:"image/webp",jpg:"image/jpeg",jpeg:"image/jpeg"};
const namePattern=/^assets\/[a-z0-9][a-z0-9_-]{0,100}\.(png|webp|jpe?g)$/;
const decoder=new TextDecoder("utf-8",{fatal:true});
function fail(message){throw Error("Invalid preparation ZIP: "+message);}
const crcTable=Uint32Array.from({length:256},(_,i)=>{let n=i;for(let j=0;j<8;j++)n=(n&1)?(0xedb88320^(n>>>1)):n>>>1;return n>>>0;});
export function crc32(bytes){let c=0xffffffff;for(const b of bytes)c=crcTable[(c^b)&255]^(c>>>8);return (c^0xffffffff)>>>0;}
function imageSignature(bytes,ext){
  if(ext==="png")return bytes.length>=24&&[137,80,78,71,13,10,26,10].every((b,i)=>bytes[i]===b);
  if(ext==="webp")return bytes.length>=16&&String.fromCharCode(...bytes.subarray(0,4))==="RIFF"&&String.fromCharCode(...bytes.subarray(8,12))==="WEBP";
  return bytes.length>=4&&bytes[0]===255&&bytes[1]===216&&bytes[2]===255;
}
async function inflate(data,size){
  if(typeof DecompressionStream!=="function")fail("this client cannot decompress ZIP; use an uncompressed ZIP.");
  const reader=new Blob([data]).stream().pipeThrough(new DecompressionStream("deflate-raw")).getReader();
  const out=new Uint8Array(size);let offset=0;
  try{while(true){const {done,value}=await reader.read();if(done)break;if(offset+value.length>size){await reader.cancel();fail("decompressed size exceeds header");}out.set(value,offset);offset+=value.length;}}
  finally{reader.releaseLock();}
  if(offset!==size)fail("incorrect decompressed size");return out;
}
export async function parsePackage(input,catalog){
  const b=input instanceof Uint8Array?input:new Uint8Array(input);
  if(b.length>PACKAGE_LIMIT||b.length<22)fail("size limit or truncated archive");
  const v=new DataView(b.buffer,b.byteOffset,b.byteLength),u16=o=>v.getUint16(o,true),u32=o=>v.getUint32(o,true);
  let e=-1;
  for(let p=b.length-22;p>=Math.max(0,b.length-65557);p--){if(u32(p)===0x06054b50&&p+22+u16(p+20)===b.length){e=p;break;}}
  if(e<0||u16(e+4)||u16(e+6)||u16(e+8)!==u16(e+10))fail("missing or multi-disk directory");
  const count=u16(e+10),start=u32(e+16),end=start+u32(e+12);
  if(count<1||count>101||end!==e||start>e)fail("invalid central directory");
  const entries=new Map(),ranges=[];let pos=start,total=0;
  for(let i=0;i<count;i++){
    if(pos+46>end||u32(pos)!==0x02014b50)fail("invalid directory entry");
    const flags=u16(pos+8),method=u16(pos+10),crc=u32(pos+16),packed=u32(pos+20),size=u32(pos+24),nl=u16(pos+28),xl=u16(pos+30),cl=u16(pos+32),local=u32(pos+42);
    if(flags&~0x808||![0,8].includes(method)||u16(pos+34)!==0||pos+46+nl+xl+cl>end)fail("unsupported or encrypted entry");
    const name=decoder.decode(b.subarray(pos+46,pos+46+nl));pos+=46+nl+xl+cl;
    if(name!=="configuration.json"&&!namePattern.test(name))fail("unexpected file "+name);
    if(entries.has(name))fail("duplicate file "+name);
    const limit=name==="configuration.json"?MAX_BYTES:IMAGE_LIMIT;
    total+=size;if(size>limit||total>PACKAGE_LIMIT||!size||!packed)fail("uncompressed size limit");
    if(local+30>start||u32(local)!==0x04034b50||u16(local+6)!==flags||u16(local+8)!==method)fail("invalid local header");
    const ln=u16(local+26),lx=u16(local+28),dataStart=local+30+ln+lx,dataEnd=dataStart+packed;
    if(dataStart>start||dataEnd>start||decoder.decode(b.subarray(local+30,local+30+ln))!==name)fail("local header mismatch");
    if(ranges.some(([a,z])=>local<z&&dataEnd>a))fail("overlapping files");ranges.push([local,dataEnd]);
    if(!(flags&8)&&(u32(local+14)!==crc||u32(local+18)!==packed||u32(local+22)!==size))fail("local sizes differ");
    if(method===0&&packed!==size)fail("stored size differs");
    const data=method===0?b.slice(dataStart,dataEnd):await inflate(b.subarray(dataStart,dataEnd),size);
    if(crc32(data)!==crc)fail("checksum mismatch: "+name);
    entries.set(name,data);
  }
  if(pos!==end||!entries.has("configuration.json"))fail("configuration.json required");
  const raw=JSON.parse(decoder.decode(entries.get("configuration.json")));
  const config=validateConfiguration(raw,catalog),referenced=new Set(assetPaths(config)),assets=[];
  for(const [path,bytes] of entries){
    if(path==="configuration.json")continue;
    if(!referenced.has(path))fail("unreferenced asset "+path);
    const ext=path.split(".").pop();if(!imageSignature(bytes,ext))fail("invalid image "+path);
    assets.push({path,bytes,mime:MIME[ext]});
  }
  for(const path of referenced)if(namePattern.test(path)&&!entries.has(path))fail("missing bundled asset "+path);
  return {config,assets};
}
/** No uploads occur until GM explicitly confirms. Use platform FilePicker, including Forge proxy. */
export async function uploadPackageAssets(pkg,existing={}){
  if(!game.user?.isGM)throw Error("GM permission required.");
  const picker=foundry.applications.apps.FilePicker.implementation??foundry.applications.apps.FilePicker;
  const missing=pkg.assets.filter(a=>!Object.hasOwn(existing,a.path));
  if(!missing.length)return {...existing};
  const dir="gg-mimc-prep-"+crypto.randomUUID().replace(/-/g,"");
  const created=await picker.createDirectory("data",dir);
  if(created===false||created?.error)throw Error("Could not create asset folder: "+dir);
  const mapping={...existing};
  for(const a of missing){
    // Use opaque filenames so undiscovered evidence is not advertised by its filename.
    const name=crypto.randomUUID().replace(/-/g,"")+"."+a.path.split(".").pop();
    const result=await picker.upload("data",dir,new File([a.bytes],name,{type:a.mime}),{},{notify:false});
    if(typeof result?.path!=="string"||!result.path||result.error)throw Error("Could not upload "+a.path+". Previously uploaded files may remain in "+dir);
    mapping[a.path]=result.path;
  }
  return mapping;
}
