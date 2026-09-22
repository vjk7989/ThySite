import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const MAP_PATH = resolve(ROOT, 'docs/site-content-map.md');

async function contentMap() {
  return readFile(MAP_PATH, 'utf8');
}

function section(markdown, heading) {
  const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const haystack = `${markdown.trimEnd()}\n## __END__`;
  const match = haystack.match(
    new RegExp(`^## ${escaped}\\s*$([\\s\\S]*?)(?=^## )`, 'm')
  );
  assert.ok(match, `missing section: ${heading}`);
  return match[1];
}

function firstTable(markdown) {
  const lines = markdown.split(/\r?\n/);
  const start = lines.findIndex(line => line.startsWith('|'));
  assert.notEqual(start, -1, 'section must contain a mapping table');

  const tableLines = [];
  for (const line of lines.slice(start)) {
    if (!line.startsWith('|')) break;
    tableLines.push(line);
  }

  return tableLines
    .filter((_, index) => index !== 1)
    .map(line =>
      line
        .split('|')
        .slice(1, -1)
        .map(cell => cell.trim())
    );
}

test('uses the current main deck and explicitly supersedes the older deck', async () => {
  const markdown = await contentMap();
  const sources = section(markdown, 'Source hierarchy');

  assert.match(sources, /Hyper-Ox_Pitch_Deck\.pdf.+authoritative/is);
  assert.match(sources, /Hyper-Ox_Pitch_Deck_Ultra_Clear\.pdf.+superseded/is);
  assert.match(sources, /Agentic-AI-Threats-and-Mitigations-1\.1\.pdf/);
  assert.match(sources, /LLMAll_en-US_FINAL\.pdf/);
});

test('covers every required site surface and route family', async () => {
  const markdown = await contentMap();
  const requiredCoverage = [
    '## Global interface',
    '## Home page',
    '## Platform pages (`/products` and `/products/[id]`)',
    '## Solutions page (`/services`)',
    'Construction blog index and posts',
    'Construction insight detail pages',
    'Multilingual construction docs',
    'Contact/demo form',
    '404 page',
  ];

  for (const marker of requiredCoverage) {
    assert.ok(markdown.includes(marker), `missing mapping coverage: ${marker}`);
  }
});

test('maps every current home-page section independently', async () => {
  const home = section(await contentMap(), 'Home page');
  const currentSections = [
    'Announcement banner',
    '`HeroSection`',
    'Hero ratings, avatars, stars and reviews',
    '`ClientsSection`',
    '`FeaturesGeneral`',
    '`FeaturesNavs`',
    '`TestimonialsSection`',
    '`PricingSection`',
    '`FAQ`',
    '`HeroSectionAlt`',
  ];

  for (const currentSection of currentSections) {
    assert.ok(
      home.includes(currentSection),
      `missing home mapping: ${currentSection}`
    );
  }
});

test('gives every mapping row purpose, evidence, visual, CTA, and claim status', async () => {
  const markdown = await contentMap();
  const mappingSections = [
    'Global interface',
    'Home page',
    'Platform pages (`/products` and `/products/[id]`)',
    'Solutions page (`/services`)',
    'Insights, documentation and contact',
  ];

  for (const heading of mappingSections) {
    const [header, ...rows] = firstTable(section(markdown, heading));
    const normalizedHeader = header.join(' ').toLowerCase();

    assert.match(normalizedHeader, /replacement|purpose/);
    assert.match(normalizedHeader, /evidence/);
    assert.match(normalizedHeader, /image|visual|asset/);
    assert.match(normalizedHeader, /cta/);
    assert.match(normalizedHeader, /claim status/);
    assert.ok(rows.length > 0, `${heading} must contain at least one mapping`);

    for (const [index, row] of rows.entries()) {
      assert.equal(
        row.length,
        header.length,
        `${heading} row ${index + 1} has an incomplete column set`
      );
      assert.ok(
        row.every(cell => cell.length > 0),
        `${heading} row ${index + 1} contains an empty mapping field`
      );
    }
  }
});

test('defines the four exact claim classifications', async () => {
  const legend = section(await contentMap(), 'Claim-safety legend');
  const requiredClassifications = [
    'Publicly usable',
    'Requires customer/publication permission',
    'Requires technical evidence',
    'Investor-only and excluded from the public site',
  ];

  for (const classification of requiredClassifications) {
    assert.ok(
      legend.includes(classification),
      `missing exact claim classification: ${classification}`
    );
  }
});

test('keeps investor, customer, and technical claims behind the correct gates', async () => {
  const markdown = await contentMap();
  const excluded = section(markdown, 'Excluded public content');
  const legend = section(markdown, 'Claim-safety legend');

  assert.match(excluded, /TAM\/SAM\/SOM/);
  assert.match(excluded, /fundraising|runway|use-of-funds/i);
  assert.match(excluded, /Named customers.+written permission/is);
  assert.match(excluded, /10x Technologies.+permission/is);
  assert.match(legend, /customer.+permission/is);
  assert.match(legend, /technical.+evidence/is);
  assert.match(legend, /TAM\/SAM\/SOM.+Exclude/is);
});

test('uses bounded product language and records prohibited claim forms', async () => {
  const boundaries = section(await contentMap(), 'Risk coverage boundaries');

  assert.match(boundaries, /Hyper Tern.+Controls routing, permissions/is);
  assert.match(boundaries, /Hyper-ABS.+Helps reduce.+exposure/is);
  assert.match(boundaries, /Hyper-0x.+tamper-evident execution records/is);
  assert.match(boundaries, /guaranteed privacy/i);
  assert.match(boundaries, /guarantees compliance/i);
  assert.match(boundaries, /makes AI inherently safe/i);
  assert.match(boundaries, /Solves all 17 OWASP Agentic AI threats/i);
  assert.match(boundaries, /Solves the OWASP LLM Top 10/i);
  assert.match(
    boundaries,
    /Quantum resistance.+without technical documentation/is
  );
});

test('keeps direct Cal.com booking until a backend and privacy plan is approved', async () => {
  const order = section(await contentMap(), 'Replacement order');

  assert.match(
    order,
    /^5\. Replace insights\/blog content and keep assessment actions as direct Cal\.com booking links unless a future backend and privacy plan is approved\.$/m
  );
  assert.doesNotMatch(order, /implement the assessment form/i);
});
