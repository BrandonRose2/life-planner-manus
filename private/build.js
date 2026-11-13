// Builds private/public/index.html from ../index.html (Brandon's planner).
// It swaps Claude's storage for this server: db -> /api/state, assets -> /api/photos.
// Run: node private/build.js   (then deploy private/ to Railway)
const fs = require("fs");
const path = require("path");
const SRC = path.join(__dirname, "..", "index.html");
let body = fs.readFileSync(SRC, "utf8");

const rep = (a, b) => { if (!body.includes(a)) throw new Error("missing: " + a.slice(0, 60)); body = body.replace(a, b); };
rep('<meta name="claude:viewport-fit-sides" content="cover">\n', "");
rep("<footer>Saved to your account. Only you can see this planner.</footer>",
  '<footer>Saved to your private server and synced to every device you sign in on. · <a href="/logout" style="color:inherit">Sign out</a></footer>');

const shim = `<script>
/* Storage bridge: the planner was written for Claude's db/assets; here they talk to this server. */
window.__plannerServer=true;
(function(){
  let ver=0;
  async function j(u,o){
    const r=await fetch(u,Object.assign({credentials:"same-origin"},o||{}));
    if(r.status===401){location.href="/login";throw new Error("signed out")}
    if(!r.ok)throw new Error("HTTP "+r.status);
    return r.json();
  }
  const db={doc:function(){return{
    get:async function(){const d=await j("/api/state");ver=d.version;return{exists:d.exists,data:function(){return d.data}}},
    set:async function(v){const d=await j("/api/state",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify(v)});ver=d.version}
  }}};
  const assets={
    upload:function(b){return j("/api/photos",{method:"POST",headers:{"Content-Type":b.type||"image/jpeg"},body:b})},
    delete:function(id){return j("/_blob/"+id,{method:"DELETE"})},
    list:async function(){return{assets:[],usage:{}}}
  };
  window.claude={use:async function(n){return n==="db"?db:n==="assets"?assets:null}};
  /* Edited on another device? Reload when you come back to this tab (unless you're typing). */
  document.addEventListener("visibilitychange",async function(){
    if(document.visibilityState!=="visible"||!ver)return;
    try{const d=await j("/api/version");const a=document.activeElement;
      if(d.version>ver&&!(a&&/INPUT|TEXTAREA|SELECT/.test(a.tagName)))location.reload()}catch(e){}
  });
})();
</script>`;

const html = `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="robots" content="noindex">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Ccircle cx='12' cy='12' r='12' fill='%23c9a96a'/%3E%3C/svg%3E">
<style>html,body{margin:0;padding:0}[hidden]{display:none!important}</style>
${shim}
</head><body>
${body}
</body></html>`;

fs.mkdirSync(path.join(__dirname, "public"), { recursive: true });
fs.writeFileSync(path.join(__dirname, "public", "index.html"), html);
console.log("built public/index.html", html.length);

// Project apps: projects/<slug>.template.html + <slug>.seed.json -> public/projects/<slug>.html
const PD = path.join(__dirname, "projects"), OUT = path.join(__dirname, "public", "projects");
fs.mkdirSync(OUT, { recursive: true });
for (const f of fs.readdirSync(PD).filter(f => f.endsWith(".template.html"))) {
  const slug = f.replace(".template.html", ""), seedFile = path.join(PD, slug + ".seed.json");
  let page = fs.readFileSync(path.join(PD, f), "utf8");
  const seed = fs.existsSync(seedFile) ? fs.readFileSync(seedFile, "utf8").trim() : "null";
  if (!page.includes("/*SEED*/null")) throw new Error("no seed marker in " + f);
  page = page.replace("/*SEED*/null", seed.replace(/</g, "\\u003c"));
  fs.writeFileSync(path.join(OUT, slug + ".html"), page);
  console.log("built public/projects/" + slug + ".html", page.length);
}

