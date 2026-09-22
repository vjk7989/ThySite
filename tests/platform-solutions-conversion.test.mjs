import assert from 'node:assert/strict';
import { access, readFile, readdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = resolve(ROOT, 'dist');
const SITE_BASE = '/ThySite';
const PRODUCT_DIR = 'src/content/products/en';
const PRODUCT_SLUGS = ['hyper-tern', 'hyper-abs', 'hyper-0x', 'hyper-wallet'];

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

function frontmatter(markdown) {
  const match = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  assert.ok(match, 'product file must start with YAML frontmatter');
  return match[1];
}

function scalar(yaml, key) {
  return yaml
    .match(new RegExp(`^${key}:\\s*(?:'([^']*)'|([^\\r\\n#]+))`, 'm'))
    ?.slice(1)
    .find(value => value !== undefined)
    ?.trim();
}

function listSection(yaml, key) {
  const lines = yaml.split(/\r?\n/);
  const start = lines.findIndex(line => line === `${key}:`);
  assert.notEqual(start, -1, `missing ${key} section`);
  const section = [];
  for (const line of lines.slice(start + 1)) {
    if (/^[a-z][\w-]*:/i.test(line)) break;
    if (line.trim()) section.push(line);
  }
  return section;
}

function tagHasAttribute(sourceText, tag, attributePattern) {
  return new RegExp(`<${tag}\\s+[^>]*${attributePattern}[^>]*>`, 'i').test(
    sourceText
  );
}

test('product collection contains exactly four Buckleson slugs and no hardware files', async () => {
  const files = (await readdir(resolve(ROOT, PRODUCT_DIR)))
    .filter(file => /\.mdx?$/.test(file))
    .sort();

  assert.deepEqual(files, PRODUCT_SLUGS.map(slug => `${slug}.md`).sort());
  assert.equal(files.length, 4);
  assert.deepEqual(
    files.filter(file => /^item-/i.test(file)),
    []
  );
  for (const legacy of ['item-a765', 'item-b203', 'item-f303', 'item-t845']) {
    assert.equal(await exists(`${PRODUCT_DIR}/${legacy}.md`), false);
  }
});

test('product schema requires the ordered platform shape and only four diagram kinds', async () => {
  const schema = await source('src/content.config.ts');
  const productsCollection =
    schema.match(
      /const productsCollection\s*=\s*defineCollection\(\{[\s\S]*?\r?\n\}\);\s*(?=const blogCollection)/
    )?.[0] ?? '';

  assert.ok(
    productsCollection.length > 0,
    'productsCollection schema block must be extractable'
  );

  for (const field of [
    'title',
    'description',
    'action',
    'eyebrow',
    'summary',
  ]) {
    assert.match(
      productsCollection,
      new RegExp(`${field}:\\s*z\\.string\\(\\)`)
    );
  }
  assert.match(productsCollection, /order:\s*z\.number\(\)/);
  assert.match(
    productsCollection,
    /secondary:\s*z\.boolean\(\)\.default\(false\)/
  );
  assert.match(
    productsCollection,
    /diagram:\s*z\.enum\(\['hyper-tern', 'hyper-abs', 'hyper-0x', 'hyper-wallet'\]\)/
  );
  assert.match(
    productsCollection,
    /capabilities:\s*z\.array\([\s\S]*?title:\s*z\.string\(\)[\s\S]*?body:\s*z\.string\(\)/
  );
  assert.match(productsCollection, /flow:\s*z\.array\(z\.string\(\)\)/);
  assert.match(productsCollection, /boundaries:\s*z\.array\(z\.string\(\)\)/);
  assert.doesNotMatch(
    productsCollection,
    /price|image|blueprint|specifications|longDescription/i
  );
  assert.doesNotMatch(productsCollection, /^\s*(?:main|img|tabs?):\s*/im);
});

test('product entries have unique order, matching diagram slug, non-empty sections, and one secondary wallet', async () => {
  const expected = [
    ['hyper-tern', 'Hyper Tern', '1', 'Control', 'false'],
    ['hyper-abs', 'Hyper-ABS', '2', 'Protect', 'false'],
    ['hyper-0x', 'Hyper-0x', '3', 'Verify', 'false'],
    ['hyper-wallet', 'Hyper Wallet', '4', 'Authorize', 'true'],
  ];
  const seenOrders = new Set();
  let secondaryCount = 0;

  for (const [slug, title, order, action, secondary] of expected) {
    const yaml = frontmatter(await source(`${PRODUCT_DIR}/${slug}.md`));
    assert.equal(scalar(yaml, 'title'), title);
    assert.equal(scalar(yaml, 'order'), order);
    assert.equal(scalar(yaml, 'action'), action);
    assert.equal(scalar(yaml, 'diagram'), slug);
    assert.equal(scalar(yaml, 'secondary'), secondary);
    seenOrders.add(order);
    if (secondary === 'true') secondaryCount += 1;

    for (const key of ['description', 'eyebrow', 'summary']) {
      assert.ok(scalar(yaml, key)?.length, `${slug} ${key} must not be empty`);
    }
    const capabilities = listSection(yaml, 'capabilities');
    assert.equal(
      capabilities.filter(line => /^\s+- title:\s*'[^']+'/.test(line)).length,
      3
    );
    assert.equal(
      capabilities.filter(line => /^\s+body:\s*'[^']+'/.test(line)).length,
      3
    );
    assert.equal(
      listSection(yaml, 'flow').filter(line => /^\s+-\s*'[^']+'/.test(line))
        .length,
      3
    );
    assert.equal(
      listSection(yaml, 'boundaries').filter(line =>
        /^\s+-\s*'[^']+'/.test(line)
      ).length,
      3
    );
  }

  assert.equal(seenOrders.size, 4);
  assert.equal(secondaryCount, 1);
  const content = await source('src/utils/content.ts');
  assert.match(
    content,
    /products:\s*\(a, b\) => a\.data\.order - b\.data\.order/
  );
});

test('Platform index separates three primary modules and secondary wallet with base-safe links', async () => {
  const page = await source('src/views/ProductsIndexView.astro');

  assert.match(page, /title="Platform"/);
  assert.match(page, /ogTitle="Buckleson AI Trust Platform"/);
  assert.match(page, /Buckleson’s model-agnostic trust platform/);
  assert.match(page, /A trust layer across the AI execution path\./);
  assert.match(
    page,
    /const primaryProducts = products\.filter\(product => !product\.data\.secondary\)/
  );
  assert.match(
    page,
    /const wallet = products\.find\(product => product\.data\.secondary\)/
  );
  assert.match(page, /\{primaryProducts\.map\(product => \(/);
  assert.match(page, /href=\{pathFor\(product\)\}/);
  assert.match(page, /\{wallet && \(/);
  assert.match(page, /href=\{pathFor\(wallet\)\}/);
  assert.match(page, /<TrustArchitecture\s*\/>/);
  assert.equal([...page.matchAll(/url=\{BOOKING_URL\}/g)].length, 2);
  assert.doesNotMatch(page, /target=(?:"_blank"|\{'_blank'\})/);
  assert.match(
    page,
    /Integration\s+feasibility depends on the enforcement points exposed/
  );
  assert.match(
    page,
    /not a replacement for\s+enterprise identity, key management, or recovery controls/i
  );

  const content = await source('src/utils/content.ts');
  assert.match(
    content,
    /return `\$\{localePath\(localeOf\(entry\), ROUTES\[entry\.collection\]\)\}\/\$\{slugOf\(entry\)\}\/`/
  );
});

test('Product detail renders diagram, bounded content, base-safe back link, and booking action', async () => {
  const [view, detail] = await Promise.all([
    source('src/views/ProductView.astro'),
    source('src/components/sections/products/ProductDetail.astro'),
  ]);

  assert.match(view, /<ProductDetail product=\{product\} \/>/);
  assert.match(view, /section="Platform"/);
  assert.match(
    detail,
    /import ModuleDiagram from '@components\/sections\/products\/ModuleDiagram\.astro'/
  );
  assert.match(detail, /const platformPath = sitePath\('\/products'\)/);
  assert.ok(tagHasAttribute(detail, 'a', '\\bhref=\\{platformPath\\}'));
  assert.match(detail, /<ModuleDiagram kind=\{product\.data\.diagram\} \/>/);
  assert.match(detail, /product\.data\.capabilities\.map/);
  assert.match(detail, /product\.data\.flow\.map/);
  assert.match(detail, /product\.data\.boundaries\.map/);
  assert.match(
    detail,
    /<PrimaryCTA\s+(?=[^>]*\btitle="Book an Assessment")(?=[^>]*\burl=\{BOOKING_URL\})(?=[^>]*\bvariant="yellow")[^>]*\/>/
  );
  assert.doesNotMatch(
    detail,
    /ProductTab|GSAP|gsap|<Image\b|blueprint|hardware|specifications/i
  );
});

test('active product graph excludes orphaned cards, tabs, and legacy content fields', async () => {
  assert.equal(
    await exists('src/components/ui/cards/CardProduct.astro'),
    false
  );
  assert.equal(
    await exists('src/components/ui/buttons/ProductTabBtn.astro'),
    false
  );

  const [view, detail, index, diagram] = await Promise.all([
    source('src/views/ProductView.astro'),
    source('src/components/sections/products/ProductDetail.astro'),
    source('src/views/ProductsIndexView.astro'),
    source('src/components/sections/products/ModuleDiagram.astro'),
  ]);

  assert.match(
    view,
    /import ProductDetail from '@components\/sections\/products\/ProductDetail\.astro'/
  );
  assert.match(view, /<ProductDetail product=\{product\} \/>/);
  assert.match(
    detail,
    /import ModuleDiagram from '@components\/sections\/products\/ModuleDiagram\.astro'/
  );
  assert.match(detail, /<ModuleDiagram kind=\{product\.data\.diagram\} \/>/);

  for (const [path, contents] of [
    ['ProductView.astro', view],
    ['ProductDetail.astro', detail],
    ['ProductsIndexView.astro', index],
    ['ModuleDiagram.astro', diagram],
  ]) {
    assert.doesNotMatch(
      contents,
      /CardProduct|ProductTabBtn|product\.data\.(?:main|img|tabs?)/,
      `${path} references a removed product seam`
    );
  }
});

test('ModuleDiagram supports exactly four kinds with accessible static content', async () => {
  const diagram = await source(
    'src/components/sections/products/ModuleDiagram.astro'
  );
  const markup = diagram.split('<script>')[0];

  const kindType = diagram.match(/type DiagramKind =([\s\S]*?);/)?.[1] ?? '';
  assert.deepEqual(
    [...kindType.matchAll(/'([^']+)'/g)].map(match => match[1]),
    PRODUCT_SLUGS
  );
  assert.match(diagram, /const diagrams:\s*Record<[\s\S]*?DiagramKind/);
  for (const kind of PRODUCT_SLUGS) {
    assert.match(diagram, new RegExp(`'${kind}':?\\s*\\{`));
    const start = diagram.indexOf(`'${kind}': {`);
    const next = PRODUCT_SLUGS.map(candidate =>
      diagram.indexOf(`'${candidate}': {`, start + 1)
    )
      .filter(position => position > start)
      .sort((a, b) => a - b)[0];
    const block = diagram.slice(start, next ?? diagram.indexOf('\n};', start));
    assert.equal(
      [...block.matchAll(/\[\s*'[^']+'\s*,\s*'[^']+'\s*\]/g)].length,
      4,
      `${kind} must expose four static nodes`
    );
  }
  assert.equal(
    [...diagram.matchAll(/^\s+'hyper-(?:tern|abs|0x|wallet)':\s*\{/gm)].length,
    4
  );
  assert.match(markup, /aria-labelledby=\{`\$\{kind\}-diagram-title`\}/);
  assert.match(markup, /aria-describedby=\{`\$\{kind\}-diagram-description`\}/);
  assert.match(markup, /<h2\s+[^>]*\bid=\{`\$\{kind\}-diagram-title`\}[^>]*>/);
  assert.match(
    markup,
    /<p\s+[^>]*\bid=\{`\$\{kind\}-diagram-description`\}[^>]*>/
  );
  assert.match(
    markup,
    /<div\s+(?=[^>]*\bclass="overflow-x-auto pb-2")(?=[^>]*\btabindex="0")(?=[^>]*\baria-label=\{`Scrollable \$\{diagram\.title\}`\})[^>]*>/
  );
  assert.match(
    markup,
    /<svg[\s\S]*?role="img"[\s\S]*?aria-labelledby=\{`\$\{kind\}-svg-title \$\{kind\}-svg-description`\}/
  );
  assert.match(
    markup,
    /<title\s+id=\{`\$\{kind\}-svg-title`\}>\s*\{diagram\.title\}\s*<\/title>/
  );
  assert.match(
    markup,
    /<desc\s+id=\{`\$\{kind\}-svg-description`\}>\s*\{diagram\.description\}\s*<\/desc>/
  );
  assert.match(
    markup,
    /\{diagram\.nodes\.map\(\(\[label, detail\], index\) =>/
  );
  assert.match(markup, /<g data-module-node>/);
  assert.doesNotMatch(
    markup,
    /data-module-node[^>]*(?:hidden|opacity-0|display:\s*none)/i
  );
});

test('ModuleDiagram Anime.js behavior is scoped, finite, reduced-motion safe, and cleaned up', async () => {
  const diagram = await source(
    'src/components/sections/products/ModuleDiagram.astro'
  );
  const script = diagram.split('<script>')[1] ?? '';

  assert.match(
    script,
    /import \{ animate, createScope, stagger \} from 'animejs'/
  );
  assert.match(
    script,
    /const moduleScopes = new WeakMap<Element, ReturnType<typeof createScope>>\(\)/
  );
  assert.match(
    script,
    /querySelectorAll<HTMLElement>\('\[data-module-diagram\]'\)/
  );
  assert.match(script, /moduleScopes\.get\(root\)\?\.revert\(\)/);
  assert.match(
    script,
    /createScope\(\{[\s\S]*?root,[\s\S]*?reducedMotion: '\(prefers-reduced-motion: reduce\)'/
  );
  assert.match(
    script,
    /if \(!context \|\| context\.matches\.reducedMotion\) return;[\s\S]*?animate\('/
  );
  assert.equal([...script.matchAll(/\banimate\('/g)].length, 2);
  assert.match(script, /duration:\s*520/);
  assert.match(script, /duration:\s*580/);
  assert.doesNotMatch(
    script,
    /\b(?:loop|alternate|autoplay):\s*(?:true|Infinity)/
  );
  assert.match(
    script,
    /document\.addEventListener\(\s*'DOMContentLoaded',\s*initialiseModuleDiagrams,\s*\{\s*once:\s*true,?\s*\}\s*\)/
  );
  assert.match(script, /astro:page-load', initialiseModuleDiagrams/);
  assert.match(
    script,
    /astro:before-swap'[\s\S]*?moduleScopes\.get\(root\)\?\.revert\(\)/
  );
});

test('Solutions page contains exactly four services and four gated lifecycle phases', async () => {
  const services = await source('src/views/ServicesView.astro');
  const solutionsBlock =
    services.match(/const solutions = \[([\s\S]*?)\n\];/)?.[1] ?? '';
  const lifecycleBlock =
    services.match(/const lifecycle = \[([\s\S]*?)\n\];/)?.[1] ?? '';

  assert.deepEqual(
    [...solutionsBlock.matchAll(/title:\s*'([^']+)'/g)].map(match => match[1]),
    [
      'AI security assessment',
      'Secure inference deployment',
      'Custom AI development',
      'Verification and operating design',
    ]
  );
  assert.equal([...solutionsBlock.matchAll(/outputs:\s*\[/g)].length, 4);
  assert.deepEqual(
    [...lifecycleBlock.matchAll(/\[\s*'([^']+)'/g)].map(match => match[1]),
    ['Discover', 'Design', 'Integrate', 'Operate']
  );
  assert.match(services, /\{solutions\.map\(solution => \(/);
  assert.match(services, /\{lifecycle\.map\(\(\[title, body\], index\) => \(/);
  assert.match(services, /<ol[\s\S]*?lg:grid-cols-4/);
  assert.equal([...services.matchAll(/url=\{BOOKING_URL\}/g)].length, 2);
  assert.doesNotMatch(services, /target=(?:"_blank"|\{'_blank'\})/);
  assert.match(
    services,
    /without assuming every problem\s+needs a new model or a new stack/i
  );
  assert.match(services, /“Secure all AI” is not an actionable scope\./);
  assert.match(
    services,
    /not a promise that every\s+workflow can or should use the same control\./i
  );
  assert.doesNotMatch(
    services,
    /@images\/|construction|hardware|Testimonials?|Statistics?|12\.8k|4\.8|customer logos?|ConstructIt/i
  );
});

test('homepage primary module cards target all three real product slugs through sitePath', async () => {
  const home = await source('src/views/HomeView.astro');
  const modulesBlock =
    home.match(/const modules = \[([\s\S]*?)\n\];/)?.[1] ?? '';

  assert.deepEqual(
    [...modulesBlock.matchAll(/href:\s*'([^']+)'/g)].map(match => match[1]),
    ['/products/hyper-tern', '/products/hyper-abs', '/products/hyper-0x']
  );
  assert.match(home, /href=\{sitePath\(module\.href\)\}/);
  assert.doesNotMatch(modulesBlock, /item-[a-z0-9]+|hyper-wallet/i);
});

test('smoke routes include four new products and reject every former hardware slug', async () => {
  const smoke = await source('scripts/smoke.mjs');
  const marketing =
    smoke.match(/const MARKETING_ROUTES = \[([\s\S]*?)\];/)?.[1] ?? '';
  const removed =
    smoke.match(/const REMOVED_ROUTES = \[([\s\S]*?)\];/)?.[1] ?? '';

  for (const slug of PRODUCT_SLUGS) {
    assert.match(marketing, new RegExp(`'/products/${slug}/'`));
    assert.match(smoke, new RegExp(`'/products/${slug}/': \\[`));
  }
  for (const slug of ['item-a765', 'item-b203', 'item-f303', 'item-t845']) {
    assert.doesNotMatch(marketing, new RegExp(`'/products/${slug}/'`));
    assert.match(removed, new RegExp(`'/products/${slug}/'`));
  }
});

test('built Platform, product, and Solutions surfaces contain no legacy copy and keep internal URLs under the base', async () => {
  const pages = [
    'products/index.html',
    ...PRODUCT_SLUGS.map(slug => `products/${slug}/index.html`),
    'services/index.html',
  ];
  const legacy =
    /ScrewFast|hardware tools?|construction services?|toolbox|blueprints?|ConstructIt|12\.8k|4\.8\s*\/\s*5/i;

  for (const page of pages) {
    const absolute = resolve(DIST, page);
    assert.equal(await exists(absolute), true, `missing built page ${page}`);
    const html = await readFile(absolute, 'utf8');
    assert.doesNotMatch(html, legacy, `${page} contains legacy public copy`);
    for (const match of html.matchAll(
      /\b(?:href|src|action)=(['"])(.*?)\1/gi
    )) {
      const url = match[2];
      if (!url || url.startsWith('#') || /^(?:mailto:|tel:|data:)/i.test(url))
        continue;
      if (/^https?:\/\//i.test(url)) {
        const parsed = new URL(url);
        if (parsed.origin === 'https://vjk7989.github.io') {
          assert.ok(
            parsed.pathname === SITE_BASE ||
              parsed.pathname.startsWith(`${SITE_BASE}/`),
            `${page} same-origin URL escapes base: ${url}`
          );
        }
        continue;
      }
      assert.ok(
        url === SITE_BASE || url.startsWith(`${SITE_BASE}/`),
        `${page} internal URL escapes base: ${url}`
      );
    }
  }
});
