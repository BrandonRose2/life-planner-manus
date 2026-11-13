"""Regression tests using isolated temporary storage and the existing CDP browser.

Run after `node private/build.js`:
    python3 tests/regression.py --cdp http://127.0.0.1:9222
Requires Python playwright; no production credentials or data are used.
"""
import argparse
import copy
import http.client
import json
import os
from contextlib import nullcontext
from pathlib import Path
import socket
import subprocess
import tempfile
import time
from http.cookies import SimpleCookie
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
RESULTS = ROOT / '.test-results'
LONG = 'A long synthetic planning sentence with details that must remain visible while reading and editing. ' * 5
TOKEN = 'synthetic-view-key-for-local-regression-only'
DAY = time.strftime('%Y-%m-%d')
STATE = {
    'v': 1, 'intention': LONG, 'oneThing': LONG, 'notes': '\n'.join(['Synthetic scratch note ' + LONG] * 12),
    'cal': {DAY: {'items': [{'id': 'appt-test', 't': LONG, 'time': '11:00', 'cat': 'appt', 'd': False}], 'note': LONG * 3}},
    'projects': [{'id': 'pj1', 'name': 'Corners Cut', 'url': '/projects/faceless-youtube'}, {'id': 'pj2', 'name': '', 'url': ''}],
    'priorities': [{'id': 'p1', 't': LONG, 'd': False}, {'id': 'p2', 't': '', 'd': False}, {'id': 'p3', 't': '', 'd': False}],
    'lists': [{'id': 'todo', 'name': LONG, 'color': 'green', 'items': [{'id': 'test-item', 't': LONG, 'd': False}, {'id': 'checked-item', 't': LONG, 'd': True}]}],
    'habits': [{'id': 'habit-test', 'name': LONG, 'weeks': {}}],
    'goals': [{'id': 'goal-test', 't': LONG, 'p': 60}],
    'blocks': {DAY: [{'id': 'block-test', 'start': '08:30', 'dur': 45, 't': LONG, 'd': False}]},
    'theme': {'photos': [], 'cover': 0, 'rotate': False, 'off': False},
    'links': [{'id': 'link-test-' + str(i), 'label': 'Link ' + str(i), 'url': 'https://example.com/' + str(i), 'icon': 'github'} for i in range(18)],
    'gtaV1': True, 'amberV1': True, 'linksV2': True
}
PROJECT = {'v': 1, 'notes': LONG * 4, 'msDone': {}, 'videos': [{'id': 'video-test', 'n': 1, 'topic': LONG, 'hook': 'Unbroken' * 40, 'proof': LONG, 'date': DAY, 'views': 0, 'script': 'https://example.com/' + 'long-path-' * 30, 'notes': LONG * 4, 'status': 'Not started'}]}
MILESTONES = {'source': 'synthetic', 'milestones': [{'id': 'milestone-test', 't': LONG, 'due': DAY, 'video': 1, 'doneWhen': 'Published', 'done': False}]}
LAYOUT_JS = """() => {
 const visible=e=>e.getClientRects().length&&getComputedStyle(e).display!=='none'&&getComputedStyle(e).visibility!=='hidden';
 return {width:innerWidth,documentWidth:document.documentElement.scrollWidth,
   scrollingEditors:[...document.querySelectorAll('textarea')].filter(visible).filter(e=>e.scrollHeight>e.clientHeight+2||e.scrollWidth>e.clientWidth+2).map(e=>({id:e.id,field:e.dataset.f,class:e.className,height:e.clientHeight,scrollHeight:e.scrollHeight,width:e.clientWidth,scrollWidth:e.scrollWidth})),
   quick:document.querySelector('#quick')?.getBoundingClientRect().top,
   quickBottom:document.querySelector('#quick')?.getBoundingClientRect().bottom,
   headerTop:document.querySelector('.head')?.getBoundingClientRect().top,
   titleWidth:document.querySelector('.titles')?.getBoundingClientRect().width,
   bar:document.querySelector('.view-bar')?.getBoundingClientRect().bottom};
}"""

def check(condition, message):
    if not condition:
        raise AssertionError(message)
    print('PASS:', message, flush=True)


