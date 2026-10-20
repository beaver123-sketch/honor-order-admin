(function(){
"use strict";
const $=id=>document.getElementById(id);
const KEY="honor-service-orders-v1";
const POLICY_KEY="honor-service-notify-policies-v1";
const T={
 title:"Honor Service Orders",
 all:"All",
 types:{unban:"Account Unban",banner:"Banner & Splash",gift:"Custom Gift",ride:"Custom Ride"},
 statuses:{pending:"Pending",processed:"Processed",returned:"Returned",returning:"Returning"},
 unbanStatuses:{pending:"Pending",progress:"In Progress",unbanned:"Unbanned",failed:"Failed"},
 displayTypes:{
 "banner-24h":"Banner-24h",
 "banner-48h":"Banner-48h",
 "splash-24h":"Splash-24h",
 "splash-48h":"Splash-48h",
 "splash-55h":"Splash-55h",
 "splash-72h":"Splash-72h"
},
 stages:{none:"Not Set",materials:"Collecting Materials",design:"UI Design",review:"Awaiting Approval",ready:"Ready to Launch",launched:"Launched"},
 sources:{redeemed:"Redeemed",vip:"VIP",overseas:"OVERSEAS",other:"Other"},
 durations:{"1 month":"1 month","2 months":"2 months","3 months":"3 months","6 months":"6 months"},
 giftTypes:{regular:"Regular",limited:"Limited"}
};
// Webhook URLs are sensitive: hold them only in page memory, never localStorage or order data.
const ORDER_TYPES=["unban","banner","gift","ride"];
const safeRef=v=>String(v??"").trim().length>0;
function loadPolicies(){
 const initial=Object.fromEntries(ORDER_TYPES.map(t=>[t,{enabled:false,webhookRef:""}]));
 try{
  const stored=JSON.parse(localStorage.getItem(POLICY_KEY)||"{}");
  ORDER_TYPES.forEach(t=>{
   if(stored[t]&&typeof stored[t]==="object"){
    initial[t]={enabled:!!stored[t].enabled,webhookRef:safeRef(stored[t].webhookRef)?String(stored[t].webhookRef):""};
   }
  });
 }catch(_){}
 return initial;
}
let policies=loadPolicies();
const getPolicy=type=>policies[type]||{enabled:false,webhookRef:""};
const readyPolicy=type=>{const p=getPolicy(type);return p.enabled&&safeRef(p.webhookRef)};
const selectedIds=new Set();
const CSV_HEADERS=["Service Order ID","Redeemed Order ID","Order Type","Benefit Name","User ID","Username","Nationality","Honor Wall ID","Order Status","Order Time","Assigned To","Updated Time","Operator","Actions"];
const operatorLabel=o=>{
 if(o.operatorEnglish&&String(o.operatorEnglish).trim())return String(o.operatorEnglish);
 if(o.demo){
  const matched=(String(o.id||"").match(/^HS-DEMO-(\d+)$/)||[])[1];
  if(matched)return ["Maya Chen (Demo)","Olivia Tan (Demo)","Noah Lee (Demo)","Daniel Kim (Demo)"][(Number(matched)-1)%4];
 }
 return "";
};
const exportFields=o=>[o.id,o.redeemedOrderId||"",T.types[o.orderType]||o.orderType,o.benefitName||"",o.userId,o.username||"",countryLabel(o.nationality),o.honorWallId||"",T.statuses[o.orderStatus]||o.orderStatus,dateOut(o.createdAt),o.assignedTo||"",dateOut(o.updatedAt),operatorLabel(o),""];
function exportCSV(){
 const visible=filtered();
 const chosen=selectedIds.size?visible.filter(o=>selectedIds.has(o.id)):visible;
 if(!chosen.length){toast("No orders to export",true);return}
 const actual=[...document.querySelectorAll(".so-table thead th:not(.so-select-col)")].map(x=>x.textContent.trim());
 if(actual.length!==14||actual.some((x,i)=>x!==CSV_HEADERS[i])){toast("Export headers not ready",true);return}
 const sanitize=v=>{
  let str=String(v??"");
  if(/^[\s\x00-\x1F]*[=+@-]/.test(str))str="'"+str; // Excel CSV formula injection prevention.
  return '"'+str.replace(/"/g,'""')+'"';
 };
 const csv="\ufeff"+[actual,...chosen.map(exportFields)].map(row=>row.map(sanitize).join(",")).join("\r\n");
 const url=URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8;"}));
 const a=document.createElement("a");
 a.href=url;a.download="honor-service-orders-"+new Date().toISOString().slice(0,10)+".csv";
 document.body.appendChild(a);a.click();a.remove();
 setTimeout(()=>URL.revokeObjectURL(url),1000);
 auditRecord("Export","",null,null,"Exported "+chosen.length+" selected or filtered orders");
 toast("Exported "+chosen.length+" orders");
}
const C=[
 ["Pakistan","巴基斯坦"],["India","印度"],["Saudi Arabia","沙特阿拉伯"],
 ["Egypt","埃及"],["Indonesia","印度尼西亚"],["Malaysia","马来西亚"],
 ["Philippines","菲律宾"],["Vietnam","越南"],["Bangladesh","孟加拉国"],
 ["Nepal","尼泊尔"],["United Arab Emirates","阿联酋"],["United States","美国"],
 ["United Kingdom","英国"],["Japan","日本"],["Thailand","泰国"],
 ["Singapore","新加坡"],["Nigeria","尼日利亚"],["Cambodia","柬埔寨"],
 ["Myanmar","缅甸"],["Taiwan (China)","台湾（中国）"]
];
const common=[
 {k:"orderType",l:"Order Type",req:1,kind:"select",opts:T.types},
 {k:"redeemedOrderId",l:"Redeemed Order ID",placeholder:"Digits only",inputmode:"numeric"},
 {k:"benefitName",l:"Benefit Name"},
 {k:"userId",l:"User ID",inputmode:"numeric"},
 {k:"username",l:"Username"},
 {k:"nationality",l:"Nationality",list:"soCountryList"},
 {k:"redemptionTime",l:"Redemption Time",kind:"datetime-local"},
 {k:"orderSource",l:"Order Source",kind:"select",opts:T.sources},
 {k:"orderStatus",l:"Order Status",req:1,kind:"select",opts:T.statuses},
 {k:"processingStage",l:"Processing Stage",kind:"select",opts:T.stages},
 {k:"assignedTo",l:"Assigned To",placeholder:"Enter assignee name"},
 {k:"operatorEnglish",l:"Operator (English Name)",req:1,placeholder:"Enter overseas operator English name"},
 {k:"whatsapp",l:"WhatsApp"},
 {k:"notes",l:"Notes",kind:"textarea",wide:1}
];
const byType={
 unban:[
  {k:"accountId",l:"Account ID",req:1},
  {k:"accountNationality",l:"Account Nationality",req:1,list:"soCountryList"},
  {k:"suspensionReason",l:"Suspension Reason",kind:"textarea"},
  {k:"unbanStatus",l:"Unban Status",req:1,kind:"select",opts:T.unbanStatuses}

 ],
 banner:[
  {k:"displayType",l:"Type",req:1,kind:"select",opts:T.displayTypes},
  {k:"displayRegion",l:"Display Region"},
  {k:"configLink",l:"Config Link",kind:"text",placeholder:"Enter text"},
  {k:"color",l:"Color",kind:"text",placeholder:"Enter color name, code or description"},
  {k:"copy",l:"Copy",kind:"textarea"},
  {k:"wording",l:"Wording",kind:"textarea"},
  {k:"image",l:"Image",kind:"multi-file",accept:"image/*",wide:1,hint:"Multiple reference images; browser-only storage"},
  {k:"startTime",l:"Start Time",kind:"datetime-local"},
  {k:"endTime",l:"End Time",kind:"datetime-local"},
  {k:"finalDesign",l:"Final Design",kind:"file",accept:"image/*,.pdf",wide:1},
  {k:"processingUI",l:"UI Designer",kind:"mention",placeholder:"Type @ to search and select a UI designer",hint:"Assign one UI designer per order"},
  {k:"groupLink",l:"Group Link",kind:"text",placeholder:"WhatsApp link"},

 ],
 gift:[
  {k:"honorWallId",l:"Honor Wall ID"},
  {k:"availableCountries",l:"Available Countries",placeholder:"Pakistan, Egypt",hint:"Separate multiple countries with commas"},
  {k:"giftType",l:"Gift Type",req:1,kind:"select",opts:T.giftTypes},
  {k:"giftName",l:"Gift Name"},
  {k:"giftDescription",l:"Gift Description",kind:"textarea",hint:"Maximum 10 words"},
  {k:"giftImage",l:"Gift Image",kind:"file",accept:"image/*",wide:1},
  {k:"giftReferenceImage",l:"Gift Reference Image",kind:"image-upload",wide:1},
  {k:"giftVideo",l:"Gift Video",kind:"file",accept:"video/*",wide:1},
  {k:"processingUI",l:"UI Designer",kind:"mention",placeholder:"Type @ to search and select a UI designer",hint:"Assign one UI designer per order"},
  {k:"giftPrice",l:"Gift Price",kind:"number",hint:"Regular ≥177,000 coins; Limited ≥600,000"},
  {k:"validDuration",l:"Valid Duration",kind:"select",opts:T.durations},
  {k:"groupLink",l:"Group Link",kind:"text",placeholder:"WhatsApp link"},

 ],
 ride:[
  {k:"honorWallId",l:"Honor Wall ID"},
  {k:"theme",l:"Theme"},
  {k:"backgroundScene",l:"Background / Scene",kind:"textarea",wide:1},
  {k:"rideName",l:"Ride Name"},
  {k:"referenceMedia",l:"Reference Image or Video",kind:"file",accept:"image/*,video/*",wide:1},
  {k:"designFiles",l:"Design Files",kind:"file",accept:"image/*,video/*,.pdf,.zip",wide:1},
  {k:"processingUI",l:"UI Designer",kind:"mention",placeholder:"Type @ to search and select a UI designer",hint:"Assign one UI designer per order"},
  {k:"groupLink",l:"Group Link",kind:"text",placeholder:"WhatsApp link"},

 ]
};
const escapeHtml=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const nowLocal=()=>{let d=new Date(),tz=d.getTimezoneOffset()*60000;return new Date(d.getTime()-tz).toISOString().slice(0,16)};
const stamp=()=>nowLocal().replace("T"," ")+":00";
const dateOut=v=>String(v||"—").replace("T"," ");
let orders=[];
try{const x=JSON.parse(localStorage.getItem(KEY)||"[]");if(Array.isArray(x))orders=x}catch(_){}
// First-load sample orders: merge by ID without replacing previously entered records.
const DEMO_SEED_KEY="honor-service-demo-seeded-v1";
// Preserve existing user records while assigning deterministic numeric IDs.
function numericIdentifier(value,kind){
 const raw=String(value??"").trim();if(!raw||/^\d+$/.test(raw))return raw;
 let m=raw.match(/^HS-DEMO-(\d+)$/i);if(m)return "91"+m[1].padStart(8,"0");
 m=raw.match(/^RD-DEMO-(\d+)$/i);if(m)return "81"+m[1].padStart(8,"0");
 m=raw.match(/^HS-(\d{8})-(\d+)$/i);if(m)return m[1]+m[2].padStart(4,"0");
 let h=2166136261;for(const ch of raw)h=Math.imul(h^ch.charCodeAt(0),16777619)>>>0;
 return (kind==="redeemed"?"82":"92")+String(h).padStart(10,"0");
}
function normalizeOrder(row){return {...row,id:numericIdentifier(row.id,"service"),redeemedOrderId:numericIdentifier(row.redeemedOrderId,"redeemed")};}
try{
 const updated=orders.map(normalizeOrder);
 if(updated.some((r,i)=>r.id!==orders[i].id||r.redeemedOrderId!==orders[i].redeemedOrderId))localStorage.setItem(KEY,JSON.stringify(updated));
 orders=updated;
}catch(_){}
const demoRows=(Array.isArray(window.HONOR_SERVICE_DEMO_ORDERS)?window.HONOR_SERVICE_DEMO_ORDERS:[]).map(normalizeOrder);
try{
 if(!localStorage.getItem(DEMO_SEED_KEY)&&demoRows.length){
  const ids=new Set(orders.map(o=>String(o.id)));
  const missing=demoRows.filter(o=>!ids.has(String(o.id)));
  const combined=orders.concat(missing);
  localStorage.setItem(KEY,JSON.stringify(combined));
  localStorage.setItem(DEMO_SEED_KEY,"1");
  orders=combined;
 }
}catch(_){
 // Still show mock orders when browser storage is disabled, without deleting existing data.
 const ids=new Set(orders.map(o=>String(o.id)));
 orders=orders.concat(demoRows.filter(o=>!ids.has(String(o.id))));
}
let filters={},page=1,pageSize=20,editor=null;
function defaultDraft(){
 return {orderType:"unban",redeemedOrderId:"",userId:"",nationality:"",redemptionTime:"",orderSource:"redeemed",processingStage:"none",
  orderStatus:"pending",assignedTo:"",scheduleStart:"",scheduleEnd:"",giftReferenceImage:"",giftReferenceImageData:"",operatorEnglish:((window.HonorAudit?.actor()||"Unknown")==="Unknown"?"":window.HonorAudit.actor()),whatsapp:"",notes:"",benefitName:"",uiDesigner:"",processingUI:"",
  unbanStatus:"pending",displayType:"banner-24h",giftType:"regular",giftPrice:"177000",validDuration:"2 months",
  notifyEnabled:!!readyPolicy("unban"),notifyConfigRef:"",
  history:[],notifications:[]};
}
function toast(msg,bad){
 const div=document.createElement("div");div.className="so-toast"+(bad?" error":"");div.textContent=msg;document.body.appendChild(div);
 setTimeout(()=>div.remove(),3000);
}
function store(next){
 try{localStorage.setItem(KEY,JSON.stringify(next));orders=next;return true}
 catch(e){toast("Unable to save locally",true);return false}
}
function countryLabel(v){const found=C.find(c=>c[0].toLowerCase()===String(v||"").toLowerCase());return found?found[0]:v||"—"}
const REGION_GROUPS=[
 {id:"all",title:"All Key",countries:null},
 {id:"south",title:"South Asia",countries:["Pakistan","India","Bangladesh","Nepal","Bhutan","Sri Lanka","Maldives"]},
 {id:"philippines",title:"Philippines",countries:["Philippines"]},
 {id:"russian",title:"Russian-speaking",countries:["Ukraine","Russia","Kazakhstan","Uzbekistan","Belarus"]},
 {id:"latam",title:"South America",countries:["Brazil","Argentina","Chile","Colombia","Peru"]},
 {id:"western",title:"Europe & US",countries:["United States","United Kingdom","Ireland","France","Germany","Canada"]},
 {id:"africa",title:"Africa",countries:["Nigeria","Egypt","Morocco","South Africa","Kenya"]},
 {id:"middleeast",title:"Middle East",countries:["Saudi Arabia","United Arab Emirates","Qatar","Oman","Kuwait","Bahrain"]},
 {id:"virtual",title:"Virtual Area",countries:[]},
 {id:"vietnam",title:"Vietnam",countries:["Vietnam"]},
 {id:"indomalay",title:"India & Malaysia",countries:["India","Indonesia","Malaysia","Singapore"]}
];
function countries(){
 const names=new Set(C.map(c=>c[0]));
 REGION_GROUPS.forEach(g=>(g.countries||[]).forEach(n=>names.add(n)));
 orders.forEach(o=>{
  for(const value of [o.nationality,o.accountNationality,o.displayRegion,...String(o.availableCountries||"").split(",")]){
   const name=String(value||"").trim();if(name)names.add(name);
  }
 });
 return [...names].sort((a,b)=>a.localeCompare(b));
}
function pickerSummary(values,placeholder){
 return values.length===0?placeholder:values.length===1?values[0]:values.length+" selected";
}
function getRegionSelection(widget){
 try{return [...new Set(JSON.parse(widget.dataset.selected||"[]"))].filter(Boolean)}
 catch(_){return []}
}
function listForRegion(regionId){
 if(regionId==="all")return countries();
 const group=REGION_GROUPS.find(g=>g.id===regionId);
 return group?(group.countries||[]):[];
}
function regionPanelHtml(widget,kind,query){
 const selected=getRegionSelection(widget);
 const title=kind==="search"?"Search Results":kind==="selected"?"Selected Countries":(REGION_GROUPS.find(g=>g.id===kind)?.title||"Countries");
 const q=String(query||"").toLowerCase().trim();
 const all=kind==="search"?countries():kind==="selected"?selected:listForRegion(kind);
 const list=all.filter(country=>!q||country.toLowerCase().includes(q));
 const controls=list.map(country=>'<label class="so-region-option"><input type="checkbox" data-region-country="'+escapeHtml(country)+'"'+(selected.includes(country)?' checked':'')+'><span>'+escapeHtml(country)+'</span></label>').join("");
 return '<div class="so-region-panel-title">'+escapeHtml(title)+' <span>'+list.length+'</span><button type="button" data-region-close="true">×</button></div>'+
 '<div class="so-region-choices">'+(controls||'<div class="so-region-no-result">No countries available</div>')+'</div>';
}
function regionInner(widget){
 const selected=getRegionSelection(widget),single=widget.dataset.mode==="single";
 const regions=REGION_GROUPS.map(g=>{
   const values=listForRegion(g.id);
   const marked=values.length>0&&values.every(c=>selected.includes(c));
   const partial=!marked&&values.some(c=>selected.includes(c));
   return '<div class="so-region-category'+(partial?' partial':'')+'">'+
    '<button class="so-region-arrow" type="button" data-region-open="'+g.id+'" aria-label="Expand '+escapeHtml(g.title)+'">▸</button>'+
    '<label class="so-region-check"><input type="checkbox" data-region-group-check="'+g.id+'"'+(marked?' checked':'')+
      (single||!values.length?' data-single="true"':'')+'><span>'+escapeHtml(g.title)+'</span></label></div>';
 }).join("");
 return '<div class="so-region-line">'+
  '<div class="so-region-groups">'+regions+'</div>'+
  '<div class="so-region-tools"><input class="so-region-search" type="search" placeholder="Search country" autocomplete="off" aria-label="Search country">'+
  '<button type="button" class="so-region-tool-btn" data-region-show="selected">Show Selected'+(selected.length?' ('+selected.length+')':'')+'</button>'+
  '<button type="button" class="so-region-tool-btn" data-region-clear="true">Clear Selection</button></div></div>'+
  '<div class="so-region-panel" hidden></div>';
}
function renderRegionWidget(widget,selection){
 const selected=selection===undefined?getRegionSelection(widget):selection;
 widget.dataset.selected=JSON.stringify(selected);
 widget.innerHTML=regionInner(widget);
}
function fieldCountries(f,v,readonly){
 const k=f.k,multi=k==="availableCountries"||k==="displayRegion";
 const selections=String(v||"").split(",").map(x=>x.trim()).filter(Boolean);
 const attr=' data-field="'+escapeHtml(k)+'" id="so-edit-'+escapeHtml(k)+'"';
 if(readonly)return '<input class="so-input"'+attr+' disabled value="'+escapeHtml(selections.join(", "))+'">';
 // The data-selected attribute keeps selections between nested group changes without changing form serialization.
 const region='<div class="so-region-widget" data-mode="'+(multi?'multi':'single')+'" data-region-field="'+escapeHtml(k)+
  '" data-selected="'+escapeHtml(JSON.stringify(selections))+'"></div>';
 return '<div class="so-region-form">'+
  '<input type="hidden"'+attr+' value="'+escapeHtml(v)+'">'+
  region+'</div>';
}
function initFormRegionWidgets(){
 $("soModalBody").querySelectorAll('.so-region-widget[data-region-field]').forEach(w=>renderRegionWidget(w));
}
function renderFilterCountryOptions(){
 const widget=$("soFilterRegions");
 if(widget)renderRegionWidget(widget);
}
function fillCountries(){renderFilterCountryOptions()}
function updateCountrySummary(){return}
function closeRegionPanel(widget){
 const panel=widget?.querySelector(".so-region-panel");
 if(!panel)return;
 panel.hidden=true;
 panel.dataset.active="";
 widget.classList.remove("is-open");
 widget.querySelectorAll(".so-region-arrow").forEach(b=>b.classList.remove("active"));
}
function regionOpenPanel(widget,kind,query){
 const panel=widget.querySelector(".so-region-panel");
 if(!panel)return;
 // Search updates should never toggle or close an already open panel.
 if(kind!=="search"&&panel.dataset.active===kind&&!panel.hidden){
  closeRegionPanel(widget);
  return;
 }
 panel.dataset.active=kind;
 panel.innerHTML=regionPanelHtml(widget,kind,query);
 panel.hidden=false;
 widget.classList.add("is-open");
 widget.querySelectorAll(".so-region-arrow").forEach(b=>b.classList.toggle("active",b.dataset.regionOpen===kind));
}
function syncRegionWidget(widget){
 const selected=getRegionSelection(widget),single=widget.dataset.mode==="single";
 widget.querySelectorAll("[data-region-group-check]").forEach(checkbox=>{
  const values=listForRegion(checkbox.dataset.regionGroupCheck);
  const count=values.filter(value=>selected.includes(value)).length;
  checkbox.checked=values.length>0&&(single?count>0:count===values.length);
  checkbox.indeterminate=!single&&count>0&&count<values.length;
  checkbox.closest(".so-region-category")?.classList.toggle("partial",!single&&count>0&&count<values.length);
 });
 const show=widget.querySelector("[data-region-show]");
 if(show)show.textContent="Show Selected"+(selected.length?" ("+selected.length+")":"");
 const panel=widget.querySelector(".so-region-panel");
 if(panel&&!panel.hidden){
  const kind=panel.dataset.active;
  if(kind==="selected"){
   // Refresh the selected list only, keeping the category panel state intact.
   panel.innerHTML=regionPanelHtml(widget,"selected","");
  }else{
   panel.querySelectorAll("[data-region-country]").forEach(input=>input.checked=selected.includes(input.dataset.regionCountry));
  }
 }
}
function applyRegionSelection(widget,values,openKey){
 const selected=[...new Set(values)].filter(Boolean);
 const normalized=widget.dataset.mode==="single"?selected.slice(0,1):selected;
 widget.dataset.selected=JSON.stringify(normalized);
 const field=widget.dataset.regionField;
 if(field){
  const hidden=widget.parentElement.querySelector('[data-field="'+field+'"]');
  if(hidden){
   const next=normalized.join(", ");
   hidden.value=next;
   if(editor){editor.data[field]=next;editor.changed=true}
  }
 }
 syncRegionWidget(widget);
 // A single-country choice is complete after picking one country.
 if(widget.dataset.mode==="single"&&normalized.length)closeRegionPanel(widget);
}
function regionClick(widget,e){
 const control=e.target.closest("[data-region-open],[data-region-show],[data-region-clear],[data-region-close]");
 if(!control)return;
 if(control.hasAttribute("data-region-open")){
  regionOpenPanel(widget,control.dataset.regionOpen);return;
 }
 if(control.hasAttribute("data-region-show")){
  regionOpenPanel(widget,"selected");return;
 }
 if(control.hasAttribute("data-region-clear")){
  applyRegionSelection(widget,[]);
  const search=widget.querySelector(".so-region-search");
  if(search)search.value="";
  closeRegionPanel(widget);
  return;
 }
 if(control.hasAttribute("data-region-close")){
  closeRegionPanel(widget);
 }
}
function regionChange(widget,e){
 const input=e.target;
 const selected=getRegionSelection(widget);
 if(input.hasAttribute("data-region-group-check")){
  const kind=input.dataset.regionGroupCheck,values=listForRegion(kind);
  if(widget.dataset.mode==="single"||values.length===0){
   input.checked=!input.checked;
   regionOpenPanel(widget,kind);
   return;
  }
  const next=input.checked?[...new Set(selected.concat(values))]:selected.filter(x=>!values.includes(x));
  applyRegionSelection(widget,next);
 }else if(input.hasAttribute("data-region-country")){
  const value=input.dataset.regionCountry;
  const next=widget.dataset.mode==="single"?(input.checked?[value]:[]):(input.checked?selected.concat(value):selected.filter(x=>x!==value));
  applyRegionSelection(widget,next);
 }
}
function regionSearch(widget,e){
 if(!e.target.matches(".so-region-search"))return;
 const query=e.target.value;
 if(!query.trim()){
  const panel=widget.querySelector(".so-region-panel");
  if(panel?.dataset.active==="search")closeRegionPanel(widget);
  return;
 }
 regionOpenPanel(widget,"search",query);
}
function assignees(){
 const names=[...new Set(orders.map(o=>o.assignedTo).filter(Boolean))];
 const sel=$("soFilterAssignee"),old=sel.value;
 sel.innerHTML='<option value="">All</option>'+names.map(x=>'<option value="'+escapeHtml(x)+'">'+escapeHtml(x)+'</option>').join("");
 sel.value=names.includes(old)?old:"";
 const list=$("soAssigneeList");
 list.innerHTML=[...new Set(["Jackson W YANG","MA-Emillia","Jimmy SW YUE",...names])].map(x=>'<option value="'+escapeHtml(x)+'"></option>').join("");
}
function applyFilters(){
 filters={
  serviceId:$("soFilterServiceId").value.trim().toLowerCase(),
  redeemedId:$("soFilterRedeemedId").value.trim().toLowerCase(),
  type:$("soFilterType").value,
  uid:$("soFilterUid").value.trim().toLowerCase(),
  nationalities:getRegionSelection($("soFilterRegions")).map(i=>i.toLowerCase()),
  status:$("soFilterStatus").value,from:$("soFilterStart").value,to:$("soFilterEnd").value,assignee:$("soFilterAssignee").value
 };
 selectedIds.clear();page=1;render();
}
function filtered(){
 return orders.filter(o=>
  (!filters.serviceId||String(o.id).toLowerCase().includes(filters.serviceId))&&
  (!filters.redeemedId||String(o.redeemedOrderId||"").toLowerCase().includes(filters.redeemedId))&&
  (!filters.type||o.orderType===filters.type)&&
  (!filters.uid||String(o.userId).toLowerCase().includes(filters.uid))&&
  (!filters.nationalities?.length||filters.nationalities.includes(String(o.nationality||"").toLowerCase()))&&
  (!filters.status||o.orderStatus===filters.status)&&
  (!filters.from||String(o.createdAt||"").slice(0,10)>=filters.from)&&
  (!filters.to||String(o.createdAt||"").slice(0,10)<=filters.to)&&
  (!filters.assignee||o.assignedTo===filters.assignee)
 ).sort((a,b)=>String(b.createdAt).localeCompare(String(a.createdAt)));
}
function statusHtml(v){return '<span class="so-pill '+escapeHtml(v)+'">'+escapeHtml(T.statuses[v]||v)+'</span>'}
function tr(o){
 const buttons='<div class="so-action-row">'+[
  '<button type="button" class="so-action-btn edit" data-action="edit" data-id="'+escapeHtml(o.id)+'">Edit</button>',
  o.orderStatus==="pending"?'<button type="button" class="so-action-btn complete" data-action="complete" data-id="'+escapeHtml(o.id)+'">Complete</button>':"",
  (o.orderStatus==="pending"||o.orderStatus==="processed")?'<button type="button" class="so-action-btn return" data-action="return" data-id="'+escapeHtml(o.id)+'">Return</button>':""
 ].filter(Boolean).join("")+'</div>';
 return '<tr><td class="so-select-cell"><input type="checkbox" class="so-row-check" data-select-id="'+escapeHtml(o.id)+'" aria-label="Select order '+escapeHtml(o.id)+'"'+(selectedIds.has(o.id)?" checked":"")+'></td><td class="so-strong">'+escapeHtml(o.id)+'</td><td>'+escapeHtml(o.redeemedOrderId||"—")+'</td>'+
 '<td>'+escapeHtml(T.types[o.orderType]||o.orderType)+'</td><td>'+escapeHtml(o.benefitName||"—")+'</td>'+
 '<td>'+escapeHtml(o.userId)+'</td><td>'+escapeHtml(o.username||"—")+'</td>'+
 '<td>'+escapeHtml(countryLabel(o.nationality))+'</td><td>'+escapeHtml(o.honorWallId||"—")+'</td>'+
 '<td>'+statusHtml(o.orderStatus)+'</td><td>'+escapeHtml(dateOut(o.createdAt))+'</td>'+
 '<td>'+escapeHtml(o.assignedTo||"—")+'</td><td>'+escapeHtml(dateOut(o.updatedAt))+'</td>'+
 '<td>'+escapeHtml(operatorLabel(o)||"—")+'</td>'+
 '<td class="so-actions-cell"><div class="so-action-buttons">'+buttons+'</div></td></tr>';
}
function updateSelectionUI(currentPage){
 const items=currentPage||filtered().slice((page-1)*pageSize,page*pageSize);
 const active=items.filter(o=>selectedIds.has(o.id)).length;
 const head=$("soSelectAll");
 if(head){head.checked=items.length>0&&active===items.length;head.indeterminate=active>0&&active<items.length;head.disabled=items.length===0}
 const count=$("soSelectedCount");
 if(count)count.textContent=selectedIds.size?selectedIds.size+" selected":"";
}
function render(){
 const matches=filtered(),count=matches.length,pages=Math.max(1,Math.ceil(count/pageSize));
 page=Math.max(1,Math.min(page,pages));
 const subset=matches.slice((page-1)*pageSize,page*pageSize);
 $("soTableBody").innerHTML=subset.length?subset.map(tr).join(""):'<tr><td colspan="15" class="so-empty">No Data</td></tr>';
 updateSelectionUI(subset);
 $("soCount").textContent="Total "+count;
 $("soPage").textContent=String(page)+" / "+String(pages);
 $("soPageSummary").textContent="Total "+count+" records";
 $("soPrev").disabled=page<=1;$("soNext").disabled=page>=pages;
 fillCountries();assignees();
}
function fieldHtml(f,d,readonly){
 const k=f.k,v=d[k]??"",attr=' data-field="'+escapeHtml(k)+'" id="so-edit-'+escapeHtml(k)+'"';
 let ctrl="",help=f.hint||"";
 if(f.kind==="select"){
  const entries=Object.entries(f.opts);
  // Allow saved legacy Banner/Splash orders to retain their historical Type when editing.
  if(v&&!Object.prototype.hasOwnProperty.call(f.opts,String(v))){
   entries.unshift([String(v),String(v)==="banner"?"Banner (legacy)":String(v)==="splash"?"Splash (legacy)":String(v)]);
  }
  let opts=entries.map(([key,label])=>'<option value="'+escapeHtml(key)+'"'+(key===String(v)?" selected":"")+'>'+escapeHtml(label)+'</option>').join("");
  ctrl='<select'+attr+(readonly||k==="orderType"&&editor.mode!=="add"?" disabled":"")+'>'+opts+'</select>';
 }else if(["nationality","accountNationality","availableCountries","displayRegion"].includes(k)){
  ctrl=fieldCountries(f,v,readonly);
 }else if(f.kind==="mention"){
  ctrl='<div class="so-mention-wrap"><input class="so-input" type="text"'+attr+
    (readonly?' disabled':'')+' value="'+escapeHtml(v)+'"'+
    ' placeholder="'+escapeHtml(f.placeholder||"Type @ to select a designer")+'">'+
    (readonly?'':'<div class="so-mention-menu" hidden role="listbox"></div>')+'</div>';
 }else if(f.kind==="image-upload"){
  const preview=String(d.giftReferenceImageData||"");
  const safePreview=/^data:image\/(?:jpeg|png|webp);base64,[a-zA-Z0-9+/=]+$/.test(preview)?preview:"";
  ctrl='<div class="so-gift-ref">'+
    (readonly?'':'<label class="so-button so-upload-label" for="so-upload-giftReferenceImage">Upload Reference Image</label>'+
      '<input type="file" id="so-upload-giftReferenceImage" data-gift-ref-upload accept="image/png,image/jpeg,image/webp" class="so-native-file">'+
      '<button class="so-button so-ref-remove" type="button" data-gift-ref-clear'+(!v?' hidden':'')+'>Remove</button>')+
    '<input type="hidden"'+attr+' value="'+escapeHtml(v)+'">'+
    '<span class="so-gift-ref-filename">'+escapeHtml(v||"No file selected")+'</span>'+
    '<img class="so-gift-ref-preview" alt="Gift reference preview" src="'+escapeHtml(safePreview)+'"'+(safePreview?'':' hidden')+'>'+
    (readonly?'':'<small class="so-hint">Demo preview saved in this browser; no server upload. PNG / JPG / WebP.</small>')+
   '</div>';
 }else if(f.kind==="textarea"){
  ctrl='<textarea'+attr+(readonly?" disabled":"")+' placeholder="'+escapeHtml(f.placeholder||"Please enter")+'">'+escapeHtml(v)+'</textarea>';
 }else if(f.kind==="file"){
  ctrl='<div class="so-preview-box">'+(readonly?"":'<label class="so-button so-upload-label" for="so-file-'+escapeHtml(k)+'">Upload File</label><input id="so-file-'+escapeHtml(k)+'" data-file-for="'+escapeHtml(k)+'" type="file" accept="'+escapeHtml(f.accept||"*/*")+'" class="so-native-file">')+
    '<span class="so-media-name">'+(v?escapeHtml(v):"No file")+'</span>'+
    '<input class="so-input"'+attr+' type="text"'+(readonly?" disabled":"")+' value="'+escapeHtml(v)+'" placeholder="File URL">'+
    (/^https?:\/\//i.test(String(v))?'<a class="so-cell-action" href="'+escapeHtml(v)+'" target="_blank" rel="noopener noreferrer">Download File</a>':"")+'</div>';
  help="File name or link only; no server upload";
 }else{
  const type=f.kind||"text",ph=f.placeholder||"Please enter";
  ctrl='<input class="so-input"'+attr+' type="'+escapeHtml(type)+'" value="'+escapeHtml(v)+'"'+(readonly?" disabled":"")+
    (type==="number"?' min="0" step="1"':"")+(f.list?' list="'+f.list+'"':"")+' placeholder="'+escapeHtml(ph)+'">';
 }
 return '<div class="so-control'+(f.wide||["nationality","accountNationality","availableCountries","displayRegion"].includes(k)?" wide":"")+'"><label class="so-control-label" for="so-edit-'+escapeHtml(k)+'">'+escapeHtml(f.l)+(f.req?'<span class="so-required">*</span>':"")+'</label>'+ctrl+(help?'<small class="so-hint">'+escapeHtml(help)+'</small>':"")+'</div>';
}
function openOrder(mode,id){
 const existing=orders.find(x=>x.id===id);
 if(mode!=="add"&&!existing){toast("Order not found",true);return}
 const data=mode==="add"?defaultDraft():JSON.parse(JSON.stringify(existing));
 // Merge old per-category Notes into the one shared Notes editor without deleting archived fields.
 if(existing){
  const extras=["unbanNotes","bannerNotes","giftNotes","rideNotes"].map(k=>String(existing[k]||"").trim()).filter(Boolean);
  for(const x of extras){if(!String(data.notes||"").includes(x))data.notes=(String(data.notes||"").trim()?String(data.notes).trim()+"\n":"")+x;}
 }
 if(mode==="edit"){
   const active=window.HonorAudit?.actor();
   if(active&&active!=="Unknown")data.operatorEnglish=active;
 }
 if(data.notifyEnabled===undefined)data.notifyEnabled=false;
 editor={mode,id:id||null,data,before:existing?JSON.parse(JSON.stringify(existing)):null,changed:false};
 $("soModal").classList.add("open");
 $("soModal").setAttribute("aria-hidden","false");
 paintOrder();
}
const UI_DESIGNERS=["Jackson W YANG","Luka YM GAO","MA-Emillia"];
function mentionContext(text,caret){
 const left=String(text||"").slice(0,caret);
 const at=left.lastIndexOf("@");
 if(at<0||left.slice(at).includes("\n")||left.length-at>70)return null;
 const query=left.slice(at+1);
 if(!query||UI_DESIGNERS.some(name=>name.toLowerCase().includes(query.toLowerCase())))return {start:at,end:caret,query};
 return null;
}
function hideMention(root){
 const menu=root?.querySelector(".so-mention-menu");
 if(menu){menu.hidden=true;menu.innerHTML="";}
}
function showMention(input){
 const root=input.closest(".so-mention-wrap"),menu=root?.querySelector(".so-mention-menu");
 if(!menu)return;
 const point=mentionContext(input.value,input.selectionStart);
 if(!point){hideMention(root);return}
 const options=UI_DESIGNERS.filter(name=>name.toLowerCase().includes(point.query.toLowerCase()));
 if(!options.length){hideMention(root);return}
 menu.dataset.start=String(point.start);
 menu.dataset.end=String(point.end);
 menu.innerHTML=options.map((name,i)=>'<button type="button" role="option" class="so-mention-choice'+(i===0?' selected':'')+
   '" data-mention-name="'+escapeHtml(name)+'">@'+escapeHtml(name)+'</button>').join("");
 menu.hidden=false;
}
function chooseMention(button){
 const root=button.closest(".so-mention-wrap"),input=root?.querySelector("input[data-field=processingUI]");
 if(!input||!editor)return;
 const menu=root.querySelector(".so-mention-menu");
 // Processing UI represents a single UI designer, not a progress note.
 // Replace the entire field so selecting a new employee cannot append another person.
 const name=button.dataset.mentionName;
 const next="@"+name;
 input.value=next;
 input.focus();input.setSelectionRange(next.length,next.length);
 editor.data.processingUI=next;editor.changed=true;
 hideMention(root);
}
function loadReferenceImage(file){
 if(!file||!editor)return;
 if(!/^image\/(png|jpeg|webp)$/.test(file.type)||file.size>8*1024*1024){
  toast("Choose a JPG, PNG or WebP image under 8 MB",true);return;
 }
 const ed=editor;
 ed.imageProcessing=true;
 const objectUrl=URL.createObjectURL(file);
 const img=new Image();
 img.onload=()=>{
  URL.revokeObjectURL(objectUrl);
  if(editor!==ed)return;
  try{
   const factor=Math.min(1,1100/Math.max(img.naturalWidth,img.naturalHeight));
   const canvas=document.createElement("canvas");
   canvas.width=Math.max(1,Math.round(img.naturalWidth*factor));
   canvas.height=Math.max(1,Math.round(img.naturalHeight*factor));
   const ctx=canvas.getContext("2d");
   if(!ctx)throw Error("Canvas unsupported");
   ctx.fillStyle="#ffffff";ctx.fillRect(0,0,canvas.width,canvas.height);
   ctx.drawImage(img,0,0,canvas.width,canvas.height);
   const data=canvas.toDataURL("image/jpeg",0.78);
   if(data.length>1600000)throw Error("Preview too large");
   ed.data.giftReferenceImage=file.name;
   ed.data.giftReferenceImageData=data;
   ed.changed=true;
   const box=$("soModalBody").querySelector(".so-gift-ref");
   if(box){
    const name=box.querySelector("[data-field=giftReferenceImage]");
    const label=box.querySelector(".so-gift-ref-filename");
    const pic=box.querySelector(".so-gift-ref-preview");
    const remove=box.querySelector("[data-gift-ref-clear]");
    if(name)name.value=file.name;
    if(label)label.textContent=file.name;
    if(pic){pic.src=data;pic.hidden=false}
    if(remove)remove.hidden=false;
   }
  }catch(_){toast("Could not prepare the reference image",true)}
  finally{ed.imageProcessing=false}
 };
 img.onerror=()=>{URL.revokeObjectURL(objectUrl);if(editor===ed){ed.imageProcessing=false;toast("Cannot read the selected image",true)}};
 img.src=objectUrl;
}
function collectForm(){
 if(!editor)return;
 $("soModalBody").querySelectorAll("[data-field]").forEach(n=>{if(n.disabled)return;editor.data[n.dataset.field]=n.value});
}

function paintOrder(){
 const ed=editor;if(!ed)return;
 const mode=ed.mode,d=ed.data,readonly=mode==="view";
 const heading=mode==="add"?"Add Order":mode==="edit"?"Edit"+d.id:"Order Details"+d.id;
 $("soModalTitle").textContent=heading;
 $("soModalSubtitle").textContent=readonly?"View":"All required fields marked *";
 $("soTypeTag").textContent=T.types[d.orderType]||"—";
 const head='<section class="so-section"><h3 class="so-section-title">Basic Information</h3><div class="so-field-grid">'+common.filter(f=>mode!=="add"||f.k!=="benefitName").map(f=>fieldHtml(f,d,readonly)).join("")+'</div></section>';
 const specifics='<section class="so-section"><h3 class="so-section-title">'+escapeHtml(T.types[d.orderType])+'</h3><div class="so-field-grid">'+(byType[d.orderType]||[]).map(f=>fieldHtml(f,d,readonly)).join("")+'</div></section>';
 const scheduleFields=[{k:"scheduleStart",l:"Start Date",kind:"date"},{k:"scheduleEnd",l:"End Date",kind:"date"}];
 const schedule='<section class="so-section so-schedule-section"><h3 class="so-section-title">Schedule</h3><div class="so-field-grid">'+scheduleFields.map(f=>fieldHtml(f,d,readonly)).join("")+'</div></section>';
 $("soModalBody").innerHTML='<div class="so-validation" id="soFormError"></div>'+head+specifics+schedule;
 initFormRegionWidgets();
 $("soModalBody").scrollTop=0;
 $("soModalFooter").innerHTML=(readonly?
  '<button class="so-button" type="button" data-foot="activity">Activity Log</button><button class="so-button" type="button" data-foot="history">Notification History</button><span class="so-spacer"></span><button class="so-button" type="button" data-foot="close">Close</button><button class="so-button primary" type="button" data-foot="edit">Edit</button>':
  '<button class="so-button" type="button" data-foot="cancel">Cancel</button><button class="so-button primary" type="button" data-foot="save">Save</button>');
}
function fail(msg){
 const n=$("soFormError");n.textContent=msg;n.classList.add("visible");n.scrollIntoView({block:"nearest",behavior:"smooth"});toast(msg,true);return false
}
function check(d){
 if(!Object.keys(T.types).includes(d.orderType))return fail("Please select a valid order type");
 if(!Object.keys(T.statuses).includes(d.orderStatus))return fail("Please select a valid status");
 for(const f of [...common,...(byType[d.orderType]||[])]){
  if(f.req&&!String(d[f.k]??"").trim())return fail("Please complete "+f.l);
 }
 if(d.redeemedOrderId&&!/^\d+$/.test(String(d.redeemedOrderId)))return fail("Redeemed Order ID must contain digits only");
 if(d.orderType==="gift"){
  const price=String(d.giftPrice??"").trim();
  if(price){
   const amount=Number(price),minimum=d.giftType==="limited"?600000:177000;
   // Historical low-price records remain editable at their original price.
   const original=editor?.before;
   const grandfathered=editor?.mode==="edit"&&original&&String(original.giftPrice??"")===price;
   if((!Number.isFinite(amount)||amount<minimum)&&!grandfathered)return fail("Gift Price is below the current minimum");
  }
  const description=String(d.giftDescription||"").trim();
  const unchanged=editor?.mode==="edit"&&String(editor?.before?.giftDescription||"").trim()===description;
  if(description&&description.split(/\s+/).length>10&&!unchanged)return fail("Gift description must be within 10 words");
  if(!Object.keys(T.giftTypes).includes(d.giftType))return fail("Invalid gift type");
 }
 if(d.orderType==="banner"){
  if(d.startTime&&d.endTime&&d.endTime<=d.startTime)return fail("End Time must be after Start Time");
  if(d.processingStage==="launched"&&(!d.startTime||!d.endTime))return fail("Please set actual display start and end times before marking as Launched");
 }
 if(d.scheduleStart&&d.scheduleEnd&&d.scheduleEnd<d.scheduleStart)return fail("Schedule end date cannot be earlier than start date");
 return true;
}

function newId(){
 let id;do{id=String(Date.now())+String(Math.floor(Math.random()*1000)).padStart(3,"0");}
 while(orders.some(o=>String(o.id)===id));return id;
}
function diff(a,b){
 if(!a)return "Created service order";
 const changed=[...common,...(byType[b.orderType]||[]),{k:"scheduleStart",l:"Start Date"},{k:"scheduleEnd",l:"End Date"}].filter(x=>String(a[x.k]??"")!==String(b[x.k]??"")).map(x=>x.l);
 return changed.length?"Updated: "+changed.slice(0,8).join(", ")+(changed.length>8?" …":"")+"":"No field changes";
}
function auditRecord(action,orderId,before,after,detail){
 if(window.HonorAudit)window.HonorAudit.record({module:"service",action,orderId,before,after,detail,actor:after?.operatorEnglish||window.HonorAudit.actor()});
}
function saveOrder(){
 collectForm();
 const ed=editor;if(!ed)return;
 if(ed.imageProcessing){toast("Please wait while the reference image is processing",true);return}
 if(!check(ed.data))return;
 const d=JSON.parse(JSON.stringify(ed.data));
 d.operatorEnglish=String(d.operatorEnglish||"").trim();
 if(window.HonorAudit?.setOperator)window.HonorAudit.setOperator(d.operatorEnglish);
 d.notifyEnabled=!!d.notifyEnabled&&!!readyPolicy(d.orderType);
 d.notifyConfigRef=d.notifyEnabled?"Configured":"";
 if(ed.mode==="add"){
  // Benefit name is derived from the selected order type; no manual entry on creation.
  d.benefitName=T.types[d.orderType]||"";
  d.id=newId();d.createdAt=stamp();d.updatedAt=d.createdAt;
  d.username=d.username||"";
  d.history=[{when:d.createdAt,action:"Add Order",by:d.operatorEnglish,desc:"Created service order"}];
  d.notifications=[];
  if(d.notifyEnabled)d.notifications.push({when:d.createdAt,action:"Not Sent",by:"System",desc:"Webhook delivery unavailable in frontend preview"});
 }else{
  const change=diff(ed.before,d);d.createdAt=ed.before.createdAt;d.updatedAt=stamp();
  d.history=[...(ed.before.history||[]),{when:d.updatedAt,action:"Edit",by:d.operatorEnglish,desc:change}];
  d.notifications=ed.before.notifications||[];
 }
 let next=ed.mode==="add"?[d,...orders]:orders.map(x=>x.id===d.id?d:x);
 if(!store(next))return;
 auditRecord(ed.mode==="add"?"Create":"Edit",d.id,ed.before,d,ed.mode==="add"?"Created service order":"Updated service order");
 closeOrder(true);render();toast("Saved Successfully");
}
function closeOrder(force){
 if(editor&&!force&&editor.mode!=="view"){
  collectForm();
  if(JSON.stringify(editor.data)!==JSON.stringify(editor.before||defaultDraft())&&
     !confirm("Discard unsaved changes?"))return;
 }
 $("soModal").classList.remove("open");$("soModal").setAttribute("aria-hidden","true");editor=null;
}
function setStatus(id,action){
 const o=orders.find(v=>v.id===id);if(!o)return;
 const next=action==="complete"?"processed":"returning";
 const title=action==="complete"?"Confirm Order Completion":"Confirm Return";
 ask(title,"Change status to "+T.statuses[next]+"?",()=>{
  const operator=window.HonorAudit?.requestOperator(true);
  if(!operator){toast("Please enter the overseas operator's English name",true);return}
  const when=stamp();
  const updated={...o,orderStatus:next,operatorEnglish:operator,updatedAt:when,
   history:[...(o.history||[]),{when,action:action==="complete"?"Complete":"Return",by:operator,desc:"Order Status: "+T.statuses[o.orderStatus]+" → "+T.statuses[next]}]};
  if(store(orders.map(x=>x.id===id?updated:x))){auditRecord(action==="complete"?"Complete":"Return",id,o,updated,"Order status changed");render();toast("Saved Successfully")}
 });
}
function settingsHtml(){
 return '<div class="so-policy-list">'+ORDER_TYPES.map(t=>{
   const p=getPolicy(t);
   return '<div class="so-policy-card" data-policy-type="'+t+'"><div class="so-policy-top">'+
    '<strong>'+escapeHtml(T.types[t])+'</strong>'+
    '<label class="so-toggle"><input class="so-policy-enabled" data-policy-toggle="'+t+'" type="checkbox"'+(p.enabled?' checked':'')+'><span class="so-toggle-track"></span></label></div>'+
    '<div class="so-policy-details"'+(p.enabled?'':' hidden')+'><label>Robot Webhook</label>'+
    '<input class="so-policy-ref" data-policy-ref="'+t+'" type="text" value="'+escapeHtml(p.webhookRef)+'" placeholder="Enter Webhook ID or URL" autocomplete="off"></div></div>';
   }).join("")+'</div>';
}
function openSettings(){
 openSmall("Notification Settings",settingsHtml(),[
  {text:"Cancel",fn:closeSmall},
  {text:"Save",primary:true,fn:saveSettings}
 ]);
 $("soSmallBody").onchange=e=>{
  const chk=e.target.closest("[data-policy-toggle]");
  if(chk){
   const card=chk.closest(".so-policy-card");
   card.querySelector(".so-policy-details").hidden=!chk.checked;
  }
 };
}
function saveSettings(){
 const next={};
 for(const type of ORDER_TYPES){
  const card=$("soSmallBody").querySelector('[data-policy-type="'+type+'"]');
  const enabled=card.querySelector("[data-policy-toggle]").checked;
  const ref=card.querySelector("[data-policy-ref]").value.trim();
  if(enabled&&!safeRef(ref)){
   toast("Please enter Robot Webhook",true);
   card.querySelector(".so-policy-details").hidden=false;card.querySelector("[data-policy-ref]").focus();return;
  }
  next[type]={enabled,webhookRef:safeRef(ref)?ref:""};
 }
 const before=Object.fromEntries(ORDER_TYPES.map(t=>[t,policies[t]?.enabled?"On":"Off"]));
 try{localStorage.setItem(POLICY_KEY,JSON.stringify(next))}
 catch(_){toast("Unable to save notification settings",true);return}
 policies=next;
 const after=Object.fromEntries(ORDER_TYPES.map(t=>[t,next[t].enabled?"On":"Off"]));
 if(window.HonorAudit)window.HonorAudit.record({module:"service",action:"Notification Settings",detail:"Settings saved (Webhook URLs excluded)",before,after});
 closeSmall();toast("Notification settings saved");
}
function openSmall(title,body,actions){
 $("soSmallTitle").textContent=title;$("soSmallBody").innerHTML=body;
 $("soSmallFooter").innerHTML="";
 (actions||[{text:"Close",fn:closeSmall}]).forEach((a,i)=>{
  const b=document.createElement("button");b.className="so-button"+(a.primary?" primary":"");b.textContent=a.text;
  b.onclick=a.fn;$("soSmallFooter").appendChild(b);
 });
 $("soSmallOverlay").classList.add("open");
}
function closeSmall(){$("soSmallOverlay").classList.remove("open")}
function ask(title,message,onAccept){
 openSmall(title,'<p style="line-height:1.8;color:#5e7082">'+escapeHtml(message)+'</p>',[
  {text:"Cancel",fn:closeSmall},
  {text:"Submit",primary:true,fn:()=>{closeSmall();onAccept()}}
 ]);
}
function showTimeline(id,kind){
 const o=orders.find(x=>x.id===id);if(!o)return;
 const title=kind==="activity"?"Activity Log":"Notification History";
 const entries=kind==="activity"?o.history||[]:o.notifications||[];
 const content=entries.length?
  '<div class="so-timeline">'+entries.slice().reverse().map(e=>'<div class="so-log"><div class="so-log-time">'+escapeHtml(dateOut(e.when))+'</div><div class="so-log-main"><strong>'+escapeHtml(e.action)+'</strong><div>'+escapeHtml(e.desc||"")+'</div><small class="so-helper">'+escapeHtml(e.by||"")+'</small></div></div>').join("")+'</div>':
  '<div class="so-log-none">No Data</div>';
 openSmall(title,content);
}
$("soFilterType").innerHTML='<option value="">All</option>'+Object.entries(T.types).map(([v,l])=>'<option value="'+v+'">'+escapeHtml(l)+'</option>').join("");
$("soFilterStatus").innerHTML='<option value="">All</option>'+Object.entries(T.statuses).map(([v,l])=>'<option value="'+v+'">'+escapeHtml(l)+'</option>').join("");
$("soCountryList").innerHTML=C.map(([v])=>'<option value="'+escapeHtml(v)+'"></option>').join("");
$("soFilterForm").addEventListener("submit",e=>{e.preventDefault();applyFilters()});
$("soFilterReset").onclick=()=>{
 selectedIds.clear();$("soFilterForm").reset();
 const region=$("soFilterRegions");
 applyRegionSelection(region,[]);
 closeRegionPanel(region);
 filters={};page=1;render();
};
$("soFilterRegions").addEventListener("click",e=>regionClick($("soFilterRegions"),e));
$("soFilterRegions").addEventListener("change",e=>regionChange($("soFilterRegions"),e));
$("soFilterRegions").addEventListener("input",e=>regionSearch($("soFilterRegions"),e));
$("soAddOrder").onclick=()=>openOrder("add");
$("soExportOrders").onclick=exportCSV;
$("soNotificationSettings").onclick=openSettings;
$("soSelectAll").onchange=e=>{
 const subset=filtered().slice((page-1)*pageSize,page*pageSize);
 subset.forEach(o=>e.target.checked?selectedIds.add(o.id):selectedIds.delete(o.id));
 render();
};
$("soTableBody").onchange=e=>{
 const input=e.target.closest("[data-select-id]");
 if(!input)return;
 if(input.checked)selectedIds.add(input.dataset.selectId);else selectedIds.delete(input.dataset.selectId);
 updateSelectionUI();
};
$("soTableBody").onclick=e=>{
 const b=e.target.closest("[data-action]");if(!b)return;
 const {action,id}=b.dataset;
 if(action==="edit")openOrder(action,id);
 else if(action==="complete"||action==="return")setStatus(id,action);
};
$("soPrev").onclick=()=>{page--;render()};
$("soNext").onclick=()=>{page++;render()};
$("soModalClose").onclick=()=>closeOrder(false);
$("soModal").onclick=e=>{if(e.target===$("soModal"))closeOrder(false)};
$("soModalBody").onchange=e=>{
 if(!editor||editor.mode==="view")return;
 const widget=e.target.closest(".so-region-widget");
 if(widget){regionChange(widget,e);return;}
 const giftFile=e.target.closest("[data-gift-ref-upload]");
 if(giftFile&&giftFile.files?.length){loadReferenceImage(giftFile.files[0]);return;}
 const f=e.target.closest("[data-file-for]");
 if(f&&f.files?.length){
  const field=f.dataset.fileFor,inp=$("so-edit-"+field);
  if(inp){inp.value=f.files[0].name;editor.data[field]=f.files[0].name;editor.changed=true}
 }
};
$("soModalBody").oninput=e=>{
 if(!editor||editor.mode==="view")return;
 const region=e.target.closest(".so-region-widget");
 if(region){regionSearch(region,e);return;}
 const input=e.target.closest("[data-field]");if(!input)return;
 editor.data[input.dataset.field]=input.value;editor.changed=true;
 if(input.dataset.field==="processingUI")showMention(input);
 if(input.dataset.field==="orderType"){
  editor.data.notifyEnabled=!!readyPolicy(input.value);
  editor.data.notifyConfigRef="";
  paintOrder();return;
 }
 if(input.dataset.field==="giftType"&&editor.data.giftType==="limited"&&Number(editor.data.giftPrice)<600000&&editor.mode==="add"){
  editor.data.giftPrice="600000";const price=$("so-edit-giftPrice");if(price)price.value="600000";
 }
};
$("soModalBody").onclick=e=>{
 const mention=e.target.closest("[data-mention-name]");
 if(mention){chooseMention(mention);return;}
 const clear=e.target.closest("[data-gift-ref-clear]");
 if(clear&&editor){
  editor.data.giftReferenceImage="";editor.data.giftReferenceImageData="";editor.changed=true;
  const box=clear.closest(".so-gift-ref"),inp=box?.querySelector("[data-field=giftReferenceImage]");
  const pic=box?.querySelector(".so-gift-ref-preview");
  if(inp)inp.value="";
  if(pic){pic.src="";pic.hidden=true}
  const title=box?.querySelector(".so-gift-ref-filename");
  if(title)title.textContent="No file selected";
  clear.hidden=true;return;
 }
 const widget=e.target.closest(".so-region-widget");
 if(widget)regionClick(widget,e);
};
$("soModalBody").addEventListener("keydown",e=>{
 const root=e.target.closest(".so-mention-wrap");
 const menu=root?.querySelector(".so-mention-menu");
 if(!menu||menu.hidden)return;
 const options=[...menu.querySelectorAll("[data-mention-name]")];
 if(e.key==="Escape"){hideMention(root);e.stopPropagation();e.preventDefault();return;}
 if(e.key==="ArrowDown"||e.key==="ArrowUp"){
  e.preventDefault();
  const active=options.findIndex(b=>b.classList.contains("selected"));
  const next=(active+(e.key==="ArrowDown"?1:-1)+options.length)%options.length;
  options.forEach((b,i)=>b.classList.toggle("selected",i===next));return;
 }
 if(e.key==="Enter"&&options.length){
  e.preventDefault();
  chooseMention(options.find(b=>b.classList.contains("selected"))||options[0]);
 }
});
document.addEventListener("pointerdown",e=>{
 if(!e.target.closest(".so-mention-wrap")){
  document.querySelectorAll(".so-mention-wrap").forEach(hideMention);
 }
 document.querySelectorAll(".so-region-widget.is-open").forEach(widget=>{
  if(!widget.contains(e.target))closeRegionPanel(widget);
 });
});
$("soModalFooter").onclick=e=>{
 const b=e.target.closest("[data-foot]");if(!b||!editor)return;
 const action=b.dataset.foot;
 if(action==="close"||action==="cancel")closeOrder(false);
 if(action==="save")saveOrder();
 if(action==="edit"){const id=editor.id;openOrder("edit",id)}
 if(action==="activity"||action==="history")showTimeline(editor.id,action);
};
$("soSmallClose").onclick=closeSmall;
$("soSmallOverlay").onclick=e=>{if(e.target===$("soSmallOverlay"))closeSmall()};
document.addEventListener("keydown",e=>{
 if(e.key!=="Escape")return;
 const visibleRegions=[...document.querySelectorAll(".so-region-widget.is-open")];
 if(visibleRegions.length){
  visibleRegions.forEach(closeRegionPanel);
  e.preventDefault();
  return;
 }
 if($("soSmallOverlay").classList.contains("open")){closeSmall();return}
 if($("soModal").classList.contains("open"))closeOrder(false);
});
document.querySelectorAll(".nav-group-header").forEach(n=>n.onclick=()=>{
 n.parentNode.classList.toggle("collapsed");const icon=n.querySelector(".chevron");if(icon)icon.textContent=n.parentNode.classList.contains("collapsed")?"⌄":"⌃";
});
document.querySelectorAll(".nav-subhead").forEach(n=>n.onclick=()=>{
 n.parentNode.classList.toggle("collapsed");const icon=n.querySelector("b");if(icon)icon.textContent=n.parentNode.classList.contains("collapsed")?"⌄":"⌃";
});
$("soSidebarToggle").onclick=()=>{$("soSidebar").classList.toggle("tiny-sidebar")};
$("soRefresh").onclick=()=>render();
fillCountries();assignees();render();
})();