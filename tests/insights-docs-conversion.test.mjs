import assert from 'node:assert/strict';
import { access, readFile, readdir } from 'node:fs/promises';
import { dirname, relative, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = resolve(ROOT, 'dist');
const BOOKING_URL = 'https://cal.com/buckleson-group/30min';

const BLOG_SLUGS = [
  'agentic-control-boundaries',
  'reducing-data-exposure',
  'verifiable-ai-execution',
];
const INSIGHT_SLUGS = [
  'ai-risk-control-map',
  'prompt-injection-boundaries',
  'secure-inference-design',
];
const INSIGHT_ASSETS = [
  'agent-boundaries.png',
  'data-exposure.png',
  'execution-evidence.png',
  'prompt-injection.png',
  'risk-control-map.png',
  'secure-inference.png',
];

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

function frontmatter(markdown) {
  return markdown.match(/^---\s*\n([\s\S]*?)\n---/m)?.[1] ?? '';
}

function htmlUrls(html) {
  const urls = [];
  for (const match of html.matchAll(/\b(?:href|src)=(['"])(.*?)\1/gi)) {
    urls.push(match[2]);
  }
  for (const match of html.matchAll(/\bsrcset=(['"])(.*?)\1/gi)) {
    for (const candidate of match[2].split(',')) {
      urls.push(candidate.trim().split(/\s+/)[0]);
    }
  }
  return urls;
}

test('content collections expose exactly three Buckleson field notes and three risk explainers', async () => {
  assert.deepEqual(
    (await filesBelow('src/content/blog/en')).map(path =>
      path.replace(/\.mdx?$/, '')
    ),
    BLOG_SLUGS
  );
  assert.deepEqual(
    (await filesBelow('src/content/insights/en')).map(path =>
      path.replace(/\.mdx?$/, '')
    ),
    INSIGHT_SLUGS
  );

  const allContent = await filesBelow('src/content');
  assert.deepEqual(
    allContent.filter(path =>
      /(?:^|\/)(?:post|insight)-[^/]+\.mdx?$/.test(path)
    ),
    []
  );
});

test('blog schema uses an organization author without role or portrait fields', async () => {
  const config = await source('src/content.config.ts');
  const blogSchema =
    config.match(
      /const blogCollection[\s\S]*?(?=const insightsCollection)/
    )?.[0] ?? '';

  assert.ok(blogSchema, 'blog collection schema must be present');
  assert.match(blogSchema, /author:\s*z\.string\(\)/);
  assert.doesNotMatch(blogSchema, /author(?:Image|Avatar|Role)|\brole:\s*z\./i);

  for (const slug of BLOG_SLUGS) {
    const markdown = await source(`src/content/blog/en/${slug}.md`);
    assert.match(
      frontmatter(markdown),
      /^author:\s*['"]Buckleson Research['"]$/m
    );
    assert.doesNotMatch(
      frontmatter(markdown),
      /^(?:authorImage|authorAvatar|role):/m
    );
  }
});

test('all six articles are English, locally illustrated, and bounded without template proof', async () => {
  const paths = [
    ...BLOG_SLUGS.map(slug => `src/content/blog/en/${slug}.md`),
    ...INSIGHT_SLUGS.map(slug => `src/content/insights/en/${slug}.md`),
  ];
  const requiredLimits =
    /does not|do not|not (?:a|the|to)|depends on|outside the boundary|cannot prove/i;

  for (const path of paths) {
    const markdown = await source(path);
    const metadata = frontmatter(markdown);
    assert.match(
      metadata,
      /^title:\s*['"][^'"]+['"]$/m,
      `${path} needs a title`
    );
    assert.match(
      metadata,
      /^description:\s*['"][^'"]+['"]$/m,
      `${path} needs a description`
    );
    assert.match(
      metadata,
      /^cardImage:\s*['"]@\/images\/buckleson\/insights\/[a-z0-9-]+\.png['"]$/m,
      `${path} must use a local Buckleson image`
    );
    assert.match(
      metadata,
      /^cardImageAlt:\s*['"][^'"]{20,}['"]$/m,
      `${path} needs useful image alt text`
    );
    assert.match(
      markdown,
      requiredLimits,
      `${path} must state a control boundary`
    );
    assert.doesNotMatch(
      markdown,
      /ScrewFast|\bconstruction\b|hardware|trusted by|customers?(?:['’]s|['’])?\s+(?:logos?|names?|testimonials?|case studies|deployments?|results?|proof)|client logos?|pilot with|fundrais|\b(?:TAM|SAM|SOM)\b|we guarantee|guaranteed (?:privacy|security|safety|compliance)|10x Technologies/i,
      `${path} contains template, customer, investor, or guarantee copy`
    );
    assert.doesNotMatch(
      markdown,
      /\b(?:Accueil|Produits|À propos|Contactez-nous|En savoir plus|Sécurité de l'IA)\b/i,
      `${path} contains non-English interface copy`
    );
  }
});

test('Insights views use accessible local content and base-safe links without template widgets', async () => {
  const [index, post, insight, detail] = await Promise.all([
    source('src/views/BlogIndexView.astro'),
    source('src/views/BlogPostView.astro'),
    source('src/views/InsightView.astro'),
    source('src/components/sections/insights/InsightDetail.astro'),
  ]);
  const combined = [index, post, insight, detail].join('\n');

  assert.match(index, /title="Insights"/);
  assert.match(index, /ogTitle="Buckleson AI Safety Insights"/);
  assert.match(index, /entriesFor\('blog', locale\)/);
  assert.match(index, /entriesFor\('insights', locale\)/);
  assert.match(index, /href=\{pathFor\((?:featuredPost|post|insight)\)\}/);
  assert.match(
    index,
    /<Image\s+[^>]*src=\{[^}]+\.data\.cardImage\}[^>]*alt=\{[^}]+\.data\.cardImageAlt\}/
  );

  assert.match(post, /title=\{post\.data\.title\}/);
  assert.match(post, /description=\{post\.data\.description\}/);
  assert.match(post, /kind=\{\{\s*type:\s*'BlogPosting'/);
  assert.match(post, /href=\{pathFor\(entry\)\}/);
  assert.match(post, /src=\{post\.data\.cardImage\}/);
  assert.match(post, /alt=\{post\.data\.cardImageAlt\}/);

  assert.match(insight, /kind=\{\{\s*type:\s*'Article'/);
  assert.match(insight, /<InsightDetail post=\{post\}\s*\/>/);
  assert.match(detail, /src=\{post\.data\.cardImage\}/);
  assert.match(detail, /alt=\{post\.data\.cardImageAlt\}/);
  assert.match(detail, /href=\{sitePath\('\/blog'\)\}/);

  assert.doesNotMatch(
    combined,
    /AvatarBlog|anna\.avif|brad\.avif|jacob\.avif|Bookmark|SocialShare|PostFeedback|GSAP|gsap|Testimonial|customer logo|@images\/(?:blog|insights)\//i
  );
});

test('BlogPosting structured data identifies its author as an Organization', async () => {
  const [metadata, post] = await Promise.all([
    source('src/utils/metadata.ts'),
    source('src/views/BlogPostView.astro'),
  ]);
  const blogPostingCase =
    metadata.match(/case 'BlogPosting':[\s\S]*?(?=\s+break;)/)?.[0] ?? '';

  assert.ok(blogPostingCase, 'BlogPosting metadata branch must exist');
  assert.match(blogPostingCase, /'@type':\s*'BlogPosting'/);
  assert.match(
    blogPostingCase,
    /author:\s*\{\s*'@type':\s*'Organization',\s*name:\s*kind\.author\s*\}/
  );
  assert.doesNotMatch(blogPostingCase, /'@type':\s*'Person'/);
  assert.match(post, /author:\s*post\.data\.author/);
});

test('six deterministic transparent insight covers have exact geometry and ledger limits', async () => {
  const actualAssets = await filesBelow('src/images/buckleson/insights');
  assert.deepEqual(actualAssets, INSIGHT_ASSETS);

  for (const asset of INSIGHT_ASSETS) {
    const metadata = await sharp(
      resolve(ROOT, 'src/images/buckleson/insights', asset)
    ).metadata();
    assert.equal(metadata.format, 'png', `${asset} must be PNG`);
    assert.equal(metadata.width, 1600, `${asset} width changed`);
    assert.equal(metadata.height, 1000, `${asset} height changed`);
    assert.equal(metadata.hasAlpha, true, `${asset} must retain transparency`);
  }

  const [generator, ledger] = await Promise.all([
    source('scripts/build-site-assets.mjs'),
    source('docs/asset-ledger.md'),
  ]);
  for (const stem of INSIGHT_ASSETS.map(asset => asset.replace(/\.png$/, ''))) {
    assert.match(generator, new RegExp(`\\['${stem}'\\s*,\\s*\\d+\\]`));
    assert.match(
      ledger,
      new RegExp(`(?:^|[\\s/\x60])${stem}\\.png(?:[\\s,\x60]|$)`)
    );
  }
  assert.match(generator, /width="1600" height="1000" viewBox="0 0 1600 1000"/);
  assert.match(
    generator,
    /path\.join\([\s\S]*?'src',[\s\S]*?'images',[\s\S]*?'buckleson',[\s\S]*?'insights'/
  );
  assert.match(
    generator,
    /sharp\(Buffer\.from\(buildInsightVisual\(index\)\)\)[\s\S]*?\.png\(\{ compressionLevel: 9, adaptiveFiltering: true \}\)[\s\S]*?\.toFile\(assetPath\)/
  );
  const svgNamespace = 'xmlns="http://www.w3.org/2000/svg"';
  assert.equal(
    [...generator.matchAll(new RegExp(svgNamespace, 'g'))].length,
    2
  );
  const generatorWithoutSvgNamespace = generator.replaceAll(
    svgNamespace,
    'xmlns=""'
  );
  assert.doesNotMatch(
    generatorWithoutSvgNamespace,
    /Math\.random|Date\.now|fetch\(|https?:\/\/|[A-F]:\\/i
  );
  assert.match(ledger, /\*\*Purpose:\*\*[\s\S]*?educational articles/i);
  assert.match(
    ledger,
    /\*\*Source:\*\*[\s\S]*?Deterministic project-local SVG geometry rasterized with Sharp/i
  );
  assert.match(ledger, /no words, brands, people, customer systems/i);
  assert.match(
    ledger,
    /do not depict a customer environment[\s\S]*?or proof that a control prevents a threat/i
  );
});

test('English Starlight overview covers all modules, limits, base-safe links, and exact booking URL', async () => {
  const docs = await source('src/content/docs/welcome-to-docs.mdx');

  assert.match(docs, /^title:\s*Buckleson Platform Overview$/m);
  for (const moduleName of [
    'Hyper Tern',
    'Hyper-ABS',
    'Hyper-0x',
    'Hyper Wallet',
  ]) {
    assert.match(docs, new RegExp(moduleName.replace('-', '\\-')));
  }
  assert.match(docs, /Public claim boundaries/);
  assert.match(docs, /does not guarantee privacy/i);
  assert.match(docs, /does not prove an AI action was safe or correct/i);
  assert.match(docs, /import \{ sitePath \} from '@utils\/paths'/);
  assert.match(docs, /href=\{sitePath\('\/products'\)\}/);
  assert.match(docs, /href=\{sitePath\('\/blog'\)\}/);
  assert.equal(
    [...docs.matchAll(new RegExp(BOOKING_URL.replaceAll('/', '\\/'), 'g'))]
      .length,
    2
  );
  assert.doesNotMatch(docs, /href=["']\/(?:products|blog)\/?["']/);
  const docsWithoutBoundedGuarantee = docs.replace(
    /\bdoes not guarantee (?:privacy|security|safety)\b/gi,
    ''
  );
  assert.doesNotMatch(
    docsWithoutBoundedGuarantee,
    /ScrewFast|\bconstruction\b|guarantees? (?:privacy|security|safety)/i
  );
});

test('Starlight uses Violet Bloom light tokens and Vercel dark tokens without legacy branding', async () => {
  const css = await source('src/assets/styles/starlight.css');
  const dark = css.match(/:root\s*\{([\s\S]*?)\n\}/)?.[1] ?? '';
  const light =
    css.match(/:root\[data-theme='light'\]\s*\{([\s\S]*?)\n\}/)?.[1] ?? '';

  assert.ok(dark && light, 'both Starlight theme token blocks must exist');
  for (const [token, value] of [
    ['--sl-color-accent', '#a78bfa'],
    ['--sl-color-accent-high', '#ddd6fe'],
    ['--sl-color-accent-low', '#2e1065'],
    ['--sl-color-black', '#0a0a0a'],
    ['--sl-color-gray-6', '#171717'],
  ]) {
    assert.match(dark, new RegExp(`${token}:\\s*${value}`));
  }
  for (const [token, value] of [
    ['--sl-color-accent', '#7c3aed'],
    ['--sl-color-accent-high', '#4c1d95'],
    ['--sl-color-accent-low', '#ede9fe'],
    ['--sl-color-black', '#ffffff'],
    ['--sl-color-gray-1', '#111827'],
    ['--sl-color-gray-7', '#f9fafb'],
  ]) {
    assert.match(light, new RegExp(`${token}:\\s*${value}`));
  }
  assert.doesNotMatch(css, /orange|yellow|amber|#fbbf24|#f59e0b|#facc15/i);
});

test('obsolete template components, data, dependencies, and images are absent and unreferenced', async () => {
  const absentPaths = [
    'public/banner-pattern.svg',
    'src/assets/scripts/demoForms.ts',
    'src/assets/styles/starlight_main.css',
    'src/components/sections/features',
    'src/components/sections/misc',
    'src/components/sections/pricing',
    'src/components/sections/testimonials',
    'src/components/ui/avatars',
    'src/components/ui/cards',
    'src/components/ui/feedback',
    'src/components/ui/forms',
    'src/components/ui/stars',
    'src/data_files/faqs.json',
    'src/data_files/features.json',
    'src/data_files/mega_link.ts',
    'src/data_files/pricing.json',
    'src/images/blog',
    'src/images/insights',
    'src/images/starlight/screwfast_hero.svg',
    'src/images/starlight/screwfast_hero_dark.svg',
    'src/images/starlight/screwfast_logo.svg',
    'src/images/starlight/screwfast_logo_dark.svg',
  ];
  const obsoleteRootImages = [
    'aerial-view.avif',
    'automated-tools.avif',
    'before-after.avif',
    'blueprint-1.avif',
    'blueprint-2.avif',
    'blueprints-image.avif',
    'construction-image.avif',
    'construction-workers.avif',
    'dashboard-image.avif',
    'features-image.avif',
    'hero-image.avif',
    'person-working.avif',
    'product-image-1.avif',
    'product-image-2.avif',
    'product-image-3.avif',
    'product-image-4.avif',
    'product-image-main-1.avif',
    'product-image-main-2.avif',
    'product-image-main-3.avif',
    'product-image-main-4.avif',
    'progress-building.avif',
    'under-construction.avif',
    'using-tools.avif',
  ];

  for (const path of [
    ...absentPaths,
    ...obsoleteRootImages.map(name => `src/images/${name}`),
  ]) {
    assert.equal(await exists(path), false, `${path} must be removed`);
  }

  const [packageJson, lockfile] = await Promise.all([
    source('package.json'),
    source('pnpm-lock.yaml'),
  ]);
  const manifest = JSON.parse(packageJson);
  for (const dependency of ['clipboard', 'gsap']) {
    assert.equal(manifest.dependencies?.[dependency], undefined);
    assert.equal(manifest.devDependencies?.[dependency], undefined);
    assert.doesNotMatch(
      lockfile,
      new RegExp(`(?:^|/)${dependency}(?:@|:)`, 'mi')
    );
  }

  const searchable = (await filesBelow('src')).filter(path =>
    /\.(?:astro|mdx?|[cm]?[jt]s|json|css)$/.test(path)
  );
  const staleReferences = [];
  const stalePattern =
    /ScrewFast|post-[123]\.avif|insight-[123]\.avif|anna\.avif|brad\.avif|jacob\.avif|banner-pattern|@images\/(?:aerial-view|construction|blueprint|product-image|hero-image|features-image|dashboard-image)|\b(?:AvatarBlog|Bookmark|SocialShare|PostFeedback|CardBlog|CardInsight|TestimonialItem)\b|from ['"](?:gsap|clipboard)['"]/i;
  for (const path of searchable) {
    const contents = await source(`src/${path}`);
    if (stalePattern.test(contents)) staleReferences.push(path);
  }
  assert.deepEqual(staleReferences, []);
});

test('project guidance, minimal copy, and content map describe the implemented Buckleson surfaces', async () => {
  const [readme, guide, context, copy, map] = await Promise.all([
    source('README.md'),
    source('AI_GUIDE.md'),
    source('CONTEXT.md'),
    source('src/copy/en.ts'),
    source('docs/site-content-map.md'),
  ]);
  const combined = [readme, guide, context].join('\n');

  assert.match(readme, /^# Buckleson website$/m);
  assert.match(readme, /English-only AI safety Insights library/);
  assert.match(readme, new RegExp(BOOKING_URL.replaceAll('/', '\\/')));
  for (const route of [
    '/products/',
    '/products/hyper-tern/',
    '/products/hyper-abs/',
    '/products/hyper-0x/',
    '/products/hyper-wallet/',
    '/services/',
    '/blog/',
    '/welcome-to-docs/',
  ]) {
    assert.ok(guide.includes(route), `AI_GUIDE.md is missing ${route}`);
  }
  assert.match(context, /Buckleson’s in-house verification layer/);
  assert.match(context, /does not prove the action was safe or correct/);
  assert.doesNotMatch(
    combined,
    /ScrewFast|construction template|item-a765|post-1|insight-1/i
  );

  assert.match(copy, /English-only interface copy/);
  assert.match(copy, /Buckleson helps organizations/);
  assert.doesNotMatch(
    copy,
    /auth|login|sign up|newsletter|pricing|ScrewFast|construction/i
  );
  assert.deepEqual(
    [...copy.matchAll(/^\s{2}([a-zA-Z]+):\s*\{/gm)].map(match => match[1]),
    ['site', 'layout', 'nav', 'notFound']
  );

  assert.match(
    map,
    /Status:\s*implemented through the public Home, Platform, Solutions, Insights, documentation, metadata, and asset-conversion units/i
  );
  assert.match(
    map,
    /\| Contact\/demo form[^\r\n]*directly to the approved Buckleson Cal\.com page[^\r\n]*https:\/\/cal\.com\/buckleson-group\/30min[^\r\n]*\|/i
  );
  assert.doesNotMatch(
    map,
    /implement the assessment form|Buckleson contact route/i
  );
  const notFoundMapping = map.match(/^\| 404 page[^\r\n]*$/im)?.[0] ?? '';
  assert.ok(notFoundMapping, 'content map must retain a 404-page row');
  assert.doesNotMatch(
    notFoundMapping,
    /Home, Platform and Contact|links? (?:back )?to [^|]*\bContact\b/i
  );
  assert.match(notFoundMapping, /Return home|Go Home|go back|previous page/i);
});

test('built Insights output has no legacy copy and every internal image or link resolves under the project base', async () => {
  const pagePaths = [
    'blog/index.html',
    ...BLOG_SLUGS.map(slug => `blog/${slug}/index.html`),
    ...INSIGHT_SLUGS.map(slug => `insights/${slug}/index.html`),
    'welcome-to-docs/index.html',
  ];
  const allBuiltFiles = await filesBelow('dist');

  assert.ok(
    allBuiltFiles.length > 0,
    'production build must exist before this test'
  );
  for (const path of pagePaths) {
    const html = await readFile(resolve(DIST, path), 'utf8');
    assert.doesNotMatch(
      html,
      /ScrewFast|\bconstruction\b|item-a765|post-[123]\.avif|insight-[123]\.avif|anna\.avif|brad\.avif|jacob\.avif|trusted by|customer logos?|fundrais|\b(?:TAM|SAM|SOM)\b/i,
      `${path} contains legacy or restricted public copy`
    );
    for (const url of htmlUrls(html)) {
      if (
        !url ||
        url.startsWith('#') ||
        /^(?:https?:|mailto:|tel:|data:|\/\/)/i.test(url)
      )
        continue;
      assert.ok(
        url === '/ThySite' || url.startsWith('/ThySite/'),
        `${path} has a non-base-safe URL: ${url}`
      );
      const target = decodeURIComponent(url.split(/[?#]/)[0]).replace(
        /^\/ThySite\/?/,
        ''
      );
      if (!target) continue;
      const direct = resolve(DIST, target);
      const index = resolve(DIST, target, 'index.html');
      assert.ok(
        allBuiltFiles.includes(relative(DIST, direct).replaceAll('\\', '/')) ||
          allBuiltFiles.includes(relative(DIST, index).replaceAll('\\', '/')),
        `${path} references missing built target ${url}`
      );
    }
  }
});
