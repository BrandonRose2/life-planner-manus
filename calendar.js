/* ---- monthly calendar: S.cal["YYYY-MM-DD"] = {items:[{id,t,time,cat,d}], note} ---- */
/* Inserted into index.html (Brandon's planner) just before render(). Source of truth for the calendar. */
const CATS=[["appt","Appointment","blue"],["work","Work","orange"],["personal","Personal","green"],["health","Health","pink"],["bill","Bill / due","yellow"],["remind","Reminder","purple"],["project","Project deadline","red"]];
const catOf=c=>CATS.find(x=>x[0]===c)||CATS[0];
let calView=null,calSel=null,calLastCat="appt",calFeed=null,calFeedOpen=false;
/* Apple Calendar subscription: only on the private server (window.__plannerServer is set there). */
function feedHTML(){if(!window.__plannerServer)return"";
  if(!calFeedOpen)return `<button class="pill-btn" data-calact="feed">Add to Apple Calendar</button>`;
  const u=calFeed?"webcal://"+location.host+calFeed:"";
  return `<div class="cal-feed"><b>Show this calendar in Apple Calendar</b>
    <p>Subscribe once. New items appear in Apple Calendar on your Mac and iPhone within about 15 minutes. It is one-way: add and edit items here.</p>
    ${u?`<div class="cal-feed-row"><a class="solid-btn" href="${esc(u)}">Open in Calendar</a><button class="pill-btn" data-calact="feedCopy">Copy link</button><button class="pill-btn" data-calact="feedReset">New link</button><button class="icon-btn" data-calact="feedClose" aria-label="Close">✕</button></div>
    <input class="cal-feed-url" readonly value="${esc(u)}" aria-label="Calendar feed link">
    <p class="cal-feed-warn">Keep this link private: anyone who has it can see your calendar. “New link” turns off the old one.</p>`:`<p>Loading…</p>`}</div>`}
