// Builds site/courtney/index.html from the shared site, personalized for Courtney.
const fs = require("fs");
const SITE = "/Users/brandonrose/life-planner/site";
let s = fs.readFileSync(SITE + "/index.html", "utf8");
const rep = (a, b, all) => {
  if (!s.includes(a)) throw new Error("missing: " + a.slice(0, 60));
  s = all ? s.split(a).join(b) : s.replace(a, b);
};

// --- names, paths, storage keys (separate from the main planner on the same site)
rep("<title>Life Planner</title>", "<title>Courtney’s Planner</title>");
rep('<meta property="og:title" content="Life Planner">', '<meta property="og:title" content="Courtney’s Planner">');
rep('<meta property="og:description" content="Made for you, with love — Brandon Rose">', '<meta property="og:description" content="Made for Courtney, with love — Brandon">');
rep('<meta property="og:image" content="demo-poster.jpg">', '<meta property="og:image" content="/demo-poster.jpg">');
rep("<h1>Life Planner</h1>", "<h1>Courtney’s Planner</h1>");
rep('poster="demo-poster.jpg" src="demo.mp4"', 'poster="/demo-poster.jpg" src="/demo.mp4"');
rep('href="ai-gifts.html"', 'href="/ai-gifts.html"', true);
rep('const LS="life-planner-shared-v1";', 'const LS="courtney-planner-v1";');
rep('indexedDB.open("life-planner-photos",1)', 'indexedDB.open("courtney-planner-photos",1)');
// Default to the light blush look unless she picks dark.
rep('if(t)document.documentElement.dataset.theme=t}catch(e){}', 'document.documentElement.dataset.theme=t||"light"}catch(e){}');

// --- her palette: blush rose + lavender, like her GoodNotes planners
rep('<style id="photoTheme"></style>', `<style>
/* Courtney: blush rose + lavender */
:root{--bg:#151013;--surface:#1d1619;--line:#33272c;--rule:#2b2126;--line-soft:#261d21;--gold:#e3a3b5;--gold-soft:rgba(227,163,181,.14);--sky-mid:#4a2a36;--sun:#e9a0b0;--hl-purple:#b38be8}
:root[data-theme="light"]{--bg:#f6eef0;--surface:#fffafb;--line:#ead9de;--rule:#efe1e5;--line-soft:#f2e6e9;--fg:#2a1f24;--muted:#7a6670;--faint:#b49ea8;--gold:#b0607c;--gold-soft:rgba(176,96,124,.12);--sky-top:#3b2a3e;--sky-mid:#b77b8e;--sun:#f6c6c8;--hill:#2a1f2b;--hl-purple:#a77be6}
@media (prefers-color-scheme: light){:root:not([data-theme="dark"]){--bg:#f6eef0;--surface:#fffafb;--line:#ead9de;--rule:#efe1e5;--line-soft:#f2e6e9;--fg:#2a1f24;--muted:#7a6670;--faint:#b49ea8;--gold:#b0607c;--gold-soft:rgba(176,96,124,.12);--sky-top:#3b2a3e;--sky-mid:#b77b8e;--sun:#f6c6c8;--hill:#2a1f2b;--hl-purple:#a77be6}}
.sheet[data-color="purple"]{--hl:var(--hl-purple)}
.purpose{margin:14px 0 0;font:italic 400 19px/1.35 var(--display);color:var(--muted)}
.purpose b{font-weight:500;color:var(--gold)}
.qref{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:14px;align-items:start}
.qcard{background:var(--surface);border:1px solid var(--line-soft);border-radius:10px;overflow:hidden;--hl:var(--hl-pink)}
.qcard summary{list-style:none;cursor:pointer;display:flex;align-items:center;gap:10px;padding:13px 16px;font:500 21px/1.15 var(--display)}
.qcard summary::-webkit-details-marker{display:none}
.qcard summary::before{content:"";width:10px;height:10px;border-radius:50%;background:var(--hl);flex:none}
.qcard summary::after{content:"⌄";margin-left:auto;color:var(--faint);font:14px var(--body);transition:transform .2s}
.qcard[open] summary::after{transform:rotate(180deg)}
.qcard .qb{padding:2px 16px 14px;font-size:13.5px;color:var(--fg);border-top:1px solid var(--rule)}
.qcard table{min-width:0;width:100%;font-size:13px}
.qcard td{text-align:left;padding:5px 4px;vertical-align:top}
.qcard td:first-child{color:var(--muted);width:46%}
.qcard ul{margin:8px 0 0;padding-left:18px}
.qcard li{margin:3px 0}
.qcard .tip{margin:10px 0 0;font-size:12px;color:var(--muted);font-style:italic}
.qref-note{font-size:12px;color:var(--faint);margin-top:12px}
</style>
<style id="photoTheme"></style>`);
rep("const COLORS=[\"orange\",\"green\",\"pink\",\"yellow\",\"blue\"];", "const COLORS=[\"pink\",\"purple\",\"orange\",\"green\",\"yellow\",\"blue\"];");

