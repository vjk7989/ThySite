# GitHub Pages base-path repair final gate

Date: 2026-09-22

Status: **PASSED — green gate**

## Scope

Independent final rerun after the one-line Starlight favicon repair and regression update. The runner did not edit product, workflow, configuration, or test code.

## Fresh build

```powershell
npm run build
```

- Working directory: `G:\my-sitess\ThySite`
- Exit code: `0`
- Astro checks: `126` files, `0` errors, `0` warnings, `6` hints
- Static output: `17` pages built
- Existing nonfatal notices: Rolldown reported that `astro:head-inject` may not be preserved; the `i18n` collection was empty.

## Focused deployment, base-path/favicon, English, and brand tests

```powershell
node --test tests/github-pages-deployment.test.mjs tests/github-pages-base-path.test.mjs tests/english-only.test.mjs tests/brand-foundation.test.mjs
```

- Exit code: `0`
- Tests: `33` total, `33` passed, `0` failed, `0` skipped, `0` cancelled, `0` todo

## Full Node test suite

```powershell
node --test tests/*.test.mjs
```

- Exit code: `0`
- Tests: `42` total, `42` passed, `0` failed, `0` skipped, `0` cancelled, `0` todo

## Route and content smoke test

```powershell
npm run test:smoke
```

- Exit code: `0`
- Checks: `25` total, `25` passed, `0` failed
- Ten rendered English routes returned `200` with expected content.
- Fifteen removed locale-boundary routes returned the expected `404`.

## Authoritative changed-file formatting and diff validation

The changed set was derived from tracked modified/added files and untracked files, excluding deleted paths and filtering to Prettier-supported text extensions.

```powershell
node node_modules/prettier/bin/prettier.cjs --check -- <20 Git-derived changed text files>
git diff --check
```

- Prettier exit code: `0`; all `20` changed text files matched formatting rules.
- Diff-check exit code: `0`; no whitespace errors were found.
- Git emitted informational LF-to-CRLF working-copy warnings; these checks did not modify files.

## Workflow YAML validation

PyYAML `6.0.3` parsed each workflow with `PYTHONPYCACHEPREFIX` under `G:\my-sitess`.

```powershell
python -c "from pathlib import Path; import yaml; ... yaml.safe_load(...)"
```

- Exit code: `0`
- Parsed workflows: `3` of `3`
- Files: `ci.yml`, `dependabot-format.yml`, `deploy-pages.yml`

## Exhaustive simulated `/ThySite` resource resolution

An in-memory HTML-aware Node scanner resolved built `href`, `src`, `poster`, `srcset`, inline-style, style-block, and CSS `url()` references against the simulated project deployment.

- Exit code: `0`
- HTML files: `17`
- CSS files: `8`
- Local references: `419`
- Unique local endpoints: `75`
- References outside `/ThySite`: `0`
- Missing endpoints: `0`
- The Starlight favicon now resolves without a duplicate base prefix.

## Local browser verification

Because no interactive Codex browser surface was available, the runner used the installed Google Chrome `153.0.8010.53` in headless mode through the Chrome DevTools Protocol. No software was installed. The built output was copied to a project-contained server root and served at `http://127.0.0.1:4177/ThySite/`.

### Viewports and rendering

- Desktop: `1440 × 1000`
  - Buckleson wordmark visible.
  - Stylesheet and scripts loaded.
  - Restored light-mode body background: `rgb(255, 255, 255)`.
  - Horizontal overflow: `false`.
- Mobile: `390 × 844`
  - Buckleson wordmark and responsive menu visible.
  - Stylesheet and scripts loaded.
  - Body background: `rgb(255, 255, 255)`.
  - Horizontal overflow: `false`.

The desktop and mobile screenshots were also visually inspected and showed a styled, nonblank, responsive page.

### Network, navigation, and runtime

- Browser audit exit code: `0`
- Local network responses observed: `200`
- CSS/JavaScript response observations: `77`, covering `7` unique built CSS/JavaScript assets; all returned `200`.
- Internal navigation targets checked: `6`
  - `/ThySite/`
  - `/ThySite/products/`
  - `/ThySite/services/`
  - `/ThySite/blog/`
  - `/ThySite/contact/`
  - `/ThySite/#`
- Network loading failures: `0`
- Local responses with HTTP status `400` or higher: `0`
- Page exceptions: `0`
- Console errors: `0`
- Browser log errors: `0`

### Theme behavior

- Dark-theme control applied the `dark` state: passed.
- Dark state persisted after reload: passed.
- Light-theme control restored the light state: passed.
- Light state persisted after reload: passed.

### Browser artifacts

Artifacts are under `docs/test-artifacts/github-pages-base-final-20260922/`:

- `browser-results.json`
- `desktop-light.png` (initial system-preference render)
- `desktop-dark.png`
- `desktop-restored.png` (verified white/violet light render)
- `mobile-light.png`
- `server-root/ThySite/` (the exact staged project-path build)

The temporary HTTP server and the dedicated headless Chrome profile processes were stopped after verification.

## Gate decision

The GitHub Pages base-path repair is green. Build, focused and full tests, smoke routes, formatting, diff validation, workflow parsing, exhaustive resource resolution, and desktop/mobile browser checks all completed with observed zero exit codes and no unresolved failures.
