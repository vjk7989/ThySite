import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, isAbsolute, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIST = fileURLToPath(new URL('../dist/', import.meta.url));
const MARKETING_ROUTES = [
  '/',
  '/products/',
  '/products/hyper-tern/',
  '/products/hyper-abs/',
  '/products/hyper-0x/',
  '/products/hyper-wallet/',
  '/services/',
  '/blog/',
  '/blog/agentic-control-boundaries/',
  '/blog/reducing-data-exposure/',
  '/blog/verifiable-ai-execution/',
  '/insights/ai-risk-control-map/',
  '/insights/prompt-injection-boundaries/',
  '/insights/secure-inference-design/',
];
const REMOVED_ROUTES = [
  '/contact/',
  '/products/item-a765/',
  '/products/item-b203/',
  '/products/item-f303/',
  '/products/item-t845/',
  '/blog/post-1/',
  '/blog/post-2/',
  '/blog/post-3/',
  '/insights/insight-1/',
  '/insights/insight-2/',
  '/insights/insight-3/',
  '/fr/',
  '/fr/contact/',
  '/fr/products/',
  '/fr/products/item-a765/',
  '/fr/services/',
  '/fr/blog/',
  '/fr/blog/post-1/',
  '/fr/insights/insight-1/',
  '/fr/404/',
  '/fr/welcome-to-docs/',
  '/de/welcome-to-docs/',
  '/es/welcome-to-docs/',
  '/fa/welcome-to-docs/',
  '/ja/welcome-to-docs/',
  '/zh-cn/welcome-to-docs/',
];
const ROUTES = [...MARKETING_ROUTES, '/welcome-to-docs/', '/404'];

// Cheap content assertions on top of the status check.
const EXPECTATIONS = {
  '/': [
    '<html lang="en"',
    '<meta property="og:locale" content="en_US"',
    'https://vjk7989.github.io/ThySite',
  ],
  '/welcome-to-docs/': ['Buckleson Platform Overview'],
  '/products/': ['A trust layer across the AI execution path.'],
  '/products/hyper-tern/': ['Hyper Tern', 'What this module contributes'],
  '/products/hyper-abs/': ['Hyper-ABS', 'What this module contributes'],
  '/products/hyper-0x/': ['Hyper-0x', 'What this module contributes'],
  '/products/hyper-wallet/': ['Hyper Wallet', 'What this module contributes'],
  '/services/': ['Move from AI risk questions to one controlled workflow.'],
  '/blog/': ['Make AI risk concrete enough to control.'],
  '/blog/agentic-control-boundaries/': [
    'Where an AI agent needs a control boundary',
    '"@type":"BlogPosting"',
    '"@type":"Organization"',
  ],
  '/blog/reducing-data-exposure/': [
    'Reducing data exposure before model inference',
    '"@type":"BlogPosting"',
  ],
  '/blog/verifiable-ai-execution/': [
    'What a verifiable AI execution record can prove',
    '"@type":"BlogPosting"',
  ],
  '/insights/ai-risk-control-map/': [
    'Map AI risks to controls, evidence, and owners',
    '"@type":"Article"',
  ],
  '/insights/prompt-injection-boundaries/': [
    'Prompt injection is an execution-boundary problem',
    '"@type":"Article"',
  ],
  '/insights/secure-inference-design/': [
    'A secure inference boundary in four decisions',
    '"@type":"Article"',
  ],
};

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.txt': 'text/plain',
  '.xml': 'application/xml',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.avif': 'image/avif',
  '.webp': 'image/webp',
  '.png': 'image/png',
};

function resolvePath(urlPath) {
  let pathname = decodeURIComponent(urlPath.split('?')[0]);
  if (pathname.includes('\0') || /(?:^|[/\\])\.\.(?:[/\\]|$)/.test(pathname)) {
    throw Object.assign(new Error('Invalid path'), { code: 'EINVAL' });
  }
  if (pathname.endsWith('/')) pathname += 'index.html';
  else if (!extname(pathname)) pathname += '/index.html';
  if (pathname === '/404/index.html') pathname = '/404.html';

  const filePath = resolve(DIST, pathname.replace(/^[/\\]+/, ''));
  const rel = relative(DIST, filePath);
  if (rel.startsWith('..') || isAbsolute(rel)) {
    throw Object.assign(new Error('Path escapes dist'), { code: 'EACCES' });
  }
  return filePath;
}

async function run() {
  const server = createServer(async (req, res) => {
    try {
      const filePath = resolvePath(req.url || '/');
      const data = await readFile(filePath);
      const type = MIME[extname(filePath)] || 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': type });
      res.end(data);
    } catch {
      try {
        const data = await readFile(resolve(DIST, '404.html'));
        res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(data);
      } catch {
        res.writeHead(404);
        res.end('Not found');
      }
    }
  });

  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });

  const { port } = server.address();
  const base = `http://127.0.0.1:${port}`;

  let failed = false;
  try {
    for (const route of ROUTES) {
      const res = await fetch(`${base}${route}`);
      const ok = route === '/404' ? res.status === 404 || res.ok : res.ok;
      if (!ok) {
        console.error(`FAIL ${route} → ${res.status}`);
        failed = true;
        continue;
      }
      const html = await res.text();
      const missing = (EXPECTATIONS[route] ?? []).filter(
        needle => !html.includes(needle)
      );
      if (missing.length) {
        console.error(`FAIL ${route} → missing ${missing.join(', ')}`);
        failed = true;
      } else {
        console.log(`OK   ${route} → ${res.status}`);
      }
    }

    for (const route of REMOVED_ROUTES) {
      const res = await fetch(`${base}${route}`);
      if (res.status !== 404) {
        console.error(`FAIL ${route} → expected 404, received ${res.status}`);
        failed = true;
      } else {
        console.log(`OK   ${route} → 404`);
      }
    }
  } finally {
    server.close();
  }

  if (failed) process.exit(1);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
