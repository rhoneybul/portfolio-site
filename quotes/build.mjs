// Builds each quote in quotes.mjs as a Fohm AI branded HTML page and an A4 PDF beside it.
// node quotes/build.mjs   (needs playwright)
import {readFileSync, writeFileSync, mkdirSync} from 'node:fs'
import {dirname, join} from 'node:path'
import {fileURLToPath} from 'node:url'
import {createRequire} from 'node:module'
import {issuer, quotes} from './quotes.mjs'
const {chromium} = createRequire(import.meta.url)('playwright')

const here = dirname(fileURLToPath(import.meta.url))
const out = join(here, 'dist')
const svg = (name) => readFileSync(join(here, '..', 'brand', 'svg', name), 'utf8').replace(/<title>.*?<\/title>/, '')
const logo = svg('fohm-logo-horizontal-signal.svg')
const symbol = svg('fohm-symbol-signal.svg')

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

const footer = (n) => `<footer>
    <span class="mark">${symbol}${esc(issuer.company)}</span>
    <span>${esc(issuer.email)} · ${esc(issuer.whatsapp)} · ${n} / 2</span>
  </footer>`

const page = (q) => `<!doctype html>
<html lang="en-GB">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Fohm AI Quote ${esc(q.number)}</title>
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&display=swap" rel="stylesheet">
<style>
  :root { --signal: #F4401B; --paper: #F6F6F6; --ink: #161616; --muted: #5f5f5f; --line: #dedede; }
  @page { size: A4; margin: 0; }
  * { box-sizing: border-box; }
  html, body { margin: 0; background: var(--paper); color: var(--ink); font: 10pt/1.5 'DM Sans', Arial, sans-serif; -webkit-font-smoothing: antialiased; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .sheet { width: 210mm; height: 297mm; overflow: hidden; break-after: page; }
  .sheet:last-child { break-after: auto; }
  .sheet { padding: 16mm 16mm 13mm; margin: 0 auto; display: flex; flex-direction: column; }
  header { display: flex; justify-content: space-between; align-items: flex-start; }
  header .logo svg { width: 46mm; height: auto; display: block; }
  header .tag { text-align: right; color: var(--signal); text-transform: uppercase; font-size: 8.5pt; font-weight: 600; letter-spacing: 0.04em; }
  header .tag strong { display: block; font-size: 22pt; line-height: 1; letter-spacing: -0.02em; margin-bottom: 4px; }
  .meta { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8mm; margin-top: 12mm; padding-top: 4mm; border-top: 1.5px solid var(--signal); }
  .label { display: block; font-size: 7.5pt; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: var(--signal); margin-bottom: 2px; }
  .meta p { margin: 0; }
  .meta .muted { color: var(--muted); }
  h1 { margin: 12mm 0 4mm; font-weight: 700; font-size: 28pt; line-height: 1; letter-spacing: -0.035em; color: var(--signal); }
  .summary { margin: 0; max-width: 150mm; font-size: 11.5pt; color: var(--muted); }
  h2 { margin: 10mm 0 3mm; font-size: 8.5pt; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: var(--signal); padding-bottom: 2mm; border-bottom: 1.5px solid var(--signal); }
  h2.first { margin-top: 14mm; }
  .scope { margin: 0; padding: 0; list-style: none; }
  .scope li { display: grid; grid-template-columns: 48mm 1fr; gap: 6mm; padding: 2.6mm 0; border-bottom: 1px solid var(--line); }
  .scope strong { font-weight: 600; }
  .scope span { color: var(--muted); }
  .excluded { margin: 0; padding: 0; list-style: none; columns: 2; column-gap: 8mm; }
  .excluded li { position: relative; padding-left: 5mm; color: var(--muted); margin-bottom: 1.4mm; break-inside: avoid; }
  .excluded li::before { content: '—'; position: absolute; left: 0; color: var(--signal); font-weight: 600; }
  table { width: 100%; border-collapse: collapse; }
  th { text-align: left; font-size: 7.5pt; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: var(--muted); padding: 0 0 2mm; border-bottom: 1px solid var(--line); }
  th:last-child, td:last-child { text-align: right; white-space: nowrap; }
  td { padding: 3.5mm 0; border-bottom: 1px solid var(--line); vertical-align: top; }
  td .item { font-weight: 600; }
  td .detail { color: var(--muted); max-width: 120mm; }
  td.amount { font-weight: 600; font-size: 11pt; padding-left: 6mm; }
  .total { display: flex; justify-content: space-between; align-items: baseline; gap: 8mm; margin-top: 4mm; padding: 6mm; background: var(--signal); color: var(--paper); }
  .total .label { color: var(--paper); }
  .total p { margin: 0; font-size: 9pt; opacity: 0.9; }
  .total strong { font-size: 24pt; line-height: 1; letter-spacing: -0.02em; }
  .terms { margin: 0; padding-left: 4mm; color: var(--muted); }
  .terms li { margin-bottom: 1mm; break-inside: avoid; }
  .accept { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8mm; margin-top: 22mm; }
  .accept div { border-top: 1px solid var(--ink); padding-top: 1.5mm; font-size: 8pt; color: var(--muted); }
  footer { margin-top: auto; padding-top: 6mm; display: flex; justify-content: space-between; align-items: center; color: var(--signal); font-size: 8pt; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; }
  footer .mark { display: flex; align-items: center; gap: 3mm; }
  footer .mark svg { width: 7mm; height: 7mm; }
  @media screen and (max-width: 820px) {
    .sheet { width: auto; height: auto; overflow: visible; padding: 24px 16px; }
    .meta, .accept { grid-template-columns: 1fr; gap: 12px; }
    .scope li { grid-template-columns: 1fr; gap: 2px; }
    .excluded, .terms { columns: 1; }
    .total { flex-direction: column; align-items: flex-start; }
    footer { flex-direction: column; align-items: flex-start; gap: 8px; }
  }
</style>
</head>
<body>
<div class="sheet">
  <header>
    <div class="logo">${logo}</div>
    <div class="tag"><strong>Quote</strong>${esc(q.number)}</div>
  </header>

  <div class="meta">
    <div>
      <span class="label">Prepared for</span>
      <p><strong>${esc(q.to.name)}</strong></p>
      <p class="muted">${esc(q.to.email)}</p>
    </div>
    <div>
      <span class="label">From</span>
      <p><strong>${esc(issuer.company)}</strong></p>
      <p class="muted">${esc(issuer.name)}, ${esc(issuer.role)}</p>
      <p class="muted">${esc(issuer.email)}</p>
    </div>
    <div>
      <span class="label">Date</span>
      <p>${esc(q.date)}</p>
      <span class="label" style="margin-top:2mm">Valid until</span>
      <p>${esc(q.validUntil)}</p>
    </div>
  </div>

  <h1>${esc(q.title)}</h1>
  <p class="summary">${esc(q.summary)}</p>

  <h2>${esc(q.scopeTitle)}</h2>
  <ul class="scope">
    ${q.scope.map(([t, d]) => `<li><strong>${esc(t)}</strong><span>${esc(d)}</span></li>`).join('\n    ')}
  </ul>

  <h2>${esc(q.excludedTitle)}</h2>
  <ul class="excluded">
    ${q.excluded.map((e) => `<li>${esc(e)}</li>`).join('\n    ')}
  </ul>

  ${footer(1)}
</div>

<div class="sheet">
  <header>
    <div class="logo">${logo}</div>
    <div class="tag"><strong>Quote</strong>${esc(q.number)}</div>
  </header>

  <h2 class="first">Price</h2>
  <table>
    <thead><tr><th>Item</th><th>Price</th></tr></thead>
    <tbody>
      ${q.lines.map((l) => `<tr><td><div class="item">${esc(l.item)}</div><div class="detail">${esc(l.detail)}</div></td><td class="amount">${esc(l.amount)}</td></tr>`).join('\n      ')}
    </tbody>
  </table>
  <div class="total">
    <div><span class="label">Total</span><p>${esc(q.totalNote)}</p></div>
    <strong>${esc(q.total)}</strong>
  </div>

  <h2>Terms</h2>
  <ul class="terms">
    ${q.terms.map((t) => `<li>${esc(t)}</li>`).join('\n    ')}
  </ul>

  <div class="accept">
    <div>Accepted by (name)</div>
    <div>Signature</div>
    <div>Date</div>
  </div>

  ${footer(2)}
</div>
</body>
</html>
`

mkdirSync(out, {recursive: true})
const browser = await chromium.launch()
const context = await browser.newContext()
for (const q of quotes) {
  const html = join(out, `${q.file}.html`)
  writeFileSync(html, page(q))
  const tab = await context.newPage()
  await tab.goto(`file://${html}`, {waitUntil: 'networkidle'})
  await tab.evaluate(() => document.fonts.ready)
  await tab.pdf({path: join(out, `${q.file}.pdf`), format: 'A4', printBackground: true, preferCSSPageSize: true})
  const overflowing = await tab.evaluate(() => [...document.querySelectorAll('.sheet')].filter((s) => s.scrollHeight > s.clientHeight + 1).length)
  if (overflowing) throw new Error(`${q.file}: ${overflowing} page(s) overflow A4`)
  console.log(`${q.file}.pdf`)
  await tab.close()
}
await browser.close()
