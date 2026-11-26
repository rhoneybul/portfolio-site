/**
 * Claude designs the visitor's app: first a plan of the whole journey (the screens, what each
 * shows, what they share), then each part drawn on the house kit, several at once. The plan comes
 * back to the browser signed, so the screen route draws only what a plan this server made asks
 * for, and never takes the visitor's words straight into a prompt. Server only.
 */
import {createHash, createHmac, randomBytes, timingSafeEqual} from 'node:crypto'
import {TEMPLATES, type Answers, type Options} from './options'
import type {Drawn, Job, Photo, Plan, Unit} from './prototype-doc'
import {DRAW_MODEL, PLAN_MODEL, askClaude} from './claude'

export type {Job}

// ---------- What the visitor told us ----------

const line = (label: string, v?: string) => (v && v.trim() ? `${label}: ${v.trim().replace(/\s+/g, ' ').slice(0, 600)}` : '')

/** The answers, as the facts every prompt starts from. */
export function factsOf(o: Options, raw: Answers) {
  const template = TEMPLATES.find((t) => t.value === raw.template)
  const kind =
    o.kind === 'game'
      ? 'a game'
      : o.kind === 'app'
        ? 'a plain app'
        : o.coach === 'yes'
          ? 'a coaching progression, with a real coach who answers members and notes their progress'
          : 'a coaching progression as programs, with nobody behind them: the app speaks as itself'
  return [
    line('App name', `${o.name}${raw.nameSure === 'yes' ? '' : ' (a working name)'}`),
    line('What it does, and for whom', raw.idea),
    line('The business behind it, and what people already pay for', raw.business),
    template && template.value !== 'other' && line('Closest app already built on the same foundations', `${template.label.replace(/^Like /, '')}: ${template.hint}`),
    line('Kind', kind),
    line('What people should be doing in the app', raw.doing),
    line('The landing page headline', o.tagline),
    line('What people are here for (onboarding’s tiles)', raw.interests),
    line('What people work towards: places, events or trips', raw.goals),
    line('What the business already publishes (the library points at it)', raw.content),
    line('Apps the owner likes the look and feel of', o.inspiration),
    line('The people who use it are called', `${o.memberWord}s; the person who runs it is the ${o.ownerWord}`),
    line('The accent colour', o.accent.toUpperCase()),
    line('The audience today', raw.audience),
    line('Success in a year', raw.ambition),
  ]
    .filter(Boolean)
    .join('\n')
}

const JOURNEY: Record<string, string> = {
  coachYes:
    'the landing page (led by a photo); signing in; onboarding as Naz’s (an opening that asks the app’s key value as a question over a photo, straight questions one to a screen with the dots and Skip, what they’re here for as photo tiles, why it works, a first number, the week they can give, and the end, which lands on their path); Home on the first day; Home three weeks in (the goal as the hero, the next thing to do, the week); the path (the levels and the skills at each, where they are); a session from start to done; a check-in (what they worked on and how it felt); a goal they train for (its photo, what it asks, the courses that prepare for it, saved); sending the coach a video or a question, and the coach’s reply; Pro (what it adds, the price as a placeholder); Account (their photo, their goal, their plan).',
  coachNo:
    'the landing page (led by a photo); signing in; onboarding as Naz’s (an opening that asks the app’s key value as a question over a photo, straight questions one to a screen with the dots and Skip, what they’re here for as photo tiles, why it works, a first number, the week they can give, and the end, which starts their program from the answers); Home on the first day; Home three weeks in (the goal as the hero, the next session, the week); their program (its weeks and sessions, where they are); a session from start to done; a check-in (what they did and how it felt); a goal they train for (its photo, what it asks, the courses that prepare for it, saved); the library; Pro (what it adds, the price as a placeholder); Account (their photo, their goal, their program).',
  app: 'the landing page (led by a photo); signing in; onboarding (a few straight questions one to a screen with the dots and Skip, and what they’re here for as photo tiles); Home; the app’s one job from start to done, in two or three units; a list or catalogue of what it holds, with photos; one item in full; Pro (the price as a placeholder); Account.',
  game: 'the landing page (led by a photo); how to play, in one or two screens; the first round in play; the score at the end of a round; Home, the way back in (where you are, the next challenge, the places to play, with photos); a leaderboard or progress; Account.',
}

