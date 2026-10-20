(function(){
"use strict";
const $=id=>document.getElementById(id);
const KEY="honor-service-orders-v1";
const T={
 title:"Honor Service Orders / 荣誉服务订单",
 all:"All / 全部",
 types:{unban:"Account Unban / 账号解封",banner:"Banner & Splash / Banner及开屏定制",gift:"Custom Gift / 定制礼物",ride:"Custom Ride / 定制座驾"},
 statuses:{pending:"Pending / 待处理",processed:"Processed / 已处理",returned:"Returned / 已退回",returning:"Returning / 退回中"},
 unbanStatuses:{pending:"Pending / 待处理",progress:"In Progress / 处理中",unbanned:"Unbanned / 已解封",failed:"Failed / 解封失败"},
 displayTypes:{banner:"Banner / 横幅",splash:"Splash / 开屏"},
 giftTypes:{regular:"Regular / 普通礼物",limited:"Limited / 限量礼物"}
};
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
 {k:"orderType",l:"Order Type / 订单类型",req:1,kind:"select",opts:T.types},
 {k:"redeemedOrderId",l:"Redeemed Order ID / 关联兑换订单ID"},
 {k:"userId",l:"User ID / 用户ID",req:1},
 {k:"nationality",l:"Nationality / 用户国籍",req:1,list:"soCountryList"},
 {k:"redemptionTime",l:"Redemption Time / 兑换时间",req:1,kind:"datetime-local"},
 {k:"orderStatus",l:"Order Status / 订单状态",req:1,kind:"select",opts:T.statuses},
 {k:"assignedTo",l:"Assigned To / 处理负责人",list:"soAssigneeList"},
 {k:"whatsapp",l:"WhatsApp / 联系方式"},
 {k:"notes",l:"Notes / 备注",kind:"textarea",wide:1}
];
const byType={
 unban:[
  {k:"accountId",l:"Account ID / 解封账号ID",req:1},
  {k:"accountNationality",l:"Account Nationality / 解封账号国籍",req:1,list:"soCountryList"},
  {k:"suspensionReason",l:"Suspension Reason / 封禁原因",kind:"textarea"},
  {k:"unbanStatus",l:"Unban Status / 解封状态",req:1,kind:"select",opts:T.unbanStatuses},
  {k:"unbanNotes",l:"Notes / 备注",kind:"textarea",wide:1}
 ],
 banner:[
  {k:"displayType",l:"Display Type / 展示类型",req:1,kind:"select",opts:T.displayTypes},
  {k:"displayRegion",l:"Display Region / 展示区域",req:1},
  {k:"configLink",l:"Config Link / 配置链接",kind:"url"},
  {k:"color",l:"Color / 颜色",placeholder:"#RRGGBB"},
  {k:"copy",l:"Copy / 短文案",kind:"textarea"},
  {k:"wording",l:"Wording / 展示文案",kind:"textarea"},
  {k:"image",l:"Image / 图片素材",kind:"file",accept:"image/*",wide:1},
  {k:"startTime",l:"Start Time / 开始时间",req:1,kind:"datetime-local"},
  {k:"endTime",l:"End Time / 结束时间",req:1,kind:"datetime-local"},
  {k:"finalDesign",l:"Final Design / 最终设计稿",kind:"file",accept:"image/*,.pdf",wide:1},
  {k:"groupLink",l:"Group Link / 群聊链接",kind:"url"},
  {k:"bannerNotes",l:"Notes / 备注",kind:"textarea",wide:1}
 ],
 gift:[
  {k:"honorWallId",l:"Honor Wall ID / 荣誉墙ID",req:1},
  {k:"availableCountries",l:"Available Countries / 上线国家",req:1,placeholder:"Pakistan, Egypt / 巴基斯坦、埃及",hint:"Separate multiple countries with commas / 多个国家使用逗号分隔"},
  {k:"giftType",l:"Gift Type / 礼物类型",req:1,kind:"select",opts:T.giftTypes},
  {k:"giftName",l:"Gift Name / 礼物名称",req:1},
  {k:"giftDescription",l:"Gift Description / 礼物描述",kind:"textarea",hint:"Maximum 10 words / 不超过10个单词"},
  {k:"giftImage",l:"Gift Image / 礼物图片",kind:"file",accept:"image/*",wide:1},
  {k:"giftVideo",l:"Gift Video / 礼物视频素材",kind:"file",accept:"video/*",wide:1},
  {k:"giftPrice",l:"Gift Price / 礼物价格",req:1,kind:"number",hint:"Regular ≥177,000 coins; Limited ≥600,000 / 普通礼物至少177,000金币，限量礼物至少600,000金币"},
  {k:"validDuration",l:"Valid Duration / 有效期",req:1,placeholder:"2 months / 2个月"},
  {k:"groupLink",l:"Group Link / 群聊链接",kind:"url"},
  {k:"giftNotes",l:"Notes / 备注",kind:"textarea",wide:1}
 ],
 ride:[
  {k:"honorWallId",l:"Honor Wall ID / 荣誉墙ID",req:1},
  {k:"theme",l:"Theme / 主题",req:1},
  {k:"backgroundScene",l:"Background / Scene / 背景及场景",kind:"textarea",wide:1},
  {k:"rideName",l:"Ride Name / 座驾名称",req:1},
  {k:"referenceMedia",l:"Reference Image or Video / 参考图片或视频",kind:"file",accept:"image/*,video/*",wide:1},
  {k:"designFiles",l:"Design Files / 设计文件",kind:"file",accept:"image/*,video/*,.pdf,.zip",wide:1},
  {k:"groupLink",l:"Group Link / 群聊链接",kind:"url"},
  {k:"rideNotes",l:"Notes / 备注",kind:"textarea",wide:1}
 ]
};
const escapeHtml=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const nowLocal=()=>{let d=new Date(),tz=d.getTimezoneOffset()*60000;return new Date(d.getTime()-tz).toISOString().slice(0,16)};
const stamp=()=>nowLocal().replace("T"," ")+":00";
const dateOut=v=>String(v||"—").replace("T"," ");
let orders=[];
try{const x=JSON.parse(localStorage.getItem(KEY)||"[]");if(Array.isArray(x))orders=x}catch(_){}
let filters={},page=1,pageSize=20,editor=null;
function defaultDraft(){
 return {orderType:"unban",redeemedOrderId:"",userId:"",nationality:"",redemptionTime:nowLocal(),
  orderStatus:"pending",assignedTo:"",whatsapp:"",notes:"",benefitName:"",
  unbanStatus:"pending",displayType:"banner",giftType:"regular",giftPrice:"177000",
  history:[],notifications:[]};
}
function toast(msg,bad){
 const div=document.createElement("div");div.className="so-toast"+(bad?" error":"");div.textContent=msg;document.body.appendChild(div);
 setTimeout(()=>div.remove(),3000);
}
function store(next){
 try{localStorage.setItem(KEY,JSON.stringify(next));orders=next;return true}
 catch(e){toast("Unable to save locally / 无法保存到本地浏览器",true);return false}
}
function countryLabel(v){const found=C.find(c=>c[0].toLowerCase()===String(v||"").toLowerCase());return found?found.join(" / "):v||"—"}
function countries(){
 const seen=new Map(C.map(([en,cn])=>[en,en+" / "+cn]));
 orders.forEach(o=>{if(o.nationality&&!seen.has(o.nationality))seen.set(o.nationality,o.nationality)});
 return [...seen].sort((a,b)=>a[0].localeCompare(b[0]));
}
function fillCountries(){
 const menu=$("soNationMenu"),selected=new Set([...menu.querySelectorAll("input:checked")].map(i=>i.value));
 menu.innerHTML=countries().map(([value,label])=>'<label><input type="checkbox" value="'+escapeHtml(value)+'"'+(selected.has(value)?" checked":"")+'><span>'+escapeHtml(label)+'</span></label>').join("");
 updateCountrySummary();
}
function updateCountrySummary(){
 const checked=[...$("soNationMenu").querySelectorAll("input:checked")];
 $("soNationSummary").textContent=checked.length?checked.map(i=>countryLabel(i.value)).join(", "):"All / 全部";
}
function assignees(){
 const names=[...new Set(orders.map(o=>o.assignedTo).filter(Boolean))];
 const sel=$("soFilterAssignee"),old=sel.value;
 sel.innerHTML='<option value="">All / 全部</option>'+names.map(x=>'<option value="'+escapeHtml(x)+'">'+escapeHtml(x)+'</option>').join("");
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
  nationalities:[...$("soNationMenu").querySelectorAll("input:checked")].map(i=>i.value.toLowerCase()),
  status:$("soFilterStatus").value,from:$("soFilterStart").value,to:$("soFilterEnd").value,assignee:$("soFilterAssignee").value
 };
 page=1;render();
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
 const buttons=[
  '<button type="button" class="so-cell-action" data-action="view" data-id="'+escapeHtml(o.id)+'">View / 查看</button>',
  '<button type="button" class="so-cell-action" data-action="edit" data-id="'+escapeHtml(o.id)+'">Edit / 编辑</button>',
  o.orderStatus==="pending"?'<button type="button" class="so-cell-action" data-action="complete" data-id="'+escapeHtml(o.id)+'">Complete / 完成</button>':"",
  (o.orderStatus==="pending"||o.orderStatus==="processed")?'<button type="button" class="so-cell-action warn" data-action="return" data-id="'+escapeHtml(o.id)+'">Return / 退回</button>':""
 ].join("");
 return '<tr><td class="so-strong">'+escapeHtml(o.id)+'</td><td>'+escapeHtml(o.redeemedOrderId||"—")+'</td>'+
 '<td>'+escapeHtml(T.types[o.orderType]||o.orderType)+'</td><td>'+escapeHtml(o.benefitName||"—")+'</td>'+
 '<td>'+escapeHtml(o.userId)+'</td><td>'+escapeHtml(o.username||"—")+'</td>'+
 '<td>'+escapeHtml(countryLabel(o.nationality))+'</td><td>'+escapeHtml(o.honorWallId||"—")+'</td>'+
 '<td>'+statusHtml(o.orderStatus)+'</td><td>'+escapeHtml(dateOut(o.createdAt))+'</td>'+
 '<td>'+escapeHtml(o.assignedTo||"—")+'</td><td>'+escapeHtml(dateOut(o.updatedAt))+'</td>'+
 '<td class="so-actions-cell">'+buttons+'</td></tr>';
}
function render(){
 const matches=filtered(),count=matches.length,pages=Math.max(1,Math.ceil(count/pageSize));
 page=Math.max(1,Math.min(page,pages));
 const subset=matches.slice((page-1)*pageSize,page*pageSize);
 $("soTableBody").innerHTML=subset.length?subset.map(tr).join(""):'<tr><td colspan="13" class="so-empty">No Data / 暂无数据</td></tr>';
 $("soCount").textContent="Total "+count+" / 共 "+count+" 条";
 $("soPage").textContent=String(page)+" / "+String(pages);
 $("soPageSummary").textContent="Total "+count+" records / 共 "+count+" 条";
 $("soPrev").disabled=page<=1;$("soNext").disabled=page>=pages;
 fillCountries();assignees();
}
function fieldHtml(f,d,readonly){
 const k=f.k,v=d[k]??"",attr=' data-field="'+escapeHtml(k)+'" id="so-edit-'+escapeHtml(k)+'"';
 let ctrl="",help=f.hint||"";
 if(f.kind==="select"){
  let opts=Object.entries(f.opts).map(([key,label])=>'<option value="'+escapeHtml(key)+'"'+(key===String(v)?" selected":"")+'>'+escapeHtml(label)+'</option>').join("");
  ctrl='<select'+attr+(readonly||k==="orderType"&&editor.mode!=="add"?" disabled":"")+'>'+opts+'</select>';
 }else if(f.kind==="textarea"){
  ctrl='<textarea'+attr+(readonly?" disabled":"")+' placeholder="Please enter / 请输入">'+escapeHtml(v)+'</textarea>';
 }else if(f.kind==="file"){
  ctrl='<div class="so-preview-box">'+(readonly?"":'<input data-file-for="'+escapeHtml(k)+'" type="file" accept="'+escapeHtml(f.accept||"*/*")+'">')+
    '<span class="so-media-name">'+(v?escapeHtml(v):"No file / 暂无文件")+'</span>'+
    '<input class="so-input"'+attr+' type="text"'+(readonly?" disabled":"")+' value="'+escapeHtml(v)+'" placeholder="File URL / 文件链接"></div>';
  help="File name or link only; no server upload / 仅保存文件名或链接，不上传服务器";
 }else{
  const type=f.kind||"text",ph=f.placeholder||"Please enter / 请输入";
  ctrl='<input class="so-input"'+attr+' type="'+escapeHtml(type)+'" value="'+escapeHtml(v)+'"'+(readonly?" disabled":"")+
    (type==="number"?' min="0" step="1"':"")+(f.list?' list="'+f.list+'"':"")+' placeholder="'+escapeHtml(ph)+'">';
 }
 return '<div class="so-control'+(f.wide?" wide":"")+'"><label class="so-control-label" for="so-edit-'+escapeHtml(k)+'">'+escapeHtml(f.l)+(f.req?'<span class="so-required">*</span>':"")+'</label>'+ctrl+(help?'<small class="so-hint">'+escapeHtml(help)+'</small>':"")+'</div>';
}
function openOrder(mode,id){
 const existing=orders.find(x=>x.id===id);
 if(mode!=="add"&&!existing){toast("Order not found / 未找到订单",true);return}
 const data=mode==="add"?defaultDraft():JSON.parse(JSON.stringify(existing));
 editor={mode,id:id||null,data,before:existing?JSON.parse(JSON.stringify(existing)):null,changed:false};
 $("soModal").classList.add("open");
 $("soModal").setAttribute("aria-hidden","false");
 paintOrder();
}
function collectForm(){
 if(!editor)return;
 $("soModalBody").querySelectorAll("[data-field]").forEach(n=>{if(n.disabled)return;editor.data[n.dataset.field]=n.value});
}
function paintOrder(){
 const ed=editor;if(!ed)return;
 const mode=ed.mode,d=ed.data,readonly=mode==="view";
 const heading=mode==="add"?"Add Order / 新增订单":mode==="edit"?"Edit / 编辑 · "+d.id:"Order Details / 订单详情 · "+d.id;
 $("soModalTitle").textContent=heading;
 $("soModalSubtitle").textContent=readonly?"View / 查看":"All required fields marked * / 带 * 的字段为必填";
 $("soTypeTag").textContent=T.types[d.orderType]||"—";
 const head='<section class="so-section"><h3 class="so-section-title">Basic Information / 基础信息</h3><div class="so-field-grid">'+common.map(f=>fieldHtml(f,d,readonly)).join("")+'</div></section>';
 const specifics='<section class="so-section"><h3 class="so-section-title">'+escapeHtml(T.types[d.orderType])+'</h3><div class="so-field-grid">'+(byType[d.orderType]||[]).map(f=>fieldHtml(f,d,readonly)).join("")+'</div></section>';
 $("soModalBody").innerHTML='<div class="so-validation" id="soFormError"></div>'+head+specifics;
 $("soModalBody").scrollTop=0;
 $("soModalFooter").innerHTML=(readonly?
  '<button class="so-button" type="button" data-foot="activity">Activity Log / 操作记录</button><button class="so-button" type="button" data-foot="history">Notification History / 通知记录</button><span class="so-spacer"></span><button class="so-button" type="button" data-foot="close">Close / 关闭</button><button class="so-button primary" type="button" data-foot="edit">Edit / 编辑</button>':
  '<button class="so-button" type="button" data-foot="cancel">Cancel / 取消</button><button class="so-button primary" type="button" data-foot="save">Save / 保存</button>');
}
function fail(msg){
 const n=$("soFormError");n.textContent=msg;n.classList.add("visible");n.scrollIntoView({block:"nearest",behavior:"smooth"});toast(msg,true);return false
}
function check(d){
 for(const f of [...common,...(byType[d.orderType]||[])]){
  if(f.req&&!String(d[f.k]??"").trim())return fail("Please complete "+f.l+" / 请填写必填项");
 }
 if(!Object.keys(T.types).includes(d.orderType))return fail("Please select a valid order type / 请选择有效订单类型");
 if(!Object.keys(T.statuses).includes(d.orderStatus))return fail("Please select a valid status / 请选择有效的订单状态");
 if(d.orderType==="gift"){
  const price=Number(d.giftPrice),min=d.giftType==="limited"?600000:177000;
  if(!Number.isFinite(price)||price<min)return fail("Gift Price must be at least "+min.toLocaleString()+" coins / 礼物价格不能低于 "+min.toLocaleString()+" 金币");
  const desc=String(d.giftDescription||"").trim();
  if(desc&&desc.split(/\s+/).length>10)return fail("Gift description must be within 10 words / 礼物描述不得超过10个单词");
  if(!Object.keys(T.giftTypes).includes(d.giftType))return fail("Invalid gift type / 礼物类型无效");
 }
 if(d.orderType==="banner"){
  if(d.endTime<=d.startTime)return fail("End Time must be after Start Time / 结束时间必须晚于开始时间");
 }
 return true;
}
function newId(){
 const base="HS-"+nowLocal().slice(0,10).replace(/-/g,"")+"-";
 let n=orders.reduce((max,o)=>String(o.id||"").startsWith(base)?Math.max(max,parseInt(String(o.id).slice(-4),10)||0):max,0)+1;
 return base+String(n).padStart(4,"0");
}
function diff(a,b){
 if(!a)return "Created service order / 创建服务订单";
 const changed=[...common,...(byType[b.orderType]||[])].filter(x=>String(a[x.k]??"")!==String(b[x.k]??"")).map(x=>x.l);
 return changed.length?"Updated: "+changed.slice(0,8).join(", ")+(changed.length>8?" …":"")+" / 已更新字段":"No field changes / 未修改字段";
}
function saveOrder(){
 collectForm();
 const ed=editor;if(!ed||!check(ed.data))return;
 const d=JSON.parse(JSON.stringify(ed.data));
 if(ed.mode==="add"){
  d.id=newId();d.createdAt=stamp();d.updatedAt=d.createdAt;
  d.username=d.username||"";
  d.history=[{when:d.createdAt,action:"Add Order / 新增订单",by:"Local Operator / 本地操作",desc:"Created service order / 新增服务订单"}];
  d.notifications=[];
 }else{
  const change=diff(ed.before,d);d.createdAt=ed.before.createdAt;d.updatedAt=stamp();
  d.history=[...(ed.before.history||[]),{when:d.updatedAt,action:"Edit / 编辑",by:"Local Operator / 本地操作",desc:change}];
  d.notifications=ed.before.notifications||[];
 }
 let next=ed.mode==="add"?[d,...orders]:orders.map(x=>x.id===d.id?d:x);
 if(!store(next))return;
 closeOrder(true);render();toast("Saved Successfully / 保存成功");
}
function closeOrder(force){
 if(editor&&!force&&editor.mode!=="view"){
  collectForm();
  if(JSON.stringify(editor.data)!==JSON.stringify(editor.before||defaultDraft())&&
     !confirm("Discard unsaved changes? / 确定放弃未保存的修改吗？"))return;
 }
 $("soModal").classList.remove("open");$("soModal").setAttribute("aria-hidden","true");editor=null;
}
function setStatus(id,action){
 const o=orders.find(v=>v.id===id);if(!o)return;
 const next=action==="complete"?"processed":"returning";
 const title=action==="complete"?"Confirm Order Completion / 确认完成订单":"Confirm Return / 确认退回";
 ask(title,"Change status to "+T.statuses[next]+"? / 确认更新订单状态吗？",()=>{
  const updated={...o,orderStatus:next,updatedAt:stamp(),
   history:[...(o.history||[]),{when:stamp(),action:action==="complete"?"Complete / 完成":"Return / 退回",by:"Local Operator / 本地操作",desc:"Order Status / 订单状态: "+T.statuses[o.orderStatus]+" → "+T.statuses[next]}]};
  if(store(orders.map(x=>x.id===id?updated:x))){render();toast("Saved Successfully / 保存成功")}
 });
}
function openSmall(title,body,actions){
 $("soSmallTitle").textContent=title;$("soSmallBody").innerHTML=body;
 $("soSmallFooter").innerHTML="";
 (actions||[{text:"Close / 关闭",fn:closeSmall}]).forEach((a,i)=>{
  const b=document.createElement("button");b.className="so-button"+(a.primary?" primary":"");b.textContent=a.text;
  b.onclick=a.fn;$("soSmallFooter").appendChild(b);
 });
 $("soSmallOverlay").classList.add("open");
}
function closeSmall(){$("soSmallOverlay").classList.remove("open")}
function ask(title,message,onAccept){
 openSmall(title,'<p style="line-height:1.8;color:#5e7082">'+escapeHtml(message)+'</p>',[
  {text:"Cancel / 取消",fn:closeSmall},
  {text:"Submit / 提交",primary:true,fn:()=>{closeSmall();onAccept()}}
 ]);
}
function showTimeline(id,kind){
 const o=orders.find(x=>x.id===id);if(!o)return;
 const title=kind==="activity"?"Activity Log / 操作记录":"Notification History / 通知记录";
 const entries=kind==="activity"?o.history||[]:o.notifications||[];
 const content=entries.length?
  '<div class="so-timeline">'+entries.slice().reverse().map(e=>'<div class="so-log"><div class="so-log-time">'+escapeHtml(dateOut(e.when))+'</div><div class="so-log-main"><strong>'+escapeHtml(e.action)+'</strong><div>'+escapeHtml(e.desc||"")+'</div><small class="so-helper">'+escapeHtml(e.by||"")+'</small></div></div>').join("")+'</div>':
  '<div class="so-log-none">No Data / 暂无数据</div>';
 openSmall(title,content);
}
function notify(id){
 const o=orders.find(x=>x.id===id);if(!o)return;
 openSmall("Notify Assignee / 通知处理人员",
 '<p style="line-height:1.8;color:#5a6879">Lark robot service is not connected. No message will be sent. / 尚未连接 Lark 机器人服务，不会实际发送通知。</p>'+
 '<p style="line-height:1.8">Assigned To / 处理负责人：<strong>'+escapeHtml(o.assignedTo||"Unassigned / 未分配")+'</strong></p>',[
  {text:"Cancel / 取消",fn:closeSmall},
  {text:"Record Attempt / 记录尝试",primary:true,fn:()=>{
   closeSmall();const when=stamp();
   const item={when,action:"Not Sent / 未发送",desc:"Lark service not connected / 未连接 Lark 服务",by:"Local Operator / 本地操作"};
   const updated={...o,notifications:[...(o.notifications||[]),item],history:[...(o.history||[]),{when,action:"Notify Assignee / 通知处理人员",desc:item.desc,by:item.by}]};
   if(store(orders.map(x=>x.id===id?updated:x)))toast("Not Sent / 未发送",true);
  }}
 ]);
}
$("soFilterType").innerHTML='<option value="">All / 全部</option>'+Object.entries(T.types).map(([v,l])=>'<option value="'+v+'">'+escapeHtml(l)+'</option>').join("");
$("soFilterStatus").innerHTML='<option value="">All / 全部</option>'+Object.entries(T.statuses).map(([v,l])=>'<option value="'+v+'">'+escapeHtml(l)+'</option>').join("");
$("soCountryList").innerHTML=C.map(([v])=>'<option value="'+escapeHtml(v)+'"></option>').join("");
$("soFilterForm").addEventListener("submit",e=>{e.preventDefault();applyFilters()});
$("soFilterReset").onclick=()=>{
 $("soFilterForm").reset();$("soNationMenu").querySelectorAll("input").forEach(i=>i.checked=false);
 filters={};page=1;render();
};
$("soNationMenu").onchange=updateCountrySummary;
$("soAddOrder").onclick=()=>openOrder("add");
$("soTableBody").onclick=e=>{
 const b=e.target.closest("[data-action]");if(!b)return;
 const {action,id}=b.dataset;
 if(action==="view"||action==="edit")openOrder(action,id);
 else if(action==="complete"||action==="return")setStatus(id,action);
};
$("soPrev").onclick=()=>{page--;render()};
$("soNext").onclick=()=>{page++;render()};
$("soModalClose").onclick=()=>closeOrder(false);
$("soModal").onclick=e=>{if(e.target===$("soModal"))closeOrder(false)};
$("soModalBody").onchange=e=>{
 if(!editor||editor.mode==="view")return;
 const f=e.target.closest("[data-file-for]");
 if(f&&f.files?.length){
  const field=f.dataset.fileFor,inp=$("so-edit-"+field);
  if(inp){inp.value=f.files[0].name;editor.data[field]=f.files[0].name;editor.changed=true}
 }
};
$("soModalBody").oninput=e=>{
 if(!editor||editor.mode==="view")return;
 const input=e.target.closest("[data-field]");if(!input)return;
 editor.data[input.dataset.field]=input.value;editor.changed=true;
 if(input.dataset.field==="orderType"){
  paintOrder();return;
 }
 if(input.dataset.field==="giftType"&&editor.data.giftType==="limited"&&Number(editor.data.giftPrice)<600000){
  editor.data.giftPrice="600000";const price=$("so-edit-giftPrice");if(price)price.value="600000";
 }
};
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