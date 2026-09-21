# Hosted-Failure Repair Gate Report

Date: 2026-09-22  
Gate status: **PASS**

## Isolated clean-install verification

Isolated root: `G:\my-sitess\.tmp\pnpm-repair-gate-20260922-0325`

The source was copied with Robocopy exit 1 (successful copy) while excluding `.git`, `node_modules`, `dist`, `.astro`, `graft`, binary test screenshots, and browser profiles. Source images excluded by the initial binary filter were then copied separately; source and isolated image counts both equal 41.

All runtime state stayed under `G:\my-sitess`:

- `COREPACK_HOME=G:\my-sitess\.tools\corepack`
- `PNPM_HOME=G:\my-sitess\.tools\pnpm-home`
- `PNPM_STORE_DIR=G:\my-sitess\.cache\pnpm-store`
- `npm_config_cache=G:\my-sitess\.cache\npm`
- `XDG_CACHE_HOME=G:\my-sitess\.cache\xdg`
- `TEMP=G:\my-sitess\.tmp`
- `TMP=G:\my-sitess\.tmp`

| Check                  | Exact command                                                                                                                                               | Exit | Evidence                                                                                                                                     |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ---: | -------------------------------------------------------------------------------------------------------------------------------------------- |
| pnpm version           | `node G:\my-sitess\.tools\corepack\v1\pnpm\12.5.1\bin\pnpm.mjs --version`                                                                                   |    0 | `12.5.1`                                                                                                                                     |
| Frozen install         | `node G:\my-sitess\.tools\corepack\v1\pnpm\12.5.1\bin\pnpm.mjs install --frozen-lockfile --store-dir G:\my-sitess\.cache\pnpm-store --reporter=append-only` |    0 | 455 packages installed; lockfile policy verified for 577 entries; 455 reused and 0 downloaded                                                |
| Allowed builds         | PyYAML equality check of `pnpm-workspace.yaml`                                                                                                              |    0 | Exact mapping is `{esbuild: true}`; no other allowlist entries                                                                               |
| esbuild postinstall    | Frozen-install lifecycle log                                                                                                                                |    0 | `esbuild@0.28.2 postinstall$ node install.js` followed by `Done`                                                                             |
| esbuild binary         | `node node_modules/.pnpm/esbuild@0.28.2/node_modules/esbuild/bin/esbuild --version`                                                                         |    0 | Installed binary reports `0.28.2`                                                                                                            |
| Ignored/pending builds | pnpm module-state inspection                                                                                                                                |    0 | `node_modules/.modules.yaml` records `pendingBuilds: []` and only `allowBuilds.esbuild: true`; install log contains no ignored-build warning |
| Isolated build         | `node <pnpm.mjs> run build`                                                                                                                                 |    0 | Astro check: 124 files, 0 errors, 0 warnings, 6 hints; 17 pages built                                                                        |
| Isolated smoke         | `node <pnpm.mjs> run test:smoke`                                                                                                                            |    0 | 25/25 routes passed: 10 expected 200 and 15 expected 404                                                                                     |

An auxiliary `pnpm exec esbuild --version` probe exited 1 because esbuild is transitive and is not linked as a root executable. It was replaced by direct execution of the installed transitive binary, which exited 0 as recorded above. The `pnpm ignored-builds` helper also could not identify this workspace layout, so pnpm's generated module state and the complete install output were used for the ignored-build proof.

## Lockfile integrity

The source lockfile and post-install isolated lockfile have the same SHA-256 hash:

```text
2A3907C9454FE7D084445963A4C5FFC98CD9CD8C46DEDFC66B3637DAA04B9477
```

The real repository's `node_modules` was not replaced.

## Real-repository gate

| Order | Exact command                                                                                                                                      | Exit | Result                                                                     |
| ----- | -------------------------------------------------------------------------------------------------------------------------------------------------- | ---: | -------------------------------------------------------------------------- |
| 1     | `node --test tests/github-pages-deployment.test.mjs`                                                                                               |    0 | 7 passed, 0 failed, 0 skipped, 0 cancelled                                 |
| 2     | `node --test tests/*.test.mjs`                                                                                                                     |    0 | 34 passed, 0 failed, 0 skipped, 0 cancelled                                |
| 3     | Git-derived changed-file Prettier check in deterministic chunks: `node node_modules/prettier/bin/prettier.cjs --check --ignore-unknown -- <paths>` |    0 | 6 formattable changed files checked; all matched files use Prettier style  |
| 4     | `npm run build`                                                                                                                                    |    0 | Astro check: 124 files, 0 errors, 0 warnings, 6 hints; 17 pages built      |
| 5     | `npm run test:smoke`                                                                                                                               |    0 | 25/25 routes passed: 10 expected 200 and 15 expected 404                   |
| 6     | PyYAML `BaseLoader` structural parse of `.github/workflows/deploy-pages.yml`                                                                       |    0 | Top-level keys `name,on,permissions,concurrency,jobs`; jobs `build,deploy` |
| 7     | `Resolve-DnsName www.buckleson.com -Type CNAME`                                                                                                    |    0 | CNAME `vjk7989.github.io`; TTL 600 seconds                                 |

Both builds emitted the same two non-fatal existing warnings: the `use astro:head-inject` module directive may not be preserved by Rolldown, and the `i18n` content collection is empty.

## Full-format baseline proof

`npm run format:check` exits 1 on 120 pre-existing files. The warning set has zero overlap with the 6 Git-derived changed/untracked paths and zero warning paths dirty against `HEAD`. The scoped changed-file check is green, so the full-format result is a proven unrelated baseline rather than a regression in this repair.
