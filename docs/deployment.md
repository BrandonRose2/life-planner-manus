# Existing planner deployment

November 13, 2026: tested patch commit `b298f91` is published at https://github.com/BrandonRose2/life-planner-manus. The repository is private. **No live deployment has been performed yet.**

The existing Railway `life-planner` project contains the target `brandon-planner` service at https://planner.brandon-rose.com, with its existing volume attached. The similarly named service at `life-planner.brandon-rose.com` is a different service and must remain untouched. The target's active deployment was a CLI upload; settings showed no connected GitHub repository, root `/`, Railpack, and no custom build/start override.

A read-only preflight rebuilt the supplied ZIP and compared its generated main HTML with the live site's authenticated HTML: exact match. It recorded only a canonical state checksum/version outside the repository; no production state contents or secrets were committed. No production writes were made.

The target's Connect Repo flow can see the new private repository but leads to GitHub sign-in for the Railway App. This is separate from the successfully reconnected Manus GitHub connector. Complete GitHub sign-in and grant Railway access to **only** `life-planner-manus` if a repository permission choice is offered. Do not grant unrelated repository access or change account plans.

After authorization, connect this repository's `main` branch to the **existing** `brandon-planner` service. Keep root `/`. The root package.json provides build `npm run build` and start `npm start`; these invoke `node private/build.js` and `node private/server.js`. Keep the existing volume, environment, domain, resource limits, and credentials. Do not run setup/reset/reseed against production. Confirm build output includes main/view HTML and all project variants, then check service health and the main/shared pages read-only.

Do not report the patch as live until the deployment succeeds and source/layout are verified on the existing URLs. Native iPhone Safari remains a separate final device check.
