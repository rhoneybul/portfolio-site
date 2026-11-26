/**
 * The MCP App view (`ui://fohm/prototype.html`): the app Claude designs, shown in the chat. It
 * frames no website (Claude blocks that for directory listings that aren't Verified): it asks the
 * server for the prototype with an app-only tool (get_app_prototype), every few seconds while it's
 * drawn, and plays it in a sandboxed frame of its own, with the screens to tap and a form that
 * sends it to Fohm (contact_fohm). The host bridge is served from the site, not a CDN.
 */

export const BRIDGE_PATH = '/mcp/ext-apps-2.0.4.js'

/** The origins the view loads from: the bridge, the photos and the prototype's fonts. */
export const viewDomains = (site: string) => [site, 'https://upload.wikimedia.org', 'https://fonts.googleapis.com', 'https://fonts.gstatic.com']

export function viewHtml(site: string) {
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<style>
:root{--ink:#111113;--muted:#5b5b66;--line:#e4e4ea;--card:#fff;--canvas:#f4f4f6;--accent:#2F6B4F;font-family:var(--font-sans,system-ui,-apple-system,sans-serif)}
@media (prefers-color-scheme:dark){:root{--ink:#f2f2f4;--muted:#a6a6b0;--line:#33333a;--card:#1c1c20;--canvas:#141417}}
*{box-sizing:border-box}html,body{margin:0;background:transparent;color:var(--ink);font-size:14px;line-height:1.45}
.wrap{max-width:720px;margin:0 auto;padding:16px;display:grid;gap:16px}
.head{display:flex;align-items:center;gap:12px}.dot{width:14px;height:14px;border-radius:50%;background:var(--accent);flex:none}
.head h1{font-size:18px;margin:0}.head p{margin:2px 0 0;color:var(--muted)}
.card{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:16px}
.bar{height:6px;border-radius:3px;background:var(--line);overflow:hidden;margin:10px 0 4px}.bar span{display:block;height:100%;background:var(--accent);transition:width .6s}
.steps{list-style:none;margin:8px 0 0;padding:0;display:grid;gap:6px;color:var(--muted)}.steps .on{color:var(--ink);font-weight:600}.steps .done::before{content:"\\2713  "}
.stage{display:grid;grid-template-columns:minmax(0,320px) 1fr;gap:16px;align-items:start}
@media (max-width:560px){.stage{grid-template-columns:1fr}}
.phone{border:8px solid #111113;border-radius:36px;overflow:hidden;background:#fff;aspect-ratio:390/844;position:relative;width:100%;max-width:320px;margin:0 auto}
.phone iframe{position:absolute;top:0;left:0;width:390px;height:844px;border:0;transform-origin:0 0}
.screens{display:flex;flex-wrap:wrap;gap:6px}.screens button,.btn{font:inherit;border:1px solid var(--line);background:var(--card);color:var(--ink);border-radius:999px;padding:6px 12px;cursor:pointer;min-height:36px}
.screens button.on{background:var(--ink);color:var(--card);border-color:var(--ink)}
.btn.primary{background:var(--accent);border-color:var(--accent);color:#fff;font-weight:600}
form{display:grid;gap:10px}label{display:grid;gap:4px;font-size:13px;color:var(--muted)}
input,textarea{font:inherit;color:var(--ink);background:var(--canvas);border:1px solid var(--line);border-radius:10px;padding:10px;width:100%}
.note{color:var(--muted);font-size:13px;margin:0}.err{color:#b3261e;font-size:13px;margin:0}[hidden]{display:none!important}
h2{font-size:16px;margin:0 0 4px}
</style></head><body>
<div class="wrap">
  <div class="head"><span class="dot"></span><div><h1 id="name">Your app</h1><p id="line">Starting…</p></div></div>
  <div class="card" id="building" hidden>
    <strong id="left">Claude is designing every screen</strong>
    <div class="bar"><span id="fill" style="width:5%"></span></div>
    <ul class="steps"><li id="s1">Finding photos</li><li id="s2">Planning the app</li><li id="s3">Drawing every screen</li></ul>
    <p class="note" style="margin-top:8px">Usually 4 to 6 minutes. It carries on if you leave: the link below keeps it.</p>
  </div>
  <div id="done" hidden class="stage">
    <div class="phone" id="phone"><iframe id="proto" sandbox="allow-scripts" title="Prototype"></iframe></div>
    <div style="display:grid;gap:12px;align-content:start">
      <p class="note">Tap through it as a member would, or pick a screen.</p>
      <div class="screens" id="screens"></div>
    </div>
  </div>
  <div class="card" id="sketch" hidden><p class="note">Claude couldn’t draw the full prototype this time. The page below has a quick sketch of it.</p></div>
  <div><button class="btn" id="open" type="button" hidden>Open the full page</button></div>
  <div class="card" id="contact" hidden>
    <h2>Build it with Fohm</h2>
    <p class="note">Rob at Fohm, a London app studio, takes it from this prototype to the web, the App Store and Google Play. Send it and he’ll be in touch.</p>
    <form id="form" style="margin-top:12px">
      <label>Your name<input id="cname" autocomplete="name" maxlength="100" required></label>
      <label>Your email<input id="cemail" type="email" autocomplete="email" maxlength="200" required></label>
      <label>Anything else? (optional)<textarea id="cnote" rows="2" maxlength="1000"></textarea></label>
      <p class="err" id="cerr" hidden></p>
      <div><button class="btn primary" type="submit" id="csend">Send it to Fohm</button></div>
    </form>
    <p class="note" id="sent" hidden></p>
  </div>
</div>
<script type="module">
import {App} from '${site}${BRIDGE_PATH}'
const $ = (id) => document.getElementById(id)
const app = new App({name: 'Fohm App Builder', version: '1.0.0'})
let id = '', url = '', timer = 0, shown = false
const show = (el, on) => { $(el).hidden = !on }

function fit() {
  const f = $('proto'), w = $('phone').clientWidth
  if (w) f.style.transform = 'scale(' + (w / 390) + ')'
}
addEventListener('resize', fit)
addEventListener('message', (e) => {
  if (e.source !== $('proto').contentWindow) return
  const d = e.data || {}
  if (d.fohm === 'screens' && Array.isArray(d.list)) {
    $('screens').replaceChildren(...d.list.slice(0, 40).map((s) => {
      const b = document.createElement('button'); b.type = 'button'; b.textContent = String(s.title).slice(0, 40); b.dataset.id = String(s.id)
      b.onclick = () => $('proto').contentWindow.postMessage({fohm: 'go', id: b.dataset.id}, '*'); return b
    }))
  }
  if (d.fohm === 'at') for (const b of $('screens').children) b.classList.toggle('on', b.dataset.id === d.id)
})

async function look() {
  clearTimeout(timer)
  let r
  try { r = await app.callServerTool({name: 'get_app_prototype', arguments: {prototypeId: id}}) } catch { timer = setTimeout(look, 8000); return }
  const s = r && r.structuredContent
  if (!s) { timer = setTimeout(look, 8000); return }
  document.documentElement.style.setProperty('--accent', s.accent || '#2F6B4F')
  $('name').textContent = s.name || 'Your app'
  url = s.url || url; show('open', Boolean(url)); show('contact', true)
  if (s.status === 'done' && s.html) {
    $('line').textContent = s.summary || 'Designed by Claude, every screen.'
    show('building', false); show('done', true)
    if (!shown) { $('proto').srcdoc = s.html; shown = true; requestAnimationFrame(fit) }
    return
  }
  if (s.status === 'sketch' || s.status === 'done') { $('line').textContent = 'A quick sketch'; show('building', false); show('sketch', true); return }
  $('line').textContent = 'Claude is designing it now'
  show('building', true)
  const order = ['photos', 'planning', 'drawing'], at = order.indexOf(s.status)
  order.forEach((_, i) => { const li = $('s' + (i + 1)); li.className = i < at ? 'done' : i === at ? 'on' : '' })
  if (s.parts) $('s3').textContent = 'Drawing every screen: ' + s.drawn + ' of ' + s.parts + ' parts done'
  const share = s.status === 'photos' ? 5 : s.status === 'planning' ? 20 : 25 + 75 * (s.parts ? s.drawn / s.parts : 0)
  $('fill').style.width = Math.min(98, Math.round(share)) + '%'
  timer = setTimeout(look, 6000)
}

app.ontoolinput = ({arguments: a}) => { if (a && a.email && !$('cemail').value) $('cemail').value = String(a.email) }
app.ontoolresult = ({structuredContent: s}) => {
  if (!s || !s.prototypeId) return
  id = s.prototypeId; url = s.url || ''
  $('name').textContent = s.name || 'Your app'
  look()
}
$('open').onclick = () => url && app.openLink({url})
$('form').onsubmit = async (e) => {
  e.preventDefault()
  const name = $('cname').value.trim(), email = $('cemail').value.trim(), note = $('cnote').value.trim()
  if (!name || !/^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$/.test(email)) { $('cerr').textContent = 'Your name and an email address, please.'; show('cerr', true); return }
  show('cerr', false); $('csend').disabled = true; $('csend').textContent = 'Sending…'
  try {
    const r = await app.callServerTool({name: 'contact_fohm', arguments: {prototypeId: id, name, email, ...(note ? {note} : {})}})
    if (r && r.isError) throw new Error()
    show('form', false); $('sent').textContent = 'Sent. Rob will be in touch at ' + email + '.'; show('sent', true)
  } catch { $('cerr').textContent = 'That didn’t send. Try again, or use the full page.'; show('cerr', true); $('csend').disabled = false; $('csend').textContent = 'Send it to Fohm' }
}
await app.connect()
</script></body></html>`
}
