/* ---------- Courtney: index bar, clinical tools, exam log ---------- */
/* Inserted into courtney/index.html by build-courtney.js, just before render(). */
function cnStep(o,k){return Array.isArray(o)?o.find(x=>x.id===k):o?o[k]:undefined}
function cnGet(p){return p.split(".").reduce(cnStep,S.cn)}
function cnSet(p,v){const ks=p.split("."),last=ks.pop();const o=ks.reduce(cnStep,S.cn);if(o)o[last]=v}
const cnId=p=>"cn-"+p.replace(/\./g,"-");
function cnIn(p,ph,cls){return `<input class="cn-in ${cls||""}" id="${cnId(p)}" data-cn="${p}" value="${esc(cnGet(p)||"")}" placeholder="${esc(ph||"")}" autocomplete="off">`}
function cnTa(p,ph){return `<textarea class="cn-ta" id="${cnId(p)}" data-cn="${p}" placeholder="${esc(ph||"")}">${esc(cnGet(p)||"")}</textarea>`}

const IX=[["Plan","pink","ix-cal"],["Study","green","ix-lists"],["Clinical","orange","ix-clinical"],["Exam Prep","purple","ix-exam"],["Life","yellow","ix-habits"],["Quick Reference","pink","ix-qref"]];
function indexHTML(){return `<nav class="ix" aria-label="Find your page">${IX.map(i=>`<a href="#${i[2]}" style="--hl:var(--hl-${i[1]})">${i[0]}</a>`).join("")}</nav>`}

