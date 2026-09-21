import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

test('resolves the smoke-test dist directory from a file URL cross-platform', async () => {
  const smoke = await readFile(resolve(ROOT, 'scripts/smoke.mjs'), 'utf8');

  assert.match(
    smoke,
    /import\s*\{[^}]*\bfileURLToPath\b[^}]*\}\s*from\s*['"]node:url['"]/,
    'smoke runner must import fileURLToPath from node:url'
  );
  assert.match(
    smoke,
    /const\s+DIST\s*=\s*fileURLToPath\(new URL\(['"]\.\.\/dist\/['"],\s*import\.meta\.url\)\);/,
    'smoke runner must convert the dist file URL with fileURLToPath'
  );
  assert.doesNotMatch(
    smoke,
    /resolve\(\s*new URL\([^)]*import\.meta\.url\)\.pathname\s*\)/,
    'URL.pathname must not be passed to path.resolve on Windows'
  );
});
