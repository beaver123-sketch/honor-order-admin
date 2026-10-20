/* Demo-only orders. Derived from the uploaded Customized Rides workbooks.
   Identifiers, usernames, account details and private links are synthetic. */
(function(){
"use strict";
const rideSpecs=[
 ["2025-12-03","Morocco","SAM & YARA","Lover","processed"],
 ["2025-12-24","Saudi Arabia","Phoenix 999","Phoenix","processed"],
 ["2026-03-03","Pakistan","Dragon Shadow","Dark Dragon","processed"],
 ["2026-03-10","India","Awaiting Confirmation","Unspecified","returned"],
 ["2026-04-02","Pakistan","John Wick","Cinematic Magician","processed"],
 ["2026-04-07","Pakistan","Pending Design","Not Provided","returned"],
 ["2026-04-10","Philippines","Pending Design","Not Provided","returned"],
 ["2026-05-21","Pakistan","KING 👑","Royal Theme","processed"],
 ["2026-06-30","United Arab Emirates","Dubai","Dubai Skyline","processed"],
 ["2026-07-25","Pakistan","NAIN LEGEND","Red Dragon","processed"],
 ["2026-07-27","Ukraine","Wild Roar","Lion Fantasy","processed"],
 ["2026-08-10","Pakistan","Wick Arrived","Character Icon","processed"],
 ["2026-08-12","Indonesia","Odin","Cyberpunk","processed"],
 ["2026-08-29","Brazil","Heart of Brazil","Brazil Celebration","processed"],
 ["2026-09-15","Pakistan","Geo Pakistani","National Theme","processed"],
 ["2026-09-21","India","Be Positive","Positive Energy","processed"],
 ["2026-10-19","India","Dynamite","Action Theme","pending"]
];
const otherSpecs=[
 ["gift","2026-10-18","Pakistan","AMAN 6540","processed","regular",300000],
 ["gift","2026-10-16","Egypt","Ocean Bloom","pending","regular",177000],
 ["gift","2026-10-13","Indonesia","Golden Phoenix","returning","limited",600000],
 ["gift","2026-10-08","Saudi Arabia","Celestial Rose","processed","regular",300000],
 ["banner","2026-10-17","Pakistan","Diwali Banner","pending","banner"],
 ["banner","2026-10-15","Indonesia","Festival Splash","processed","splash"],
 ["banner","2026-10-11","Philippines","Honor Celebration","pending","banner"],
 ["unban","2026-10-19","Saudi Arabia","Account Review","pending","pending"],
 ["unban","2026-10-14","India","Restoration Request","processed","unbanned"],
 ["unban","2026-10-10","Pakistan","Account Appeal","returned","failed"]
];
function makeBase(kind,date,nation,name,status,index){
 const yy=String(index).padStart(4,"0");
 const time=date+" "+String(10+(index%9)).padStart(2,"0")+":25:00";
 const iso=time.replace(" ","T").slice(0,16);
 const base={
  id:"HS-DEMO-"+yy,
  demo:true,
  orderType:kind,
  redeemedOrderId:"RD-DEMO-"+yy,
  userId:String(91000000+index*59),
  username:"Demo User "+String(index).padStart(2,"0"),
  nationality:nation,
  redemptionTime:iso,
  orderStatus:status,
  assignedTo:kind==="ride"?"Design Team":kind==="gift"?"Gift Ops":kind==="banner"?"Regional Ops":"Account Support",
  whatsapp:"",
  groupLink:"",
  benefitName:{ride:"Customized Ride - 2 Months",gift:"Custom Gift - 2 Months",banner:"Banner & Splash",unban:"Account Unban"}[kind],
  honorWallId:String(76000000+index*73),
  createdAt:time,
  updatedAt:time,
  notes:"Sample data based on service-order tables; synthetic user information.",
  notifyEnabled:false,notifyConfigRef:"",
  history:[{when:time,action:"Demo Record / 演示记录",by:"Sample Data",desc:"Example order for UI testing; not a live transaction."}],
  notifications:[]
 };
 return base;
}
let n=1;
const rides=rideSpecs.map(([date,nation,name,theme,status])=>{
 const o=makeBase("ride",date,nation,name,status,n++);
 o.rideName=name;o.theme=theme;
 o.backgroundScene=theme==="Cyberpunk"?"Futuristic City":"";
 o.referenceMedia="";o.designFiles="";o.rideNotes=status==="returned"?"Order cancelled / not replying":"Design reference: "+theme;
 return o;
});
const others=otherSpecs.map(([type,date,nation,name,status,detail,price])=>{
 const o=makeBase(type,date,nation,name,status,n++);
 if(type==="gift"){
   Object.assign(o,{giftName:name,giftType:detail,giftDescription:"",
     availableCountries:nation,giftPrice:String(price),validDuration:"2 months",giftNotes:"Mock gift request."});
 }else if(type==="banner"){
   const start=date+"T18:00",end=date+"T22:00";
   Object.assign(o,{displayType:detail,displayRegion:nation,startTime:start,endTime:end,
    copy:"Celebrate Together",wording:name,bannerNotes:"Demo placement campaign."});
 }else{
   Object.assign(o,{accountId:"ACC-DEMO-"+String(n-1).padStart(3,"0"),accountNationality:nation,
     suspensionReason:"Account review",unbanStatus:detail,unbanNotes:"Illustrative support request."});
 }
 return o;
});
window.HONOR_SERVICE_DEMO_ORDERS=rides.concat(others);
})();