// --- her lists and habits
rep(`    lists:[
      {id:"amazon",name:"Amazon",color:"orange",shop:true,items:[]},
      {id:"todo",name:"To-Do List",color:"green",items:[]},
      {id:"important",name:"Important",color:"pink",star:true,items:[]}],
    habits:[], goals:[]};`, `    lists:[
      {id:"todo",name:"To-Do",color:"green",items:[]},
      {id:"exams",name:"Exams & Due Dates",color:"pink",star:true,items:[]},
      {id:"clinical",name:"Clinical Prep",color:"orange",items:[]},
      {id:"amazon",name:"Amazon",color:"purple",shop:true,items:[]}],
    habits:[
      {id:"h1",name:"Review flashcards",weeks:{}},
      {id:"h2",name:"Drink water",weeks:{}},
      {id:"h3",name:"8 hours of sleep",weeks:{}},
      {id:"h4",name:"Move my body",weeks:{}}],
    goals:[], linksV2:true};`);
rep("if(!d.linksV2){", "if(false&&!d.linksV2){");

// --- her quick links
rep(`const DEFAULT_LINKS=[
  {id:"mail",label:"E-mail",url:"https://mail.google.com/mail/u/0/#inbox",icon:"mail"},
  {id:"cal",label:"Calendar",url:"https://calendar.google.com",icon:"calendar"},
  {id:"cl",label:"Claude",url:"https://claude.ai",icon:"spark"},
  {id:"az",label:"Amazon",url:"https://www.amazon.com/gp/css/homepage.html",icon:"cart"},
  {id:"sp",label:"Spotify",url:"https://open.spotify.com",icon:"spotify"},
  {id:"yt",label:"YouTube",url:"https://www.youtube.com/feed/you",icon:"youtube"}];`,
`const DEFAULT_LINKS=[
  {id:"bb",label:"Blackboard",url:"https://southplainscollege.blackboard.com",icon:"bb"},
  {id:"gz",label:"Gizmo flashcards",url:"https://gizmo.ai",icon:"cards"},
  {id:"gn",label:"GoodNotes",url:"https://web.goodnotes.com",icon:"pencil"},
  {id:"cl",label:"Claude",url:"https://claude.ai",icon:"spark"},
  {id:"yt",label:"YouTube",url:"https://www.youtube.com",icon:"youtube"},
  {id:"pin",label:"Pinterest",url:"https://www.pinterest.com",icon:"pin"},
  {id:"az",label:"Amazon",url:"https://www.amazon.com/gp/css/homepage.html",icon:"cart"}];`);
