(function(){
"use strict";
var api=window.HonorOrderAdmin;
if(!api)return;
var byId=function(id){return document.getElementById(id)};
var esc=api.esc;
var stageOptions=["待收集资料","资料收集中","待 UI 设计","UI 设计中","待上线","complete（launched）","已取消"];
var editingId=null,kind="gift",form={},isDirty=false,ephemeralWebhook="";
var baseFields=[
 {key:"productionStatus",label:"Status / 制作状态",type:"select",options:stageOptions},
 {key:"redeemedTime",label:"Redeemed Time / 兑换时间",type:"datetime-local"},
 {key:"redeemedId",label:"Redeemed ID / 兑换用户 ID",required:true},
 {key:"honorWallId",label:"Honor Wall ID / 荣誉墙 ID"},
 {key:"nationality",label:"Nationality / 国籍"},
 {key:"operatorEnglish",label:"录入员工英文名",required:true}
];
var giftFields=[
 {key:"onlineCountry",label:"Online country / 上线国家"},
 {key:"giftName",label:"Gift Name / 礼物名称",required:true},
 {key:"videoMaterial",label:"Video material (horizontal) / 横版视频",type:"media",accept:"video/*,.mp4,.mov",wide:true},
 {key:"giftDescription",label:"Gift description / 礼物描述（不超过10词）",type:"textarea",wide:true,help:"非必填；英文描述不超过 10 个单词。"},
 {key:"giftPic",label:"Gift Pic / 礼物图片",type:"media",accept:"image/*",wide:true},
 {key:"giftType",label:"礼物类型",type:"select",options:["普通礼物","限量礼物"],help:"限量礼物最低售价为 600,000 金币。"},
 {key:"giftPrice",label:"Gift Price / 金币价格",type:"number",required:true,help:"未指定时默认 177,000 金币；普通最低 177,000，限量最低 600,000。"},
 {key:"validDuration",label:"Valid Duration / 有效期",placeholder:"例如：2个月"},
 {key:"schedule",label:"Schedule (10 working days) / 计划完成日期",type:"date",help:"按兑换时间自动估算 10 个工作日（不含周末），支持调整。"},
 {key:"processingUI",label:"Processing UI / UI 处理进度",type:"textarea",wide:true,help:"收集完成后联系 @MA-Emillia，并同步发送通知。"},
 {key:"notes",label:"Notes / 备注",type:"textarea",wide:true},
 {key:"groupLink",label:"Group link / 群组链接",placeholder:"WhatsApp 群邀请链接",wide:true}
];
var rideFields=[
 {key:"theme",label:"Theme / 主题"},
 {key:"rideName",label:"Ride Name / 座驾名称",required:true},
 {key:"backgroundScene",label:"Background / Scene / 背景场景",type:"textarea",wide:true,help:"填写场景要求或 WhatsApp 视频文件名称。"},
 {key:"backgroundMedia",label:"背景场景附件",type:"media",wide:true,accept:"image/*,video/*"},
 {key:"referenceMedia",label:"Reference Image or Video / 参考图或视频",type:"media",wide:true,accept:"image/*,video/*"},
 {key:"schedule",label:"Schedule (10 working days) / 计划完成日期",type:"date",help:"按兑换时间自动估算 10 个工作日（不含周末），支持调整。"},
 {key:"processingUI",label:"Processing UI / UI 处理进度",type:"textarea",wide:true,help:"收集完成后联系 @Jackson W YANG，并同步发送通知。"},
 {key:"files",label:"Files / 成品或交付文件",type:"media",wide:true,accept:"image/*,video/*,.zip,.pdf"},
 {key:"notes",label:"Notes / 备注",type:"textarea",wide:true},
 {key:"groupLink",label:"Group link / 群组链接",placeholder:"WhatsApp 群邀请链接",wide:true}
];
var labels={gift:"定制礼物",ride:"定制座驾"};
function localDatetime(date){
 var d=date||new Date();
 var f=function(x){return String(x).padStart(2,"0")};
 return d.getFullYear()+"-"+f(d.getMonth()+1)+"-"+f(d.getDate())+"T"+f(d.getHours())+":"+f(d.getMinutes());
}
function nextWorkingDays(value,days){
 if(!value)return "";
 var dt=new Date(value);if(Number.isNaN(+dt))return "";
 var left=days;
 while(left>0){dt.setDate(dt.getDate()+1);if(dt.getDay()!==0&&dt.getDay()!==6)left--;}
 return localDatetime(dt).slice(0,10);
}
function baseDefault(){var now=localDatetime();return {
 productionStatus:"待收集资料",redeemedTime:now,redeemedId:"",honorWallId:"",nationality:"",
 operatorEnglish:"",onlineCountry:"",giftName:"",giftDescription:"",giftPrice:"177000",
 giftType:"普通礼物",validDuration:"2个月",videoMaterial:"",giftPic:"",theme:"",
 backgroundScene:"",backgroundMedia:"",referenceMedia:"",rideName:"",files:"",
 processingUI:"",notes:"",groupLink:"",schedule:nextWorkingDays(now,10),notifyEnabled:false,
 notifyTarget:"Honor Mall Purchase Notice",fileNames:{}
};}
document.body.insertAdjacentHTML("beforeend",[
 '<div class="co-backdrop" id="coBackdrop" aria-hidden="true">',
 '<div class="co-dialog" role="dialog" aria-modal="true" aria-labelledby="coTitle">',
 '<div class="co-heading"><div class="co-heading-main"><h2 id="coTitle">新增定制订单</h2><p>按订单类型填写资料，保存后进入荣誉订单列表</p></div>',
 '<button class="co-close" type="button" id="coClose" aria-label="关闭">×</button></div>',
 '<div class="co-types"><span class="co-types-label">订单类型</span>',
 '<button class="co-type-btn active" data-co-kind="gift" type="button">定制礼物 Customized Gift</button>',
 '<button class="co-type-btn" data-co-kind="ride" type="button">定制座驾 Customized Ride</button></div>',
 '<div class="co-body" id="coBody"></div>',
 '<div class="co-footer">',
 '<button class="btn" type="button" id="coCancel">取消</button>',
 '<button class="btn primary" type="button" id="coSave">保存订单</button></div>',
 '</div></div>'
].join(""));
function oneField(field){
 var value=form[field.key]==null?"":String(form[field.key]),k=field.key;
 var common=' data-co-field="'+esc(k)+'" id="co-field-'+esc(k)+'"';
 var control="";
 if(field.type==="select"){
  control='<select'+common+'>'+field.options.map(function(v){return '<option value="'+esc(v)+'"'+(value===v?" selected":"")+'>'+esc(v)+'</option>'}).join("")+'</select>';
 }else if(field.type==="textarea"){
  control='<textarea'+common+' placeholder="请输入">'+esc(value)+'</textarea>';
 }else if(field.type==="media"){
  var name=((form.fileNames||{})[k]||"");
  control='<div class="co-media"><input type="file" data-co-file="'+esc(k)+'" accept="'+esc(field.accept||"*/*")+'"><span class="co-media-name">'+(name?"已选："+esc(name)+"（仅记录文件名）":"可选择本地文件，仅记录文件名，未上传服务器")+'</span><input class="co-input"'+common+' type="text" placeholder="或填写素材 URL / 文件路径" value="'+esc(value)+'"></div>';
 }else{
  var type=field.type||"text";
  control='<input class="co-input"'+common+' type="'+esc(type)+'"'+(type==="number"?' min="0" step="1"':"")+(field.placeholder?' placeholder="'+esc(field.placeholder)+'"':"")+' value="'+esc(value)+'">';
 }
 return '<div class="co-field'+(field.wide?" wide":"")+'"><label for="co-field-'+esc(k)+'">'+esc(field.label)+(field.required?'<span class="co-req">*</span>':"")+'</label>'+control+(field.help?'<span class="co-help">'+esc(field.help)+'</span>':"")+'</div>';
}
function section(title,fields){return '<section class="co-section"><h3>'+esc(title)+'</h3><div class="co-grid">'+fields.map(oneField).join("")+'</div></section>'}
function notificationSection(){
 return [
 '<section class="co-section"><h3>Lark 群消息通知</h3>',
 '<div class="co-grid"><div class="co-field wide"><label>是否推送群聊 Lark 机器人消息</label><div class="co-toggle-line">',
 '<button type="button" id="coNotifySwitch" class="co-switch'+(form.notifyEnabled?" on":"")+'" role="switch" aria-checked="'+(!!form.notifyEnabled)+'" aria-controls="coNotifyOptions"></button>',
 '<span id="coNotifyText">'+(form.notifyEnabled?"已开启":"已关闭")+'</span></div></div></div>',
 '<div class="co-notify-options" id="coNotifyOptions"'+(form.notifyEnabled?"":" hidden")+'><div class="co-grid">',
 '<div class="co-field wide"><label for="coWebhook">配置机器人 webhook</label>',
 '<input class="co-input" id="coWebhook" type="password" autocomplete="off" placeholder="请输入" value=""></div>',
 '</div></div></section>'
 ].join("");
}
function paint(){
 byId("coTitle").textContent=(editingId?"编辑":"新增")+labels[kind]+"订单";
 document.querySelectorAll("[data-co-kind]").forEach(function(n){n.classList.toggle("active",n.dataset.coKind===kind);n.disabled=!!editingId});
 var content='';
 content+=section("订单基础信息",baseFields);
 content+=section(kind==="gift"?"定制礼物信息":"定制座驾信息",kind==="gift"?giftFields:rideFields);
 content+=notificationSection();
 byId("coBody").innerHTML=content;
 byId("coBody").scrollTop=0;
 byId("coNotifySwitch").onclick=function(){form.notifyEnabled=!form.notifyEnabled;isDirty=true;this.classList.toggle("on",form.notifyEnabled);this.setAttribute("aria-checked",String(form.notifyEnabled));byId("coNotifyText").textContent=form.notifyEnabled?"已开启":"已关闭";byId("coNotifyOptions").hidden=!form.notifyEnabled;if(!form.notifyEnabled){ephemeralWebhook="";byId("coWebhook").value=""}};
 var webhook=byId("coWebhook");webhook.value="";webhook.oninput=function(){ephemeralWebhook=webhook.value;isDirty=true};
}
function collect(){
 byId("coBody").querySelectorAll("[data-co-field]").forEach(function(n){form[n.dataset.coField]=n.value});
 // Never persist any Webhook; its input is kept only in ephemeralWebhook until the modal closes.
}
function open(record){
 editingId=record?String(record.id):null;
 kind=record&&record.manualType==="ride"?"ride":"gift";
 form=record&&record.customization?Object.assign(baseDefault(),JSON.parse(JSON.stringify(record.customization))):baseDefault();
 form.fileNames=Object.assign({},form.fileNames||{});
 isDirty=false;ephemeralWebhook="";
 byId("coBackdrop").classList.add("open");
 byId("coBackdrop").setAttribute("aria-hidden","false");
 paint();
}
function close(force){
 if(!force&&isDirty&&!window.confirm("当前填写的内容尚未保存，确定关闭吗？"))return;
 byId("coBackdrop").classList.remove("open");
 byId("coBackdrop").setAttribute("aria-hidden","true");
 byId("coWebhook").value="";
 ephemeralWebhook="";isDirty=false;editingId=null;
}
function validate(){
 if(!String(form.redeemedId||"").trim()){api.notice("请输入兑换用户 ID","error");return false}
 if(!String(form.operatorEnglish||"").trim()){api.notice("请输入海外员工英文名","error");return false}
 if(kind==="ride"&&!String(form.rideName||"").trim()){api.notice("请输入座驾名称","error");return false}
 if(kind==="gift"){
  if(!String(form.giftName||"").trim()){api.notice("请输入礼物名称","error");return false}
  var description=String(form.giftDescription||"").trim();
  if(description&&description.split(/\s+/).length>10){api.notice("礼物描述不能超过 10 个英文单词","error");return false}
  if(!String(form.giftPrice||"").trim())form.giftPrice="177000";
  var price=Number(form.giftPrice),min=form.giftType==="限量礼物"?600000:177000;
  if(!Number.isFinite(price)||price<min){api.notice("当前礼物价格不能低于 "+min.toLocaleString("en-US")+" 金币","error");return false}
 }
 return true;
}
function persist(row,creating){
 var current=api.rows,backup=current.slice();
 if(creating)current.unshift(row);else{
  var i=current.findIndex(function(r){return String(r.id)===editingId});
  if(i<0){api.notice("该订单不存在，请刷新页面后重试","error");return false}
  current[i]=row;
 }
 try{localStorage.setItem(api.storageKey,JSON.stringify(current))}
 catch(error){current.splice(0,current.length,...backup);api.notice("本地保存失败，素材过大或浏览器存储受限","error");return false}
 api.render();
 return true;
}
function save(){
 collect();
 if(!validate())return;
 var existing=editingId?api.rows.find(function(r){return String(r.id)===editingId}):null;
 var creating=!existing;
 var now=localDatetime();
 var identifier=creating?"M"+Date.now().toString(36).toUpperCase():existing.id;
 var record=Object.assign({},existing||{
  id:identifier,qty:1,honor:0,coin:0,total:0,to:"无",level:0,region:"",name:"",waiting:"0天",
  used:"",usedTime:"",whatsapp:"",completed:""
 });
 var freshTime=form.redeemedTime?form.redeemedTime.replace("T"," ")+":00":now.replace("T"," ")+":00";
 record.id=identifier;
 record.benefit=kind==="gift"?"Customized Gift - 2 Months":"Customized Ride - 2 Months";
 record.manualSource="custom";
 record.manualType=kind;
 record.uid=String(form.redeemedId).trim();
 record.country=String(form.nationality||"").trim();
 record.created=freshTime;
 record.operatorEnglish=String(form.operatorEnglish).trim();
 record.operator=record.operatorEnglish;
 record.status=existing?existing.status:"待处理";
 record.customization=JSON.parse(JSON.stringify(form));
 record.customization.notifyTarget="Honor Mall Purchase Notice";
 record.notificationStatus=form.notifyEnabled?"未发送":"未启用";
 // Webhook is deliberately not serialized; file objects likewise are never stored.
 if(!persist(record,creating))return;
 close(true);
 api.notice(creating?"定制订单已录入，可在列表的详情列查看":"定制订单信息已更新");
}
byId("newCustomizedOrder").onclick=function(){open(null)};
byId("coClose").onclick=function(){close(false)};
byId("coCancel").onclick=function(){close(false)};
byId("coSave").onclick=save;
byId("coBackdrop").onclick=function(e){if(e.target===this)close(false)};
document.addEventListener("keydown",function(e){if(e.key==="Escape"&&byId("coBackdrop").classList.contains("open")){e.stopImmediatePropagation();close(false)}},true);
document.querySelectorAll("[data-co-kind]").forEach(function(b){b.onclick=function(){
 if(editingId||kind===this.dataset.coKind)return;
 collect();kind=this.dataset.coKind;isDirty=true;
 if(kind==="gift"&&(!form.giftPrice||+form.giftPrice<177000))form.giftPrice="177000";
 paint();
}});
byId("coBody").addEventListener("input",function(e){
 var x=e.target.closest("[data-co-field]");
 if(!x)return;
 var key=x.dataset.coField;form[key]=x.value;isDirty=true;
 if(key==="redeemedTime"&&!form.schedule){
  form.schedule=nextWorkingDays(x.value,10);var p=byId("co-field-schedule");if(p)p.value=form.schedule;
 }
});
byId("coBody").addEventListener("change",function(e){
 var x=e.target.closest("[data-co-field]");
 if(x){
  form[x.dataset.coField]=x.value;isDirty=true;
  if(x.dataset.coField==="redeemedTime"){
   form.schedule=nextWorkingDays(x.value,10);
   var sch=byId("co-field-schedule");if(sch)sch.value=form.schedule;
  }
  if(x.dataset.coField==="giftType"&&x.value==="限量礼物"&&Number(form.giftPrice)<600000){
   form.giftPrice="600000";var price=byId("co-field-giftPrice");if(price)price.value=form.giftPrice;
  }
 }
 var f=e.target.closest("[data-co-file]");
 if(f&&f.files&&f.files[0]){
  if(!form.fileNames)form.fileNames={};
  form.fileNames[f.dataset.coFile]=f.files[0].name;
  isDirty=true;var name=f.closest(".co-media").querySelector(".co-media-name");
  if(name)name.textContent="已选："+f.files[0].name+"（仅记录文件名，不会上传）";
 }
});
byId("orderRows").addEventListener("click",function(e){
 var b=e.target.closest("[data-custom-detail]");
 if(!b)return;
 var row=api.rows.find(function(r){return String(r.id)===b.dataset.customDetail});
 if(row&&row.manualSource==="custom")open(row);
});
})();