function mapHTML(){
  const box=(k,label,c)=>`<label class="cm-box" style="--hl:var(--hl-${c})"><span>${label}</span>${cnTa("map."+k,"")}</label>`;
  return `<div class="sheet"><div class="cm-top"><span class="label">Concept Map</span>${cnIn("map.topic","Topic","cm-topic")}</div>
    <div class="cm">
      ${box("ssx","s/sx","orange")}${box("causes","causes","pink")}${box("comp","complications","pink")}
      <label class="cm-main"><span>main concept</span>${cnTa("map.main","")}</label>
      ${box("risk","risk factors","green")}${box("tx","treatment","purple")}${box("care","nursing care","yellow")}
    </div>
    <div class="block-acts"><button class="link-btn" data-cnact="clearMap">Clear map</button></div></div>`;
}
function sbarHTML(){
  const f=(k,l,ph)=>`<label class="sb"><b>${l}</b>${cnTa("sbar."+k,ph)}</label>`;
  return `<div class="sheet"><span class="label">SBAR Report Sheet</span>
    ${f("s","S · Situation","What’s happening right now")}${f("b","B · Background","History, diagnosis, meds, allergies")}
    ${f("a","A · Assessment","Vitals, findings, what you think is going on")}${f("r","R · Recommendation","What you need or suggest")}
    <div class="block-acts"><button class="link-btn" data-cnact="clearSbar">Clear</button></div></div>`;
}
const VCOLS=[["time","Time"],["temp","Temp"],["pulse","Pulse"],["resp","Resp"],["bp","BP"],["spo2","SpO₂"],["pain","Pain"]];
function vitalsHTML(){
  return `<div class="sheet"><span class="label">Vital Signs Chart</span>
    ${cnIn("vpatient","Patient initials · date","cm-topic")}
    <div class="cn-scroll"><table class="cn-t"><thead><tr>${VCOLS.map(c=>`<th>${c[1]}</th>`).join("")}<th></th></tr></thead>
    <tbody>${S.cn.vitals.map(r=>`<tr>${VCOLS.map(c=>`<td>${cnIn("vitals."+r.id+"."+c[0],"")}</td>`).join("")}<td><button class="icon-btn danger" data-cnact="del" data-k="vitals" data-id="${r.id}" aria-label="Delete reading">✕</button></td></tr>`).join("")}</tbody></table></div>
    <div class="block-acts"><button class="link-btn" data-cnact="addVital">+ Add reading</button></div></div>`;
}
const DF=[["cls","Class"],["action","Action"],["dose","Dose / route"],["se","Side effects"],["nc","Nursing considerations"]];
function drugsHTML(){
  return `<div class="drugs">${S.cn.drugs.map(d=>`<div class="sheet drug"><div class="cm-top"><span class="label">Drug Card</span><button class="icon-btn danger" data-cnact="del" data-k="drugs" data-id="${d.id}" aria-label="Delete drug card">✕</button></div>
      ${cnIn("drugs."+d.id+".name","Drug name","drug-name")}
      ${DF.map(f=>`<label class="sb"><b>${f[1]}</b>${cnTa("drugs."+d.id+"."+f[0],"")}</label>`).join("")}</div>`).join("")}
    <button class="ghost" data-cnact="addDrug">+ New drug card</button></div>`;
}
function clinicalHTML(){
  return `<section><div class="sec-head"><h2 id="ix-clinical">Clinical</h2><span class="meta">Saves as you type</span></div>
    <div class="cn-grid">${mapHTML()}${sbarHTML()}</div>
    <div class="cn-gap">${vitalsHTML()}</div>
    <div class="cn-gap">${drugsHTML()}</div></section>`;
}
function examHTML(){
  const q=S.cn.qlog,done=q.filter(r=>+r.pct>0),avg=done.length?Math.round(done.reduce((a,r)=>a+(+r.pct),0)/done.length):0;
  return `<section><div class="sec-head"><h2 id="ix-exam">Exam Prep</h2><span class="meta">${done.length?`${avg}% average across ${done.length} ${done.length===1?"session":"sessions"}`:"NCLEX & TEAS question log"}</span></div>
    <div class="sheet"><span class="label">Question Log</span>
    <div class="cn-scroll"><table class="cn-t"><thead><tr><th>Date</th><th>Test</th><th>Topic</th><th># Qs</th><th>% correct</th><th></th></tr></thead>
    <tbody>${q.map(r=>`<tr><td>${cnIn("qlog."+r.id+".date","")}</td>
      <td><select id="${cnId("qlog."+r.id+".test")}" data-cn="qlog.${r.id}.test" aria-label="Test">${["NCLEX","TEAS","ATI","Course exam"].map(o=>`<option ${r.test===o?"selected":""}>${o}</option>`).join("")}</select></td>
      <td>${cnIn("qlog."+r.id+".topic","Cardiac, peds…")}</td><td>${cnIn("qlog."+r.id+".n","")}</td><td>${cnIn("qlog."+r.id+".pct","")}</td>
      <td><button class="icon-btn danger" data-cnact="del" data-k="qlog" data-id="${r.id}" aria-label="Delete session">✕</button></td></tr>`).join("")}</tbody></table></div>
    <div class="block-acts"><button class="link-btn" data-cnact="addQ">+ Log a session</button></div></div></section>`;
}
/* ---- monthly calendar: S.cn.cal["YYYY-MM-DD"] = {items:[{id,t,time,cat}], note} ---- */
const CATS=[["clinical","Clinical","orange"],["exam","Exam","pink"],["class","Class / lecture","purple"],["appt","Appointment","blue"],["due","Due","yellow"],["life","Personal","green"]];
const catOf=c=>CATS.find(x=>x[0]===c)||CATS[5];
let calView=null,calSel=null;
/* Exams & Due Dates list items carry a date and show on the calendar automatically. */
const EXAM_RE=/\b(exam|test|quiz|ati|hesi|nclex|teas|final|midterm|benchmark|check-?off|skills)\b/i;
const MONS=["jan","feb","mar","apr","may","jun","jul","aug","sep","oct","nov","dec"];
const WDAYS=["sun","mon","tue","wed","thu","fri","sat"];
function parseDue(v){
  const now=new Date(),t0=new Date(now.getFullYear(),now.getMonth(),now.getDate());
  const fix=(y,m,d)=>{if(m<0||m>11||d<1||d>31)return null;let dt=new Date(y==null?t0.getFullYear():y,m,d);
    if(y==null&&dt<new Date(t0.getFullYear(),t0.getMonth()-2,t0.getDate()))dt=new Date(t0.getFullYear()+1,m,d);
    return dt.getMonth()===m?dkey(dt):null};
  let m=v.match(/\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/);
  if(m){const y=m[3]?(+m[3]<100?2000+(+m[3]):+m[3]):null;return fix(y,+m[1]-1,+m[2])}
  m=v.match(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.?\s+(\d{1,2})(?:st|nd|rd|th)?\b(?:,?\s*(\d{4}))?/i);
  if(m)return fix(m[3]?+m[3]:null,MONS.indexOf(m[1].slice(0,3).toLowerCase()),+m[2]);
  m=v.match(/\b(\d{1,2})(?:st|nd|rd|th)?\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\b/i);
  if(m)return fix(null,MONS.indexOf(m[2].slice(0,3).toLowerCase()),+m[1]);
  if(/\btoday\b/i.test(v))return dkey(t0);
  if(/\btomorrow\b/i.test(v))return dkey(new Date(t0.getFullYear(),t0.getMonth(),t0.getDate()+1));
  m=v.match(/\b(sun|mon|tue|tues|wed|thu|thur|thurs|fri|sat)(?:day|nesday|rsday|urday|sday)?\b/i);
  if(m){const w=WDAYS.indexOf(m[1].slice(0,3).toLowerCase());const add=(w-t0.getDay()+7)%7;return dkey(new Date(t0.getFullYear(),t0.getMonth(),t0.getDate()+add))}
  return null;
}
const examList=()=>S.lists.find(l=>l.id==="exams");
function dayItems(k){
  const own=(S.cn.cal[k]&&S.cn.cal[k].items)||[],el=examList();
  const fromList=el?el.items.filter(i=>i.date===k&&i.t).map(i=>({id:"x-"+i.id,t:i.t,time:"",cat:EXAM_RE.test(i.t)?"exam":"due",src:true,done:i.d})):[];
  return own.concat(fromList).sort(byTime);
}
function calDay(k,create){if(!S.cn.cal[k]&&create)S.cn.cal[k]={items:[],note:""};return S.cn.cal[k]}
const evHTML=it=>`<span class="ev ${it.done?"done":""}" style="--hl:var(--hl-${catOf(it.cat)[2]})">${it.time?`<b>${nice(toMin(it.time))}</b> `:""}${esc(it.t)}</span>`;
const byTime=(a,b)=>(a.time||"99").localeCompare(b.time||"99");
function calendarHTML(){
  const now=new Date(),today=dkey(now);
  if(!calView)calView={y:now.getFullYear(),m:now.getMonth()};
  if(!calSel)calSel=today;
  const first=new Date(calView.y,calView.m,1),days=new Date(calView.y,calView.m+1,0).getDate();
  const weeks=Math.ceil((first.getDay()+days)/7),start=new Date(calView.y,calView.m,1-first.getDay());
  let cells="";
  for(let i=0;i<weeks*7;i++){
    const d=new Date(start.getFullYear(),start.getMonth(),start.getDate()+i),k=dkey(d),cd=S.cn.cal[k],its=dayItems(k);
    cells+=`<button type="button" class="cal-d ${d.getMonth()!==calView.m?"out":""} ${k===today?"today":""} ${k===calSel?"sel":""}" data-cnact="calSel" data-k="${k}" aria-label="${d.toDateString()}${its.length?", "+its.length+" items":""}">
      <span class="n">${d.getDate()}</span>${its.slice(0,3).map(evHTML).join("")}${its.length>3?`<span class="more">+${its.length-3} more</span>`:""}${cd&&cd.note?`<span class="nt">✎ note</span>`:""}</button>`;
  }
  const up=[];for(let i=0;i<7;i++){const d=new Date(now.getFullYear(),now.getMonth(),now.getDate()+i);dayItems(dkey(d)).filter(it=>!it.done).forEach(it=>up.push([d,it]))}
  const sd=new Date(calSel+"T12:00"),cd=S.cn.cal[calSel]||{items:[],note:""};
  return `<section><div class="sec-head"><h2 id="ix-cal">Calendar</h2><span class="meta">Tap a day to add appointments and notes</span></div>
  <div class="cal-wrap"><div class="sheet">
    <div class="cal-head"><h3>${first.toLocaleDateString(undefined,{month:"long",year:"numeric"})}</h3>
      <button class="icon-btn" data-cnact="calNav" data-d="-1" aria-label="Previous month">‹</button>
      <button class="pill-btn" data-cnact="calToday">Today</button>
      <button class="icon-btn" data-cnact="calNav" data-d="1" aria-label="Next month">›</button></div>
    <div class="cal-legend">${CATS.map(c=>`<span style="--hl:var(--hl-${c[2]})">${c[1]}</span>`).join("")}</div>
    <div class="cal-grid">${["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(x=>`<span class="cal-dow">${x}</span>`).join("")}${cells}</div>
    <div class="cal-up"><span class="label">Next 7 days</span>${up.length?up.map(([d,it])=>`<div class="cal-up-row" style="--hl:var(--hl-${catOf(it.cat)[2]})"><span class="dot"></span><span class="tm">${d.toLocaleDateString(undefined,{weekday:"short",day:"numeric"})}${it.time?" · "+nice(toMin(it.time)):""}</span><span>${esc(it.t)}</span></div>`).join(""):`<p class="cal-empty">Nothing scheduled this week.</p>`}</div>
  </div>
  <div class="sheet cal-panel"><span class="label">${sd.toLocaleDateString(undefined,{weekday:"long",month:"long",day:"numeric"})}</span>
    <ul class="cal-items">${dayItems(calSel).map(it=>`<li class="${it.done?"done":""}" style="--hl:var(--hl-${catOf(it.cat)[2]})"><span class="dot"></span><span class="tm">${it.time?nice(toMin(it.time)):"All day"}</span><span class="tx">${esc(it.t)}</span><span class="ct">${catOf(it.cat)[1]}</span>${it.src?`<span class="ct src" title="Edit it in your Exams & Due Dates list">from list</span>`:`<button class="icon-btn danger" data-cnact="calDel" data-id="${it.id}" aria-label="Delete ${esc(it.t)}">✕</button>`}</li>`).join("")||`<li class="cal-empty">Nothing yet. Add your first one below.</li>`}</ul>
    <form class="cal-add" id="calAdd">
      <input id="calText" placeholder="Appointment, exam, clinical…" autocomplete="off" aria-label="What">
      <input type="time" id="calTime" aria-label="Time (optional)">
      <select id="calCat" aria-label="Type">${CATS.map(c=>`<option value="${c[0]}" ${c[0]===calLastCat?"selected":""}>${c[1]}</option>`).join("")}</select>
      <button class="solid-btn" type="submit">Add</button></form>
    <label class="sb"><b>Notes for this day</b><textarea class="cn-ta cal-note" id="cn-calnote" data-calnote="1" placeholder="Reminders, what to bring, room numbers…">${esc(cd.note||"")}</textarea></label>
  </div></div></section>`;
}
let calLastCat="clinical";
app.addEventListener("change",e=>{
  const t=e.target;if(!S||!t.dataset)return;
  if(t.dataset.cdate){const it=examList()&&examList().items.find(i=>i.id===t.dataset.i);if(it){it.date=t.value||"";save();render()}return}
  if(t.dataset.act==="edit"&&t.dataset.l==="exams"){const it=examList().items.find(i=>i.id===t.dataset.i);if(it&&!it.date){const pd=parseDue(t.value);if(pd){it.date=pd;save();setTimeout(()=>render(),0)}}}
});
app.addEventListener("submit",e=>{
  if(e.target.id!=="calAdd"||!S)return;e.preventDefault();
  const t=$("#calText").value.trim();if(!t)return;
  calLastCat=$("#calCat").value;
  calDay(calSel,true).items.push({id:uid(),t,time:$("#calTime").value||"",cat:calLastCat});save();render("calText");
});
app.addEventListener("input",e=>{if(!e.target.dataset||!e.target.dataset.calnote||!S)return;calDay(calSel,true).note=e.target.value;save()});
app.addEventListener("input",e=>{const p=e.target.dataset&&e.target.dataset.cn;if(!p||!S)return;cnSet(p,e.target.value);save()});
app.addEventListener("click",e=>{
  const b=e.target.closest("[data-cnact]");if(!b||!S)return;const a=b.dataset.cnact,id=uid();
  if(a==="calSel"){calSel=b.dataset.k;const d=new Date(calSel+"T12:00");calView={y:d.getFullYear(),m:d.getMonth()};render()}
  else if(a==="calNav"){calView=new Date(calView.y,calView.m+(+b.dataset.d),1);calView={y:calView.getFullYear(),m:calView.getMonth()};render()}
  else if(a==="calToday"){calView=null;calSel=null;render()}
  else if(a==="calDel"){const cd=calDay(calSel);if(cd){cd.items=cd.items.filter(x=>x.id!==b.dataset.id);save();render()}}
  else if(a==="addVital"){const t=new Date();S.cn.vitals.push({id,time:pad2(t.getHours())+":"+pad2(t.getMinutes())});save();render(cnId("vitals."+id+".temp"))}
  else if(a==="addDrug"){S.cn.drugs.push({id});save();render(cnId("drugs."+id+".name"))}
  else if(a==="addQ"){S.cn.qlog.push({id,date:new Date().toLocaleDateString(undefined,{month:"short",day:"numeric"}),test:"NCLEX"});save();render(cnId("qlog."+id+".topic"))}
  else if(a==="del"){S.cn[b.dataset.k]=S.cn[b.dataset.k].filter(x=>x.id!==b.dataset.id);save();render()}
  else if(a==="clearMap"){if(confirm("Clear this concept map?")){S.cn.map={};save();render()}}
  else if(a==="clearSbar"){if(confirm("Clear this SBAR sheet?")){S.cn.sbar={};save();render()}}
});
