# Hosted CI formatting repair gate

Date: 2026-09-22

Hosted failure: `35668856470`

Status: **FAILED — gate closed**

## Scope

Independent verification of the single mechanical JSON formatting repair associated with hosted CI failure `35668856470`. The runner did not edit product, test, workflow, or artifact code; only this report was replaced.

## Changed-path inspection

```powershell
git status --short
git diff -- docs/test-artifacts/github-pages-base-final-20260922/browser-results.json
```

- Before this report update, Git showed one modified path: `docs/test-artifacts/github-pages-base-final-20260922/browser-results.json`.
- The displayed diff only changed JSON whitespace/layout: compact array formatting and a final newline.
- No JSON values, keys, ordering, or recorded browser evidence changed in the inspected diff.

## JSON parsing

```powershell
node -e "JSON.parse(require('fs').readFileSync('package.json','utf8')); console.log('PACKAGE_JSON_PARSE=OK')"
node -e "JSON.parse(require('fs').readFileSync('docs/test-artifacts/github-pages-base-final-20260922/browser-results.json','utf8')); console.log('BROWSER_RESULTS_JSON_PARSE=OK')"
```

- Exit code: `0`
- `package.json`: parsed successfully.
- `browser-results.json`: parsed successfully.

## Targeted formatting verification

```powershell
node node_modules/prettier/bin/prettier.cjs --check -- docs/test-artifacts/github-pages-base-final-20260922/browser-results.json
```

- Exit code: `0`
- Result: the repaired JSON file uses Prettier formatting.

## Required repository-wide pinned-pnpm formatting check

The command used the verified direct pnpm `12.5.1` entry point with `COREPACK_HOME`, pnpm store, npm cache, XDG cache, and temp directories under `G:\my-sitess`.

```powershell
node G:\my-sitess\.tools\corepack\v1\pnpm\12.5.1\bin\pnpm.mjs format:check
```

- Exit code: `1`
- pnpm version: `12.5.1`
- pnpm first synchronized `455` packages from the project-contained store/cache configuration and successfully ran the permitted `esbuild@0.28.2` postinstall.
- Script executed: `prettier --check .`
- Result: `Code style issues found in 117 files.`
- The repaired `docs/test-artifacts/github-pages-base-final-20260922/browser-results.json` was not among the reported failures.
- Reported files span existing repository configuration, documentation, source, content, and view files, including `.github/dependabot.yml`, `.prettierrc`, `README.md`, `process-html.mjs`, numerous `src/**` files, `tsconfig.json`, and `vercel.json`.

## Checks not run

The required full-format check failed, so the runner stopped immediately without running:

- `git diff --check`
- Final formatting-only diff classification beyond the already inspected JSON path
- Focused tests
- Full Node test suite
- Production build
- Route/content smoke tests

These checks remain required after the repository-wide formatting gate is resolved or the project explicitly establishes and accepts a narrower authoritative formatting scope.

## Gate decision

The mechanical JSON repair itself parses and passes targeted Prettier validation, and its inspected diff is formatting-only. However, the explicitly required full `pnpm format:check` command exits nonzero with 117 reported files. Under the green-gate policy, hosted CI repair verification remains closed and no later checks were run.
