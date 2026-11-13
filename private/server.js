// Brandon's private Life Planner: one password, data kept on a Railway volume.
// No dependencies; Node 18+.
"use strict";
const http = require("http");
const fs = require("fs");
const fsp = fs.promises;
const path = require("path");
const crypto = require("crypto");

const PORT = +process.env.PORT || 8080;
const DATA = process.env.DATA_DIR || "/data";
const SETUP_CODE = process.env.SETUP_CODE || "";
const SECRET_FILE = path.join(DATA, "secret.key");
const AUTH_FILE = path.join(DATA, "auth.json");
const STATE_FILE = path.join(DATA, "state.json");
const PHOTOS = path.join(DATA, "photos");
const BACKUPS = path.join(DATA, "backups");
const FEED_FILE = path.join(DATA, "feed.key");
const PROJECTS = path.join(DATA, "projects"); // one JSON file per project app
const SLUG_RE = /^[a-z0-9-]{1,40}$/; // secret part of the calendar feed address
const SEED = path.join(__dirname, "seed");
const APP_HTML = fs.readFileSync(path.join(__dirname, "public", "index.html"));
const VIEW_HTML = fs.readFileSync(path.join(__dirname, "public", "view.html"));
// Read-only family link: /view/<VIEW_KEY>. Set VIEW_KEY in Railway; change it to turn the old link off.
const VIEW_KEY = (process.env.VIEW_KEY || "").trim();
const VIEW_DAYS = 30;
const SESSION_DAYS = 60;

// ---------- first boot: folders, signing key, seed data ----------
fs.mkdirSync(PHOTOS, { recursive: true });
fs.mkdirSync(BACKUPS, { recursive: true });
fs.mkdirSync(PROJECTS, { recursive: true });
if (!fs.existsSync(SECRET_FILE)) fs.writeFileSync(SECRET_FILE, crypto.randomBytes(32).toString("hex"), { mode: 0o600 });
const SECRET = fs.readFileSync(SECRET_FILE, "utf8").trim();
if (!fs.existsSync(STATE_FILE) && fs.existsSync(path.join(SEED, "state.json"))) {
  fs.copyFileSync(path.join(SEED, "state.json"), STATE_FILE);
  const sp = path.join(SEED, "photos");
  if (fs.existsSync(sp)) for (const f of fs.readdirSync(sp)) fs.copyFileSync(path.join(sp, f), path.join(PHOTOS, f));
  console.log("Seeded planner data from deploy");
}

