import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

async function source(path) {
  return readFile(resolve(ROOT, path), 'utf8');
}

function token(css, name) {
  const match = css.match(new RegExp(`--${name}:\\s*([^;]+);`));
  assert.ok(match, `expected CSS token --${name}`);
  return match[1].trim().toLowerCase();
}

function rgb(hex) {
  const normalized = hex.replace('#', '');
  assert.match(
    normalized,
    /^[0-9a-f]{6}$/i,
    `invalid six-digit hex color: ${hex}`
  );
  return [0, 2, 4].map(offset =>
    Number.parseInt(normalized.slice(offset, offset + 2), 16)
  );
}

function relativeLuminance(hex) {
  const channels = rgb(hex).map(value => {
    const channel = value / 255;
    return channel <= 0.04045
      ? channel / 12.92
      : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrastRatio(foreground, background) {
  const lighter = Math.max(
    relativeLuminance(foreground),
    relativeLuminance(background)
  );
  const darker = Math.min(
    relativeLuminance(foreground),
    relativeLuminance(background)
  );
  return (lighter + 0.05) / (darker + 0.05);
}

test('declares the approved reusable Buckleson light-theme tokens', async () => {
  const css = await source('src/assets/styles/global.css');

  assert.equal(token(css, 'color-brand-500'), '#8f00ff');
  assert.equal(token(css, 'color-brand-600'), '#7300e6');
  assert.equal(token(css, 'color-brand-soft'), '#f4ecff');
  assert.equal(token(css, 'color-brand-ink'), '#111827');
  assert.equal(token(css, 'color-white'), '#fff');
});

test('uses a white light canvas while retaining the established dark canvas', async () => {
  const layout = await source('src/layouts/MainLayout.astro');

  assert.match(layout, /<body class="[^"]*\bbg-white\b[^"]*"/);
  assert.match(layout, /<body class="[^"]*\bdark:bg-neutral-800\b[^"]*"/);
  assert.doesNotMatch(layout, /<body class="[^"]*\bbg-neutral-200\b[^"]*"/);
});

test('renders both CTA branches with brand light states and restored dark states', async () => {
  const [css, primaryCta] = await Promise.all([
    source('src/assets/styles/global.css'),
    source('src/components/ui/buttons/PrimaryCTA.astro'),
  ]);
  const violet = token(css, 'color-brand-600');

  assert.match(
    primaryCta,
    /yellow:\s*'[^']*\btext-white\b[^']*\bbg-brand-600\b/
  );
  assert.match(primaryCta, /yellow:\s*'[^']*\bhover:bg-brand-700\b/);
  assert.match(
    primaryCta,
    /orange:\s*\n?\s*'[^']*\btext-white\b[^']*\bbg-brand-600\b[^']*\bhover:bg-brand-700\b[^']*\bactive:bg-brand-700\b/
  );
  assert.match(
    primaryCta,
    /orange:\s*\n?\s*'[^']*\bdark:bg-orange-400\b[^']*\bdark:text-neutral-50\b[^']*\bdark:hover:bg-orange-500\b[^']*\bdark:active:bg-orange-500\b/
  );
  assert.match(
    primaryCta,
    /yellow:\s*'[^']*\bdark:bg-yellow-400\b[^']*\bdark:text-neutral-800\b[^']*\bdark:hover:bg-yellow-500\b/
  );
  assert.ok(
    contrastRatio('#ffffff', violet) >= 4.5,
    `white on ${violet} must meet WCAG AA for normal text`
  );
});

test('uses brand highlights in light copy and restores yellow in dark mode', async () => {
  const copy = await source('src/copy/en.ts');
  const highlights = [...copy.matchAll(/text-brand-500 dark:text-yellow-400/g)];

  assert.equal(highlights.length, 2);
});

test('uses brand stars in light mode and restores yellow stars in dark mode', async () => {
  const stars = await Promise.all([
    source('src/components/ui/stars/FullStar.astro'),
    source('src/components/ui/stars/HalfStar.astro'),
  ]);

  for (const star of stars) {
    assert.match(star, /\btext-brand-500\b/);
    assert.match(star, /\bdark:text-yellow-400\b/);
  }
});

test('uses a plain brand announcement in light mode and its existing dark image', async () => {
  const announcement = await source(
    'src/components/ui/banners/AnnouncementBanner.astro'
  );

  assert.match(announcement, /\bbg-brand-600\b/);
  assert.match(announcement, /\bbg-none\b/);
  assert.match(announcement, /\bdark:bg-neutral-200\b/);
  assert.match(
    announcement,
    /import\s*\{\s*sitePath\s*\}\s*from\s*'@utils\/paths'/
  );
  assert.match(
    announcement,
    /style=\{`--banner-pattern: url\("\$\{sitePath\('\/banner-pattern\.svg'\)\}"\)`\}/
  );
  assert.match(
    announcement,
    /:global\(\.dark\) \.banner-pattern\s*\{\s*background-image:\s*var\(--banner-pattern\);\s*\}/
  );
  assert.doesNotMatch(
    announcement,
    /(?:^|\s)bg-\[url\('\/banner-pattern\.svg'\)\]/
  );
  assert.doesNotMatch(announcement, /\bdark:bg-\[url/);
  assert.doesNotMatch(announcement, /background-image:\s*url\(/);
});

test('uses brand active navigation in light mode and orange in dark mode', async () => {
  const navLink = await source('src/components/ui/links/NavLink.astro');

  assert.match(
    navLink,
    /classList\.add\('text-brand-600',\s*'dark:text-orange-300'\)/
  );
});

test('contains no unprefixed legacy yellow or orange utilities in targeted visuals', async () => {
  const targetedPaths = [
    'src/components/ui/buttons/PrimaryCTA.astro',
    'src/copy/en.ts',
    'src/components/ui/stars/FullStar.astro',
    'src/components/ui/stars/HalfStar.astro',
    'src/components/ui/banners/AnnouncementBanner.astro',
    'src/components/ui/links/NavLink.astro',
  ];
  const unprefixedLegacyUtility =
    /(?:^|[\s"'=])(?!(?:dark:))(?:(?:hover|active|focus|focus-visible|group-hover):)*(?:bg|text|border|ring|shadow|caret)-(?:yellow|orange)-\d+(?:\/\d+)?/m;

  for (const path of targetedPaths) {
    assert.doesNotMatch(
      await source(path),
      unprefixedLegacyUtility,
      `${path} contains an unprefixed legacy yellow/orange utility`
    );
  }
});

test('uses the temporary Buckleson wordmark without retaining ScrewFast artwork', async () => {
  const [logo, navbar, megaMenu] = await Promise.all([
    source('src/components/BrandLogo.astro'),
    source('src/components/sections/navbar&footer/Navbar.astro'),
    source('src/components/sections/navbar&footer/NavbarMegaMenu.astro'),
  ]);

  assert.match(logo, />Buckleson</);
  assert.match(logo, /\bbg-brand-500\b/);
  assert.doesNotMatch(logo, /<svg\b|ScrewFast/i);
  assert.match(navbar, /aria-label="Buckleson home"/);
  assert.match(megaMenu, /aria-label="Buckleson home"/);
});

test('keeps existing neutral dark surfaces on layouts and navigation', async () => {
  const [layout, navbar, megaMenu] = await Promise.all([
    source('src/layouts/MainLayout.astro'),
    source('src/components/sections/navbar&footer/Navbar.astro'),
    source('src/components/sections/navbar&footer/NavbarMegaMenu.astro'),
  ]);

  assert.match(layout, /\bdark:bg-neutral-800\b/);
  for (const navigation of [navbar, megaMenu]) {
    assert.match(navigation, /\bdark:border-neutral-700\/40\b/);
    assert.match(navigation, /\bdark:bg-neutral-800\/80\b/);
  }
});

test('records the required product positioning and design constraints', async () => {
  const [product, design] = await Promise.all([
    source('PRODUCT.md'),
    source('DESIGN.md'),
  ]);

  assert.match(
    product,
    /Buckleson helps organizations, AI teams, developers, and individuals/i
  );
  assert.match(
    product,
    /Hyper-0x is Buckleson's in-house trust and execution layer/i
  );
  assert.match(product, /Request an AI Safety Assessment/);
  assert.match(product, /Never claim.+guarantees privacy or compliance/is);

  assert.match(design, /#8F00FF/i);
  assert.match(design, /#7300E6/i);
  assert.match(design, /#F4ECFF/i);
  assert.match(design, /#FFFFFF/i);
  assert.match(design, /#111827/i);
  assert.match(design, /WCAG 2\.2 AA/i);
  assert.match(design, /Dark surfaces: preserve the existing neutral palette/i);
});
