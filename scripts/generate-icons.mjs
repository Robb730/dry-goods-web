import sharp from 'sharp'
import { readFile } from 'fs/promises'
import { join } from 'path'

const root = process.cwd()
const svgPath = join(root, 'public', 'logo.svg')
const svg = await readFile(svgPath)

const sizes = [
  { file: 'icon-180.png', size: 180 },
  { file: 'icon-192.png', size: 192 },
  { file: 'icon-512.png', size: 512 },
  { file: 'icon-512-maskable.png', size: 512, maskable: true },
  { file: 'apple-touch-icon.png', size: 180 },
  { file: 'favicon-32.png', size: 32 },
]

for (const { file, size, maskable } of sizes) {
  let pipeline = sharp(svg, { density: 512 }).resize(size, size, { fit: 'contain', background: maskable ? '#2563eb' : { r:0,g:0,b:0,alpha:0 } })
  // For maskable, pad 20% safe zone with brand color
  if (maskable) {
    // Create 512 canvas with padding: render logo at 68% size centered on brand color
    const inner = Math.round(size * 0.68)
    const innerBuf = await sharp(svg, { density: 512 }).resize(inner, inner).png().toBuffer()
    pipeline = sharp({ create: { width: size, height: size, channels: 4, background: { r: 37, g: 99, b: 235, alpha: 1 } } })
      .composite([{ input: innerBuf, left: Math.round((size-inner)/2), top: Math.round((size-inner)/2) }])
  }
  await pipeline.png().toFile(join(root, 'public', file))
  console.log('wrote', file, size + 'x' + size)
}

// Also generate adaptive-ish splash source 1170x2532 simplified: white bg with centered logo 320
const splashSizes = [
  { w: 1284, h: 2778, name: 'apple-splash-1284x2778.png' },
  { w: 1170, h: 2532, name: 'apple-splash-1170x2532.png' },
  { w: 1179, h: 2556, name: 'apple-splash-1179x2556.png' },
]
for (const { w, h, name } of splashSizes) {
  const logoSize = 340
  const logoBuf = await sharp(svg, { density: 512 }).resize(logoSize, logoSize).png().toBuffer()
  await sharp({ create: { width: w, height: h, channels: 4, background: { r: 240, g: 244, b: 255, alpha: 1 } } })
    .composite([{ input: logoBuf, left: Math.round((w-logoSize)/2), top: Math.round((h-logoSize)/2 - 20) }])
    .png().toFile(join(root, 'public', name))
  console.log('wrote splash', name)
}
console.log('done')
