/**
 * Claude designs the visitor's app: first a plan of the whole journey (the screens, what each
 * shows, what they share), then each part drawn on the house kit, several at once. The plan comes
 * back to the browser signed, so the screen route draws only what a plan this server made asks
 * for, and never takes the visitor's words straight into a prompt. Server only.
 */
import {createHash, createHmac, randomBytes, timingSafeEqual} from 'node:crypto'
import {TEMPLATES, chargeOf, hasFeatures, platformOf, type Answers, type Options} from './options'
import {CANVASES, CORNERS, HOMES, HOUSE, SHAPES, TYPES, TYPE_FACES, type Drawn, type Job, type Photo, type Plan, type Style, type Unit} from './prototype-doc'
import {DRAW_MODEL, PLAN_MODEL, askClaude} from './claude'
import {referencesIn} from './references'
import {MARK_SLUGS} from './brand-marks'
import {schemeById} from './schemes'
import {plain} from './next-question'
import {readSubject} from './prototypes'
import {subjectKey, subjectSaid} from './subject'

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
    line('Where people use it', platformOf(raw).draws),
    line('What people should be doing in the app', raw.doing),
    line('The landing page headline', o.tagline),
    ...(hasFeatures(raw)
      ? [
          line('What this app must do that’s specific to it (draw each)', raw.features),
          line('How each of those works, step by step, in the owner’s words', raw.featureHow),
          line('What each of those looks like', raw.featureLooks),
          line('What each of those reads from the world', raw.featureData),
        ]
      : []),
    line('What people are here for (onboarding’s tiles)', raw.interests),
    line('What people work towards: places, events or trips', raw.goals),
    line('The apps and devices people already track with (the app connects to them)', raw.connects),
    line('What the business already publishes (the library points at it)', raw.content),
    line('Apps the owner likes the look and feel of', o.inspiration),
    ...referencesIn(o.inspiration).map((r) => line(`What ${r.name} looks like, from its screens on Mobbin`, r.takes)),
    line('The people who use it are called', `${o.memberWord}s; the person who runs it is the ${o.ownerWord}`),
    line('The accent colour', o.accent.toUpperCase()),
    line('The colour scheme they chose', ((s) => s && `${s.name}: a ${s.canvas} canvas (${s.palette.bg}) with the accent, a deep shade (${s.palette.deep}) and a tint (${s.palette.tint}), ${s.feel.toLowerCase()}; the canvas and shades are decided`)(schemeById(raw.scheme))),
    line('How it charges', chargeOf(raw)?.draws),
    line('The audience today', raw.audience),
    line('Success in a year', raw.ambition),
  ]
    .filter(Boolean)
    .join('\n')
}

/** What the prototype covers for each kind of app: the parts the owner needs to see. Their order, grouping and layout are the plan's. */
const JOURNEY: Record<string, string> = {
  coachYes:
    'the landing page; signing in; onboarding (for example Naz’s: an opening that asks the app’s key value as a question over a photo, straight questions one to a screen with the dots and Skip, what they’re here for as photo tiles, why it works, a first number, the week they can give, and the end, which lands on their path); Home on the first day; Home three weeks in (the goal as the hero, the next thing to do, the week); the path (the levels and the skills at each, where they are); a session from start to done; a check-in (what they worked on and how it felt); a goal they train for (its photo, what it asks, the courses that prepare for it, saved); sending the coach a video or a question, and the coach’s reply; Pro (what it adds, the price as a placeholder); Account (their photo, their goal, their plan).',
  coachNo:
    'the landing page; signing in; onboarding (for example Naz’s: an opening that asks the app’s key value as a question over a photo, straight questions one to a screen with the dots and Skip, what they’re here for as photo tiles, why it works, a first number, the week they can give, and the end, which starts their program from the answers); Home on the first day; Home three weeks in (the goal as the hero, the next session, the week); their program (its weeks and sessions, where they are); a session from start to done; a check-in (what they did and how it felt); a goal they train for (its photo, what it asks, the courses that prepare for it, saved); the library; Pro (what it adds, the price as a placeholder); Account (their photo, their goal, their program).',
  app: 'the landing page; signing in; onboarding (a few straight questions one to a screen with the dots and Skip, and what they’re here for as photo tiles); Home; the app’s one job from start to done, in two or three units; a list or catalogue of what it holds, with photos; one item in full; Pro (the price as a placeholder); Account.',
  game: 'the landing page; how to play, in one or two screens; the first round in play; the score at the end of a round; Home, the way back in (where you are, the next challenge, the places to play, with photos); a leaderboard or progress; Account.',
}

