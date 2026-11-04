(() => {
  const dataEl = document.getElementById('quote-data')
  const state = JSON.parse(dataEl.textContent)
  const app = document.getElementById('quote-app')
  let editing = false
  let dirty = false
  let readOnly = false

  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
  const md = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')

  // Every piece of copy is an element carrying the path of its value in state.quote.
  const field = (tag, path, value, cls = '') => `<${tag}${cls ? ` class="${cls}"` : ''} data-path="${path}">${md(value)}</${tag}>`
  const pairRows = (list, key) => list.map((r, i) =>
    `<tr>${field('th', `${key}.${i}.0`, r[0]).replace('<th', '<th scope="row"')}${field('td', `${key}.${i}.1`, r[1])}</tr>`).join('')

  const render = () => {
    const q = state.quote
    const t = q.timeline
    app.innerHTML = `
    <div class="bar" role="toolbar" aria-label="Quote actions">
      <span class="status" id="status" aria-live="polite">${editing ? 'Editing: click any text to change it, then Save.' : esc(q.number)}</span>
      ${editing
        ? `<button type="button" id="discard">Discard</button><button type="button" class="primary" id="save" ${dirty ? '' : 'disabled'}>Save</button>`
        : `${readOnly ? '' : '<button type="button" id="edit">Edit</button>'}<button type="button" class="primary" id="pdf" hidden>Download PDF</button>`}
    </div>
    <div class="wrap${editing ? ' editing' : ''}">
    <article class="sheet" id="sheet">
      <header>
        <div class="logo">${state.logo}</div>
        <div class="tag"><strong>Quote</strong>${field('span', 'number', q.number)}</div>
      </header>
      ${field('h1', 'title', q.title)}
      ${field('p', 'kind', q.kind, 'kind')}

      <div class="table parties"><table class="muted-cells"><tbody>${pairRows(q.parties, 'parties')}</tbody></table></div>
      <div class="table"><table class="muted-cells"><tbody>${pairRows(q.meta, 'meta')}</tbody></table></div>

      <section><h2>Summary</h2>${field('p', 'summary', q.summary, 'summary')}</section>

      <section>${field('h2', 'scopeTitle', q.scopeTitle)}
        <div class="table"><table class="muted-cells stack"><tbody>${pairRows(q.scope, 'scope')}</tbody></table></div>
      </section>

      <section><h2>Not included</h2>
        <ul class="dash">${q.excluded.map((e, i) => field('li', `excluded.${i}`, e)).join('')}</ul>
      </section>

      <section>${field('h2', 'timeline.title', t.title)}
        ${t.intro ? field('p', 'timeline.intro', t.intro, 'muted') : ''}
        <div class="table"><table class="stack">
          <thead><tr>${t.head.map((h, i) => field('th', `timeline.head.${i}`, h, i === 2 ? 'num' : '')).join('')}</tr></thead>
          <tbody>${t.rows.map((r, i) => `<tr>
            ${field('td', `timeline.rows.${i}.0`, r[0]).replace('<td', '<td style="font-weight:600;white-space:nowrap"')}
            ${field('td', `timeline.rows.${i}.1`, r[1], 'muted')}
            ${field('td', `timeline.rows.${i}.2`, r[2], 'num')}</tr>`).join('')}</tbody>
        </table></div>
        ${field('p', 'timeline.note', t.note, 'note')}
      </section>

      <section><h2>Price</h2>
        <div class="table"><table>
          <thead><tr><th>#</th><th>Item</th><th class="num">Qty</th><th class="num">Unit price</th><th class="num">Amount</th></tr></thead>
          <tbody>${q.lines.map((l, i) => `<tr>${l.map((c, j) => field('td', `lines.${i}.${j}`, c, j >= 2 ? 'num' : '')).join('')}</tr>`).join('')}</tbody>
        </table></div>
        <div class="total">${field('span', 'totalLabel', q.totalLabel)}${field('strong', 'total', q.total)}</div>
        ${field('p', 'priceNote', q.priceNote, 'note')}
        <div class="keep"><h3>Payment schedule</h3>
          <div class="table"><table class="stack">
            <thead><tr><th>Invoice</th><th>When it is raised</th><th class="num">Amount</th><th class="num">Due</th></tr></thead>
            <tbody>${q.schedule.map((r, i) => `<tr>
              ${field('td', `schedule.${i}.0`, r[0]).replace('<td', '<td style="font-weight:600"')}
              ${field('td', `schedule.${i}.1`, r[1], 'muted')}
              ${field('td', `schedule.${i}.2`, r[2], 'num')}
              ${field('td', `schedule.${i}.3`, r[3], 'num muted')}</tr>`).join('')}</tbody>
          </table></div>
        </div>
        <div class="keep"><h3>How to pay</h3>${field('p', 'howToPay', q.howToPay ?? 'Bank transfer to the account on the invoice, quoting the invoice number.', 'muted')}</div>
      </section>

      ${q.terms.length ? `<section><h2>Terms</h2><ul class="dash">${q.terms.map((e, i) => field('li', `terms.${i}`, e)).join('')}</ul></section>` : ''}

      <section><h2>Agreement terms</h2>
        ${field('p', 'agreementIntro', q.agreementIntro, 'muted')}
        <ol class="clauses">${q.clauses.map((c, i) => `<li><div>${field('strong', `clauses.${i}.0`, c[0])}${field('span', `clauses.${i}.1`, c[1])}</div></li>`).join('')}</ol>
      </section>

      <section class="keep"><h2>Signatures</h2>
        ${field('p', 'signaturesIntro', q.signaturesIntro ?? 'By signing, both parties agree to this quote and its agreement terms. A signed copy returned by email is binding.', 'muted')}
        <div class="table"><table class="signatures">
          <thead><tr><th></th>${field('th', 'signHead.0', q.signHead?.[0] ?? 'For Catalyst Planet')}${field('th', 'signHead.1', q.signHead?.[1] ?? 'For Fohm AI')}</tr></thead>
          <tbody>${q.signatories.map((r, i) => `<tr>${field('th', `signatories.${i}.0`, r[0]).replace('<th', '<th scope="row"')}${field('td', `signatories.${i}.1`, r[1])}${field('td', `signatories.${i}.2`, r[2])}</tr>`).join('')}</tbody>
        </table></div>
      </section>

      <footer>
        <span class="mark">${state.symbol}${esc(state.issuer.company)} · ${esc(q.number)}</span>
        <span>${esc(state.issuer.email)} · ${esc(state.issuer.phone)}</span>
      </footer>
    </article>
    </div>`
    if (editing) app.querySelectorAll('[data-path]').forEach((el) => {
      el.contentEditable = 'true'
      el.spellcheck = true
    })
    wire()
  }

  // Text from an edited element, keeping bold as **…** and nothing else.
  const fromNode = (node) => {
    if (node.nodeType === 3) return node.nodeValue
    if (node.nodeName === 'BR') return ' '
    const inner = Array.from(node.childNodes).map(fromNode).join('')
    if ((node.nodeName === 'STRONG' || node.nodeName === 'B') && inner.trim()) return `**${inner}**`
    return inner
  }
  const valueOf = (el) => Array.from(el.childNodes).map(fromNode).join('').replace(/ /g, ' ').replace(/\s+/g, ' ').replace(/\*\*\s*\*\*/g, '').trim()

  const setPath = (obj, path, value) => {
    const keys = path.split('.')
    const last = keys.pop()
    const parent = keys.reduce((o, k) => (o[k] ??= /^\d+$/.test(k) ? [] : {}), obj)
    parent[last] = value
  }

  const collect = () => app.querySelectorAll('[data-path]').forEach((el) => setPath(state.quote, el.dataset.path, valueOf(el)))

  const say = (text) => { const s = document.getElementById('status'); if (s) s.textContent = text }

  // The complete page, as the Artifact tool publishes it, rebuilt from state.
  const RESET = ':root{color-scheme:light;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0;font:14px system-ui,-apple-system,sans-serif}img{max-width:100%}[hidden]{display:none!important}'
  const json = (v) => JSON.stringify(v).replace(/</g, '\\u003c')
  const documentHtml = () => {
    const q = state.quote
    const content = `<title>${esc(q.number)} ${esc(q.title)}</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&display=swap">
<style id="quote-style">${document.getElementById('quote-style').textContent}</style>
<div id="quote-app"></div>
<script type="application/json" id="quote-data">${json(state)}<\/script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"><\/script>
<script id="quote-script">${document.getElementById('quote-script').textContent}<\/script>
`
    return `<!doctype html><html><head><meta charset=utf8><meta name=viewport content="width=device-width,initial-scale=1,viewport-fit=cover"><style>${RESET}</style></head><body>${content}</body></html>`
  }

  const save = async () => {
    collect()
    const btn = document.getElementById('save')
    if (btn) btn.disabled = true
    say('Saving…')
    const artifact = await window.claude?.use?.('artifact')
    if (!artifact) {
      say('Saving isn’t available in this view. Your edits stay on screen until you leave.')
      if (btn) btn.disabled = false
      return
    }
    try {
      await artifact.publish(documentHtml())
      say('Saved. Loading the new version…')
    } catch (e) {
      const code = e?.code
      if (code === 'conflict') say('A newer version was saved elsewhere. Loading it now.')
      else if (code === 'not_writer' || code === 'not_granted' || code === 'consent_required' || code === 'capability_disabled' || code === 'not_declared') {
        readOnly = true
        editing = false
        render()
        say('This copy is read-only for you, so edits can’t be saved.')
      } else if (code === 'rate_limited') {
        say('Saving too often. Wait a moment, then Save again.')
        if (btn) btn.disabled = false
      } else {
        say('The save didn’t go through. Try Save again.')
        if (btn) btn.disabled = false
      }
    }
  }

  let downloads = null
  const pdf = async () => {
    const btn = document.getElementById('pdf')
    if (!downloads || !window.html2pdf) return
    btn.disabled = true
    say('Making the PDF…')
    document.body.classList.add('pdf')
    try {
      const q = state.quote
      const blob = await window.html2pdf().set({
        margin: [14, 14, 16, 14],
        filename: `${q.number}.pdf`,
        image: {type: 'jpeg', quality: 0.96},
        html2canvas: {scale: 2, useCORS: true, backgroundColor: '#ffffff'},
        jsPDF: {unit: 'mm', format: 'a4', orientation: 'portrait'},
        pagebreak: {mode: ['css', 'legacy'], avoid: ['tr', '.keep', '.total', '.clauses li', 'h2', 'h3']},
      }).from(document.getElementById('sheet')).outputPdf('blob')
      document.body.classList.remove('pdf')
      await downloads.save({filename: `Fohm AI ${q.number} ${q.title.replace(/[^\w\s-]/g, '')}.pdf`, data: blob})
      say('PDF saved.')
    } catch (e) {
      document.body.classList.remove('pdf')
      if (e?.code === 'declined') say(state.quote.number)
      else say('The PDF couldn’t be made here. Try again in a moment.')
    } finally {
      btn.disabled = false
    }
  }

  function wire() {
    document.getElementById('edit')?.addEventListener('click', () => { editing = true; dirty = false; render(); say('Editing: click any text to change it, then Save.') })
    document.getElementById('discard')?.addEventListener('click', () => { editing = false; dirty = false; state.quote = JSON.parse(dataEl.textContent).quote; render() })
    document.getElementById('save')?.addEventListener('click', save)
    const pdfBtn = document.getElementById('pdf')
    if (pdfBtn) { pdfBtn.hidden = !(downloads && window.html2pdf); pdfBtn.addEventListener('click', pdf) }
    if (editing) {
      app.querySelector('.wrap').addEventListener('input', () => {
        if (dirty) return
        dirty = true
        const b = document.getElementById('save')
        if (b) b.disabled = false
      })
      // Paste as plain text so no outside formatting comes in.
      app.querySelector('.wrap').addEventListener('paste', (e) => {
        e.preventDefault()
        const text = (e.clipboardData || window.clipboardData).getData('text/plain')
        document.execCommand('insertText', false, text.replace(/\s+/g, ' '))
      })
      // Enter ends the field instead of adding a line break.
      app.querySelector('.wrap').addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && e.target.matches('[data-path]')) { e.preventDefault(); e.target.blur() }
      })
    }
  }

  render()
  window.claude?.use?.('downloads').then((d) => { downloads = d; const b = document.getElementById('pdf'); if (b) b.hidden = !(d && window.html2pdf) }).catch(() => {})
})()
