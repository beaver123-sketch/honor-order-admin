(function(){
"use strict";
var A=window.HonorAdmin;if(!A)return;
var $=function(id){return document.getElementById(id)};
var esc=A.esc;
var auditKey="honor-order-local-audit-v1";
var audit=[];
try{var past=JSON.parse(localStorage.getItem(auditKey));if(Array.isArray(past))audit=past.slice(0,500)}catch(_){}
var config={enabled:false}; // session-only UI preview: never persist incoming webhook secrets
function safeActor(r){return String(r.operatorEnglish||"").trim()||"未填写英文名"}
function orderType(name){return /splash|screen|开屏/i.test(String(name||""))?"splash":"banner"}
function typeBenefit(t){return {gift:"Customized Gift - 2 Months",ride:"Customized Ride - 2 Months",banner:"Banner - 24h",splash:"Open Screen - 24h"}[t]||""}
function addLog(action,r,explanation){
 var row={time:new Date().toLocaleString("sv-SE",{hour12:false}),actor:safeActor(r),action:action,
  id:String(r.id||"—"),source:r.source==="overseas-agent"?"海外群代理订单":r.source==="manual-custom"?"运营手动录入":"商城兑换",
  detail:String(explanation||"")};
 audit.unshift(row);audit=audit.slice(0,500);
 try{localStorage.setItem(auditKey,JSON.stringify(audit))}catch(_){}
}
function rows(){return A.rows}
var defaultRoot=$("mainContent");
defaultRoot.querySelector("#placeholderView").insertAdjacentHTML("beforebegin",[
'<section id="overseasPage">',
 ' <div class="overseas-intro"><i class="accent"></i><div><h2>海外群代理订单</h2><p>海外群助理登记 Banner / Splash 基础信息，统一归入荣誉订单列表处理。</p></div><span class="tag">统一订单数据</span></div>',
 ' <section class="card overseas-filters"><div class="card-title">查询条件</div><div class="overseas-filter-body">',
 '  <label class="field"><span class="label">订单类型</span><select class="select" id="ovType"><option value="">全部类型</option><option value="banner">Banner</option><option value="splash">Splash（开屏）</option></select></label>',
 '  <label class="field"><span class="label">用户 ID</span><input class="input text-input" id="ovUid" placeholder="请输入用户ID"></label>',
 '  <label class="field"><span class="label">订单状态</span><select class="select" id="ovStatus"><option value="">全部状态</option><option>待处理</option><option>已处理</option><option>已退回</option><option>退回中</option></select></label>',
 '  <button class="btn primary" id="ovQuery">⌕ 查询</button><button class="btn" id="ovReset">⟳ 重置</button>',
 ' </div></section>',
 ' <section class="card overseas-orders"><div class="list-toolbar"><div class="list-label">数据列表<span class="count" id="ovCount">共 0 条</span></div>',
 ' <div class="toolbar-actions"><button class="btn primary tiny" id="ovCreate">＋ 新增 Banner / Splash 订单</button></div></div>',
 ' <div class="table-wrap"><table class="overseas-table"><thead><tr><th>订单 ID</th><th>订单类型</th><th>权益名称</th><th>用户 ID</th><th>用户名</th><th>国家</th><th>订单状态</th><th>登记时间</th><th>操作员工（英文名）</th><th>通知状态</th><th>操作</th></tr></thead><tbody id="ovRows"></tbody></table></div>',
 ' <div class="overseas-foot"><span>数据同步显示在荣誉订单统一列表中</span><span id="ovTotal">共 0 条</span></div></section>',
'</section>'
].join(""));
document.body.insertAdjacentHTML("beforeend",[
 '<div class="ext-utility-layer" id="extLayer" aria-hidden="true"><div class="ext-utility-mask" id="extBackdrop"></div>',
 '<aside class="ext-utility-drawer" role="dialog" aria-modal="true" aria-labelledby="extTitle">',
 '<div class="ext-utility-head"><div><h2 id="extTitle">操作日志</h2><p id="extSubtitle">现有后台操作记录</p></div><button class="ext-utility-close" id="extClose">×</button></div>',
 '<div class="ext-utility-body" id="extBody"></div></aside></div>'
].join(""));
$("drawerTypeHint").insertAdjacentHTML("afterend",'<select id="creationTypeSelect" aria-label="选择新增订单类型"></select>');
function newOrder(mode){
 A.openDetail(null,true);
 $("detailMask").classList.add("new-order-modal");
 var d=A.state;
 d.creationMode=mode==="overseas"?"overseas":"custom";
 d.creationType=d.creationMode==="overseas"?"banner":"gift";
 d.draft.benefit=typeBenefit(d.creationType);
 d.draft.source=d.creationMode==="overseas"?"overseas-agent":"manual-custom";
 d.draft.registrationType=d.creationType;
 d.draft.notifyStatus=config.enabled?"待接入":"未推送";
 d.tab="base";
 var select=$("creationTypeSelect");
 select.classList.add("visible");
 select.innerHTML=(d.creationMode==="overseas"?[["banner","Banner"],["splash","Splash（开屏）"]]:[["gift","定制礼物"],["ride","定制座驾"]])
   .map(function(x){return '<option value="'+x[0]+'">'+x[1]+'</option>'}).join("");
 select.value=d.creationType;
 A.drawDetailTab();
}
A.openNewOrder=newOrder;
$("creationTypeSelect").addEventListener("change",function(){
 var d=A.state;
 if(!d.creating)return;
 A.collectDetailTab();
 d.creationType=this.value;
 d.draft.benefit=typeBenefit(d.creationType);
 d.draft.registrationType=d.creationType;
 d.tab="base";
 A.drawDetailTab();
});
function editOrder(id){
 $("detailMask").classList.remove("new-order-modal");
 $("creationTypeSelect").classList.remove("visible");
 A.openDetail(id,false);
 A.state.creationMode=null;
}
A.onSave=function(r,creating){
 if(creating){r.notifyStatus=config.enabled?"待接入":"未推送";}
 addLog(creating?"新增订单":"编辑订单",r,creating?"登记成功，来源："+(r.source==="overseas-agent"?"海外群代理订单":"荣誉订单"):"编辑订单信息");
 refreshOverseas();
};
A.onStatus=function(r,previous,next){addLog("订单状态变更",r,"从 "+previous+" 改为 "+next);refreshOverseas()};
function filteredOverseas(){
 var type=$("ovType").value,uid=$("ovUid").value.trim(),status=$("ovStatus").value;
 return rows().filter(function(r){
  var t=r.registrationType||orderType(r.benefit);
  return r.source==="overseas-agent"&&(!type||type===t)&&(!uid||String(r.uid||"").includes(uid))&&(!status||r.status===status);
 });
}
function refreshOverseas(){
 var found=filteredOverseas();
 $("ovCount").textContent="共 "+found.length+" 条";$("ovTotal").textContent="共 "+found.length+" 条";
 $("ovRows").innerHTML=found.length?found.map(function(r){
  var t=(r.registrationType||orderType(r.benefit))==="splash"?"Splash":"Banner";
  return '<tr><td>'+esc(r.id)+'</td><td>'+t+'</td><td>'+esc(r.benefit)+'</td><td>'+esc(r.uid)+'</td><td>'+esc(r.name||"—")+'</td><td>'+esc(r.country||"—")+'</td><td>'+esc(r.status)+'</td><td>'+esc(r.created||"—")+'</td><td><span class="operator-name">'+esc(r.operatorEnglish||"—")+'</span></td><td>'+esc(r.notifyStatus||"未推送")+'</td><td><button class="detail-view-btn" data-edit-order="'+esc(r.id)+'">查看/编辑</button></td></tr>';
 }).join(""):'<tr><td class="empty" colspan="11">暂无海外群代理登记订单，点击右上角「新增 Banner / Splash 订单」开始录入。</td></tr>';
}
function switchPage(name){
 var nav=document.querySelector(".tabs"),slot=nav.querySelector(".tab-spacer"),extra=nav.querySelector('[data-tab="海外群代理订单"]');
 if(name==="海外群代理订单"&&!extra){
   extra=document.createElement("button");extra.className="tab";extra.dataset.tab="海外群代理订单";extra.textContent="海外群代理订单";nav.insertBefore(extra,slot);
   extra.onclick=function(){switchPage("海外群代理订单")};
 }else if(name!=="海外群代理订单"&&extra){extra.remove()}
 A.switchTab(name);
 defaultRoot.classList.remove("placeholder-mode","overseas-mode");
 if(name==="海外群代理订单"){defaultRoot.classList.add("overseas-mode");refreshOverseas()}
 else if(name!=="荣誉订单"){defaultRoot.classList.add("placeholder-mode")}
 document.querySelectorAll(".nav-item[data-page]").forEach(function(n){n.classList.toggle("active",n.dataset.page===name)});
 document.querySelectorAll(".tab").forEach(function(t){t.classList.toggle("active",t.dataset.tab===name)});
}
document.querySelectorAll(".tab").forEach(function(t){t.onclick=function(){switchPage(t.dataset.tab)}});
document.querySelectorAll(".nav-item").forEach(function(n){n.onclick=function(){if(n.dataset.page)switchPage(n.dataset.page);else if(n.dataset.config==="notify")openUtility("notify");else A.notice("当前演示版仅开放荣誉订单与海外群代理订单")}});
$("ovQuery").onclick=refreshOverseas;
$("ovReset").onclick=function(){$("ovType").value="";$("ovUid").value="";$("ovStatus").value="";refreshOverseas()};
$("ovUid").onkeydown=function(e){if(e.key==="Enter")refreshOverseas()};
$("ovCreate").onclick=function(){newOrder("overseas")};
$("ovRows").onclick=function(e){var b=e.target.closest("[data-edit-order]");if(b)editOrder(b.dataset.editOrder)};
$("orderRows").addEventListener("click",function(e){var b=e.target.closest("[data-detail-id]");if(b){$("creationTypeSelect").classList.remove("visible");A.state.creationMode=null}});
function closeUtility(){$("extLayer").classList.remove("open");$("extLayer").setAttribute("aria-hidden","true")}
$("extClose").onclick=closeUtility;$("extBackdrop").onclick=closeUtility;
function openUtility(kind){
 $("extLayer").classList.add("open");$("extLayer").setAttribute("aria-hidden","false");
 $("extLayer").classList.toggle("small-dialog",kind==="more"||kind==="notify");
 if(kind==="more"){
  $("extTitle").textContent="更多操作";
  $("extSubtitle").textContent="荣誉订单辅助管理功能";
  $("extBody").innerHTML=[
   '<div class="ext-operation-options">',
   ' <button class="ext-operation-item" id="moreLogAction" type="button"><span class="ext-operation-icon" aria-hidden="true">☷</span><span class="ext-operation-text"><strong>操作日志</strong><small>查询海外员工操作记录、按订单筛选及导出</small></span><span class="ext-operation-arrow" aria-hidden="true">›</span></button>',
   ' <button class="ext-operation-item" id="moreNotifyAction" type="button"><span class="ext-operation-icon" aria-hidden="true">♧</span><span class="ext-operation-text"><strong>Lark 通知配置</strong><small>查看群机器人通知开关与配置说明</small></span><span class="ext-operation-arrow" aria-hidden="true">›</span></button>',
   '</div>'
  ].join("");
  $("moreLogAction").onclick=function(){openUtility("audit")};
  $("moreNotifyAction").onclick=function(){openUtility("notify")};
 }else if(kind==="notify"){
  $("extTitle").textContent="Lark 机器人消息配置";
  $("extSubtitle").textContent="复用原后台开关与 Webhook 配置结构";
  $("extBody").innerHTML=[
   '<div class="ext-info warning">当前为交互原型，暂未连接服务端机器人。不要在此填写真实 Webhook 密钥；下方开关只用于预览通知状态，不会发出真实消息。</div>',
   '<div class="ext-card"><h3>订单创建通知</h3>',
   '<div class="ext-setting-row"><span class="ext-setting-label">是否推送群聊 Lark 机器人消息</span><button id="extSwitch" class="ext-switch'+(config.enabled?" on":"")+'" role="switch" aria-checked="'+config.enabled+'"></button><span style="color:#98a3b0">配置预览</span></div>',
   '<div class="ext-setting-row"><label class="ext-setting-label" for="extWebhook">配置机器人 webhook</label><input class="ext-setting-input" type="password" id="extWebhook" autocomplete="off" placeholder="请在服务端安全配置，不保存真实密钥"></div>',
   '<div class="ext-setting-row"><span class="ext-setting-label">推送至</span><strong>Honor Mall Purchase Notice</strong></div>',
   '<div class="ext-info">仅创建成功时触发一次通知，编辑不重复通知；失败记录状态和错误，支持人工重试。接入后台前不会执行实际推送。</div>',
   '<div class="ext-utility-actions"><button class="btn" id="extDiscard">取消</button><button class="btn primary" id="extConfirm">保存配置预览</button></div></div>'
  ].join("");
  $("extSwitch").onclick=function(){config.enabled=!config.enabled;this.classList.toggle("on",config.enabled);this.setAttribute("aria-checked",String(config.enabled))};
  $("extDiscard").onclick=closeUtility;
  $("extConfirm").onclick=function(){
   if($("extWebhook").value.trim()){A.notice("请勿在演示版输入真实 Webhook；正式连接需在服务端配置","error");$("extWebhook").value="";return}
   closeUtility();A.notice("通知配置预览已保存；真实机器人推送尚未接入");
  };
 }else{
  $("extTitle").textContent="操作日志";
  $("extSubtitle").textContent="海外兼职操作记录 · 不新增侧边栏子菜单";
  $("extBody").innerHTML=[
   '<div class="ext-info warning">此处为浏览器本地演示记录，不能替代正式审计日志。正式上线应由服务端按真实登录人英文名记录时间、操作类型、修改前后内容与订单 ID，确保权限控制与不可篡改。</div>',
   '<div class="ext-card"><div class="ext-log-controls"><input id="extLogName" placeholder="员工英文名"><input id="extLogOrder" placeholder="订单 ID"><select id="extLogType"><option value="">全部操作</option><option>新增订单</option><option>编辑订单</option><option>订单状态变更</option></select><button class="btn" id="extReset">重置</button><button class="btn primary" id="extExport">导出日志</button></div>',
   '<div class="ext-log-table-wrap"><table class="ext-log-table"><thead><tr><th>操作时间</th><th>操作员工英文名</th><th>操作类型</th><th>订单 ID</th><th>订单来源</th><th>操作说明</th></tr></thead><tbody id="extLogRows"></tbody></table></div></div>'
  ].join("");
  ["extLogName","extLogOrder","extLogType"].forEach(function(id){$(id).oninput=renderLogs});
  $("extReset").onclick=function(){["extLogName","extLogOrder","extLogType"].forEach(function(id){$(id).value=""});renderLogs()};
  $("extExport").onclick=exportLogs;renderLogs();
 }
}
function filteredLogs(){
 var name=$("extLogName").value.trim().toLowerCase(),order=$("extLogOrder").value.trim(),type=$("extLogType").value;
 return audit.filter(function(x){return (!name||x.actor.toLowerCase().includes(name))&&(!order||x.id.includes(order))&&(!type||x.action===type)});
}
function renderLogs(){
 var all=filteredLogs();
 $("extLogRows").innerHTML=all.length?all.map(function(r){return '<tr><td>'+esc(r.time)+'</td><td>'+esc(r.actor)+'</td><td>'+esc(r.action)+'</td><td>'+esc(r.id)+'</td><td>'+esc(r.source)+'</td><td>'+esc(r.detail)+'</td></tr>'}).join(""):'<tr><td class="ext-log-empty" colspan="6">暂无相关操作记录</td></tr>';
}
function exportLogs(){
 var data=[["操作时间","操作员工英文名","操作类型","订单 ID","订单来源","操作说明"]].concat(filteredLogs().map(function(x){return [x.time,x.actor,x.action,x.id,x.source,x.detail]}));
 var csv="\ufeff"+data.map(function(row){return row.map(function(v){return '"'+String(v==null?"":v).replace(/"/g,'""')+'"'}).join(",")}).join("\r\n");
 var url=URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8"}));
 var link=document.createElement("a");link.href=url;link.download="荣誉商城操作日志.csv";link.click();setTimeout(function(){URL.revokeObjectURL(url)},1000);
}
$("honorMoreBtn").onclick=function(){openUtility("more")};

document.addEventListener("keydown",function(e){if(e.key==="Escape"&&$("extLayer").classList.contains("open")){closeUtility();e.stopImmediatePropagation()}},true);
refreshOverseas();
})();