/**
 * The owner's own features (a route planner, a trip planner), each drawn as they described it:
 * where it's opened from, its steps as they walked them through, the screen they asked for and
 * what it reads (tides, the weather) shown with its source. They're the part of the prototype
 * nothing else draws, so each gets its own unit or units, never a line on another screen.
 */
const featuresOf = (o: Options) =>
  hasFeatures(o)
    ? `; and the app's own features, as the owner described them (${o.features.trim()}): each its own unit or units, where it is opened from, its steps from start to what they end up with as the owner walked them through, the screen it is drawn on as the owner asked for it, what it reads from the world shown with its source, and a saved one coming back on Home${o.routes === 'yes' ? '; a route drawn on a map, its line following the water, paths or roads as the activity does, with its distance and time' : ''}.`
    : ''

/** The journey for its kind; a free app has no Pro screen, and one sold once has a purchase screen instead. */
const journeyOf = (o: Options) => {
  let journey = o.kind === 'game' ? JOURNEY.game : o.kind === 'app' ? JOURNEY.app : o.coach === 'yes' ? JOURNEY.coachYes : JOURNEY.coachNo
  if (o.charge === 'free') journey = journey.replace(/;?\s*Pro \([^)]*\)/, '')
  if (o.charge === 'one-off') journey = journey.replace(/Pro \([^)]*\)/, 'buying a program or a pass (what is free, what it costs as a [placeholder], bought once and kept)')
  return journey.replace(/\.$/, '') + (featuresOf(o) || '.')
}

// ---------- The plan ----------

