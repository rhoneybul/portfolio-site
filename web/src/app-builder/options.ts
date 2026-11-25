/**
 * Everything fohm-scaffold's first phase asks, in the order a person can answer it: the questions
 * its `new` command takes (lib/options.mjs), then what its new-app skill asks before building
 * (the naming round, the design references and the owner's three design questions, the logo, the
 * photos, onboarding's steps, the coach's method, the catalogues, and the research's open
 * questions). The defaults and checks are the scaffolder's own resolveOptions, ported. Keep the
 * two in step: a change to a question there is a change here.
 */

export const KINDS = ['coaching', 'app', 'game'] as const
export type Kind = (typeof KINDS)[number]

export type Answers = Record<string, string>

export interface Choice {
  value: string
  label: string
  hint?: string
}

export interface Question {
  key: string
  section: string
  ask: string
  /** A line under the question: why it's asked, or what it becomes. */
  why?: string
  example?: string
  default?: string
  choices?: Choice[]
  /** Several choices at once, kept comma-separated. */
  multi?: boolean
  required?: boolean
  long?: boolean
  /** The flag `fohm-scaffold new` takes it as, if it takes it. */
  flag?: string
  /** Asked only when this is true of the answers so far. */
  when?: (a: Answers) => boolean
}

const yesNo = (yes: string, no: string): Choice[] => [
  {value: 'yes', label: 'Yes', hint: yes},
  {value: 'no', label: 'No', hint: no},
]
const coaching = (a: Answers) => (a.kind || 'coaching') === 'coaching'
const notGame = (a: Answers) => a.kind !== 'game'
const hasCoach = (a: Answers) => (a.coach || 'yes') === 'yes'

export const SECTIONS = ['The idea', 'The name', 'The people', 'Onboarding', 'The method', 'Look and feel', 'The business', 'Research'] as const

