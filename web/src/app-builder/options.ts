/**
 * The questions fohm-scaffold's `new` asks, their defaults and their checks, ported from
 * lib/options.mjs in rhoneybul/fohm-scaffold so the website's builder asks exactly what the
 * scaffolder asks and fills in the same defaults. Keep the two in step: a change to a question
 * there is a change here.
 */

export const KINDS = ['coaching', 'app', 'game'] as const
export type Kind = (typeof KINDS)[number]

export interface Question {
  key: keyof Answers
  ask: string
  example: string
  default?: string
  choices?: readonly string[]
  required?: boolean
  long?: boolean
}

export interface Answers {
  idea: string
  business: string
  name: string
  kind: string
  inspiration: string
  tagline: string
  memberWord: string
  ownerWord: string
  operator: string
  country: string
  registration: string
  supportEmail: string
  domain: string
  bundleId: string
  accent: string
}

export const QUESTIONS: Question[] = [
  {key: 'idea', ask: 'In a sentence, what does it do, and for whom?', example: 'A pocket surf coach that tells beginners what to work on next, between lessons.', long: true},
  {key: 'business', ask: 'Whose business is it, and what do they sell already?', example: 'A Cornwall surf school: retreats, private coaching and video analysis.', long: true},
  {key: 'name', ask: 'What is the app called?', example: 'Tidepool', required: true},
  {key: 'kind', ask: 'Coaching progression, a plain app, or a game?', example: 'coaching', default: 'coaching', choices: KINDS},
  {key: 'inspiration', ask: 'Apps you like the look and feel of (comma-separated, e.g. from Mobbin)', example: 'Speak, Ahead, Strava', default: ''},
  {key: 'tagline', ask: 'One line on what it does for people (the landing page headline)', example: 'Practise every day, with your coach beside you.'},
  {key: 'memberWord', ask: 'What do you call the people who use it?', example: 'student', default: 'member'},
  {key: 'ownerWord', ask: 'What do you call the person who runs it? (coach for a coaching app, else owner)', example: 'coach'},
  {key: 'operator', ask: 'Who runs it (person or company, for the privacy policy)?', example: 'Tidepool Ltd'},
  {key: 'country', ask: 'Which country is the business in? (for registering it, tax and the domain)', example: 'Australia', default: ''},
  {key: 'registration', ask: 'The business’s registration, as the terms should show it (blank if it isn’t registered yet)', example: 'ABN 51 824 753 556', default: ''},
  {key: 'supportEmail', ask: 'Support email address', example: 'hello@tidepool.app'},
  {key: 'domain', ask: 'Domain it will live at (blank if not decided)', example: 'tidepool.app', default: ''},
  {key: 'bundleId', ask: 'iOS/Android app id (reverse domain)', example: 'app.tidepool'},
  {key: 'accent', ask: 'Brand accent colour (hex)', example: '#2F6B4F', default: '#2F6B4F'},
]

export const KIND_LABELS: Record<Kind, {label: string; hint: string}> = {
  coaching: {label: 'Coaching progression', hint: 'A level assessment, a path of skills, check-ins and clips for the coach'},
  app: {label: 'A plain app', hint: 'Members write things and get replies; an owner’s dashboard sees it all'},
  game: {label: 'A game', hint: 'A quick game to play anywhere, with scores on the dashboard'},
}

export const emptyAnswers = (): Answers =>
  Object.fromEntries(QUESTIONS.map((q) => [q.key, q.default ?? ''])) as unknown as Answers

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

export type Options = Answers & {slug: string; kind: Kind}

/** The scaffolder's resolveOptions: fills the defaults that depend on other answers, then checks them. */
export function resolveOptions(input: Answers): {options: Options; errors: Partial<Record<keyof Answers, string>>} {
  const t = (k: keyof Answers) => (input[k] ?? '').trim()
  const name = t('name')
  const kind = (t('kind') || 'coaching').toLowerCase() as Kind
  const domain = cleanDomain(t('domain'))
  const slug = slugify(name)
  const registration = NOT_YET.has(t('registration').toLowerCase()) ? '' : t('registration')
  let accent = t('accent') || '#2F6B4F'
  if (!accent.startsWith('#')) accent = `#${accent}`
  const o: Options = {
    idea: t('idea'),
    business: t('business'),
    name,
    slug,
    kind,
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
    ownerWord: (t('ownerWord') || (kind === 'coaching' ? 'coach' : 'owner')).toLowerCase(),
    operator: t('operator') || name,
    country: countryCode(t('country')),
    registration,
    domain,
    supportEmail: t('supportEmail') || (domain ? `hello@${domain}` : 'support@example.com'),
    bundleId:
      t('bundleId') ||
      (domain ? domain.split('.').reverse().join('.').replace(/-/g, '') : `com.example.${slug.replace(/-/g, '')}`),
    accent,
  }

  const errors: Partial<Record<keyof Answers, string>> = {}
  if (!o.name) errors.name = 'The app needs a name. A working name is fine.'
  if (!(KINDS as readonly string[]).includes(o.kind)) errors.kind = 'Pick coaching, app or game.'
  if (!/^#[0-9a-fA-F]{6}$/.test(o.accent)) errors.accent = 'A 6-digit hex colour, like #2F6B4F.'
  if (!/^[a-zA-Z][a-zA-Z0-9]*(\.[a-zA-Z][a-zA-Z0-9]*)+$/.test(o.bundleId))
    errors.bundleId = 'Like com.company.app: letters and digits, dot-separated.'
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(o.supportEmail)) errors.supportEmail = 'An email address.'
  if (o.domain && !isDomain(o.domain)) errors.domain = 'Like example.com.'
  if (YES.has(o.registration.toLowerCase()))
    errors.registration = 'The number itself, as the terms should show it (like ABN 51 824 753 556), or blank.'
  return {options: o, errors}
}

/** The scaffolder's accentSoft: a pale tint of the accent for soft backgrounds. */
export function soften(hex: string) {
  const n = parseInt(hex.slice(1), 16)
  const mix = (c: number) => Math.round(c + (255 - c) * 0.85)
  return '#' + [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => mix(c).toString(16).padStart(2, '0')).join('').toUpperCase()
}

/** White or ink on the accent, whichever reads (the template assumes a dark accent; visitors pick anything). */
export function onAccent(hex: string) {
  const n = parseInt(hex.slice(1), 16)
  const lin = (c: number) => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  }
  const l = 0.2126 * lin((n >> 16) & 255) + 0.7152 * lin((n >> 8) & 255) + 0.0722 * lin(n & 255)
  return 1.05 / (l + 0.05) >= 4.5 ? '#FFFFFF' : '#1C1F1D'
}

/** What the generator writes, file by file, for the building step. */
export const buildSteps = (o: Options) => [
  `Copying the template into ${o.slug}/`,
  `app.json: ${o.name}, ${o.bundleId}`,
  `src/lib/brand.ts: “${o.tagline}”, ${o.memberWord}s and their ${o.ownerWord}`,
  `src/lib/theme.ts: accent ${o.accent.toUpperCase()}, soft ${soften(o.accent)}`,
  `PRODUCT.md: the thesis${o.business ? ' and the business' : ''}`,
  ...(o.inspiration ? [`DESIGN.md: references from ${o.inspiration}`] : []),
  `Privacy policy and terms for ${o.operator}`,
  'Drawing the screens',
]