rep("const ICONS={", `const ICONS={
  bb:\`<svg viewBox="0 0 24 24"><text x="12" y="16.5" text-anchor="middle" font-family="Georgia,serif" font-style="italic" font-weight="700" font-size="13" fill="currentColor">Bb</text></svg>\`,
  cards:\`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="7" y="3" width="13" height="16" rx="2"/><path d="M4 7v12a2 2 0 0 0 2 2h10"/><path d="M11 9h5M11 13h3"/></svg>\`,
  pencil:\`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z"/><path d="M14.5 5.5l3 3"/></svg>\`,
  pin:\`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9.5"/><path d="M11 21l1.6-7"/><path d="M12.6 14c3 .4 5-1.6 5-4.2A5.4 5.4 0 0 0 12 5c-3.3 0-5.6 2.3-5.6 5 0 1.4.6 2.4 1.4 2.8"/></svg>\`,
  heart:\`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.4 4.3 4.3 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10Z"/></svg>\`,`);
rep("const BRAND={", 'const BRAND={bb:["#1f5a49","#fff"],cards:["#7b4ef0","#fff"],pencil:["#2f80ed","#fff"],pin:["#e60023","#fff"],heart:["#e2577f","#fff"],');
rep("const ICON_NAMES={", 'const ICON_NAMES={bb:"Blackboard",cards:"Flashcards",pencil:"Pencil",pin:"Pinterest",heart:"Heart",');

// --- header quote from her home screen
rep(`    <input id="intention" placeholder="What would make today well spent?" autocomplete="off">
  </div>`, `    <input id="intention" placeholder="What would make today well spent?" autocomplete="off">
  </div>
  <p class="purpose">I’m not just studying for exams. I’m preparing for <b>a life of purpose.</b> Keep going, your future is worth it.</p>`);

// --- focus: a nursing quote of the day instead of the "one thing" box
rep(`    <div class="one">
      <label class="eyebrow" for="oneThing">The one thing that brings in income</label>
      <input id="oneThing" value="\${esc(S.oneThing)}" placeholder="Name the one income project you’re finishing" autocomplete="off">
      <div class="hint">Every block today should move this forward. Everything else waits on the lists.</div>
    </div>`, `    <div class="one nq">
      <span class="eyebrow">Today’s reminder</span>
      <blockquote>“\${NURSE_Q[dayOfYear()%NURSE_Q.length][0]}”</blockquote>
      <div class="hint">— \${NURSE_Q[dayOfYear()%NURSE_Q.length][1]}</div>
    </div>`);
rep('<div class="big">${S.oneThing?esc(S.oneThing):"Pick one thing."}</div>', '<div class="big">Pick one thing.</div>');
rep("const COLORS=", `const NURSE_Q=[
  ["I attribute my success to this: I never gave or took any excuse.","Florence Nightingale"],
  ["Let us never consider ourselves finished nurses. We must be learning all of our lives.","Florence Nightingale"],
  ["Constant attention by a good nurse may be just as important as a major operation by a surgeon.","Dag Hammarskjöld"],
  ["Save one life, you’re a hero. Save a hundred lives, you’re a nurse.","Unknown"],
  ["Nurses are the heart of healthcare.","Donna Wilk Cardillo"],
  ["I’m not just studying for exams. I’m preparing for a life of purpose.","Courtney’s home screen"],
  ["Keep going. Your future patients are already counting on you.","Brandon"]];
const dayOfYear=()=>{const d=new Date();return Math.floor((d-new Date(d.getFullYear(),0,0))/864e5)};
const COLORS=`);
rep("</style>\n<style id=\"photoTheme\"></style>", `.nq blockquote{margin:6px 0 0;font:italic 500 clamp(24px,3.2vw,32px)/1.25 var(--display);color:var(--fg);text-wrap:balance}
</style>
<style id="photoTheme"></style>`);


