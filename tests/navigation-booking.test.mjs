import assert from 'node:assert/strict';
import { access, readFile, readdir } from 'node:fs/promises';
import { dirname, relative, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const BOOKING_URL = 'https://cal.com/buckleson-group/30min';

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
  const base = resolve(ROOT, path);
  const files = [];
  async function visit(directory) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const absolute = resolve(directory, entry.name);
      if (entry.isDirectory()) await visit(absolute);
      else files.push(relative(ROOT, absolute).replaceAll('\\', '/'));
    }
  }
  if (await exists(path)) await visit(base);
  return files.sort();
}

async function loadPathHelpers() {
  const pathSource = await source('src/utils/paths.ts');
  const executable = pathSource
    .replace(
      /^const viteEnv[\s\S]*?const base = [\s\S]*?;\s*/,
      "const base = '/ThySite';\n"
    )
    .replaceAll('export function', 'function')
    .replace("path = '/'): string", "path = '/')")
    .replace('path: string): string', 'path)');
  return Function(
    `'use strict';\n${executable}\nreturn { sitePath, stripSiteBase };`
  )();
}

async function loadLocalePath(sitePath) {
  const localeSource = await source('src/utils/locale.ts');
  const declaration = localeSource.match(
    /export function localePath\([\s\S]*?\n\}/
  );
  assert.ok(declaration, 'localePath declaration must exist');
  const executable = declaration[0]
    .replace('export function', 'function')
    .replace('locale: MarketingLocale', 'locale')
    .replace("path = '/'): string", "path = '/')");
  return Function(
    'sitePath',
    'DEFAULT_LOCALE',
    `'use strict';\n${executable}\nreturn localePath;`
  )(sitePath, 'en');
}

test('declares the exact assessment booking URL as the single shared constant', async () => {
  const constants = await source('src/data_files/constants.ts');

  assert.match(
    constants,
    /export const BOOKING_URL = 'https:\/\/cal\.com\/buckleson-group\/30min';/
  );
  assert.equal(
    [...constants.matchAll(/https:\/\/cal\.com\/buckleson-group\/30min/g)]
      .length,
    1
  );
});

test('sitePath and localePath preserve external booking URLs exactly', async () => {
  const { sitePath } = await loadPathHelpers();
  const localePath = await loadLocalePath(sitePath);

  assert.equal(sitePath(BOOKING_URL), BOOKING_URL);
  assert.equal(localePath('en', BOOKING_URL), BOOKING_URL);
  assert.equal(
    localePath('en', 'mailto:security@example.com'),
    'mailto:security@example.com'
  );
  assert.equal(
    localePath('en', '//cdn.example.com/asset.js'),
    '//cdn.example.com/asset.js'
  );
  assert.equal(localePath('en', '#controls'), '#controls');
});

test('navigation order and English labels are exactly the approved public set', async () => {
  const [navigation, copy] = await Promise.all([
    source('src/data_files/navigation.ts'),
    source('src/copy/en.ts'),
  ]);

  assert.match(
    navigation,
    /type NavLinkId = 'home' \| 'products' \| 'services' \| 'blog'/
  );
  const ordered = ['home', 'products', 'services', 'blog'];
  let previous = -1;
  for (const id of ordered) {
    const position = navigation.indexOf(`id: '${id}'`);
    assert.ok(position > previous, `${id} must appear in approved order`);
    previous = position;
  }
  assert.match(copy, /home: 'Home'/);
  assert.match(copy, /products: 'Platform'/);
  assert.match(copy, /services: 'Solutions'/);
  assert.match(copy, /blog: 'Insights'/);
  assert.match(copy, /bookAssessment: 'Book an Assessment'/);
  assert.doesNotMatch(navigation, /contact|login|signup|sign-up/i);
});