const PLAN_SYSTEM = `You are a senior product designer planning a high-fidelity, clickable prototype of a new app for its owner, before any of it is built. The owner taps through it end to end and decides from it, so it must be their app: their business, their words, their photos, the journey their members really take, and a look of its own, within the house style's family shared with Naz and Etapa (a quiet, native-feeling app: a canvas, borderless cards, hairline rows, one accent; the owner's dashboard in graphite). No two apps should look or flow alike: the look and the screens' layouts are yours to choose for this one.

You plan the units the prototype is drawn in. Each unit is drawn by another designer who sees only your plan, the facts and the photos, several at the same time, so the plan carries everything the screens share.

Reply with JSON only, in this shape:
{
  "summary": "Two or three sentences: what the app is and what this prototype shows.",
  "decisions": ["The calls you made that the owner would otherwise be asked, one a line: the navigation (a tab bar and its tabs, or one hub), what the accent marks, the voice of the words."],
  "world": ["What every screen shares, one fact a line, concrete and in the business's words: the member we follow (a first name), their goal and why, where they are in it (week 3 of 8, sessions done), the path or program and its parts, the things onboarding offers, the library's items, the five people on the owner's dashboard (first name and last initial, what each is on, two needing the owner), any price as a [placeholder]."],
  "look": {"from": ["What you took from each app the owner likes, one line each: Runna: dark, data-led home with the week's plan first."], "canvas": "light|dark", "corners": "round|soft|square", "type": "grotesk|serif|clean|rounded", "home": "photo|list", "icon": {"shape": "monogram|ring|arch|peak|bars|leaf", "letters": "for a monogram"}},
  "tabs": [{"label": "Home", "to": "home"}],
  "units": [{"id": "landing", "title": "Landing page", "frame": "web", "steps": 1, "shows": "What it shows top to bottom, the gist of its words, which photo by number, and what each tap leads to.", "layout": "How it is arranged: what leads, what follows, and which patterns (a full-screen photo with the words over it, a hero with cards under it, a sideways strip, a grid of tiles, a big number first, a list).", "links": ["sign-in"]}]
}

The look:
- canvas: ${CANVASES.join(' or ')}. corners: ${CORNERS.join(', ')} (round is soft and generous, square is crisp and editorial). home: ${HOMES.join(' or ')} (Home leads with a photo of the goal, or with the list of what's next).
- type, one of: ${TYPES.map((t) => `${t} (${TYPE_FACES[t].about})`).join('; ')}.
- icon: the app's own icon, its mark in the accent's square. shape: ${SHAPES.join(', ')}; a monogram gives 1 or 2 letters from the app's name. Choose what suits the name and the business, as a designer would.
- Connections: design in the real services and devices this activity's members already record with: the ones the owner named, or, when they named none, the ones that exist for it (rowing: Concept2's Logbook and PM5, Garmin, Apple Health, Strava; running: Garmin, Strava, Apple Health; cycling: Garmin, Wahoo, Strava, Zwift). Name them: a Connect step in onboarding with each by name, what was done coming in with its real numbers (a 2k on the erg with its split, a run with its pace), the source shown on each, and a Connected list in Account. Leave them out only where nothing like that exists for the activity. Say which you chose in "decisions".
- The apps the owner likes are the strongest guide: recall how each looks and feels (its canvas, type, corners, density, how its home and its sessions are laid out, its signature screens) and carry that into the look and the units' layouts, within the house style's family. Say what you took from each in "from". With none named, choose from the business, its audience and the photos.

Rules:
- The owner's own features, when the journey names any, are what they will judge hardest: draw each as they described it, its own unit with 2 or 3 steps where it has steps, linked from where it's opened, never left out to fit the count.
- 10 to 15 units. First the landing page ("frame": "web"); then the member's journey on the phone, in the order they meet it ("frame": "phone"); then 2 to 4 units of the owner's dashboard ("frame": "laptop").
- The first unit is always the landing page, id "landing", "frame": "web": the business's website that sells the app, seen on a laptop at full width, not a phone screen: a page that sells, not a brochure. Top to bottom: the strongest photo full-bleed with one promise over it as the headline, a line under it, Get started, and the app itself in a phone beside it showing Home; how it works in three steps, each with its photo; one band in the accent's deep shade with the app's key value as one big line; a photo beside what people get; what people work towards as a sideways strip of big photos; the price as a [placeholder]; a last call to start over a second photo; a footer. The headline is one promise about where people get to (\"Paddle your first multi-day trip by summer\"), never a list of features. The owner judges it on its own, so it is never skipped or folded into another unit.
- Onboarding is one unit of 4 to 7 steps. A session from start to done may be 2 or 3 steps. Every other unit is 1 step.
- ids are short kebab-case words, unique. links name unit ids only. Every unit is reachable from the landing page, and every phone unit leads somewhere.
- tabs: 3 to 5, each to a phone unit that shows the tab bar; or [] for an app with one hub screen.
- The journey given for this kind of app is what to cover, not an order or a set of screens: group, order and name the units as this app needs, and lay each out for what it shows. Vary the layouts across the app: not every screen is a bar and a list.
- Give every photo slot a photo by its number: the strongest for the landing page and the goal, and each where it fits what it shows. Pick by each photo's "what it shows": a photo goes only where it shows this app's own activity, kit or place; a slot no photo fits gets none (it is drawn as a tinted panel), never a photo of something else.
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
    ? photos.map((p, i) => `Photo ${i + 1}${p.about ? ` (searched for, and what it shows: ${p.about})` : ''}${urls ? `: ${p.url}` : ''}. Credit: ${p.credit || 'none given'}`).join('\n')
    : 'No photos: draw photo slots as an empty .thumb, .hero or .photo-card img box with alt text saying what goes there.'

const kebab = (s: unknown) =>
  String(s ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 32)

const text = (s: unknown, most: number) => String(s ?? '').replace(/\s+/g, ' ').trim().slice(0, most)
const lines = (v: unknown, most: number, each: number) => (Array.isArray(v) ? v.map((x) => text(x, each)).filter(Boolean).slice(0, most) : [])

/** The landing page, when a plan left it out: drawn like any other unit, from the plan's facts and photos. */
const landingUnit = (next?: string): Unit => ({
  id: 'landing',
  title: 'Landing page',
  frame: 'web',
  steps: 1,
  shows: 'The landing page that sells the app: the strongest photo full-bleed with the promise over it and the app in a phone beside it, how it works in three steps with photos, the key value as one big line on the deep shade, what people get beside a photo, a strip of big photos of what they work towards, the price as a [placeholder], and a last call over a second photo.',
  links: next ? [next] : [],
})

const oneOf = <T extends string>(all: readonly T[], v: unknown, fallback: T): T => (all.includes(v as T) ? (v as T) : fallback)

/** The look Claude chose, each choice one the kit can draw; anything else is the house's. */
export function parseStyle(v: unknown): Style {
  const l = (v && typeof v === 'object' ? v : {}) as Record<string, unknown>
  const icon = (l.icon && typeof l.icon === 'object' ? l.icon : {}) as Record<string, unknown>
  const letters = String(icon.letters ?? '').replace(/[^A-Za-z0-9&]/g, '').slice(0, 2)
  const shape = oneOf(SHAPES, icon.shape, HOUSE.icon.shape)
  return {
    canvas: oneOf(CANVASES, l.canvas, HOUSE.canvas),
    corners: oneOf(CORNERS, l.corners, HOUSE.corners),
    type: oneOf(TYPES, l.type, HOUSE.type),
    home: oneOf(HOMES, l.home, HOUSE.home),
    icon: shape === 'monogram' && !letters ? HOUSE.icon : {shape, letters: shape === 'monogram' ? letters : ''},
    from: lines(l.from, 6, 200),
  }
}

/** Claude's plan, checked and trimmed: the ids, links and counts the screens rely on. */
export function parsePlan(answer: string): Plan {
  const raw = JSON.parse(answer.slice(answer.indexOf('{'), answer.lastIndexOf('}') + 1)) as Record<string, unknown>
  const seen = new Set<string>()
  const units: Unit[] = (Array.isArray(raw.units) ? raw.units : [])
    .map((u: Record<string, unknown>) => {
      let id = kebab(u?.id) || 'screen'
      while (seen.has(id)) id = `${id}-x`
      seen.add(id)
      const frame: Unit['frame'] = u?.frame === 'laptop' ? 'laptop' : u?.frame === 'web' ? 'web' : 'phone'
      return {
        id,
        title: text(u?.title, 60) || id,
        frame,
        steps: Math.max(1, Math.min(7, Math.round(Number(u?.steps) || 1))),
        shows: text(u?.shows, 900),
        layout: text(u?.layout, 400) || undefined,
        links: Array.isArray(u?.links) ? (u.links as unknown[]).map(kebab) : [],
      }
    })
    .slice(0, 16)
  // The landing page is always first, and always there: the owner is shown it on its own (components/showcase.tsx).
  const landing = units.findIndex((u) => u.id === 'landing')
  if (landing > 0) units.unshift(...units.splice(landing, 1))
  if (landing < 0) units.unshift(landingUnit(units.find((u) => u.frame === 'phone')?.id))
  // The landing page is a website, whatever the plan said: the owner sees it in a browser, not as an app screen.
  units[0].frame = 'web'
  units[0].steps = 1
  const ids = new Set(units.map((u) => u.id))
  for (const u of units) u.links = [...new Set(u.links.filter((l) => ids.has(l) && l !== u.id))].slice(0, 8)
  if (!units.some((u) => u.frame === 'phone')) throw new Error('The plan has no phone screens')
  const tabs = (Array.isArray(raw.tabs) ? raw.tabs : [])
    .map((t: Record<string, unknown>) => ({label: text(t?.label, 14), to: kebab(t?.to)}))
    .filter((t) => t.label && units.some((u) => u.id === t.to && u.frame === 'phone'))
    .slice(0, 5)
  return {
    style: parseStyle(raw.look),
    summary: text(raw.summary, 600),
    decisions: lines(raw.decisions, 8, 240),
    world: lines(raw.world, 16, 300),
    tabs: tabs.length >= 2 ? tabs : [],
    units,
  }
}

/** The facts, with the subject researched while they answered (subject.ts) when it was found: the prototype's sessions, goals and numbers are the subject's own. */
async function factsWithSubject(o: Options, raw: Answers) {
  const facts = factsOf(o, raw)
  const subject = raw.idea?.trim() ? await readSubject(subjectKey(plain(raw.idea, 600))).catch(() => null) : null
  return subject ? `${facts}\n\nResearch on the subject the app is about, for its real sessions, goals, numbers and words (the owner's answers above win where they differ):\n${subjectSaid(subject)}` : facts
}

