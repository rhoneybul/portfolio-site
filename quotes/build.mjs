// Builds each quote in quotes.mjs as a Fohm AI branded HTML page and an A4 PDF beside it.
// NODE_PATH=$(npm root -g) node quotes/build.mjs   (needs playwright)
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
const md = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
const rows = (list, cell = (c) => `<td>${md(c)}</td>`) => list.map((r) => `<tr>${r.map(cell).join('')}</tr>`).join('\n')

const parties = (q) => {
  const fields = [['Name', 'name'], ['Email', 'email'], ['Address', 'address'], ['Company no.', 'company'], ['VAT no.', 'vat']]
  return `<table class="grid parties">
    <thead><tr><th></th><th>Client</th><th>Supplier</th></tr></thead>
    <tbody>${fields.map(([label, key]) => `<tr><th scope="row">${label}</th><td>${md(q.client[key])}</td><td>${md(q.supplier[key])}</td></tr>`).join('')}</tbody>
  </table>`
}

const section = (title, body, cls = '') => `<section class="${cls}"><h2>${esc(title)}</h2>${body}</section>`

const page = (q) => `<!doctype html>
<html lang="en-GB">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Fohm AI ${esc(q.number)}</title>
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&display=swap" rel="stylesheet">
<style>
  :root { --signal: #F4401B; --paper: #F6F6F6; --ink: #161616; --muted: #5f5f5f; --line: #dedede; }
  @page { size: A4; margin: 14mm 0 18mm; }
  @page :first { margin-top: 0; }
  * { box-sizing: border-box; }
  html { background: #fff; }
  body { margin: 0; color: var(--ink); font: 9.5pt/1.5 'DM Sans', Arial, sans-serif; -webkit-font-smoothing: antialiased; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .doc { padding: 0 16mm; }
  .cover { padding-top: 16mm; }
  header { display: flex; justify-content: space-between; align-items: flex-start; gap: 8mm; }
  header .logo svg { width: 46mm; height: auto; display: block; }
  header .tag { text-align: right; color: var(--signal); text-transform: uppercase; font-size: 8pt; font-weight: 600; letter-spacing: 0.04em; }
  header .tag strong { display: block; font-size: 20pt; line-height: 1; letter-spacing: -0.02em; margin-bottom: 4px; }
  h1 { margin: 12mm 0 4mm; font-weight: 700; font-size: 28pt; line-height: 1.02; letter-spacing: -0.035em; color: var(--signal); text-wrap: balance; }
  .kind { margin: 0; font-size: 8pt; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: var(--muted); }
  .summary { margin: 0; max-width: 155mm; font-size: 11pt; color: var(--muted); }
  .summary strong { color: var(--ink); }
  section { margin-top: 9mm; }
  h2 { margin: 0 0 3mm; font-size: 8.5pt; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: var(--signal); padding-bottom: 2mm; border-bottom: 1.5px solid var(--signal); break-after: avoid; }
  h3 { margin: 6mm 0 2mm; font-size: 8pt; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: var(--ink); break-after: avoid; }
  p { margin: 0 0 2mm; }
  .muted { color: var(--muted); }
  table { width: 100%; border-collapse: collapse; }
  tr { break-inside: avoid; }
  th, td { text-align: left; vertical-align: top; padding: 2mm 3mm 2mm 0; border-bottom: 1px solid var(--line); }
  thead th { font-size: 7.5pt; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: var(--muted); padding-top: 0; }
  tbody th { font-weight: 600; width: 30mm; }
  .grid td { color: var(--muted); }
  .parties { margin-top: 10mm; }
  .parties td:first-of-type { color: var(--ink); }
  .meta td { color: var(--ink); }
  .meta { margin-top: 4mm; }
  .scope th { width: 50mm; }
  .scope td { color: var(--muted); }
  .num { text-align: right; white-space: nowrap; padding-right: 0; padding-left: 5mm; }
  .keep { break-inside: avoid; }
  .lines td.item { width: 100%; }
  .lines tr.sum td { font-weight: 600; border-bottom: 0; padding-top: 2.2mm; }
  .lines tr.vat td { color: var(--muted); }
  .total { display: flex; justify-content: space-between; align-items: center; gap: 8mm; margin-top: 3mm; padding: 5mm 6mm; background: var(--signal); color: var(--paper); break-inside: avoid; }
  .total span { font-size: 8pt; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }
  .total strong { font-size: 22pt; line-height: 1; letter-spacing: -0.02em; }
  .note { margin-top: 3mm; color: var(--muted); }
  .note strong { color: var(--ink); }
  ul.dash { margin: 0; padding: 0; list-style: none; }
  ul.dash li { position: relative; padding-left: 5mm; margin-bottom: 1.5mm; color: var(--muted); break-inside: avoid; }
  ul.dash li::before { content: '—'; position: absolute; left: 0; color: var(--signal); font-weight: 600; }
  ul.dash li strong { color: var(--ink); }
  ol.clauses { margin: 0; padding: 0; list-style: none; counter-reset: clause; }
  ol.clauses li { counter-increment: clause; display: grid; grid-template-columns: 9mm 1fr; padding: 2.2mm 0; border-bottom: 1px solid var(--line); break-inside: avoid; }
  ol.clauses li::before { content: counter(clause, decimal-leading-zero); color: var(--signal); font-weight: 600; }
  ol.clauses strong { display: block; }
  ol.clauses span { color: var(--muted); }
  .signatures { break-inside: avoid; }
  .signatures td { height: 11mm; }
  .signatures tbody th { width: 30mm; }
  .bank { width: auto; min-width: 90mm; }
</style>
</head>
<body>
<div class="doc">
  <div class="cover">
    <header>
      <div class="logo">${logo}</div>
      <div class="tag"><strong>Quote</strong>${esc(q.number)}</div>
    </header>
    <h1>${esc(q.title)}</h1>
    <p class="kind">${esc(q.kind)}</p>
    ${parties(q)}
    <table class="grid meta"><tbody>${q.meta.map(([k, v]) => `<tr><th scope="row">${esc(k)}</th><td>${md(v)}</td></tr>`).join('')}</tbody></table>
  </div>

  ${section('Summary', `<p class="summary">${md(q.summary)}</p>`)}

  ${section(q.scopeTitle, `<table class="scope"><tbody>${q.scope.map(([t, d]) => `<tr><th scope="row">${esc(t)}</th><td>${md(d)}</td></tr>`).join('')}</tbody></table>`)}

  ${section('Not included', `<ul class="dash">${q.excluded.map((e) => `<li>${md(e)}</li>`).join('')}</ul>`)}

  ${section(q.timeline.title, `${q.timeline.intro ? `<p class="muted">${md(q.timeline.intro)}</p>` : ''}
    <table class="grid"><thead><tr>${q.timeline.head.map((h, i) => `<th${i === 2 ? ' class="num"' : ''}>${esc(h)}</th>`).join('')}</tr></thead>
    <tbody>${q.timeline.rows.map((r) => `<tr><td style="color:var(--ink);font-weight:600;white-space:nowrap">${md(r[0])}</td><td>${md(r[1])}</td><td class="num" style="color:var(--ink)">${md(r[2])}</td></tr>`).join('')}</tbody></table>
    <p class="note">${md(q.timeline.note)}</p>`)}

  ${section('Price', `<table class="lines">
      <thead><tr><th>#</th><th>Item</th><th class="num">Qty</th><th class="num">Unit price</th><th class="num">Amount</th></tr></thead>
      <tbody>
        ${q.lines.map(([n, item, qty, unit, amount]) => `<tr><td>${esc(n)}</td><td class="item">${md(item)}</td><td class="num">${esc(qty)}</td><td class="num">${esc(unit)}</td><td class="num">${esc(amount)}</td></tr>`).join('')}
        <tr class="sum"><td></td><td>Subtotal</td><td></td><td></td><td class="num">${esc(q.subtotal)}</td></tr>
        <tr class="vat"><td></td><td>${esc(q.vat)}</td><td></td><td></td><td class="num">${esc(q.vatAmount)}</td></tr>
      </tbody>
    </table>
    <div class="total"><span>${esc(q.totalLabel)}</span><strong>${esc(q.total)}</strong></div>
    <p class="note">${md(q.priceNote)}</p>
    <div class="keep"><h3>Payment schedule</h3>
    <table class="grid"><thead><tr><th>Invoice</th><th>When it is raised</th><th class="num">Amount</th><th class="num">Due</th></tr></thead>
    <tbody>${q.schedule.map((r) => `<tr><td style="color:var(--ink);font-weight:600">${md(r[0])}</td><td>${md(r[1])}</td><td class="num" style="color:var(--ink)">${md(r[2])}</td><td class="num">${md(r[3])}</td></tr>`).join('')}</tbody></table></div>
    <div class="keep"><h3>How to pay</h3>
    <p class="muted">Bank transfer, quoting the invoice number.</p>
    <table class="grid bank"><tbody>${q.bank.map(([k, v]) => `<tr><th scope="row">${esc(k)}</th><td>${esc(v)}</td></tr>`).join('')}</tbody></table></div>`)}

  ${q.terms.length ? section('Terms', `<ul class="dash">${q.terms.map((t) => `<li>${md(t)}</li>`).join('')}</ul>`) : ''}

  ${section('Agreement terms', `<p class="muted">${md(q.agreementIntro)}</p>
    <ol class="clauses">${q.clauses.map(([t, d]) => `<li><div><strong>${esc(t)}</strong><span>${md(d)}</span></div></li>`).join('')}</ol>`)}

  ${section('Signatures', `<p class="muted">By signing, both parties agree to this quote and its agreement terms. A signed copy returned by email is binding.</p>
    <table class="grid signatures"><thead><tr><th></th><th>For the Client</th><th>For Fohm AI</th></tr></thead>
    <tbody>${q.signatories.map(([k, a, b]) => `<tr><th scope="row">${esc(k)}</th><td style="color:var(--ink)">${esc(a)}</td><td style="color:var(--ink)">${esc(b)}</td></tr>`).join('')}</tbody></table>`, 'signatures')}
</div>
</body>
</html>
`