const journeyOf = (o: Options) => (o.kind === 'game' ? JOURNEY.game : o.kind === 'app' ? JOURNEY.app : o.coach === 'yes' ? JOURNEY.coachYes : JOURNEY.coachNo)

// ---------- The plan ----------

const PLAN_SYSTEM = `You are a senior product designer planning a high-fidelity, clickable prototype of a new app for its owner, before any of it is built. The owner taps through it end to end and decides from it, so it must be their app: their business, their words, their photos, and the journey their members really take, in the house style shared with Naz and Etapa (a quiet, native-feeling list app: a cool grey canvas, white cards, hairline rows, one accent; the owner's dashboard in graphite).

You plan the units the prototype is drawn in. Each unit is drawn by another designer who sees only your plan, the facts and the photos, several at the same time, so the plan carries everything the screens share.

Reply with JSON only, in this shape:
{
  "summary": "Two or three sentences: what the app is and what this prototype shows.",
  "decisions": ["The calls you made that the owner would otherwise be asked, one a line: the navigation (a tab bar and its tabs, or one hub), what the accent marks, the voice of the words."],
  "world": ["What every screen shares, one fact a line, concrete and in the business's words: the member we follow (a first name), their goal and why, where they are in it (week 3 of 8, sessions done), the path or program and its parts, the things onboarding offers, the library's items, the five people on the owner's dashboard (first name and last initial, what each is on, two needing the owner), any price as a [placeholder]."],
  "tabs": [{"label": "Home", "to": "home"}],
  "units": [{"id": "landing", "title": "Landing page", "frame": "phone", "steps": 1, "shows": "What it shows top to bottom, the gist of its words, which photo by number, and what each tap leads to.", "links": ["sign-in"]}]
}

Rules:
- 10 to 15 units. The member's journey on the phone first, in the order they meet it ("frame": "phone"); then 2 to 4 units of the owner's dashboard ("frame": "laptop").
- Onboarding is one unit of 4 to 7 steps. A session from start to done may be 2 or 3 steps. Every other unit is 1 step.
- ids are short kebab-case words, unique. links name unit ids only. Every unit is reachable from the landing page, and every phone unit leads somewhere.
- tabs: 3 to 5, each to a phone unit that shows the tab bar; or [] for an app with one hub screen.
- Give every photo slot a photo by its number: the strongest for the landing page and the goal, and each where it fits what it shows.
- Never invent facts about the business (prices, dates, client numbers): write a [placeholder]. The member we follow and the dashboard's people are illustrative, and may have sample activity.
- Plain English and sentence case. No emoji.`

const DASHBOARD = (o: Options) =>
  `The owner's dashboard: People (everyone, who needs the ${o.ownerWord} on top), one ${o.memberWord}'s page (what they've done, their goal, their plan, what needs a reply), Overview (${o.memberWord}s, active this week, sign-ups by week, the funnel from signing up to paying)${o.coach === 'yes' ? `, and the inbox where the ${o.ownerWord} replies to a video or question` : ''}.`

const COACHING = (o: Options) =>
  o.kind === 'game'
    ? 'It is a game: no coach.'
    : o.coach === 'yes'
      ? `There is a real coach (the ${o.ownerWord}). Name them only if the facts do; otherwise "your ${o.ownerWord}".`
      : 'There is no coach: the app speaks as itself, and no coach is shown or offered anywhere.'

const photoList = (photos: Photo[], urls: boolean) =>
  photos.length
    ? photos.map((p, i) => `Photo ${i + 1}${p.about ? ` (${p.about})` : ''}${urls ? `: ${p.url}` : ''}. Credit: ${p.credit || 'none given'}`).join('\n')
    : 'No photos: draw photo slots as an empty .thumb, .hero or .photo-card img box with alt text saying what goes there.'

