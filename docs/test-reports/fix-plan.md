# Text-Only Buckleson Rollback Fix Plan

Date: 2026-09-23

Status: **RESOLVED**

## Ranked Root Cause Analysis

1. **Missing restored dependencies in local `node_modules`**
   - Evidence: `npm run build` exited `1` with missing `gsap`, `gsap/ScrollTrigger`, and `clipboard` modules.
   - Cause: the rollback restored template dependencies in `package.json`/`pnpm-lock.yaml`, but the local install still reflected the visual-conversion dependency set.
   - Fix: ran a frozen lockfile install through pinned `pnpm@12.5.1` with caches/stores under `G:\my-sitess`.

2. **Contact component retained a hardcoded ScrewFast email**
   - Evidence: source search found `support@screwfast.uk` in `src/components/sections/misc/ContactSection.astro`.
   - Cause: restored template component contained visible hardcoded contact text outside the copy table.
   - Fix: changed only the visible email/link text to `support@buckleson.com` and updated the rollback guard to allow that exact text-only component diff.

3. **Unbased `/contact` links in content**
   - Evidence: `node --test tests/*.test.mjs` failed `all built HTML navigation and resource URLs stay within the project base` with `index.html is not project-base-prefixed: /contact`.
   - Cause: restored product and pricing content rendered literal CTA URLs, bypassing `sitePath`/`localePath`.
   - Fix: changed those content URLs to `/ThySite/contact/`.

## Final Verification

All required local gates now pass:

- `npm run build` -> exit `0`
- `node --test tests/text-only-rollback.test.mjs` -> exit `0`, `6/6` passed
- `node --test tests/*.test.mjs` -> exit `0`, `48/48` passed
- `npm run test:smoke` -> exit `0`

## Remaining Risk

Template imagery remains intentionally mismatched until the user selects which images to keep. This is expected for the text-only rollback pass.