// --- Quick Reference section (what she circled), placed after Today
const Q = (title, color, body) => `<details class="qcard" style="--hl:var(--hl-${color})"><summary>${title}</summary><div class="qb">${body}</div></details>`;
const G = (h, rows) => `<p class="qh">${h}</p>` + T(rows);
const T = rows =>`<table>${rows.map(r => `<tr><td>${r[0]}</td><td>${r[1]}</td></tr>`).join("")}</table>`;
const cards = [
  Q("ABG Interpretation", "pink", T([["pH", "7.35–7.45"], ["PaCO₂", "35–45 mmHg (acid)"], ["HCO₃⁻", "22–26 mEq/L (base)"], ["PaO₂", "80–100 mmHg"]]) +
    `<ul><li><b>ROME:</b> Respiratory Opposite (pH and CO₂ move in opposite directions), Metabolic Equal (pH and HCO₃⁻ move together).</li><li>pH still abnormal + both values off = <b>partly compensated</b>. pH back in range = <b>fully compensated</b>.</li></ul>`),
  // Her own Lab Values sheet, as she has it in GoodNotes
  Q("Lab Values", "purple",
    G("CBC", [["WBC", "4.5–11.0 K/µL"], ["RBC", "4.2–5.4 M/µL"], ["Hgb F / M", "12–16 / 14–18 g/dL"], ["Hct F / M", "36–46 / 41–53%"], ["Platelets", "150–400 K/µL"], ["MCV", "80–100 fL"]]) +
    G("BMP", [["Sodium", "135–145"], ["Potassium", "3.5–5.0"], ["Chloride", "98–106"], ["CO₂", "23–29"], ["BUN", "7–20 mg/dL"], ["Creatinine", "0.6–1.2 mg/dL"], ["Glucose fast.", "70–100 mg/dL"], ["Calcium", "8.5–10.5 mg/dL"], ["Magnesium", "1.7–2.2 mg/dL"], ["Phosphorus", "2.5–4.5 mg/dL"]]) +
    G("Coags", [["PT", "11–13.5 sec"], ["INR", "0.9–1.1 (2–3 tx)"], ["aPTT", "25–35 sec"], ["Fibrinogen", "200–400 mg/dL"], ["D-dimer", "&lt; 500 ng/mL"]]) +
    G("Cardiac", [["Troponin", "&lt; 0.04 ng/mL"], ["BNP", "&lt; 100 pg/mL"], ["CK-MB", "0–5 ng/mL"]]) +
    G("Lipids", [["Total chol.", "&lt; 200 mg/dL"], ["LDL", "&lt; 100 mg/dL"], ["HDL M / F", "&gt;40 / &gt;50 mg/dL"], ["Triglycerides", "&lt; 150 mg/dL"]]) +
    G("Thyroid", [["TSH", "0.4–4.0 µIU/mL"], ["Free T4", "0.8–1.8 ng/dL"]]) +
    G("Liver (LFT)", [["ALT", "7–56 U/L"], ["AST", "10–40 U/L"], ["ALP", "44–147 U/L"], ["Bilirubin tot.", "0.1–1.2 mg/dL"], ["Albumin", "3.5–5.0 g/dL"]]) +
    G("Infection", [["Lactate", "&lt; 2.0 mmol/L"], ["Procalcitonin", "&lt; 0.5 ng/mL"], ["CRP", "&lt; 3.0 mg/L"], ["ESR", "0–20 mm/hr"]]) +
    G("Urinalysis", [["pH", "4.5–8.0"], ["Spec. gravity", "1.005–1.030"], ["Protein / glucose", "negative"], ["Ketones / nitrites", "negative"]]) +
    `<p class="tip">Know your critical values: K⁺ &lt; 2.8 or &gt; 6.0 · Na⁺ &lt; 120 or &gt; 160 · Glucose &lt; 40 or &gt; 400 · Plt &lt; 20K</p>`),
  Q("Vitals & Blood Pressure", "orange", T([["Heart rate", "60–100 /min"], ["Respirations", "12–20 /min"], ["Temperature", "97.8–99.1 °F (36.5–37.3 °C)"], ["SpO₂", "95–100%"], ["BP normal", "&lt;120 / &lt;80"], ["Elevated", "120–129 / &lt;80"], ["Stage 1", "130–139 or 80–89"], ["Stage 2", "≥140 or ≥90"], ["Crisis", "&gt;180 and/or &gt;120"]])),
  Q("Pain Assessment", "green", `<ul><li><b>PQRST:</b> Provokes, Quality, Region/Radiation, Severity (0–10), Timing.</li><li><b>Scales:</b> numeric 0–10 (adults), Wong-Baker FACES (kids about 3+), FLACC (infants, young or nonverbal kids), CPOT (ICU, can’t self-report).</li><li><b>Reassess</b> about 30 min after IV and 60 min after PO pain meds.</li></ul>`),
  Q("IV Therapy Basics", "blue", G("Tonicity · where the water goes", [["Hypertonic · water LEAVES cells, cells SHRINK", "3% NaCl, D5NS, D5LR, D10W"], ["Isotonic · no net shift, cells STAY THE SAME", "0.9% NaCl, LR, D5W"], ["Hypotonic · water ENTERS cells, cells SWELL", "0.45% NaCl. Avoid with ↑ICP."]]) +
    G("Gauge sizes · bigger number, smaller needle", [["14–16 G", "Trauma, rapid infusions"], ["18 G", "Surgery, blood products"], ["20 G", "Routine IV meds & fluids, most common adult"], ["22 G", "Elderly, small or fragile veins"], ["24 G", "Neonates, peds"]]) +
    G("Crystalloids vs colloids", [["Crystalloids (small)", "NS, LR, D5W. Cross membranes freely."], ["Colloids (large)", "Albumin, hetastarch. Stay intravascular, expand volume."]]) +
    `<ul><li><b>Infiltration:</b> cool, pale, swollen. Stop, remove, elevate.</li><li><b>Phlebitis:</b> warm, red, tender cord. Stop, remove, warm compress.</li></ul>`),
  Q("Blood Transfusions", "pink", `<ul><li>Two nurses verify at the bedside, with two patient identifiers.</li><li>18–20 G IV. Y-tubing with filter, primed with <b>0.9% NaCl only</b>.</li><li>Baseline vitals. Stay with the patient the <b>first 15 minutes</b>. Most reactions happen then.</li><li>Finish each unit within <b>4 hours</b>.</li><li><b>Reaction:</b> stop the transfusion, keep the vein open with NS on new tubing, take vitals, notify the provider and blood bank, and send back the bag and tubing.</li></ul>`),
  Q("Med Suffixes", "purple", T([["-olol", "Beta blockers"], ["-pril", "ACE inhibitors (dry cough)"], ["-sartan", "ARBs"], ["-dipine", "Calcium channel blockers"], ["-statin", "Cholesterol (statins)"], ["-prazole", "Proton pump inhibitors"], ["-tidine", "H₂ blockers"], ["-parin", "Anticoagulants"], ["-cillin", "Penicillins"], ["-floxacin", "Fluoroquinolones"], ["-mycin", "Aminoglycosides / macrolides"], ["-azole", "Antifungals (most)"], ["-pam / -lam", "Benzodiazepines"], ["-sone / -lone", "Corticosteroids"]])),
  Q("Cranial Nerves", "orange", T([["I Olfactory · S", "Smell"], ["II Optic · S", "Vision"], ["III Oculomotor · M", "Pupils, most eye movement"], ["IV Trochlear · M", "Eye down and in"], ["V Trigeminal · B", "Face sensation, chewing"], ["VI Abducens · M", "Eye outward"], ["VII Facial · B", "Facial expression, taste front ⅔"], ["VIII Vestibulocochlear · S", "Hearing, balance"], ["IX Glossopharyngeal · B", "Swallow, gag, taste back ⅓"], ["X Vagus · B", "Gag, swallow, heart and gut"], ["XI Accessory · M", "Shrug, turn head"], ["XII Hypoglossal · M", "Tongue"]]) +
    `<p class="tip">S sensory, M motor, B both: “Some Say Marry Money, But My Brother Says Big Brains Matter More.”</p>`),
  Q("Isolation & PPE", "green", T([["Contact · gown + gloves", "MRSA, VRE, C. diff (wash with soap and water), scabies, RSV"], ["Droplet · surgical mask", "Influenza, pertussis, mumps, rubella, meningococcal"], ["Airborne · N95 + negative-pressure room", "TB, measles, chickenpox, disseminated shingles"]]) +
    `<ul><li><b>Put on:</b> gown, mask or N95, goggles, gloves.</li><li><b>Take off:</b> gloves, goggles, gown, mask (N95 outside the room), then hand hygiene.</li></ul>`),
  Q("Code Blue Basics", "blue", `<ul><li>Check responsiveness, call the code, check pulse and breathing in 10 seconds or less.</li><li>Adult CPR: <b>30:2</b>, 100–120 compressions/min, 2–2.4 in deep, full recoil, minimal pauses.</li><li>Defibrillator as soon as it arrives. Shockable rhythms: <b>VF and pulseless VT</b>.</li><li>Epinephrine 1 mg every 3–5 min. For shockable rhythms, amiodarone 300 mg, then 150 mg.</li><li>Switch compressors every 2 minutes.</li></ul>`),
];
rep(`  <section>
    <div class="sec-head"><h2>Habits</h2>`, `  <section id="qref">
    <div class="sec-head"><h2>Quick Reference</h2><span class="meta">Tap a card to open it</span></div>
    <div class="qref">${cards.join("\n")}</div>
    <p class="qref-note">Quick study notes. Ranges vary a little by textbook and lab, so always follow your program’s references, facility policy and the provider’s orders.</p>
  </section>

  <section>
    <div class="sec-head"><h2>Habits</h2>`);

