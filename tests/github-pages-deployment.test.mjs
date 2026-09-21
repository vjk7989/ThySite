import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

async function source(path) {
  return readFile(resolve(ROOT, path), 'utf8');
}

test('deploys main with the current official Astro GitHub Pages actions', async () => {
  const workflow = await source('.github/workflows/deploy-pages.yml');
  const actions = [...workflow.matchAll(/^\s*uses:\s*(\S+)\s*$/gm)].map(
    match => match[1]
  );

  assert.match(workflow, /^\s*push:\s*$[\s\S]*?branches:\s*\[main\]/m);
  assert.deepEqual(actions, [
    'actions/checkout@v6',
    'withastro/action@v6',
    'actions/deploy-pages@v5',
  ]);
});

test('grants only the permissions required for Pages OIDC deployment', async () => {
  const workflow = await source('.github/workflows/deploy-pages.yml');
  const permissions = workflow.match(
    /^permissions:\s*\r?\n((?:^[ \t]+[^\r\n]+\r?\n?)+)/m
  );

  assert.ok(permissions, 'workflow must define top-level permissions');
  const entries = permissions[1]
    .trim()
    .split(/\r?\n/)
    .map(line => line.trim())
    .sort();

  assert.deepEqual(entries, [
    'contents: read',
    'id-token: write',
    'pages: write',
  ]);
});

test('serializes deployments and exposes the deployed Pages URL', async () => {
  const workflow = await source('.github/workflows/deploy-pages.yml');

  assert.match(
    workflow,
    /^concurrency:\s*\r?\n\s+group:\s*pages\s*\r?\n\s+cancel-in-progress:\s*false\s*$/m
  );
  assert.match(workflow, /^\s+name:\s*github-pages\s*$/m);
  assert.match(
    workflow,
    /^\s+url:\s*\$\{\{\s*steps\.deployment\.outputs\.page_url\s*\}\}\s*$/m
  );
  assert.match(workflow, /^\s+id:\s*deployment\s*$/m);
});

test('publishes the exact Buckleson custom domain through CNAME', async () => {
  const cname = await source('public/CNAME');

  assert.match(cname, /^www\.buckleson\.com\r?\n?$/);
});

test('uses the custom-domain canonical URL without a GitHub project base path', async () => {
  const [astroConfig, constants] = await Promise.all([
    source('astro.config.mjs'),
    source('src/data_files/constants.ts'),
  ]);

  // Deployment assumes DNS for www.buckleson.com points at GitHub Pages.
  // The public canonical must remain independent of the repository slug.
  assert.match(astroConfig, /site:\s*'https:\/\/www\.buckleson\.com'/);
  assert.match(constants, /url:\s*'https:\/\/www\.buckleson\.com'/);
  assert.doesNotMatch(astroConfig, /^\s*base:\s*/m);
  assert.doesNotMatch(
    `${astroConfig}\n${constants}`,
    /https:\/\/vjk7989\.github\.io(?:\/ThySite)?|base:\s*['"]\/ThySite\/?['"]/
  );
});

test('pins the deployment package manager to the verified pnpm release', async () => {
  const packageJson = JSON.parse(await source('package.json'));

  assert.equal(packageJson.packageManager, 'pnpm@12.5.1');
});

test('allows native dependency builds only for esbuild', async () => {
  const workspace = await source('pnpm-workspace.yaml');

  assert.match(workspace, /^allowBuilds:\r?\n  esbuild: true\r?\n?$/);
  assert.doesNotMatch(
    workspace,
    /dangerouslyAllowAllBuilds\s*:\s*true|strictDepBuilds\s*:\s*false|ignoreScripts\s*:|(?:^|\n)\s*['"]?\*['"]?\s*:/,
    'pnpm build policy must not bypass or wildcard dependency-script controls'
  );
});