const kebab = (s: unknown) =>
  String(s ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 32)

const text = (s: unknown, most: number) => String(s ?? '').replace(/\s+/g, ' ').trim().slice(0, most)
const lines = (v: unknown, most: number, each: number) => (Array.isArray(v) ? v.map((x) => text(x, each)).filter(Boolean).slice(0, most) : [])

/** Claude's plan, checked and trimmed: the ids, links and counts the screens rely on. */
export function parsePlan(answer: string): Plan {
  const raw = JSON.parse(answer.slice(answer.indexOf('{'), answer.lastIndexOf('}') + 1)) as Record<string, unknown>
  const seen = new Set<string>()
  const units: Unit[] = (Array.isArray(raw.units) ? raw.units : [])
    .map((u: Record<string, unknown>) => {
      let id = kebab(u?.id) || 'screen'
      while (seen.has(id)) id = `${id}-x`
      seen.add(id)
      const frame: Unit['frame'] = u?.frame === 'laptop' ? 'laptop' : 'phone'
      return {
        id,
        title: text(u?.title, 60) || id,
        frame,
        steps: Math.max(1, Math.min(7, Math.round(Number(u?.steps) || 1))),
        shows: text(u?.shows, 900),
        links: Array.isArray(u?.links) ? (u.links as unknown[]).map(kebab) : [],
      }
    })
    .slice(0, 16)
  const ids = new Set(units.map((u) => u.id))
  for (const u of units) u.links = [...new Set(u.links.filter((l) => ids.has(l) && l !== u.id))].slice(0, 8)
  if (!units.some((u) => u.frame === 'phone')) throw new Error('The plan has no phone screens')
  const tabs = (Array.isArray(raw.tabs) ? raw.tabs : [])
    .map((t: Record<string, unknown>) => ({label: text(t?.label, 14), to: kebab(t?.to)}))
    .filter((t) => t.label && units.some((u) => u.id === t.to && u.frame === 'phone'))
    .slice(0, 5)
  return {
    summary: text(raw.summary, 600),
    decisions: lines(raw.decisions, 8, 240),
    world: lines(raw.world, 16, 300),
    tabs: tabs.length >= 2 ? tabs : [],
    units,
  }
}

export async function planPrototype(o: Options, raw: Answers, photos: Photo[], deadline: number): Promise<Job> {
  const facts = factsOf(o, raw)
  const ask = () =>
    askClaude({
      model: PLAN_MODEL(),
      system: [PLAN_SYSTEM],
      user: `${facts}\n\nThe journey, for this kind of app: ${journeyOf(o)}\n${DASHBOARD(o)}\n${COACHING(o)}\n\nThe photos, found from these answers:\n${photoList(photos, false)}`,
      maxTokens: 6_000,
      deadline,
    })
  // A plan that isn't JSON, or has no phone screens, gets one more try while there's time.
  let plan: Plan
  try {
    plan = parsePlan(await ask())
  } catch (e) {
    console.warn('[prototype] plan again:', e instanceof Error ? e.message : e)
    plan = parsePlan(await ask())
  }
  return {id: randomBytes(16).toString('hex'), look: {name: o.name, accent: o.accent.toUpperCase()}, facts, plan, photos}
}

// ---------- Drawing a unit ----------

/** The section ids a unit is drawn as: the id itself, or one a step. */
export const sectionIds = (u: Unit) => (u.steps > 1 ? Array.from({length: u.steps}, (_, i) => `${u.id}-${i + 1}`) : [u.id])

