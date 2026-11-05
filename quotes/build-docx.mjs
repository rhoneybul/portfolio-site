// Builds each quote in quotes.mjs as an editable, Fohm AI branded Word file in dist/.
// NODE_PATH=$(npm root -g) node quotes/build-docx.mjs   (needs the docx package)
// DM Sans (OFL, quotes/fonts) is embedded, so Word shows the brand type without it installed.
import {readFileSync, writeFileSync, mkdirSync} from 'node:fs'
import {dirname, join} from 'node:path'
import {fileURLToPath} from 'node:url'
import {createRequire} from 'node:module'
import {issuer, quotes} from './quotes.mjs'

const {
  Document, Packer, Paragraph, TextRun, ImageRun, Table, TableRow, TableCell, WidthType, BorderStyle,
  ShadingType, AlignmentType, Footer, PageNumber, TabStopType, LevelFormat, TableLayoutType, VerticalAlign, CharacterSet,
} = createRequire(import.meta.url)('docx')

const docxRequire = createRequire(createRequire(import.meta.url).resolve('docx'))
const JSZip = docxRequire('jszip')

// docx-js writes the embedded font's key in lower case; the schema (and Word) want upper-case hex.
// Same GUID, so the font's obfuscation still matches.
const upperFontKeys = async (buffer) => {
  const zip = await JSZip.loadAsync(buffer)
  const xml = await zip.file('word/fontTable.xml').async('string')
  zip.file('word/fontTable.xml', xml.replace(/w:fontKey="(\{[^"]+\})"/g, (_, key) => `w:fontKey="${key.toUpperCase()}"`))
  return zip.generateAsync({type: 'nodebuffer', compression: 'DEFLATE'})
}

const here = dirname(fileURLToPath(import.meta.url))
const out = join(here, 'dist')
const SIGNAL = 'F4401B', INK = '161616', MUTED = '5F5F5F', LINE = 'DEDEDE', FONT = 'DM Sans'
const PAGE_W = 11906, MARGIN = 1020, WIDTH = PAGE_W - 2 * MARGIN
const pt = (n) => n * 2

const logo = readFileSync(join(here, '..', 'brand', 'png', 'fohm-logo-horizontal-signal.png'))
const symbol = readFileSync(join(here, '..', 'brand', 'png', 'fohm-symbol-signal.png'))

// **bold** is the only markup in quotes.mjs.
const runs = (text, {color = MUTED, size = 9.5, boldColor = INK} = {}) =>
  String(text).split(/(\*\*.+?\*\*)/).filter(Boolean).map((part) => {
    const bold = part.startsWith('**')
    return new TextRun({text: bold ? part.slice(2, -2) : part, bold, color: bold ? boldColor : color, size: pt(size), font: FONT})
  })

const para = (text, opts = {}) => new Paragraph({children: runs(text, opts), spacing: {after: opts.after ?? 100, line: 276}})

const label = (text, color = SIGNAL) => new TextRun({text: text.toUpperCase(), bold: true, color, size: pt(7.5), font: FONT, characterSpacing: 10})

const heading = (text) => new Paragraph({
  children: [label(text)],
  spacing: {before: 360, after: 140},
  keepNext: true,
  border: {bottom: {style: BorderStyle.SINGLE, size: 12, color: SIGNAL, space: 4}},
})

const subheading = (text) => new Paragraph({children: [label(text, INK)], spacing: {before: 240, after: 80}, keepNext: true})

const none = {style: BorderStyle.NONE, size: 0, color: 'FFFFFF'}
const rule = {style: BorderStyle.SINGLE, size: 4, color: LINE}

const cell = (children, width, {align, shade, color, header = false} = {}) => new TableCell({
  width: {size: width, type: WidthType.DXA},
  borders: {top: none, left: none, right: none, bottom: header ? {style: BorderStyle.SINGLE, size: 4, color: LINE} : rule},
  shading: shade ? {type: ShadingType.CLEAR, color: 'auto', fill: shade} : undefined,
  margins: {top: 90, bottom: 90, left: 0, right: 140},
  verticalAlign: VerticalAlign.TOP,
  children: [new Paragraph({alignment: align, spacing: {after: 0, line: 264}, children})],
})

const table = (widths, headRow, bodyRows) => new Table({
  width: {size: WIDTH, type: WidthType.DXA},
  columnWidths: widths,
  layout: TableLayoutType.FIXED,
  borders: {top: none, bottom: none, left: none, right: none, insideHorizontal: none, insideVertical: none},
  rows: [
    ...(headRow ? [new TableRow({tableHeader: true, cantSplit: true, children: headRow.map((h, i) =>
      cell([label(h.text ?? h, MUTED)], widths[i], {header: true, align: h.align}))})] : []),
    ...bodyRows.map((r) => new TableRow({cantSplit: true, children: r.map((c, i) => cell(c.runs, widths[i], {align: c.align}))})),
  ],
})

