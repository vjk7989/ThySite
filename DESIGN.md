# Buckleson Design System

## Physical scene and strategy

A mixed technical and executive team reviews AI deployment risk in a bright meeting room, then revisits the same evidence in a dim operations environment. The light theme therefore prioritizes white clarity and electric-violet identity; the existing neutral dark theme remains familiar and low-glare.

The light theme uses a restrained strategy: white is the primary surface and electric violet is reserved for identity, focus, links, and primary actions.

## Color tokens

- Electric violet: `#8F00FF` (`brand-500`)
- Strong/interactive violet: `#7300E6` (`brand-600`)
- Soft violet surface: `#F4ECFF` (`brand-soft`)
- Light canvas: `#FFFFFF`
- Light-theme ink: `#111827` (`brand-ink`)
- Dark surfaces: preserve the existing neutral palette and component-specific dark variants.

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
- The temporary brand treatment is a text wordmark with a violet dot; replace it in-place when the approved logo arrives.
