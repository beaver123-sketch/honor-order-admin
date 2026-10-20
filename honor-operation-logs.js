/* Demonstration audit entries for the two order modules.
   These are synthetic operations, not real staff activity.
   Kept separate from the persistent live audit store. */
(function(){
"use strict";
const raw=[
["2026-10-20 12:41:18","service","HS-DEMO-0017","Maya Chen","Edit","Updated custom ride processing owner and UI brief",[["uiDesigner","Unassigned","@Luka YM GAO"],["processingUI","Awaiting materials","UI review in progress"]]],
["2026-10-20 12:16:02","honor","HO-DEMO-1004","Daniel Kim","Complete","Approved honor benefit fulfillment",[["status","Pending","Processed"],["operator","—","Daniel Kim"]]],
["2026-10-20 11:56:39","service","HS-DEMO-0018","Olivia Tan","Complete","Custom gift order marked complete",[["orderStatus","Pending","Processed"],["operatorEnglish","Maya Chen","Olivia Tan"]]],
["2026-10-20 11:35:42","honor","HO-DEMO-1002","Maya Chen","Return","Returned order for missing benefit information",[["status","Processed","Returning"],["operator","—","Maya Chen"]]],
["2026-10-20 11:08:15","service","HS-DEMO-0022","Noah Lee","Edit","Adjusted Banner display region and launch time",[["displayRegion","Pakistan","Pakistan, India"],["startTime","2026-10-20 18:00","2026-10-21 18:00"]]],
["2026-10-20 10:44:07","honor","","Olivia Tan","Export","Exported 13 honor orders matching the current filters",[]],
["2026-10-20 10:20:58","service","HS-DEMO-0019","Maya Chen","Create","Registered a sample custom gift request",[["orderType","—","Custom Gift"],["giftName","—","Ocean Bloom"],["orderStatus","—","Pending"]]],
["2026-10-20 09:55:34","service","HS-DEMO-0025","Daniel Kim","Notify Attempt","Notification was recorded but was not sent; Lark backend unavailable",[]],
["2026-10-20 09:17:11","honor","HO-DEMO-1010","Noah Lee","Bulk Return","Bulk return applied to the selected honor order",[["status","Pending","Returned"],["operator","—","Noah Lee"]]],
["2026-10-19 18:36:09","service","HS-DEMO-0027","Olivia Tan","Return","Account unban order returned for additional verification",[["orderStatus","Pending","Returning"],["assignedTo","Account Support","Account Support"]]],
["2026-10-19 17:22:43","service","HS-DEMO-0023","Maya Chen","Complete","Splash custom placement request completed",[["orderStatus","Pending","Processed"],["updatedAt","2026-10-18 16:11:00","2026-10-19 17:22:43"]]],
["2026-10-19 16:53:28","honor","HO-DEMO-1007","Daniel Kim","Complete","Benefit order marked processed",[["status","Pending","Processed"],["operator","—","Daniel Kim"]]],
["2026-10-19 15:39:12","service","","Noah Lee","Notification Settings","Updated default notification switches for service order categories",[["Banner & Splash","Off","On"],["Custom Ride","Off","On"]]],
["2026-10-19 14:04:26","honor","HO-DEMO-1008","Maya Chen","Edit","Corrected order contact reference",[["whatsapp","Not provided","Contact verified"],["operator","—","Maya Chen"]]],
["2026-10-19 11:48:30","service","HS-DEMO-0017","Olivia Tan","Create","Registered sample custom ride order",[["orderType","—","Custom Ride"],["rideName","—","Dynamite"],["orderStatus","—","Pending"]]],
["2026-10-19 10:30:51","honor","HO-DEMO-1001","Noah Lee","Return","Order sent back to processing queue",[["status","Processed","Returning"]]],
["2026-10-18 17:20:10","service","HS-DEMO-0024","Daniel Kim","Edit","Updated Banner text copy",[["wording","Initial draft","Honor Celebration"],["assignedTo","Unassigned","Regional Ops"]]],
["2026-10-18 15:08:33","honor","","Olivia Tan","Export","Exported 25 records from honor order management",[]],
["2026-10-18 13:46:05","service","HS-DEMO-0021","Maya Chen","Edit","Corrected price and valid duration for gift order",[["giftPrice","177000","300000"],["validDuration","1 month","2 months"]]],
["2026-10-18 11:17:42","honor","HO-DEMO-1009","Daniel Kim","Bulk Return","Bulk return requested for an incomplete order",[["status","Pending","Returned"]]],
["2026-10-17 16:14:07","service","HS-DEMO-0026","Noah Lee","Complete","Account unban request fulfilled",[["orderStatus","Pending","Processed"],["unbanStatus","In Progress","Unbanned"]]],
["2026-10-17 14:22:59","service","","Olivia Tan","Export","Exported 4 selected service orders",[]],
["2026-10-17 10:03:17","honor","HO-DEMO-1003","Maya Chen","Complete","Completed honor benefit order",[["status","Pending","Processed"]]],
["2026-10-16 17:45:21","service","HS-DEMO-0020","Daniel Kim","Return","Gift request returned for missing artwork",[["orderStatus","Pending","Returning"],["giftImage","Missing","Requested"]]],
["2026-10-16 13:38:06","honor","HO-DEMO-1006","Olivia Tan","Return","Returned honor order due to invalid package data",[["status","Pending","Returning"]]],
["2026-10-15 16:25:33","service","HS-DEMO-0018","Maya Chen","Edit","Assigned sample gift design follow-up",[["uiDesigner","Unassigned","@Luka YM GAO"],["processingUI","New request","Waiting for asset review"]]],
["2026-10-15 10:10:42","honor","HO-DEMO-1005","Noah Lee","Complete","Honor benefit order processed",[["status","Pending","Processed"]]],
["2026-10-14 15:58:20","service","HS-DEMO-0022","Daniel Kim","Create","Created Banner & Splash service request",[["orderType","—","Banner & Splash"],["displayType","—","Banner"],["orderStatus","—","Pending"]]],
["2026-10-14 11:06:25","honor","HO-DEMO-1011","Maya Chen","Bulk Return","Bulk returned an unfulfilled honor order",[["status","Pending","Returned"]]],
["2026-10-13 18:18:04","service","HS-DEMO-0019","Olivia Tan","Notify Attempt","Notification attempt recorded; message not delivered",[]]
];
const demoSummary=["更新定制座驾设计师及设计处理说明","完成荣誉权益订单","完成定制礼物订单","因权益资料不完整发起退回","调整 Banner 展示地区和开始时间","导出筛选后的 13 条荣誉订单","登记定制礼物申请","机器人接口未接入，通知未发送","批量退回已勾选的荣誉订单","账号解封订单退回补充核验资料","完成开屏展示定制订单","完成荣誉权益处理","调整各订单类型的默认通知配置","修正荣誉订单联系方式","新增定制座驾订单","退回订单至待处理队列","修改 Banner 展示文案","导出 25 条荣誉订单","修改定制礼物价格及有效期","对资料不全的荣誉订单执行批量退回","完成账号解封订单","导出所选的 4 条服务订单","完成荣誉权益订单","因缺少设计素材退回礼物订单","因套餐资料异常退回订单","安排定制礼物设计跟进","完成荣誉权益订单","新增 Banner及开屏订单","批量退回未履约的荣誉订单","记录通知尝试，消息未成功送达"];
window.HONOR_DEMO_AUDIT_ENTRIES=raw.map((row,index)=>({
 id:"LOG-DEMO-"+String(index+1).padStart(4,"0"),
 when:row[0],module:row[1],orderId:row[2],
 actor:row[3]+" (Demo)",action:row[4],
 detail:"【演示】"+demoSummary[index],
 changes:row[6].map(([field,before,after])=>({field,before,after})),
 demo:true
}));
})();
(function(){
"use strict";
const $=id=>document.getElementById(id);
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const A=window.HonorAudit;
let page=1,limit=20,filters={};
const moduleLabels={honor:"荣誉订单",service:"荣誉服务订单"};
const actionLabels={Create:"新增",Edit:"编辑",Complete:"完成",Return:"退回","Bulk Return":"批量退回",Export:"导出","Notification Settings":"通知设置","Notify Attempt":"通知尝试"};
const fieldNames={status:"订单状态",orderStatus:"订单状态",operator:"操作员工",operatorEnglish:"操作员工",assignedTo:"处理负责人",uiDesigner:"UI设计师",processingUI:"设计处理说明",displayRegion:"展示地区",startTime:"开始时间",giftPrice:"礼物价格",giftImage:"礼物图片",validDuration:"有效期",unbanStatus:"解封状态",wording:"展示文案",orderType:"订单类型",giftName:"礼物名称",rideName:"座驾名称",updatedAt:"更新时间",whatsapp:"联系方式",displayType:"展示类型"};
const labelAction=value=>actionLabels[value]||value;
const translateDetail=value=>{
 const text=String(value||"");
 const labels={
  "Created service order":"新增荣誉服务订单",
  "Updated service order":"修改荣誉服务订单",
  "Updated honor order status":"更新荣誉订单状态",
  "Order status changed":"修改订单状态",
  "Settings saved (Webhook URLs excluded)":"已保存通知配置（Webhook地址未写入日志）",
  "Message not sent: no server integration":"通知服务未接入，消息未发送"
 };
 if(labels[text])return labels[text];
 const exportMatch=text.match(/^Exported (\\d+) (?:selected or filtered )?orders?$/i);
 if(exportMatch)return "导出 "+exportMatch[1]+" 条订单";
 return text;
};
const translateValue=value=>{
 const text=String(value??"");
 const mapped={"Pending":"待处理","Processed":"已处理","Returned":"已退回","Returning":"退回中","In Progress":"处理中",
 "On":"开启","Off":"关闭","Unassigned":"未分配","Unknown":"未知"};
 return mapped[text]||text||"—";
};
const entries=()=>{
 const actual=A?A.read():[];
 const demo=Array.isArray(window.HONOR_DEMO_AUDIT_ENTRIES)?window.HONOR_DEMO_AUDIT_ENTRIES:[];
 const ids=new Set(actual.map(r=>r.id));
 return [...actual,...demo.filter(r=>!ids.has(r.id))].sort((a,b)=>String(b.when||"").localeCompare(String(a.when||"")));
};
function filtered(){
 return entries().filter(r=>
 (!filters.module||r.module===filters.module)&&
 (!filters.orderId||String(r.orderId||"").toLowerCase().includes(filters.orderId))&&
 (!filters.actor||String(r.actor||"").toLowerCase().includes(filters.actor))&&
 (!filters.action||r.action===filters.action)&&
 (!filters.start||String(r.when).slice(0,10)>=filters.start)&&
 (!filters.end||String(r.when).slice(0,10)<=filters.end));
}
function apply(){
 filters={
  module:$("auditFilterModule").value,
  orderId:$("auditFilterOrderId").value.trim().toLowerCase(),
  actor:$("auditFilterActor").value.trim().toLowerCase(),
  action:$("auditFilterAction").value,
  start:$("auditFilterStart").value,
  end:$("auditFilterEnd").value
 };
 page=1;render();
}
function render(){
 const data=filtered(),n=data.length,pages=Math.max(1,Math.ceil(n/limit));
 page=Math.max(1,Math.min(page,pages));
 const items=data.slice((page-1)*limit,page*limit);
 $("auditRows").innerHTML=items.length?items.map(r=>
 '<tr><td>'+esc(r.id)+'</td>'+
 '<td>'+esc(r.when)+'</td>'+
 '<td><span class="audit-tag">'+esc(moduleLabels[r.module]||r.module)+'</span></td>'+
 '<td>'+esc(r.orderId||"—")+'</td>'+
 '<td>'+esc(r.actor||"未知")+'</td>'+
 '<td>'+esc(labelAction(r.action))+'</td>'+
 '<td class="audit-center"><button class="so-cell-action" type="button" data-log-id="'+esc(r.id)+'">查看详情</button></td></tr>'
 ).join(""):'<tr><td colspan="7" class="audit-empty">暂无数据</td></tr>';
 $("auditCount").textContent="共 "+n+" 条";
 $("auditPage").textContent=page+" / "+pages;
 $("auditPageSummary").textContent="共 "+n+" 条";
 $("auditPrev").disabled=page===1;$("auditNext").disabled=page>=pages;
}
function info(name,value){return '<div><strong>'+esc(name)+'</strong><span>'+esc(value||"—")+'</span></div>'}
function show(id){
 const log=entries().find(r=>r.id===id);
 if(!log)return;
 $("auditModalHeading").textContent="操作详情";
 $("auditModalSubtitle").textContent=labelAction(log.action)+" · "+log.when;
 const changes=Array.isArray(log.changes)?log.changes:[];
 const comparison=changes.length?
 changes.map(c=>'<tr><td>'+esc(fieldNames[c.field]||c.field)+'</td><td>'+esc(translateValue(c.before))+'</td><td>'+esc(translateValue(c.after))+'</td></tr>').join(""):
 '<tr><td class="audit-empty" colspan="3">暂无字段变化</td></tr>';
 $("auditModalContent").innerHTML=
 '<div class="audit-meta">'+
 info("日志ID",log.id)+info("操作时间",log.when)+
 info("订单模块",moduleLabels[log.module]||log.module)+info("订单ID",log.orderId)+
 info("操作员工",log.actor||"Unknown")+info("操作类型",log.action)+
 '</div>'+
 '<div class="so-section"><h3 class="so-section-title">操作说明</h3><p class="audit-details-line">'+esc(translateDetail(log.detail)||"—")+'</p>'+
 '<h3 class="so-section-title">字段变化</h3><table class="audit-diff"><thead><tr><th>字段</th><th>修改前</th><th>修改后</th></tr></thead><tbody>'+comparison+'</tbody></table></div>';
 $("auditModal").classList.add("open");$("auditModal").setAttribute("aria-hidden","false");
}
function close(){$("auditModal").classList.remove("open");$("auditModal").setAttribute("aria-hidden","true")}
$("auditFilterForm").onsubmit=e=>{e.preventDefault();apply()};
$("auditReset").onclick=()=>{
 $("auditFilterForm").reset();filters={};page=1;render();
};
$("auditPrev").onclick=()=>{page--;render()};
$("auditNext").onclick=()=>{page++;render()};
$("auditRows").onclick=e=>{
 const b=e.target.closest("[data-log-id]");
 if(b)show(b.dataset.logId);
};
$("auditModalClose").onclick=close;
$("auditModalDone").onclick=close;
$("auditModal").onclick=e=>{if(e.target===$("auditModal"))close()};
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&$("auditModal").classList.contains("open"))close()});
$("auditRefresh").onclick=render;
document.querySelectorAll(".nav-group-header").forEach(n=>n.onclick=()=>{
 n.parentNode.classList.toggle("collapsed");const icon=n.querySelector(".chevron");if(icon)icon.textContent=n.parentNode.classList.contains("collapsed")?"⌄":"⌃";
});
document.querySelectorAll(".nav-subhead").forEach(n=>n.onclick=()=>{
 n.parentNode.classList.toggle("collapsed");const icon=n.querySelector("b");if(icon)icon.textContent=n.parentNode.classList.contains("collapsed")?"⌄":"⌃";
});
$("soSidebarToggle").onclick=()=>{$("soSidebar").classList.toggle("tiny-sidebar")};
render();
})();