/**
 * The prototype Claude draws for a visitor's app, as one HTML document: the house style's kit
 * (fohm-scaffold's template: Space Grotesk 600 and DM Sans, the cool grey canvas, white cards,
 * hairline rows, the ink pill with an accent disc, the floating tab bar, the graphite dashboard),
 * the screens Claude drew on it, and a few lines of script that walk from screen to screen. It is
 * only ever shown in a sandboxed frame (no same origin), so nothing in it can reach the site.
 * Plain: used in the browser and on the server.
 */
import {marksCss} from './brand-marks'
import {liftedAccent, needsYou, onAccent, soften} from './options'

/** Where a unit is shown: the member's phone, the owner's dashboard on a laptop, or the website (the landing page) in a browser. */
export type Frame = 'phone' | 'laptop' | 'web'

/** One part of the plan, drawn in one call: a screen, or a short flow of screens (onboarding's steps). */
export interface Unit {
  id: string
  title: string
  frame: Frame
  /** How many screens it is: one, or a step each. */
  steps: number
  /** What it shows, for Claude: the content, the copy's gist, which photo. */
  shows: string
  /** How it's arranged, for Claude: what leads, what follows, the layout patterns it uses. Plans from before it had none. */
  layout?: string
  /** The units its buttons and links lead to. */
  links: string[]
}

export interface Plan {
  summary: string
  /** The calls Claude made that the owner would otherwise be asked: navigation, the accent, the voice. */
  decisions: string[]
  /** What every screen shares: the member we follow, their goal, the program, the numbers, the people on the dashboard. */
  world: string[]
  tabs: {label: string; to: string}[]
  units: Unit[]
  /** The look Claude chose (copied onto the job's look); plans from before it had none. */
  style?: Style
}

export interface Photo {
  url: string
  credit: string
  /** What it was found for. */
  about?: string
}

export interface Look {
  name: string
  accent: string
  /** The look Claude chose for this app (prototype.ts, parseStyle); prototypes from before it had none, and get the house's. */
  style?: Style
}

/** The variations a prototype may take within the house style's family, chosen by Claude from the answers and the apps the owner likes. */
export const CANVASES = ['light', 'dark'] as const
export const CORNERS = ['round', 'soft', 'square'] as const
export const TYPES = ['grotesk', 'serif', 'clean', 'rounded'] as const
export const HOMES = ['photo', 'list'] as const
export const SHAPES = ['monogram', 'ring', 'arch', 'peak', 'bars', 'leaf'] as const

export interface Style {
  canvas: (typeof CANVASES)[number]
  corners: (typeof CORNERS)[number]
  type: (typeof TYPES)[number]
  /** Whether Home leads with a photo or with the list of what's next. */
  home: (typeof HOMES)[number]
  /** A shape drawn in CSS, or (shape 'svg') the logo Claude drew for it: one path, `d`, on a 100 square (logos.ts). */
  icon: {shape: (typeof SHAPES)[number] | 'svg'; letters: string; d?: string}
  /** What it took from the apps the owner likes, one line each, for the owner and the screens' designers. */
  from: string[]
  /** The shades of the colour scheme they picked (schemes.ts): its canvas, cards, deep shade and tint. */
  palette?: {bg: string; surface: string; deep: string; tint: string}
}

/** The house style as it was before the looks: what an older prototype is drawn in. */
export const HOUSE: Style = {canvas: 'light', corners: 'soft', type: 'grotesk', home: 'photo', icon: {shape: 'ring', letters: ''}, from: []}

/** Everything a prototype is drawn from: signed by the server that planned it (prototype.ts). */
export interface Job {
  id: string
  look: Look
  facts: string
  plan: Plan
  photos: Photo[]
}

/** A unit as drawn: its screens' sections. */
export interface Drawn {
  id: string
  html: string
}

export const SIZE: Record<Frame, {w: number; h: number}> = {phone: {w: 390, h: 844}, laptop: {w: 1280, h: 800}, web: {w: 1280, h: 800}}

/** The font pairings: a display face for titles and figures, a text face for the rest, each from Google Fonts. */
export const TYPE_FACES: Record<Style['type'], {display: string; text: string; families: string; about: string}> = {
  grotesk: {display: 'Space Grotesk', text: 'DM Sans', families: 'family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&family=Space+Grotesk:wght@500;600', about: 'Space Grotesk and DM Sans: technical and sporty, the house pairing'},
  serif: {display: 'Fraunces', text: 'DM Sans', families: 'family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&family=Fraunces:opsz,wght@9..144,500;9..144,600', about: 'Fraunces and DM Sans: editorial and calm, a serif for titles'},
  clean: {display: 'Inter Tight', text: 'Inter', families: 'family=Inter:wght@400;500;600&family=Inter+Tight:wght@500;600', about: 'Inter Tight and Inter: neutral, dense and data-led'},
  rounded: {display: 'Nunito', text: 'Nunito Sans', families: 'family=Nunito:wght@600;700&family=Nunito+Sans:opsz,wght@6..12,400;6..12,500;6..12,600', about: 'Nunito and Nunito Sans: soft, friendly and playful'},
}

