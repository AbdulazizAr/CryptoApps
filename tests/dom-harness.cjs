const fs=require('node:fs'),vm=require('node:vm');
function load(file){
 const html=fs.readFileSync(file,'utf8'),elements=new Map(),events=[];
 function element(id='',value=''){return {id,value,textContent:'',innerHTML:'',style:{},dataset:{},children:[],classList:{add(){},remove(){},toggle(){},contains(){return false}},addEventListener(type,fn){events.push({id,type,fn})},appendChild(e){this.children.push(e);return e},setAttribute(){},getAttribute(){return null},querySelectorAll(){return []},querySelector(){return null},matches(){return false},remove(){},click(){},scrollIntoView(){}}}
 for(const tag of html.matchAll(/<[\w-]+\b[^>]*\bid=["']([^"']+)["'][^>]*>/g)){elements.set(tag[1],element(tag[1],tag[0].match(/\bvalue=["']([^"']*)/)?.[1]||''))}
 const document={getElementById:id=>elements.get(id)||null,createElement:()=>element(),querySelectorAll:()=>[],querySelector:()=>null,addEventListener(type,fn){events.push({id:'document',type,fn})},body:element()};
 const storage=new Map();const c=vm.createContext({document,localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},navigator:{clipboard:{writeText:async()=>{}}},console:{log(){},warn(){},error(){}},TextEncoder,TextDecoder,Uint8Array,Uint32Array,ArrayBuffer,DataView,Buffer,setTimeout(){},clearTimeout(){},setInterval(){},clearInterval(){},alert(){},Blob,URL,btoa:s=>Buffer.from(s,'binary').toString('base64')});c.window=c;c.addEventListener=(type,fn)=>events.push({id:'window',type,fn});
 for(const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)){if(!m[1].includes('src='))vm.runInContext(m[2],c,{filename:file,timeout:10000});}
 return {c,elements,events,run:code=>vm.runInContext(code,c,{timeout:10000})};
}
module.exports={load};