def request(port, method, route, body=None, cookie=None):
    conn = http.client.HTTPConnection('127.0.0.1', port, timeout=10)
    headers = {}
    if cookie:
        headers['Cookie'] = cookie
    if body is not None:
        headers['Content-Type'] = 'application/json'
        body = json.dumps(body)
    conn.request(method, route, body=body, headers=headers)
    response = conn.getresponse()
    result = (response.status, response.read(), dict(response.getheaders()))
    conn.close()
    return result


def install_network_boundary(context, base, writes):
    def handle(route):
        req = route.request
        u = urlparse(req.url)
        if not req.url.startswith(base + '/'):
            route.abort()
            return
        if req.method not in ('GET', 'HEAD'):
            writes.append({'method': req.method, 'path': u.path})
        if u.path.endswith('/milestones'):
            route.fulfill(status=200, content_type='application/json', body=json.dumps(MILESTONES))
        else:
            route.continue_()
    context.route('**/*', handle)


def cookie_object(header):
    jar = SimpleCookie()
    jar.load(header)
    return [{'name': k, 'value': v.value, 'domain': '127.0.0.1', 'path': '/', 'httpOnly': True, 'secure': False, 'sameSite': 'Lax'} for k, v in jar.items()]


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--cdp', default='http://127.0.0.1:9222')
    args = parser.parse_args()
    RESULTS.mkdir(exist_ok=True)
    with tempfile.TemporaryDirectory(prefix='life-planner-regression-') as temp:
        data = Path(temp)
        (data / 'projects').mkdir()
        (data / 'state.json').write_text(json.dumps(STATE))
        (data / 'projects/faceless-youtube.json').write_text(json.dumps(PROJECT))
        sock = socket.socket()
        sock.bind(('127.0.0.1', 0))
        port = sock.getsockname()[1]
        sock.close()
        env = dict(os.environ, DATA_DIR=temp, PORT=str(port), SETUP_CODE='synthetic-local-setup-only', VIEW_KEY=TOKEN)
        log = (RESULTS / 'server.log').open('w')
        server = subprocess.Popen(['node', 'private/server.js'], cwd=ROOT, env=env, stdout=log, stderr=subprocess.STDOUT)
        contexts = []
        p = None
        try:
            for _ in range(100):
                if server.poll() is not None:
                    raise RuntimeError('Local test server exited; see .test-results/server.log')
                try:
                    if request(port, 'GET', '/healthz')[0] == 200:
                        break
                except OSError:
                    time.sleep(.05)
            else:
                raise RuntimeError('Local test server did not start')
            conn = http.client.HTTPConnection('127.0.0.1', port)
            conn.request('POST', '/setup', 'code=synthetic-local-setup-only&password=local-test-password-only&password2=local-test-password-only', {'Content-Type': 'application/x-www-form-urlencoded'})
            response = conn.getresponse()
            owner_cookie = response.getheader('Set-Cookie')
            check(response.status == 302 and owner_cookie, 'isolated test owner can sign in')
            response.read()
            conn.close()
            status, _, headers = request(port, 'GET', '/view/' + TOKEN)
            check(status == 200, 'synthetic shared link loads')
            viewer_cookie = headers['Set-Cookie'].split(';', 1)[0]
            for method, route in [('PUT', '/api/state'), ('PUT', '/api/project/faceless-youtube'), ('POST', '/api/photos'), ('DELETE', '/_blob/abcdef123456'), ('GET', '/api/calfeed')]:
                check(request(port, method, route, cookie=viewer_cookie)[0] == 403, 'server rejects viewer ' + method + ' ' + route)
            check(request(port, 'GET', '/api/state', cookie=viewer_cookie)[0] == 200, 'viewer can read planner state')
            check(request(port, 'GET', '/api/state')[0] == 401, 'anonymous state request is rejected')
            check(request(port, 'GET', '/view/not-a-valid-shared-key-123')[0] == 404, 'invalid shared link is rejected')
            check(b'window.__plannerView=true' in request(port, 'GET', '/projects/faceless-youtube', cookie=viewer_cookie)[1], 'viewer receives generated read-only project')
            base = f'http://127.0.0.1:{port}'
            with nullcontext(sync_playwright().start()) as p:
                browser = p.chromium.connect_over_cdp(args.cdp)
                owner = browser.new_context(viewport={'width': 375, 'height': 812}, color_scheme='light', reduced_motion='reduce')
                viewer = browser.new_context(viewport={'width': 375, 'height': 812}, color_scheme='light', reduced_motion='reduce')
                contexts.extend([owner, viewer])
                owner.add_cookies(cookie_object(owner_cookie))
                viewer.add_cookies(cookie_object(headers['Set-Cookie']))
                owner_writes, viewer_writes = [], []
                install_network_boundary(owner, base, owner_writes)
                install_network_boundary(viewer, base, viewer_writes)
                viewer.add_init_script("""(() => {
                  const original=Storage.prototype.setItem;
                  original.call(localStorage,'life-planner-v1',JSON.stringify({intention:'OWNER CACHE MUST NOT APPEAR'}));
                  window.__testStorageWrites=[];
                  Storage.prototype.setItem=function(k,v){window.__testStorageWrites.push(k);return original.call(this,k,v)};
                })()""")
                reports = []
                main_page = owner.new_page()
                errors = []
                main_page.on('pageerror', lambda e: errors.append(str(e)))
                for context, name, route in [(owner, 'main', '/'), (owner, 'corners-cut', '/projects/faceless-youtube'), (viewer, 'shared', '/view/' + TOKEN), (viewer, 'shared-corners-cut', '/projects/faceless-youtube')]:
                    page = main_page if name == 'main' else context.new_page()
                    page.on('pageerror', lambda e: errors.append(str(e)))
                    page.goto(base + route, wait_until='networkidle')
                    page.wait_for_timeout(150)
                    for width in [320, 375, 390, 430, 768, 1280]:
                        page.set_viewport_size({'width': width, 'height': 812})
                        page.wait_for_timeout(120)
                        layout = page.evaluate(LAYOUT_JS)
                        reports.append(dict(route=name, **layout))
                        check(layout['documentWidth'] <= width + 1, f'{name} has no page overflow at {width}px')
                        check(not layout['scrollingEditors'], f'{name} text editors fully fit at {width}px: {layout["scrollingEditors"]}')
                        if name in ('main', 'shared'):
                            check(layout['titleWidth'] >= min(175, width / 2), f'{name} title does not collapse at {width}px')
                            check(layout['headerTop'] >= layout['quickBottom'], f'{name} quick links do not cover the date or title at {width}px')
                        if name == 'shared':
                            check(layout['quick'] >= layout['bar'], f'shared quick links clear the banner at {width}px')
                        if width == 375:
                            page.screenshot(path=str(RESULTS / (name + '-375.png')))
                    if context == viewer:
                        check(page.evaluate('window.__testStorageWrites.length') == 0, name + ' makes zero local-storage writes')
                        check(page.locator('input[type=range]:not(:disabled)').count() == 0, name + ' progress controls cannot be changed')
                        check('OWNER CACHE MUST NOT APPEAR' not in page.locator('body').inner_text(), name + ' does not expose owner-local cached state')
                        check(page.evaluate("fetch('/api/state',{method:'PUT',body:'{}'}).then(()=>false,()=>true)"), name + ' blocks programmatic mutating fetch')
                    if page is not main_page:
                        page.close()
                check(not errors, 'no JavaScript runtime errors: ' + str(errors))
                check(not owner_writes, 'rendering and resizing do not save owner state')
                check(not viewer_writes, 'shared pages make zero mutating requests')
                check(json.loads((data / 'state.json').read_text()) == STATE, 'layout checks do not change serialized state')
                main_page.set_viewport_size({'width': 375, 'height': 812})
                check(main_page.locator('#intention').evaluate('(e)=>e.tagName') == 'TEXTAREA', 'intention is an actual wrapping editor')
                main_page.locator('#intention').fill(LONG * 3)
                main_page.wait_for_timeout(100)
                big_height = main_page.locator('#intention').evaluate('(e)=>e.clientHeight')
                main_page.locator('#intention').fill('Short intention')
                main_page.wait_for_timeout(100)
                small_height = main_page.locator('#intention').evaluate('(e)=>e.clientHeight')
                check(big_height > small_height, 'editor height grows and shrinks while typing')
                main_page.locator('#notes').fill(LONG * 6)
                check(not main_page.evaluate(LAYOUT_JS)['scrollingEditors'], 'long notes grow during editing without internal scrolling')
                blank = main_page.locator('[data-act=blank][data-l=todo]').first
                blank.fill('A single new synthetic task')
                blank.press('Enter')
                main_page.wait_for_timeout(800)
                state = json.loads((data / 'state.json').read_text())
                check(sum(i['t'] == 'A single new synthetic task' for i in state['lists'][0]['items']) == 1, 'Enter adds a blank row exactly once')
                check(main_page.evaluate('document.activeElement.id') == 'blank-todo-0', 'Enter restores focus to the next blank')
                main_page.locator('#intention').focus()
                main_page.wait_for_timeout(700)
                state = json.loads((data / 'state.json').read_text())
                check(sum(i['t'] == 'A single new synthetic task' for i in state['lists'][0]['items']) == 1, 'blur after Enter does not duplicate the item')
                existing = main_page.locator('#it-todo-test-item')
                existing.press('Enter')
                check(main_page.evaluate('document.activeElement.id') == 'blank-todo-0', 'Enter on an existing row focuses blank without inserting a newline')
                main_page.locator('#blank-todo-0').fill('IME still composing')
                main_page.locator('#blank-todo-0').dispatch_event('keydown', {'key': 'Enter', 'isComposing': True, 'bubbles': True})
                check(main_page.locator('#blank-todo-0').input_value() == 'IME still composing', 'composition Enter does not commit a task')
                main_page.locator('#blank-todo-0').fill('')
                existing = main_page.locator('#it-todo-test-item')
                existing.fill('')
                existing.press('Backspace')
                check(main_page.locator('#it-todo-test-item').count() == 0, 'empty-row Backspace retains deletion behavior')
                main_page.evaluate("Object.defineProperty(navigator,'clipboard',{value:{writeText:async t=>{window.__testCopy=t}},configurable:true})")
                main_page.locator('[data-act=md][data-l=todo]').click()
                check('- [x] ' in main_page.evaluate('window.__testCopy'), 'Markdown copy keeps checked task formatting')
                main_page.wait_for_timeout(800)
                state = json.loads((data / 'state.json').read_text())
                check(state['intention'] == 'Short intention' and state['notes'] == LONG * 6, 'edited text is saved through the existing storage bridge')
                # Read failure must not reveal local owner-cache fallback.
                failure = viewer.new_page()
                failure.route('**/api/state', lambda route: route.fulfill(status=503, body='Unavailable'))
                failure.goto(base + '/view/' + TOKEN, wait_until='networkidle')
                check(failure.locator('[role=alert]').count() == 1, 'shared read failure shows retry instead of owner cache')
                check('OWNER CACHE MUST NOT APPEAR' not in failure.locator('body').inner_text(), 'read failure never displays owner-local state')
                failure.unroute('**/api/state')
                failure.locator('[role=alert] a').click()
                failure.wait_for_load_state('networkidle')
                check(failure.locator('[role=alert]').count() == 0 and failure.locator('#intention').input_value() == 'Short intention', 'shared Retry link reloads current server state successfully')
                failure.close()
                # A fresh viewer project must not PUT its built-in seed back to the server.
                missing = viewer.new_page()
                missing.route('**/api/project/faceless-youtube', lambda route: route.fulfill(status=200, content_type='application/json', body=json.dumps({'data': None, 'version': 0})))
                missing.goto(base + '/projects/faceless-youtube', wait_until='networkidle')
                missing.wait_for_timeout(650)
                check(not viewer_writes, 'missing project data cannot trigger a viewer seed write')
                missing.close()
                (RESULTS / 'layout.json').write_text(json.dumps(reports, indent=2) + '\n')
                (RESULTS / 'summary.json').write_text(json.dumps({'status': 'passed', 'layout_cases': len(reports), 'viewer_mutations': viewer_writes, 'production_requests': 0}, indent=2) + '\n')
                print('ALL REGRESSION CHECKS PASSED', flush=True)
        finally:
            for context in contexts:
                try:
                    context.close()
                except Exception:
                    pass
            if p is not None:
                p.stop()
            server.terminate()
            try:
                server.wait(timeout=5)
            except subprocess.TimeoutExpired:
                server.kill()
                server.wait()
            log.close()

if __name__ == '__main__':
    main()