// --- footer
rep('<span class="q">“Made for you, with love”</span>', '<span class="q">“Made for you, Courtney, with love”</span>');
rep("Hi%20Brandon!%20I%20just%20opened%20the%20Life%20Planner%20you%20sent%20me.", "Hi%20Brandon!%20It%E2%80%99s%20Courtney.%20I%E2%80%99m%20using%20my%20planner.");
rep("mailto:ai@brandon-rose.com?subject=Life%20Planner", "mailto:ai@brandon-rose.com?subject=Courtney%E2%80%99s%20Planner");

// --- Exams & Due Dates items get a date box; typed dates are read automatically
rep('autocomplete="off" aria-label="Item">', 'autocomplete="off" aria-label="Item">\n      ${list.id==="exams"?`<input type="date" class="idate" id="id-${it.id}" data-cdate="1" data-l="exams" data-i="${it.id}" value="${it.date||""}" aria-label="Date for ${esc(it.t)}" title="Shows on your calendar">`:""}');
rep('placeholder="${k===0&&!list.items.length?"Write something…":""}"', 'placeholder="${k===0&&!list.items.length?(list.id==="exams"?"e.g. Exam 4 Nov 20 · Care plan due 12/3":"Write something…"):""}"');
rep('const l=L(inp.dataset.l); l.items.push({id:uid(),t:v,d:false});', 'const l=L(inp.dataset.l); const nit={id:uid(),t:v,d:false}; if(l.id==="exams"){const pd=parseDue(v);if(pd)nit.date=pd} l.items.push(nit);');
// --- her GoodNotes index: section bar, Clinical tools, Exam Prep log
rep("d.theme=Object.assign({photos:[],cover:0,rotate:false,off:false},d.theme||{});",
  "d.theme=Object.assign({photos:[],cover:0,rotate:false,off:false},d.theme||{});\n  d.cn=Object.assign({map:{},sbar:{},vitals:[],drugs:[],qlog:[],cal:{}},d.cn||{});");
