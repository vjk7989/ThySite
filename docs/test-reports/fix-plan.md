# Unit 4 Authored-File Formatting Fix Plan

Date: 2026-09-22  
Gate status: **CLOSED — nine authored source/test files fail Prettier**

## Ranked root-cause analysis

### P0 — Nine Unit 4 authored files have mechanical formatting drift

The fresh build passed and all `23` focused assertions passed. The targeted
check found eight formatting failures; the authoritative Git-derived check
found the same eight plus `src/utils/content.ts`, which was omitted from the
targeted list.

The complete failing set is:

1. `src/content.config.ts`;
2. `src/utils/content.ts`;
3. `src/components/sections/products/ProductDetail.astro`;
4. `src/components/sections/products/ModuleDiagram.astro`;
5. `src/views/ProductView.astro`;
6. `src/views/ProductsIndexView.astro`;
7. `src/views/ServicesView.astro`;
8. `tests/platform-solutions-conversion.test.mjs`; and
9. `tests/homepage-conversion.test.mjs`.

These are all human-authored production or test files. No behavior failure is
reported at this gate.

### P1 — No generated or checksum-bound artifact is in the repair set

None of the nine paths is under `dist/`, `.astro/`, or `docs/diagrams/`.
`.prettierignore` already excludes all three generated locations, including the
five Archify HTML deliveries and their checksum-bound receipts.

The four new product Markdown entries, `scripts/smoke.mjs`, and
`src/views/HomeView.astro` passed targeted formatting and must not be rewritten
as part of this repair. No diagram HTML or receipt may be formatted.

### P2 — Later verification is blocked only by formatting

Archify integrity, the full suite, exhaustive URL/route verification, diff
validation, and smoke were not run because formatting exited `1`. They are
downstream-unrun, not failed.

## Smallest safe fix

Mechanically format exactly the nine reported authored files with the installed
repository version of Prettier:

```powershell
node .\node_modules\prettier\bin\prettier.cjs --write -- src/content.config.ts src/utils/content.ts src/components/sections/products/ProductDetail.astro src/components/sections/products/ModuleDiagram.astro src/views/ProductView.astro src/views/ProductsIndexView.astro src/views/ServicesView.astro tests/platform-solutions-conversion.test.mjs tests/homepage-conversion.test.mjs
```

Do not hand-edit logic while applying this repair. Do not run repository-wide
`format:fix`. Do not add already-green authored files merely for consistency.
Do not format anything in `dist/`, `.astro/`, or `docs/diagrams/`.

After the write, inspect the diff for these nine paths and require it to contain
only formatter-controlled layout, indentation, wrapping, quote, delimiter, and
line-ending changes. If the diff exposes a semantic change, stop and return it
to the failure-planner instead of accepting it as formatting.

## Failure-to-fix mapping

| Failure                                                         | Classification                               | Smallest correction                    | Preserved guarantee                                          |
| --------------------------------------------------------------- | -------------------------------------------- | -------------------------------------- | ------------------------------------------------------------ |
| Eight targeted files fail Prettier                              | Authored-file formatting drift               | Prettier-write those exact eight files | Unit 4 source and assertion behavior remain unchanged        |
| `src/utils/content.ts` additionally fails the Git-derived check | Targeted list omission plus formatting drift | Include it as the ninth exact path     | Product ordering/path logic remains covered by focused tests |
| Archify/full/route/diff/smoke unrun                             | Downstream gate stop                         | Resume after the exact-path write      | Every later check must return observed exit code `0`         |

## Required rerun sequence

After the primary agent applies the exact nine-file formatter write, the
independent test-runner should execute and record:

1. Verify the exact repair set and formatting before rebuilding:

   ```powershell
   node .\node_modules\prettier\bin\prettier.cjs --check -- src/content.config.ts src/utils/content.ts src/components/sections/products/ProductDetail.astro src/components/sections/products/ModuleDiagram.astro src/views/ProductView.astro src/views/ProductsIndexView.astro src/views/ServicesView.astro tests/platform-solutions-conversion.test.mjs tests/homepage-conversion.test.mjs
   git diff --check -- src/content.config.ts src/utils/content.ts src/components/sections/products/ProductDetail.astro src/components/sections/products/ModuleDiagram.astro src/views/ProductView.astro src/views/ProductsIndexView.astro src/views/ServicesView.astro tests/platform-solutions-conversion.test.mjs tests/homepage-conversion.test.mjs
   ```

2. Run the authoritative Git-derived changed-file Prettier check with
   `.prettierignore` honored. Require no `docs/diagrams/**`, `dist/**`, or
   `.astro/**` path in the effective checked set.
3. Run the fresh typecheck and production build:

   ```powershell
   npm run build
   ```

4. Run the focused Unit 4 and coupled homepage suites against that fresh build:

   ```powershell
   node --test tests/platform-solutions-conversion.test.mjs
   node --test tests/homepage-conversion.test.mjs
   ```

5. Verify all five Archify delivered HTML files still match their recorded
   receipt SHA-256 values and byte counts, with no `docs/diagrams/**` mutation.
   Preserve the existing `hyper-tern` receipt's truthful `fail` status.
6. Run the full Node regression suite against the same fresh build:

   ```powershell
   node --test tests/*.test.mjs
   ```

7. Run the exhaustive built-HTML URL inventory and new/removed product-route
   verification. Require zero URLs outside `/ThySite`, zero missing local
   targets, all four new product routes present, and all four legacy `item-*`
   routes absent.
8. Run repository diff validation and route/content smoke:

   ```powershell
   git diff --check
   npm run test:smoke
   ```

Every command must have an observed exit code of `0`. Replace
`docs/test-reports/latest.md` with exact commands, exit codes, test counts,
build/page/image counts, formatting results, receipt hashes/byte counts, route
inventory, and smoke results, then check that report itself with Prettier.

## Guardrails

- Keep all work, caches, reports, and generated output under `G:\my-sitess`.
- Limit the write to the nine reported authored paths.
- Do not format or mutate checksum-bound Archify artifacts.
- Do not mix behavior changes into this formatting repair.
- Keep the Unit 4 gate closed until every listed rerun returns an observed zero
  exit code.