export const QUESTIONS: Question[] = [
  // The idea
  {key: 'idea', section: 'The idea', ask: 'In a sentence, what does it do, and for whom?', example: 'A pocket surf coach that tells beginners what to work on next, between lessons.', long: true, flag: 'idea'},
  {key: 'business', section: 'The idea', ask: 'Whose business is it, and what do they sell already?', example: 'A Cornwall surf school: retreats, private coaching and video analysis.', long: true, flag: 'business'},
  {
    key: 'kind',
    section: 'The idea',
    ask: 'Coaching progression, a plain app, or a game?',
    default: 'coaching',
    flag: 'kind',
    choices: [
      {value: 'coaching', label: 'Coaching progression', hint: 'A level to start at, a path of skills, check-ins, clips and a library'},
      {value: 'app', label: 'A plain app', hint: 'Members write things and get replies; the dashboard sees it all'},
      {value: 'game', label: 'A game', hint: 'A quick game to play anywhere, with scores on the dashboard'},
    ],
  },
  {
    key: 'coach',
    section: 'The idea',
    ask: 'Is there a real coach in the app, or is it programs?',
    default: 'yes',
    flag: 'coach',
    when: notGame,
    choices: [
      {value: 'yes', label: 'A real coach', hint: 'A person answers members and notes their progress'},
      {value: 'no', label: 'Programs', hint: 'Nobody behind them: the app speaks as itself, and no coach is ever shown'},
    ],
  },
  {
    key: 'routes',
    section: 'The idea',
    ask: 'Do members plan routes on a map?',
    default: 'no',
    flag: 'routes',
    choices: yesNo('Routes snapped to real roads and paths, with Mapbox', 'No maps'),
  },

  // The name
  {key: 'name', section: 'The name', ask: 'What is the app called?', why: 'A working name is fine: the naming round can find a better one.', example: 'Tidepool', required: true, flag: 'name'},
  {
    key: 'nameSure',
    section: 'The name',
    ask: 'Are you sure of that name?',
    why: 'The bundle id, the domain and the App Store record carry it, so it’s settled before they’re made.',
    default: 'no',
    choices: [
      {value: 'yes', label: 'Yes, that’s the name'},
      {value: 'no', label: 'No, run a naming round', hint: '12 to 15 names, each checked for domains, store clashes and trade marks'},
    ],
  },
  {
    key: 'nameStyle',
    section: 'The name',
    ask: 'Which kind of name?',
    multi: true,
    when: (a) => a.nameSure !== 'yes',
    choices: [
      {value: 'evocative', label: 'Evocative, not literal', hint: 'Strava, Runna, Whoop'},
      {value: 'place-led', label: 'Place-led', hint: 'Naz, from Nazaré'},
      {value: 'coined', label: 'Coined', hint: 'A new word'},
      {value: 'descriptive', label: 'Descriptive', hint: 'Says what it does'},
    ],
  },
  {key: 'namesLiked', section: 'The name', ask: 'Names you like, in any category, and why', example: 'Strava: short, sounds like effort. Calm: says the feeling.', long: true, when: (a) => a.nameSure !== 'yes'},
  {key: 'namesDisliked', section: 'The name', ask: 'What you dislike in a name', example: 'Puns, jargon, anything ending in -ly', when: (a) => a.nameSure !== 'yes'},

  // The people
  {key: 'memberWord', section: 'The people', ask: 'What do you call the people who use it?', example: 'student', default: 'member', flag: 'member-word'},
  {key: 'ownerWord', section: 'The people', ask: 'What do you call the person who runs it?', why: 'Coach for a coaching app with a coach, team with no coach, else owner.', example: 'coach', flag: 'owner-word'},
  {key: 'tagline', section: 'The people', ask: 'One line on what it does for people', why: 'The landing page’s headline.', example: 'Practise every day, with your coach beside you.', flag: 'tagline'},
  {key: 'description', section: 'The people', ask: 'A sentence or two under it: what it does, for whom, and what changes for them', why: 'The landing page and the description search engines and shared links show.', example: 'Short sessions between lessons, at your level, with your coach watching your progress.', long: true},

  // Onboarding (Naz's)
  {key: 'keyValue', section: 'Onboarding', ask: 'The app’s key value, as a question', why: 'The first thing a new member reads, over a photo.', example: 'Want to feel more comfortable in bigger waves?', when: notGame},
  {key: 'interests', section: 'Onboarding', ask: 'What are members here for? Four to six words, comma-separated', why: 'A grid of tiles: what they pick comes first in the app.', example: 'Strength, Breath-holds, Mobility, Spots, Courses, Kit', when: notGame},
  {key: 'firstNumber', section: 'Onboarding', ask: 'A first number a member can measure there and then, safely, in minutes', why: 'Optional. It starts their progress on day one.', example: 'A dry breath-hold, timed', when: notGame},
  {key: 'week', section: 'Onboarding', ask: 'How much can a member usually give it?', why: 'Days a week and minutes a session.', example: '3 days a week, 30 minutes', when: notGame},
  {key: 'goals', section: 'Onboarding', ask: 'What do members train for: places, events or trips?', why: 'The catalogue of goals, each with a real photo, and the courses that prepare for them.', example: 'Big-wave spots: Nazaré, Mavericks, Jaws', long: true, when: notGame},

  // The method
  {key: 'levels', section: 'The method', ask: 'The levels members move through, and a skill or two at each', why: 'The path, in your own words.', example: 'Foam board: paddling, pop-ups. Green waves: angling, trimming. Reef: duck-dives, reading sets.', long: true, when: coaching},
  {key: 'placing', section: 'The method', ask: 'The questions that tell you where someone starts', example: 'How long have you surfed? Can you catch green waves on your own?', long: true, when: coaching},
  {key: 'content', section: 'The method', ask: 'Links to the videos, posts and courses you already publish', why: 'The library points at them.', example: 'youtube.com/@yourschool, instagram.com/yourschool', long: true, when: notGame},
  {key: 'price', section: 'The method', ask: 'What would members pay for Pro?', why: 'Stripe sells it on the web; you can give it from the dashboard too.', example: '£9.99 a month or £59.99 a year, with a week free'},

  // Look and feel
  {key: 'inspiration', section: 'Look and feel', ask: 'Apps you like the look and feel of (comma-separated)', why: 'Their screens are pulled from Mobbin and adopted within the house style.', example: 'Speak, Ahead, Strava', flag: 'inspiration'},
  {key: 'notInspiration', section: 'Look and feel', ask: 'And any you don’t', example: 'Anything that feels like a spreadsheet'},
  {
    key: 'appType',
    section: 'Look and feel',
    ask: 'What kind of app is it to you?',
    choices: [
      {value: 'a coach', label: 'A coach'},
      {value: 'a program to follow', label: 'A program to follow'},
      {value: 'a catalogue to browse', label: 'A catalogue to browse'},
      {value: 'a game', label: 'A game'},
    ],
  },
  {key: 'navigation', section: 'Look and feel', ask: 'A tab bar, and which three to five tabs? Or one hub screen with everything off it?', example: 'Tabs: Home, Train, Spots, You', default: ''},
  {key: 'accent', section: 'Look and feel', ask: 'The one accent colour, from your brand', why: 'It marks what to press and what’s live now. Everything else is black, white and grey.', example: '#2F6B4F', default: '#2F6B4F', flag: 'accent'},
  {
    key: 'logo',
    section: 'Look and feel',
    ask: 'Do you have a logo or artwork?',
    default: 'no',
    choices: [
      {value: 'yes', label: 'Yes, I’ll send it', hint: 'Traced into the mark, the app icon and the favicon, never redrawn'},
      {value: 'no', label: 'No, run the logo round', hint: 'Three or four concepts, judged at the size of a home-screen icon'},
    ],
  },
  {key: 'photo', section: 'Look and feel', ask: 'A link to a photo of what members train for, or your people', why: 'The landing page, onboarding and Home lead with it. Your own, or an open licence.', example: 'https://upload.wikimedia.org/…/photo.jpg'},
  {
    key: 'ownPhotos',
    section: 'Look and feel',
    ask: 'Do you have photos of your own the app may use?',
    default: 'no',
    choices: yesNo('Your business’s photos, with your written permission recorded', 'Open-licence photos only, each credited'),
  },

  // The business
  {key: 'operator', section: 'The business', ask: 'Who runs it (person or company, for the privacy policy)?', example: 'Tidepool Ltd', flag: 'operator'},
  {key: 'country', section: 'The business', ask: 'Which country is the business in?', why: 'For registering it, tax, the domain and the trade-mark check.', example: 'United Kingdom', default: '', flag: 'country'},
  {key: 'registration', section: 'The business', ask: 'The business’s registration, as the terms should show it', why: 'Blank if it isn’t registered yet.', example: 'company number 01234567, registered in England and Wales', default: '', flag: 'registration'},
  {key: 'address', section: 'The business', ask: 'The registered office address', why: 'For the terms and privacy policy; a UK company must show it. Blank if it isn’t registered yet.', example: '1 High Street, Bristol BS1 1AA', default: '', flag: 'address'},
  {key: 'supportEmail', section: 'The business', ask: 'Support email address', example: 'hello@tidepool.app', flag: 'support-email'},
  {key: 'domain', section: 'The business', ask: 'Domain it will live at', why: 'Blank if it isn’t decided.', example: 'tidepool.app', default: '', flag: 'domain'},
  {key: 'bundleId', section: 'The business', ask: 'iOS and Android app id (reverse domain)', example: 'app.tidepool', flag: 'bundle-id'},

  // Research: the open questions
  {key: 'audience', section: 'Research', ask: 'How big is your audience today?', why: 'Followers, a mailing list, clients: the app sells to them first.', example: '12k on Instagram, 2,000 on the mailing list, 300 clients a year'},
  {key: 'revenue', section: 'Research', ask: 'What do you earn from it now, roughly, and from what?', example: '£80k a year, mostly retreats'},
  {key: 'time', section: 'Research', ask: 'How much time can you give the app each week?', example: 'Two hours, replying to clips'},
  {key: 'ambition', section: 'Research', ask: 'What would success look like in a year?', example: '500 paying members, and the coaching waitlist gone', long: true},
  {key: 'budget', section: 'Research', ask: 'A budget for running costs and the store accounts?', example: '£100 a month'},
  {key: 'rights', section: 'Research', ask: 'Do you own the content you’d put in it?', why: 'Videos, programs, photos.', example: 'Yes, all filmed by us'},
]

