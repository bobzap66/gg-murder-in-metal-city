import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {crc32,parsePackage,buildPackage} from "../scripts/configuration-package.mjs";
import {FORMAT} from "../scripts/configuration-format.mjs";
const catalog=JSON.parse(readFileSync("features/investigation/catalog.json","utf8"));
const raw={format:FORMAT,schemaVersion:1,mode:"preparation",features:["investigation"],scenes:[{feature:"investigation",name:"Board",subject:{name:"Subject",image:"assets/subject.png"}}],drafts:[],officials:[],macros:true};
const png=new Uint8Array(24);png.set([137,80,78,71,13,10,26,10]);
const bytes=v=>new TextEncoder().encode(v);
function zip(items){
  const locals=[],centrals=[];let offset=0;
  for(const [name,data] of items){
    const n=bytes(name),l=Buffer.alloc(30+n.length+data.length),c=Buffer.alloc(46+n.length),crc=crc32(data);
    l.writeUInt32LE(0x04034b50);l.writeUInt16LE(20,4);l.writeUInt32LE(crc,14);l.writeUInt32LE(data.length,18);l.writeUInt32LE(data.length,22);l.writeUInt16LE(n.length,26);l.set(n,30);l.set(data,30+n.length);
    c.writeUInt32LE(0x02014b50);c.writeUInt16LE(20,4);c.writeUInt16LE(20,6);c.writeUInt32LE(crc,16);c.writeUInt32LE(data.length,20);c.writeUInt32LE(data.length,24);c.writeUInt16LE(n.length,28);c.writeUInt32LE(offset,42);c.set(n,46);offset+=l.length;locals.push(l);centrals.push(c);
  }
  const directory=Buffer.concat(centrals),end=Buffer.alloc(22);end.writeUInt32LE(0x06054b50);end.writeUInt16LE(items.length,8);end.writeUInt16LE(items.length,10);end.writeUInt32LE(directory.length,12);end.writeUInt32LE(offset,16);
  return Buffer.concat([...locals,directory,end]);
}
const config=()=>["configuration.json",bytes(JSON.stringify(raw))];
test("stored ZIP validates preparation JSON and referenced image",async()=>{
 const p=await parsePackage(zip([config(),["assets/subject.png",png]]),catalog);assert.equal(p.config.mode,"preparation");assert.equal(p.assets[0].path,"assets/subject.png");
});
test("reject unexpected paths, duplicate names, unreferenced files and missing assets",async()=>{
 for(const entries of [[config(),["../subject.png",png]],[config(),["assets/subject.png",png],["assets/subject.png",png]],[config(),["assets/extra.png",png]],[config()],[config(),["assets/subject.png",bytes("not an image")]]])await assert.rejects(parsePackage(zip(entries),catalog));
});
test("reject corrupted stored data",async()=>{const z=zip([config(),["assets/subject.png",png]]);z[50]^=1;await assert.rejects(parsePackage(z,catalog));});

test("export round trip deduplicates images, preserves campaign progress and private/public separation",async()=>{
 const path="https://assets.example.com/private/art.png",builtin="modules/gg-murder-in-metal-city/assets/investigation/drone-scan.webp";
 const record={title:"Clue",templateId:"drone-scan",image:path,values:{field1:"private revision",field2:"",notes:""},gmNotes:"GM SECRET"};
 const published={...record,values:{field1:"original snapshot",field2:"",notes:""}};
 const source={...raw,mode:"campaign",scenes:[{...raw.scenes[0],subject:{name:"Subject",image:path},placements:[{slot:"evidence-01",key:"clue"}]}],drafts:[{key:"clue",record,published},{key:"builtin",record:{...record,image:builtin}}]};
 const reads=[],progress=[];
 const result=await buildPackage(source,catalog,{readAsset:async p=>{reads.push(p);return png;},onProgress:p=>progress.push(p.done)});
 assert.deepEqual(reads,[path]);assert.equal(result.count,1);assert.deepEqual(progress,[0,1]);
 const restored=await parsePackage(await result.blob.arrayBuffer(),catalog);
 assert.deepEqual(restored.config,result.config);
 assert.deepEqual(restored.assets[0].bytes,png);
 assert.equal(restored.config.scenes[0].subject.image,restored.config.drafts[0].record.image);
 assert.equal(restored.config.drafts[0].published.image,restored.config.drafts[0].record.image);
 assert.equal(restored.config.drafts[1].record.image,builtin);
 assert.equal(restored.config.drafts[0].record.gmNotes,"GM SECRET");
 assert.equal(restored.config.drafts[0].published.gmNotes,undefined);
 assert.equal(restored.config.drafts[0].published.values.field1,"original snapshot");
 assert.equal(restored.config.scenes[0].placements[0].key,"clue");
 assert.equal(source.drafts[0].record.image,path);
});
test("export identifies type from bytes and supports an archive without custom artwork",async()=>{
 const webp=new Uint8Array(16);webp.set(bytes("RIFF"),0);webp.set(bytes("WEBP"),8);
 const result=await buildPackage(raw,catalog,{readAsset:async()=>webp});
 const parsed=await parsePackage(await result.blob.arrayBuffer(),catalog);
 assert.equal(parsed.assets[0].path,"assets/image-001.webp");
 const empty={...raw,scenes:[]};
 const zero=await buildPackage(empty,catalog,{readAsset:async()=>{throw Error("unexpected fetch");}});
 assert.equal((await parsePackage(await zero.blob.arrayBuffer(),catalog)).assets.length,0);
});
test("export fails closed for inaccessible, unsupported and oversized custom images",async()=>{
 for(const readAsset of [async()=>{throw Error("CORS");},async()=>bytes("HTML"),async()=>new Uint8Array(12*1024*1024+1)])await assert.rejects(buildPackage(raw,catalog,{readAsset}),/Cannot package artwork/);
});
