# Buckleson website

The public Buckleson website presents trust and execution infrastructure for safer AI adoption. It covers the Hyper Tern control layer, Hyper-ABS data abstraction, the in-house Hyper-0x verification layer, Hyper Wallet, Buckleson solutions, and an English-only AI safety Insights library.

## Local development

```sh
pnpm install
pnpm dev
```

Production verification:

```sh
pnpm build
node --test tests/*.test.mjs
pnpm test:smoke
```

The site uses Astro, Tailwind CSS, Preline, Anime.js, and Starlight. GitHub Pages is configured with the `/ThySite` project base. Internal links must use the existing path helpers so local and hosted builds behave consistently.

## Content and claim boundaries

- `Hyper-Ox_Pitch_Deck.pdf` is the authoritative product source for public copy.
- `docs/site-content-map.md` records source evidence, claim status, exclusions, imagery, and CTAs.
- `docs/asset-ledger.md` records deterministic image provenance and limitations.
- Product language is deliberately qualified. A tamper-evident record proves occurrence and integrity, not that an AI action was safe or correct.
- Customer names, fundraising figures, forecasts, guarantees, and unsupported security or privacy claims are excluded.

## Project workflow

Project-wide agent, YAGNI, workspace-boundary, Graft, and green-gate requirements are defined in `G:\my-sitess\AGENTS.md`. Current decisions and verification evidence are recorded in `G:\my-sitess\docs\architecture-record.md`.

Assessment booking: <https://cal.com/buckleson-group/30min>
