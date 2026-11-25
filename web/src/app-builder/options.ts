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
  /** A live app to see it in, opened from the choice. */
  url?: string
}

/**
 * The apps already built on fohm-scaffold, as starting points: a visitor picks the one closest to
 * theirs, and that sets the kind of app and whether a real coach is in it. Also the builder's
 * showcase: each links to the live app.
 */
export const TEMPLATES: (Choice & {kind: Kind; coach: 'yes' | 'no' | null})[] = [
  {value: 'naz', label: 'Like Naz', hint: 'Training programs, guided sessions and breathwork for big-wave surfers', url: 'https://naz.surf', kind: 'coaching', coach: 'no'},
  {value: 'etapa', label: 'Like Etapa', hint: 'A cycling coach that builds each rider their plan and changes it with them', url: 'https://getetapa.com', kind: 'coaching', coach: 'no'},
  {value: 'aluzam', label: 'Like Aluzam', hint: 'Guitar practice with a real teacher: lessons, a practice plan and feedback', url: 'https://aluzam.app', kind: 'coaching', coach: 'yes'},
  {value: 'naz-surf', label: 'Like Naz Surf', hint: 'A surf game in the browser, on real big-wave spots', url: 'https://play.naz.surf', kind: 'game', coach: null},
  {value: 'strawberry-fields', label: 'Like Strawberry Fields', hint: 'A backcountry ski and snowboard game on real mountains', url: 'https://strawberry-fields-peach.vercel.app', kind: 'game', coach: null},
  {value: 'other', label: 'Something else', hint: 'Programs to follow, and a real person who answers: you see everything on a dashboard', kind: 'coaching', coach: 'yes'},
]
const templateOf = (a: Answers) => TEMPLATES.find((x) => x.value === a.template) ?? TEMPLATES[0]
const kindOf = (a: Answers) => templateOf(a).kind

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

const coaching = (a: Answers) => kindOf(a) === 'coaching'
const notGame = (a: Answers) => kindOf(a) !== 'game'

export const SECTIONS = ['The idea', 'The name', 'Onboarding', 'The method', 'Look and feel', 'About you'] as const

/**
 * Only what a first look at the app needs. Everything else the scaffold takes (the words for the
 * people and the person who runs it, the business's details, the domain, the app id, the price)
 * has a sensible default here, and the brief asks Claude to settle it with the owner later.
 */