const KIT = `You draw one part of a mobile app's prototype at a time, as HTML on a fixed kit. The other parts are drawn at the same time by other calls from the same plan, so follow the plan, the kit and these rules exactly: that is what makes the screens one app.

THE HOUSE STYLE (fohm-scaffold's, shared with Naz and Etapa)
A quiet, native-feeling list app: a cool grey canvas, white borderless cards, hairline rows, two faces in sentence case, and one accent. The photos carry the colour; the chrome stays black, white and grey. The owner's dashboard is graphite.
- The accent marks only what to press and what is live now: the disc on the primary pill, today's ring, a .live badge. Anything chosen is ink, never the accent.
- One primary action a screen: the ink pill with its accent disc. Anything else is a .quiet button or a .link.
- Sentence case everywhere. No uppercase, no letter-spacing, no eyebrow or kicker line over a title. No emoji.
- No card inside a card. A list is rows on one .list card, never a stack of cards.
- No stat tile for a long fact: a fact longer than a number or a word is a row.
- Photos in every slot: a hero on the landing page and onboarding's opening, the goal as the hero on Home, a .thumb on every row of things (sessions, goals, library items), a photo on every hub card, an empty state with a photo and a line. Use only the photo URLs given, as <img src="URL" alt="what it shows">. Where a photo leads a card or a screen, its credit goes in a .credit line inside that card or under the hero.
- People have no photos: initials in an avatar, <span class="avatar initials">MO</span>.
- Words: the business's own, in plain English, warm and direct, using the app's words for its people. Never lorem ipsum. A fact not given (a price, a date, a count about the business) is a [placeholder] in square brackets, like [YOUR PRICE]. The plan's world gives the sample member and the dashboard's people: use it.
- No coach is shown or offered unless the facts say there is a real coach.

THE KIT: only these classes. The stylesheet is fixed; you cannot add CSS.
Phone screens (390 wide; the top 44px are left clear; long screens scroll):
- Text: .hero-title (34px display), .title (28), .heading (20), .label (15 display), .lead (18, mid grey), .small (13, faint), .mid, .num (display figures), .big-num (44).
- Layout: .pad (20px each side), .stack (12px gaps), .stack-sm, .stack-lg (24px), .row-x (a row, 12px gaps), .between, .section (28px above), .grid-2, .scroll-x (a sideways strip of 240px cards).
- A top bar: <div class="bar"><a class="back" data-go="UNIT" aria-label="Back"></a><span class="label">Title</span><span style="width:44px"></span></div>
- Cards and rows: .card; .list holding .row items, each with an optional img.thumb or .avatar, then <div class="grow"><div class="t">Title</div><div class="s">Subtitle</div></div>, then a trailing .num, .chip or <span class="chev"></span>; .note (a tip on raised grey).
- Photos: img.hero (full width, 340 tall; add .round for rounded lower corners; put class="screen bleed" on the section when the hero starts at the very top); .photo-card (an img, then <div class="in"> with .heading or .t, .s and .credit); img.thumb (56px); .avatar, .avatar.lg; .credit; .player (an img and <span class="play"></span>) for a video.
- Actions: the primary <a class="pill" data-go="UNIT"><span>Label</span><span class="disc"></span></a>; .quiet (a grey full-width button); .link; .foot (a fixed bottom area for onboarding's pill and Skip).
- Picks: .chips of .chip; .choice rows; .tiles of .tile (an img and <span class="t">Label</span>); .on marks the chosen one; wrap a group in data-pick="one" or data-pick="many" and a tap picks.
- Progress: .dots with an <i></i> a step (.on for this step); <div class="track"><span style="width:40%"></span></div>; .stat (a .big-num or .num, and a .small); .week of seven .day (<span>M</span><b>12</b>; .done, .today); .live (a small accent badge); .seg (a segmented control; .on on the chosen child); .field (<span>Label</span><div class="input">Placeholder</div>); .bubble and .bubble.me (messages).
- The tab bar: on a screen that shows the app's tabs, put exactly <nav class="tabbar" data-tab="TAB"></nav> as the section's last child, where TAB is the unit of the tab it belongs to. It is filled in for you.
Laptop screens (the owner's dashboard, 1280x800, graphite):
- <div class="dash"><nav class="side"><span class="brand"><i></i>App name</span><a class="on" data-go="UNIT">People</a>…</nav><div class="main">…</div></div>
- .d-title, .d-sub, .d-card, .d-stats of .d-stat (a .num and a .small), table rows .d-row (.head for the header row; five columns: the person, what they're on, last in, their plan, a status or action), .needs (a status that needs the owner), .d-pill (the one primary action), .d-quiet, .d-chip, .bars of <span style="height:60%"></span> (.now on this week's), .note, .avatar.initials, .s, .small.
Inline style only for layout the kit lacks: a width, height, margin, gap, grid columns, a .track's or a bar's percentage. Never a colour, font, size, weight, border, shadow or background in a style.

LINKS
Every tappable element leads somewhere: data-go="ID" on an <a>, where ID is a unit id from the plan or one of its sections' ids. A unit of several steps is drawn as that many sections: step n of unit u has the id u-n; a unit of one step has the id u. Each step leads to the next, and the last leads on as the plan says. Back leads to where the member came from. The dashboard's side links lead to its units.

OUTPUT
Only the unit's screens, each <section class="screen" id="ID" data-title="A few words">…</section>, and nothing before or after: no <html>, <head>, <style>, <script>, comments, explanations or markdown fences. Inside a screen use <div>, never another <section>. Nothing submits: fields are drawn with .field and .input.`