const fontsUrl = (type: Style['type']) => `https://fonts.googleapis.com/css2?${TYPE_FACES[type].families}&display=swap`

const CANVAS: Record<Style['canvas'], string> = {
  light: '--bg:#F2F2F6;--surface:#FFFFFF;--raised:#F4F4F7;--track:#E6E6EB;--line:#E3E3E9;--ink:#111113;--on-ink:#FFFFFF;--mid:#4A4A52;--faint:#5F6672;--shadow:rgba(17,17,19,.14)',
  dark: '--bg:#0E0E10;--surface:#1B1B1F;--raised:#24242A;--track:#2E2E35;--line:#2C2C33;--ink:#F2F2F6;--on-ink:#111113;--mid:#B9B9C3;--faint:#9A9AA6;--shadow:rgba(0,0,0,.5)',
}

/** The corners: cards, tiles, small things (thumbs, fields) and the buttons. */
const RADII: Record<Style['corners'], string> = {
  round: '--r-card:28px;--r-tile:24px;--r-sm:16px;--r-field:18px;--r-pill:999px',
  soft: '--r-card:20px;--r-tile:18px;--r-sm:12px;--r-field:14px;--r-pill:999px',
  square: '--r-card:6px;--r-tile:6px;--r-sm:4px;--r-field:4px;--r-pill:8px',
}

/** The app's mark, a ring (the one the website's deck shows as every app's icon: components/app-prototype.tsx's Mark), on a 640 square from 192. */
export const RING_PATH =
  'M 192 512 A 320 320 0 1 0 832 512 A 320 320 0 1 0 192 512 Z M 262 512 A 250 250 0 1 0 762 512 A 250 250 0 1 0 262 512 Z M 402 512 A 110 110 0 1 0 622 512 A 110 110 0 1 0 402 512 Z'


/**
 * The app's icon's mark, drawn in CSS alone on the selector given (a ::after), in the current
 * colour: no image, so no host's content policy can block it. The monogram is its letters, the
 * others a shape. Used by the prototype's kit and the chat's view (mcp-view.ts).
 */
/**
 * A logo's path as Claude drew it, kept only if it is path data and nothing else (commands,
 * numbers, spaces and commas), so it can go into a stylesheet and a page safely. Else ''.
 */
export function cleanMarkPath(v: unknown) {
  const d = typeof v === 'string' ? v.replace(/\s+/g, ' ').trim() : ''
  return /^[Mm][MmLlHhVvCcSsQqTtAaZz0-9 .,eE-]{3,5999}$/.test(d) ? d : ''
}