const keyValue = (pairs, keyWidth = 2700) => table([keyWidth, WIDTH - keyWidth], null,
  pairs.map(([k, v]) => [{runs: runs(`**${k}**`)}, {runs: runs(v)}]))

const RIGHT = AlignmentType.RIGHT
const ink = (t) => runs(`**${t}**`)

const totalBand = (labelText, amount) => new Table({
  width: {size: WIDTH, type: WidthType.DXA},
  columnWidths: [WIDTH - 3600, 3600],
  layout: TableLayoutType.FIXED,
  borders: {top: none, bottom: none, left: none, right: none, insideHorizontal: none, insideVertical: none},
  rows: [new TableRow({cantSplit: true, children: [
    new TableCell({width: {size: WIDTH - 3600, type: WidthType.DXA}, verticalAlign: VerticalAlign.CENTER,
      shading: {type: ShadingType.CLEAR, color: 'auto', fill: SIGNAL}, borders: {top: none, bottom: none, left: none, right: none},
      margins: {top: 200, bottom: 200, left: 280, right: 0},
      children: [new Paragraph({children: [label(labelText, 'FFFFFF')]})]}),
    new TableCell({width: {size: 3600, type: WidthType.DXA}, verticalAlign: VerticalAlign.CENTER,
      shading: {type: ShadingType.CLEAR, color: 'auto', fill: SIGNAL}, borders: {top: none, bottom: none, left: none, right: none},
      margins: {top: 200, bottom: 200, left: 0, right: 280},
      children: [new Paragraph({alignment: RIGHT, children: [new TextRun({text: amount, bold: true, color: 'FFFFFF', size: pt(20), font: FONT})]})]}),
  ]})],
})

const dashList = (items) => items.map((t) => new Paragraph({numbering: {reference: 'dash', level: 0}, spacing: {after: 60, line: 264}, children: runs(t)}))

const clauses = (list) => list.map(([title, text]) => new Paragraph({
  numbering: {reference: 'clauses', level: 0},
  keepLines: true,
  spacing: {after: 120, line: 264},
  children: [new TextRun({text: `${title}. `, bold: true, color: INK, size: pt(9.5), font: FONT}), ...runs(text)],
}))

const footer = (q) => new Footer({children: [new Paragraph({
  tabStops: [{type: TabStopType.RIGHT, position: WIDTH}],
  border: {top: {style: BorderStyle.SINGLE, size: 4, color: LINE, space: 6}},
  children: [
    new ImageRun({type: 'png', data: symbol, transformation: {width: 12, height: 12}}),
    new TextRun({text: `  ${issuer.company} · ${q.number}`, bold: true, color: SIGNAL, size: pt(7), font: FONT}),
    new TextRun({text: '\t'}),
    new TextRun({text: `${issuer.email} · ${issuer.phone} · Page `, bold: true, color: SIGNAL, size: pt(7), font: FONT}),
    new TextRun({children: [PageNumber.CURRENT], bold: true, color: SIGNAL, size: pt(7), font: FONT}),
    new TextRun({text: ' of ', bold: true, color: SIGNAL, size: pt(7), font: FONT}),
    new TextRun({children: [PageNumber.TOTAL_PAGES], bold: true, color: SIGNAL, size: pt(7), font: FONT}),
  ],
})]})

