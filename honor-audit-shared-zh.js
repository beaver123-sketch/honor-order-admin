/* Lightweight cross-page operation log for the demo admin.
   Production audit records must be written by an authenticated server. */
(function(){
 "use strict";
 const KEY="honor-admin-unified-activity-zh-v1";
 const LIMIT=1600;
 const blocked=/webhook|secret|password|token|authorization|credentials/i;
 const omit=new Set(["history","notifications","notifyConfigRef","fileNames","giftReferenceImageData"]);
 const serial=v=>{
   if(v===null||v===undefined)return "";
   if(typeof v==="object"){try{return JSON.stringify(v).slice(0,220)}catch(_){return "[Object]"}}
   return String(v).slice(0,220);
 };
 const OPERATOR_KEY="honor-admin-overseas-operator-zh-v1";
 function actor(){
   // The operator is the employee performing the action, not the assigned owner.
   let stored="";
   try{stored=localStorage.getItem(OPERATOR_KEY)||""}catch(_){}
   return String(window.HonorCurrentOperatorEnglish||stored||"").trim()||"Unknown";
 }
 function setOperator(name){
   const value=String(name||"").trim();
   if(!value||value.length>80||!/[A-Za-z]/.test(value))return false;
   window.HonorCurrentOperatorEnglish=value;
   try{localStorage.setItem(OPERATOR_KEY,value)}catch(_){}
   return true;
 }
 function requestOperator(alwaysConfirm){
   const previous=actor()==="Unknown"?"":actor();
   if(!alwaysConfirm&&previous)return previous;
   const typed=window.prompt("海外操作员工（英文名）：",previous);
   if(typed===null)return null;
   if(!setOperator(typed)){
    window.alert("请输入有效的员工英文名。");
    return null;
   }
   return actor();
 }
 function relevant(source){
   const out={};
   if(!source||typeof source!=="object")return out;
   Object.keys(source).forEach(key=>{
     if(!omit.has(key)&&!blocked.test(key)&&typeof source[key]!=="function"){
       out[key]=serial(source[key]);
     }
   });
   return out;
 }
 function differences(before,after){
   const a=relevant(before),b=relevant(after);
   return [...new Set([...Object.keys(a),...Object.keys(b)])].filter(k=>a[k]!==b[k])
     .slice(0,45).map(field=>({field,before:a[field]||"",after:b[field]||""}));
 }
 function read(){
   try{const saved=JSON.parse(localStorage.getItem(KEY)||"[]");return Array.isArray(saved)?saved:[]}
   catch(_){return []}
 }
 function record(input){
   if(!input||!input.module||!input.action)return false;
   const created=new Date();
   const entry={
     id:String(created.getTime())+String(Math.floor(Math.random()*100000)).padStart(5,"0"),
     when:created.toLocaleString("sv-SE",{hour12:false}),
     module:input.module==="honor"?"honor":"service",
     orderId:String(input.orderId||"").slice(0,80),
     actor:String(input.actor||actor()).slice(0,100),
     action:String(input.action).slice(0,40),
     detail:String(input.detail||"").slice(0,500),
     changes:Array.isArray(input.changes)?input.changes.slice(0,45):differences(input.before,input.after)
   };
   try{localStorage.setItem(KEY,JSON.stringify([entry,...read()].slice(0,LIMIT)));return true}
   catch(_){return false}
 }
 window.HonorAudit={record,read,differences,actor,setOperator,requestOperator};
})();