const footer = (q) => `<div style="width:100%;padding:0 16mm;display:flex;justify-content:space-between;align-items:center;font-family:Helvetica,Arial,sans-serif;font-size:7pt;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;color:#F4401B;-webkit-print-color-adjust:exact">
  <span style="display:flex;align-items:center;gap:2mm"><span style="display:inline-block;width:5mm;height:5mm">${symbol.replace('<svg ', '<svg width="100%" height="100%" ')}</span>${esc(issuer.company)} · ${esc(q.number)}</span>
  <span>${esc(issuer.email)} · ${esc(issuer.phone)} · <span class="pageNumber"></span> / <span class="totalPages"></span></span>
</div>`

mkdirSync(out, {recursive: true})
const browser = await chromium.launch()
const context = await browser.newContext()
for (const q of quotes) {
  const html = join(out, `${q.file}.html`)
  writeFileSync(html, page(q))
  const tab = await context.newPage()
  await tab.goto(`file://${html}`, {waitUntil: 'networkidle'})
  await tab.evaluate(() => document.fonts.ready)
  await tab.pdf({
    path: join(out, `${q.file}.pdf`),
    format: 'A4',
    printBackground: true,
    preferCSSPageSize: true,
    displayHeaderFooter: true,
    headerTemplate: '<span></span>',
    footerTemplate: footer(q),
  })
  console.log(`${q.file}.pdf`)
  await tab.close()
}
await browser.close()
