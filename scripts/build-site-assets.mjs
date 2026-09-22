import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..'
);
const outputPath = path.join(
  projectRoot,
  'src',
  'images',
  'buckleson',
  'trust-orbit.png'
);

const visual = `
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1200" viewBox="0 0 1200 1200">
  <defs>
    <radialGradient id="core" cx="50%" cy="48%" r="58%">
      <stop offset="0" stop-color="#a855f7" stop-opacity=".92"/>
      <stop offset=".42" stop-color="#7c3aed" stop-opacity=".38"/>
      <stop offset="1" stop-color="#7c3aed" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="ring" x1="170" y1="180" x2="1020" y2="1010">
      <stop stop-color="#c084fc" stop-opacity=".9"/>
      <stop offset=".52" stop-color="#7c3aed" stop-opacity=".5"/>
      <stop offset="1" stop-color="#4c1d95" stop-opacity=".14"/>
    </linearGradient>
    <filter id="blur"><feGaussianBlur stdDeviation="34"/></filter>
  </defs>
  <circle cx="600" cy="600" r="430" fill="url(#core)" filter="url(#blur)"/>
  <g fill="none" stroke="url(#ring)">
    <ellipse cx="600" cy="600" rx="430" ry="235" stroke-width="3" transform="rotate(-18 600 600)"/>
    <ellipse cx="600" cy="600" rx="380" ry="175" stroke-width="2" transform="rotate(48 600 600)" opacity=".75"/>
    <circle cx="600" cy="600" r="205" stroke-width="4" opacity=".55"/>
  </g>
  <g fill="#8b5cf6" stroke="#ede9fe" stroke-width="5">
    <circle cx="260" cy="392" r="20"/>
    <circle cx="916" cy="344" r="14"/>
    <circle cx="973" cy="742" r="24"/>
    <circle cx="410" cy="873" r="16"/>
  </g>
  <g fill="#fff" fill-opacity=".9">
    <circle cx="600" cy="600" r="74"/>
    <circle cx="600" cy="600" r="118" fill="none" stroke="#fff" stroke-opacity=".28" stroke-width="2"/>
  </g>
</svg>`;

await fs.mkdir(path.dirname(outputPath), { recursive: true });
await sharp(Buffer.from(visual))
  .png({ compressionLevel: 9, adaptiveFiltering: true })
  .toFile(outputPath);

console.log(`Built ${path.relative(projectRoot, outputPath)}`);

const insightDirectory = path.join(
  projectRoot,
  'src',
  'images',
  'buckleson',
  'insights'
);

const insightAssets = [
  ['agent-boundaries', 0],
  ['data-exposure', 1],
  ['execution-evidence', 2],
  ['prompt-injection', 3],
  ['secure-inference', 4],
  ['risk-control-map', 5],
];

function buildInsightVisual(index) {
  const offset = index * 34;
  const accent = ['#8b5cf6', '#a855f7', '#7c3aed'][index % 3];
  return `
<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1000" viewBox="0 0 1600 1000">
  <defs>
    <radialGradient id="halo" cx="50%" cy="50%" r="55%">
      <stop offset="0" stop-color="${accent}" stop-opacity=".34"/>
      <stop offset="1" stop-color="${accent}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="line" x1="180" y1="160" x2="1420" y2="840">
      <stop stop-color="#c4b5fd" stop-opacity=".9"/>
      <stop offset="1" stop-color="${accent}" stop-opacity=".22"/>
    </linearGradient>
  </defs>
  <ellipse cx="800" cy="500" rx="620" ry="390" fill="url(#halo)"/>
  <g fill="none" stroke="url(#line)" stroke-width="4">
    <rect x="${250 + offset}" y="250" width="360" height="500" rx="90"/>
    <rect x="${990 - offset}" y="310" width="280" height="380" rx="70" opacity=".72"/>
    <path d="M ${610 + offset} 500 C 740 ${330 + index * 38}, 860 ${670 - index * 28}, ${990 - offset} 500" stroke-dasharray="15 16"/>
    <circle cx="800" cy="500" r="${135 + index * 9}" opacity=".55"/>
  </g>
  <g fill="${accent}" stroke="#f5f3ff" stroke-width="7">
    <circle cx="${430 + offset}" cy="500" r="34"/>
    <circle cx="800" cy="500" r="42"/>
    <circle cx="${1130 - offset}" cy="500" r="30"/>
  </g>
  <g fill="#ffffff" fill-opacity=".9">
    <circle cx="800" cy="500" r="12"/>
    <circle cx="${430 + offset}" cy="500" r="9"/>
    <circle cx="${1130 - offset}" cy="500" r="8"/>
  </g>
</svg>`;
}

await fs.mkdir(insightDirectory, { recursive: true });
for (const [name, index] of insightAssets) {
  const assetPath = path.join(insightDirectory, `${name}.png`);
  await sharp(Buffer.from(buildInsightVisual(index)))
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toFile(assetPath);
  console.log(`Built ${path.relative(projectRoot, assetPath)}`);
}
