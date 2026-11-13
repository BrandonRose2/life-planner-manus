# Mobile audit — November 10, 2026

The editable main planner still hides long text in single-line inputs. At a 375-pixel viewport, six everyday content editors were measured as too narrow for their current values: the daily intention, income focus, one focus-block task, and three list items. Seven additional quick-link configuration fields also have values wider than their visible input area. This is hidden content inside controls, not lost planner data.

Corners Cut had three truncated topic/angle editors plus a truncated native script-URL field at the same width. Its general page structure remained within the viewport. A native URL editor should retain URL semantics unless deliberately replaced with an appropriate editing alternative.

The shared planner's current filled text fields wrapped without detected truncation at 320, 375, 390, 430, 768, and 1280 pixels. The top icons were below the view-only bar in the current tested layout. This supports the existing shared-view fix for the currently loaded content; it does not prove all future content, Safari, zoom, accessibility, or safe-area cases are handled.

## Reproducible baseline

A read-only CDP script used the existing signed-in browser. It did not type into controls, dispatch editing events, click save/delete actions, or submit forms. Viewport changes and navigation were restored to the main planner afterwards. Counts were based on canvas measurement of input values against their available width and textarea scrollHeight against clientHeight; screenshots confirmed the visible main intention and income-focus truncation at 375 pixels.

At 320 / 375 / 390 / 430 / 768 / 1280 pixels, total single-line fields exceeding visible width were:

- Main planner, including quick-link configuration: 23 / 13 / 12 / 9 / 10 / 6.
- Corners Cut, including its script-URL field: 10 / 4 / 3 / 3 / 1 / 1.
- Shared planner: 0 / 0 / 0 / 0 / 0 / 0.

The root document width matched the tested viewport width on all three tested routes. This does not mean every nested element is fully visible: some tables intentionally scroll inside their containers. Main scratch notes required internal scrolling at 320 pixels for their current content, but not at 375 pixels. Main notes have no general automatic-height mechanism, so sufficiently long future notes can still scroll internally.

## Root cause and change direction

A text input cannot soft-wrap. Increasing its height or adding overflow-wrap will not solve the issue. Replace only intended long-text editors with auto-growing textareas in the actual source templates. Preserve IDs, data attributes, escaped values, accessible labels, and state bindings. Adapt input-specific selectors for intentions, lists, priorities, goals, habit names, and block tasks, and allow checklist rows to grow above their 36-pixel minimum.

The existing app uses delegated data-act handlers for most fields, but the daily intention has a directly attached listener. Focus restoration currently restricts selection restoration to type=text. Update these carefully when changing markup. Keep native time/date/range controls and deliberate compact calendar/timeline summaries. Full calendar details and focus-block details should expose complete text even when compact summaries use ellipsis or markers.

Run sizing after rendering, relevant input events, width changes, and font readiness. Sizing must not mutate state, trigger saves, or rerender the application on every keystroke. It must support both growth and shrinkage.

Preserve Enter-to-add list behavior, the existing blank-row deduplication, empty-item Backspace behavior, focus movement, and save timing. Add composition guards so IME text entry does not accidentally commit a row. Test this in synthetic offline fixtures with network writes blocked, not by creating test items in the real planner.

## Shared-view improvements to evaluate

The existing shared wrapper mirrors filled inputs into wrapping divs and disables many controls. It still leaves some empty/dead editing affordances and editing-oriented instructions. Its broad keyboard interception can interfere with selection/copy, and the static mirrors do not preserve all label relationships. Range inputs should be represented as static progress or explicitly disabled.

The shared wrapper's remote setter is a no-op, but the shared app can still call the common local-storage writer and can use owner-local cache fallback after a read failure. Add an explicit view-mode persistence guard and prevent owner-cache fallback in shared mode. This is a source-level finding, not a demonstrated server-authorization bypass or claim that production data was changed during the audit. Server-side enforcement remains unverified until the backend source is available.

## Completion blockers

Browser sign-in permits inspection but does not grant source-code or Railway deployment access. The application source repository or ZIP is still needed. The GitHub CLI consistently reports an invalid credential even after the documented token-replacement compatibility adjustment. The requested private GitHub repository is therefore not created yet.

No application patch, regression suite, deployment, or claim of completed fixes is included in this baseline.
