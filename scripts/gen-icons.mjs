import { readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const svgPath = resolve(root, 'public', 'favicon.svg');

async function generate() {
    const svg = await readFile(svgPath);
    const out16 = resolve(root, 'public', 'favicon-16x16.png');
    const out32 = resolve(root, 'public', 'favicon-32x32.png');
    const apple = resolve(root, 'public', 'apple-touch-icon.png');

    await sharp(svg).resize(16, 16).png({ compressionLevel: 9 }).toFile(out16);
    await sharp(svg).resize(32, 32).png({ compressionLevel: 9 }).toFile(out32);
    await sharp(svg).resize(180, 180).png({ compressionLevel: 9 }).toFile(apple);

    console.log('Generated favicons:', out16, out32, apple);
}

generate().catch((e) => {
    console.error('gen-icons failed:', e);
    process.exit(1);
});
