/* Chinese presentation layer for the standalone Honor Service Orders reference page.
 * Keeps API keys, form field names, order IDs, option values and business data unchanged.
 * Translates only visible labels and accessible help as they enter the DOM.
 */
(function(){
"use strict";
const countries={
"Pakistan":"巴基斯坦","India":"印度","Bangladesh":"孟加拉国","Nepal":"尼泊尔","Bhutan":"不丹",
"Sri Lanka":"斯里兰卡","Maldives":"马尔代夫","Philippines":"菲律宾",
"Ukraine":"乌克兰","Russia":"俄罗斯","Kazakhstan":"哈萨克斯坦","Uzbekistan":"乌兹别克斯坦","Belarus":"白俄罗斯",
"Brazil":"巴西","Argentina":"阿根廷","Chile":"智利","Colombia":"哥伦比亚","Peru":"秘鲁",
"United States":"美国","United Kingdom":"英国","Ireland":"爱尔兰","France":"法国","Germany":"德国","Canada":"加拿大",
"Nigeria":"尼日利亚","Egypt":"埃及","Morocco":"摩洛哥","South Africa":"南非","Kenya":"肯尼亚",
"Saudi Arabia":"沙特阿拉伯","United Arab Emirates":"阿联酋","Qatar":"卡塔尔","Oman":"阿曼","Kuwait":"科威特","Bahrain":"巴林",
"Vietnam":"越南","Indonesia":"印度尼西亚","Malaysia":"马来西亚","Singapore":"新加坡","Japan":"日本",
"Thailand":"泰国","Cambodia":"柬埔寨","Myanmar":"缅甸","Taiwan (China)":"台湾（中国）"
};
const regionLabels={
"All Key":"全部重要","South Asia":"南亚区","Philippines":"菲律宾区",
"Russian-speaking":"俄语区","South America":"南美洲区","Europe & US":"欧美区","Africa":"非洲区",
"Middle East":"中东区","Virtual Area":"虚拟国区","Vietnam":"越南区","India & Malaysia":"印马区"
};
const terms={
"Honor Service Orders":"荣誉服务订单","Honor Orders":"荣誉订单",
"Search Filters":"查询条件","Search":"查询","Reset":"重置",
"Order List":"订单列表","Service Order ID":"服务订单ID","Redeemed Order ID":"关联兑换订单ID",
"Order Type":"订单类型","Benefit Name":"权益名称","User ID":"用户ID","Username":"用户昵称",
"Nationality":"用户国籍","Nationality / Region":"国家/地区","Honor Wall ID":"荣誉墙ID",
"Order Status":"订单状态","Order Time":"订单时间","Assigned To":"处理负责人",
"Updated Time":"更新时间","Operator":"操作员工","Actions":"操作",
"Add Order":"新增订单","Export":"导出","Notification Settings":"消息通知配置",
"All":"全部","No Data":"暂无数据","No orders to export":"没有可导出的订单",
"Export headers not ready":"导出表头尚未就绪",
"Account Unban":"账号解封","Banner & Splash":"Banner及开屏","Custom Gift":"定制礼物","Custom Ride":"定制座驾",
"Pending":"待处理","Processed":"已处理","Returning":"退回中","Returned":"已退回",
"In Progress":"处理中","Unbanned":"已解封","Failed":"失败",
"Banner":"Banner横幅","Splash":"开屏","Regular":"普通","Limited":"限定",
"Edit":"编辑","Complete":"完成","Return":"退回",
"Order Details":"订单详情","Basic Information":"基本信息",
"Redemption Time":"兑换时间","Operator (English Name)":"操作员工英文名",
"WhatsApp":"WhatsApp 联系方式","Notes":"备注",
"Account ID":"解封账号ID","Account Nationality":"解封账号国籍","Suspension Reason":"封禁原因","Unban Status":"解封状态",
"Display Type":"展示类型","Display Region":"展示区域","Config Link":"配置链接",
"Color":"颜色","Copy":"短文案","Wording":"展示文案","Image":"图片素材",
"Start Time":"开始时间","End Time":"结束时间","Final Design":"最终设计稿",
"UI Designer":"UI设计师","Processing UI":"UI设计师","Processing UI (UI Designer)":"UI设计师（@选择）","Group Link":"群聊链接",
"Available Countries":"上线国家","Gift Type":"礼物类型","Gift Name":"礼物名称",
"Gift Description":"礼物描述","Gift Image":"礼物图片","Gift Reference Image":"礼物参考图","Gift Video":"礼物视频素材",
"Gift Price":"礼物价格","Valid Duration":"有效期",
"Schedule":"排期设置","Start Date":"开始日期","End Date":"结束日期",
"Enter assignee name":"请输入处理负责人姓名",
"Type @ to mention a UI designer, then add follow-up notes":"输入 @ 搜索UI设计师，随后可填写跟进说明",
"Type @ to select a UI designer":"输入 @ 搜索并选择UI设计师",
"Type @ to select a designer":"输入 @ 选择设计师",
"Upload Reference Image":"上传礼物参考图","Remove":"移除",
"No file selected":"未选择图片",
"Demo preview saved in this browser; no server upload. PNG / JPG / WebP.":"演示版图片仅保存在当前浏览器，未上传服务器。支持 PNG / JPG / WebP。",
"Please select both schedule dates":"请完整选择排期起止日期",
"Schedule end date cannot be earlier than start date":"排期结束日期不能早于开始日期",
"Please wait while the reference image is processing":"正在处理礼物参考图，请稍后保存",
"Choose a JPG, PNG or WebP image under 8 MB":"请选择小于8MB的 JPG、PNG 或 WebP 图片",
"Could not prepare the reference image":"礼物参考图处理失败",
"Cannot read the selected image":"无法读取所选图片",
"Theme":"主题","Background / Scene":"背景及场景","Ride Name":"座驾名称",
"Reference Image or Video":"参考图片或视频","Design Files":"设计文件",
"Please enter":"请输入","Select countries":"请选择国家","Select country":"请选择国家",
"Search country":"搜索国家","Show Selected":"展开已选",
"Clear Selection":"取消已选","Select All":"全选","Selected Countries":"已选国家",
"Search Results":"搜索结果","Countries":"国家","No countries available":"暂无可选国家",
"Upload File":"上传文件","Download File":"下载文件","No file":"暂无文件",
"File URL":"文件链接","File name or link only; no server upload":"仅记录文件名称或链接，不上传至服务器",
"Separate multiple countries with commas":"多个国家请用逗号分隔",
"Maximum 10 words":"最多10个英文单词",
"Regular ≥177,000 coins; Limited ≥600,000":"普通礼物不少于177,000金币；限定礼物不少于600,000金币",
"2 months":"2个月",
"Save":"保存","Cancel":"取消","Close":"关闭","Submit":"提交",
"Activity Log":"操作记录","Notification History":"通知记录",
"All required fields marked *":"标 * 的字段为必填",
"View":"查看","Confirm Order Completion":"确认完成订单","Confirm Return":"确认退回",
"Saved Successfully":"保存成功","Notification settings saved":"通知配置已保存",
"Please enter the overseas operator's English name":"请输入海外操作员工英文名",
"Webhook delivery unavailable in frontend preview":"演示版暂未接入真实 Webhook 消息推送",
"Settings saved (Webhook URLs excluded)":"已保存通知配置（日志不包含 Webhook）",
"Please enter Robot Webhook":"请输入机器人 Webhook 标识或链接",
"Unable to save locally":"本地保存失败","Unable to save notification settings":"通知配置保存失败",
"Order not found":"未找到该订单",
"Robot Webhook":"机器人 Webhook","Enter Webhook ID or URL":"请输入 Webhook 标识或链接",
"Not configured":"未配置","Configured":"已配置",
"On":"开启","Off":"关闭","Unknown":"未知",
"Add Order / 新增订单":"新增订单",
"Customized Ride - 2 Months":"定制座驾 - 2个月",
"Custom Gift - 2 Months":"定制礼物 - 2个月",
"Select all orders on this page":"全选当前页订单","Select all on page":"全选当前页",
"Order List Actions":"订单列表操作","Previous":"上一页","Next":"下一页",
"Enter overseas operator English name":"请输入海外操作员工英文名",
"After collecting, notify @Jackson W YANG / @Luka YM GAO":"收集资料后通知 @Jackson W YANG / @Luka YM GAO",
"Pakistan, Egypt":"巴基斯坦、埃及","No field changes":"无字段变化",
"New request":"新申请","Add Order / 新增":"新增订单",
"Notification switches updated":"通知开关已更新",
"Confirm":"确认","Saved":"已保存",
"Send Lark Message":"发送 Lark 消息","Lark Notification":"Lark消息通知",
"Regular Gift":"普通礼物","Limited Gift":"限定礼物",
"Add Order":"新增订单","Notification Settings":"消息通知配置",
"Exported":"已导出","Failed to save":"保存失败",
"2 Months":"2个月","Custom Ride - 2 Months":"定制座驾 - 2个月",
"Custom Gift - 2 Months":"定制礼物 - 2个月",
"Actions / 操作":"操作",
"Created service order":"新增荣誉服务订单","Updated service order":"修改荣誉服务订单",
"Order status changed":"订单状态已变更",
"Account Support":"账号客服","Regional Ops":"区域运营","Gift Ops":"礼物运营","Design Team":"设计团队",
"Unassigned":"未分配","Not Sent":"未发送","System":"系统",
"End Time must be after Start Time":"结束时间必须晚于开始时间",
"Notify Assignee":"通知处理人员",
"Open Screen - 24h":"开屏 - 24小时",
"Banner - 24h":"Banner - 24小时"
};
const controls={
"⌕ Search":"⌕ 查询","⟳ Reset":"⟳ 重置","＋ Add Order":"＋ 新增订单",
"⇩ Export":"⇩ 导出","⚙ Notification Settings":"⚙ 消息通知配置"
};
function translate(value,context){
 const raw=String(value==null?"":value);
 const stripped=raw.trim();
 if(!stripped)return raw;
 let result;
 if(context&&context.closest&&context.closest(".so-region-category")&&regionLabels[stripped]){
  result=regionLabels[stripped];
 }else if(Object.prototype.hasOwnProperty.call(controls,stripped))result=controls[stripped];
 else if(Object.prototype.hasOwnProperty.call(terms,stripped))result=terms[stripped];
 else if(Object.prototype.hasOwnProperty.call(countries,stripped))result=countries[stripped];
 else if(Object.prototype.hasOwnProperty.call(regionLabels,stripped))result=regionLabels[stripped];
 else if(/^Total (\d+) records$/.test(stripped))result=stripped.replace(/^Total (\d+) records$/,"共 $1 条");
 else if(/^Total (\d+)$/.test(stripped))result=stripped.replace(/^Total (\d+)$/,"共 $1 条");
 else if(/^(\d+) selected$/.test(stripped))result=stripped.replace(/^(\d+) selected$/,"已选 $1 条");
 else if(/^(\d+) countries selected$/.test(stripped))result=stripped.replace(/^(\d+) countries selected$/,"已选 $1 个国家");
 else if(/^Show Selected \((\d+)\)$/.test(stripped))result=stripped.replace(/^Show Selected \((\d+)\)$/,"展开已选（$1）");
 else if(/^Exported (\d+) orders$/.test(stripped))result=stripped.replace(/^Exported (\d+) orders$/,"已导出 $1 条订单");
 else if(/^Edit(HS-[\w-]+)$/.test(stripped))result=stripped.replace(/^Edit(HS-[\w-]+)$/,"编辑订单：$1");
 else if(/^Order Details(HS-[\w-]+)$/.test(stripped))result=stripped.replace(/^Order Details(HS-[\w-]+)$/,"订单详情：$1");
 else if(/^Change status to (.+)\?$/.test(stripped))result="确认将订单状态改为「"+translate(stripped.slice(17,-1))+"」？";
 else if(/^Order Status: (.+) → (.+)$/.test(stripped)){const m=stripped.match(/^Order Status: (.+) → (.+)$/);result="订单状态："+translate(m[1])+" → "+translate(m[2]);}
 else if(/^Updated: (.+)$/.test(stripped))result="已修改："+stripped.slice(9).split(", ").map(x=>terms[x]||x).join("、");
 else if(stripped.includes(", ")&&stripped.split(", ").every(x=>countries[x]))result=stripped.split(", ").map(x=>countries[x]).join("、");
 else if(/^Select all on page$/.test(stripped))result="全选本页";
 else result=stripped;
 if(result===stripped)return raw;
 return raw.slice(0,raw.indexOf(stripped))+result+raw.slice(raw.indexOf(stripped)+stripped.length);
}
function process(root){
 if(!root)return;
 const textWalker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
 const list=[];
 while(textWalker.nextNode())list.push(textWalker.currentNode);
 for(const node of list){
  if(!node.parentElement||node.parentElement.closest("script,style,pre,code"))continue;
  const next=translate(node.nodeValue,node.parentElement);
  if(next!==node.nodeValue)node.nodeValue=next;
 }
 const controls=root.querySelectorAll?root.querySelectorAll("input,textarea,select,button,[title],[aria-label]"):[];
 for(const el of controls){
  for(const key of ["placeholder","title","aria-label"]){
   if(!el.hasAttribute(key))continue;
   const original=el.getAttribute(key),updated=translate(original,el);
   if(updated!==original)el.setAttribute(key,updated);
  }
 }
}
window.HonorServiceZH={translate,countryName:value=>countries[String(value||"")]||value};
document.documentElement.lang="zh-CN";
document.title="荣誉服务订单｜中文对照版";
let observer=null;
function refresh(){
 if(observer)observer.disconnect();
 process(document.body);
 if(observer)observer.observe(document.body,{childList:true,characterData:true,subtree:true});
}
observer=new MutationObserver(refresh);
refresh();
})();