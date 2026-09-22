import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

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

test('homepage presents the approved Buckleson story and section sequence', async () => {
  const home = await source('src/views/HomeView.astro');
  const requiredCopy = [
    'AI safety infrastructure for real execution paths',
    'Use AI safely.',
    'Prove every action.',
    'Who we help',
    'A clear boundary for every AI participant',
    'Control · Protect · Verify',
    'Trust belongs in the execution path',
    'Three modules. One accountable flow.',
    'Security claims need boundaries too.',
    'Assess. Pilot. Operate.',
    'What the trust layer does—and does not do.',
    'Find the smallest practical path to safer AI.',
  ];

  let previous = -1;
  for (const copy of requiredCopy) {
    const position = home.indexOf(copy);
    assert.ok(position >= 0, `missing homepage copy: ${copy}`);
    assert.ok(position > previous, `homepage section is out of order: ${copy}`);
    previous = position;
  }

  for (const audience of [
    'Organizations',
    'AI teams',
    'Developers',
    'Individuals',
  ]) {
    assert.match(
      home,
      new RegExp(`\\[\\s*'${audience.replaceAll(' ', '\\s+')}'\\s*,`)
    );
  }
});

test('homepage has no legacy ratings, testimonials, client proof, pricing, auth, or construction imports', async () => {
  const home = await source('src/views/HomeView.astro');

  assert.doesNotMatch(
    home,
    /\b(?:Ratings?|ReviewComponent|(?:Full|Half)Stars?|Testimonials?|TestimonialItem|TestimonialsSection(?:Alt)?|ClientsSection|ClientLogos?|PartnersData|Pricing(?:Section)?|Authentication|Login(?:Btn|Modal)?|Register(?:Btn|Modal)?|GoogleBtn|DemoForm)\b/i
  );
  assert.doesNotMatch(
    home,
    /@(?:components|data|images)\/["'\w@&./-]*(?:construction|testimonial|client|avatar|pricing|auth|tool-box|blueprint|worker|building)["'\w@&./-]*/i
  );
  assert.doesNotMatch(
    home,
    /(?:12\.8k|4\.8\s*<|ConstructIt|customer logos?|trusted by industry leaders)/i
  );
  assert.doesNotMatch(
    home,
    /images\.unsplash\.com|https?:\/\/[^"']+\.(?:avif|jpe?g|png|webp)/i
  );
  assert.deepEqual(
    [...home.matchAll(/from '@images\/([^']+)'/g)].map(match => match[1]),
    ['buckleson/trust-orbit.png']
  );
});

test('both assessment actions use the exact shared booking URL in the same tab', async () => {
  const [home, constants] = await Promise.all([
    source('src/views/HomeView.astro'),
    source('src/data_files/constants.ts'),
  ]);

  assert.match(
    constants,
    /export const BOOKING_URL = 'https:\/\/cal\.com\/buckleson-group\/30min';/
  );
  assert.match(home, /import \{ BOOKING_URL \} from '@data\/constants'/);
  assert.match(
    home,
    /<PrimaryCTA title="Book an Assessment" url=\{BOOKING_URL\} \/>/
  );
  assert.match(
    home,
    /<a\s+[^>]*\bhref=\{BOOKING_URL\}[^>]*>\s*Book an Assessment\s*<span\s+aria-hidden="true"\s+class="ml-2">/
  );
  assert.equal([...home.matchAll(/BOOKING_URL/g)].length, 3);
  assert.doesNotMatch(home, /cal\.com\/buckleson-group\/30min/);
  assert.doesNotMatch(home, /target=(?:"_blank"|\{'_blank'\})/);
});

test('homepage exposes exactly the three primary modules with real base-safe product routes', async () => {
  const home = await source('src/views/HomeView.astro');
  const modulesBlock =
    home.match(/const modules = \[([\s\S]*?)\n\];/)?.[1] ?? '';
  const expected = [
    ['Hyper Tern', 'Control', '/products/hyper-tern'],
    ['Hyper-ABS', 'Protect', '/products/hyper-abs'],
    ['Hyper-0x', 'Verify', '/products/hyper-0x'],
  ];

  assert.deepEqual(
    [...modulesBlock.matchAll(/\bname:\s*'([^']+)'/g)].map(match => match[1]),
    expected.map(([name]) => name)
  );
  assert.deepEqual(
    [...modulesBlock.matchAll(/\baction:\s*'([^']+)'/g)].map(match => match[1]),
    expected.map(([, action]) => action)
  );
  assert.deepEqual(
    [...modulesBlock.matchAll(/\bhref:\s*'([^']+)'/g)].map(match => match[1]),
    expected.map(([, , href]) => href)
  );
  assert.doesNotMatch(modulesBlock, /Hyper Wallet|item-[a-z0-9]+/i);
  assert.match(
    home,
    /<a\s+[^>]*\bhref=\{sitePath\(module\.href\)\}[^>]*>\s*Explore \{module\.name\}/
  );
});

test('homepage routes both platform actions through one project-base-aware path', async () => {
  const home = await source('src/views/HomeView.astro');

  assert.match(home, /import \{ sitePath \} from '@utils\/paths'/);
  assert.match(home, /const platformPath = sitePath\('\/products'\);/);
  assert.equal([...home.matchAll(/href=\{platformPath\}/g)].length, 2);
  assert.match(
    home,
    /<a\s+[^>]*\bhref=\{platformPath\}[^>]*>\s*Explore the platform\s*<\/a>/
  );
  assert.match(
    home,
    /<a\s+[^>]*\bhref=\{platformPath\}[^>]*>\s*See the complete platform\s*<\/a>/
  );
});

test('homepage qualifies security, privacy, correctness, and deployment claims', async () => {
  const home = await source('src/views/HomeView.astro');

  assert.match(home, /reduce unnecessary raw-data exposure/i);
  assert.match(
    home,
    /Effectiveness depends on policy quality and integration coverage\./
  );
  assert.match(
    home,
    /It complements—rather than replaces—the\s+controls around the rest of your environment\./
  );
  assert.match(home, /it does not prove that an AI decision was correct\./i);
  assert.match(home, /Does Buckleson guarantee privacy\?[\s\S]*?'No\./);
  assert.match(
    home,
    /Privacy still depends on the full deployment, integrations, policies, and operating practices\./
  );
  assert.match(home, /Does this replace our security program\?[\s\S]*?'No\./);
  assert.match(
    home,
    /An assessment determines whether the required enforcement points exist/
  );
  assert.doesNotMatch(
    home,
    /(?:guarantees (?:privacy|security|compliance)|zero (?:risk|exposure)|solves? all AI|prevents? every attack)/i
  );
});

test('architecture figure has a labelled description and keyboard-scrollable viewport', async () => {
  const diagram = await source(
    'src/components/sections/landing/TrustArchitecture.astro'
  );

  assert.match(
    diagram,
    /<figure[\s\S]*?aria-labelledby="trust-architecture-title"/
  );
  assert.match(diagram, /aria-describedby="trust-architecture-description"/);
  assert.match(diagram, /<h3\s+[^>]*\bid="trust-architecture-title"[^>]*>/);
  assert.match(
    diagram,
    /<p\s+[^>]*\bid="trust-architecture-description"[^>]*>/
  );
  assert.match(
    diagram,
    /<div\s+(?=[^>]*\bclass="overflow-x-auto pb-2")(?=[^>]*\btabindex="0")(?=[^>]*\baria-label="Scrollable trust architecture diagram")[^>]*>/
  );
  assert.match(
    diagram,
    /<svg[\s\S]*?role="img"[\s\S]*?aria-labelledby="trust-svg-title trust-svg-description"/
  );
  assert.match(
    diagram,
    /<title id="trust-svg-title">Buckleson trust and execution architecture<\/title>/
  );
  assert.match(diagram, /<desc id="trust-svg-description">[^<]+<\/desc>/);
});

test('architecture SVG contains a complete readable static path before JavaScript', async () => {
  const diagram = await source(
    'src/components/sections/landing/TrustArchitecture.astro'
  );
  const markup = diagram.split('<script>')[0];
  const labels = [
    'AI request',
    'Hyper Tern',
    'Hyper-ABS',
    'AI model',
    'App',
    'Hyper-0x',
    'Verifiable execution record',
  ];

  assert.match(markup, /<svg\b/);
  assert.equal([...markup.matchAll(/data-architecture-node/g)].length, 6);
  assert.equal([...markup.matchAll(/data-architecture-path/g)].length, 1);
  assert.ok([...markup.matchAll(/<path\b/g)].length >= 6);
  for (const label of labels)
    assert.ok(markup.includes(label), `missing static SVG label: ${label}`);
  assert.doesNotMatch(
    markup,
    /data-architecture-node[^>]*(?:hidden|opacity-0|display:\s*none)/i
  );
  assert.doesNotMatch(
    markup,
    /data-architecture-path[^>]*(?:hidden|opacity-0|display:\s*none)/i
  );
});

test('Anime.js animation is scoped, finite, cleaned up, and bypassed for reduced motion', async () => {
  const diagram = await source(
    'src/components/sections/landing/TrustArchitecture.astro'
  );
  const script = diagram.split('<script>')[1] ?? '';

  assert.match(
    script,
    /import \{ animate, createScope, stagger \} from 'animejs'/
  );
  assert.match(
    script,
    /const scopes = new WeakMap<Element, ReturnType<typeof createScope>>\(\)/
  );
  assert.match(
    script,
    /document\s*\.querySelectorAll<HTMLElement>\('\[data-trust-architecture\]'\)/
  );
  assert.match(script, /scopes\.get\(root\)\?\.revert\(\)/);
  assert.match(
    script,
    /createScope\(\{[\s\S]*?root,[\s\S]*?reducedMotion: '\(prefers-reduced-motion: reduce\)'/
  );
  assert.match(
    script,
    /if \(!context \|\| context\.matches\.reducedMotion\) return;[\s\S]*?animate\('/
  );
  assert.equal([...script.matchAll(/\banimate\('/g)].length, 2);
  assert.match(script, /duration: 560/);
  assert.match(script, /duration: 640/);
  assert.doesNotMatch(
    script,
    /\b(?:loop|alternate|autoplay):\s*(?:true|Infinity)/
  );
  assert.match(
    script,
    /document\.addEventListener\(\s*'DOMContentLoaded',\s*initialiseArchitecture,\s*\{\s*once:\s*true,?\s*\}\s*\)/
  );
  assert.match(script, /astro:page-load', initialiseArchitecture/);
  assert.match(
    script,
    /astro:before-swap'[\s\S]*?scopes\.get\(root\)\?\.revert\(\)/
  );
});

test('hero artwork is a local transparent PNG with deterministic provenance', async () => {
  const [home, generator, ledger] = await Promise.all([
    source('src/views/HomeView.astro'),
    source('scripts/build-site-assets.mjs'),
    source('docs/asset-ledger.md'),
  ]);
  const assetPath = 'src/images/buckleson/trust-orbit.png';

  assert.equal(await exists(assetPath), true);
  const metadata = await sharp(resolve(ROOT, assetPath)).metadata();
  assert.equal(metadata.format, 'png');
  assert.equal(metadata.width, 1200);
  assert.equal(metadata.height, 1200);
  assert.equal(metadata.hasAlpha, true);

  assert.match(
    home,
    /import trustOrbit from '@images\/buckleson\/trust-orbit\.png'/
  );
  assert.match(
    home,
    /<Image\s+(?=[^>]*\bsrc=\{trustOrbit\})(?=[^>]*\balt="")(?=[^>]*\bloading="eager")[^>]*\/>/
  );
  assert.match(
    generator,
    /path\.join\(\s*projectRoot,\s*'src',\s*'images',\s*'buckleson',\s*'trust-orbit\.png',?\s*\)/
  );
  assert.match(generator, /sharp\(Buffer\.from\(visual\)\)/);
  assert.doesNotMatch(
    generator,
    /https?:\/\/(?!www\.w3\.org\/2000\/svg\b)|\bfetch\s*\(|Math\.random|Date\.now|randomUUID/i
  );
  assert.match(
    ledger,
    /\*\*Path:\*\* `src\/images\/buckleson\/trust-orbit\.png`/
  );
  assert.match(
    ledger,
    /\*\*Purpose:\*\* Text-free abstract visual for the homepage hero/i
  );
  assert.match(
    ledger,
    /\*\*Source:\*\* Deterministic project-local SVG geometry rasterized with Sharp/i
  );
  assert.match(ledger, /\*\*Claim limitation:\*\* Decorative only\./i);
  assert.match(
    ledger,
    /not a network topology, performance result, customer architecture, or evidence of a deployed system/i
  );
});

test('homepage imagery cannot depict external people, customers, or fabricated deployments', async () => {
  const [home, ledger] = await Promise.all([
    source('src/views/HomeView.astro'),
    source('docs/asset-ledger.md'),
  ]);

  assert.equal([...home.matchAll(/<Image\b/g)].length, 1);
  assert.doesNotMatch(
    home,
    /\b(?:persons?|people|portraits?|avatars?|customers?|client logos?|deployment screenshots?)\b/i
  );
  assert.doesNotMatch(home, /https?:\/\/[^\s"')]+/i);
  assert.match(
    ledger,
    /no text, people, logos, customer data, or product screenshots/i
  );
});