// ---------- calendar feed (planner calendar -> Apple Calendar) ----------
// Calendar apps can't sign in, so the feed address holds a long random secret instead.
const newFeedKey = () => crypto.randomBytes(24).toString("base64url");
if (!fs.existsSync(FEED_FILE)) fs.writeFileSync(FEED_FILE, newFeedKey(), { mode: 0o600 });
let FEED_KEY = fs.readFileSync(FEED_FILE, "utf8").trim();
const CAL_CATS = { appt: "Appointment", work: "Work", personal: "Personal", health: "Health", bill: "Bill / due", remind: "Reminder" };
const icsText = v => String(v || "").replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
// Lines longer than 75 bytes are folded, as the calendar format requires.
function icsFold(line) {
  const out = []; let cur = "", len = 0;
  for (const ch of line) {
    const n = Buffer.byteLength(ch);
    if (len + n > (out.length ? 74 : 75)) { out.push(cur); cur = ""; len = 0; }
    cur += ch; len += n;
  }
  out.push(cur);
  return out.join("\r\n ");
}
// Old calendar copies of project deadlines; the project milestones now stand in for them.
const MS_REPLACED = it => it.mk === "thornless" && it.cat === "project";
function buildIcs(state, projects) {
  const cal = (state && state.cal) || {}, stamp = new Date().toISOString().replace(/[-:]/g, "").slice(0, 15) + "Z";
  const L = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Brandon Life Planner//EN", "CALSCALE:GREGORIAN", "METHOD:PUBLISH",
    "X-WR-CALNAME:Life Planner", "X-PUBLISHED-TTL:PT15M", "REFRESH-INTERVAL;VALUE=DURATION:PT15M"];
  for (const [day, d] of Object.entries(cal)) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || !d) continue;
    const ymd = day.replace(/-/g, "");
    const next = new Date(Date.UTC(+day.slice(0, 4), +day.slice(5, 7) - 1, +day.slice(8, 10) + 1)).toISOString().slice(0, 10).replace(/-/g, "");
    for (const it of d.items || []) {
      if (!it || !it.t || MS_REPLACED(it)) continue;
      L.push("BEGIN:VEVENT", "UID:" + String(it.id).replace(/[^\w-]/g, "") + "-" + ymd + "@planner.brandon-rose.com", "DTSTAMP:" + stamp,
        "SUMMARY:" + icsText((it.d ? "✓ " : "") + it.t), "CATEGORIES:" + icsText(CAL_CATS[it.cat] || "Appointment"));
      const tm = /^(\d{2}):(\d{2})$/.exec(it.time || "");
      if (tm) {
        // Floating local time: shows at the same clock time on every device.
        const end = (+tm[1] * 60 + +tm[2] + 60), eh = Math.min(23, Math.floor(end / 60)), em = end >= 1440 ? 59 : end % 60;
        L.push("DTSTART:" + ymd + "T" + tm[1] + tm[2] + "00", "DTEND:" + ymd + "T" + String(eh).padStart(2, "0") + String(em).padStart(2, "0") + "00");
      } else L.push("DTSTART;VALUE=DATE:" + ymd, "DTEND;VALUE=DATE:" + next, "TRANSP:TRANSPARENT");
      if (d.note) L.push("DESCRIPTION:" + icsText(d.note));
      if (it.cat === "remind" && !it.d) L.push("BEGIN:VALARM", "ACTION:DISPLAY", "DESCRIPTION:" + icsText(it.t), "TRIGGER:" + (tm ? "PT0M" : "PT9H"), "END:VALARM");
      L.push("END:VEVENT");
    }
  }
  // Project deadlines: 9am on the due day, alerts the evening before (6pm) and at 9am.
  for (const pj of projects || []) {
    const link = "https://planner.brandon-rose.com/projects/" + pj.slug;
    for (const m of pj.milestones || []) {
      const day = m.due.replace(/-/g, ""), title = pj.name + ": " + m.t;
      L.push("BEGIN:VEVENT", "UID:" + String(pj.slug + "-" + m.id).replace(/[^\w-]/g, "") + "@planner.brandon-rose.com", "DTSTAMP:" + stamp,
        "SUMMARY:" + icsText((m.done ? "✓ " : "⏰ ") + title), "CATEGORIES:Project deadline",
        "DTSTART:" + day + "T090000", "DTEND:" + day + "T093000",
        "DESCRIPTION:" + icsText("Deadline for " + pj.name + ". Open the project: " + link), "URL:" + link);
      if (!m.done) L.push("BEGIN:VALARM", "ACTION:DISPLAY", "DESCRIPTION:" + icsText("Due tomorrow: " + title), "TRIGGER:-PT15H", "END:VALARM",
        "BEGIN:VALARM", "ACTION:DISPLAY", "DESCRIPTION:" + icsText("Due today: " + title), "TRIGGER:PT0M", "END:VALARM");
      L.push("END:VEVENT");
    }
  }
  L.push("END:VCALENDAR");
  return L.map(icsFold).join("\r\n") + "\r\n";
}

