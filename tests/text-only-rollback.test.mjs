import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { access, readFile, readdir } from 'node:fs/promises';
import { dirname, relative, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = resolve(ROOT, 'dist');
const execFileAsync = promisify(execFile);

const PRODUCT_FILES = [
  'hyper-0x.md',
  'hyper-abs.md',
  'hyper-tern.md',
  'hyper-wallet.md',
];
const BLOG_FILES = [
  'agentic-ai-control-boundaries.md',
  'secure-inference-data-minimization.md',
  'verifiable-ai-execution-records.md',
];
const INSIGHT_FILES = [
  'blockchain-verification-limits.md',
  'llm-top-10-control-map.md',
  'owasp-agentic-threat-boundaries.md',
];

const TEXT_ONLY_SOURCE_CHANGES = [
  ...BLOG_FILES.map(name => `src/content/blog/en/${name}`),
  ...INSIGHT_FILES.map(name => `src/content/insights/en/${name}`),
  ...PRODUCT_FILES.map(name => `src/content/products/en/${name}`),
  'src/content/docs/welcome-to-docs.mdx',
  'src/copy/en.ts',
  'src/data_files/faqs.json',
  'src/data_files/features.json',
  'src/data_files/pricing.json',
  'src/components/sections/misc/ContactSection.astro',
  'src/views/HomeView.astro',
].sort();

const BUCKLESON_COPY_SOURCE_CHANGES = TEXT_ONLY_SOURCE_CHANGES.filter(
  path => path !== 'src/components/sections/misc/ContactSection.astro'
);

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

function visibleText(html) {
  return html
    .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

test('removes every generated visual-conversion artifact and dependency', async () => {
  const removedPaths = [
    'docs/asset-ledger.md',
    'docs/diagrams',
    'scripts/build-brand-assets.mjs',
    'scripts/build-site-assets.mjs',
    'src/components/sections/landing/TrustArchitecture.astro',
    'src/components/sections/products/ModuleDiagram.astro',
    'src/images/brand',
    'src/images/buckleson',
    'src/images/starlight/buckleson-mark-dark.png',
    'src/images/starlight/buckleson-mark-light.png',
  ];

  for (const path of removedPaths) {
    assert.equal(await exists(path), false, `${path} must remain removed`);
  }

  const packageJson = JSON.parse(await source('package.json'));
  assert.equal(packageJson.dependencies?.animejs, undefined);
  assert.equal(packageJson.devDependencies?.animejs, undefined);

  const sourceFiles = (await filesBelow('src')).filter(path =>
    /\.(?:astro|mdx?|[cm]?[jt]s|css|json)$/.test(path)
  );
  const conversionReferences = [];
  for (const path of sourceFiles) {
    const contents = await source(`src/${path}`);
    if (
      /TrustArchitecture|ModuleDiagram|from ['"]animejs['"]|@images\/buckleson|buckleson-mark-(?:light|dark)\.png/.test(
        contents
      )
    ) {
      conversionReferences.push(path);
    }
  }
  assert.deepEqual(conversionReferences, []);
});

test('restores the template visual, component, theme, and contact-route seams', async () => {
  const restoredPaths = [
    'public/banner-pattern.svg',
    'src/assets/scripts/demoForms.ts',
    'src/assets/styles/starlight_main.css',
    'src/components/sections/features/FeaturesGeneral.astro',
    'src/components/sections/features/FeaturesNavs.astro',
    'src/components/sections/landing/HeroSection.astro',
    'src/components/sections/landing/HeroSectionAlt.astro',
    'src/components/sections/pricing/PricingSection.astro',
    'src/components/sections/testimonials/TestimonialsSection.astro',
    'src/components/ui/banners/AnnouncementBanner.astro',
    'src/components/ui/cards/CardProduct.astro',
    'src/components/ui/forms/DemoForm.astro',
    'src/components/ui/stars/FullStar.astro',
    'src/components/ui/stars/HalfStar.astro',
    'src/images/hero-image.avif',
    'src/images/features-image.avif',
    'src/images/construction-image.avif',
    'src/images/automated-tools.avif',
    'src/images/dashboard-image.avif',
    'src/images/starlight/docs_logo.svg',
    'src/images/starlight/screwfast_hero.svg',
    'src/images/starlight/screwfast_hero_dark.svg',
    'src/images/starlight/screwfast_logo.svg',
    'src/images/starlight/screwfast_logo_dark.svg',
    'src/pages/contact.astro',
    'src/views/ContactView.astro',
  ];

  for (const path of restoredPaths) {
    assert.equal(await exists(path), true, `${path} must be restored`);
  }

  const [starlight, packageJson] = await Promise.all([
    source('src/assets/styles/starlight.css'),
    source('package.json').then(JSON.parse),
  ]);
  assert.match(starlight, /--sl-color-accent:\s*#ff801f/);
  assert.match(starlight, /--sl-color-accent-high:\s*#ffa057/);
  assert.match(starlight, /--sl-color-accent-low:\s*#562800/);
  assert.match(starlight, /:root\[data-theme='light'\]/);
  assert.equal(packageJson.dependencies.gsap, '^3.15.0');
  assert.equal(packageJson.dependencies.clipboard, '^2.0.11');
});

test('uses Buckleson content slugs and removes rollback placeholder filenames', async () => {
  assert.deepEqual(await filesBelow('src/content/products/en'), PRODUCT_FILES);
  assert.deepEqual(await filesBelow('src/content/blog/en'), BLOG_FILES);
  assert.deepEqual(await filesBelow('src/content/insights/en'), INSIGHT_FILES);

  const allContent = await filesBelow('src/content');
  assert.deepEqual(
    allContent.filter(path =>
      /(?:^|\/)(?:item-a765|item-b203|item-f303|item-t845|post-[123]|insight-[123])\.mdx?$/.test(
        path
      )
    ),
    []
  );
});

test('keeps public English text Buckleson-specific while allowing truthful template placeholders', async () => {
  const publicTextPaths = BUCKLESON_COPY_SOURCE_CHANGES.filter(
    path => path !== 'src/views/HomeView.astro'
  );

  for (const path of publicTextPaths) {
    const contents = await source(path);
    assert.match(
      contents,
      /Buckleson|Hyper-(?:0x|ABS)|Hyper Tern|Hyper Wallet/
    );
    assert.doesNotMatch(
      contents,
      /ScrewFast|mearashadowfax|construction equipment supplier|hardware store/i,
      `${path} contains stale public marketing copy`
    );
  }

  const contentMarkdown = await Promise.all(
    [
      ...PRODUCT_FILES.map(name => `src/content/products/en/${name}`),
      ...BLOG_FILES.map(name => `src/content/blog/en/${name}`),
      ...INSIGHT_FILES.map(name => `src/content/insights/en/${name}`),
    ].map(source)
  );
  assert.ok(
    contentMarkdown.every(markdown =>
      /(?:template|placeholder|mockup)[^\r\n]{0,80}retained|retained as temporary placeholder imagery/i.test(
        markdown
      )
    ),
    'restored template imagery must be labelled as temporary placeholder imagery'
  );
  assert.ok(
    contentMarkdown.some(markdown =>
      /circular saw|worker wearing gloves/i.test(markdown)
    ),
    'truthful descriptions of restored template images must remain allowed'
  );
});

test('limits source changes from the pre-conversion baseline to approved content/data, route slugs, contact email text, and two public URLs', async () => {
  const { stdout: changedOutput } = await execFileAsync(
    'git',
    ['diff', '--name-only', 'f82578d^', '--', 'src'],
    { cwd: ROOT, encoding: 'utf8' }
  );
  const changedPaths = changedOutput.split(/\r?\n/).filter(Boolean).sort();
  assert.deepEqual(
    changedPaths,
    [
      ...TEXT_ONLY_SOURCE_CHANGES,
      'src/content/blog/en/post-1.md',
      'src/content/blog/en/post-2.md',
      'src/content/blog/en/post-3.md',
      'src/content/insights/en/insight-1.md',
      'src/content/insights/en/insight-2.md',
      'src/content/insights/en/insight-3.md',
      'src/content/products/en/item-a765.md',
      'src/content/products/en/item-b203.md',
      'src/content/products/en/item-f303.md',
      'src/content/products/en/item-t845.md',
    ].sort()
  );

  const { stdout: homePatch } = await execFileAsync(
    'git',
    ['diff', '--unified=0', 'f82578d^', '--', 'src/views/HomeView.astro'],
    { cwd: ROOT, encoding: 'utf8' }
  );
  const changedLines = homePatch
    .split(/\r?\n/)
    .filter(line => /^[+-](?![+-])/.test(line));
  assert.deepEqual(changedLines, [
    '-    url="https://github.com/mearashadowfax/ScrewFast"',
    '+    url="https://github.com/vjk7989/ThySite"',
    '-    url="https://github.com/mearashadowfax/ScrewFast"',
    '+    url="https://github.com/vjk7989/ThySite"',
  ]);

  const home = await source('src/views/HomeView.astro');
  assert.equal(
    [...home.matchAll(/url="https:\/\/github\.com\/vjk7989\/ThySite"/g)].length,
    2
  );
  assert.match(home, /const copy = t\.home/);
  assert.doesNotMatch(
    home,
    /TrustArchitecture|ModuleDiagram|@images\/buckleson|animejs/
  );

  const { stdout: contactPatch } = await execFileAsync(
    'git',
    [
      'diff',
      '--unified=0',
      'f82578d^',
      '--',
      'src/components/sections/misc/ContactSection.astro',
    ],
    { cwd: ROOT, encoding: 'utf8' }
  );
  const contactLines = contactPatch
    .split(/\r?\n/)
    .filter(line => /^[+-](?![+-])/.test(line));
  assert.deepEqual(contactLines, [
    '-          linkTitle="support@screwfast.uk"',
    '-          linkURL="mailto:support@screwfast.uk"',
    '+          linkTitle="support@buckleson.com"',
    '+          linkURL="mailto:support@buckleson.com"',
  ]);

  const contact = await source(
    'src/components/sections/misc/ContactSection.astro'
  );
  assert.match(contact, /support@buckleson\.com/);
  assert.doesNotMatch(contact, /support@screwfast\.uk/);
});

test('built output serves Buckleson routes with conservative copy and no rollback placeholder slugs', async () => {
  const expectedPages = new Map([
    ['index.html', 'Use AI safely. Prove every action.'],
    ['products/index.html', 'Buckleson Platform'],
    ['products/hyper-tern/index.html', 'Hyper Tern'],
    ['products/hyper-abs/index.html', 'Hyper-ABS'],
    ['products/hyper-0x/index.html', 'Hyper-0x'],
    ['products/hyper-wallet/index.html', 'Hyper Wallet'],
    [
      'blog/agentic-ai-control-boundaries/index.html',
      'Agentic AI Control Boundaries',
    ],
    [
      'blog/secure-inference-data-minimization/index.html',
      'Secure Inference Starts with Data Minimization',
    ],
    [
      'blog/verifiable-ai-execution-records/index.html',
      'Verifiable AI Execution Records',
    ],
    [
      'insights/owasp-agentic-threat-boundaries/index.html',
      'OWASP Agentic Threat Boundaries',
    ],
    ['insights/llm-top-10-control-map/index.html', 'LLM Top 10 Control Map'],
    [
      'insights/blockchain-verification-limits/index.html',
      'Blockchain Verification Limits for AI',
    ],
    ['contact/index.html', 'Request an AI safety assessment'],
  ]);

  for (const [path, expectedCopy] of expectedPages) {
    const html = await readFile(resolve(DIST, path), 'utf8');
    const text = visibleText(html);
    assert.match(
      text,
      new RegExp(expectedCopy.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    );
    assert.doesNotMatch(text, /\bScrewFast\b/);
  }

  const homepage = await readFile(resolve(DIST, 'index.html'), 'utf8');
  assert.match(
    homepage,
    /\/ThySite\/_astro\/hero-image\.[A-Za-z0-9_-]+\.(?:avif|webp)/
  );
  assert.match(homepage, /\/ThySite\/banner-pattern\.svg/);

  for (const slug of ['item-a765', 'item-b203', 'item-f303', 'item-t845']) {
    assert.equal(
      await exists(`dist/products/${slug}/index.html`),
      false,
      `/products/${slug}/ must not be built`
    );
  }
  for (const slug of ['post-1', 'post-2', 'post-3']) {
    assert.equal(await exists(`dist/blog/${slug}/index.html`), false);
  }
  for (const slug of ['insight-1', 'insight-2', 'insight-3']) {
    assert.equal(await exists(`dist/insights/${slug}/index.html`), false);
  }

  const allBuiltCopy = [...expectedPages.keys()]
    .map(path => readFile(resolve(DIST, path), 'utf8'))
    .reduce(async (acc, next) => `${await acc}\n${await next}`, '');
  assert.doesNotMatch(
    visibleText(await allBuiltCopy),
    /guaranteed privacy|guaranteed compliance|zero exposure|solves all AI risks|prevents prompt injection/i
  );
});
