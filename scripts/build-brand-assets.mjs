import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdir } from 'node:fs/promises';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = path.resolve(root, '..', 'Bson_logo.jpg');
const brandDir = path.join(root, 'src', 'images', 'brand');
const imageDir = path.join(root, 'src', 'images');

await mkdir(brandDir, { recursive: true });

const mask = await sharp(source)
  .resize(512, 512, {
    fit: 'contain',
    background: { r: 0, g: 0, b: 0 },
  })
  .greyscale()
  .linear(1.08, -4)
  .png()
  .toBuffer();

const mark = async (rgb, target) => {
  await sharp({
    create: { width: 512, height: 512, channels: 3, background: rgb },
  })
    .joinChannel(mask)
    .png({ compressionLevel: 9 })
    .toFile(target);
};

await mark(
  { r: 0, g: 0, b: 0 },
  path.join(brandDir, 'buckleson-mark-light.png')
);
await mark(
  { r: 255, g: 255, b: 255 },
  path.join(brandDir, 'buckleson-mark-dark.png')
);

const violet = { r: 124, g: 58, b: 237, alpha: 1 };
const whiteMark = await sharp(path.join(brandDir, 'buckleson-mark-dark.png'))
  .resize(390, 390)
  .png()
  .toBuffer();

await sharp({
  create: { width: 512, height: 512, channels: 4, background: violet },
})
  .composite([{ input: whiteMark, gravity: 'centre' }])
  .png({ compressionLevel: 9 })
  .toFile(path.join(imageDir, 'icon.png'));

await sharp({
  create: { width: 512, height: 512, channels: 4, background: violet },
})
  .composite([
    {
      input: await sharp(whiteMark).resize(320, 320).toBuffer(),
      gravity: 'centre',
    },
  ])
  .png({ compressionLevel: 9 })
  .toFile(path.join(imageDir, 'icon-maskable.png'));

const socialSvg = Buffer.from(`
  <svg width="1200" height="600" xmlns="http://www.w3.org/2000/svg">
    <rect width="1200" height="600" fill="#000"/>
    <circle cx="1040" cy="120" r="310" fill="#7c3aed" opacity="0.9"/>
    <circle cx="1100" cy="580" r="380" fill="#151515"/>
    <text x="430" y="275" fill="#fff" font-family="Arial, sans-serif" font-size="92" font-weight="700">Buckleson</text>
    <text x="430" y="355" fill="#bfbfbf" font-family="Arial, sans-serif" font-size="36">Control. Protect. Verify.</text>
  </svg>`);

await sharp(socialSvg)
  .composite([
    {
      input: await sharp(path.join(brandDir, 'buckleson-mark-dark.png'))
        .resize(280, 280)
        .toBuffer(),
      left: 90,
      top: 160,
    },
  ])
  .png({ compressionLevel: 9 })
  .toFile(path.join(imageDir, 'social.png'));

await sharp(path.join(brandDir, 'buckleson-mark-dark.png'))
  .resize(128, 128)
  .png({ compressionLevel: 9 })
  .toFile(path.join(imageDir, 'starlight', 'buckleson-mark-dark.png'));

await sharp(path.join(brandDir, 'buckleson-mark-light.png'))
  .resize(128, 128)
  .png({ compressionLevel: 9 })
  .toFile(path.join(imageDir, 'starlight', 'buckleson-mark-light.png'));
