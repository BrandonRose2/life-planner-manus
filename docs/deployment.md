# Existing planner deployment

November 13, 2026: tested patch commit `b298f91` is published at https://github.com/BrandonRose2/life-planner-manus. The repository is private. **The fixes are not live yet.**

The existing Railway `life-planner` project contains the target `brandon-planner` service at https://planner.brandon-rose.com, with its existing volume attached. The similarly named service at `life-planner.brandon-rose.com` is a different service and remains untouched. The target's active deployment was a CLI upload; settings showed root `/`, Railpack, and no custom build/start override.

A read-only preflight rebuilt the supplied ZIP and compared its generated main HTML with the live site's authenticated HTML: exact match, including a fresh check on November 13 at 10:14 Pacific. Only a canonical state checksum/version was recorded outside the repository. No production state contents or secrets were committed, and no production writes were made.

## Current blocker

The exact repository `BrandonRose2/life-planner-manus` and `main` branch are selected on the existing service. **These two changes are staged, not deployed.** Review confirmed that only this service's Repo and Branch settings would change; no domain, volume, environment, resource-plan, or other-service changes are staged.

Railway disables Deploy and displays this permission warning:

> No project member has access to this GitHub repository. Check if the GitHub Railway App is installed and project members have their GitHub accounts connected.

The Manus GitHub connector works and has already published the repo. It does not authorize Railway's separate GitHub App. The repository picker can list the repo without having the app permissions needed to deploy it.

The initial attempt opened the picker's Configure GitHub App entry rather than the repository entry. This was corrected with a native click on the exact repository row. The permission warning above is the verified blocker after that correction, not an assumption based on the initial sign-in page.

## Continue safely

Sign in to GitHub for the Railway App at https://github.com/apps/railway-app/installations/new and add `life-planner-manus` to its allowed repositories. If an existing installation lists other allowed repositories, leave those permissions unchanged. Do not grant broader repository access than needed. If Railway indicates that the project member's GitHub account is disconnected, reconnect that account as well. No upgrade is required.

Once Railway recognizes access, apply the reviewed Repo/Branch changes to the existing `brandon-planner` service. Keep repository root `/`. The root package.json provides build `npm run build` and start `npm start`; these invoke `node private/build.js` and `node private/server.js`. Keep the existing volume, environment, domain, limits, and credentials. Do not run setup/reset/reseed against production. Confirm build output includes main/view HTML and all project variants, then check service health and the main/shared pages read-only.

Do not report the patch as live until the deployment succeeds and source/layout are verified on the existing URLs. Native iPhone Safari remains a separate final device check.
