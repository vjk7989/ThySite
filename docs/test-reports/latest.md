# GitHub Pages Deployment Gate Report

Date: 2026-09-22  
Gate status: **PASS**

## Verification results

| Order | Exact command                                                                                                                                      | Exit | Result                                                                                                                                |
| ----- | -------------------------------------------------------------------------------------------------------------------------------------------------- | ---: | ------------------------------------------------------------------------------------------------------------------------------------- |
| 1     | `node --test tests/github-pages-deployment.test.mjs`                                                                                               |    0 | 5 passed, 0 failed, 0 skipped, 0 cancelled                                                                                            |
| 2     | `node --test tests/*.test.mjs`                                                                                                                     |    0 | 32 passed, 0 failed, 0 skipped, 0 cancelled                                                                                           |
| 3     | Git-derived changed-file Prettier check in deterministic chunks: `node node_modules/prettier/bin/prettier.cjs --check --ignore-unknown -- <paths>` |    0 | 44 formattable changed files checked; all matched files use Prettier style                                                            |
| 4     | `npm run build`                                                                                                                                    |    0 | Astro check covered 124 files with 0 errors, 0 warnings, and 6 hints; static build completed with 17 pages                            |
| 5     | `npm run test:smoke`                                                                                                                               |    0 | 25/25 routes passed: 10 expected 200 responses and 15 removed-locale 404 responses                                                    |
| 6     | `python -c "import pathlib,yaml; ... yaml.load(..., Loader=yaml.BaseLoader) ..."`                                                                  |    0 | PyYAML 6.0.3 parsed `.github/workflows/deploy-pages.yml`; required top-level keys and `build`/`deploy` jobs were structurally present |
| 7     | `Resolve-DnsName www.buckleson.com -Type CNAME`                                                                                                    |    0 | `www.buckleson.com` resolves to `vjk7989.github.io`; TTL 600 seconds                                                                  |

All npm cache, temporary, and generated build state remained under `G:\my-sitess`.

## Deployment-specific coverage

The focused test suite verified:

- deployment on `main` with the official Astro/GitHub Pages actions;
- least-required Pages and OIDC permissions;
- serialized deployment concurrency and Pages URL output;
- the exact `www.buckleson.com` CNAME;
- the custom-domain canonical URL without a GitHub project base path.

The local YAML parser returned these structures:

- top-level keys: `name`, `on`, `permissions`, `concurrency`, `jobs`;
- job keys: `build`, `deploy`.

The build emitted two non-fatal existing warnings: Rolldown may not preserve the `use astro:head-inject` module directive, and the `i18n` content collection is empty. Neither warning stopped the build or affected the 25-route smoke run.

## Full-format baseline proof

`npm run format:check` exits 1 on 120 pre-existing files. The warning set has zero overlap with the 54 Git-derived changed/untracked paths and zero warning paths dirty against `HEAD`. The scoped changed-file check is green, so the full-format result is an explicitly proven baseline rather than a regression in this deployment unit.
