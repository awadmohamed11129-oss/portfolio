// Reproduce the portfolio's derivatives from ASU's NASA Viking/MDIM mosaic.
// Download one 90-degree tile at a time to keep peak memory bounded.
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';

const pieces = [];
// The original page lays the map out from 180° E to 180° E: 225,315,045,135.
for (const [row, hemisphere] of ['n', 's'].entries()) {
  for (const [column, longitude] of ['225', '315', '045', '135'].entries()) {
    const name = `mars45${hemisphere}${longitude}.png`;
    const url = `https://www.mars.asu.edu/data/mdim_color/large/${name}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`${response.status} ${url}`);
    const bytes = Buffer.from(await response.arrayBuffer());
    const metadata = await sharp(bytes).metadata();
    if (metadata.width !== 5760 || metadata.height !== 5760) throw new Error(`Unexpected tile extent ${name}`);
    const input = await sharp(bytes).resize(1024, 1024).png().toBuffer();
    pieces.push({ input, left: column * 1024, top: row * 1024 });
    console.log(`Decoded ${name}: ${bytes.length} bytes, 5760 × 5760`);
  }
}
await mkdir('public/media/mars', { recursive: true });
const mosaic = await sharp({ create: { width: 4096, height: 2048, channels: 3, background: '#000000' } }).composite(pieces).png().toBuffer();
for (const width of [4096, 2048]) {
  console.log(await sharp(mosaic).resize(width, width / 2).webp({ quality: 92, effort: 6 }).toFile(`public/media/mars/color-${width}.webp`));
}
