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
window.HONOR_DEMO_AUDIT_ENTRIES=raw.map((row,index)=>({
 id:"LOG-DEMO-"+String(index+1).padStart(4,"0"),
 when:row[0],module:row[1],orderId:row[2],
 actor:row[3]+" (Demo)",action:row[4],
 detail:"[Demo] "+row[5],
 changes:row[6].map(([field,before,after])=>({field,before,after})),
 demo:true
}));
})();