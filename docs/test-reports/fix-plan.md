# Local pnpm 12 Verification Harness Fix Plan

Date: 2026-09-22  
Gate status: **CLOSED — repository checks pass, but clean install/build proof remains unrun**

## Ranked root-cause analysis

### P0 — Local Corepack metadata points at a nonexistent pnpm entry file

The workspace-contained Corepack cache has the correct pnpm `12.5.1` package
at:

```text
G:\my-sitess\.tools\corepack\v1\pnpm\12.5.1
```

Its generated `.corepack` metadata maps `pnpm` to `./bin/pnpm.cjs`, but the
package actually contains `bin/pnpm.mjs`. Corepack 0.33.0 therefore fails with
`MODULE_NOT_FOUND` before pnpm starts.

This is a local Corepack cache/launcher defect, not a repository defect:

- `package.json` correctly pins `pnpm@12.5.1`;
- `pnpm-workspace.yaml` correctly allows only `esbuild` builds;
- focused deployment tests pass 7/7;
- the full Node suite passes 34/34; and
- `pnpm-lock.yaml` is unchanged.

### P1 — The verification harness depends unnecessarily on the broken wrapper

The cached package's real ESM entry point is executable directly with Node. A
read-only version probe has already demonstrated:

```powershell
node 'G:\my-sitess\.tools\corepack\v1\pnpm\12.5.1\bin\pnpm.mjs' --version
```

Result: exit code `0`, version `12.5.1`. pnpm downloaded its Windows native
binary to
`G:\my-sitess\.tools\corepack\v1\pnpm\12.5.1\pnpm-native.exe`, so the
bootstrap and executable remain inside the required workspace boundary.

## Smallest correction

Do not change any tracked repository file. Replace only the local verification
command prefix:

```powershell
$pnpmCli = 'G:\my-sitess\.tools\corepack\v1\pnpm\12.5.1\bin\pnpm.mjs'
node $pnpmCli <arguments>
```

Do not repair `.corepack`, create a fake `pnpm.cjs`, modify the system Corepack
installation, activate a global package manager, or write a shim outside
`G:\my-sitess`.

If the cached package is later unavailable, the fallback is an isolated
workspace-contained fetch of exact `pnpm@12.5.1` using npm with
`npm_config_cache`, `TEMP`, and `TMP` under `G:\my-sitess`, followed by direct
Node execution of its `bin/pnpm.mjs`. Do not use an unpinned `npx pnpm` or
`latest`.

## Clean frozen-install and build rerun

1. Keep all generated state under `G:\my-sitess`:

   ```powershell
   $env:TEMP = 'G:\my-sitess\.tmp'
   $env:TMP = 'G:\my-sitess\.tmp'
   $env:PNPM_HOME = 'G:\my-sitess\.tools\pnpm-home'
   $env:PNPM_STORE_DIR = 'G:\my-sitess\.cache\pnpm12-store'
   $env:npm_config_cache = 'G:\my-sitess\.cache\npm'
   $env:XDG_CACHE_HOME = 'G:\my-sitess\.cache\xdg'
   $pnpmCli = 'G:\my-sitess\.tools\corepack\v1\pnpm\12.5.1\bin\pnpm.mjs'
   ```

2. Create a new isolated verification directory under `G:\my-sitess\.tmp`.
   Copy the current project into it while excluding `.git`, `node_modules`,
   `dist`, and `.astro`. The copy must include source, tests, scripts,
   `package.json`, `pnpm-lock.yaml`, and `pnpm-workspace.yaml`; the previous
   three-file directory is insufficient for build verification.
3. Record the source lockfile SHA-256, change to the isolated copy, then run:

   ```powershell
   node $pnpmCli --version
   node $pnpmCli install --frozen-lockfile --store-dir 'G:\my-sitess\.cache\pnpm12-store' --cache-dir 'G:\my-sitess\.cache\pnpm12-cache' --state-dir 'G:\my-sitess\.cache\pnpm12-state' --reporter=append-only
   node $pnpmCli ignored-builds
   node $pnpmCli run build
   node $pnpmCli run test:smoke
   ```

4. Required clean-install evidence:
   - the version is exactly `12.5.1`;
   - frozen install exits `0`;
   - output contains no `ERR_PNPM_IGNORED_BUILDS`;
   - esbuild is the only dependency build authorized by project policy;
   - `pnpm ignored-builds` reports no unreviewed dependency builds;
   - build and smoke commands exit `0`;
   - the isolated and source lockfile hashes remain identical to the recorded
     pre-install hash; and
   - filesystem checks confirm every cache, store, temporary file, native pnpm
     binary, and verification copy is under `G:\my-sitess`.
5. If pnpm reports another package with a build script, stop and return to the
   failure-planner. Do not expand the allowlist automatically.

## Remaining gate sequence

After the isolated install/build proof succeeds, return to the real repository
and rerun without changing files:

```powershell
node --test tests/github-pages-deployment.test.mjs
node --test tests/*.test.mjs
node '.\node_modules\prettier\bin\prettier.cjs' --check -- <Git-derived changed paths>
npm run build
npm run test:smoke
npm run format:check
```

Replace `docs/test-reports/latest.md` with exact commands, exit codes, counts,
lockfile hashes, ignored-build output, and artifact paths. Preserve the existing
full-format baseline classification only after reconfirming zero overlap with
the changed path set.

## Hosted rerun criteria

Once the local clean-install gate is green, push the already-tested repository
repair and rerun GitHub Pages. Require the hosted action to select pnpm
`12.5.1`, complete frozen dependency installation without ignored builds,
build and upload the Astro artifact, run the deploy job, expose the Pages URL,
and serve `https://www.buckleson.com/` successfully.

## Failure-to-fix mapping

| Failure                                  | Classification                           | Smallest correction                                     | Acceptance evidence                                    |
| ---------------------------------------- | ---------------------------------------- | ------------------------------------------------------- | ------------------------------------------------------ |
| Corepack requests missing `bin/pnpm.cjs` | Local tool-cache metadata defect         | Invoke cached `bin/pnpm.mjs` directly with Node         | Version probe exits 0 and prints 12.5.1                |
| No frozen install occurred               | Verification blocked before pnpm startup | Run the same install through the direct ESM entry point | Frozen install exits 0 with no ignored-build error     |
| Build/smoke were skipped                 | Downstream of launcher failure           | Build and smoke in a complete isolated project copy     | Both commands exit 0                                   |
| Repository pin and allowlist             | Already-correct repo state               | Preserve unchanged                                      | Existing 7/7 focused and 34/34 full tests remain green |

## Guardrails

- Do not edit product code, workflows, tests, package configuration, build
  policy, or lockfile to work around this machine-specific launcher defect.
- Do not weaken `allowBuilds`, disable strict dependency builds, or approve more
  than esbuild.
- Do not write to another drive, the user profile, a global package directory,
  or the system Corepack installation.
- Keep the gate closed until clean local install/build/smoke and the hosted
  Pages rerun both succeed.