/** The logo's path as an SVG in a data URL, for a CSS mask: filled in the current colour where it's drawn. */
export const markUrl = (d: string) =>
  `data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><path fill-rule='evenodd' d='${d}'/></svg>`).replace(/'/g, '%27')}`

export function iconMarkCss(sel: string, icon: Style['icon']) {
  const base = `${sel}{content:'';display:block;background:currentColor}`
  const d = icon.shape === 'svg' ? cleanMarkPath(icon.d) : ''
  if (d) {
    const mask = `url("${markUrl(d)}") center/contain no-repeat`
    return `${base}${sel}{width:70%;height:70%;-webkit-mask:${mask};mask:${mask}}`
  }
  switch (icon.shape) {
    case 'monogram':
      return `${sel}{content:'${icon.letters.replace(/[^A-Za-z0-9&]/g, '').slice(0, 2) || '?'}';display:block;font:600 .5em/1 var(--d,system-ui);letter-spacing:-.02em;background:none}`
    case 'arch':
      return `${base}${sel}{width:60%;height:52%;margin-top:8%;border-radius:999px 999px 3px 3px}`
    case 'peak':
      return `${base}${sel}{width:66%;height:58%;clip-path:polygon(50% 0,100% 100%,0 100%)}`
    case 'bars':
      return `${base}${sel}{width:56%;height:58%;background:repeating-linear-gradient(currentColor 0 22%,transparent 22% 39%)}`
    case 'leaf':
      return `${base}${sel}{width:56%;height:56%;border-radius:0 100% 0 100%}`
    default:
      return `${base}${sel}{width:64%;height:64%;background:radial-gradient(circle closest-side,currentColor 0 34%,transparent 35% 77.5%,currentColor 78.5% 99%,transparent 100%)}`
  }
}

const escAttr = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')

/** The kit: every class a screen may use. Claude is told these and only these (prototype.ts, KIT). */
export function kitCss(accent: string, style: Style = HOUSE) {
  const a = /^#[0-9a-fA-F]{6}$/.test(accent) ? accent : '#2F6B4F'
  const lifted = liftedAccent(a)
  const faces = TYPE_FACES[style.type]
  const hex = (v?: string) => (v && /^#[0-9a-fA-F]{6}$/.test(v) ? v : '')
  const p = style.palette
  // The scheme's shades over the canvas's; without a scheme, a deep shade and a tint made from the accent.
  // The tick on a chosen tile or choice: a disc in ink with the check in the colour on ink, drawn for this canvas.
  const [ink, onInk] = style.canvas === 'dark' ? ['#F2F2F6', '#111113'] : ['#111113', '#FFFFFF']
  const tick = `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><circle cx='12' cy='12' r='12' fill='${ink}'/><path d='M7 12.5l3.2 3.2L17 9' fill='none' stroke='${onInk}' stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round'/></svg>`).replace(/'/g, '%27')}") center/cover no-repeat`
  const shades = [
    hex(p?.bg) && `--bg:${p!.bg}`,
    hex(p?.surface) && `--surface:${p!.surface}`,
    `--deep:${hex(p?.deep) || `color-mix(in srgb, ${a} 45%, #0b0b0d)`}`,
    `--tint:${hex(p?.tint) || (style.canvas === 'dark' ? `color-mix(in srgb, ${a} 18%, #1b1b1f)` : soften(a))}`,
    // A scheme is a palette, not one colour: its tint fills the quiet surfaces (chips, fields, tracks) too.
    hex(p?.tint) && `--raised:${p!.tint};--track:${p!.tint}`,
  ]
    .filter(Boolean)
    .join(';')
  return `
:root{${CANVAS[style.canvas]};${RADII[style.corners]};${shades};
--accent:${a};--on-accent:${onAccent(a)};--accent-soft:${soften(a)};--dash-accent:${lifted};--on-dash:${onAccent(lifted)};--needs-you:${needsYou(a)};
--g-bg:#111113;--g-side:#0B0B0D;--g-card:#1C1C20;--g-line:#2A2A30;--g-text:#F2F2F6;--g-mid:#A3A3AD;
--d:'${faces.display}',system-ui,sans-serif;--t:'${faces.text}',system-ui,sans-serif}
*{box-sizing:border-box}
html,body{margin:0;padding:0}
body{font:400 16px/1.45 var(--t);color:var(--ink);background:var(--bg);-webkit-font-smoothing:antialiased}
body[data-view=laptop]{background:var(--g-bg)}
img{display:block;max-width:100%}
a{color:inherit;text-decoration:none;cursor:pointer}
button{font:inherit;color:inherit;background:none;border:0;padding:0;cursor:pointer;text-align:inherit}
h1,h2,h3,h4,p,ul,ol{margin:0;padding:0}
li{list-style:none}
.screen{display:none;position:relative;min-height:100vh}
.screen.is-on{display:block}
.screen[data-frame=phone]{padding:44px 0 132px;background:var(--bg)}
.screen[data-frame=phone].bleed{padding-top:0}
.bar{display:flex;align-items:center;justify-content:space-between;gap:12px;min-height:52px;padding:0 20px}
.back{display:inline-grid;place-items:center;width:44px;height:44px;margin-left:-12px;border-radius:50%}
.back::before{content:'';width:10px;height:10px;border-left:2px solid currentColor;border-bottom:2px solid currentColor;transform:translateX(2px) rotate(45deg)}
.hero-title{font:600 34px/1.06 var(--d);letter-spacing:-.02em}
.title{font:600 28px/1.1 var(--d);letter-spacing:-.01em}
.heading{font:600 20px/1.2 var(--d)}
.label{font:500 15px/1.3 var(--d)}
.lead{font-size:18px;line-height:1.45;color:var(--mid)}
.small{font-size:13px;line-height:1.4;color:var(--faint)}
.mid{color:var(--mid)}
.num{font-family:var(--d);font-weight:600;font-variant-numeric:tabular-nums}
.big-num{font:600 44px/1 var(--d);font-variant-numeric:tabular-nums}
.pad{padding-left:20px;padding-right:20px}
.stack{display:grid;gap:12px}
.stack-sm{display:grid;gap:6px}
.stack-lg{display:grid;gap:24px}
.row-x{display:flex;align-items:center;gap:12px}
.between{justify-content:space-between}
.section{margin-top:28px}
.grid-2{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.scroll-x{display:flex;gap:12px;overflow-x:auto;padding:0 20px;scrollbar-width:none}
.scroll-x>*{flex:none;width:240px}
.scroll-x.sm>*{width:150px}
.scroll-x.lg>*{width:300px}
.grid-3{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
.center{text-align:center;justify-items:center}
.card{background:var(--surface);border-radius:var(--r-card);padding:16px}
.list{background:var(--surface);border-radius:var(--r-card);overflow:hidden}
.row{display:flex;align-items:center;gap:14px;padding:12px 16px;min-height:64px}
.list>.row+.row{border-top:1px solid var(--line)}
.grow{flex:1;min-width:0}
.t{font:500 16px/1.3 var(--t)}
.s{font-size:13px;line-height:1.35;color:var(--faint)}
.chev::after{content:'';display:block;flex:none;width:8px;height:8px;margin-right:4px;border-right:2px solid var(--faint);border-top:2px solid var(--faint);transform:rotate(45deg)}
.thumb{width:56px;height:56px;border-radius:var(--r-sm);object-fit:cover;background:var(--track);flex:none}
.hero{width:100%;height:340px;object-fit:cover;background:var(--track)}
.photo-card{display:block;background:var(--surface);border-radius:var(--r-card);overflow:hidden}
.photo-card img{width:100%;height:180px;object-fit:cover;background:var(--track)}
.photo-card.tall img{height:300px}
.photo-card .in{padding:14px 16px;display:grid;gap:4px}
.credit{font-size:11px;line-height:1.3;color:var(--faint)}
.app-icon{display:inline-grid;place-items:center;flex:none;width:44px;height:44px;font-size:44px;border-radius:calc(var(--r-sm) * .9 + 2px);background:var(--accent);overflow:hidden}
.app-icon{color:var(--on-accent)}
${iconMarkCss('.app-icon::after', style.icon)}
.app-icon.sm{width:32px;height:32px;font-size:32px;border-radius:calc(var(--r-sm) * .7 + 1px)}
.app-icon.lg{width:76px;height:76px;font-size:76px;border-radius:calc(var(--r-sm) * 1.5)}
.deep{background:var(--deep);color:#fff;border-radius:var(--r-card);padding:20px}
.deep .lead,.deep .mid,.deep .small,.deep .s,.deep .credit{color:rgba(255,255,255,.78)}
.deep .pill{background:#fff;color:#111113}
.screen.deep{border-radius:0;padding-left:0;padding-right:0}
.tint{background:var(--tint);border-radius:var(--r-card);padding:16px}
.hero-top{position:relative}
.hero-top>.over{position:absolute;top:0;left:0;right:0;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:52px 20px 32px;color:#fff;background:linear-gradient(rgba(0,0,0,.5),rgba(0,0,0,0))}
.hero-top>.over .link{color:#fff}
.screen.cover{padding:0;background:#111113;color:#fff;overflow:hidden}
.screen.cover.is-on{display:flex;flex-direction:column;justify-content:flex-end;gap:16px;min-height:844px;padding:0 0 36px}
.cover>img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.screen.cover::before{content:'';position:absolute;inset:0;z-index:1;background:linear-gradient(rgba(0,0,0,.5),rgba(0,0,0,0) 22%,rgba(0,0,0,0) 42%,rgba(0,0,0,.82) 78%)}
.cover>:not(img){position:relative;z-index:2}
.cover>.over{position:absolute;top:0;left:0;right:0;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:52px 20px 0}
.cover .lead,.cover .mid,.cover .small,.cover .s,.cover .credit{color:rgba(255,255,255,.8)}
.cover .link{color:#fff}
.cover .pill{background:#fff;color:#111113}
.cover .dots i{background:rgba(255,255,255,.35)}
.cover .dots i.on{background:#fff}
.cover .foot{position:static;padding:0 20px;background:none}
.avatar{width:44px;height:44px;border-radius:50%;object-fit:cover;background:var(--track);flex:none}
.avatar.lg{width:88px;height:88px}
.initials{display:inline-grid;place-items:center;font:600 15px var(--d);color:var(--mid);background:var(--track)}
.avatar.lg.initials{font-size:28px}
.pill{display:flex;align-items:center;justify-content:space-between;gap:12px;width:100%;height:58px;padding:0 9px 0 24px;border-radius:var(--r-pill);background:var(--ink);color:var(--on-ink);font:600 16px var(--d)}
.disc{display:grid;place-items:center;width:40px;height:40px;border-radius:calc(var(--r-pill) - 4px);background:var(--accent);color:var(--on-accent);flex:none}
.disc::after{content:'';width:9px;height:9px;border-top:2px solid currentColor;border-right:2px solid currentColor;transform:translateX(-2px) rotate(45deg)}
.quiet{display:flex;align-items:center;justify-content:center;width:100%;height:52px;border-radius:var(--r-pill);background:var(--raised);font:600 15px var(--d)}
.link{font:500 15px var(--t);text-decoration:underline;text-underline-offset:3px}
.foot{position:fixed;left:0;right:0;bottom:0;padding:16px 20px 30px;background:linear-gradient(transparent,var(--bg) 28%);display:grid;gap:10px}
.chips{display:flex;flex-wrap:wrap;gap:8px}
.chip{display:inline-flex;align-items:center;height:36px;padding:0 14px;border-radius:var(--r-pill);background:var(--raised);font:500 14px var(--t);color:var(--ink)}
.chip.on{background:var(--ink);color:var(--on-ink)}${p && hex(p.deep) ? '\n.chip.on{background:var(--deep);color:#fff}' : ''}
.choice{display:flex;align-items:center;gap:14px;width:100%;min-height:64px;padding:14px 16px;border-radius:var(--r-tile);background:var(--surface)}
.choice::after{content:'';flex:none;margin-left:auto;width:24px;height:24px;border-radius:50%;box-shadow:inset 0 0 0 2px var(--track)}
.choice.on::after{box-shadow:none;background:${tick}}
.tiles{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
.tile{position:relative;display:block;border-radius:var(--r-tile);overflow:hidden;background:var(--surface)}
.tile img{width:100%;aspect-ratio:1/1;height:auto;object-fit:cover;background:var(--track);transition:filter .2s}
.tile .t{display:block;padding:12px 14px}
.tile:has(img)::before{content:'';position:absolute;inset:0;background:linear-gradient(rgba(0,0,0,0) 45%,rgba(0,0,0,.62));pointer-events:none}
.tile:has(img) .t{position:absolute;left:0;right:0;bottom:0;color:#fff}
.tile::after{content:'';position:absolute;top:10px;right:10px;width:24px;height:24px;border-radius:50%;box-shadow:inset 0 0 0 2px rgba(255,255,255,.9),0 1px 4px rgba(0,0,0,.25)}
.tile:not(:has(img))::after{box-shadow:inset 0 0 0 2px var(--track)}
.tile.on::after{box-shadow:0 1px 4px rgba(0,0,0,.25);background:${tick}}
.tile.on img{filter:saturate(1.08) brightness(.92)}
.dots{display:flex;gap:6px;align-items:center}
.dots i{width:8px;height:8px;border-radius:4px;background:var(--track)}
.dots i.on{width:22px;background:var(--ink)}
.stat{background:var(--surface);border-radius:var(--r-card);padding:16px;display:grid;gap:6px}
.track{height:8px;border-radius:4px;background:var(--track);overflow:hidden}
.track>span{display:block;height:100%;border-radius:4px;background:var(--ink)}
.week{display:grid;grid-template-columns:repeat(7,1fr);gap:4px}
.day{display:grid;justify-items:center;gap:6px;min-width:0;font:500 12px var(--t);color:var(--faint)}
.day b{display:grid;place-items:center;width:100%;max-width:36px;aspect-ratio:1;border-radius:50%;font:600 15px var(--d);color:var(--ink);background:var(--surface)}
.day.done b{background:var(--ink);color:var(--on-ink)}
.day.today b{box-shadow:0 0 0 2px var(--bg),0 0 0 4px var(--accent)}
.live{display:inline-flex;align-items:center;gap:6px;height:26px;padding:0 10px;border-radius:999px;background:var(--accent);color:var(--on-accent);font:600 12px var(--d)}
.note{background:var(--raised);border-radius:var(--r-tile);padding:14px 16px;color:var(--mid)}
.field{display:grid;gap:6px}
.field>span{font:500 14px var(--t);color:var(--mid)}
.input{display:flex;align-items:center;min-height:52px;padding:0 16px;border-radius:var(--r-field);background:var(--surface);border:1px solid var(--line);color:var(--faint)}
.seg{display:flex;padding:3px;border-radius:var(--r-sm);background:var(--track)}
.seg>*{flex:1;text-align:center;padding:8px 6px;border-radius:calc(var(--r-sm) - 2px);font:500 14px var(--t);color:var(--mid)}
.seg>.on{background:var(--surface);color:var(--ink)}
.player{position:relative;display:block;border-radius:var(--r-card);overflow:hidden;background:var(--track)}
.player img{width:100%;height:220px;object-fit:cover}
.play{position:absolute;left:14px;bottom:14px;display:grid;place-items:center;width:52px;height:52px;border-radius:50%;background:var(--ink);color:var(--on-ink)}
.play::after{content:'';margin-left:4px;border-left:14px solid currentColor;border-top:9px solid transparent;border-bottom:9px solid transparent}
.bubble{max-width:82%;padding:12px 14px;border-radius:var(--r-tile);background:var(--surface)}
.bubble.me{margin-left:auto;background:var(--ink);color:var(--on-ink)}
.tabbar{position:fixed;left:16px;right:16px;bottom:20px;z-index:5;display:flex;justify-content:space-around;align-items:center;height:66px;padding:0 6px;border-radius:min(33px,calc(var(--r-card) + 8px));background:var(--surface);box-shadow:0 8px 28px var(--shadow)}
.tab{display:grid;justify-items:center;gap:3px;min-width:58px;font:500 11px var(--t);color:var(--faint)}
.tab svg{width:22px;height:22px}
.tab.on{color:var(--ink)}
.screen[data-frame=web]{background:var(--bg);padding-bottom:0}
.site{max-width:1120px;margin:0 auto;padding:0 48px}
.site-nav{display:flex;align-items:center;justify-content:space-between;gap:24px;height:76px}
.site-nav .links{display:flex;align-items:center;gap:28px;font:500 15px var(--t);color:var(--mid)}
.site-hero{display:grid;grid-template-columns:1fr 1fr;gap:48px;align-items:center;padding:40px 0 72px}
.site-hero .hero-title{font-size:56px;line-height:1.02}
.site-hero img{width:100%;height:460px;object-fit:cover;border-radius:var(--r-card);background:var(--track)}
.site-hero .pill{width:auto;display:inline-flex;gap:20px}
.site-nav .link,.site-nav a{white-space:nowrap}
.site-nav .link{text-decoration:none}
.site-nav .pill{width:auto;height:48px;gap:16px}
.site-nav .pill .disc{width:32px;height:32px}
.site-band{padding:112px 0}
.site-band .title{margin-bottom:24px}
.site-band.tint{border-radius:0;padding:112px 0}
.site-head{display:grid;gap:14px;max-width:680px;margin-bottom:48px}
.site-head .title,.site-split .title{font-size:44px;line-height:1.04;letter-spacing:-.02em;margin:0}
.site-grid-3{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}
.site-grid-2{display:grid;grid-template-columns:1fr 1fr;gap:20px}
/* The landing page sells: a full-bleed photo with the promise over it, the app itself in a phone, and bands that change pace (Nov 2026: the two-column hero and grey cards read as a brochure). */
.site-cover{position:relative;display:flex;flex-direction:column;min-height:800px;background:#111113;color:#fff;overflow:hidden}
.site-cover>img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.site-cover::before{content:'';position:absolute;inset:0;z-index:1;background:linear-gradient(rgba(0,0,0,.5),rgba(0,0,0,0) 22%,rgba(0,0,0,0) 38%,rgba(0,0,0,.8) 94%)}
.site-cover>*:not(img){position:relative;z-index:2}
.site-cover>.site{width:100%}
.site-cover .site-nav,.site-cover .site-nav .link{color:#fff}
.site-cover .site-nav .pill,.site-cover .site-words .pill,.site-statement .pill{background:#fff;color:#111113}
.site-hold{display:grid;grid-template-columns:minmax(0,1fr) 300px;gap:72px;align-items:end;margin-top:auto;padding-top:48px;padding-bottom:64px}
.site-words{display:grid;gap:22px;justify-items:start;max-width:680px}
.site-words .hero-title{font-size:72px;line-height:.98;letter-spacing:-.035em;text-wrap:balance}
.site-words .lead{font-size:21px;max-width:540px;color:rgba(255,255,255,.86)}
.site-words .pill{width:auto;gap:20px}
.site-words .link,.site-cover>.credit,.site-words .credit{color:rgba(255,255,255,.8)}
.site-cover>.credit{position:absolute;right:48px;bottom:18px}
.site-cover.end{min-height:620px}
.site-cover.end::before{background:rgba(0,0,0,.5)}
.site-cover.end .site-words{margin:auto;padding:96px 0;justify-items:center;text-align:center}
.site-cover.end .site-words .hero-title{font-size:64px}
.site-phone{position:relative;width:300px;height:620px;border:10px solid #111113;border-radius:48px;background:var(--bg);color:var(--ink);overflow:hidden;padding-top:30px;box-shadow:0 40px 80px rgba(0,0,0,.4),0 0 0 1px rgba(255,255,255,.14)}
.site-phone::before{content:'';position:absolute;top:9px;left:50%;width:84px;height:22px;margin-left:-42px;border-radius:12px;background:#111113;z-index:3}
/* The phone's screen is laid out at a phone's 390 wide and shown at its 280, as a screenshot is: a week of 36px days or a strip of cards clipped at 280 wide. */
.site-phone>*{zoom:.718}
.site-steps{display:grid;grid-template-columns:repeat(3,1fr);gap:32px}
.site-step{display:grid;gap:12px;align-content:start}
.site-step img{width:100%;height:320px;object-fit:cover;border-radius:var(--r-card);background:var(--track);margin-bottom:8px}
.site-step .big-num{font-size:56px;letter-spacing:-.03em}
.site-split{display:grid;grid-template-columns:minmax(0,1.15fr) minmax(0,1fr);gap:80px;align-items:center}
.site-split.flip>:first-child{order:2}
.site-split>img{width:100%;height:600px;object-fit:cover;border-radius:var(--r-card);background:var(--track)}
.site-split>.site-phone{justify-self:center}
.site-split .stack-lg{justify-items:start}
.site-split .stack-lg>.list,.site-split .stack-lg>.card{justify-self:stretch}
.site-split .pill{width:auto;gap:20px}
.site-strip{display:flex;gap:20px;overflow-x:auto;padding:0 calc((100% - 1024px) / 2);scrollbar-width:none}
.site-strip>*{flex:none;width:360px}
.site-strip .photo-card img{height:440px}
.site-statement{border-radius:0;padding:136px 0}
.site-big{font:600 64px/1.02 var(--d);letter-spacing:-.03em;max-width:960px;text-wrap:balance}
.site-statement .lead{max-width:620px;margin-top:24px;font-size:20px}
.site-price{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:20px;align-items:stretch}
.site-price>*{padding:32px}
.site-price .big-num{font-size:56px}
::selection{background:var(--accent);color:var(--on-accent)}
.site-foot{display:flex;justify-content:space-between;gap:24px;padding:28px 0 40px;border-top:1px solid var(--line);font-size:14px;color:var(--faint)}
.screen[data-frame=laptop]{background:var(--g-bg);color:var(--g-text)}
.dash{display:grid;grid-template-columns:232px minmax(0,1fr);min-height:100vh}
.side{display:grid;align-content:start;gap:4px;padding:24px 14px;background:var(--g-side)}
.brand{display:flex;align-items:center;gap:10px;padding:4px 10px 20px;font:600 17px var(--d);color:#fff}
.brand i{display:grid;place-items:center;width:26px;height:26px;font-size:26px;border-radius:7px;background:var(--dash-accent);color:var(--on-dash);overflow:hidden}
${iconMarkCss('.brand i::after', style.icon)}
.side a{display:flex;align-items:center;gap:10px;height:40px;padding:0 12px;border-radius:10px;font:500 14px var(--t);color:#C9CCD1}
.side a.on{background:var(--g-card);color:#fff}
.main{display:grid;align-content:start;gap:24px;padding:32px 40px}
.d-title{font:600 28px/1.1 var(--d);color:#fff}
.d-sub{font-size:14px;color:var(--g-mid)}
.d-card{background:var(--g-card);border-radius:16px;padding:20px}
.d-stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:16px}
.d-stat{background:var(--g-card);border-radius:16px;padding:18px 20px;display:grid;gap:6px}
.d-stat .num{font-size:30px;line-height:1;color:#fff}
.d-row{display:grid;grid-template-columns:2.2fr 1.4fr 1fr 1fr 110px;align-items:center;gap:16px;min-height:56px;padding:8px 4px;border-top:1px solid var(--g-line);font-size:14px}
.d-row.head{min-height:36px;border-top:0;font-size:13px;color:var(--g-mid)}
.d-row .avatar{width:32px;height:32px}
.needs{display:inline-flex;align-items:center;gap:6px;font-weight:600;color:var(--needs-you)}
.needs::before{content:'';width:8px;height:8px;border-radius:50%;background:var(--needs-you)}
.d-pill{display:inline-flex;align-items:center;justify-content:center;height:38px;padding:0 16px;border-radius:999px;background:var(--dash-accent);color:var(--on-dash);font:600 14px var(--d)}
.d-quiet{display:inline-flex;align-items:center;justify-content:center;height:38px;padding:0 16px;border-radius:999px;background:var(--g-line);color:#fff;font:600 14px var(--d)}
.d-chip{display:inline-flex;align-items:center;height:26px;padding:0 10px;border-radius:999px;background:var(--g-line);color:#C9CCD1;font-size:12px}
.bars{display:flex;align-items:flex-end;gap:8px;height:140px}
.bars>span{flex:1;border-radius:6px 6px 0 0;background:#3A3A42}
.bars>span.now{background:var(--dash-accent)}
.screen[data-frame=laptop] .s,.screen[data-frame=laptop] .small,.screen[data-frame=laptop] .credit{color:var(--g-mid)}
.screen[data-frame=laptop] .note{background:var(--g-card);color:#C9CCD1}
.screen[data-frame=laptop] .initials{background:var(--g-line);color:#fff;font-size:13px}
${marksCss()}
/* Nothing is wider than its screen: a sideways strip in a grid once pushed a whole screen past the phone's edge. */
.screen[data-frame=phone]{overflow-x:clip}
.stack>*,.stack-sm>*,.stack-lg>*,.grid-2>*,.grid-3>*,.card>*,.deep>*,.tint>*,.list>*{min-width:0}
.scroll-x{max-width:100%}
.row>.num,.row>.chip,.row>.mark,.row>.thumb,.row>.avatar{flex:none}
.t,.s,.title,.heading,.hero-title,.lead,.label{overflow-wrap:anywhere}
/* Surfaces on a deep card or over a photo take its white words: a .stat there was white on white. */
.deep .stat,.deep .card,.deep .list,.deep .note,.cover .stat,.cover .card{background:rgba(255,255,255,.12);color:#fff}
.deep .list>.row+.row{border-top-color:rgba(255,255,255,.16)}
.deep .chip,.cover .chip{background:rgba(255,255,255,.16);color:#fff}
`
}

/** Walks the screens: a tap on [data-go] or a link shows that screen; picks in [data-pick] groups light up. */
const SHELL = `(function(){
var all=[].slice.call(document.querySelectorAll('.screen'));
var view=document.body.getAttribute('data-view');
var mine=all.filter(function(s){return s.getAttribute('data-frame')===view});
function find(id){for(var i=0;i<mine.length;i++)if(mine[i].id===id)return mine[i];for(var j=0;j<mine.length;j++)if(mine[j].getAttribute('data-unit')===id)return mine[j];return null}
function show(id){var s=find(id)||mine[0];if(!s)return;all.forEach(function(x){x.classList.toggle('is-on',x===s)});window.scrollTo(0,0);parent.postMessage({fohm:'at',id:s.id},'*')}
document.addEventListener('click',function(e){
var pick=e.target.closest('[data-pick]>*');
if(pick){var g=pick.parentElement;if(g.getAttribute('data-pick')==='many')pick.classList.toggle('on');else[].forEach.call(g.children,function(c){c.classList.toggle('on',c===pick)})}
var el=e.target.closest('a,[data-go]');if(!el)return;e.preventDefault();
var id=el.getAttribute('data-go')||(el.getAttribute('href')||'').replace(/^#/,'');if(id&&find(id))show(id)});
addEventListener('message',function(e){var d=e.data;if(d&&d.fohm==='go'&&typeof d.id==='string')show(d.id)});
parent.postMessage({fohm:'screens',list:mine.map(function(s){return{id:s.id,title:s.getAttribute('data-title')||s.id}})},'*');
show(document.body.getAttribute('data-start')||'');
})();`

/** The whole prototype, for one frame: the phone's screens, or the laptop's (the owner's dashboard). */
export function prototypeDocument({look, units, view, start = ''}: {look: Look; units: Drawn[]; view: Frame; start?: string}) {
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=${SIZE[view].w}">
<title>${escAttr(look.name)} prototype</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${fontsUrl(look.style?.type ?? 'grotesk')}" media="print" onload="this.media='all'">
<style>${kitCss(look.accent, look.style ?? HOUSE)}</style></head>
<body data-view="${view}" data-start="${escAttr(start)}">
${units.map((u) => u.html).join('\n')}
<script>${SHELL}</script>
</body></html>`
}

/** Which frames a set of units has screens for. */
export const framesOf = (plan: Plan) => (['web', 'phone', 'laptop'] as const).filter((f) => plan.units.some((u) => u.frame === f))