const byTime=(a,b)=>(a.time||"99").localeCompare(b.time||"99");
function dayItems(k){return ((S.cal[k]&&S.cal[k].items)||[]).concat(typeof projItems==="function"?projItems(k):[]).sort(byTime)}
function calDay(k,create){if(!S.cal[k]&&create)S.cal[k]={items:[],note:""};return S.cal[k]}
const evHTML=it=>`<span class="ev ${it.d?"done":""}" style="--hl:var(--hl-${catOf(it.cat)[2]})">${it.time?`<b>${nice(toMin(it.time))}</b> `:""}${esc(it.t)}</span>`;
function calendarHTML(){
  const now=new Date(),today=dkey(now);
  if(!calView)calView={y:now.getFullYear(),m:now.getMonth()};
  if(!calSel)calSel=today;
  const first=new Date(calView.y,calView.m,1),days=new Date(calView.y,calView.m+1,0).getDate();
  const weeks=Math.ceil((first.getDay()+days)/7),start=new Date(calView.y,calView.m,1-first.getDay());
  let cells="";
  for(let i=0;i<weeks*7;i++){
    const d=new Date(start.getFullYear(),start.getMonth(),start.getDate()+i),k=dkey(d),cd=S.cal[k],its=dayItems(k);
    cells+=`<button type="button" class="cal-d ${d.getMonth()!==calView.m?"out":""} ${k===today?"today":""} ${k===calSel?"sel":""}" data-calact="sel" data-k="${k}" aria-label="${d.toDateString()}${its.length?", "+its.length+" items":""}">
      <span class="n">${d.getDate()}</span>${its.slice(0,3).map(evHTML).join("")}${its.length>3?`<span class="more">+${its.length-3} more</span>`:""}${cd&&cd.note?`<span class="nt">✎ note</span>`:""}</button>`;
  }
  const up=[];for(let i=0;i<7;i++){const d=new Date(now.getFullYear(),now.getMonth(),now.getDate()+i);dayItems(dkey(d)).filter(it=>!it.d).forEach(it=>up.push([d,it]))}
  const sd=new Date(calSel+"T12:00"),cd=S.cal[calSel]||{items:[],note:""};
  return `<section><div class="sec-head"><h2>Calendar</h2><span class="meta">Tap a day to add appointments and reminders</span></div>
  <div class="cal-wrap"><div class="sheet">
    <div class="cal-head"><h3>${first.toLocaleDateString(undefined,{month:"long",year:"numeric"})}</h3>
      <button class="icon-btn" data-calact="nav" data-d="-1" aria-label="Previous month">‹</button>
      <button class="pill-btn" data-calact="today">Today</button>
      <button class="icon-btn" data-calact="nav" data-d="1" aria-label="Next month">›</button></div>
    ${feedHTML()}
    <div class="cal-legend">${CATS.map(c=>`<span style="--hl:var(--hl-${c[2]})">${c[1]}</span>`).join("")}</div>
    <div class="cal-grid">${["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(x=>`<span class="cal-dow">${x}</span>`).join("")}${cells}</div>
    <div class="cal-up"><span class="label">Next 7 days</span>${up.length?up.map(([d,it])=>`<div class="cal-up-row" style="--hl:var(--hl-${catOf(it.cat)[2]})"><span class="dot"></span><span class="tm">${d.toLocaleDateString(undefined,{weekday:"short",day:"numeric"})}${it.time?" · "+nice(toMin(it.time)):""}</span><span>${esc(it.t)}</span></div>`).join(""):`<p class="cal-empty">Nothing scheduled this week.</p>`}</div>
  </div>
  <div class="sheet cal-panel"><span class="label">${sd.toLocaleDateString(undefined,{weekday:"long",month:"long",day:"numeric"})}</span>
    <ul class="cal-items">${dayItems(calSel).map(it=>`<li class="${it.d?"done":""}" style="--hl:var(--hl-${catOf(it.cat)[2]})">${it.src?`<span class="ct">${it.d?"✓":"⏰"}</span>`:`<input type="checkbox" data-caldone="${it.id}" ${it.d?"checked":""} aria-label="Done: ${esc(it.t)}">`}<span class="tm">${it.time?nice(toMin(it.time)):"All day"}</span><span class="tx">${esc(it.t)}</span><span class="ct">${catOf(it.cat)[1]}</span>${it.src?`<a class="ct" href="${it.src}">Open ↗</a>`:`<button class="icon-btn danger" data-calact="del" data-id="${it.id}" aria-label="Delete ${esc(it.t)}">✕</button>`}</li>`).join("")||`<li class="cal-empty">Nothing yet. Add your first one below.</li>`}</ul>
    <form class="cal-add" id="calAdd">
      <input id="calText" placeholder="Appointment, reminder, bill…" autocomplete="off" aria-label="What">
      <input type="time" id="calTime" aria-label="Time (optional)">
      <select id="calCat" aria-label="Type">${CATS.filter(c=>c[0]!=="project").map(c=>`<option value="${c[0]}" ${c[0]===calLastCat?"selected":""}>${c[1]}</option>`).join("")}</select>
      <button class="solid-btn" type="submit">Add</button></form>
    <label class="cal-nl"><b>Notes for this day</b><textarea class="cal-note" id="calnote" data-calnote="1" placeholder="Reminders, what to bring, addresses…">${esc(cd.note||"")}</textarea></label>
  </div></div></section>`;
}
app.addEventListener("submit",e=>{
  if(e.target.id!=="calAdd"||!S)return;e.preventDefault();
  const t=$("#calText").value.trim();if(!t)return;
  calLastCat=$("#calCat").value;
  calDay(calSel,true).items.push({id:uid(),t,time:$("#calTime").value||"",cat:calLastCat});save();render("calText");
});
app.addEventListener("input",e=>{if(!e.target.dataset||!e.target.dataset.calnote||!S)return;calDay(calSel,true).note=e.target.value;save()});
app.addEventListener("change",e=>{const id=e.target.dataset&&e.target.dataset.caldone;if(!id||!S)return;const it=((calDay(calSel)||{}).items||[]).find(x=>x.id===id);if(it){it.d=e.target.checked;save();render()}});
app.addEventListener("click",e=>{
  const b=e.target.closest("[data-calact]");if(!b||!S)return;const a=b.dataset.calact;
  if(a==="sel"){calSel=b.dataset.k;const d=new Date(calSel+"T12:00");calView={y:d.getFullYear(),m:d.getMonth()};render()}
  else if(a==="nav"){const n=new Date(calView.y,calView.m+(+b.dataset.d),1);calView={y:n.getFullYear(),m:n.getMonth()};render()}
  else if(a==="today"){calView=null;calSel=null;render()}
  else if(a==="feed"||a==="feedReset"){if(a==="feedReset"&&!confirm("Make a new link? Apple Calendar will stop updating until you subscribe with the new one."))return;calFeedOpen=true;render();
    fetch("/api/calfeed",{method:a==="feedReset"?"POST":"GET",credentials:"same-origin"}).then(r=>r.json()).then(d=>{calFeed=d.path;render()}).catch(()=>{calFeedOpen=false;render();alert("Couldn’t load the calendar link.")})}
  else if(a==="feedClose"){calFeedOpen=false;render()}
  else if(a==="feedCopy"){const u="webcal://"+location.host+calFeed;navigator.clipboard.writeText(u).then(()=>{b.textContent="Copied"},()=>{const i=$(".cal-feed-url");i.select()})}
  else if(a==="del"){const cd=calDay(calSel);if(cd){cd.items=cd.items.filter(x=>x.id!==b.dataset.id);save();render()}}
});
