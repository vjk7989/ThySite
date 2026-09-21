# CI pnpm-Version Alignment Gate Report

Date: 2026-09-22  
Gate status: **PASS**

## Verification results

| Order | Exact command                                                                                                 | Exit | Result                                                                                             |
| ----- | ------------------------------------------------------------------------------------------------------------- | ---: | -------------------------------------------------------------------------------------------------- |
| 1     | `node --test tests/github-pages-deployment.test.mjs`                                                          |    0 | 8 passed, 0 failed, 0 skipped, 0 cancelled                                                         |
| 2     | `node --test tests/*.test.mjs`                                                                                |    0 | 35 passed, 0 failed, 0 skipped, 0 cancelled                                                        |
| 3     | `node G:\my-sitess\.tools\corepack\v1\pnpm\12.5.1\bin\pnpm.mjs --version`                                     |    0 | `12.5.1`                                                                                           |
| 4     | `node <pnpm.mjs> install --frozen-lockfile --store-dir G:\my-sitess\.cache\pnpm-store --reporter=append-only` |    0 | Fresh isolated install completed with 455 packages; 455 reused and 0 downloaded                    |
| 5     | Git-derived `node node_modules/prettier/bin/prettier.cjs --check --ignore-unknown -- <paths>`                 |    0 | 4 formattable changed files checked; all matched files use Prettier style                          |
| 6     | `git diff --check`                                                                                            |    0 | No whitespace-error diagnostics                                                                    |
| 7     | `npm run build`                                                                                               |    0 | Astro check: 124 files, 0 errors, 0 warnings, 6 hints; 17 pages built                              |
| 8     | `npm run test:smoke`                                                                                          |    0 | 25/25 routes passed: 10 expected 200 and 15 expected 404                                           |
| 9     | PyYAML `BaseLoader` structural parse of all pnpm/deployment workflows                                         |    0 | `ci.yml` job `build`; `dependabot-format.yml` job `format`; `deploy-pages.yml` jobs `build,deploy` |

## Frozen-install evidence

The fresh isolated verification directory was `G:\my-sitess\.tmp\ci-pnpm-alignment-rerun-20260922-0350`. Before installation it contained copies of only:

- `package.json`
- `pnpm-lock.yaml`
- `pnpm-workspace.yaml`

All pnpm store, Corepack, npm cache, XDG cache, and temporary paths were under `G:\my-sitess`. The real repository's `node_modules` was not replaced.

The source and isolated lockfiles matched both before and after installation:

```text
2A3907C9454FE7D084445963A4C5FFC98CD9CD8C46DEDFC66B3637DAA04B9477
```

The install reported that the lockfile was up to date, skipped resolution, and completed using pnpm 12.5.1.

## Changed-scope evidence

The Git-derived formatting scope contained:

- `.github/workflows/ci.yml`
- `.github/workflows/dependabot-format.yml`
- `tests/github-pages-deployment.test.mjs`
- `docs/test-reports/latest.md`

The focused regression test confirms every workflow using `pnpm/action-setup@v4` relies on `package.json`'s `packageManager: pnpm@12.5.1` as the only version source. The obsolete `version: 9` action inputs are absent.

The build emitted the existing non-fatal `use astro:head-inject` directive warning and empty `i18n` content-collection warning.

## Full-format baseline proof

`npm run format:check` exits 1 on 118 pre-existing files. The warning set has zero overlap with the 4 Git-derived changed paths and zero warning paths dirty against `HEAD`. The scoped changed-file check is green, so this is an unrelated repository baseline rather than a regression in this unit.
