# Buckleson Public Content and Route Conversion Fix Plan

Date: 2026-09-23

Status: **OPEN — one stale smoke expectation remains**

## Ranked root-cause analysis

### 1. The homepage smoke expectation still contains the superseded headline

- **Failure:** `npm run test:smoke` served `/` successfully but reported `missing Use AI safely with`.
- **Evidence:** `src/copy/en.ts`, `docs/site-content-map.md`, the focused built-output test, and the fresh homepage all agree on the approved heading `Use AI safely. Prove every action.`. The other 41 smoke assertions passed.
- **Classification:** stale smoke-test data, not a production failure. Reverting production to `Use AI safely with` would contradict the approved copy and an already-green focused assertion.
- **Markup detail:** the generated heading contains a branding span between its two text segments: `Use AI safely. <span ...>Prove every action.</span>`. Because the smoke runner uses literal `html.includes`, one full plain-text string would not be contiguous in the raw HTML.
- **Smallest reliable fix:** replace the single stale homepage expectation with two exact fragments, `Use AI safely.` and `Prove every action.`. This keeps the smoke check independent of presentation classes while verifying both approved parts. Do not weaken it to only `Use AI safely`, and do not couple the assertion to the span's Tailwind classes.

## Repair and rerun sequence

1. In `scripts/smoke.mjs`, replace only `'Use AI safely with'` in `EXPECTATIONS['/']` with the two exact approved text fragments.
2. Format only `scripts/smoke.mjs` with the pinned Prettier and run its targeted `--check`; require exit code `0`.
3. Run `node --test tests/smoke-path.test.mjs`; require exit code `0`.
4. Run `npm run test:smoke` against the current fresh build; require all 42 assertions to pass and exit code `0`.
5. Run `npm run format:check` and `git diff --check`; require zero exit codes.
6. For the final recorded gate, rerun the build-first focused, related, and full test sequence before the final smoke command. Every command must exit `0` before the gate opens.

## Scope guard

- Do not edit production copy or the content map.
- Do not change the smoke runner's matching algorithm for one stale value.
- Do not assert presentation classes or raw span markup.
- Do not omit either half of the approved headline from smoke coverage.
