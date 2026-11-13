# Original site restored; separate version only

On November 13, 2026, the owner clarified that the improvements must be a separate site, not changes to the existing planner. The earlier in-place deployment was a scope mistake.

The owner explicitly approved restoring the original site first while preserving current saved data, disconnecting the Manus repository from the original service, then making a separate improved version with independent storage.

## Completed restoration

The exact pre-Manus CLI deployment `4766b129-2e10-4454-9747-9d1ca897f44a` was redeployed using Railway's Redeploy action. The broader Rollback action was canceled because it also restores custom variables. No old data snapshot was restored.

All four currently served HTML variants—main, shared, Corners Cut, shared Corners Cut—exactly match the generated output from the untouched uploaded-source baseline `81e38fc`. The canonical checksums of the current planner and all four project data records were unchanged before and after restoration. The original owner session and original shared link still work; health is 200. Verification used GET requests only, no production page JavaScript or writes.

The `BrandonRose2/life-planner-manus` Repo and `main` Branch were then removed from the original `brandon-planner` service. The two changes were applied through the change-details dialog. A fresh settings-page load shows **Connect Source**, no linked repo/branch, and no staged changes. Another read-only verification confirms the original HTML and current data are still unchanged.

The original domain, persistent volume, credentials, feed/shared keys, current tasks/notes, and other Railway service were not replaced. The original uploaded ZIP remains untouched.

## Binding rule for all future work

Do not reconnect this repository or any new Manus project to `planner.brandon-rose.com`, its `brandon-planner` service, or its data volume. The improved version must have its own site URL, runtime, durable storage, and credentials. Do not copy production credentials, tokens, photos, or current planner data into it automatically.

Earlier deployment and live-validation documents describe historical evidence for the mobile patch, not the current original site's code. The patch source and tests remain available in this private repository for the separate version.