/** What every part of one app is drawn from: the facts, the plan and the photos (kept in Anthropic's cache for the app's other parts). */
function context(job: Job) {
  const {plan} = job
  const units = plan.units
    .map((u) => `- ${u.id} (${u.frame}, sections: ${sectionIds(u).join(', ')}): ${u.title}. ${u.shows} Leads to: ${u.links.join(', ') || 'nowhere new'}.`)
    .join('\n')
  return `THE APP\n${job.facts}\n\nTHE PLAN\n${plan.summary}\n\nDecisions:\n${plan.decisions.map((d) => `- ${d}`).join('\n')}\n\nThe world every screen shares:\n${plan.world.map((w) => `- ${w}`).join('\n')}\n\nTabs: ${plan.tabs.length ? plan.tabs.map((t) => `${t.label} (${t.to})`).join(', ') : 'none: one hub screen'}\n\nThe units:\n${units}\n\nTHE PHOTOS\n${photoList(job.photos, true)}`
}

export async function drawUnit(job: Job, unitId: string, deadline: number): Promise<Drawn> {
  const unit = job.plan.units.find((u) => u.id === unitId)
  if (!unit) throw new Error('No such unit')
  const ids = sectionIds(unit)
  const answer = await askClaude({
    model: DRAW_MODEL(),
    system: [KIT, context(job)],
    user: `Draw the unit "${unit.id}": ${unit.title}, on the ${unit.frame}, as ${ids.length === 1 ? `one section with the id ${ids[0]}` : `${ids.length} sections with the ids ${ids.join(', ')}`}.\nWhat it shows: ${unit.shows}\nIt leads to: ${unit.links.join(', ') || 'where the plan says'}.${unit.frame === 'phone' && job.plan.tabs.length ? '\nIf it is one of the tabs, or a screen reached from one that still shows them, end each section with the tab bar.' : ''}`,
    maxTokens: unit.steps > 1 ? 14_000 : 8_000,
    deadline,
  })
  return {id: unit.id, html: cleanUnit(answer, unit, job.plan)}
}

// ---------- What comes back ----------

const attr = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')