// ---------- project schedules (read from each project's GitHub repo) ----------
// The repo file is the source of truth for deadlines; done-ness comes from the project data here.
const SCHEDULE_URLS = {
  "faceless-youtube": "https://raw.githubusercontent.com/BrandonRose2/faceless-youtube-clipping/main/plan/schedule.json",
  "gta-clipping": null, // no repo: deadlines come from projects/gta-clipping.schedule.json
  "ai-marketing": null, // Thornless AI: deadlines come from projects/ai-marketing.schedule.json
  "amberhaven": null, // AmberHaven Shopify store: deadlines come from projects/amberhaven.schedule.json
};
const STATUS_ORDER = ["Not started", "Researching", "Scripting", "Voiceover", "Visuals", "Editing", "Title & thumbnail", "Scheduled", "Published"];
const schedCache = {};
async function loadSchedule(slug) {
  if (!(slug in SCHEDULE_URLS)) return null;
  const url = SCHEDULE_URLS[slug];
  if (!url) {
    try { return { at: 0, json: JSON.parse(fs.readFileSync(path.join(__dirname, "projects", slug + ".schedule.json"), "utf8")), source: "bundled" }; }
    catch (e) { return null; }
  }
  const c = schedCache[slug];
  if (c && Date.now() - c.at < 10 * 60 * 1000) return c;
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(6000) });
    if (!r.ok) throw new Error("HTTP " + r.status);
    const json = await r.json();
    if (!json || !Array.isArray(json.milestones)) throw new Error("no milestones");
    return (schedCache[slug] = { at: Date.now(), json, source: "repo" });
  } catch (e) {
    if (c) return { ...c, source: "cache" };
    // Built-in copy from the last deploy, used only if GitHub can't be reached.
    try { return { at: 0, json: JSON.parse(fs.readFileSync(path.join(__dirname, "projects", slug + ".schedule.json"), "utf8")), source: "bundled" }; }
    catch (e2) { return null; }
  }
}
function computeMilestones(sched, data) {
  const vids = (data && data.videos) || [], manual = (data && data.msDone) || {};
  return (sched.milestones || []).filter(m => m && m.id && m.title && /^\d{4}-\d{2}-\d{2}$/.test(m.due || "")).map(m => {
    const v = m.video != null ? vids.find(x => x && +x.n === +m.video) : null;
    const done = m.doneWhen ? !!v && STATUS_ORDER.indexOf(v.status) >= STATUS_ORDER.indexOf(m.doneWhen) : !!manual[m.id];
    return { id: String(m.id), t: String(m.title), due: m.due, done, video: m.video ?? null, doneWhen: m.doneWhen || null };
  });
}
async function readProject(slug) {
  try { return JSON.parse(await fsp.readFile(path.join(PROJECTS, slug + ".json"), "utf8")); } catch (e) { return null; }
}

// ---------- helpers ----------
const ID_RE = /^[a-z0-9]{8,64}$/;
const hashPw = (pw, salt) => crypto.scryptSync(pw, salt, 64, { N: 16384, r: 8, p: 1 }).toString("hex");
const safeEq = (a, b) => { const x = Buffer.from(String(a)), y = Buffer.from(String(b)); return x.length === y.length && crypto.timingSafeEqual(x, y); };
const sign = v => crypto.createHmac("sha256", SECRET).update(v).digest("base64url");