export const QUESTIONS: Question[] = [
  // The idea
  {key: 'idea', section: 'The idea', ask: 'In a sentence, what does it do, and for whom?', example: 'A pocket surf coach that tells beginners what to work on next, between lessons.', long: true, flag: 'idea'},
  {key: 'business', section: 'The idea', ask: 'What do you do today?', why: 'Your business, coaching or content, and what people already pay you for. Leave it blank if the app is a new idea.', example: 'I run a surf school in Cornwall: lessons, retreats and video analysis.', long: true, flag: 'business'},
  {
    key: 'template',
    section: 'The idea',
    ask: 'What kind of app is it?',
    why: 'Pick the closest. Each of these was built on the same foundations, so yours starts where they did.',
    default: 'naz',
    choices: TEMPLATES.map(({value, label, hint, url}) => ({value, label, hint, url})),
  },
  {key: 'doing', section: 'The idea', ask: 'What should people be doing in the app?', why: 'We write the headline and the landing page from it.', example: 'Following a training plan for bigger waves, a few short sessions a week.', long: true},

  // The name
  {key: 'name', section: 'The name', ask: 'What is the app called?', why: 'A working name is fine: the naming round can find a better one.', example: 'Tidepool', required: true, flag: 'name'},
  {
    key: 'nameSure',
    section: 'The name',
    ask: 'Are you sure of that name?',
    default: 'no',
    choices: [
      {value: 'yes', label: 'Yes, that’s the name'},
      {value: 'no', label: 'No, find me a better one', hint: 'A naming round: names checked for domains, store clashes and trade marks'},
    ],
  },

  // Onboarding (Naz's)
  {key: 'keyValue', section: 'Onboarding', ask: 'The question your app answers', why: 'The first thing a new member reads, over a photo.', example: 'Want to feel more comfortable in bigger waves?', when: notGame},
  {key: 'interests', section: 'Onboarding', ask: 'What are people here for? A few words, comma-separated', why: 'Tiles in onboarding: what they pick comes first in the app.', example: 'Strength, Breath-holds, Mobility, Spots', when: notGame},
  {key: 'goals', section: 'Onboarding', ask: 'What do people work towards: places, events or trips?', example: 'Big-wave spots: Nazaré, Mavericks, Jaws', when: notGame},

  // The method
  {key: 'levels', section: 'The method', ask: 'The levels people move through, and a skill or two at each', why: 'The path, in your own words.', example: 'Foam board: paddling, pop-ups. Green waves: angling, trimming. Reef: duck-dives, reading sets.', long: true, when: coaching},
  {key: 'content', section: 'The method', ask: 'Links to the videos, posts and courses you already publish', why: 'The library points at them.', example: 'youtube.com/@yourschool, instagram.com/yourschool', when: notGame},

  // Look and feel
  {key: 'inspiration', section: 'Look and feel', ask: 'Apps you like the look and feel of', why: 'Their screens are pulled from Mobbin and adopted within the house style.', example: 'Speak, Ahead, Strava', flag: 'inspiration'},
  {key: 'accent', section: 'Look and feel', ask: 'Your colour', why: 'It marks what to press and what’s live now. Everything else is black, white and grey.', example: '#2F6B4F', default: '#2F6B4F', flag: 'accent'},
  {
    key: 'logo',
    section: 'Look and feel',
    ask: 'Do you have a logo?',
    default: 'no',
    choices: [
      {value: 'yes', label: 'Yes, I’ll send it', hint: 'Traced into the mark, the app icon and the favicon, never redrawn'},
      {value: 'no', label: 'No, design me one', hint: 'Three or four ideas, judged at the size of a home-screen icon'},
    ],
  },
  {key: 'photo', section: 'Look and feel', ask: 'A photo for the app', why: 'The landing page, onboarding and Home lead with it. Search open-licence photos, or paste a link to your own.', example: 'surfing big waves'},

  // About you: what the research needs first
  {key: 'audience', section: 'About you', ask: 'How big is your audience today?', why: 'Followers, a mailing list, clients: the app sells to them first.', example: '12k on Instagram, 2,000 on the mailing list'},
  {key: 'ambition', section: 'About you', ask: 'What would success look like in a year?', example: '500 paying members, and the coaching waitlist gone', long: true},
]

/** Colours that keep white text at 4.5:1 on them, for "Pick one for me". */
export const ACCENTS = ['#2F6B4F', '#1B5E9A', '#B5432C', '#6B4FA0', '#0F766E', '#A34A0B', '#BE185D', '#3F4A5A', '#4D6B12', '#8A2E3B', '#2E5E8C', '#7A4B2A']

/** What to search photos for first: the first goal they named, else what the app they picked is about. */
export function photoSearchFor(a: Answers) {
  const goals = (a.goals || '').split(':').pop()?.split(/,|\n| and /)[0]?.trim()
  if (goals) return goals
  const byTemplate: Record<string, string> = {naz: 'big wave surfing', etapa: 'road cycling', aluzam: 'acoustic guitar', 'naz-surf': 'surfing wave', 'strawberry-fields': 'backcountry skiing'}
  return byTemplate[a.template] ?? (a.idea || '').split(/\s+/).slice(0, 4).join(' ')
}

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

/** A headline from what people do in the app: its first clause, as a sentence, when it's short enough to lead a page. */
function headline(doing: string) {
  const first = doing.split(/[.;:\n]/)[0].trim()
  if (!first || first.length > 70) return ''
  return `${first.charAt(0).toUpperCase()}${first.slice(1)}.`
}

/** The scaffolder's resolveOptions: fills the defaults that depend on other answers, then checks them. */
export function resolveOptions(input: Answers): {options: Options; errors: Record<string, string>} {
  const t = (k: string) => (input[k] ?? '').trim()
  const name = t('name')
  const template = templateOf(input)
  const kind = template.kind
  const coach = kind !== 'game' && template.coach === 'yes'
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
      headline(t('doing')) ||
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