test('desktop and mobile navigation share the same direct same-tab assessment action', async () => {
  const [navbar, navLink] = await Promise.all([
    source('src/components/sections/navbar&footer/Navbar.astro'),
    source('src/components/ui/links/NavLink.astro'),
  ]);

  assert.match(navbar, /import \{ BOOKING_URL \} from '@data\/constants'/);
  assert.match(navbar, /\{navLinks\.map\(link => \(/);
  assert.match(navbar, /url=\{localePath\(locale, link\.path\)\}/);
  assert.match(navLink, /href=\{url\}/);
  assert.match(
    navbar,
    /<NavbarToggle target="navbar-collapse-with-animation" \/>/
  );
  assert.match(navbar, /id="navbar-collapse-with-animation"/);
  assert.match(navbar, /hs-collapse hidden[\s\S]*?md:block/);
  assert.match(
    navbar,
    /href=\{BOOKING_URL\}[\s\S]*?\{t\.nav\.bookAssessment\}/
  );
  assert.doesNotMatch(
    navbar,
    /href=\{(?:sitePath|localePath)\([^)]*BOOKING_URL/
  );
  assert.doesNotMatch(navbar, /target=(?:"_blank"|\{'_blank'\})/);
  assert.doesNotMatch(navbar, /Auth|Login|Register|GoogleBtn|contact/i);
});

test('footer exposes only real public navigation, booking, GitHub, and Buckleson identity', async () => {
  const [footer, navigation, constants] = await Promise.all([
    source('src/components/sections/navbar&footer/FooterSection.astro'),
    source('src/data_files/navigation.ts'),
    source('src/data_files/constants.ts'),
  ]);

  assert.match(footer, /<BrandLogo class="text-lg" \/>/);
  assert.match(footer, /navLinks[\s\S]*?filter\(link => link\.id !== 'home'\)/);
  assert.match(footer, /href=\{localePath\(locale, link\.path\)\}/);
  assert.match(footer, /href=\{BOOKING_URL\}/);
  assert.match(footer, /url=\{socialLinks\.github\}/);
  assert.match(navigation, /github: 'https:\/\/github\.com\/vjk7989\/ThySite'/);
  assert.match(constants, /title: 'Buckleson'/);
  assert.doesNotMatch(
    footer,
    /href=["']#|target=["']_blank|contact|newsletter|subscribe/i
  );
});

test('removes contact, authentication, and demo form routes and source components', async () => {
  const removed = [
    'src/pages/contact.astro',
    'src/views/ContactView.astro',
    'src/components/sections/misc/Authentication.astro',
    'src/components/sections/misc/ContactSection.astro',
    'src/components/sections/navbar&footer/NavbarMegaMenu.astro',
    'src/components/ui/blocks/ContactIconBlock.astro',
    'src/components/ui/buttons/AuthBtn.astro',
    'src/components/ui/buttons/GoogleBtn.astro',
    'src/components/ui/buttons/LoginBtn.astro',
    'src/components/ui/links/MegaMenuLink.astro',
    'src/components/ui/forms/DemoForm.astro',
    'src/components/ui/forms/LoginModal.astro',
    'src/components/ui/forms/RecoverModal.astro',
    'src/components/ui/forms/RegisterModal.astro',
    'src/assets/scripts/demoForms.ts',
    'src/data_files/mega_link.ts',
  ];

  for (const path of removed) {
    assert.equal(await exists(path), false, `${path} must remain removed`);
  }

  assert.deepEqual(await filesBelow('src/components/ui/forms'), []);
  assert.deepEqual(
    (await filesBelow('src/pages')).filter(path =>
      /(?:^|\/)(?:contact|login|sign-?up|register|recover)(?:\.|\/)/i.test(path)
    ),
    []
  );

  const sourceFiles = (await filesBelow('src')).filter(path =>
    /\.(?:astro|mdx?|[cm]?[jt]s)$/.test(path)
  );
  const stale = [];
  const pattern =
    /(?:Authentication|ContactSection|ContactIconBlock|AuthBtn|GoogleBtn|LoginBtn|DemoForm|LoginModal|RecoverModal|RegisterModal|demoForms|data-demo-form|data-demo-status|NavbarMegaMenu|MegaMenuLink|mega_link)/;
  for (const path of sourceFiles) {
    if (pattern.test(await source(path))) stale.push(path);
  }
  assert.deepEqual(stale, []);
});

test('documentation links directly to booking and contains no contact route', async () => {
  const docs = await source('src/content/docs/welcome-to-docs.mdx');

  assert.match(docs, /^\s+link: https:\/\/cal\.com\/buckleson-group\/30min$/m);
  assert.doesNotMatch(docs, /\/?(?:ThySite\/)?contact\/?/i);
  assert.doesNotMatch(docs, /target:\s*_blank/i);
});

test('smoke gate requires contact to return 404 and never treats it as marketing', async () => {
  const smoke = await source('scripts/smoke.mjs');
  const marketing =
    smoke.match(/const MARKETING_ROUTES = \[([\s\S]*?)\];/)?.[1] ?? '';
  const removed =
    smoke.match(/const REMOVED_ROUTES = \[([\s\S]*?)\];/)?.[1] ?? '';

  assert.doesNotMatch(marketing, /'\/contact\/'/);
  assert.match(removed, /'\/contact\/'/);
  assert.match(smoke, /for \(const route of REMOVED_ROUTES\)/);
  assert.match(smoke, /res\.status !== 404/);
  assert.doesNotMatch(smoke, /data-demo-form|data-demo-status/);
});

test('404 page uses Buckleson trust-boundary copy and semantic theme colors', async () => {
  const [view, copy] = await Promise.all([
    source('src/views/NotFoundView.astro'),
    source('src/copy/en.ts'),
  ]);

  assert.match(view, /<MainLayout title=\{copy\.title\} hideFooter>/);
  assert.match(view, /text-primary[\s\S]*?dark:text-foreground/);
  assert.match(
    view,
    /<PrimaryCTA title=\{copy\.goHome\} url=\{localePath\(locale\)\} noArrow \/>/
  );
  assert.match(view, /data-home=\{localePath\(locale\)\}/);
  assert.doesNotMatch(
    view,
    /construction|ScrewFast|contact|login|background-image/i
  );
  assert.match(copy, /subTitle: 'This path is outside the trust boundary\.'/);
  assert.match(
    copy,
    /content: 'Return to Buckleson or go back to the page you were reviewing\.'/
  );
});
