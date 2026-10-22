(function(){
"use strict";
/* V2 is a browser-only prototype; no server, real Lark bot or shared data. */
var RECORDS_KEY="honor-v2-embedded-service-records-v1";
var SETTINGS_KEY="honor-v2-embedded-notify-settings-v1";
var SCOPE="honor-v2-embedded";
var KINDS={unban:"账号解封 / Account Unban",banner:"Banner & Splash",gift:"定制礼物 / Custom Gift",ride:"定制座驾 / Custom Ride"};
var TYPE_LIST=["Banner-24h","Banner-48h","Splash-24h","Splash-48h","Splash-55h","Splash-72h"];
var DESIGNERS=["Jackson W YANG","Luka YM GAO","MA-Emillia"];
var DEFAULT_CONFIG={};
Object.keys(KINDS).forEach(function(k){DEFAULT_CONFIG[k]={enabled:true,group:"",groupId:""}});
function read(key,fallback){try{var x=JSON.parse(localStorage.getItem(key)||"null");return x===null?fallback:x}catch(e){return fallback}}
var records=read(RECORDS_KEY,{});
if(!records||Array.isArray(records)||typeof records!=="object")records={};
var config=read(SETTINGS_KEY,DEFAULT_CONFIG);
Object.keys(KINDS).forEach(function(k){if(!config[k])config[k]={enabled:true,group:"",groupId:""}});
var active=null,tab="base",screen="record",error="",queued=[];
var root,body,footer,heading,subheading,tabs;
function $(selector){return document.querySelector(selector)}
function byId(id){return document.getElementById(id)}
function esc(v){return String(v===undefined||v===null?"":v).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]})}
function clone(v){return JSON.parse(JSON.stringify(v))}
function stamp(){return new Date().toLocaleString("sv-SE",{hour12:false})}
function newId(){return String(Date.now())+String(Math.floor(Math.random()*1000)).padStart(3,"0")}
function saveRecords(){try{localStorage.setItem(RECORDS_KEY,JSON.stringify(records));return true}catch(e){alert("本地数据保存失败。请检查浏览器存储空间。");return false}}
function saveConfig(){try{localStorage.setItem(SETTINGS_KEY,JSON.stringify(config));return true}catch(e){alert("通知设置保存失败");return false}}
function kindFor(value){
 var v=String(value||"").toLowerCase();
 if(/unban|unlock|解封/.test(v))return "unban";
 if(/splash|banner|open screen|开屏|横幅/.test(v))return "banner";
 if(/custom.*gift|定制礼物/.test(v))return "gift";
 if(/custom.*ride|定制座驾/.test(v))return "ride";
 return "";
}
function findForOrder(orderId){return Object.values(records).find(function(x){return x.linkedOrderId===String(orderId)})}
function showState(rec){
 if(!rec)return "未录入";
 if(rec.status==="draft")return "待补充";
 if(rec.status==="notified")return "已通知（模拟）";
 return "已提交";
}
function stateClass(rec){return !rec?"none":rec.status==="draft"?"draft":rec.status==="notified"?"notified":"submitted"}
function decorate(){
 var table=$(".orders-table");
 if(!table)return;
 var head=table.querySelector("thead tr");
 if(head&&!head.querySelector(".v2-service-head")){
  var th=document.createElement("th");th.className="v2-service-head";th.textContent="服务信息状态";
  head.insertBefore(th,head.lastElementChild);
  var cg=table.querySelector("colgroup");
  if(cg){var col=document.createElement("col");col.style.width="7%";cg.insertBefore(col,cg.lastElementChild)}
 }
 var rows=byId("orderRows");if(!rows)return;
 Array.from(rows.querySelectorAll("tr")).forEach(function(tr){
  var cells=tr.querySelectorAll("td");
  if(cells.length<20){
   var empty=tr.querySelector("td[colspan]");if(empty)empty.setAttribute("colspan","22");
   return;
  }
  var orderId=cells[0].textContent.trim(),benefit=cells[1].textContent.trim(),kind=kindFor(benefit);
  if(!orderId)return;
  var state=tr.querySelector(".v2-service-status");
  if(!state){state=document.createElement("td");state.className="v2-service-status";tr.insertBefore(state,tr.lastElementChild)}
  var rec=findForOrder(orderId);
  var label=kind?showState(rec):"不适用";
  if(state.textContent!==label)state.textContent=label;
  state.className="v2-service-status v2-service-label v2-state-"+(kind?stateClass(rec):"none");
  var actions=tr.lastElementChild;
  var button=actions.querySelector(".v2-service-open");
  if(kind&&!button){
   button=document.createElement("button");button.type="button";button.className="action-btn v2-service-open";
   button.setAttribute("data-v2-open",orderId);actions.appendChild(button);
  }
  if(button){button.textContent=rec?"查看/编辑服务信息":"录入服务信息";button.setAttribute("data-v2-open",orderId)}
 });
}
function rowData(orderId){
 var tr=Array.from(byId("orderRows").querySelectorAll("tr")).find(function(x){var a=x.querySelector("td");return a&&a.textContent.trim()===String(orderId)});
 if(!tr)return null;
 var t=tr.querySelectorAll("td");
 return {id:String(t[0].textContent).trim(),benefit:String(t[1].textContent).trim().replace(/\s+/g," "),
  uid:t[7].textContent.trim(),name:t[8].textContent.trim(),level:t[9].textContent.trim(),
  country:t[10].textContent.trim(),purchaseTime:t[12].textContent.trim().replace(/\s+/g," "),
  contactHint:t[18].textContent.trim().replace(/\s+/g," ")};
}
function newRecord(kind,order){
 var base={userId:order?order.uid:"",username:order?order.name:"",honorLevel:order?order.level:"",
 contact:"",contactHint:order?order.contactHint:"",actualCountry:order?order.country:"",
 purchasedPrivilege:order?order.benefit:"",purchasedApplication:"POPPO",purchaseTime:order?order.purchaseTime:""};
 return {id:newId(),linkedOrderId:order?order.id:"",kind:kind,base:base,agentId:"",
 initialNotes:"",details:{status:"pending",unbanStatus:"pending"},tasks:[],
 status:"draft",notifications:[],attachments:{},updatedAt:stamp(),lastSubmitted:""};
}
function panel(title,contents,hint){return '<section class="v2-panel"><h3>'+title+(hint?'<span class="v2-subtitle">'+hint+'</span>':"")+'</h3>'+contents+'</section>'}
function f(label,scope,key,value,options){
 options=options||{};
 var a='data-v2-scope="'+esc(scope)+'" data-v2-key="'+esc(key)+'"';
 if(options.task!==undefined)a+=' data-v2-task="'+esc(options.task)+'"';
 var attrs=options.readonly?" readonly":"";
 var mark=options.required?'<i class="v2-required">*</i>':"";
 var input;
 if(options.select){
  input='<select class="v2-select" '+a+(options.readonly?" disabled":"")+'>';
  options.select.forEach(function(item){var val=Array.isArray(item)?item[0]:item,text=Array.isArray(item)?item[1]:item;
   input+='<option value="'+esc(val)+'"'+(String(value||"")===String(val)?" selected":"")+'>'+esc(text)+'</option>';
  });input+="</select>";
 }else if(options.textarea){
  input='<textarea class="v2-textarea" '+a+attrs+' placeholder="'+esc(options.placeholder||"")+'">'+esc(value)+'</textarea>';
 }else{
  input='<input class="v2-input" '+a+' type="'+esc(options.type||"text")+'" value="'+esc(value)+'"'+attrs+
   (options.placeholder?' placeholder="'+esc(options.placeholder)+'"':"")+(options.list?' list="'+esc(options.list)+'"':"")+
   (options.type==="number"?' min="0"':"")+' autocomplete="off">';
 }
 return '<div class="v2-field'+(options.wide?" wide":"")+'"><label>'+esc(label)+mark+'</label>'+input+
  (options.help?'<small class="v2-help">'+options.help+'</small>':"")+'</div>';
}
function selectKind(value){
 return f("服务类型","kind","kind",value,{select:Object.keys(KINDS).map(function(x){return [x,KINDS[x]]})});
}
function baseContent(){
 var b=active.base;
 var pre='<div class="v2-hint-box">'+(active.linkedOrderId?
  '已关联荣誉兑换订单 <b>'+esc(active.linkedOrderId)+'</b>。已有购买和用户资料自动带入，减少重复录入。':
  '特殊申请 / VIP 手动录入：请填写可确认的基础资料，首次录入不会创建商城交易订单。')+'</div>';
 var locked=!!active.linkedOrderId;
 return pre+panel("关联订单与用户信息",
  '<div class="v2-grid">'+
  f("关联兑换订单ID","readonly","linkedOrderId",active.linkedOrderId||"无（手动录入）",{readonly:true})+
  f("服务类型","readonly","kind",KINDS[active.kind],{readonly:true})+
  f("User ID / 用户ID","base","userId",b.userId,{readonly:locked,required:true})+
  f("Username / 用户名","base","username",b.username,{readonly:locked,required:true})+
  f("Honor Level / 荣誉等级","base","honorLevel",b.honorLevel,{readonly:locked})+
  f("Purchased Privilege / 购买权益","base","purchasedPrivilege",b.purchasedPrivilege,{readonly:locked})+
  f("Purchase Time / 购买时间","base","purchaseTime",b.purchaseTime,{readonly:locked,type:locked?"text":"datetime-local"})+
  f("Purchased Application / 购买应用","base","purchasedApplication",b.purchasedApplication,{select:["POPPO","VONE"]})+
  f("Actual Country / 实际国家","base","actualCountry",b.actualCountry,{placeholder:"Country / Region"})+
  f("Contact / 联系方式","base","contact",b.contact,{placeholder:"WhatsApp / Telegram / Other",help:b.contactHint?"原订单联系方式（脱敏）："+esc(b.contactHint):"请根据实际资料填写"})+
  '</div>',"带入字段只读；联系方式和实际国家可补充");
}
function datePlus(start,hours){
 if(!start||!hours)return "";
 var d=new Date(start+":00Z");
 if(isNaN(d.getTime()))return "";
 d.setUTCHours(d.getUTCHours()+hours);
 return d.toISOString().slice(0,16);
}
function durationHours(type){var m=String(type||"").match(/-(\d+)h$/i);return m?Number(m[1]):0}
function taskContent(t,index){
 var scope="task",id=t.id;
 var row='<div class="v2-grid">'+
 f("Type / 投放类型",scope,"type",t.type,{task:id,select:TYPE_LIST,required:true})+
 f("Country / 投放国家",scope,"country",t.country,{task:id,required:true,placeholder:"Egypt / India ..."})+
 f("Timezone / 投放时区",scope,"timezone",t.timezone,{task:id,select:["UTC+0","UTC+1","UTC+2","UTC+3","UTC+4","UTC+5","UTC+5:30","UTC+6","UTC+7","UTC+8","UTC+9","UTC-3","UTC-4","UTC-5","UTC-6","UTC-7","UTC-8"]})+
 f("Start Time / 上线时间",scope,"start",t.start,{task:id,type:"datetime-local",required:true})+
 f("End Time / 结束时间",scope,"end",t.end,{task:id,type:"datetime-local",required:true})+
 '<div class="v2-field"><label>Image / 图片素材</label><input class="v2-input" type="file" accept="image/*" multiple data-v2-file="image" data-v2-task="'+esc(id)+'">'+
 '<small class="v2-help">支持多张图片；仅保存在当前浏览器中</small>'+
 fileChips("task:"+id,"image")+'</div></div>';
 return '<div class="v2-task-card"><div class="v2-task-head"><b>投放任务 '+(index+1)+' · '+esc(t.type)+'</b>'+
 '<button class="v2-link red" data-v2-delete-task="'+esc(t.id)+'">移除任务</button></div><div class="v2-task-main">'+row+
 '<div class="v2-help">每条任务独立配置类型、国家、素材、时区和投放排期；系统默认按类型推算结束时间，可人工调整。</div></div></div>';
}
function fileChips(area,field){
 var items=active.attachments[area+"|"+field]||[];
 if(!items.length)return '<small class="v2-attach-note">尚未上传文件</small>';
 return '<div class="v2-mini-files">'+items.map(function(name){return '<button class="v2-file-chip" data-v2-download="'+esc(area)+'" data-v2-field="'+esc(field)+'" data-v2-filename="'+esc(name)+'" type="button">↓ '+esc(name)+'</button>'}).join("")+'</div>';
}
function bannerFirst(){
 var tasks=active.tasks||[];
 var p='<div class="v2-grid">'+f("Agent ID / 代理ID","top","agentId",active.agentId,{required:true,placeholder:"输入代理ID"})+
  f("首次提交说明 / Notes","top","initialNotes",active.initialNotes,{textarea:true})+'</div>';
 p+=panel("选择 Banner / Splash 类型",
  '<div class="v2-grid-banner"><div class="v2-banner-select"><div class="v2-pane-title">左侧 · 可添加类型（支持重复）</div>'+
  TYPE_LIST.map(function(type){return '<label><button class="v2-link" data-v2-addtype="'+esc(type)+'" type="button">＋ '+esc(type)+'</button></label>'}).join("")+'</div>'+
  '<div class="v2-banner-select"><div class="v2-pane-title">右侧 · 已选择任务 '+tasks.length+'</div><div class="v2-banner-preview">'+
  (tasks.length?tasks.map(function(t){return '<span class="v2-pill">'+esc(t.type)+" · "+esc(t.country||"待填")+'</span>'}).join(""):'<span class="v2-help">请从左侧添加一项或多项，每项都有独立排期。</span>')+
  '</div></div></div>','同类型可重复添加');
 p+=panel("独立投放配置",tasks.length?tasks.map(taskContent).join(""):'<div class="v2-hint-box warning">至少添加一条投放任务后再提交。</div>',
  '<span class="v2-subtitle">独立国家 / 时间 / 素材</span>');
 return panel("首次录入信息",p);
}
function firstContent(){
 if(active.kind==="banner")return bannerFirst();
 if(active.kind==="unban")return panel("解封业务资料",
  '<div class="v2-grid">'+f("Account ID / 解封账号","detail","accountId",active.details.accountId||active.base.userId,{required:true})+
  f("Suspension Reason / 封禁原因","detail","suspensionReason",active.details.suspensionReason,{textarea:true,wide:true})+
  f("Unlocking Status / 解封结果","detail","unbanStatus",active.details.unbanStatus||"pending",{select:[["pending","Pending / 待处理"],["progress","In Progress / 处理中"],["unbanned","Unbanned / 解封成功"],["failed","Failed / 无法解封"]]})+'</div>');
 return panel("区域首次录入",'<div class="v2-hint-box">本类型由区域员工先确认用户与购买资料，无需重复录入原商城订单已有的字段。点击「基础订单信息」核对自动带入的数据，制作资料在「二次编辑」中补齐。</div>'+
  '<div class="v2-grid">'+f("首次需求说明 / Notes","top","initialNotes",active.initialNotes,{textarea:true,wide:true,placeholder:"补充用户需求或来源信息"})+'</div>');
}
function designerFields(){
 return f("Processing UI / UI 设计师","detail","processingUI",active.details.processingUI,{list:"v2DesignerList",placeholder:"Jackson W YANG",help:"提交后在模拟 Lark 消息中 @ 该设计师，实际成员 ID 由正式后端映射"});
}
function mediaField(label,key,accept,multiple){
 return '<div class="v2-field"><label>'+esc(label)+'</label><input class="v2-input" type="file" accept="'+esc(accept||"*/*")+'" '+
 (multiple?"multiple ":"")+'data-v2-file="'+esc(key)+'" data-v2-task=""><small class="v2-help">测试附件仅保存在当前浏览器</small>'+
 fileChips("record",key)+'</div>';
}
function schedule(){
 return f("制作排期开始","detail","scheduleStart",active.details.scheduleStart,{type:"date"})+
 f("制作排期结束","detail","scheduleEnd",active.details.scheduleEnd,{type:"date"});
}
function secondContent(){
 var d=active.details,base=active.base;
 var status=f("Status / 服务处理阶段","detail","status",d.status||"pending",{
 select:[["pending","Pending / 待处理"],["materials","Collecting Materials / 资料收集中"],
 ["design","UI Design / 设计中"],["review","Awaiting Approval / 待确认"],
 ["ready","Ready to Launch / 待上线"],["complete","Completed / 已完成"]]});
 var content=status;
 if(active.kind==="banner"){
  content+=f("Group Link / 群聊链接","detail","groupLink",d.groupLink,{placeholder:"WhatsApp / Lark"});
  content+=f("Config Link / 配置链接","detail","configLink",d.configLink,{placeholder:"https://..."});
  content+=f("Color / 颜色","detail","color",d.color);
  content+=f("Copy / 投放文案","detail","copy",d.copy,{textarea:true,wide:true});
  content+=f("Notes / 备注","detail","notes",d.notes,{textarea:true,wide:true});
 }else if(active.kind==="gift"){
  content+=f("Honor Wall ID / 荣誉墙ID","detail","honorWallId",d.honorWallId);
  content+=f("Nationality / 国籍","detail","nationality",d.nationality||base.actualCountry);
  content+=f("Online Country / 上线国家","detail","onlineCountry",d.onlineCountry);
  content+=f("Gift Type / 礼物类型","detail","giftType",d.giftType||"regular",{select:[["regular","Regular / 普通"],["limited","Limited / 限定"]]});
  content+=f("Gift Name / 礼物名称","detail","giftName",d.giftName,{required:true});
  content+=f("Gift Price / 礼物价格","detail","giftPrice",d.giftPrice,{type:"number"});
  content+=f("Valid Duration / 有效期","detail","validDuration",d.validDuration||"2 months",{select:["1 month","2 months","3 months","6 months"]});
  content+=f("Gift Description / 礼物描述","detail","giftDescription",d.giftDescription,{textarea:true,wide:true,help:"按原有要求，新增内容建议不超过10个英文单词"});
  content+=mediaField("Gift Image / 礼物图片","giftImage","image/*");
  content+=mediaField("Reference Image / 参考图","giftReferenceImage","image/*",true);
  content+=mediaField("Video Material / 视频素材","giftVideo","video/*,.mp4,.mov");
  content+=designerFields()+schedule();
  content+=f("Files / 制作文件说明","detail","files",d.files,{textarea:true,wide:true});
  content+=f("Notes / 备注","detail","notes",d.notes,{textarea:true,wide:true});
 }else if(active.kind==="ride"){
  content+=f("Honor Wall ID / 荣誉墙ID","detail","honorWallId",d.honorWallId);
  content+=f("Nationality / 国籍","detail","nationality",d.nationality||base.actualCountry);
  content+=f("Theme / 主题","detail","theme",d.theme);
  content+=f("Background / Scene / 背景场景","detail","backgroundScene",d.backgroundScene,{textarea:true,wide:true});
  content+=f("Ride Name / 座驾名称","detail","rideName",d.rideName,{required:true});
  content+=mediaField("Reference Image or Video / 参考素材","referenceMedia","image/*,video/*",true);
  content+=mediaField("Design Files / 设计文件","designFiles","image/*,video/*,.pdf,.zip",true);
  content+=designerFields()+schedule();
  content+=f("Notes / 备注","detail","notes",d.notes,{textarea:true,wide:true});
 }else{
  content+=f("Unlocking Status / 解封结果","detail","unbanStatus",d.unbanStatus||"pending",
   {select:[["pending","待处理"],["progress","处理中"],["unbanned","解封成功"],["failed","无法解封"]]});
  content+=f("Processing Notes / 处理说明","detail","notes",d.notes,{textarea:true,wide:true});
 }
 return panel("海外运营二次编辑",'<div class="v2-grid">'+content+'</div>',
 "填写完成后「提交并通知」；已提交信息修改后再次提交将重新生成通知");
}
function logContent(){
 var logs=active.notifications||[];
 return panel("Lark 通知记录（模拟）",'<div class="v2-hint-box warning">目前 GitHub Pages 不连接真实 Lark，通知只生成本地模拟记录，不会发送任何消息。</div>'+
 (logs.length?logs.slice().reverse().map(function(x){
 return '<div class="v2-notice"><b>'+esc(x.label)+' · '+esc(x.result)+'</b><small>'+esc(x.time)+' / '+esc(x.group||"未配置接收群")+'</small>'+
 '<p>'+esc(x.body)+'</p>'+(x.changes?'<small>修改字段：'+esc(x.changes)+'</small>':"")+'</div>';
 }).join(""):'<div class="v2-help">尚无通知记录。</div>'));
}
function settingsContent(){
 var sections=Object.keys(KINDS).map(function(k){
 var c=config[k]||{};
 return panel(KINDS[k],'<div class="v2-grid">'+
  f("通知开关","config","enabled",String(c.enabled!==false),{task:k,select:[["true","启用"],["false","关闭"]]})+
  f("接收群名称","config","group",c.group,{task:k,placeholder:"例如：设计团队群"})+
  f("接收群ID（可选）","config","groupId",c.groupId,{task:k,placeholder:"正式接口接入时使用"})+
  '</div>');
 }).join("");
 return '<div class="v2-hint-box warning">此处可为四类服务分别配置通知接收群；不固定群名。当前仅本地模拟通知，请勿填写机器人 Webhook 或访问令牌。</div>'+sections;
}
function recordsContent(){
 var rs=Object.values(records).sort(function(a,b){return String(b.updatedAt).localeCompare(String(a.updatedAt))});
 if(!rs.length)return '<div class="v2-hint-box">暂无服务记录，点击原订单行内「录入服务信息」开始。</div>';
 return panel("已录入服务记录",'<table class="v2-records-table"><thead><tr><th>关联订单</th><th>类型</th><th>状态</th><th>更新</th><th>操作</th></tr></thead><tbody>'+
 rs.map(function(x){return '<tr><td>'+esc(x.linkedOrderId||"特殊申请")+'</td><td>'+esc(KINDS[x.kind])+'</td><td>'+esc(showState(x))+
 '</td><td>'+esc(x.updatedAt)+'</td><td><button type="button" class="v2-link" data-v2-edit="'+esc(x.id)+'">打开</button></td></tr>'}).join("")+
 '</tbody></table>');
}
function manualContent(){
 return panel("手动录入服务信息",'<div class="v2-hint-box">仅用于 VIP / OVERSEAS 等没有对应商城兑换订单的特殊服务需求；不会重复创建商城兑换订单。</div>'+
 '<div class="v2-grid">'+selectKind("unban")+'</div><div style="padding-top:14px"><button class="v2-btn primary" type="button" data-v2-newmanual>开始录入</button></div>');
}
function errorMessage(txt){error=txt||"";var el=$(".v2-bad");if(el)el.textContent=error}
function setHeader(title,desc){
 heading.textContent=title;subheading.textContent=desc||"";
}
function show(){
 if(!root)return;
 var title=screen==="settings"?"Lark 通知配置（模拟）":screen==="records"?"服务记录列表":screen==="manual"?"手动录入服务信息":
  "录入服务信息 / Enter Service Details";
 setHeader(title,screen==="record"?(active.linkedOrderId?"关联兑换订单 "+active.linkedOrderId:"特殊申请")+" · "+KINDS[active.kind]:
  "V2 原始荣誉订单内嵌流程 · 浏览器本地测试");
 var hasRecord=screen==="record";
 tabs.parentNode.style.display=hasRecord?"block":"none";
 if(hasRecord){
  var nav=[["base","基础订单信息"],["first","首次录入"],["second","二次编辑"],["log","通知记录"]];
  tabs.innerHTML=nav.map(function(item){return '<button class="v2-tab'+(tab===item[0]?" active":"")+'" type="button" data-v2-tab="'+item[0]+'">'+item[1]+'</button>'}).join("");
 }
 var html=screen==="settings"?settingsContent():screen==="records"?recordsContent():screen==="manual"?manualContent():
  tab==="base"?baseContent():tab==="first"?firstContent():tab==="second"?secondContent():logContent();
 body.innerHTML='<div class="v2-bad">'+esc(error)+'</div>'+html;
 footer.innerHTML=screen==="record"?
  '<span class="v2-chip-line"><span class="v2-pill">'+esc(showState(active))+'</span><span class="v2-spinner">浏览器本地保存</span></span>'+
  '<div class="v2-foot-right"><button class="v2-btn" type="button" data-v2-save>保存草稿</button>'+
  '<button class="v2-btn success" type="button" data-v2-submit>提交并通知</button></div>':
  '<span class="v2-help">'+(screen==="settings"?"无需写死接收群，可随时更新":"测试模式，不写入商城真实订单")+'</span>'+
  '<button class="v2-btn" data-v2-close type="button">'+(screen==="settings"?"保存并关闭":"关闭")+'</button>';
}
function openScreen(type){
 screen=type;error="";root.classList.add("open");root.setAttribute("aria-hidden","false");document.body.style.overflow="hidden";show();
}
function close(){
 root.classList.remove("open");root.setAttribute("aria-hidden","true");document.body.style.overflow="";active=null;queued=[];error="";decorate();
}
function editOrder(orderId){
 var rec=findForOrder(orderId);
 if(rec){active=clone(rec);tab="base";queued=[];openScreen("record");return}
 var origin=rowData(orderId);if(!origin)return alert("订单信息读取失败，请刷新页面后重试");
 var kind=kindFor(origin.benefit);
 if(!kind)return alert("此权益暂不支持服务资料录入");
 active=newRecord(kind,origin);tab="base";queued=[];openScreen("record");
}
function saveDraft(){
 if(!active)return;
 active.status="draft";active.updatedAt=stamp();
 records[active.id]=clone(active);
 if(saveRecords()){saveFiles();errorMessage("");decorate();show()}
}
function validate(){
 var b=active.base,d=active.details;
 if(!String(b.userId||"").trim())return "请补充 User ID。";
 if(!String(b.username||"").trim())return "请补充 Username。";
 if(!String(b.purchasedApplication||"").trim())return "请确认 Purchased Application（POPPO 或 VONE）。";
 if(active.kind==="banner"){
  if(!String(active.agentId||"").trim())return "请填写 Agent ID。";
  if(!active.tasks.length)return "请至少添加一条 Banner / Splash 投放任务。";
  for(var i=0;i<active.tasks.length;i++){
   var t=active.tasks[i];
   if(!t.type||!t.country||!t.start||!t.end)return "投放任务 "+(i+1)+" 的类型、国家、开始及结束时间不能为空。";
   if(t.end<=t.start)return "投放任务 "+(i+1)+" 的结束时间必须晚于开始时间。";
   if(!(active.attachments["task:"+t.id+"|image"]||[]).length)return "投放任务 "+(i+1)+" 请上传图片。";
  }
 }
 if(active.kind==="unban"&&!d.suspensionReason)return "请填写封禁原因。";
 if(active.kind==="gift"&&!d.giftName)return "请补充 Gift Name。";
 if(active.kind==="ride"&&!d.rideName)return "请补充 Ride Name。";
 if(["gift","ride"].includes(active.kind)&&!d.processingUI)return "请指定 Processing UI 设计师。";
 if(d.scheduleStart&&d.scheduleEnd&&d.scheduleEnd<d.scheduleStart)return "制作排期结束日期不能早于开始日期。";
 return "";
}
function buildNotification(kind,changes){
 var b=active.base,d=active.details;
 var title=active.lastSubmitted?"服务信息更新提醒":"新增服务信息提醒";
 var tasks=active.kind==="banner"?active.tasks.map(function(t){return t.type+" / "+t.country+" / "+t.start+" 至 "+t.end+" ("+t.timezone+")"}).join("; "):"";
 var names=["gift","ride"].includes(active.kind)&&d.processingUI?" @"+d.processingUI:"";
 return title+"｜"+KINDS[active.kind]+"｜用户 "+b.userId+" / "+b.username+
 "｜关联订单 "+(active.linkedOrderId||"特殊申请")+"｜应用 "+b.purchasedApplication+
 (tasks?"｜投放 "+tasks:"")+(names?"｜指定设计师"+names:"")+(changes?"｜更新 "+changes:"");
}
function submit(){
 if(!active)return;
 var failed=validate();if(failed){errorMessage(failed);return}
 var cfg=config[active.kind]||{},before=active.lastSubmitted||"",after=JSON.stringify({base:active.base,agentId:active.agentId,initialNotes:active.initialNotes,details:active.details,tasks:active.tasks,attachments:active.attachments});
 var fields=[];
 if(before){
  try{var prev=JSON.parse(before),now=JSON.parse(after);Object.keys(now).forEach(function(k){if(JSON.stringify(prev[k])!==JSON.stringify(now[k]))fields.push(k)})}catch(e){fields=["配置信息"]}
 }
 var changes=fields.join("、");
 var enabled=cfg.enabled!==false&&String(cfg.group||"").trim().length>0;
 var note={id:newId(),time:stamp(),group:cfg.group||"",result:enabled?"模拟已发送":"未发送（群未配置或开关关闭）",
 label:before?"更新通知":"首次通知",body:buildNotification(active.kind,changes),changes:changes};
 active.notifications=active.notifications||[];
 active.notifications.push(note);
 active.status=enabled?"notified":"submitted";
 active.lastSubmitted=after;active.updatedAt=stamp();
 records[active.id]=clone(active);
 if(!saveRecords())return;
 saveFiles();decorate();tab="log";error="";
 show();
 if(!enabled){errorMessage("服务资料已提交，但当前没有启用的 Lark 接收群，请到「通知配置」设置。此站点不会真实发送通知。")}
}
function saveFiles(){
 if(!queued.length)return;
 var pending=queued.slice();queued=[];
 if(!window.HonorServiceLocalMedia)return;
 pending.forEach(function(x){
  window.HonorServiceLocalMedia.save(SCOPE,x.recordId,x.field,x.files).catch(function(){
   alert("文件未能持久化保存到当前浏览器，请检查存储空间。");
  });
 });
}
async function downloadFile(btn){
 if(!window.HonorServiceLocalMedia){alert("当前浏览器不支持本地文件存储");return}
 var area=btn.getAttribute("data-v2-download"),field=btn.getAttribute("data-v2-field"),name=btn.getAttribute("data-v2-filename");
 try{
  var blob=await window.HonorServiceLocalMedia.read(SCOPE,active.id+"|"+area,field,name);
  if(!blob)throw Error("Missing attachment");
  var link=document.createElement("a"),url=URL.createObjectURL(blob);
  link.href=url;link.download=name;document.body.appendChild(link);link.click();link.remove();
  setTimeout(function(){URL.revokeObjectURL(url)},1200);
 }catch(e){alert("该附件仅保存在原浏览器，本次未找到文件。")}
}
function updateControl(target){
 if(!active&&screen!=="settings")return;
 var scope=target.getAttribute("data-v2-scope"),key=target.getAttribute("data-v2-key");
 if(!scope||!key)return;
 var value=target.value;
 if(scope==="base"){active.base[key]=value}
 else if(scope==="top"){active[key]=value}
 else if(scope==="detail"){active.details[key]=value}
 else if(scope==="task"){
  var id=target.getAttribute("data-v2-task"),item=active.tasks.find(function(t){return t.id===id});
  if(!item)return;
  item[key]=value;
  if(key==="end")item.manualEnd=true;
  if((key==="type"||key==="start")&&!item.manualEnd){
   item.end=datePlus(item.start,durationHours(item.type));
   var end=root.querySelector('[data-v2-scope="task"][data-v2-key="end"][data-v2-task="'+id+'"]');
   if(end)end.value=item.end;
  }
 }else if(scope==="config"){
  var kind=target.getAttribute("data-v2-task");if(!config[kind])config[kind]={};
  config[kind][key]=key==="enabled"?value==="true":value;
  saveConfig();
 }
}
function filesSelected(input){
 if(!active)return;
 var area=input.getAttribute("data-v2-task")?"task:"+input.getAttribute("data-v2-task"):"record";
 var field=input.getAttribute("data-v2-file"),files=Array.from(input.files||[]);
 if(!files.length)return;
 if(files.some(function(f){return f.size>25*1024*1024})){errorMessage("单个附件不能超过25MB");return}
 var key=area+"|"+field;
 var existing=active.attachments[key]||[];
 files.forEach(function(f){if(existing.indexOf(f.name)===-1)existing.push(f.name)});
 active.attachments[key]=existing;
 queued.push({recordId:active.id+"|"+area,field:field,files:files});
 show();
}
function addTask(type){
 active.tasks.push({id:newId(),type:type,country:active.base.actualCountry||"",timezone:"UTC+3",start:"",end:"",manualEnd:false});
 tab="first";error="";show();
}
function recordsPanel(){
 root=document.createElement("div");root.id="v2ServiceRoot";root.className="v2-overlay";root.setAttribute("aria-hidden","true");
 root.innerHTML='<aside class="v2-drawer" role="dialog" aria-modal="true" aria-labelledby="v2Title">'+
  '<div class="v2-drawer-header"><div><h2 id="v2Title"></h2><p id="v2Subtitle"></p></div><button class="v2-icon-close" type="button" data-v2-close>×</button></div>'+
  '<div class="v2-drawer-top"><div class="v2-tabs" id="v2Tabs"></div></div>'+
  '<div class="v2-body" id="v2Body"></div><div class="v2-footer" id="v2Footer"></div>'+
  '<datalist id="v2DesignerList">'+DESIGNERS.map(function(n){return '<option value="'+esc(n)+'"></option>'}).join("")+'</datalist></aside>';
 document.body.appendChild(root);
 body=byId("v2Body");footer=byId("v2Footer");heading=byId("v2Title");subheading=byId("v2Subtitle");tabs=byId("v2Tabs");
 root.addEventListener("click",function(e){
  if(e.target===root){close();return}
  var b=e.target.closest("button");if(!b)return;
  if(b.hasAttribute("data-v2-close")){close();return}
  if(b.hasAttribute("data-v2-tab")){tab=b.getAttribute("data-v2-tab");error="";show();return}
  if(b.hasAttribute("data-v2-addtype")){addTask(b.getAttribute("data-v2-addtype"));return}
  if(b.hasAttribute("data-v2-delete-task")){
   var id=b.getAttribute("data-v2-delete-task");active.tasks=active.tasks.filter(function(t){return t.id!==id});show();return;
  }
  if(b.hasAttribute("data-v2-edit")){active=clone(records[b.getAttribute("data-v2-edit")]);queued=[];tab="base";openScreen("record");return}
  if(b.hasAttribute("data-v2-newmanual")){
   var selector=root.querySelector('[data-v2-scope="kind"]');
   active=newRecord(selector?selector.value:"unban",null);queued=[];tab="base";openScreen("record");return;
  }
  if(b.hasAttribute("data-v2-save")){saveDraft();return}
  if(b.hasAttribute("data-v2-submit")){submit();return}
  if(b.hasAttribute("data-v2-download")){downloadFile(b);return}
 });
 root.addEventListener("input",function(e){updateControl(e.target)});
 root.addEventListener("change",function(e){
  if(e.target.hasAttribute("data-v2-file")){filesSelected(e.target);return}
  updateControl(e.target);
  if(e.target.getAttribute("data-v2-scope")==="task"&&e.target.getAttribute("data-v2-key")==="type")show();
 });
 document.addEventListener("keydown",function(e){if(e.key==="Escape"&&root.classList.contains("open"))close()});
}
function addToolbar(){
 var toolbar=$(".list-toolbar .toolbar-actions");if(!toolbar||toolbar.querySelector(".v2-service-toolbar"))return;
 var wrap=document.createElement("div");wrap.className="v2-service-toolbar";
 wrap.innerHTML='<button class="v2-primary" type="button" data-v2-toolbar="manual">＋ 手动录入服务信息</button>'+
  '<button type="button" data-v2-toolbar="records">服务记录</button>'+
  '<button type="button" data-v2-toolbar="settings">⚙ Lark 通知配置</button>';
 toolbar.insertBefore(wrap,toolbar.firstChild);
 wrap.addEventListener("click",function(e){
  var b=e.target.closest("[data-v2-toolbar]");if(!b)return;
  var name=b.getAttribute("data-v2-toolbar");
  openScreen(name==="manual"?"manual":name==="settings"?"settings":"records");
 });
}
function init(){
 addToolbar();recordsPanel();decorate();
 var rows=byId("orderRows");
 if(rows){
  rows.addEventListener("click",function(e){
   var b=e.target.closest("[data-v2-open]");if(b){e.preventDefault();e.stopPropagation();editOrder(b.getAttribute("data-v2-open"))}
  });
  var observer=new MutationObserver(function(ms){if(ms.some(function(m){return m.type==="childList"}))decorate()});
  observer.observe(rows,{childList:true});
 }
 window.V2HonorServicePrototype={getRecords:function(){return clone(records)},getConfig:function(){return clone(config)},
  openOrder:editOrder,openSettings:function(){openScreen("settings")},decorate:decorate};
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();