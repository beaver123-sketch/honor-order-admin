(function(){
"use strict";
// V2-only front-end prototype. Robot webhook is never stored or called.
var STORAGE="honor-v2-prototype-custom-records-v1",SCOPE="honor-v2-prototype-custom";
var TYPES=[["unban","账号解封"],["banner","banner&splash"],["gift","定制礼物"],["ride","定制座驾"]];
var STATUSES=["通过WhatsApp沟通中","待处理","用户取消/未回复","退回（超时）","UI设计跟进中","待确认","待上线","已完成"];
var REGIONS=["全部重要","南亚区","菲律宾区","俄语区","南美洲区","欧美区","非洲区","中东区","虚拟四区","越南区","印马区"];
var DESIGNERS=["Jackson W YANG","Luka YM GAO","MA-Emillia"];
var records=load(),form=null,modal=null,content=null,header=null,toolbarReady=false,observing=false,pendingFiles=[],transientWebhook="";
var regionsCache=[];
function load(){try{var val=JSON.parse(localStorage.getItem(STORAGE)||"[]");return Array.isArray(val)?val:[]}catch(e){return []}}
function save(){try{localStorage.setItem(STORAGE,JSON.stringify(records));return true}catch(e){notify("无法保存，请检查浏览器的可用存储空间");return false}}
function el(id){return document.getElementById(id)}
function q(s,base){return (base||document).querySelector(s)}
function esc(v){return String(v==null?"":v).replace(/[&<>"']/g,function(x){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[x]})}
function now(){return new Date().toLocaleString("sv-SE",{hour12:false})}
function uid(){return String(Date.now())+String(Math.floor(Math.random()*1000)).padStart(3,"0")}
function typeFromBenefit(name){var s=String(name||"").toLowerCase();
 if(/unlock|unban|解封/.test(s))return "unban";
 if(/splash|banner|open screen|横幅|开屏/.test(s))return "banner";
 if(/custom.*gift|定制礼物|自定义礼物/.test(s))return "gift";
 if(/custom.*ride|定制座驾|自定义座驾/.test(s))return "ride";
 return "";
}
function recordFor(orderId){return records.find(function(r){return String(r.orderId||"")===String(orderId)})}
function opt(list,value){return list.map(function(item){var v=Array.isArray(item)?item[0]:item,t=Array.isArray(item)?item[1]:item;
 return '<option value="'+esc(v)+'"'+(String(value)===String(v)?' selected':"")+'>'+esc(t)+'</option>'}).join("")}
function attr(key){return 'data-ci-key="'+esc(key)+'"'}
function inp(key,placeholder,settings){
 settings=settings||{};return '<input class="ci-input'+(settings.small?' ci-small-input':'')+'" '+attr(key)+
 ' value="'+esc(form[key]||"")+'" type="'+(settings.type||"text")+'" placeholder="'+esc(placeholder||"请输入文本")+'"'+(settings.list?' list="ciDesignerList"':'')+'>';
}
function sel(key,items,settings){
 settings=settings||{};
 return '<select class="ci-select'+(settings.status?' ci-status-select':'')+'" '+attr(key)+'>'+
 opt(items,form[key]||"")+'</select>';
}
function text(key,style){return '<textarea class="ci-textarea '+(style||"")+'" '+attr(key)+'" placeholder="请输入文本">'+esc(form[key]||"")+'</textarea>'}
function row(title,part,rightTitle,rightPart,more){
 return '<div class="ci-row'+(rightTitle?'':' single')+(more?' '+more:'')+'"><div class="ci-label">'+title+'</div>'+
 '<div>'+part+'</div>'+(rightTitle?'<div class="ci-label">'+rightTitle+'</div><div>'+rightPart+'</div>':'')+'</div>';
}
function wide(title,part){return '<div class="ci-row wide"><div class="ci-label">'+title+'</div><div>'+part+'</div></div>'}
function toggle(){
 return '<label class="ci-switch"><input type="checkbox" data-ci-toggle="lark"'+(form.notify?" checked":"")+'><span></span></label>';
}
function webhook(){
 return wide("配置机器人webhook",'<input type="text" class="ci-input ci-long-input" id="ciWebhook" placeholder="仅演示配置（真实 Webhook 不会保存或发送）" value="'+esc(transientWebhook)+'"><div class="ci-help">测试站点不会调用机器人接口，正式通知需接入服务端。</div>');
}
function upload(key,label,accept,multi){
 var files=(form.files||{})[key]||[];
 return wide(label,'<div class="ci-upload-line"><button class="ci-choose" type="button" data-ci-choose="'+esc(key)+'">选择文件</button>'+
 '<input class="ci-hidden-file" type="file" data-ci-file="'+esc(key)+'" accept="'+esc(accept||"*/*")+'"'+(multi?' multiple':'')+'>'+
 '<span class="ci-filelist">'+esc(files.join("、"))+'</span></div>');
}
function orderOptions(){
 var out=[["","不关联（手动录入）"]],table=q(".orders-table");
 if(!table)return out;
 var ids=new Set();
 Array.from(q("#orderRows").querySelectorAll("tr")).forEach(function(tr){
  var cells=tr.querySelectorAll("td");if(cells.length<18)return;
  var id=cells[0].textContent.trim(),benefit=cells[1].textContent.replace(/\s+/g," ").trim();
  if(!ids.has(id)&&id){ids.add(id);out.push([id,id+" · "+benefit])}
 });
 if(form&&form.orderId&&!ids.has(form.orderId))out.push([form.orderId,form.orderId]);
 return out;
}
function getOrderInfo(id){
 if(!id)return null;
 var rows=Array.from(q("#orderRows").querySelectorAll("tr"));
 var tr=rows.find(function(tr){var td=tr.querySelector("td");return td&&td.textContent.trim()===String(id)});
 if(!tr)return null;
 var t=tr.querySelectorAll("td");
 return {orderId:id,benefit:t[1].textContent.replace(/\s+/g," ").trim(),userId:t[7].textContent.trim(),username:t[8].textContent.trim(),
 level:t[9].textContent.trim(),country:t[10].textContent.trim(),orderTime:t[12].innerText||t[12].textContent};
}
function regionControl(key){
 var chosen=Array.isArray(form[key])?form[key]:[];
 return '<div class="ci-regions">'+
 REGIONS.map(function(r){return '<label><input type="checkbox" data-ci-region="'+esc(key)+'" value="'+esc(r)+'"'+(chosen.includes(r)?" checked":"")+'>'+esc(r)+'</label>'}).join("")+
 '<input class="ci-region-search" data-ci-region-search="'+esc(key)+'" placeholder="请输入国家">'+
 '<button class="ci-mini-btn" type="button" data-ci-country-add="'+esc(key)+'">已选国家</button>'+
 '<button class="ci-mini-btn" type="button" data-ci-country-clear="'+esc(key)+'">取消已选</button></div>'+
 (chosen.filter(function(r){return !REGIONS.includes(r)}).length?
 '<div class="ci-region-tags">'+chosen.filter(function(r){return !REGIONS.includes(r)}).map(function(r){return '<span>'+esc(r)+'</span>'}).join("")+'</div>':"");
}
function dateRange(){
 return '<div class="ci-date-range"><input class="ci-input" type="datetime-local" '+attr("startTime")+' value="'+esc(form.startTime||"")+'">'+
 '<b>至</b><input class="ci-input" type="datetime-local" '+attr("endTime")+' value="'+esc(form.endTime||"")+'"></div>';
}
function phaseRow(){return '<div class="ci-row"><div class="ci-label">类型</div><div>'+sel("kind",TYPES)+'</div>'+
 '<div class="ci-label">处理状态</div><div>'+sel("processingStatus",STATUSES,{status:true})+'</div></div>'}
function unblock(){
 return row("类型",sel("kind",TYPES))+
 wide("封禁原因",text("suspensionReason","reason"))+
 row("封禁状态",sel("unlockingStatus",[["yes","是"],["no","否"]]))+
 row("lark消息通知",toggle())+webhook();
}
function banner(){
 var c=regionControl("displayRegions");
 var content=phaseRow()+
 wide("展示地区",c)+
 row("颜色",inp("color","请输入"),"",null)+
 wide("文案",inp("copy","请输入文本"))+
 wide("文字内容",inp("wording","请输入文本"))+
 row("群组链接",inp("groupLink","请输入链接"),"配置链接",inp("configLink","请输入链接"))+
 upload("image","图片素材","image/*",true)+
 wide("备注",text("notes","notes"))+
 wide("开始时间-结束时间",dateRange())+
 row("ui设计师",inp("processingUI","请@对应设计师",{list:true}),"最终设计稿",
   '<div class="ci-upload-line"><button class="ci-choose" type="button" data-ci-choose="finalDesign">选择文件</button><input class="ci-hidden-file" type="file" data-ci-file="finalDesign" accept="image/*,.pdf"><span class="ci-filelist">'+esc(((form.files||{}).finalDesign||[]).join("、"))+'</span></div>')+
 row("lark消息通知",toggle())+webhook();
 // Retain the original prototype layout, with optional extra per-type schedules.
 content+='<div class="ci-banner-extras"><header><span>独立投放排期（同类型可重复配置）</span>'+
 '<button type="button" class="ci-add-slot" data-ci-addslot>＋ 添加投放任务</button></header>'+
 '<div class="ci-slots">'+(form.slots||[]).map(function(slot,i){return slotUi(slot,i)}).join("")+'</div></div>';
 return content;
}
function slotUi(slot,index){
 return '<div class="ci-slot" data-ci-slot="'+index+'">'+
 '<select data-ci-slot-key="type" data-ci-slot-index="'+index+'">'+opt(["Banner-24h","Banner-48h","Splash-24h","Splash-48h","Splash-55h","Splash-72h"],slot.type)+'</select>'+
 '<input placeholder="投放国家" data-ci-slot-key="country" data-ci-slot-index="'+index+'" value="'+esc(slot.country||"")+'">'+
 '<input type="datetime-local" data-ci-slot-key="start" data-ci-slot-index="'+index+'" value="'+esc(slot.start||"")+'">'+
 '<input type="datetime-local" data-ci-slot-key="end" data-ci-slot-index="'+index+'" value="'+esc(slot.end||"")+'">'+
 '<select data-ci-slot-key="timezone" data-ci-slot-index="'+index+'">'+opt(["UTC+0","UTC+1","UTC+2","UTC+3","UTC+4","UTC+5","UTC+5:30","UTC+6","UTC+7","UTC+8","UTC+9","UTC-3","UTC-4","UTC-5"],slot.timezone||"UTC+3")+'</select>'+
 '<button type="button" data-ci-removeslot="'+index+'">删除此任务</button>'+
 '<label style="grid-column:1/-1;font-size:11px;color:#647992">独立图片素材 <input type="file" accept="image/*" multiple data-ci-file="slot-'+esc(slot.id)+'" style="max-width:100%;font-size:11px">'+
 '<small style="margin-left:5px">'+esc(((form.files||{})["slot-"+slot.id]||[]).join("、"))+'</small></label></div>';
}
function gift(){
 return phaseRow()+
 row("荣誉墙id",inp("honorWallId","请输入文本"))+
 wide("国籍",regionControl("nationality"))+
 wide("上线国家",regionControl("onlineCountries"))+
 row("礼物名称",inp("giftName","请输入文本"),"礼物价格",inp("giftPrice","请输入文本"))+
 wide("礼物描述",inp("giftDescription","请输入文本"))+
 row("礼物图片",'<div class="ci-upload-line"><button class="ci-choose" type="button" data-ci-choose="giftImage">选择文件</button><input class="ci-hidden-file" type="file" data-ci-file="giftImage" accept="image/*"><span class="ci-filelist">'+esc(((form.files||{}).giftImage||[]).join("、"))+'</span></div>',
 "模板视频素材",'<div class="ci-upload-line"><button class="ci-choose" type="button" data-ci-choose="giftVideo">选择文件</button><input class="ci-hidden-file" type="file" data-ci-file="giftVideo" accept="video/*,.mov,.mp4"><span class="ci-filelist">'+esc(((form.files||{}).giftVideo||[]).join("、"))+'</span></div>')+
 row("有效时长",inp("validDuration","请输入文本"))+
 wide("备注",text("notes","notes"))+
 row("群组链接",inp("groupLink","请输入链接"))+
 row("ui设计师",inp("processingUI","请@对应设计师",{list:true}))+
 row("lark消息通知",toggle())+webhook();
}
function ride(){
 return phaseRow()+
 row("荣誉墙id",inp("honorWallId","请输入文本"))+
 wide("国籍",regionControl("nationality"))+
 row("主题",inp("theme","请输入文本"))+
 row("背景/场景",'<div class="ci-upload-line"><button class="ci-choose" type="button" data-ci-choose="scene">选择文件</button><input class="ci-hidden-file" type="file" data-ci-file="scene" accept="image/*,video/*"><span class="ci-filelist">'+esc(((form.files||{}).scene||[]).join("、"))+'</span></div>')+
 row("座驾名称",inp("rideName","请输入文本"))+
 row("参考图片",'<div class="ci-upload-line"><button class="ci-choose" type="button" data-ci-choose="referenceImage">选择文件</button><input class="ci-hidden-file" type="file" data-ci-file="referenceImage" accept="image/*"><span class="ci-filelist">'+esc(((form.files||{}).referenceImage||[]).join("、"))+'</span></div>')+
 row("参考视频",inp("referenceVideo","请输入链接"))+
 upload("attachment","附件","image/*,video/*,.pdf,.zip",true)+
 wide("备注",text("notes","notes"))+
 row("ui设计师",inp("processingUI","请@对应设计师",{list:true}))+
 row("lark消息通知",toggle())+webhook();
}
function newForm(orderId){
 var info=getOrderInfo(orderId),kind=info?typeFromBenefit(info.benefit):"unban";
 var existing=orderId?recordFor(orderId):null;
 if(existing)return JSON.parse(JSON.stringify(existing));
 return {id:uid(),orderId:orderId||"",kind:kind||"unban",processingStatus:STATUSES[0],unlockingStatus:"yes",notify:true,files:{},
  displayRegions:[],nationality:[],onlineCountries:[],slots:[],created:now(),updated:""};
}
function open(orderId){
 form=newForm(orderId);pendingFiles=[];transientWebhook="";
 modal.classList.add("show");modal.setAttribute("aria-hidden","false");document.body.style.overflow="hidden";render();
}
function close(){modal.classList.remove("show");modal.setAttribute("aria-hidden","true");document.body.style.overflow="";form=null;pendingFiles=[];transientWebhook="";}
function render(){
 if(!form)return;
 var orderSelect='<span class="ci-link-order">关联订单 <select data-ci-order>'+opt(orderOptions(),form.orderId||"")+'</select></span>';
 header.innerHTML='<h2 id="ciTitle">定制信息录入</h2>'+orderSelect;
 content.innerHTML='<div class="ci-error" id="ciError"></div>'+
 (form.kind==="unban"?unblock():form.kind==="banner"?banner():form.kind==="gift"?gift():ride())+
 '<datalist id="ciDesignerList">'+DESIGNERS.map(function(x){return '<option value="@'+esc(x)+'"></option>'}).join("")+'</datalist>';
}
function notify(message,success){
 var old=q(".ci-notice");if(old)old.remove();
 var d=document.createElement("div");d.className="ci-notice"+(success?" success":"");d.textContent=message;document.body.appendChild(d);setTimeout(function(){if(d.parentNode)d.remove()},3100);
}
function error(msg){var x=el("ciError");if(x){x.textContent=msg;x.classList.add("show");x.scrollIntoView({block:"nearest"})}}
function persistUploads(){
 if(!pendingFiles.length)return;
 if(!window.HonorServiceLocalMedia){notify("文件名已保存，但当前浏览器不支持附件本地存储");return}
 var pending=pendingFiles.slice();pendingFiles=[];
 pending.forEach(function(item){
 window.HonorServiceLocalMedia.save(SCOPE,form.id,item.key,item.files).catch(function(){notify("附件本地保存失败")});
 });
}
function saveForm(){
 if(!form)return;
 if(form.kind==="banner"&&form.startTime&&form.endTime&&form.startTime>form.endTime)return error("投放结束时间不能早于开始时间。");
 for(var i=0;i<(form.slots||[]).length;i++){
  var x=form.slots[i];if(x.start&&x.end&&x.end<x.start)return error("独立投放任务 "+(i+1)+" 的结束时间不能早于开始时间。");
 }
 var idx=records.findIndex(function(x){return x.id===form.id});
 form.updated=now();
 form.noticeState=form.notify?"模拟通知已记录":"通知未启用";
 // The actual webhook remains in transient page memory, never localStorage.
 var clean=JSON.parse(JSON.stringify(form));
 clean.notifications=clean.notifications||[];
 if(clean.notify)clean.notifications.push({at:now(),state:"模拟通知（未实际发送）"});
 if(idx>=0)records[idx]=clean;else records.unshift(clean);
 if(!save())return;
 persistUploads();
 decorate();
 close();
 notify("已保存定制信息"+(clean.notify?"；Lark 通知仅模拟，未实际发送":"")+"。",true);
}
function chooseFiles(target){
 if(!form)return;
 var key=target.getAttribute("data-ci-file");
 var files=Array.from(target.files||[]);
 if(!files.length)return;
 if(files.some(function(x){return x.size>25*1024*1024}))return error("单个附件不能超过 25MB。");
 var names=files.map(function(x){return x.name}),existing=form.files[key]||[];
 form.files[key]=Array.from(new Set(existing.concat(names)));
 pendingFiles.push({key:key,files:files});
 render();
}
function syncField(t){
 if(!form)return;
 if(t.hasAttribute("data-ci-order")){
  var id=t.value;
  var oldType=form.kind;
  if(id){
   var existing=recordFor(id);
   if(existing){form=JSON.parse(JSON.stringify(existing));pendingFiles=[]}
   else{
    var info=getOrderInfo(id),type=typeFromBenefit(info?.benefit||"");
    form.orderId=id;if(type)form.kind=type;
   }
  }else form.orderId="";
  render();return;
 }
 if(t.id==="ciWebhook"){transientWebhook=t.value;return}
 var key=t.getAttribute("data-ci-key");
 if(key){
  form[key]=t.value;
  if(key==="kind"){form.kind=t.value;render()}
 }
 if(t.hasAttribute("data-ci-toggle"))form.notify=t.checked;
 if(t.hasAttribute("data-ci-region")){
  var group=t.getAttribute("data-ci-region"),value=t.value,arr=form[group]||[];
  form[group]=t.checked?Array.from(new Set(arr.concat(value))):arr.filter(function(x){return x!==value});
 }
 if(t.hasAttribute("data-ci-slot-key")){
  var i=Number(t.getAttribute("data-ci-slot-index")),slot=form.slots[i],field=t.getAttribute("data-ci-slot-key");
  if(slot){
   slot[field]=t.value;
   if(field==="type"||field==="start"){
    var hours=Number((String(slot.type||"").match(/-(\d+)h/)||[])[1]||0);
    if(slot.start&&hours&&!slot.manualEnd){
     var d=new Date(slot.start+":00Z");d.setUTCHours(d.getUTCHours()+hours);slot.end=d.toISOString().slice(0,16);
     var end=q('[data-ci-slot-index="'+i+'"][data-ci-slot-key="end"]',modal);if(end)end.value=slot.end;
    }
   }else if(field==="end")slot.manualEnd=true;
  }
 }
}
function decorate(){
 var table=q(".orders-table");if(!table)return;
 var head=q("thead tr",table),cg=q("colgroup",table);
 if(head&&!head.getAttribute("data-ci-columns")){
  Array.from(head.children).forEach(function(h){if(h.textContent.trim()==="详情")h.remove()});
  var heads=head.children;
  var whats=Array.from(heads).find(function(h){return /whatsapp/i.test(h.textContent)});
  if(whats){var th=document.createElement("th");th.textContent="跟进处理状态";th.style.color="#c83434";head.insertBefore(th,whats.nextSibling)}
  var last=head.lastElementChild;
  if(last){var custom=document.createElement("th");custom.textContent="定制状态";head.insertBefore(custom,last)}
  head.setAttribute("data-ci-columns","1");
  if(cg){
   var cols=Array.from(cg.children);if(cols[17])cols[17].remove();
   var c1=document.createElement("col");c1.style.width="6%";cg.insertBefore(c1,cg.children[18]||null);
   var c2=document.createElement("col");c2.style.width="5%";cg.insertBefore(c2,cg.lastElementChild);
  }
 }
 var tbody=el("orderRows");if(!tbody)return;
 Array.from(tbody.children).forEach(function(tr){
  var td=Array.from(tr.children);
  if(td.length===1&&td[0].hasAttribute("colspan")){td[0].setAttribute("colspan","22");return}
  if(td.length<19)return;
  var id=td[0].textContent.trim();
  if(tr.getAttribute("data-ci-decorated")){
   var existing=recordFor(id),followExisting=tr.querySelector(".ci-follow"),customExisting=tr.querySelector(".ci-custom-status");
   if(followExisting)followExisting.textContent=existing?(existing.processingStatus||""):"";
   if(customExisting){
    var btn=customExisting.querySelector("[data-ci-edit-order]");
    if(btn)btn.textContent=existing?"已录入 · 编辑":"待录入";
   }
   return;
  }
  if(td[17]&&td[17].textContent.trim()==="")td[17].remove(); // CP01 has one redundant Details cell.
  var remain=Array.from(tr.children);
  var whatsapp=remain[17],operator=remain[18],action=remain[19];
  if(!whatsapp||!operator||!action)return;
  var follow=document.createElement("td");follow.className="ci-state-cell ci-follow";
  var rec=recordFor(id);
  follow.textContent=rec?(rec.processingStatus||""):"";
  tr.insertBefore(follow,operator);
  var custom=document.createElement("td");custom.className="ci-state-cell ci-custom-status";
  var kind=typeFromBenefit(remain[1].textContent);
  if(kind){
   var b=document.createElement("button");b.type="button";b.className="ci-clickable";
   b.setAttribute("data-ci-edit-order",id);b.textContent=rec?"已录入 · 编辑":"待录入";
   custom.appendChild(b);
  }
  tr.insertBefore(custom,action);
  tr.setAttribute("data-ci-decorated","1");
 });
}
function init(){
 var list=q(".list-toolbar .toolbar-actions");
 if(!list)return;
 var entry=document.createElement("button");entry.type="button";entry.id="ciOpen";entry.className="btn primary tiny ci-top-button";entry.textContent="定制信息录入";
 list.insertBefore(entry,list.firstChild);
 modal=document.createElement("div");modal.className="ci-backdrop";modal.setAttribute("aria-hidden","true");
 modal.innerHTML='<div class="ci-modal" role="dialog" aria-modal="true" aria-labelledby="ciTitle"><header class="ci-head" id="ciHead"></header>'+
 '<section class="ci-content" id="ciContent"></section><footer class="ci-footer">'+
 '<button type="button" data-ci-close>取消</button><button type="button" class="primary" data-ci-save>确定</button>'+
 '</footer></div>';
 document.body.appendChild(modal);
 header=el("ciHead");content=el("ciContent");
 entry.addEventListener("click",function(){open("")});
 modal.addEventListener("click",function(e){
  if(e.target===modal){close();return}
  var button=e.target.closest("button");if(!button)return;
  if(button.hasAttribute("data-ci-close")){close();return}
  if(button.hasAttribute("data-ci-save")){saveForm();return}
  if(button.hasAttribute("data-ci-choose")){
   q('[data-ci-file="'+button.getAttribute("data-ci-choose")+'"]',modal).click();return;
  }
  if(button.hasAttribute("data-ci-addslot")){
   form.slots=form.slots||[];form.slots.push({id:uid(),type:"Banner-24h",country:"",timezone:"UTC+3",start:"",end:"",manualEnd:false});render();return;
  }
  if(button.hasAttribute("data-ci-removeslot")){form.slots.splice(Number(button.getAttribute("data-ci-removeslot")),1);render();return}
  if(button.hasAttribute("data-ci-country-add")){
   var k=button.getAttribute("data-ci-country-add"),field=q('[data-ci-region-search="'+k+'"]',modal);
   var value=field&&field.value.trim();if(value){form[k]=Array.from(new Set((form[k]||[]).concat(value)));render()}return;
  }
  if(button.hasAttribute("data-ci-country-clear")){form[button.getAttribute("data-ci-country-clear")]=[];render();return}
 });
 modal.addEventListener("change",function(e){
  if(e.target.hasAttribute("data-ci-file"))chooseFiles(e.target);else syncField(e.target);
 });
 modal.addEventListener("input",function(e){if(!e.target.hasAttribute("data-ci-file")&&!e.target.hasAttribute("data-ci-region"))syncField(e.target)});
 el("orderRows").addEventListener("click",function(e){
  var btn=e.target.closest("[data-ci-edit-order]");
  if(btn){e.preventDefault();e.stopPropagation();open(btn.getAttribute("data-ci-edit-order"))}
 });
 document.addEventListener("keydown",function(e){if(e.key==="Escape"&&modal.classList.contains("show"))close()});
 var watcher=new MutationObserver(function(ms){
  if(ms.some(function(m){return m.type==="childList"&&m.target.id==="orderRows"}))decorate();
 });
 watcher.observe(el("orderRows"),{childList:true});
 decorate();
 window.V2CustomEntryPreview={getRecords:function(){return JSON.parse(JSON.stringify(records))},open:open,decorate:decorate};
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
})();