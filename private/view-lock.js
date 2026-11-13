/* Shared-view presentation. Server authorization remains the security boundary. */
const allowed = '[data-act="ovClose"],[data-act="ytSnd"],[data-act="ytPrev"],[data-act="ytNext"],[data-tab],[data-calact="nav"],[data-calact="sel"],[data-calact="today"],[data-act="wk"],[data-act="md"],[data-act="msall"]';
const projectRoutes = new Set(VIEW_PROJECT_ROUTES);
const copyStyles = ['fontFamily','fontSize','fontWeight','fontStyle','lineHeight','letterSpacing','textTransform','color','textDecorationLine','textDecorationColor','textDecorationThickness','paddingTop','paddingRight','paddingBottom','paddingLeft','textAlign','flexGrow','flexShrink','flexBasis','order'];
const originalFetch = window.fetch.bind(window);
window.fetch = (input, options) => {
  const method = String((options && options.method) || (input instanceof Request && input.method) || 'GET').toUpperCase();
  if (!['GET','HEAD'].includes(method)) return Promise.reject(new Error('This page is view only.'));
  return originalFetch(input, options);
};

function labelFor(control) {
  if (control.getAttribute('aria-label')) return control.getAttribute('aria-label');
  if (control.labels && control.labels.length) return [...control.labels].map(l => l.textContent.trim()).join(' ');
  return control.placeholder || '';
}
function mirror(control) {
  let text = control.nextElementSibling;
  if (!text || !text.classList.contains('ro-text')) {
    text = document.createElement('div');
    text.className = 'ro-text';
    control.after(text);
  }
  const value = control.value || '';
  if (text.textContent !== value) text.textContent = value;
  const label = labelFor(control);
  if (label) { text.setAttribute('role','group'); text.setAttribute('aria-label',label); }
  if (value) {
    const style = getComputedStyle(control);
    for (const key of copyStyles) if (text.style[key] !== style[key]) text.style[key] = style[key];
    if (control.classList.contains('notes')) {
      text.style.backgroundImage = style.backgroundImage;
      text.style.backgroundSize = style.backgroundSize;
    }
  }
  control.classList.toggle('ro-hide', !!value);
  text.hidden = !value;
  const row = control.closest('.ln');
  if (row && (!value && control.dataset.act === 'blank')) row.classList.add('ro-empty-rule');
}
function lock() {
  document.querySelectorAll('input,textarea,select').forEach(control => {
    control.readOnly = true;
    if (control.tagName === 'SELECT' || ['checkbox','range','time','date','number','file'].includes(control.type)) control.disabled = true;
    control.tabIndex = -1;
    if (control.tagName === 'TEXTAREA' || ['text','search','url'].includes(control.type)) mirror(control);
  });
  document.querySelectorAll('.proj-btn.empty').forEach(button => { button.hidden = true; });
}
let pending = false;
function scheduleLock() {
  if (pending) return;
  pending = true;
  requestAnimationFrame(() => { pending = false; lock(); });
}
function startLock() {
  lock();
  new MutationObserver(records => {
    const changed = records.some(record => [...record.addedNodes].some(node => node.nodeType === 1 && (node.matches('input,textarea,select') || node.querySelector('input,textarea,select'))));
    if (changed) scheduleLock();
  }).observe(document.body, {childList:true,subtree:true});
  if (document.fonts) {
    document.fonts.ready.then(scheduleLock);
    document.fonts.addEventListener('loadingdone',scheduleLock);
  }
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',startLock,{once:true}); else startLock();
addEventListener('resize',scheduleLock);

document.addEventListener('click', event => {
  const link = event.target.closest('a[href]');
  if (link) {
    const href = link.getAttribute('href');
    if (/^https?:/i.test(href) || href === '' || href === '/' || projectRoutes.has(href.replace(/\/$/,''))) return;
    event.preventDefault(); event.stopImmediatePropagation(); return;
  }
  const control = event.target.closest('button,label,[data-act],[data-calact],[data-projact],input,select,textarea');
  if (control && !control.matches(allowed)) { event.preventDefault(); event.stopImmediatePropagation(); }
},true);
for (const type of ['input','change','submit','paste','drop','dragover','dragenter']) {
  document.addEventListener(type,event => { event.preventDefault(); event.stopImmediatePropagation(); },true);
}
document.addEventListener('keydown',event => {
  if (!event.target.matches('input,textarea,select')) return;
  if ((event.ctrlKey || event.metaKey) && ['a','c','f'].includes(event.key.toLowerCase())) return;
  if (['Tab','Escape','ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End','PageUp','PageDown'].includes(event.key)) return;
  event.preventDefault(); event.stopImmediatePropagation();
},true);