function makeSession() {
  const exp = Date.now() + SESSION_DAYS * 864e5, v = `${exp}`;
  return `${v}.${sign(v)}`;
}
function authed(req) {
  const m = /(?:^|;\s*)lp=([^;]+)/.exec(req.headers.cookie || "");
  if (!m) return false;
  const [exp, sig] = decodeURIComponent(m[1]).split(".");
  return !!exp && !!sig && safeEq(sig, sign(exp)) && +exp > Date.now();
}
// Viewer cookie is tied to VIEW_KEY, so changing the key signs every viewer out.
const viewSig = exp => sign("view:" + VIEW_KEY + ":" + exp);
function viewer(req) {
  if (VIEW_KEY.length < 20) return false;
  const m = /(?:^|;\s*)lpv=([^;]+)/.exec(req.headers.cookie || "");
  if (!m) return false;
  const [exp, sig] = decodeURIComponent(m[1]).split(".");
  return !!exp && !!sig && safeEq(sig, viewSig(exp)) && +exp > Date.now();
}
// Project apps a viewer may open read-only: every project (same rule as VIEW_PROJECTS in build.js).
const VIEW_PROJECTS = fs.readdirSync(path.join(__dirname, "projects")).filter(f => f.endsWith(".template.html")).map(f => f.replace(".template.html", ""));
const VIEW_GET = new RegExp("^/(api/state|api/version|_blob/[a-z0-9]+|api/project/[a-z0-9-]{1,40}/milestones|api/project/(" + VIEW_PROJECTS.join("|") + "))$");
const cookie = (val, maxAge) => `lp=${encodeURIComponent(val)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;

function send(res, code, body, type = "text/plain; charset=utf-8", extra = {}) {
  res.writeHead(code, {
    "Content-Type": type,
    "X-Frame-Options": "SAMEORIGIN",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "same-origin",
    "Cache-Control": "no-store",
    ...extra,
  });
  res.end(body);
}
const json = (res, code, obj, extra) => send(res, code, JSON.stringify(obj), "application/json", extra);

function readBody(req, limit) {
  return new Promise((ok, no) => {
    const chunks = []; let n = 0;
    req.on("data", c => { n += c.length; if (n > limit) { no(Object.assign(new Error("too large"), { code: 413 })); req.destroy(); } else chunks.push(c); });
    req.on("end", () => ok(Buffer.concat(chunks)));
    req.on("error", no);
  });
}
// Mutating requests must come from this site (cookie is SameSite=Lax; this is a second check).
// ---------- HubSpot (Ai Marketing Plan) ----------
const HS_FILE = path.join(DATA, "hubspot.json");
function hsLoad() { try { return JSON.parse(fs.readFileSync(HS_FILE, "utf8")); } catch (e) { return null; } }
async function hsCall(token, method, url, body) {
  const r = await fetch("https://api.hubapi.com" + url, { method, headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) { const e = new Error((d && d.message) || ("HubSpot HTTP " + r.status)); e.status = r.status; throw e; }
  return d;
}
const hsDomain = u => { try { return new URL(u).hostname.replace(/^www\./, ""); } catch (e) { return ""; } };
const hsHtml = s => String(s == null ? "" : s).replace(/[&<>]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
async function hsNotes(token, items) { // items: [{companyId, body}]
  for (let i = 0; i < items.length; i += 100) {
    await hsCall(token, "POST", "/crm/v3/objects/notes/batch/create", { inputs: items.slice(i, i + 100).map(n => ({
      properties: { hs_timestamp: new Date().toISOString(), hs_note_body: n.body },
      associations: [{ to: { id: n.companyId }, types: [{ associationCategory: "HUBSPOT_DEFINED", associationTypeId: 190 }] }] })) });
  }
}
async function hubspot(req, res, act) {
  if (act === "" && req.method === "GET") { const h = hsLoad(); return json(res, 200, { connected: !!(h && h.token), portal: h ? String(h.portal || "") : "" }); }
  if (req.method !== "POST" || !sameOrigin(req)) return json(res, 405, { error: "method" });
  const body = JSON.parse((await readBody(req, 1024 * 1024)).toString("utf8") || "{}");
  if (act === "connect") {
    const token = String(body.token || "").trim();
    if (!/^[A-Za-z0-9_-]{20,200}$/.test(token)) return json(res, 400, { error: "That doesn’t look like a HubSpot access token." });
    let info;
    try { info = await hsCall(token, "GET", "/account-info/v3/details"); }
    catch (e) { return json(res, 400, { error: e.status === 401 ? "HubSpot rejected that token." : e.message }); }
    try { await hsCall(token, "GET", "/crm/v3/objects/companies?limit=1"); }
    catch (e) { return json(res, 400, { error: "Token works but can’t read companies. Add the crm.objects.companies scopes." }); }
    await writeAtomic(HS_FILE, JSON.stringify({ token, portal: info.portalId, at: Date.now() }));
    try { fs.chmodSync(HS_FILE, 0o600); } catch (e) {}
    return json(res, 200, { ok: true, portal: String(info.portalId) });
  }
  if (act === "disconnect") { try { await fsp.unlink(HS_FILE); } catch (e) {} return json(res, 200, { ok: true }); }
  const h = hsLoad();
  if (!h || !h.token) return json(res, 400, { error: "Not connected. Paste a HubSpot token first." });
  const leads = Array.isArray(body.leads) ? body.leads.slice(0, 100) : [];
  try {
    if (act === "push") {
      const created = await hsCall(h.token, "POST", "/crm/v3/objects/companies/batch/create", { inputs: leads.map(l => ({
        objectWriteTraceId: String(l.id),
        properties: { name: String(l.name || "").slice(0, 200), phone: l.phone || "", domain: hsDomain(l.website), website: l.website || "",
          address: l.address || "", city: l.city || "", state: l.state || "", zip: l.zip || "",
          description: [l.category, l.rating ? `Google ${l.rating}★ (${l.reviews} reviews)` : ""].filter(Boolean).join(" · ") } })) });
      const out = (created.results || []).map((r, i) => ({ id: r.objectWriteTraceId || (leads[i] && leads[i].id), hs: r.id }));
      const byId = Object.fromEntries(leads.map(l => [String(l.id), l]));
      await hsNotes(h.token, out.map(o => { const l = byId[o.id] || {};
        return { companyId: o.hs, body: `<p><b>From Ai Marketing Plan</b></p><p>Stage: ${hsHtml(l.stage || "New")}</p>${l.email ? `<p>Email: ${hsHtml(l.email)}</p>` : ""}${l.category ? `<p>Category: ${hsHtml(l.category)}</p>` : ""}${l.notes ? `<p>Notes: ${hsHtml(l.notes)}</p>` : ""}` }; }));
      return json(res, 200, { results: out });
    }
    if (act === "sync") {
      const ok = leads.filter(l => /^\d+$/.test(String(l.hs || "")));
      await hsNotes(h.token, ok.map(l => ({ companyId: String(l.hs), body: `<p><b>Stage: ${hsHtml(l.stage)}</b>${l.next ? ` · next step ${hsHtml(l.next)}` : ""}</p>${l.notes ? `<p>${hsHtml(l.notes)}</p>` : ""}` })));
      return json(res, 200, { results: ok.map(l => ({ id: l.id, ok: true })) });
    }
  } catch (e) { return json(res, e.status === 401 ? 401 : 502, { error: e.status === 401 ? "HubSpot token expired or revoked. Connect again." : e.message }); }
  return json(res, 404, { error: "unknown action" });
}

function sameOrigin(req) {
  const o = req.headers.origin;
  return !o || o === `https://${req.headers.host}` || o === `http://${req.headers.host}`;
}
async function writeAtomic(file, data) {
  const tmp = file + "." + crypto.randomBytes(4).toString("hex") + ".tmp";
  await fsp.writeFile(tmp, data);
  await fsp.rename(tmp, file);
}

