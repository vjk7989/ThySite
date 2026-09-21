import assert from 'node:assert/strict';
import { access, readFile, readdir } from 'node:fs/promises';
import { dirname, relative, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = resolve(ROOT, 'dist');
const DEPLOYED_ORIGIN = 'https://vjk7989.github.io';
const SITE_BASE = '/ThySite';

async function source(path) {
  return readFile(resolve(ROOT, path), 'utf8');
}

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function filesBelow(directory) {
  const files = [];

  async function visit(current) {
    for (const entry of await readdir(current, { withFileTypes: true })) {
      const absolute = resolve(current, entry.name);
      if (entry.isDirectory()) await visit(absolute);
      else files.push(absolute);
    }
  }

  await visit(directory);
  return files.sort();
}

async function loadPathHelpers() {
  const sourceText = await source('src/utils/paths.ts');
  const executable = sourceText
    .replace(
      /^const viteEnv[\s\S]*?const base = [\s\S]*?;\s*/,
      `const base = '${SITE_BASE}';\n`
    )
    .replaceAll('export function', 'function')
    .replace("path = '/'): string", "path = '/')")
    .replace('path: string): string', 'path)');

  return Function(
    `'use strict';\n${executable}\nreturn { sitePath, stripSiteBase };`
  )();
}

function htmlUrls(html) {
  const urls = [];
  for (const match of html.matchAll(/\b(?:href|src|action)=(['"])(.*?)\1/gi)) {
    urls.push(match[2]);
  }
  for (const match of html.matchAll(/\bsrcset=(['"])(.*?)\1/gi)) {
    for (const candidate of match[2].split(',')) {
      urls.push(candidate.trim().split(/\s+/)[0]);
    }
  }
  return urls;
}

function attribute(tag, name) {
  return tag.match(new RegExp(`\\b${name}=(['"])(.*?)\\1`, 'i'))?.[2];
}

function jsonLd(html) {
  const script = html.match(
    /<script\b[^>]*type=(['"])application\/ld\+json\1[^>]*>([\s\S]*?)<\/script>/i
  );
  assert.ok(script, 'page must contain JSON-LD metadata');
  return JSON.parse(script[2]);
}

function assertDeployableUrl(url, context) {
  if (!url || url.startsWith('#')) return;
  if (/^(?:mailto:|tel:|data:)/i.test(url)) return;
  if (url.startsWith('//')) return;
  if (/^https?:\/\//i.test(url)) {
    const parsed = new URL(url);
    if (parsed.origin === DEPLOYED_ORIGIN) {
      assert.ok(
        parsed.pathname === SITE_BASE ||
          parsed.pathname.startsWith(`${SITE_BASE}/`),
        `${context} escapes the project base: ${url}`
      );
    }
    return;
  }
  assert.ok(
    url === SITE_BASE || url.startsWith(`${SITE_BASE}/`),
    `${context} is not project-base-prefixed: ${url}`
  );
}

test('sitePath handles root, nested, prefixed, fragment, and external URLs', async () => {
  const { sitePath } = await loadPathHelpers();

  assert.equal(sitePath(), '/ThySite/');
  assert.equal(sitePath('/'), '/ThySite/');
  assert.equal(sitePath('/products'), '/ThySite/products');
  assert.equal(sitePath('products/item-a765/'), '/ThySite/products/item-a765/');
  assert.equal(sitePath('/ThySite'), '/ThySite');
  assert.equal(sitePath('/ThySite/products'), '/ThySite/products');
  assert.equal(sitePath('/ThySiteExtra'), '/ThySite/ThySiteExtra');
  assert.equal(sitePath('#faq'), '#faq');
  assert.equal(
    sitePath('https://example.com/path'),
    'https://example.com/path'
  );
  assert.equal(sitePath('mailto:test@example.com'), 'mailto:test@example.com');
  assert.equal(
    sitePath('//cdn.example.com/app.js'),
    '//cdn.example.com/app.js'
  );
});

test('stripSiteBase handles project root, nested paths, and prefix collisions', async () => {
  const { stripSiteBase } = await loadPathHelpers();

  assert.equal(stripSiteBase('/ThySite'), '/');
  assert.equal(stripSiteBase('/ThySite/'), '/');
  assert.equal(
    stripSiteBase('/ThySite/products/item-a765/'),
    '/products/item-a765/'
  );
  assert.equal(stripSiteBase('/products/'), '/products/');
  assert.equal(stripSiteBase('/'), '/');
  assert.equal(
    stripSiteBase('/ThySiteExtra/products'),
    '/ThySiteExtra/products'
  );
});

test('active navigation removes the runtime base before selecting its stable id', async () => {
  const navLink = await source('src/components/ui/links/NavLink.astro');

  assert.ok(navLink.includes("import.meta.env.BASE_URL.replace(/\\/$/, '')"));
  assert.match(navLink, /url === base \|\| url\.startsWith\(`\$\{base\}\/`\)/);
  assert.match(navLink, /url = url\.slice\(base\.length\) \|\| '\/'/);
  assert.match(navLink, /id=\{id\}/);
});

test('built homepage loads CSS, JavaScript, and banner assets under the base', async () => {
  const homepage = await readFile(resolve(DIST, 'index.html'), 'utf8');
  const stylesheets = [...homepage.matchAll(/<link\b[^>]*>/gi)]
    .map(match => match[0])
    .filter(tag => attribute(tag, 'rel') === 'stylesheet')
    .map(tag => attribute(tag, 'href'));
  const scripts = [...homepage.matchAll(/<script\b[^>]*>/gi)]
    .map(match => attribute(match[0], 'src'))
    .filter(Boolean);

  assert.ok(
    stylesheets.length > 0,
    'homepage must emit at least one stylesheet'
  );
  assert.ok(
    scripts.length > 0,
    'homepage must emit at least one external script'
  );
  assert.match(homepage, /\/ThySite\/banner-pattern\.svg/);

  for (const asset of [...stylesheets, ...scripts]) {
    assertDeployableUrl(asset, 'homepage asset');
    const pathname = new URL(asset, DEPLOYED_ORIGIN).pathname;
    const distPath = resolve(DIST, pathname.slice(`${SITE_BASE}/`.length));
    assert.equal(
      await exists(distPath),
      true,
      `missing built asset for ${asset}`
    );
  }
});

test('all built HTML navigation and resource URLs stay within the project base', async () => {
  const htmlFiles = (await filesBelow(DIST)).filter(path =>
    path.endsWith('.html')
  );

  assert.ok(htmlFiles.length > 0, 'production build must contain HTML pages');
  for (const path of htmlFiles) {
    const html = await readFile(path, 'utf8');
    const context = relative(DIST, path).replaceAll('\\', '/');
    for (const url of htmlUrls(html)) assertDeployableUrl(url, context);
  }
});

test('built discovery metadata targets the deployed GitHub project', async () => {
  const [homepage, docs, manifestText, robots, sitemap] = await Promise.all([
    readFile(resolve(DIST, 'index.html'), 'utf8'),
    readFile(resolve(DIST, 'welcome-to-docs/index.html'), 'utf8'),
    readFile(resolve(DIST, 'manifest.json'), 'utf8'),
    readFile(resolve(DIST, 'robots.txt'), 'utf8'),
    readFile(resolve(DIST, 'sitemap-index.xml'), 'utf8'),
  ]);
  const manifest = JSON.parse(manifestText);
  const projectUrl = `${DEPLOYED_ORIGIN}${SITE_BASE}`;
  const structuredData = jsonLd(homepage);

  assert.match(
    homepage,
    /rel="canonical" href="https:\/\/vjk7989\.github\.io\/ThySite"/
  );
  assert.match(
    homepage,
    /property="og:url" content="https:\/\/vjk7989\.github\.io\/ThySite"/
  );
  assert.match(
    homepage,
    /property="twitter:url" content="https:\/\/vjk7989\.github\.io\/ThySite"/
  );
  assert.equal(structuredData['@id'], projectUrl);
  assert.equal(structuredData.url, projectUrl);
  assert.equal(structuredData.isPartOf.url, projectUrl);
  assert.match(homepage, /rel="manifest" href="\/ThySite\/manifest\.json"/);
  assert.match(homepage, /rel="sitemap" href="\/ThySite\/sitemap-index\.xml"/);
  assert.match(docs, /href="\/ThySite\/contact\/"/);
  assert.doesNotMatch(docs, /href="\/contact\/"/);
  assert.match(docs, /href="\/ThySite\/favicon\.ico"/);
  assert.doesNotMatch(docs, /\/ThySite\/ThySite\/favicon\.ico/);
  assert.equal(
    await exists(resolve(DIST, 'favicon.ico')),
    true,
    'docs favicon URL must map to dist/favicon.ico after removing the site base'
  );
  assert.equal(manifest.id, '/ThySite/');
  assert.equal(manifest.start_url, '/ThySite/');
  assert.ok(manifest.icons.length > 0, 'manifest must contain icons');
  for (const icon of manifest.icons) {
    assertDeployableUrl(icon.src, 'manifest icon');
  }
  assert.match(
    robots,
    /Sitemap: https:\/\/vjk7989\.github\.io\/ThySite\/sitemap-index\.xml/
  );
  assert.match(sitemap, /https:\/\/vjk7989\.github\.io\/ThySite\//);
  assert.equal(await exists(resolve(ROOT, 'public/CNAME')), false);
  assert.equal(await exists(resolve(DIST, 'CNAME')), false);
});
