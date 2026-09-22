import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import { dirname, isAbsolute, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const WORKSPACE = resolve(ROOT, '..');

async function source(path) {
  return readFile(resolve(ROOT, path), 'utf8');
}

function declarations(css, selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = css.match(new RegExp(`${escaped}\\s*\\{([\\s\\S]*?)\\}`));
  assert.ok(match, `expected ${selector} declaration block`);
  return new Map(
    [...match[1].matchAll(/--([\w-]+):\s*([^;]+);/g)].map(entry => [
      entry[1],
      entry[2].trim(),
    ])
  );
}

async function png(path) {
  const absolute = resolve(ROOT, path);
  await access(absolute);
  const image = sharp(absolute).ensureAlpha();
  const metadata = await image.metadata();
  const { data, info } = await image
    .raw()
    .toBuffer({ resolveWithObject: true });
  return { metadata, data, info };
}

function visiblePixelStats(image) {
  let transparent = 0;
  let opaque = 0;
  let min = 255;
  let max = 0;
  for (
    let offset = 0;
    offset < image.data.length;
    offset += image.info.channels
  ) {
    const alpha = image.data[offset + 3];
    if (alpha === 0) transparent += 1;
    if (alpha >= 200) {
      opaque += 1;
      for (let channel = 0; channel < 3; channel += 1) {
        min = Math.min(min, image.data[offset + channel]);
        max = Math.max(max, image.data[offset + channel]);
      }
    }
  }
  return { transparent, opaque, min, max };
}

test('ports the exact Violet Bloom semantic tokens for light mode', async () => {
  const light = declarations(
    await source('src/assets/styles/global.css'),
    ':root'
  );

  assert.deepEqual(
    Object.fromEntries(
      [
        'background',
        'foreground',
        'card',
        'card-foreground',
        'popover',
        'popover-foreground',
        'primary',
        'primary-foreground',
        'secondary',
        'secondary-foreground',
        'muted',
        'muted-foreground',
        'accent',
        'accent-foreground',
        'destructive',
        'destructive-foreground',
        'border',
        'input',
        'ring',
        'radius',
      ].map(name => [name, light.get(name)])
    ),
    {
      background: 'oklch(0.994 0 0)',
      foreground: 'oklch(0 0 0)',
      card: 'oklch(0.994 0 0)',
      'card-foreground': 'oklch(0 0 0)',
      popover: 'oklch(0.9911 0 0)',
      'popover-foreground': 'oklch(0 0 0)',
      primary: 'oklch(0.5393 0.2713 286.7462)',
      'primary-foreground': 'oklch(1 0 0)',
      secondary: 'oklch(0.954 0.0063 255.4755)',
      'secondary-foreground': 'oklch(0.1344 0 0)',
      muted: 'oklch(0.9702 0 0)',
      'muted-foreground': 'oklch(0.4386 0 0)',
      accent: 'oklch(0.9393 0.0288 266.368)',
      'accent-foreground': 'oklch(0.5445 0.1903 259.4848)',
      destructive: 'oklch(0.629 0.1902 23.0704)',
      'destructive-foreground': 'oklch(1 0 0)',
      border: 'oklch(0.93 0.0094 286.2156)',
      input: 'oklch(0.9401 0 0)',
      ring: 'oklch(0.5393 0.2713 286.7462)',
      radius: '1.4rem',
    }
  );
  assert.equal(light.get('shadow-opacity'), '0.16');
});

test('ports the exact Vercel semantic tokens for dark mode', async () => {
  const dark = declarations(
    await source('src/assets/styles/global.css'),
    '.dark'
  );

  assert.deepEqual(
    Object.fromEntries(
      [
        'background',
        'foreground',
        'card',
        'card-foreground',
        'popover',
        'popover-foreground',
        'primary',
        'primary-foreground',
        'secondary',
        'secondary-foreground',
        'muted',
        'muted-foreground',
        'accent',
        'accent-foreground',
        'destructive',
        'destructive-foreground',
        'border',
        'input',
        'ring',
        'radius',
      ].map(name => [name, dark.get(name)])
    ),
    {
      background: 'oklch(0 0 0)',
      foreground: 'oklch(1 0 0)',
      card: 'oklch(0.14 0 0)',
      'card-foreground': 'oklch(1 0 0)',
      popover: 'oklch(0.18 0 0)',
      'popover-foreground': 'oklch(1 0 0)',
      primary: 'oklch(1 0 0)',
      'primary-foreground': 'oklch(0 0 0)',
      secondary: 'oklch(0.25 0 0)',
      'secondary-foreground': 'oklch(1 0 0)',
      muted: 'oklch(0.23 0 0)',
      'muted-foreground': 'oklch(0.72 0 0)',
      accent: 'oklch(0.32 0 0)',
      'accent-foreground': 'oklch(1 0 0)',
      destructive: 'oklch(0.69 0.2 23.91)',
      'destructive-foreground': 'oklch(0 0 0)',
      border: 'oklch(0.26 0 0)',
      input: 'oklch(0.32 0 0)',
      ring: 'oklch(0.72 0 0)',
      radius: '0.5rem',
    }
  );
  assert.equal(dark.get('shadow-opacity'), '0.18');
});

test('maps semantic colors without changing the existing system typography', async () => {
  const [css, design] = await Promise.all([
    source('src/assets/styles/global.css'),
    source('DESIGN.md'),
  ]);

  for (const token of [
    'background',
    'foreground',
    'card',
    'card-foreground',
    'primary',
    'primary-foreground',
    'muted',
    'muted-foreground',
    'border',
    'input',
    'ring',
  ]) {
    assert.match(css, new RegExp(`--color-${token}:\\s*var\\(--${token}\\);`));
  }
  assert.doesNotMatch(css, /--font-(?:sans|serif|mono|family)\s*:/);
  assert.match(design, /Keep the existing type family/i);
});

test('renders accessible light and dark logo variants with circular clipping', async () => {
  const logo = await source('src/components/BrandLogo.astro');

  assert.match(logo, /buckleson-mark-light\.png/);
  assert.match(logo, /buckleson-mark-dark\.png/);
  assert.match(logo, /rounded-full/);
  assert.match(logo, /src=\{lightMark\.src\}[\s\S]*?dark:hidden/);
  assert.match(logo, /src=\{darkMark\.src\}[\s\S]*?hidden[\s\S]*?dark:block/);
  assert.match(logo, /<span>Buckleson<\/span>/);
  assert.doesNotMatch(logo, /\bbg-brand-(?:500|600)\b/);
  assert.doesNotMatch(logo, /<svg\b|ScrewFast/i);
});

test('logo variants are square transparent PNGs with matching masks', async () => {
  const [light, dark] = await Promise.all([
    png('src/images/brand/buckleson-mark-light.png'),
    png('src/images/brand/buckleson-mark-dark.png'),
  ]);

  for (const image of [light, dark]) {
    assert.equal(image.metadata.format, 'png');
    assert.equal(image.metadata.width, 512);
    assert.equal(image.metadata.height, 512);
    assert.equal(image.metadata.hasAlpha, true);
    const stats = visiblePixelStats(image);
    assert.ok(
      stats.transparent > 0,
      'logo must retain a transparent background'
    );
    assert.ok(stats.opaque > 0, 'logo must retain an opaque visible mark');
  }

  for (
    let offset = 3;
    offset < light.data.length;
    offset += light.info.channels
  ) {
    assert.equal(
      light.data[offset],
      dark.data[offset],
      `alpha masks differ at pixel ${Math.floor(offset / 4)}`
    );
  }
  assert.ok(
    visiblePixelStats(light).max <= 3,
    'light-scene mark must be black'
  );
  assert.ok(
    visiblePixelStats(dark).min >= 252,
    'dark-scene mark must be white'
  );
});

test('brand generator is deterministic and reads only the approved G-drive source', async () => {
  const script = await source('scripts/build-brand-assets.mjs');
  const expectedSource = resolve(WORKSPACE, 'Bson_logo.jpg');

  assert.equal(isAbsolute(expectedSource), true);
  assert.match(expectedSource, /^G:\\/i);
  await access(expectedSource);
  assert.match(script, /path\.resolve\(root, '\.\.', 'Bson_logo\.jpg'\)/);
  assert.doesNotMatch(script, /[A-Z]:\\|AppData|Downloads/i);
  assert.doesNotMatch(
    script,
    /Math\.random|Date\.now|randomUUID|crypto\.random/i
  );
  assert.match(script, /resize\(512, 512, \{[\s\S]*?fit: 'contain'/);
  assert.match(script, /png\(\{ compressionLevel: 9 \}\)/);
});

test('favicon, install icons, documentation marks, and social image have required dimensions', async () => {
  const assets = [
    ['src/images/icon.png', 512, 512, true],
    ['src/images/icon-maskable.png', 512, 512, true],
    ['src/images/social.png', 1200, 600, null],
    ['src/images/starlight/buckleson-mark-light.png', 128, 128, true],
    ['src/images/starlight/buckleson-mark-dark.png', 128, 128, true],
  ];

  for (const [path, width, height, alpha] of assets) {
    const asset = await png(path);
    assert.equal(asset.metadata.format, 'png', `${path} must be PNG`);
    assert.equal(asset.metadata.width, width, `${path} width`);
    assert.equal(asset.metadata.height, height, `${path} height`);
    if (alpha !== null) {
      assert.equal(asset.metadata.hasAlpha, alpha, `${path} alpha expectation`);
    }
  }
});

test('head metadata provides theme-aware icons and matching theme colors', async () => {
  const meta = await source('src/components/Meta.astro');

  assert.match(meta, /rel="manifest" href=\{sitePath\('\/manifest\.json'\)\}/);
  assert.match(
    meta,
    /rel="icon"[\s\S]*?media="\(prefers-color-scheme: light\)"/
  );
  assert.match(
    meta,
    /rel="icon"[\s\S]*?media="\(prefers-color-scheme: dark\)"/
  );
  assert.match(
    meta,
    /name="theme-color"[\s\S]*?content="#7c3aed"[\s\S]*?prefers-color-scheme: light/
  );
  assert.match(
    meta,
    /name="theme-color"[\s\S]*?content="#000000"[\s\S]*?prefers-color-scheme: dark/
  );
  assert.match(meta, /name="twitter:card" content="summary_large_image"/);
  assert.match(meta, /property="og:image" content=\{socialImage\}/);
  assert.match(meta, /name="twitter:image" content=\{socialImage\}/);
});

test('manifest brands the app and keeps project-base-aware entry points', async () => {
  const manifest = await source('src/pages/manifest.json.ts');

  assert.match(manifest, /short_name: 'Buckleson'/);
  assert.match(manifest, /name: 'Buckleson'/);
  assert.match(manifest, /purpose: 'any'/);
  assert.match(manifest, /purpose: 'maskable'/);
  assert.match(manifest, /sizes = \[192, 512\]/);
  assert.match(manifest, /id: sitePath\('\/'\)/);
  assert.match(manifest, /start_url: sitePath\('\/'\)/);
  assert.match(manifest, /theme_color: '#7C3AED'/);
  assert.match(manifest, /background_color: '#FFFFFF'/);
  assert.doesNotMatch(manifest, /ScrewFast|\/contact|\/fr\//i);
});

test('favicon endpoint derives both ICO sizes from the Buckleson app icon', async () => {
  const favicon = await source('src/pages/favicon.ico.ts');

  assert.match(favicon, /src\/images\/icon\.png/);
  assert.match(favicon, /const sizes = \[16, 32\]/);
  assert.match(favicon, /'Content-Type': 'image\/x-icon'/);
});

test('theme selection remains an inline pre-paint hs_theme decision', async () => {
  const layout = await source('src/layouts/MainLayout.astro');
  const head = layout.match(/<head>([\s\S]*?)<\/head>/)?.[1] ?? '';

  assert.match(head, /<Meta metadata=\{metadata\} \/>/);
  assert.match(head, /<script is:inline>/);
  assert.match(head, /localStorage\.getItem\('hs_theme'\) === 'dark'/);
  assert.match(head, /!\('hs_theme' in localStorage\)/);
  assert.match(head, /matchMedia\('\(prefers-color-scheme: dark\)'\)\.matches/);
  assert.match(head, /document\.documentElement\.classList\.add\('dark'\)/);
  assert.match(head, /document\.documentElement\.classList\.remove\('dark'\)/);
  assert.ok(
    head.indexOf('<script is:inline>') <
      head.indexOf("import '@scripts/lenisSmoothScroll.js'")
  );
});

test('Starlight reuses the shared brand component and has no temporary mark', async () => {
  const siteTitle = await source('src/components/ui/starlight/SiteTitle.astro');

  assert.match(
    siteTitle,
    /import BrandLogo from '@components\/BrandLogo\.astro'/
  );
  assert.match(siteTitle, /<BrandLogo class="text-lg" \/>/);
  assert.match(siteTitle, /aria-label="Buckleson"/);
  assert.doesNotMatch(siteTitle, /\bbg-brand-(?:500|600)\b/);
});
