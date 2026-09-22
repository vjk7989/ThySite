# Buckleson Design System

## Physical scene and strategy

A mixed technical and executive team reviews AI deployment risk in a bright meeting room, then revisits the same evidence in a dim operations environment. The light theme uses Violet Bloom's white-and-violet clarity; the dark theme uses Vercel's high-contrast black-and-white surfaces.

The light theme uses a restrained strategy: white is the primary surface and violet is reserved for identity, focus, links, and primary actions. Typography remains stable across theme changes.

## Color tokens

- Light primary: `oklch(0.5393 0.2713 286.7462)` (`brand-500`)
- Light canvas: `oklch(0.994 0 0)`
- Light ink: `oklch(0 0 0)`
- Light soft accent: `oklch(0.9393 0.0288 266.368)`
- Dark canvas: `oklch(0 0 0)`
- Dark card: `oklch(0.14 0 0)`
- Dark foreground: `oklch(1 0 0)`

Normal text must meet WCAG 2.2 AA contrast of at least 4.5:1. Use white text on `brand-600` for primary controls; do not use `brand-500` for normal-sized text on white.

## Typography and layout

- Keep the existing type family and responsive rhythm.
- Keep prose between 65 and 75 characters where practical.
- Balance headings and avoid display sizes above 6rem.
- Use violet as a functional accent, not decorative noise.

## Interaction

- Keyboard focus must remain visible with violet focus rings in the light theme.
- Theme selection persists through the existing `hs_theme` storage behavior.
- Motion must respect `prefers-reduced-motion`.
- Use the approved Buckleson mark as black on transparent light surfaces and white on transparent dark surfaces. Keep the mark circular and pair it with an accessible text wordmark.