rep("function render(focusId){", fs.readFileSync(__dirname + "/courtney-extras.js", "utf8") + "\nfunction render(focusId){");
rep('app.innerHTML=`\n  <section>\n    <div class="sec-head"><h2>Focus</h2>', 'app.innerHTML=`${indexHTML()}\n  <section>\n    <div class="sec-head"><h2 id="ix-focus">Focus</h2>');
rep("<h2>Lists</h2>", '<h2 id="ix-lists">Lists</h2>');
rep("<h2>Habits</h2>", '<h2 id="ix-habits">Habits</h2>');
rep("<h2>Quick Reference</h2>", '<h2 id="ix-qref">Quick Reference</h2>');
rep('  <section>\n    <div class="sec-head"><h2 id="ix-lists">', '  ${calendarHTML()}\n  <section>\n    <div class="sec-head"><h2 id="ix-lists">');
rep('app.addEventListener("submit",e=>{\n  e.preventDefault(); if(!S) return;', 'app.addEventListener("submit",e=>{\n  if(e.target.id!=="habitForm")return;\n  e.preventDefault(); if(!S) return;');
rep('<style id="photoTheme"></style>', `<style>
.cal-wrap{display:grid;grid-template-columns:minmax(0,1.7fr) minmax(0,1fr);gap:18px;align-items:start}
@media (max-width:900px){.cal-wrap{grid-template-columns:1fr}}
.cal-head{display:flex;align-items:center;gap:8px;margin-bottom:10px}
.cal-head h3{font:500 26px var(--display);margin:0;flex:1}
.cal-legend{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px}
.cal-legend span{font-size:11px;padding:3px 8px;border-radius:4px;background:color-mix(in srgb,var(--hl) calc(var(--hl-alpha)*100%),transparent)}
.cal-grid{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));border-top:1px solid var(--line);border-left:1px solid var(--line)}
.cal-dow{font:600 10.5px var(--body);letter-spacing:.12em;text-transform:uppercase;color:var(--muted);padding:6px 2px;border-right:1px solid var(--line);border-bottom:1px solid var(--line);text-align:center}
.cal-d{all:unset;box-sizing:border-box;min-height:100px;min-width:0;padding:5px;border-right:1px solid var(--line);border-bottom:1px solid var(--line);display:flex;flex-direction:column;gap:2px;cursor:pointer;overflow:hidden;background:var(--surface)}
.cal-d:hover{background:var(--gold-soft)}
.cal-d:focus-visible{outline:2px solid var(--gold);outline-offset:-2px}
.cal-d.out{opacity:.42}
.cal-d .n{font:500 15px/1 var(--display);width:24px;height:24px;display:grid;place-items:center;border-radius:999px}
.cal-d.today .n{background:var(--gold);color:var(--bg)}
.cal-d.sel{box-shadow:inset 0 0 0 2px var(--gold)}
.cal-d .ev{display:block;font-size:11px;line-height:1.3;padding:1px 4px;border-radius:3px;background:color-mix(in srgb,var(--hl) calc(var(--hl-alpha)*100%),transparent);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.cal-d .ev b{font-weight:600}
.cal-d .more,.cal-d .nt{font-size:10.5px;color:var(--muted)}
@media (max-width:600px){.cal-d{min-height:58px;padding:3px}.cal-d .ev{font-size:0;height:5px;padding:0;margin-top:1px}.cal-d .more,.cal-d .nt{display:none}}
.cal-up{margin-top:14px}
.cal-up-row{display:flex;gap:10px;align-items:center;min-height:32px;border-bottom:1px solid var(--rule);font-size:13.5px}
.cal-up-row .tm,.cal-items .tm{font:12px var(--mono);color:var(--muted);white-space:nowrap}
.cal-up-row .dot,.cal-items .dot{width:10px;height:10px;border-radius:3px;background:var(--hl);flex:none}
.cal-items{list-style:none;margin:8px 0;padding:0}
.cal-items li{display:flex;align-items:center;gap:8px;min-height:38px;border-bottom:1px solid var(--rule);font-size:14px}
.cal-items .tm{min-width:58px}
.cal-items .tx{flex:1;min-width:0;overflow-wrap:anywhere}
.cal-items .ct{font-size:11px;color:var(--faint)}
.cal-empty{color:var(--faint);font-size:13px}
.cal-add{display:flex;flex-wrap:wrap;gap:8px;margin:12px 0}
.cal-add input,.cal-add select{background:var(--surface);border:1px solid var(--line-soft);border-radius:6px;padding:7px 8px;color:var(--fg);font-size:13px}
.cal-add #calText{flex:1 1 100%;min-width:0}
.cal-note{min-height:120px}
.cal-d .ev.done,.cal-items li.done .tx{text-decoration:line-through;opacity:.6}
.cal-items .src{font-style:italic}
.ln .idate{flex:none;width:auto;max-width:132px;background:none;border:0;border-left:1px solid var(--rule);padding:0 0 0 8px;font:12px var(--mono);color:var(--muted)}
.ln .idate:invalid,.ln .idate[value=""]{color:var(--faint)}
</style>
<style id="photoTheme"></style>`);
rep('  <section id="qref">', "  ${clinicalHTML()}\n  ${examHTML()}\n  <section id=\"qref\">");
rep("</style>\n<style id=\"photoTheme\"></style>", `.ix{display:flex;flex-wrap:wrap;gap:8px;margin-top:22px}
.ix a{--hl:var(--hl-pink);text-decoration:none;color:var(--fg);font-size:11.5px;letter-spacing:.12em;text-transform:uppercase;padding:7px 14px;border-radius:6px;background:color-mix(in srgb,var(--hl) calc(var(--hl-alpha)*100%),transparent)}
.ix a:hover{background:color-mix(in srgb,var(--hl) 65%,transparent)}
h2[id^="ix-"]{scroll-margin-top:24px}
.qcard .qh{margin:12px 0 2px;font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--gold);font-weight:600}
.cn-grid{display:grid;grid-template-columns:minmax(0,1.3fr) minmax(0,1fr);gap:18px;align-items:start}
.cn-gap{margin-top:18px}
@media (max-width:860px){.cn-grid{grid-template-columns:1fr}}
.cm-top{display:flex;align-items:center;gap:10px;justify-content:space-between}
.cn-in{width:100%;min-width:0;background:none;border:0;border-bottom:1px solid var(--rule);padding:6px 2px;color:var(--fg);font-size:14px}
.cn-in::placeholder,.cn-ta::placeholder{color:var(--faint)}
.cm-topic{max-width:240px}
.cn-ta{display:block;width:100%;min-height:64px;resize:vertical;background:transparent;border:0;color:var(--fg);font-size:13.5px;padding:4px 0}
.cm{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-top:12px}
@media (max-width:520px){.cm{grid-template-columns:1fr 1fr}}
.cm-box{display:flex;flex-direction:column;border-radius:6px;padding:8px 10px;background:color-mix(in srgb,var(--hl) calc(var(--hl-alpha)*100%),transparent);min-height:110px}
.cm-box span,.cm-main span{font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:var(--muted)}
.cm-main{grid-column:1/-1;display:block;border:2px solid var(--hl-green);border-radius:999px;padding:10px 26px;text-align:center}
.cm-main .cn-ta{text-align:center;min-height:40px;font:500 20px/1.3 var(--display)}
.sb{display:block;border-bottom:1px solid var(--rule);padding:8px 0}
.sb b{display:block;font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:var(--gold);font-weight:600}
.cn-scroll{overflow-x:auto}
.cn-t{min-width:560px}
.cn-t th{text-align:left}
.cn-t td{padding:2px 4px}
.cn-t select{background:var(--surface);border:1px solid var(--line-soft);border-radius:6px;padding:4px;color:var(--fg)}
.drugs{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:18px;align-items:start}
.drug .drug-name{font:500 22px var(--display);border-bottom:1px solid var(--line);margin-top:6px}
</style>
<style id="photoTheme"></style>`);

fs.mkdirSync(SITE + "/courtney", { recursive: true });
fs.writeFileSync(SITE + "/courtney/index.html", s);
console.log("written", s.length);
