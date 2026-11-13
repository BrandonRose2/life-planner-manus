# Life Planner — Manus

Focused improvements to the existing Life Planner at https://planner.brandon-rose.com, prioritizing the editable main planner and covering its shared read-only version and Corners Cut project page. This is the owner's supplied application source, not a replacement app.

## What changed

Long intentions, income focus, tasks, list headings, priorities, habit names, and goal names are actual soft-wrapping textareas that grow and shrink while editing. Scratch and calendar notes grow too. The tap-to-switch mobile text mirror has been removed. Existing saving, IDs, data bindings, list Enter/Backspace behavior, native date/time/range controls, themes, photo backdrop, and intentional table scrolling remain.

Quick-link rows reserve enough banner space to avoid covering the date/title, and phone status controls no longer squeeze the heading. Corners Cut topics, angles, video notes, and channel notes wrap and grow; the full script URL is readable while its native URL editor remains.

The shared build uses labelled, selectable static text and disables editing controls. It avoids owner-local state fallback and prevents local and remote writes, including initial project seed writes. The server's authentication and viewer authorization code are unchanged. Read failures provide a working Retry link.

## Status

**The original site has been restored; this repository is for a separate improved version only.** Private repository: https://github.com/BrandonRose2/life-planner-manus. The earlier in-place deployment was a scope mistake. Following the owner's explicit approval, original HTML was restored and verified against baseline `81e38fc`, current planner/project data was preserved, and this repository was disconnected from the original Railway service. See [restoration](docs/restoration.md). Patch commit `b298f91`, 116 isolated regression assertions, and prior 24-case live evidence remain available for the separate version; earlier deployment reports are historical. Never deploy this code to the original domain/service/volume again.

## Build and run

Node 18+ is sufficient; the app has no npm runtime dependencies.

```sh
npm run build
DATA_DIR=/absolute/path/to/local-planner-data PORT=8080 SETUP_CODE=choose-a-local-setup-code npm start
```

Never point local test storage at production `/data`. Use a dedicated local directory. To test a shared link locally, set a new `VIEW_KEY` environment variable of at least 20 characters; never put a production shared key in source or commits.

`index.html` remains the main inline app source. `private/build.js` generates `private/public/index.html`, `view.html`, and project pages. `private/projects/faceless-youtube.template.html` is Corners Cut. `private/view-lock.js` and `.css` are inlined into shared builds. `private/server.js` still owns authentication, photos, calendar feeds, backups, and persistent data. Other supplied app/template/site files are preserved.

## Regression tests

```sh
npm run check
npm run build
python3 tests/regression.py --cdp http://127.0.0.1:9222
```

The test suite requires Python Playwright and an existing Chromium browser with a CDP endpoint. It connects to that browser, creates isolated contexts, launches a temporary local copy of the original Node server, and closes its test contexts/server afterward. It does not close the existing browser. All fixture state is synthetic, all storage is temporary, and requests outside the local test origin are blocked. External schedule endpoints are mocked.

The suite covers 24 page/width combinations (main, shared, Corners Cut, shared Corners Cut at 320/375/390/430/768/1280px), overflow, editor growth/shrink, title/icon clearance, saving, list keyboard semantics, Markdown copy, read failure/retry, viewer write rejection, and cache isolation. Generated logs/screenshots remain in ignored `.test-results/`; a concise [validation report](docs/validation.md) is committed. These are Chromium viewport tests, not proof of native iPhone Safari/soft-keyboard behavior or assistive-technology compatibility.

## Deployment boundaries

Deploy only to the existing planner service. Preserve its domain, persistent volume, `/data`, environment variables, passwords, shared key, feed key, and project data. Do not create a replacement service, change plans, or reseed production data. For a repository-root deployment, build with `npm run build` and start with `npm start`. Confirm the existing service's actual build/root configuration before changing it.

Do not commit credentials, production state, share-link tokens, captured production HTML, personal screenshots, or private photos. The supplied project `*.seed.json` files are original source fixtures; runtime `private/seed/` and generated `private/public/` are ignored.
