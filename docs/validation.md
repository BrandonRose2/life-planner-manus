# Mobile patch validation

Validated November 13, 2026 against the owner's supplied source. Original source baseline: `81e38fc`.

## Automated results

**116 passing assertions; 24 page/width combinations.** Tested main planner, Corners Cut, shared planner, and shared Corners Cut at 320, 375, 390, 430, 768, and 1280 pixels in Chromium via the existing CDP browser. A temporary instance of the original Node server used only synthetic state, synthetic authentication, and temporary disk storage. All non-local browser requests were blocked; schedule API results were synthetic. Production requests: zero.

| Area | Result |
|---|---|
| Page-level horizontal overflow | None in all 24 cases; table-local scrolling remains intentional |
| Visible textarea text | No internal vertical or horizontal overflow in all 24 cases |
| Main/shared header | Title has a usable width; 18 synthetic quick links plus main edit gear do not cover the date/title |
| Shared viewer bar | Quick links begin below the bar at every tested width |
| Input height | Actual intention editor grows and shrinks while editing; long notes fit |
| Saving | Existing storage bridge persists edited intention/notes |
| Checklist Enter | Adds a new row exactly once, restores blank focus, does not duplicate on blur |
| Existing-row Enter/Backspace | Enter retains next-blank behavior without a literal newline; empty-row Backspace deletes as before |
| Composition event | Synthetic composing Enter does not commit a task |
| Markdown copy | Checked-task formatting retained with an isolated clipboard stub |
| Read-only presentation | Range controls disabled; no owner-local cached state displayed |
| Shared persistence | Zero local-storage writes and zero mutating requests on load/resize, including missing project data |
| Read failure/retry | Shows a retry alert rather than owner cache; activating Retry loads current server state |
| Original server authorization | Viewer state reads allowed; state/project PUT, photo POST/DELETE, calendar feed access denied; anonymous/invalid-link requests rejected |
| JavaScript | No runtime errors in tested page flows; 16 generated inline scripts pass `node --check` |
| Server source | `private/server.js` unchanged from uploaded baseline |

## Review corrections

Visual inspection caught a mobile title squeezed into character-by-character lines despite an initially passing overflow test. Phone status controls now take a separate row, and a title-width assertion prevents recurrence. A fixture with 18 quick links exposed icon overlap over the dateline; the existing banner fitter now reserves the header overlap and applies its minimum height to the plain backdrop too. Final read-only code review caught an empty-href Retry link blocked by the shared link guard; its navigation and activation test are fixed.

## Reproduce

Run `npm run build`, then `python3 tests/regression.py --cdp http://127.0.0.1:9222`. Python Playwright and an existing CDP-enabled Chromium are needed for tests, not the app. Logs, layout JSON, and synthetic screenshots are generated under ignored `.test-results/`.

## What this does not establish

These are Chromium viewport tests, not native iPhone Safari/device tests. Real iOS soft keyboards, IME/paste behavior, safe-area hardware insets, external webfont loading, and end-to-end screen-reader/text-selection behavior still need a device check. The suite blocks external assets and uses font fallbacks. The CSS retains original fonts and includes font-loading remeasurement hooks, but those hooks are not proof of actual Safari font rendering.

Live deployment and live read-only verification are tracked separately in `TODO.md`. No production data was changed by the validation suite.

## Live deployment verification — completed

On November 13, 2026, approximately 10:35 Pacific, the existing Railway `brandon-planner` service was deployed from the private GitHub repository. Deployment `e8ac2582-1d2c-4fbf-a998-3faea09a8959` is active; logs confirm the existing volume was mounted and `npm start` launched `node private/server.js` on port 8080.

**All 24 live page/width cases passed**, covering main, Corners Cut, shared, and shared Corners Cut at 320/375/390/430/768/1280px. Each served HTML variant exactly matches its tested generated build. There were no page-level horizontal overflows, internally clipped visible textareas, header/icon overlaps, or JavaScript runtime errors in these cases.

The saved planner contents matched their canonical pre-deployment checksum both after deployment and after rendering verification. All browser mutations were blocked; there were zero mutation attempts and zero production mutation requests. Health returned 200; viewer state reads returned 200; the private calendar-feed configuration remained denied to a viewer with 403. Only read requests were sent to production, and no production setup/reset/reseed or synthetic state injection occurred.

Machine-readable, non-content results are in [live-validation.json](live-validation.json). This live verification used Chromium and blocked external browser asset requests, so the native iPhone Safari/keyboard/font/safe-area limitations above still apply.
