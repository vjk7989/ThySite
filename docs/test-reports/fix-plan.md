# Final Light-Theme Visual Gate Fix Plan

Date: 2026-09-22  
Gate status: **CLOSED — rendered light-theme accents remain orange/yellow**

## Ranked root causes and smallest production fixes

### P0 — The live hero uses the untouched default CTA variant

Unit 1 changed the `yellow` branch in
`src/components/ui/buttons/PrimaryCTA.astro`, but the hero calls `PrimaryCTA`
without a variant. Its actual `orange` default therefore still renders
`bg-orange-400`, `hover:bg-orange-500`, and `active:bg-orange-500`.

Change only the default branch to use the approved light-theme tokens while
adding explicit dark overrides:

```ts
orange:
  'text-white bg-brand-600 hover:bg-brand-700 active:bg-brand-700 dark:text-neutral-50 dark:bg-orange-400 dark:hover:bg-orange-500 dark:active:bg-orange-500',
```

Keep the public variant names and all call sites unchanged. This fixes every
default `PrimaryCTA` user without an API migration and preserves its previous
dark appearance.

### P1 — Homepage copy embeds light yellow classes

`src/copy/en.ts` contains two HTML fragments with
`text-yellow-500 dark:text-yellow-400`: the hero's highlighted `ScrewFast` text
and the later feature-navigation heading.

Replace only the light class in both fragments:

```text
text-brand-500 dark:text-yellow-400
```

Do not rewrite the words in this visual gate; the approved content replacement
remains a later unit.

### P2 — Rating icons hard-code yellow in both star components

`src/components/ui/stars/FullStar.astro` and
`src/components/ui/stars/HalfStar.astro` both use
`text-yellow-500 dark:text-yellow-400`.

Replace the light class with `text-brand-500` and retain
`dark:text-yellow-400`. Do not remove the ratings or avatars in this unit; the
content map already defers that proof-content change.

### P3 — The announcement applies a yellow/orange asset in both themes

`src/components/ui/banners/AnnouncementBanner.astro` applies
`bg-[url('/banner-pattern.svg')]` without a theme prefix. The image is the
yellow/orange pattern dominating the screenshots.

Use a solid violet light surface and restore the existing image only in dark
mode:

```text
bg-brand-600 bg-none ... dark:bg-neutral-200 dark:bg-[url('/banner-pattern.svg')]
```

Keep its existing white light-theme text/border and neutral dark-theme
text/border classes. Do not change the banner copy or destination in this
color-only fix.

### P4 — The active navigation state remains orange

The screenshots also show the active `Home` link in orange.
`src/components/ui/links/NavLink.astro` adds `text-orange-400` at runtime while
also adding `dark:text-orange-300`.

Change only the light active class to `text-brand-600`; retain
`dark:text-orange-300`. This prevents a visible orange exception in the same
header being evaluated by the gate.

## Failure-to-file mapping

| Visual failure                     | File and current class/path                              | Minimal replacement                                                          |
| ---------------------------------- | -------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Orange primary hero CTA            | `PrimaryCTA.astro`, default `orange` variant             | Light `bg-brand-600` with brand hover/active; explicit dark orange overrides |
| Yellow hero highlight              | `copy/en.ts`, hero title HTML                            | `text-brand-500 dark:text-yellow-400`                                        |
| Yellow later heading highlight     | `copy/en.ts`, feature-nav title HTML                     | `text-brand-500 dark:text-yellow-400`                                        |
| Yellow rating stars                | `FullStar.astro` and `HalfStar.astro`                    | `text-brand-500 dark:text-yellow-400`                                        |
| Yellow/orange announcement pattern | `AnnouncementBanner.astro`, unqualified background image | Violet/no-image in light; existing pattern restored with `dark:`             |
| Orange active navigation           | `NavLink.astro`, runtime `classList.add`                 | `text-brand-600` in light; retain `dark:text-orange-300`                     |

## Required test-author updates

Update `tests/brand-foundation.test.mjs` without changing production code:

1. Correct the CTA regression to inspect the live default `orange` branch,
   requiring `bg-brand-600`, brand hover/active states, and explicit dark
   orange restoration. Keep the existing AA contrast calculation for white on
   `brand-600`.
2. Add focused source assertions for both copy highlights, both star
   components, the announcement's light/dark background split, and the active
   navigation light/dark split.
3. Assert that unprefixed light `text-yellow-500`, `text-orange-400`,
   `bg-orange-400`, and the unqualified banner-pattern class no longer exist in
   those targeted visual paths. Do not reject the corresponding `dark:`
   classes.
4. Keep tests scoped to the observed homepage chrome and accents. Do not add
   assertions requiring content, ratings, images, pricing, or sections to be
   replaced in this gate.

## Verification sequence

The test-runner must format only the changed production and test files, then
record exact commands, exit codes, pass/fail counts, and artifact paths:

```powershell
node --test tests/brand-foundation.test.mjs
node --test tests/*.test.mjs
node '.\node_modules\prettier\bin\prettier.cjs' --check -- <Git-derived changed paths>
npm run build
npm run test:smoke
node docs/test-artifacts/visual-check.mjs
npm run format:check
```

The browser verification must repeat 390×844, 768×1024, and 1440×1000 light
screenshots and assert computed styles, not screenshots alone:

- Primary hero CTA background: `#7300E6`.
- Hero highlight and rating stars: `#8F00FF`.
- Active navigation: `#7300E6`.
- Announcement: violet background and `background-image: none` in light mode.
- Dark mode: previous neutral canvas and foreground remain unchanged; CTA stays
  orange, highlight/stars stay yellow, active navigation stays orange, and the
  existing announcement pattern remains visible.
- Theme persistence, keyboard focus, and zero horizontal overflow remain green.

After the computed-style assertions pass, manually inspect the regenerated
screenshots for all three viewports. Replace
`docs/test-reports/latest.md` with the new visual evidence.

## Acceptance and guardrails

- All focused and full Node tests, changed-file formatting, build, smoke, and
  visual assertions must exit `0` before the architecture record is updated.
- Reconfirm that any repository-wide Prettier warnings have zero overlap with
  the changed path set before retaining the established baseline exception.
- Preserve orange/yellow only behind explicit `dark:` variants in the targeted
  files.
- Do not recolor the construction product photograph or rewrite/remove
  ScrewFast copy, ratings, avatars, pricing, or deeper template sections; those
  are content/image replacement work already deferred by the approved plan.
- Do not rename CTA variants, alter component interfaces, replace assets, or
  introduce new dependencies.
