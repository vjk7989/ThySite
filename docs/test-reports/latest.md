# Final Text-only Rollback Verification

Date: 2026-09-23

Status: **GREEN**. The root runner observed zero exit codes for formatting, diff hygiene, focused tests, the production build, the full regression suite, and production smoke.

## Environment and working tree

- Workspace: `G:\my-sitess\ThySite`
- Test-runner role: no production or test code edited.
- `git status --short` was inspected read-only and exited `0`.
- The working tree contains the expected text-only rollback, formatter-normalization, documentation, and test changes.
- This report is the only file edited by this test-runner turn.

## Verification evidence

### Full formatting

Command: `npm run format:check`

- Observed exit code: `0`
- Formatter normalization is style-only; it does not introduce new product behavior or replace imagery.

### Diff whitespace

Command: `git diff --check`

- Observed exit code: `0`
- No diff whitespace errors were reported.

### Focused rollback test before build

Command: `node --test tests/text-only-rollback.test.mjs`

- Observed exit code: `0`
- Tests: 6
- Passed: 6
- Failed: 0
- Skipped: 0

### Production build

Command: `npm run build`

- Observed exit code: `0`
- Static output: 17 pages
- Optimized images: 45
- Astro errors: 0
- Diagnostics: known restored-template Astro hints only
- Visual assets remain the original template placeholders, as required by the text-only rollback scope.

### Focused rollback test after build

Command: `node --test tests/text-only-rollback.test.mjs`

- Observed exit code: `0`
- Tests: 6
- Passed: 6
- Failed: 0
- Skipped: 0
- The fresh built-output assertions passed.

### Full Node regression suite

Command: `node --test tests/*.test.mjs`

- Observed exit code: `0`
- Tests: 48
- Passed: 48
- Failed: 0
- Skipped: 0

### Production smoke

Command: `npm run test:smoke`

- Observed exit code: `0`
- Restored `item-*` product routes returned the expected `200` responses.
- Removed `hyper-*` product routes returned the expected `404` responses.
- Removed locale routes returned the expected `404` responses.

## Conclusion

The text-only rollback gate is green. The template structure, visual design, components, routes, and placeholder assets are restored; public copy remains Buckleson-specific. Formatter normalization is style-only, and all required checks completed with observed zero exit codes.
