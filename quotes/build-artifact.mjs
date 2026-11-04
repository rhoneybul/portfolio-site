// Builds each quote in quotes.mjs as an editable claude.ai artifact page (dist/<file>.artifact.html).
// The page renders itself from the JSON it carries; Edit makes the copy editable in place, Save
// republishes the page with the edited JSON (the `artifact` capability), Download PDF exports it
// (the `downloads` capability). Publish with capabilities {artifact: {}, downloads: true}.
// node quotes/build-artifact.mjs
import {readFileSync, writeFileSync, mkdirSync} from 'node:fs'
import {dirname, join} from 'node:path'
import {fileURLToPath} from 'node:url'
import {issuer, quotes} from './quotes.mjs'

const here = dirname(fileURLToPath(import.meta.url))
const out = join(here, 'dist')
const svg = (name) => readFileSync(join(here, '..', 'brand', 'svg', name), 'utf8').replace(/<title>.*?<\/title>/, '')

const style = readFileSync(join(here, 'artifact', 'quote.css'), 'utf8')
const app = readFileSync(join(here, 'artifact', 'quote.js'), 'utf8')
const json = (v) => JSON.stringify(v).replace(/</g, '\\u003c')

const page = (q) => `<title>${q.number} ${q.title}</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&display=swap">
<style id="quote-style">${style}</style>
<div id="quote-app"></div>
<script type="application/json" id="quote-data">${json({quote: q, issuer, logo: svg('fohm-logo-horizontal-signal.svg'), symbol: svg('fohm-symbol-signal.svg')})}</script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>
<script id="quote-script">${app}</script>
`

mkdirSync(out, {recursive: true})
for (const q of quotes) {
  writeFileSync(join(out, `${q.file}.artifact.html`), page(q))
  console.log(`${q.file}.artifact.html`)
}