// ---------- login rate limit: 8 tries per 15 min per IP ----------
const tries = new Map();
function limited(ip) {
  const now = Date.now(), t = (tries.get(ip) || []).filter(x => now - x < 15 * 60e3);
  tries.set(ip, t);
  return t.length >= 8;
}
const noteTry = ip => tries.get(ip).push(Date.now());

// ---------- pages ----------
const page = (title, body) => `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title><meta name="robots" content="noindex">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;1,400&family=Hanken+Grotesk:wght@400;600&display=swap">
<style>
:root{--bg:#121214;--surface:#19191c;--line:#2c2c31;--fg:#ebe6dc;--muted:#8f8b84;--gold:#c9a96a;--warn:#d38b6f;color-scheme:dark}
@media (prefers-color-scheme: light){:root{--bg:#eceae6;--surface:#f8f7f4;--line:#d9d6d0;--fg:#1d1c1a;--muted:#6c6862;--gold:#8f6f32;--warn:#a85a3c;color-scheme:light}}
*{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;background:var(--bg);color:var(--fg);font:15px/1.5 "Hanken Grotesk",system-ui,sans-serif;padding:16px}
form{width:100%;max-width:360px;background:var(--surface);border:1px solid var(--line);border-radius:14px;padding:28px}
h1{font:500 34px/1.1 "Cormorant Garamond",Georgia,serif;margin:0 0 6px}p{color:var(--muted);margin:0 0 20px;font-size:14px}
label{display:block;font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:var(--muted);margin:14px 0 6px}
input{width:100%;padding:11px 12px;border-radius:8px;border:1px solid var(--line);background:var(--bg);color:var(--fg);font:inherit}
input:focus{outline:1.5px solid var(--gold);border-color:var(--gold)}
button{margin-top:20px;width:100%;padding:12px;border:0;border-radius:999px;background:var(--gold);color:var(--bg);font:600 14px inherit;cursor:pointer}
.err{color:var(--warn);font-size:13px;margin-top:12px;min-height:1em}
</style></head><body>${body}</body></html>`;

const loginPage = err => page("Sign in · Life Planner", `<form method="post" action="/login">
<h1>Life Planner</h1><p>Brandon’s private planner.</p>
<label for="pw">Password</label><input id="pw" name="password" type="password" autocomplete="current-password" required autofocus>
<button type="submit">Sign in</button><div class="err">${err || ""}</div></form>`);

