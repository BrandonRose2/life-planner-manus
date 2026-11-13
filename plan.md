# Existing-planner mobile patch

Use the uploaded vanilla JavaScript/Node source without migrating frameworks, moving hosting, changing data schemas, or adding paid dependencies. Preserve the serif headings, colored paper checklists, photo backdrop, quick links, themes, calendar, habits table, and current controls.

Replace long-text inputs in the main planner and Corners Cut with soft-wrapping, auto-growing textareas. Preserve their IDs and data bindings, direct and delegated listeners, persistence timing, and Enter-to-add list semantics. Keep date/time/range controls native. Fit grid minima inside narrow screens and grow notes after render, input, font readiness, and viewport changes. Remove the main mobile-only text mirror workaround rather than layering another one over it.

Improve the existing server-generated read-only view using the same source: static labelled readable text, disabled edit controls, selectable/copyable text, the existing permitted project navigation, and guards against local/remote persistence. Preserve the server's viewer authorization. The legacy `share.html`, Courtney-specific generator, guide, site marketing pages, and unrelated project app templates remain unchanged unless required by the build.

## Project structure

`index.html` is the main source with its existing inline styles and app logic. `private/build.js` generates main and view-only HTML and inserts project seeds. `private/server.js` remains the existing authenticated Node server and Railway-volume persistence layer. `private/projects/faceless-youtube.template.html` is Corners Cut. Other uploaded files are preserved. Add synthetic regression fixtures and test scripts under `tests/`, with generated test data/results excluded from Git.

Run local tests only with isolated synthetic state and mocked or loopback APIs. Do not import production state into test storage. Keep the original uploaded source as a baseline commit and create a separate patch commit, so the changes are reviewable and reversible. GitHub publication and Railway deployment remain separate from local code completion.