export async function planPrototype(o: Options, raw: Answers, photos: Photo[], deadline: number): Promise<Job> {
  const facts = await factsWithSubject(o, raw)
  const ask = () =>
    askClaude({
      model: PLAN_MODEL(),
      system: [PLAN_SYSTEM],
      user: `${facts}\n\nWhat the prototype covers, for this kind of app (yours to group, order and lay out): ${journeyOf(o)}\n${DASHBOARD(o)}\n${COACHING(o)}\n\nThe photos, found from these answers:\n${photoList(photos, false)}`,
      // Room for Claude's thinking as well as the plan: thinking counts against it, and 6,000 cut plans off mid-JSON.
      maxTokens: 32_000,
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
  // A scheme they picked decides the canvas, whatever the plan chose.
  const scheme = schemeById(raw.scheme)
  if (scheme && plan.style) plan.style = {...plan.style, canvas: scheme.canvas, palette: scheme.palette}
  return {id: randomBytes(16).toString('hex'), look: {name: o.name, accent: o.accent.toUpperCase(), style: plan.style}, facts, plan, photos}
}

// ---------- Drawing a unit ----------

/** The section ids a unit is drawn as: the id itself, or one a step. */
export const sectionIds = (u: Unit) => (u.steps > 1 ? Array.from({length: u.steps}, (_, i) => `${u.id}-${i + 1}`) : [u.id])

const KIT = `You draw one part of a mobile app's prototype at a time, as HTML on a fixed kit. The other parts are drawn at the same time by other calls from the same plan, so follow the plan, the kit and these rules exactly: that is what makes the screens one app.

THE HOUSE STYLE (fohm-scaffold's family, shared with Naz and Etapa)
A quiet, native-feeling app: a canvas, borderless cards one step off it, hairline rows, two faces in sentence case, and one accent. The photos carry the colour; the chrome stays neutral. Each app has a look of its own within this (light or dark, its corners, its faces, its icon): it is given below and already in the stylesheet, so draw with the classes and it follows. The owner's dashboard is graphite.
- Lay each screen out as the plan's layout for it says. Vary the layouts across the app, as the apps the owner likes do: full-screen photos with the words over them, a hero with cards under it, sideways strips, grids of tiles, a big number first, lists. Not every screen is a bar and a list.
- The accent marks only what to press and what is live now: the disc on the primary pill, today's ring, a .live badge. Anything chosen is ink, never the accent.
- One primary action a screen: the ink pill with its accent disc. Anything else is a .quiet button or a .link.
- Sentence case everywhere. No uppercase, no letter-spacing, no eyebrow or kicker line over a title. No emoji.
- No card inside a card. A list is rows on one .list card, never a stack of cards.
- No stat tile for a long fact: a fact longer than a number or a word is a row.
- Photos in every slot: a hero on the landing page and onboarding's opening, the goal on Home (as its hero when the look's Home leads with a photo), a .thumb on every row of things (sessions, goals, library items), a photo on every hub card, an empty state with a photo and a line. Use only the photo URLs given, as <img src="URL" alt="what it shows">. Where a photo leads a card or a screen, its credit goes in a .credit line inside that card or under the hero.
- People have no photos: initials in an avatar, <span class="avatar initials">MO</span>.
- A photo shows what its slot is about: the activity itself, done the way the facts describe it (the same sport, boat, kit and setting). Read each photo's "about" and pick by it; never a photo of something else that looks a bit like it. Where no photo fits a slot, use a .tint panel or a .deep card instead: no photo is better than a wrong one.
- Other companies are never photos: a service, device or way to sign in is drawn with its mark (below), never a picture of the thing.
- Signing in is always the real buttons with their marks, Apple first on a phone: <a class="sso apple" data-go="UNIT"><i class="mark mark-apple"></i>Continue with Apple</a>, <a class="sso" data-go="UNIT"><i class="mark mark-google"></i>Continue with Google</a>, and <a class="sso" data-go="UNIT"><i class="mark mark-email"></i>Continue with email</a>.
- A connection to another app or device (Strava, Garmin, Apple Health) is a .row led by its mark: <i class="mark mark-strava"></i>. Marks there are: ${MARK_SLUGS.join(', ')}. A service without one gets a lettered tile, <i class="mark" data-l="C2"></i>, with its initials.
- The app's icon is <span class="app-icon"></span> (.sm 32px, .lg 76px), drawn for you; never draw a logo of your own, and never a photo or letter in its place. It goes, with the app's name beside it, at the top of the landing page (in its .site-nav), on onboarding's opening and on signing in (.lg, above the title); the dashboard's .brand shows it too.
- A screen that is one photo and a line or two (onboarding's opening, a welcome, a goal reached) is a .cover, never a hero over an empty screen.
- Words: the business's own, in plain English, warm and direct, using the app's words for its people. Never lorem ipsum. A fact not given (a price, a date, a count about the business) is a [placeholder] in square brackets, like [YOUR PRICE]. The plan's world gives the sample member and the dashboard's people: use it.
- No coach is shown or offered unless the facts say there is a real coach.

THE KIT: only these classes. The stylesheet is fixed; you cannot add CSS.
Phone screens (390 wide; the top 44px are left clear; long screens scroll):
- Text: .hero-title (34px display), .title (28), .heading (20), .label (15 display), .lead (18, mid grey), .small (13, faint), .mid, .num (display figures), .big-num (44).
- Layout: .pad (20px each side), .stack (12px gaps), .stack-sm, .stack-lg (24px), .row-x (a row, 12px gaps), .between, .center, .section (28px above), .grid-2, .grid-3, .scroll-x (a sideways strip of 240px cards; .sm 150px, .lg 300px).
- A top bar: <div class="bar"><a class="back" data-go="UNIT" aria-label="Back"></a><span class="label">Title</span><span style="width:44px"></span></div>
- The colour's shades: .deep (a card or band in the accent's deep shade, white words: a goal card, a hero block, the landing page's last call) and .tint (a soft panel in a tint of it). Use each a few times across the app where it lifts a screen, never on every card.
- Cards and rows: .card; .list holding .row items, each with an optional img.thumb or .avatar, then <div class="grow"><div class="t">Title</div><div class="s">Subtitle</div></div>, then a trailing .num, .chip or <span class="chev"></span>; .note (a tip on raised grey).
- Photos: .photo-card.tall (a 300px photo); img.hero (full width, 340 tall, square edges: a heading photo, never rounded; put class="screen bleed" on the section when the hero starts at the very top); .hero-top (a hero at the very top with the app's bar laid over it: <div class="hero-top"><img class="hero" src="URL" alt="…"><div class="over"><span class="row-x"><span class="app-icon sm"></span><span class="label">App name</span></span><a class="link" data-go="UNIT">Sign in</a></div></div>, in a section with class="screen bleed"); a full-screen photo with the words over it: class="screen cover" on the section, the <img src="URL" alt="…"> as its first child, then <div class="over"> for the top (the app's icon and name, or the dots and Skip), then the words in a .pad .stack (a .hero-title, a .lead), the pill in a .pad, and the .credit in a .pad; nothing else. .photo-card (an img, then <div class="in"> with .heading or .t, .s and .credit); img.thumb (56px); .avatar, .avatar.lg; .credit; .player (an img and <span class="play"></span>) for a video.
- Actions: the primary <a class="pill" data-go="UNIT"><span>Label</span><span class="disc"></span></a>; .quiet (a grey full-width button); .link; .foot (a fixed bottom area for onboarding's pill and Skip).
- Marks of other services: <i class="mark mark-SLUG"></i> (a 40px tile; .sm 28, .lg 56), or <i class="mark" data-l="AB"></i>; .sso (a full-width "Continue with" button: .apple for Apple's black one).
- Picks: .chips of .chip; .choice rows (its tick is drawn for you); .tiles of .tile (an img and <span class="t">Label</span>: square photos two to a row with the label over the photo and a tick in the corner, all drawn for you; four or six tiles, never one to a row, never their columns set in a style); .on marks the chosen one; wrap a group in data-pick="one" or data-pick="many" and a tap picks.
- Progress: .dots with an <i></i> a step (.on for this step); <div class="track"><span style="width:40%"></span></div>; .stat (a .big-num or .num, and a .small); .week of seven .day (<span>M</span><b>12</b>; .done, .today); .live (a small accent badge); .seg (a segmented control; .on on the chosen child); .field (<span>Label</span><div class="input">Placeholder</div>); .bubble and .bubble.me (messages).
- The tab bar: on a screen that shows the app's tabs, put exactly <nav class="tabbar" data-tab="TAB"></nav> as the section's last child, where TAB is the unit of the tab it belongs to. It is filled in for you.
The website (frame web: only the landing page, 1280 wide, scrolls; in the app's own look, never graphite and never laid out as a phone screen). It sells: one promise, the photos at full size, the app itself shown, and bands that change pace. Never a boxed photo beside the words, and never a band of three plain cards of words.
- The top is a full-bleed photo with everything over it: <header class="site-cover"><img src="URL" alt="…"><div class="site"><nav class="site-nav">(the app's icon and name in a .row-x; then a .row-x with two or three .link and Sign in as a .link, and a small pill: <a class="pill" data-go="UNIT"><span>Get started</span><span class="disc"></span></a>)</nav><div class="site-hold"><div class="site-words">(a .hero-title of four to eight words: one promise about where people get to; a .lead of one sentence; the pill and a .link beside it in a .row-x)</div><div class="site-phone">(the app's Home, drawn small with the phone kit: a .bar or a .hero, a .photo-card or a .card, a short .list; no tab bar)</div></div></div><span class="credit">Photo by …</span></header>
- Then bands, each <div class="site-band"><div class="site">…</div></div> (add .tint to one band for a change of ground), each led by <div class="site-head"><h2 class="title">Title</h2><p class="lead">A line</p></div>:
  - How it works: .site-steps of three .site-step, each an <img>, a .big-num (1, 2, 3), a .heading and a .mid line.
  - A split: .site-split (add .flip to swap sides): a tall <img> (or a .site-phone showing another screen) and a .stack-lg of the .title, a .lead, a .list of what people get, and a pill.
  - A strip: put <div class="site-strip"> straight in the band after the .site with the .site-head, holding four or five .photo-card (an img, then .in with a .heading, a .s and a .credit).
  - The price: .site-price of two .card (.deep on the one to pick), each a .heading, a .big-num [placeholder], a .list of what it includes and a pill.
- The statement: <div class="site-statement deep"><div class="site"><p class="site-big">The key value in one line</p><p class="lead">A line under it</p></div></div>.
- The last call: <header class="site-cover end"> with a second photo, the .site-words holding a .hero-title, a .lead and the pill; then <div class="site"><footer class="site-foot">.
- Use the photos at full size: every band but the statement and the price has a photo or a phone. Inside them use the phone kit's classes too (.card, .list and .row, .chip, .app-icon, .photo-card). The pill is a button of its own width here.
Laptop screens (the owner's dashboard, 1280x800, graphite):
- <div class="dash"><nav class="side"><span class="brand"><i></i>App name</span><a class="on" data-go="UNIT">People</a>…</nav><div class="main">…</div></div>
- .d-title, .d-sub, .d-card, .d-stats of .d-stat (a .num and a .small), table rows .d-row (.head for the header row; five columns: the person, what they're on, last in, their plan, a status or action), .needs (a status that needs the owner), .d-pill (the one primary action), .d-quiet, .d-chip, .bars of <span style="height:60%"></span> (.now on this week's), .note, .avatar.initials, .s, .small.
Inline style only for layout the kit lacks: a width, height, margin, gap, grid columns, a .track's or a bar's percentage. Never a colour, font, size, weight, border, shadow or background in a style.

LINKS
Every tappable element leads somewhere: data-go="ID" on an <a>, where ID is a unit id from the plan or one of its sections' ids. A unit of several steps is drawn as that many sections: step n of unit u has the id u-n; a unit of one step has the id u. Each step leads to the next, and the last leads on as the plan says. Back leads to where the member came from. The dashboard's side links lead to its units.

OUTPUT
Only the unit's screens, each <section class="screen" id="ID" data-title="A few words">…</section>, and nothing before or after: no <html>, <head>, <style>, <script>, comments, explanations or markdown fences. Inside a screen use <div>, never another <section>. Nothing submits: fields are drawn with .field and .input.`

/** The look, for the screens' designers: what's in the stylesheet already, and what it was taken from. */
function lookOf(job: Job) {
  const st = job.look.style ?? HOUSE
  return `THE LOOK (in the stylesheet already)\n- ${st.canvas === 'dark' ? 'A dark canvas: the cards a step lighter, the words light' : 'A light canvas: white cards on grey'}; ${st.corners} corners; ${TYPE_FACES[st.type].about}.\n- Home leads with ${st.home === 'photo' ? 'a photo of the goal' : 'the list of what is next, the photos smaller'}.\n${st.palette ? '- The owner picked a colour scheme, not one colour, so every screen shows the palette: on most screens a .deep band or card (a goal, a hero block, a summary) and a .tint panel, as well as the accent for what to press. The chips and fields are in the tint already.\n' : ''}${st.from.map((f) => `- From the apps the owner likes: ${f}`).join('\n')}`.trim()
}

/** What every part of one app is drawn from: the facts, the plan and the photos (kept in Anthropic's cache for the app's other parts). */
function context(job: Job) {
  const {plan} = job
  const units = plan.units
    .map((u) => `- ${u.id} (${u.frame}, sections: ${sectionIds(u).join(', ')}): ${u.title}. ${u.shows}${u.layout ? ` Layout: ${u.layout}` : ''} Leads to: ${u.links.join(', ') || 'nowhere new'}.`)
    .join('\n')
  return `THE APP\n${job.facts}\n\n${lookOf(job)}\n\nTHE PLAN\n${plan.summary}\n\nDecisions:\n${plan.decisions.map((d) => `- ${d}`).join('\n')}\n\nThe world every screen shares:\n${plan.world.map((w) => `- ${w}`).join('\n')}\n\nTabs: ${plan.tabs.length ? plan.tabs.map((t) => `${t.label} (${t.to})`).join(', ') : 'none: one hub screen'}\n\nThe units:\n${units}\n\nTHE PHOTOS\n${photoList(job.photos, true)}`
}

export async function drawUnit(job: Job, unitId: string, deadline: number): Promise<Drawn> {
  const unit = job.plan.units.find((u) => u.id === unitId)
  if (!unit) throw new Error('No such unit')
  const ids = sectionIds(unit)
  const answer = await askClaude({
    model: DRAW_MODEL(),
    system: [KIT, context(job)],
    user: `Draw the unit "${unit.id}": ${unit.title}, ${unit.frame === 'web' ? 'as the website on a laptop (frame web)' : `on the ${unit.frame}`}, as ${ids.length === 1 ? `one section with the id ${ids[0]}` : `${ids.length} sections with the ids ${ids.join(', ')}`}.\nWhat it shows: ${unit.shows}\nIt leads to: ${unit.links.join(', ') || 'where the plan says'}.${unit.frame === 'phone' && job.plan.tabs.length ? '\nIf it is one of the tabs, or a screen reached from one that still shows them, end each section with the tab bar.' : ''}`,
    // Thinking counts against this too: room for it and the screens' HTML.
    maxTokens: 32_000,
    deadline,
  })
  const draft = cleanUnit(answer, unit, job.plan)
  return {id: unit.id, html: await reviewUnit(job, unit, draft, deadline)}
}

// ---------- Reviewing a unit ----------

/** Time a review needs to be worth starting: less than this left, and the draft is shown as drawn. */
const REVIEW_NEEDS_MS = 75_000

/**
 * The design review every unit gets before anyone sees it (Robert, Nov 2026: "an impeccable design
 * review over every app before it gets produced in the prototype"): impeccable's critique, by a
 * design director who didn't draw it, on the kit and the plan the drawing had, fixing what it finds.
 */
const REVIEW = `You are the design director who reviews each part of the prototype before the owner sees it, as Impeccable's critique and polish passes do. Another designer drew it on the kit above; you sign it off. Judge it as an award-winning studio would, then return it fixed.

Look at every screen for:
- Specificity: is it this app, for these people, in the owner's words, or could any app use it unchanged? Generic copy ("Track your progress", "Achieve your goals") becomes the business's own.
- Hierarchy: one thing leads each screen (a title, a photo or a number), then what follows, then the one primary action. Nothing competes with the pill.
- Composition and rhythm: tight groups, generous space between them (.section, .stack-lg), more space above a heading than below it. No screen is a bar and a list when its plan asked for more; no screen is empty below a thin top, or crammed.
- The house style and the kit: the classes only, inline style only for layout, no colour, border, shadow, font or background in a style. No card in a card, no stack of cards for a list, no eyebrow over a title, sentence case, no emoji. The accent only on what to press and what is live; anything chosen is ink.
- Picks: .tiles are four or six square photo tiles two to a row (never one to a row, never their columns or heights set in a style), each a photo that shows its label; .choice rows for words without photos; .chips for short options. A pick screen has its title, a line, the picks, and the pill in .foot.
- Photos: each one shows what its slot is about (read the photos' "about"); a wrong photo is replaced by the right one or by a .tint or .deep panel; every photo that leads has its credit; people are initials, never photos.
- Cognitive load: no more than four choices competing at a decision point unless it is a list to pick from; one idea a screen in onboarding.
- Copy: plain, warm and direct, short; buttons name what they do; facts not given are [placeholders].
- Links: every tap leads to a real id, and steps lead to the next.

Then fix everything you found, in one pass: rewrite what needs it, keep what works, keep the plan's content, ids, links and the tab bar line as they are. Answer in the same OUTPUT format as the drawing: first at most eight short lines of what you changed, as plain text with no angle brackets, then the unit's sections and nothing after them.`

async function reviewUnit(job: Job, unit: Unit, draft: string, deadline: number) {
  if (deadline - Date.now() < REVIEW_NEEDS_MS) return draft
  try {
    const answer = await askClaude({
      model: DRAW_MODEL(),
      system: [KIT, context(job), REVIEW],
      user: `Review the unit "${unit.id}": ${unit.title}, on the ${unit.frame}. Its plan: ${unit.shows}${unit.layout ? ` Layout: ${unit.layout}` : ''} It leads to: ${unit.links.join(', ') || 'where the plan says'}.\n\nAs drawn:\n${draft}`,
      maxTokens: 32_000,
      deadline,
    })
    const notes = answer.slice(0, Math.max(0, answer.indexOf('<section'))).trim()
    if (notes) console.info('[prototype] reviewed', unit.id, notes.replace(/\s+/g, ' ').slice(0, 400))
    return cleanUnit(answer, unit, job.plan)
  } catch (e) {
    // A review that fails never costs the owner the screen: they see it as drawn.
    console.warn('[prototype] review', unit.id, e instanceof Error ? e.message : e)
    return draft
  }
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

/** The plan with the logo the owner picked as its icon (logos.ts). */
export function withMark(job: Job, d: string): Job {
  const style = job.look.style ?? HOUSE
  return {...job, look: {...job.look, style: {...style, icon: {shape: 'svg', letters: '', d}}}}
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