const setupPage = err => page("Set up · Life Planner", `<form method="post" action="/setup">
<h1>Set your password</h1><p>One time only. Enter the setup code from Claude, then choose your password (at least 10 characters).</p>
<label for="code">Setup code</label><input id="code" name="code" autocomplete="off" required autofocus>
<label for="pw">New password</label><input id="pw" name="password" type="password" autocomplete="new-password" minlength="10" required>
<label for="pw2">Repeat password</label><input id="pw2" name="password2" type="password" autocomplete="new-password" minlength="10" required>
<button type="submit">Save password</button><div class="err">${err || ""}</div></form>`);

const form = buf => Object.fromEntries(new URLSearchParams(buf.toString("utf8")));
const ipOf = req => (req.headers["x-forwarded-for"] || "").split(",")[0].trim() || req.socket.remoteAddress;

// ---------- server ----------
http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, "http://x"), p = url.pathname, hasAuth = fs.existsSync(AUTH_FILE);

    if (p === "/healthz") return send(res, 200, "ok");

    if (p === "/setup") {
      if (hasAuth) return send(res, 302, "", undefined, { Location: "/" });
      if (req.method === "GET") return send(res, 200, setupPage(), "text/html; charset=utf-8");
      if (req.method === "POST" && sameOrigin(req)) {
        const ip = ipOf(req);
        if (limited(ip)) return send(res, 429, setupPage("Too many tries. Wait 15 minutes."), "text/html; charset=utf-8");
        const f = form(await readBody(req, 4096));
        if (!SETUP_CODE || !safeEq((f.code || "").trim(), SETUP_CODE)) { noteTry(ip); return send(res, 401, setupPage("That setup code isn’t right."), "text/html; charset=utf-8"); }
        if ((f.password || "").length < 10) return send(res, 400, setupPage("Use at least 10 characters."), "text/html; charset=utf-8");
        if (f.password !== f.password2) return send(res, 400, setupPage("The two passwords don’t match."), "text/html; charset=utf-8");
        const salt = crypto.randomBytes(16).toString("hex");
        await writeAtomic(AUTH_FILE, JSON.stringify({ salt, hash: hashPw(f.password, salt) }));
        return send(res, 302, "", undefined, { Location: "/", "Set-Cookie": cookie(makeSession(), SESSION_DAYS * 86400) });
      }
      return send(res, 405, "Method not allowed");
    }

    if (!hasAuth) return send(res, 302, "", undefined, { Location: "/setup" });

    if (p === "/login") {
      if (req.method === "GET") return send(res, 200, loginPage(), "text/html; charset=utf-8");
      if (req.method === "POST" && sameOrigin(req)) {
        const ip = ipOf(req);
        if (limited(ip)) return send(res, 429, loginPage("Too many tries. Wait 15 minutes."), "text/html; charset=utf-8");
        const f = form(await readBody(req, 4096)), a = JSON.parse(await fsp.readFile(AUTH_FILE, "utf8"));
        if (!safeEq(hashPw(f.password || "", a.salt), a.hash)) { noteTry(ip); return send(res, 401, loginPage("Wrong password."), "text/html; charset=utf-8"); }
        return send(res, 302, "", undefined, { Location: "/", "Set-Cookie": cookie(makeSession(), SESSION_DAYS * 86400) });
      }
      return send(res, 405, "Method not allowed");
    }
    if (p === "/logout") return send(res, 302, "", undefined, { Location: "/login", "Set-Cookie": cookie("", 0) });

    // Calendar feed: the secret in the address stands in for a password.
    const fm = /^\/cal\/([A-Za-z0-9_-]{20,64})\.ics$/.exec(p);
    if (fm && req.method === "GET") {
      if (!safeEq(fm[1], FEED_KEY)) return send(res, 404, "Not found");
      let state = {}; try { state = JSON.parse(await fsp.readFile(STATE_FILE, "utf8")); } catch (e) {}
      const projects = [];
      for (const slug of Object.keys(SCHEDULE_URLS)) {
        const sc = await loadSchedule(slug); if (!sc) continue;
        const pr = (state.projects || []).find(x => x && x.url === "/projects/" + slug);
        projects.push({ slug, name: (pr && pr.name) || slug, milestones: computeMilestones(sc.json, await readProject(slug)) });
      }
      return send(res, 200, buildIcs(state, projects), "text/calendar; charset=utf-8", { "Content-Disposition": 'inline; filename="life-planner.ics"' });
    }

    // Read-only family link. The code in the address stands in for a password.
    const vm = /^\/view\/([A-Za-z0-9_-]{20,64})\/?$/.exec(p);
    if (vm && req.method === "GET") {
      if (VIEW_KEY.length < 20 || !safeEq(vm[1], VIEW_KEY)) return send(res, 404, "Not found");
      const exp = String(Date.now() + VIEW_DAYS * 864e5);
      return send(res, 200, VIEW_HTML, "text/html; charset=utf-8", {
        "Set-Cookie": `lpv=${encodeURIComponent(exp + "." + viewSig(exp))}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${VIEW_DAYS * 86400}`,
        "Referrer-Policy": "no-referrer" });
    }
    // A viewer may only read the planner, its photos and project lights. No writes.
    if (!authed(req) && viewer(req)) {
      if (req.method === "GET" && p === "/") return send(res, 302, "", undefined, { Location: "/view/" + VIEW_KEY });
      const vp = /^\/projects\/([a-z0-9-]{1,40})\/?$/.exec(p);
      if (req.method === "GET" && vp && VIEW_PROJECTS.includes(vp[1]))
        return send(res, 200, await fsp.readFile(path.join(__dirname, "public", "projects", vp[1] + ".view.html")), "text/html; charset=utf-8");
      if (req.method !== "GET" || !VIEW_GET.test(p)) return json(res, 403, { error: "view only" });
    }
    // Everything below needs a signed-in session.
    else if (!authed(req)) {
      if (p.startsWith("/api/") || p.startsWith("/_blob/")) return json(res, 401, { error: "signed out" });
      return send(res, 302, "", undefined, { Location: "/login" });
    }

    if (p === "/" && req.method === "GET") return send(res, 200, APP_HTML, "text/html; charset=utf-8");

    // Project apps, e.g. /projects/faceless-youtube, served from public/projects/<slug>.html.
    const projM = /^\/projects\/([a-z0-9-]{1,40})\/?$/.exec(p);
    if (projM && req.method === "GET") {
      const file = path.join(__dirname, "public", "projects", projM[1] + ".html");
      if (!fs.existsSync(file)) return send(res, 404, "No such project");
      return send(res, 200, await fsp.readFile(file), "text/html; charset=utf-8");
    }
    const mm = /^\/api\/project\/([a-z0-9-]{1,40})\/milestones$/.exec(p);
    if (mm && req.method === "GET") {
      const sc = await loadSchedule(mm[1]);
      if (!sc) return json(res, 200, { milestones: [], source: "none" });
      return json(res, 200, { milestones: computeMilestones(sc.json, await readProject(mm[1])), source: sc.source });
    }
    // HubSpot bridge for the Ai Marketing Plan app. The token lives in /data/hubspot.json and never leaves the server.
    const hm = /^\/api\/project\/ai-marketing\/hubspot(?:\/(connect|disconnect|push|sync))?$/.exec(p);
    if (hm) return hubspot(req, res, hm[1] || "");

    const am = /^\/api\/project\/([a-z0-9-]{1,40})$/.exec(p);
    if (am && SLUG_RE.test(am[1])) {
      const file = path.join(PROJECTS, am[1] + ".json");
      if (req.method === "GET") {
        let raw = null, mtime = 0;
        try { raw = await fsp.readFile(file, "utf8"); mtime = (await fsp.stat(file)).mtimeMs; } catch (e) {}
        return json(res, 200, { data: raw ? JSON.parse(raw) : null, version: mtime });
      }
      if (req.method === "PUT" && sameOrigin(req)) {
        const data = JSON.parse((await readBody(req, 2 * 1024 * 1024)).toString("utf8"));
        if (!data || typeof data !== "object" || Array.isArray(data)) return json(res, 400, { error: "bad data" });
        // Daily backup of the previous version, last 30 kept.
        try {
          const bk = path.join(BACKUPS, `project-${am[1]}-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}.json`);
          if (!fs.existsSync(bk) && fs.existsSync(file)) await fsp.copyFile(file, bk);
          const all = (await fsp.readdir(BACKUPS)).filter(f => f.startsWith("project-" + am[1] + "-")).sort();
          for (const f of all.slice(0, Math.max(0, all.length - 30))) await fsp.unlink(path.join(BACKUPS, f));
        } catch (e) {}
        await writeAtomic(file, JSON.stringify(data));
        return json(res, 200, { ok: true, version: (await fsp.stat(file)).mtimeMs });
      }
      return json(res, 405, { error: "method" });
    }

    if (p === "/api/calfeed") {
      if (req.method === "POST" && sameOrigin(req)) { FEED_KEY = newFeedKey(); await writeAtomic(FEED_FILE, FEED_KEY); }
      else if (req.method !== "GET") return json(res, 405, { error: "method" });
      return json(res, 200, { path: "/cal/" + FEED_KEY + ".ics" });
    }

    if (p === "/api/version" && req.method === "GET") {
      let v = 0; try { v = (await fsp.stat(STATE_FILE)).mtimeMs; } catch (e) {}
      return json(res, 200, { version: v });
    }

    if (p === "/api/state") {
      if (req.method === "GET") {
        let raw = null, mtime = 0;
        try { raw = await fsp.readFile(STATE_FILE, "utf8"); mtime = (await fsp.stat(STATE_FILE)).mtimeMs; } catch (e) {}
        return json(res, 200, { exists: !!raw, data: raw ? JSON.parse(raw) : null, version: mtime });
      }
      if (req.method === "PUT" && sameOrigin(req)) {
        const body = await readBody(req, 5 * 1024 * 1024), data = JSON.parse(body.toString("utf8"));
        if (!data || typeof data !== "object" || Array.isArray(data)) return json(res, 400, { error: "bad state" });
        // Keep an hourly backup of the previous state, last 72 kept.
        try {
          const stamp = new Date().toISOString().slice(0, 13).replace(/[-:T]/g, "");
          const bk = path.join(BACKUPS, `state-${stamp}.json`);
          if (!fs.existsSync(bk) && fs.existsSync(STATE_FILE)) await fsp.copyFile(STATE_FILE, bk);
          const all = (await fsp.readdir(BACKUPS)).filter(f => f.startsWith("state-")).sort();
          for (const f of all.slice(0, Math.max(0, all.length - 72))) await fsp.unlink(path.join(BACKUPS, f));
        } catch (e) {}
        await writeAtomic(STATE_FILE, JSON.stringify(data));
        return json(res, 200, { ok: true, version: (await fsp.stat(STATE_FILE)).mtimeMs });
      }
    }

    if (p === "/api/photos" && req.method === "POST" && sameOrigin(req)) {
      if (!/^image\/(jpeg|png|webp|gif)$/.test(req.headers["content-type"] || "")) return json(res, 415, { error: "images only" });
      const body = await readBody(req, 15 * 1024 * 1024), id = crypto.randomBytes(16).toString("hex");
      await writeAtomic(path.join(PHOTOS, id + ".jpg"), body);
      return json(res, 200, { id, url: "/_blob/" + id, sizeBytes: body.length, contentType: req.headers["content-type"] });
    }

    const pm = /^\/(?:_blob|api\/photos)\/([a-z0-9]+)$/.exec(p);
    if (pm && ID_RE.test(pm[1])) {
      const f = path.join(PHOTOS, pm[1] + ".jpg");
      if (req.method === "DELETE" && sameOrigin(req)) { try { await fsp.unlink(f); } catch (e) {} return json(res, 200, { ok: true }); }
      if (req.method === "GET") {
        try {
          const buf = await fsp.readFile(f), t = buf[0] === 0x89 ? "image/png" : buf[0] === 0x52 ? "image/webp" : buf[0] === 0x47 ? "image/gif" : "image/jpeg";
          return send(res, 200, buf, t, { "Cache-Control": "private, max-age=31536000, immutable" });
        } catch (e) { return send(res, 404, "Not found"); }
      }
    }

    return send(res, 404, "Not found");
  } catch (e) {
    console.error(e);
    if (!res.headersSent) send(res, e.code === 413 ? 413 : 500, e.code === 413 ? "Too large" : "Server error");
  }
}).listen(PORT, () => console.log("Life Planner listening on " + PORT));