export const asked = (a: Answers) => QUESTIONS.filter((q) => !q.when || q.when(a))
export const emptyAnswers = (): Answers => Object.fromEntries(QUESTIONS.map((q) => [q.key, q.default ?? '']))

const COUNTRY_CODES: Record<string, string[]> = {
  AU: ['au', 'aus', 'australia'],
  GB: ['gb', 'uk', 'united kingdom', 'great britain', 'britain', 'england', 'scotland', 'wales', 'northern ireland'],
  US: ['us', 'usa', 'united states', 'united states of america', 'america'],
}

export function countryCode(answer: string) {
  const a = answer.trim().replace(/[.]/g, '').toLowerCase()
  if (!a) return ''
  return Object.keys(COUNTRY_CODES).find((c) => COUNTRY_CODES[c].includes(a)) ?? answer.trim()
}

export const cleanDomain = (d: string) =>
  d
    .trim()
    .replace(/^https?:\/\//, '')
    .replace(/\/.*$/, '')
    .toLowerCase()
const isDomain = (d: string) => /^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(d)

const NOT_YET = new Set(['no', 'n', 'none', 'nope', 'not yet', 'not registered', 'n/a', 'na', '-'])
const YES = new Set(['yes', 'y', 'yep', 'registered'])

export const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40) || 'app'

