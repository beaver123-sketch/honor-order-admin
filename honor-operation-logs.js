(function(){
"use strict";
const $=id=>document.getElementById(id);
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const A=window.HonorAudit;
let page=1,limit=20,filters={};
const moduleLabels={honor:"Honor Orders",service:"Honor Service Orders"};
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
 '<td>'+esc(r.actor||"Unknown")+'</td>'+
 '<td>'+esc(r.action)+'</td>'+
 '<td class="audit-center"><button class="so-cell-action" type="button" data-log-id="'+esc(r.id)+'">View Details</button></td></tr>'
 ).join(""):'<tr><td colspan="7" class="audit-empty">No Data</td></tr>';
 $("auditCount").textContent="Total "+n;
 $("auditPage").textContent=page+" / "+pages;
 $("auditPageSummary").textContent="Total "+n+" records";
 $("auditPrev").disabled=page===1;$("auditNext").disabled=page>=pages;
}
function info(name,value){return '<div><strong>'+esc(name)+'</strong><span>'+esc(value||"—")+'</span></div>'}
function show(id){
 const log=entries().find(r=>r.id===id);
 if(!log)return;
 $("auditModalHeading").textContent="Operation Details";
 $("auditModalSubtitle").textContent=log.action+" · "+log.when;
 const changes=Array.isArray(log.changes)?log.changes:[];
 const comparison=changes.length?
 changes.map(c=>'<tr><td>'+esc(c.field)+'</td><td>'+esc(c.before||"—")+'</td><td>'+esc(c.after||"—")+'</td></tr>').join(""):
 '<tr><td class="audit-empty" colspan="3">No field changes</td></tr>';
 $("auditModalContent").innerHTML=
 '<div class="audit-meta">'+
 info("Log ID",log.id)+info("Operation Time",log.when)+
 info("Order Module",moduleLabels[log.module]||log.module)+info("Order ID",log.orderId)+
 info("Operator",log.actor||"Unknown")+info("Action Type",log.action)+
 '</div>'+
 '<div class="so-section"><h3 class="so-section-title">Operation Summary</h3><p class="audit-details-line">'+esc(log.detail||"—")+'</p>'+
 '<h3 class="so-section-title">Field Changes</h3><table class="audit-diff"><thead><tr><th>Field</th><th>Before</th><th>After</th></tr></thead><tbody>'+comparison+'</tbody></table></div>';
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