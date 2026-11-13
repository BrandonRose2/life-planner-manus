# Existing planner deployment — complete

**The mobile fixes are live on https://planner.brandon-rose.com and its existing shared link.** Deployed and verified November 13, 2026, approximately 10:35 Pacific.

## Source and service

Private repository: https://github.com/BrandonRose2/life-planner-manus. Implementation commit: `b298f91`. The live deployment used source commit `7f6634f`, which adds documentation only after the implementation.

Railway deployment: `e8ac2582-1d2c-4fbf-a998-3faea09a8959`, in the existing `life-planner` project, existing **`brandon-planner`** service. The service at `life-planner.brandon-rose.com` is different and was not changed.

Only two service settings were applied: Repo `BrandonRose2/life-planner-manus` and Branch `main`. The domain, existing attached volume, environment variables, credentials, shared/feed keys, resource limits, and service plan were left unchanged. The app remains the original dependency-free Node server with root build `npm run build` and start `npm start`. Authentication/server code and data schema were not modified.

## Verified live

The deployed main planner, Corners Cut, shared planner, and shared Corners Cut HTML each exactly match the locally generated tested build. All 24 live page/width cases passed at 320, 375, 390, 430, 768, and 1280px.

There was no page-level horizontal overflow or clipped visible textarea in those cases. Main/shared quick links clear the date/title; shared quick links clear the viewer bar. No JavaScript runtime errors or mutating request attempts occurred. The health endpoint returned 200, viewer state reads returned 200, and viewer access to the private calendar-feed configuration remained denied with 403.

The saved planner contents matched their pre-deployment canonical checksum both immediately after deployment and after the read-only rendering checks. Verification blocked all browser writes and all external browser asset requests. It made no production mutation requests, ran no setup/reset/reseed, and did not place synthetic data in production. State checksums/contents, session cookies, and the private share token are not included in the repository.

## Authorization and future deployments

The initial picker interaction mistakenly opened Configure GitHub App; this was corrected. Selecting the actual repository exposed a verified Railway permission warning and disabled Deploy. The owner authorized Railway outside the disconnected Take Control session. Manual Deploy then became enabled, and the GitHub deployment completed successfully.

The last settings check still displayed **Auto deploy unavailable** despite manual deployment working. Do not assume a future GitHub push deploys automatically; use the existing service's manual deployment workflow and verify success until that Railway indicator is resolved. Do not broaden repository permissions unnecessarily.

For rollback, use the existing service's Railway deployment history without replacing its volume. The preceding live CLI deployment was `4766b129-2e10-4454-9747-9d1ca897f44a`; the untouched uploaded source also remains in Git baseline `81e38fc`. No schema migration is part of this patch.

## Final device check

The owner should reload both existing links in native iPhone Safari and check text while editing, long scratch/calendar notes, icon/header spacing, and Corners Cut. Chromium viewport and synthetic composition tests do not prove native iOS keyboard, hardware safe-area, screen-reader, or external-font behavior.

## Superseded after owner scope clarification

This record is historical. On November 13, 2026, approximately 11:26 Pacific, the original site was restored and this repo was disconnected from its Railway service. See [restoration.md](restoration.md). All future improvements belong to a separate site with independent storage; do not deploy this patch to the original again.
