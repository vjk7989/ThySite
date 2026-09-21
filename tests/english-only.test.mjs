import assert from 'node:assert/strict';
import { access, readFile, readdir } from 'node:fs/promises';
import { dirname, relative, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

async function source(path) {
  return readFile(resolve(ROOT, path), 'utf8');
}

async function exists(path) {
  try {
    await access(resolve(ROOT, path));
    return true;
  } catch {
    return false;
  }
}

async function filesBelow(path) {
  const root = resolve(ROOT, path);
  const files = [];

  async function visit(directory) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const absolute = resolve(directory, entry.name);
      if (entry.isDirectory()) await visit(absolute);
      else files.push(relative(root, absolute).replaceAll('\\', '/'));
    }
  }

  if (await exists(path)) await visit(root);
  return files.sort();
}

test('keeps English as the only marketing locale and copy table', async () => {
  const [locale, copyIndex] = await Promise.all([
    source('src/utils/locale.ts'),
    source('src/copy/index.ts'),
  ]);

  assert.match(locale, /MARKETING_LOCALES\s*=\s*\['en'\]\s+as const/);
  assert.doesNotMatch(locale, /^\s*(?:fr|de|es|fa|ja|'zh-cn'):\s*\{/m);
  assert.match(copyIndex, /import\s*\{\s*en\s*\}\s*from\s*['"]\.\/en['"]/);
  assert.match(copyIndex, /tables[^=]*=\s*\{\s*en\s*\}/);
  assert.doesNotMatch(copyIndex, /\.\/fr|\bfr\s*[,}]/);
  assert.equal(await exists('src/copy/fr.ts'), false);
});

test('removes locale pickers from marketing and Starlight mobile UI', async () => {
  const [sourceFiles, mobileMenu] = await Promise.all([
    filesBelow('src'),
    source('src/components/ui/starlight/MobileMenuFooter.astro'),
  ]);
  const searchable = sourceFiles.filter(path =>
    /\.(?:astro|ts|js|mjs)$/.test(path)
  );
  const references = [];

  for (const path of searchable) {
    const contents = await source(`src/${path}`);
    if (/LanguagePicker|LocaleSelect/.test(contents)) references.push(path);
  }

  assert.equal(await exists('src/components/ui/LanguagePicker.astro'), false);
  assert.deepEqual(references, []);
  assert.doesNotMatch(
    mobileMenu,
    /LanguagePicker|LocaleSelect|language selector/i
  );
  assert.match(mobileMenu, /<ThemeSelect\s*\/>/);
});

test('contains no French marketing data or translated documentation trees', async () => {
  const [pages, content, dataFiles, docs] = await Promise.all([
    filesBelow('src/pages'),
    filesBelow('src/content'),
    filesBelow('src/data_files'),
    filesBelow('src/content/docs'),
  ]);
  const localizedSegment = /(?:^|\/)(?:fr|de|es|fa|ja|zh-cn)(?:\/|$)/;

  assert.deepEqual(
    pages.filter(path => localizedSegment.test(path)),
    []
  );
  assert.deepEqual(
    content.filter(path => localizedSegment.test(path)),
    []
  );
  assert.deepEqual(
    dataFiles.filter(path => localizedSegment.test(path)),
    []
  );
  assert.deepEqual(docs, ['welcome-to-docs.mdx']);
});

test('emits English metadata without alternate-language hreflang entries', async () => {
  const [metadata, locale] = await Promise.all([
    source('src/utils/metadata.ts'),
    source('src/utils/locale.ts'),
  ]);

  assert.match(
    metadata,
    /const\s+alternates:\s*PageMetadata\['alternates'\]\s*=\s*\[\]/
  );
  assert.doesNotMatch(metadata, /MARKETING_LOCALES\.map|alternatePaths\(/);
  assert.doesNotMatch(locale, /ogLocale:\s*'fr_FR'|inLanguage:\s*'fr'/);
});

test('uses Buckleson for canonical, manifest, and Starlight site metadata', async () => {
  const [astroConfig, constants, meta, manifest, siteTitle] = await Promise.all(
    [
      source('astro.config.mjs'),
      source('src/data_files/constants.ts'),
      source('src/components/Meta.astro'),
      source('src/pages/manifest.json.ts'),
      source('src/components/ui/starlight/SiteTitle.astro'),
    ]
  );

  assert.match(astroConfig, /site:\s*'https:\/\/www\.buckleson\.com'/);
  assert.match(astroConfig, /title:\s*'Buckleson Platform'/);
  assert.doesNotMatch(astroConfig, /screwfast\.uk|ScrewFast/);
  assert.match(constants, /title:\s*'Buckleson'/);
  assert.match(constants, /url:\s*'https:\/\/www\.buckleson\.com'/);
  assert.doesNotMatch(meta, /screwfast\.uk|ScrewFast/);
  assert.match(manifest, /short_name:\s*'Buckleson'/);
  assert.match(manifest, /name:\s*'Buckleson'/);
  assert.doesNotMatch(manifest, /ScrewFast/);
  assert.match(siteTitle, /aria-label="Buckleson"/);
  assert.match(siteTitle, /aria-label="Buckleson Platform"/);
  assert.doesNotMatch(siteTitle, /ScrewFast/i);
});

test('retains one English Buckleson platform overview with bounded claims', async () => {
  const overview = await source('src/content/docs/welcome-to-docs.mdx');

  assert.match(overview, /^title:\s*Buckleson Platform Overview$/m);
  assert.match(overview, /Hyper Tern/);
  assert.match(overview, /Hyper-ABS/);
  assert.match(overview, /Hyper-0x/);
  assert.match(overview, /Request an AI Safety Assessment/);
  assert.match(overview, /does not make model output inherently correct/i);
});

test('smoke checks English routes and representative removed locale boundaries', async () => {
  const smoke = await source('scripts/smoke.mjs');
  const removedRoutes = [
    '/fr/',
    '/fr/products/',
    '/fr/products/item-a765/',
    '/fr/services/',
    '/fr/blog/',
    '/fr/blog/post-1/',
    '/fr/insights/insight-1/',
    '/fr/contact/',
    '/fr/404/',
    '/de/welcome-to-docs/',
    '/es/welcome-to-docs/',
    '/fa/welcome-to-docs/',
    '/fr/welcome-to-docs/',
    '/ja/welcome-to-docs/',
    '/zh-cn/welcome-to-docs/',
  ];

  assert.match(smoke, /'\/welcome-to-docs\/'/);
  assert.match(smoke, /res\.status\s*!==\s*404/);
  for (const route of removedRoutes) {
    assert.ok(smoke.includes(`'${route}'`), `missing 404 smoke route ${route}`);
  }
});
