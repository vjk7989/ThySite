import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
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

test('does not publish a CNAME while the Buckleson domain is unavailable', async () => {
  await assert.rejects(source('public/CNAME'), { code: 'ENOENT' });
});

test('targets the GitHub project site and repository base path', async () => {
  const [astroConfig, constants] = await Promise.all([
    source('astro.config.mjs'),
    source('src/data_files/constants.ts'),
  ]);

  assert.match(astroConfig, /site:\s*'https:\/\/vjk7989\.github\.io'/);
  assert.match(astroConfig, /base:\s*'\/ThySite'/);
  assert.match(constants, /url:\s*'https:\/\/vjk7989\.github\.io\/ThySite'/);
  assert.doesNotMatch(`${astroConfig}\n${constants}`, /www\.buckleson\.com/);
});

test('smoke expectations use the deployed project URL', async () => {
  const smoke = await source('scripts/smoke.mjs');

  assert.match(smoke, /https:\/\/vjk7989\.github\.io\/ThySite/);
  assert.doesNotMatch(smoke, /https:\/\/www\.buckleson\.com/);
});

test('pins the deployment package manager to the verified pnpm release', async () => {
  const packageJson = JSON.parse(await source('package.json'));

  assert.equal(packageJson.packageManager, 'pnpm@12.5.1');
});

test('all pnpm setup workflows rely on packageManager as the only version source', async () => {
  const workflowDirectory = resolve(ROOT, '.github/workflows');
  const workflowNames = (await readdir(workflowDirectory))
    .filter(name => /\.ya?ml$/i.test(name))
    .sort();
  const pnpmWorkflows = [];

  for (const name of workflowNames) {
    const workflow = await readFile(resolve(workflowDirectory, name), 'utf8');
    const lines = workflow.split(/\r?\n/);

    for (const [index, line] of lines.entries()) {
      const setup = line.match(
        /^(\s*)-?\s*uses:\s*pnpm\/action-setup@(\S+)\s*$/
      );
      if (!setup) continue;

      pnpmWorkflows.push(name);
      assert.equal(setup[2], 'v4', `${name} must use pnpm/action-setup@v4`);

      const hasListMarker = /^\s*-\s+/.test(line);
      const itemIndent = Math.max(0, setup[1].length - (hasListMarker ? 0 : 2));
      const followingLines = lines.slice(index + 1);
      const nextStep = followingLines.findIndex(candidate =>
        new RegExp(`^\\s{${itemIndent}}-\\s+`).test(candidate)
      );
      const actionBlock = [
        line,
        ...followingLines.slice(0, nextStep === -1 ? undefined : nextStep),
      ].join('\n');

      assert.doesNotMatch(
        actionBlock,
        /^\s+version\s*:/m,
        `${name} must take pnpm 12.5.1 from package.json, not action input`
      );
    }
  }

  assert.deepEqual(pnpmWorkflows.sort(), ['ci.yml', 'dependabot-format.yml']);
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