export interface Options extends Answers {
  slug: string
  kind: Kind
}

/** The scaffolder's resolveOptions: fills the defaults that depend on other answers, then checks them. */
export function resolveOptions(input: Answers): {options: Options; errors: Record<string, string>} {
  const t = (k: string) => (input[k] ?? '').trim()
  const name = t('name')
  const kind = (t('kind') || 'coaching').toLowerCase() as Kind
  const coach = kind !== 'game' && t('coach') !== 'no'
  const domain = cleanDomain(t('domain'))
  const slug = slugify(name)
  const address = NOT_YET.has(t('address').toLowerCase()) ? '' : t('address').replace(/^at\s+/i, '')
  let registration = NOT_YET.has(t('registration').toLowerCase()) ? '' : t('registration')
  if (address && !registration.toLowerCase().includes(address.toLowerCase()))
    registration = [registration, `at ${address}`].filter(Boolean).join(', ')
  let accent = t('accent') || '#2F6B4F'
  if (!accent.startsWith('#')) accent = `#${accent}`

  const o: Options = {
    ...Object.fromEntries(Object.keys(input).map((k) => [k, t(k)])),
    name,
    slug,
    kind,
    coach: coach ? 'yes' : 'no',
    routes: t('routes') === 'yes' ? 'yes' : 'no',
    inspiration: t('inspiration')
      .split(',')
      .map((x) => x.trim())
      .filter(Boolean)
      .join(', '),
    tagline:
      t('tagline') ||
      (kind === 'game'
        ? `${name}: a quick game to play anywhere.`
        : kind === 'coaching'
          ? 'Your coach in your pocket, between sessions.'
          : `${name}: a short line on what it does for people.`),
    memberWord: (t('memberWord') || 'member').toLowerCase(),
    ownerWord: (t('ownerWord') || (!coach ? 'team' : kind === 'coaching' ? 'coach' : 'owner')).toLowerCase(),
    operator: t('operator') || name,
    country: countryCode(t('country')),
    registration,
    address,
    domain,
    supportEmail: t('supportEmail') || (domain ? `hello@${domain}` : 'support@example.com'),
    bundleId:
      t('bundleId') ||
      (domain ? domain.split('.').reverse().join('.').replace(/-/g, '') : `com.example.${slug.replace(/-/g, '')}`),
    accent,
  }

  const errors: Record<string, string> = {}
  if (!o.name) errors.name = 'The app needs a name. A working name is fine.'
  if (!/^#[0-9a-fA-F]{6}$/.test(o.accent)) errors.accent = 'A 6-digit hex colour, like #2F6B4F.'
  if (!/^[a-zA-Z][a-zA-Z0-9]*(\.[a-zA-Z][a-zA-Z0-9]*)+$/.test(o.bundleId))
    errors.bundleId = 'Like com.company.app: letters and digits, dot-separated.'
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(o.supportEmail)) errors.supportEmail = 'An email address.'
  if (o.domain && !isDomain(o.domain)) errors.domain = 'Like example.com.'
  if (YES.has(t('registration').toLowerCase()))
    errors.registration = 'The number itself, as the terms should show it, or blank if it isn’t registered yet.'
  if (t('photo') && !/^https:\/\/\S+$/.test(t('photo'))) errors.photo = 'A link starting with https://'
  for (const k of ['name', 'tagline', 'operator', 'memberWord', 'ownerWord', 'idea', 'business', 'inspiration', 'country', 'registration', 'address'])
    if (/["`\\]/.test(t(k))) errors[k] = 'No quotes or backslashes here: the scaffolder can’t take them.'
  return {options: o, errors}
}

/** The scaffolder's accentSoft: a pale tint of the accent for soft backgrounds. */
export function soften(hex: string) {
  const n = parseInt(hex.slice(1), 16)
  const mix = (c: number) => Math.round(c + (255 - c) * 0.85)
  return '#' + [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => mix(c).toString(16).padStart(2, '0')).join('').toUpperCase()
}

function luminance(hex: string) {
  const n = parseInt(hex.slice(1), 16)
  const lin = (c: number) => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * lin((n >> 16) & 255) + 0.7152 * lin((n >> 8) & 255) + 0.0722 * lin(n & 255)
}

/** White or ink on the accent, whichever reads. */
export const onAccent = (hex: string) => (1.05 / (luminance(hex) + 0.05) >= 4.5 ? '#FFFFFF' : '#111113')

/** The template's dashboard accent: lifted toward white until it keeps 3:1 on its graphite. */
export function liftedAccent(hex: string) {
  const ground = luminance('#26262B')
  for (let share = 0; share <= 1; share += 0.02) {
    const n = parseInt(hex.slice(1), 16)
    const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((x) => Math.round(x * (1 - share) + 255 * share))
    const mixed = '#' + c.map((x) => x.toString(16).padStart(2, '0')).join('')
    if ((luminance(mixed) + 0.05) / (ground + 0.05) >= 3) return mixed
  }
  return '#FFFFFF'
}

/** The template's "needs you" colour: a clear blue, or amber when the brand's accent is itself a blue. */
export function needsYou(hex: string) {
  const n = parseInt(hex.slice(1), 16)
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => c / 255)
  const max = Math.max(r, g, b)
  const d = max - Math.min(r, g, b)
  const h = !d ? 0 : max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4
  const hue = (h * 60 + 360) % 360
  const gap = Math.min(Math.abs(hue - 211), 360 - Math.abs(hue - 211))
  return gap < 45 ? '#F5C451' : '#6CB6FF'
}

/** The interests, as words. */
export const interestsOf = (o: Options) =>
  (o.interests || 'New skills, A routine I keep, Confidence, Feedback, The library')
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean)
    .slice(0, 6)

/** What the generator writes, file by file, for the building step. */
export const buildSteps = (o: Options) => [
  `Copying the template into ${o.slug}/`,
  `app.json: ${o.name}, ${o.bundleId}`,
  `src/lib/brand.ts: “${o.tagline}”, ${o.memberWord}s and their ${o.ownerWord}`,
  `src/lib/theme.ts: accent ${o.accent.toUpperCase()} in the house style`,
  `src/lib/progression.ts: onboarding’s steps${o.kind === 'coaching' ? ' and the path' : ''}`,
  `PRODUCT.md and docs/RESEARCH.md: the thesis${o.business ? ' and the business' : ''}`,
  ...(o.inspiration ? [`DESIGN.md: references from ${o.inspiration}`] : []),
  `Privacy policy and terms for ${o.operator}`,
  'The workflows: tests, smoke checks, store builds',
  'Drawing the screens',
]
