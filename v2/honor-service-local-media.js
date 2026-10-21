/* Browser-local attachment storage for GitHub Pages previews.
   Files never leave the device. Production requires authenticated server storage. */
(function(){
"use strict";
const NAME="honor-v2-service-local-attachments-v1";
let connection;
function open(){
 if(!("indexedDB" in window))return Promise.reject(Error("IndexedDB is unavailable"));
 if(connection)return connection;
 connection=new Promise((resolve,reject)=>{
  const req=indexedDB.open(NAME,1);
  req.onupgradeneeded=()=>{const db=req.result;if(!db.objectStoreNames.contains("files"))db.createObjectStore("files",{keyPath:"key"});};
  req.onsuccess=()=>resolve(req.result);
  req.onerror=()=>reject(req.error||Error("Cannot open local file store"));
 });
 return connection;
}
function key(scope,orderId,field,name){return [scope,orderId,field,name].map(String).join("::")}
async function save(scope,orderId,field,files){
 const db=await open();
 const input=Array.from(files||[]);
 for(const file of input){
  if(!(file instanceof Blob))continue;
  if(file.size>25*1024*1024)throw Error("Each attachment must be smaller than 25 MB");
  await new Promise((resolve,reject)=>{
   const tx=db.transaction("files","readwrite");
   tx.objectStore("files").put({key:key(scope,orderId,field,file.name),scope,orderId:String(orderId),field,name:file.name,type:file.type,blob:file,bytes:file.size});
   tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);
  });
 }
 return input.length;
}
async function list(scope,orderId){
 const db=await open();
 return new Promise((resolve,reject)=>{
  const tx=db.transaction("files","readonly"),request=tx.objectStore("files").getAll();
  request.onsuccess=()=>resolve(request.result.filter(r=>r.scope===scope&&r.orderId===String(orderId)).map(({field,name,bytes,type})=>({field,name,bytes,type})));
  request.onerror=()=>reject(request.error);
 });
}
async function read(scope,orderId,field,name){
 const db=await open();
 return new Promise((resolve,reject)=>{
  const request=db.transaction("files","readonly").objectStore("files").get(key(scope,orderId,field,name));
  request.onsuccess=()=>resolve(request.result?.blob||null);
  request.onerror=()=>reject(request.error);
 });
}
window.HonorServiceLocalMedia={save,list,read};
})();