// Project apps a viewer may open: every project (same rule as VIEW_PROJECTS in server.js).
const VIEW_PROJECTS = fs.readdirSync(path.join(__dirname, "projects")).filter(f => f.endsWith(".template.html")).map(f => f.replace(".template.html", ""));
// Shared by the read-only planner and project pages: blocks every edit, allows looking around.
const VIEW_LOCK = `  /* Only looking around is allowed: month and week arrows, picking a day, and outside links. */
  const OK='[data-act="ovClose"],[data-act="ytSnd"],[data-act="ytPrev"],[data-act="ytNext"],[data-tab],[data-calact="nav"],[data-calact="sel"],[data-calact="today"],[data-act="wk"],[data-act="md"],[data-act="msall"]';
  document.addEventListener("click",function(e){
    const a=e.target.closest("a[href]");
    if(a){const h=a.getAttribute("href");if(/^https?:/i.test(h)||h==="/"||/^\\/projects\\/(${VIEW_PROJECTS.join("|")})\\/?$/.test(h))return;e.preventDefault();e.stopImmediatePropagation();return}
    const c=e.target.closest("button,label,[data-act],[data-calact],[data-projact],input,select,textarea");
    if(c&&!c.matches(OK)){e.preventDefault();e.stopImmediatePropagation()}
  },true);
  ["input","change","submit","keydown","paste","drop","dragover","dragenter"].forEach(function(t){
    document.addEventListener(t,function(e){if(t==="keydown"&&!e.target.matches("input,textarea,select"))return;e.preventDefault();e.stopImmediatePropagation()},true);
  });
  /* Text boxes can't wrap, so long text gets cut off on phones. Show each filled one as wrapping text instead. */
  const COPY=["fontFamily","fontSize","fontWeight","fontStyle","lineHeight","letterSpacing","textTransform","color","textDecorationLine","textDecorationColor","textDecorationThickness","paddingTop","paddingRight","paddingBottom","paddingLeft","textAlign"];
  function mirror(x){
    let m=x.nextElementSibling;if(!m||!m.classList.contains("ro-text")){m=document.createElement("div");m.className="ro-text";x.after(m)}
    const v=x.value||"";if(m.textContent!==v)m.textContent=v;
    if(v){const cs=getComputedStyle(x);COPY.forEach(function(k){if(m.style[k]!==cs[k])m.style[k]=cs[k]});const f=cs.flex;if(m.style.flex!==f)m.style.flex=f;if(m.style.flexBasis!==cs.flexBasis)m.style.flexBasis=cs.flexBasis;if(m.style.order!==cs.order)m.style.order=cs.order}
    if(x.classList.contains("ro-hide")!==!!v)x.classList.toggle("ro-hide",!!v);
    if(m.hidden!==!v)m.hidden=!v;
  }
  function lock(){document.querySelectorAll("input,textarea,select").forEach(function(x){
    if(!x.readOnly)x.readOnly=true;if((x.type==="checkbox"||x.tagName==="SELECT"||x.type==="time"||x.type==="file")&&!x.disabled)x.disabled=true;if(x.tabIndex!==-1)x.tabIndex=-1;
    if(x.tagName==="INPUT"&&(x.type==="text"||x.type==="search"||x.type==="url")&&x.id!=="calText")mirror(x);
    if(x.tagName==="TEXTAREA"&&x.offsetParent){x.style.height="auto";const h=x.scrollHeight+2;if(h>x.clientHeight)x.style.height=h+"px";else x.style.height=""}})}
  new MutationObserver(lock).observe(document.documentElement,{childList:true,subtree:true});
  addEventListener("resize",lock);
`;
// Read-only view for family: /view/<code> on the server. Same planner, nothing can be saved.
// The server refuses every write from a viewer; this page also hides the edit controls.
{
  let vb = body;
  const vrep = (a, b) => { if (!vb.includes(a)) throw new Error("view missing: " + a.slice(0, 60)); vb = vb.replace(a, () => b); };
  vrep('<footer>Saved to your private server and synced to every device you sign in on. · <a href="/logout" style="color:inherit">Sign out</a></footer>',
    "<footer>View only. This page shows Brandon’s planner as it is right now.</footer>");
  const vshim = `<script>
window.__plannerServer=true;window.__plannerView=true;
(function(){
  let ver=0;
  function gone(){document.body.innerHTML='<p style="font:18px system-ui;padding:40px;text-align:center">This link has expired. Ask Brandon for a new one.</p>';throw new Error("view link expired")}
  async function j(u){const r=await fetch(u,{credentials:"same-origin"});if(r.status===401||r.status===403)gone();if(!r.ok)throw new Error("HTTP "+r.status);return r.json()}
  const db={doc:function(){return{
    get:async function(){const d=await j("/api/state");ver=d.version;return{exists:d.exists,data:function(){return d.data}}},
    set:async function(){}
  }}};
  window.claude={use:async function(n){return n==="db"?db:null}};
  document.addEventListener("visibilitychange",async function(){
    if(document.visibilityState!=="visible"||!ver)return;
    try{const d=await j("/api/version");if(d.version>ver)location.reload()}catch(e){}
  });
  ${VIEW_LOCK}
})();
</script>
<style>
.view-bar{position:relative;z-index:6;box-sizing:border-box;height:calc(31px + env(safe-area-inset-top,0px));text-align:center;font:600 13px/1 system-ui;letter-spacing:.04em;padding:calc(9px + env(safe-area-inset-top,0px)) 12px 9px;background:#2b2622;color:#f3ead8;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.quick{top:calc(41px + env(safe-area-inset-top,0px))!important}
.ln{height:auto!important;min-height:36px}
#saveState,#bdBtn,#themeBtn,#adminBtn,.proj-edit,.cal-add,[data-calact^="feed"],.cal-feed,#backdrop,#admin,.icon-btn.danger,.block-acts,.sheet-foot .link-btn,.dropzone,[data-act="quick"],[data-act="bdoneNow"],[data-act="newList"],[data-act="newGoal"],[data-act="addBlock"],[data-act="copyY"],.swatch,.drop-overlay{display:none!important}
input,textarea,select{cursor:default!important}
.ro-hide{display:none!important}.ro-text{min-width:0;white-space:pre-wrap;overflow-wrap:anywhere;cursor:default}.ro-text[hidden]{display:none!important}
input::placeholder,textarea::placeholder{color:transparent!important}
</style>`;
  const vhtml = html.replace(shim, () => vshim).replace("<body>\n", () => '<body>\n<div class="view-bar">Brandon’s Life Planner · view only</div>\n').replace(body, () => vb);
  if (vhtml === html) throw new Error("view build failed");
  fs.writeFileSync(path.join(__dirname, "public", "view.html"), vhtml);
  console.log("built public/view.html", vhtml.length);
}

