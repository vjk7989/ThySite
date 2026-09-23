# Architecture Record

## 2026-09-23 - Text-Only Buckleson Rollback

### Decision

Undo the full visual conversion from `f82578d` with a normal revert-style commit, then reapply only public Buckleson text and URL copy. The site keeps the restored ScrewFast template structure, imagery, theme, components, dependencies, contact route, and original `item-*` route family until the next approved image-selection pass.

### Changed Paths

- Public copy/content: `src/copy/en.ts`, `src/content/blog/en/post-*.md`, `src/content/insights/en/insight-*.md`, `src/content/products/en/item-*.md`, `src/data_files/faqs.json`, `src/data_files/features.json`, `src/data_files/pricing.json`, `src/views/HomeView.astro`.
- Text-only hardcoded public URL/text cleanup: `src/components/sections/misc/ContactSection.astro`.
- Verification: `tests/text-only-rollback.test.mjs`, restored route smoke expectations in `scripts/smoke.mjs`, and existing base-path tests.
- Rollback restoration/removal: generated Buckleson visual assets, diagrams, and visual-conversion-only components are removed; template assets/components/routes/dependencies are restored by the revert.

### Codebase Map Changes

- Product routes return to `src/content/products/en/item-a765.md`, `item-b203.md`, `item-f303.md`, and `item-t845.md`.
- Visual-conversion product slugs `hyper-tern`, `hyper-abs`, `hyper-0x`, and `hyper-wallet` are intentionally absent as routes.
- Contact route and demo form components are restored.
- `src/images/buckleson`, generated brand marks, and generated diagram files are intentionally absent.

### Verification Evidence

- `npm run build` -> exit `0`; 17 pages built.
- `node --test tests/text-only-rollback.test.mjs` -> exit `0`; 6 passed, 0 failed.
- `node --test tests/*.test.mjs` -> exit `0`; 48 passed, 0 failed.
- `npm run test:smoke` -> exit `0`; restored public routes return 200 and removed hyper/locale routes return 404.

### Unresolved Risks

- Restored template images are temporary placeholders and remain visually mismatched to Buckleson until the user approves which images to keep.
- The contact/demo forms remain demo-only until backend and privacy handling are approved.
