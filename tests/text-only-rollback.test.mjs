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
  'item-a765.md',
  'item-b203.md',
  'item-f303.md',
  'item-t845.md',
];
const BLOG_FILES = ['post-1.md', 'post-2.md', 'post-3.md'];
const INSIGHT_FILES = ['insight-1.md', 'insight-2.md', 'insight-3.md'];

const TEXT_ONLY_SOURCE_CHANGES = [
  ...BLOG_FILES.map(name => `src/content/blog/en/${name}`),
  ...INSIGHT_FILES.map(name => `src/content/insights/en/${name}`),
  ...PRODUCT_FILES.map(name => `src/content/products/en/${name}`),
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

test('restores original content filenames and removes visual-conversion slugs', async () => {
  assert.deepEqual(await filesBelow('src/content/products/en'), PRODUCT_FILES);
  assert.deepEqual(await filesBelow('src/content/blog/en'), BLOG_FILES);
  assert.deepEqual(await filesBelow('src/content/insights/en'), INSIGHT_FILES);

  const allContent = await filesBelow('src/content');
  assert.deepEqual(
    allContent.filter(path =>
      /(?:^|\/)hyper-(?:tern|abs|0x|wallet)\.mdx?$/.test(path)
    ),
    []
  );
  assert.deepEqual(
    allContent.filter(path =>
      /(?:agentic-control-boundaries|reducing-data-exposure|verifiable-ai-execution|ai-risk-control-map|prompt-injection-boundaries|secure-inference-design)\.mdx?$/.test(
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

test('limits source changes from the pre-conversion baseline to approved text/data/content, contact email text, and two public URLs', async () => {
  const { stdout: changedOutput } = await execFileAsync(
    'git',
    ['diff', '--name-only', 'f82578d^', '--', 'src'],
    { cwd: ROOT, encoding: 'utf8' }
  );
  const changedPaths = changedOutput.split(/\r?\n/).filter(Boolean).sort();
  assert.deepEqual(changedPaths, TEXT_ONLY_SOURCE_CHANGES);

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

  const contact = await source('src/components/sections/misc/ContactSection.astro');
  assert.match(contact, /support@buckleson\.com/);
  assert.doesNotMatch(contact, /support@screwfast\.uk/);
});

test('built output serves restored routes with Buckleson copy and no hyper-slug pages', async () => {
  const expectedPages = new Map([
    ['index.html', 'Use AI safely with'],
    ['products/index.html', 'Buckleson Platform'],
    ['products/item-a765/index.html', 'Hyper Tern'],
    ['products/item-b203/index.html', 'Hyper-ABS'],
    ['products/item-f303/index.html', 'Hyper-0x'],
    ['products/item-t845/index.html', 'Hyper Wallet'],
    ['blog/post-1/index.html', 'Start AI Safety with Control Boundaries'],
    ['blog/post-2/index.html', 'Reducing Data Exposure Before Inference'],
    ['blog/post-3/index.html', 'Why AI Workflows Need Execution Evidence'],
    ['insights/insight-1/index.html', 'Agentic AI Threats Need Boundaries'],
    [
      'insights/insight-2/index.html',
      'Secure Inference Starts with Data Minimization',
    ],
    [
      'insights/insight-3/index.html',
      'What Blockchain Can and Cannot Prove for AI',
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

  for (const slug of ['hyper-tern', 'hyper-abs', 'hyper-0x', 'hyper-wallet']) {
    assert.equal(
      await exists(`dist/products/${slug}/index.html`),
      false,
      `/products/${slug}/ must not be built`
    );
  }
});
