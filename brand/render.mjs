// Rasterise brand/svg/*.svg to brand/png with Chromium (Playwright).
// Usage: node brand/render.mjs   (needs playwright; PLAYWRIGHT_PATH may point at its index.mjs)
import {readdirSync, readFileSync, mkdirSync} from 'node:fs'
import {join, dirname} from 'node:path'
import {fileURLToPath} from 'node:url'

const {chromium} = await import(process.env.PLAYWRIGHT_PATH || 'playwright')
const root = dirname(fileURLToPath(import.meta.url))
const svgDir = join(root, 'svg')
const pngDir = join(root, 'png')
mkdirSync(pngDir, {recursive: true})

// name -> list of [output suffix, width] ; default renders at 2x the SVG's own size
const sizes = {
  'ion-app-icon.svg': [['512', 512], ['180', 180], ['192', 192]],
  'ion-icon-paper-on-signal.svg': [['512', 512]],
  'ion-icon-signal-on-paper.svg': [['512', 512]],
  'ion-icon-signal-on-night.svg': [['512', 512]],
  'ion-favicon.svg': [['32', 32], ['48', 48], ['512', 512]],
  'ion-linkedin-avatar.svg': [['', 400]],
  'ion-og-image.svg': [['', 1200]],
  'ion-og-image-night.svg': [['', 1200]],
  'ion-linkedin-banner.svg': [['', 1584]],
  'ion-business-card-front.svg': [['', 1004]],
  'ion-business-card-back.svg': [['', 1004]],
}

const browser = await chromium.launch()
const page = await browser.newPage()
for (const file of readdirSync(svgDir).filter((f) => f.endsWith('.svg'))) {
  const src = readFileSync(join(svgDir, file), 'utf8')
  const [, vw, vh] = src.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/).map(Number)
  const outputs = sizes[file] ?? [['', Math.round(vw * 2)]]
  for (const [suffix, width] of outputs) {
    const height = Math.round((width * vh) / vw)
    await page.setViewportSize({width, height})
    const sized = src.replace(/width="[\d.]+" height="[\d.]+"/, `width="${width}" height="${height}"`)
    await page.setContent(`<html><body style="margin:0;background:transparent">${sized}</body></html>`)
    const name = file.replace('.svg', suffix ? `-${suffix}.png` : '.png')
    await page.screenshot({path: join(pngDir, name), omitBackground: true, clip: {x: 0, y: 0, width, height}})
  }
}
await browser.close()
console.log('rendered PNGs to', pngDir)
