// Usage: node docs/directory-submission/screenshots.cjs <out dir> <prototype id from build_app_prototype> [fake state JSON for the building shot]
// Renders the live MCP App view, as a host would, with a stand-in bridge that calls the live server.
const {chromium} = require('playwright')
const MCP = 'https://www.fohm.io/mcp'
const [,, out, id, fake] = process.argv
const H = {'content-type': 'application/json', accept: 'application/json, text/event-stream', 'mcp-protocol-version': '2025-06-18'}
const rpc = async (method, params) => {
  const t = await (await fetch(MCP, {method: 'POST', headers: H, body: JSON.stringify({jsonrpc: '2.0', id: 1, method, params})})).text()
  return JSON.parse(t.slice(t.indexOf('{'), t.lastIndexOf('}') + 1)).result
}
const STUB = `export class App {
  constructor(){} async connect(){ setTimeout(()=>{ this.ontoolresult&&this.ontoolresult({structuredContent:{prototypeId:'${id}',url:'https://www.fohm.io/app-builder/p/${id}',name:''}}) }, 50) }
  async callServerTool(p){ return window.__call(p) } async openLink(){ return {} }
}`
;(async () => {
  const html = (await rpc('resources/read', {uri: 'ui://fohm/prototype.html'})).contents[0].text
  const b = await chromium.launch()
  const page = await b.newPage({viewport: {width: 720, height: 1000}, deviceScaleFactor: 2})
  const errs = []; page.on('pageerror', (e) => errs.push(String(e)))
  await page.exposeFunction('__call', async (p) => {
    if (fake && p.name === 'get_app_prototype') return {structuredContent: JSON.parse(fake)}
    return rpc('tools/call', {name: p.name, arguments: p.arguments})
  })
  await page.route('https://www.fohm.io/mcp/ext-apps-2.0.4.js', (r) => r.fulfill({contentType: 'text/javascript', body: STUB}))
  const cache = new Map()
  const grab = async (u) => { for (let i = 0; i < 8; i++) { const r = await fetch(u, {headers: {'User-Agent': 'FohmAppBuilder/1.0 (https://www.fohm.io/app-builder)'}}); if (r.ok) return {ct: r.headers.get('content-type'), body: Buffer.from(await r.arrayBuffer())}; await new Promise((ok) => setTimeout(ok, 3000 * (i + 1))) } return null }
  await b.contexts()[0].route('https://upload.wikimedia.org/**', async (r) => {
    const u = r.request().url(); if (!cache.has(u)) cache.set(u, grab(u)); const got = await cache.get(u)
    return got ? r.fulfill({contentType: got.ct, body: got.body}) : r.abort()
  })
  await page.route('https://host.local/', (r) => r.fulfill({contentType: 'text/html', body: html}))
  await page.goto('https://host.local/')
  await page.waitForTimeout(9000); for (const f of page.frames()) await f.waitForLoadState('networkidle').catch(()=>{}); await page.waitForTimeout(3000)
  const chips = page.locator('#screens button'); const n = await chips.count()
  console.log('chips', n, await chips.allInnerTexts())
  const shot = async (name, sel) => {
    if (sel !== '.wrap') return page.locator(sel).screenshot({path: `${out}/${name}.png`})
    const a = await page.locator('.head').boundingBox(), d = await page.locator(fake ? '#building' : '#done').boundingBox()
    return page.screenshot({path: `${out}/${name}.png`, clip: {x: 0, y: a.y - 16, width: 720, height: d.y + d.height - a.y + 32}})
  }
  if (fake) { await shot('5-building', '.wrap'); console.log(errs); return b.close() }
  await shot('1-landing', '.wrap')
  const pick = async (re) => { const all = await chips.allInnerTexts(); const i = all.findIndex((t) => re.test(t)); if (i >= 0) { await chips.nth(i).click(); await page.waitForTimeout(4000) } return i }
  if ((await pick(/onboard|welcome|start/i)) >= 0) await shot('2-onboarding', '.wrap')
  if ((await pick(/home|today/i)) >= 0) await shot('3-home', '.wrap')
  if ((await pick(/session|class|program/i)) >= 0) await shot('4-session', '.wrap')
  console.log('errors', errs); await b.close()
})()