const body = (q) => [
  new Paragraph({tabStops: [{type: TabStopType.RIGHT, position: WIDTH}], children: [
    new ImageRun({type: 'png', data: logo, transformation: {width: 165, height: 49}}),
    new TextRun({text: '\t'}),
    new TextRun({text: 'QUOTE', bold: true, color: SIGNAL, size: pt(20), font: FONT}),
  ]}),
  new Paragraph({alignment: RIGHT, spacing: {after: 480}, children: [label(q.number)]}),
  new Paragraph({spacing: {after: 100, line: 240}, children: [new TextRun({text: q.title, bold: true, color: SIGNAL, size: pt(26), font: FONT})]}),
  new Paragraph({spacing: {after: 360}, children: [label(q.kind, MUTED)]}),
  keyValue(q.parties),
  new Paragraph({spacing: {after: 120}, children: []}),
  keyValue(q.meta),

  heading('Summary'),
  para(q.summary, {size: 11}),

  heading(q.scopeTitle),
  table([2900, WIDTH - 2900], null, q.scope.map(([t, d]) => [{runs: ink(t)}, {runs: runs(d)}])),

  heading('Not included'),
  ...dashList(q.excluded),

  ...(q.timeline ? [
  heading(q.timeline.title),
    ...(q.timeline.intro ? [para(q.timeline.intro)] : []),
    table([2900, WIDTH - 2900 - 1500, 1500],
      [q.timeline.head[0], q.timeline.head[1], {text: q.timeline.head[2], align: RIGHT}],
      q.timeline.rows.map(([a, b, c]) => [{runs: ink(a)}, {runs: runs(b)}, {runs: runs(c, {color: INK}), align: RIGHT}])),
    new Paragraph({spacing: {before: 120, after: 0}, children: runs(q.timeline.note)}),
  ] : []),

  heading('Price'),
  table([500, WIDTH - 500 - 600 - 1500 - 1500, 600, 1500, 1500],
    ['#', 'Item', {text: 'Qty', align: RIGHT}, {text: 'Unit price', align: RIGHT}, {text: 'Amount', align: RIGHT}],
    q.lines.map(([n, item, qty, unit, amount]) => [
      {runs: runs(n, {color: INK})}, {runs: runs(item, {color: INK})},
      {runs: runs(qty, {color: INK}), align: RIGHT}, {runs: runs(unit, {color: INK}), align: RIGHT}, {runs: runs(amount, {color: INK}), align: RIGHT},
    ])),
  new Paragraph({spacing: {after: 120}, children: []}),
  totalBand(q.totalLabel, q.total),
  new Paragraph({spacing: {before: 160, after: 0}, children: runs(q.priceNote)}),

  subheading('Payment schedule'),
  ...(q.scheduleIntro ? [para(q.scheduleIntro)] : []),
  table([1900, WIDTH - 1900 - 2000 - 2300, 2000, 2300],
    ['Invoice', 'When it is raised', {text: 'Amount', align: RIGHT}, {text: 'Due', align: RIGHT}],
    q.schedule.map(([a, b, c, d]) => [{runs: ink(a)}, {runs: runs(b)}, {runs: runs(c, {color: INK}), align: RIGHT}, {runs: runs(d), align: RIGHT}])),

  subheading('How to pay'),
  para(q.howToPay ?? 'Bank transfer to the account on the invoice, quoting the invoice number.'),

  ...(q.terms.length ? [heading('Terms'), ...dashList(q.terms)] : []),

  heading('Agreement terms'),
  para(q.agreementIntro, {after: 160}),
  ...clauses(q.clauses),

  heading('Signatures'),
  para('By signing, both parties agree to this quote and its agreement terms. A signed copy returned by email is binding.', {after: 160}),
  table([2200, (WIDTH - 2200) / 2, (WIDTH - 2200) / 2], ['', 'For Catalyst Planet', 'For Fohm AI'],
    q.signatories.map(([k, a, b]) => [
      {runs: ink(k)},
      {runs: runs(a || ' ', {color: INK, size: k === 'Signature' ? 22 : 9.5})},
      {runs: runs(b || ' ', {color: INK, size: k === 'Signature' ? 22 : 9.5})},
    ])),
]

const doc = (q) => new Document({
  creator: 'Fohm AI',
  title: `${q.number}: ${q.title}`,
  fonts: [{name: FONT, data: readFileSync(join(here, 'fonts', 'dmsans-400.ttf')), characterSet: CharacterSet.ANSI}],
  styles: {default: {document: {run: {font: FONT, size: pt(9.5), color: INK}}}},
  numbering: {config: [
    {reference: 'dash', levels: [{level: 0, format: LevelFormat.BULLET, text: '—', alignment: AlignmentType.LEFT,
      style: {run: {color: SIGNAL, bold: true, font: FONT}, paragraph: {indent: {left: 340, hanging: 340}}}}]},
    {reference: 'clauses', levels: [{level: 0, format: LevelFormat.DECIMAL_ZERO, text: '%1', alignment: AlignmentType.LEFT,
      style: {run: {color: SIGNAL, bold: true, font: FONT, size: pt(9.5)}, paragraph: {indent: {left: 520, hanging: 520}}}}]},
  ]},
  sections: [{
    properties: {page: {size: {width: PAGE_W, height: 16838}, margin: {top: 1020, bottom: 1100, left: MARGIN, right: MARGIN, footer: 500}}},
    footers: {default: footer(q)},
    children: body(q),
  }],
})

mkdirSync(out, {recursive: true})
for (const q of quotes) {
  writeFileSync(join(out, `${q.file}.docx`), await upperFontKeys(await Packer.toBuffer(doc(q))))
  console.log(`${q.file}.docx`)
}