// Read-only project pages for viewers: projects/<slug>.html -> public/projects/<slug>.view.html
for (const slug of VIEW_PROJECTS) {
  let page = fs.readFileSync(path.join(OUT, slug + ".html"), "utf8");
  const lockTag = `<script>(function(){\n${VIEW_LOCK}})();</script>
<style>.save,[data-act="add"],[data-act="del"]{display:none!important}.ro-hide{display:none!important}.ro-text{min-width:0;white-space:pre-wrap;overflow-wrap:anywhere;cursor:default}.ro-text[hidden]{display:none!important}input,textarea,select{cursor:default!important}input::placeholder,textarea::placeholder{color:transparent!important}
.view-bar{text-align:center;font:600 13px/1 system-ui;letter-spacing:.04em;padding:9px 12px;background:#2b2622;color:#f3ead8}</style>`;
  if (!page.includes("<body>\n")) throw new Error("no body in " + slug);
  page = page.replace("</head>", () => lockTag + "\n</head>")
    .replace("<body>\n", () => '<body>\n<div class="view-bar">Brandon’s project · view only</div>\n')
    .replace('location.href="/login"', 'location.href="/"');
  fs.writeFileSync(path.join(OUT, slug + ".view.html"), page);
  console.log("built public/projects/" + slug + ".view.html", page.length);
}
