# Text-Only Buckleson Rollback Gate

Date: 2026-09-23

Status: **PASSED - gate open**

## Scope

Verified the rollback commit that reverts the full visual conversion from `f82578d`, restores the pre-conversion ScrewFast template structure/images/theme/components/routes, and reapplies only Buckleson public text and URL copy.

## Environment Note

The global Corepack `pnpm` shim pointed at a missing cached file on `D:\Caches`. No project files were changed for this. Verification used installed `node_modules` and `npm run ...` for project scripts. Missing restored dependencies were aligned from the existing lockfile with project-contained caches:

```powershell
$env:npm_config_cache='G:\my-sitess\.cache\npm'; npm exec --package=pnpm@12.5.1 -- pnpm install --frozen-lockfile --store-dir G:\my-sitess\.cache\pnpm-store
```

- Exit code: `0`
- Result: lockfile verified; `gsap` and `clipboard` restored; `animejs` removed.

## Commands

```powershell
npm run build
```

- Final exit code: `0`
- Built pages: `17`
- Diagnostics: `0` errors, `0` warnings, `6` hints.
- Notes: Astro emitted existing hints for unused/deprecated types and a Vite directive warning for `welcome-to-docs.mdx`.

```powershell
node --test tests/text-only-rollback.test.mjs
```

- Final exit code: `0`
- Passed: `6`
- Failed: `0`
- Skipped: `0`

```powershell
node --test tests/*.test.mjs
```

- Final exit code: `0`
- Passed: `48`
- Failed: `0`
- Skipped: `0`

```powershell
npm run test:smoke
```

- Exit code: `0`
- Expected `200` routes passed: `/`, `/products/`, four `/products/item-*` pages, `/services/`, `/blog/`, three `/blog/post-*` pages, three `/insights/insight-*` pages, `/contact/`, `/welcome-to-docs/`, `/404`.
- Expected `404` routes passed: four `/products/hyper-*` pages and representative removed locale routes.

## Gate Evidence

- `tests/text-only-rollback.test.mjs` verifies generated Buckleson image/logo/diagram artifacts from `f82578d` are gone, template seams are restored, original content filenames are restored, public source text is Buckleson-specific, and built output serves restored routes.
- `tests/github-pages-base-path.test.mjs` verifies built HTML resource/navigation URLs stay under `/ThySite`.
- `scripts/smoke.mjs` verifies restored `item-*` routes are live and visual-conversion `hyper-*` routes 404.

## Resolved Failures During This Gate

- Initial build failed because restored dependencies `gsap` and `clipboard` were missing from `node_modules`; frozen lockfile install fixed the local dependency state.
- Focused rollback test initially failed on the hardcoded contact email assertion; production text was corrected to `support@buckleson.com` and the test was tightened.
- Full suite initially failed on unbased `/contact` links in product and pricing content; content URLs were changed to `/ThySite/contact/`.

## Decision

The local gate is green. The change is ready to commit, push, and verify through hosted CI and Pages.