const ICONS: [RegExp, string][] = [
  [/home|today/i, 'M3 11.5 12 4l9 7.5M5.5 9.5V20h13V9.5'],
  [/coach|inbox|message|chat|ask/i, 'M4 5h16v11H9l-5 4z'],
  [/you|account|profile|me\b/i, 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21c1.5-4 4.5-6 8-6s6.5 2 8 6'],
  [/progress|stats|score|board/i, 'M5 20V11M12 20V4M19 20v-6'],
  [/library|learn|video|explore|discover|spots|goals|places|courses/i, 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z'],
  [/plan|path|program|train|session|week|play/i, 'M5 6h14M5 12h14M5 18h9'],
]

/** The tab bar, the same on every screen: the plan's tabs, this one lit. */
function tabBar(plan: Plan, on: string) {
  return `<nav class="tabbar">${plan.tabs
    .map(({label, to}) => {
      const d = ICONS.find(([re]) => re.test(label))?.[1] ?? 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z'
      return `<a class="tab${to === on ? ' on' : ''}" data-go="${to}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${d}"/></svg><span>${attr(label)}</span></a>`
    })
    .join('')}</nav>`
}

/**
 * The unit's sections and nothing else: no scripts, styles, frames, forms, handlers or script
 * links (it is shown sandboxed too), each section with its id, unit and frame, and the tab bar
 * filled in.
 */
export function cleanUnit(answer: string, unit: Unit, plan: Plan) {
  const start = answer.indexOf('<section')
  const end = answer.lastIndexOf('</section>')
  if (start < 0 || end < start) throw new Error('No screens in the answer')
  let h = answer
    .slice(start, end + '</section>'.length)
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<(script|style|iframe|object|embed|template|form|textarea|select|noscript)\b[\s\S]*?<\/\1\s*>/gi, '')
    .replace(/<\/?(script|style|iframe|object|embed|template|form|link|meta|base|input|textarea|select|noscript)\b[^>]*>/gi, '')
    .replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/\s(href|src|xlink:href|action|formaction|srcset)\s*=\s*("|')\s*(javascript|data|vbscript):[^"']*\2/gi, '')
    .replace(/<nav\b[^>]*class="[^"]*\btabbar\b[^"]*"[^>]*?(?:\/>|>[\s\S]*?<\/nav>)/gi, (m) => {
      const tab = /data-tab="([^"]*)"/.exec(m)?.[1] ?? ''
      return plan.tabs.length ? tabBar(plan, tab || unit.id) : ''
    })
  const ids = sectionIds(unit)
  let n = 0
  h = h.replace(/<section\b([^>]*)>/gi, (whole, attrs: string) => {
    if (!/class\s*=\s*"[^"]*\bscreen\b/i.test(attrs)) return whole
    const id = n < ids.length ? ids[n] : `${unit.id}-${n + 1}`
    n++
    const rest = attrs.replace(/\s(id|data-unit|data-frame)\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    const title = /\sdata-title\s*=/.test(rest) ? '' : ` data-title="${attr(ids.length > 1 ? `${unit.title} ${n}` : unit.title)}"`
    return `<section id="${id}" data-unit="${unit.id}" data-frame="${unit.frame}"${title}${rest}>`
  })
  if (!n) throw new Error('No screens in the answer')
  return h
}

// ---------- Signing ----------

const secret = () => process.env.PROTOTYPE_SECRET || process.env.ANTHROPIC_API_KEY || ''

const digest = (job: Job) => createHash('sha256').update(JSON.stringify([job.id, job.look, job.facts, job.plan, job.photos])).digest('hex')

export const signJob = (job: Job) => createHmac('sha256', secret()).update(digest(job)).digest('hex')

export function verifyJob(job: Job, token: string) {
  if (!secret() || !/^[a-f0-9]{64}$/.test(token)) return false
  return timingSafeEqual(Buffer.from(signJob(job), 'hex'), Buffer.from(token, 'hex'))
}

/** Photos as a visitor's browser found them: https links and plain credits, a dozen at most. */
export function cleanPhotos(v: unknown): Photo[] {
  if (!Array.isArray(v)) return []
  return v
    .map((p: Record<string, unknown>) => ({
      url: String(p?.url ?? '').trim(),
      credit: text(p?.credit, 140).replace(/[<>"]/g, ''),
      about: text(p?.about, 60).replace(/[<>"]/g, ''),
    }))
    .filter((p) => /^https:\/\/[^\s"'<>]{4,600}$/.test(p.url))
    .filter((p, i, all) => all.findIndex((x) => x.url === p.url) === i)
    .slice(0, 12)
    .map((p) => (p.about ? p : {url: p.url, credit: p.credit}))
}
