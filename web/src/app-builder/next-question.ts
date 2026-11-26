/**
 * Which question the app builder asks next. The questions are rows of a catalogue (QUESTIONS in
 * options.ts); Claude picks the next row from what the visitor has said so far, in their words
 * (/api/builder/next), the way fohm-scaffold's new-app discovery chat does. Everything Claude
 * sends back is checked here, and without Claude the next row comes from a fixed order with its
 * own words. Plain: used in the browser and on the server.
 */
import {QUESTIONS, TEMPLATES, asked, type Answers, type Question} from './options'

export const PARTS = ['The idea', 'How it works', 'How it looks, and the practical bits'] as const

/** The catalogue in the order it's asked without Claude, part by part: the idea first, the email last. */
const ORDER: {key: string; part: 1 | 2 | 3}[] = [
  {key: 'idea', part: 1},
  {key: 'business', part: 1},
  {key: 'template', part: 1},
  {key: 'doing', part: 1},
  {key: 'interests', part: 2},
  {key: 'goals', part: 2},
  {key: 'content', part: 2},
  {key: 'inspiration', part: 3},
  {key: 'accent', part: 3},
  {key: 'logo', part: 3},
  {key: 'photo', part: 3},
  {key: 'name', part: 3},
  {key: 'nameSure', part: 3},
  {key: 'audience', part: 3},
  {key: 'ambition', part: 3},
  {key: 'email', part: 3},
]

export const FIRST = 'idea'
export const LAST = 'email'

/** Answers kept as a comma-separated list, where a suggestion adds itself rather than replacing the answer. */
export const LISTS = new Set(['interests', 'goals', 'inspiration', 'content'])

/** Rows Claude may never skip: the anchors, and what the app can't be drawn without. */
const UNSKIPPABLE = new Set([FIRST, LAST, 'name'])

export interface Turn {
  done: false
  key: string
  ask: string
  why?: string
  /** Picks tailored to their app, under a typed answer. */
  suggestions?: string[]
  /** Whether several of the picks can be chosen (joined with commas) or one answers it: Claude's call, else a list row's. */
  multi?: boolean
  /** An answer their earlier ones already give, shown for them to confirm. */
  prefill?: string
  /** Rows their answers make irrelevant: set to their defaults and not asked. */
  skip?: string[]
  part: 1 | 2 | 3
  parts: 3
  partName: string
  /** About how many questions are left after this one. */
  left: number
}

export type Next = Turn | {done: true}

const questionOf = (key: string) => QUESTIONS.find((q) => q.key === key) as Question
const partOf = (key: string) => ORDER.find((o) => o.key === key)?.part ?? 3

/** The rows still to ask, in order: those that apply to the answers, not yet asked or skipped. */
export function pending(answers: Answers, done: readonly string[]): string[] {
  const applies = new Set(asked(answers).map((q) => q.key))
  return ORDER.map((o) => o.key).filter((key) => applies.has(key) && !done.includes(key))
}

/** How many questions there are in all, for the heads-up before the first. */
export const totalQuestions = (answers: Answers) => pending(answers, []).length

function turnFor(key: string, left: number, extra: Partial<Turn> = {}): Turn {
  const q = questionOf(key)
  const part = partOf(key)
  return {done: false, key, ask: q.ask, ...(q.why ? {why: q.why} : {}), part, parts: 3, partName: PARTS[part - 1], left, ...extra}
}

/** The next row without Claude: the first still to ask, in the fixed order, in its own words. */
export function fallbackNext(answers: Answers, done: readonly string[]): Next {
  const rows = pending(answers, done)
  if (!rows.length) return {done: true}
  return turnFor(rows[0], rows.length - 1)
}

/** Whether Claude is asked at all: never for the first row, nor once only the email is left. */
export function needsClaude(answers: Answers, done: readonly string[]) {
  const rows = pending(answers, done)
  return done.length > 0 && rows.some((key) => key !== LAST)
}

/** Plain text, one line, cut to a length: nothing Claude says reaches the page as markup. */
export function plain(v: unknown, most: number) {
  if (typeof v !== 'string') return ''
  return v.replace(/<[^>]*>/g, '').replace(/[<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, most)
}

/** What a visitor's browser may send: known keys only, each a short string. */
export function cleanRequest(body: unknown): {answers: Answers; done: string[]} {
  const b = (body ?? {}) as {answers?: unknown; done?: unknown}
  const known = new Set([...QUESTIONS.map((q) => q.key), 'photoCredit', 'scheme'])
  const raw = (b.answers && typeof b.answers === 'object' ? b.answers : {}) as Record<string, unknown>
  const answers: Answers = {}
  for (const [k, v] of Object.entries(raw)) if (known.has(k) && typeof v === 'string') answers[k] = v.slice(0, k === 'photo' ? 1000 : 600)
  const done = Array.isArray(b.done) ? [...new Set(b.done.filter((k): k is string => typeof k === 'string' && known.has(k)))] : []
  return {answers, done}
}

/**
 * Claude's pick, checked: a row that's still to ask, its words as plain text, a prefill only where
 * it's a real answer (one of the choices, for a row with choices), suggestions only for a typed
 * answer without its own, and skips only of rows that may be skipped. Anything wrong is an error,
 * and the caller falls back to the fixed order.
 */
export function cleanTurn(raw: unknown, answers: Answers, done: readonly string[]): Turn {
  const r = (raw ?? {}) as Record<string, unknown>
  const rows = pending(answers, done).filter((key) => key !== LAST)
  const key = typeof r.key === 'string' ? r.key : ''
  if (!rows.includes(key)) throw new Error(`Not a row still to ask: ${key || 'none'}`)
  const q = questionOf(key)

  const ask = notAnotherApp(plain(r.ask, 160), answers) || q.ask
  const why = notAnotherApp(plain(r.why, 220), answers) || q.why
  const typed = !q.choices && !q.suggestions && key !== 'photo' && key !== 'accent'
  const picks = typed && Array.isArray(r.suggestions) ? r.suggestions.map((s) => plain(s, 60)).filter(Boolean) : []
  const multi = typed && typeof r.multi === 'boolean' ? r.multi : LISTS.has(key)
  // Several picks are kept as one comma-separated answer, so each is one item: "Erg scores, 2k times" is two.
  const items = multi ? picks.flatMap((s) => s.split(',').map((x) => x.trim()).filter(Boolean)) : picks
  const suggestions = items.filter((s, i) => items.findIndex((x) => x.toLowerCase() === s.toLowerCase()) === i).slice(0, multi ? 6 : 4)
  const prefill = cleanPrefill(q, r.prefill)
  const skip = Array.isArray(r.skip)
    ? r.skip.filter((k): k is string => typeof k === 'string' && k !== key && rows.includes(k) && !UNSKIPPABLE.has(k) && !questionOf(k).required)
    : []

  const left = rows.filter((k) => k !== key && !skip.includes(k)).length + (pending(answers, done).includes(LAST) ? 1 : 0)
  return turnFor(key, left, {
    ask,
    ...(why ? {why} : {}),
    ...(suggestions.length ? {suggestions, multi} : {}),
    ...(prefill ? {prefill} : {}),
    ...(skip.length ? {skip} : {}),
  })
}

/**
 * Our own apps the visitor can pick a look from ("Like Etapa") are never their app: before it has a
 * name, Claude took "etapa" for one and asked "What will rowers do in Etapa, day to day?".
 * Wording that names one of them, other than as their own name, is dropped for the row's own.
 */
export function notAnotherApp(text: string, answers: Answers) {
  const theirs = answers.name?.trim().toLowerCase()
  const names = TEMPLATES.map((t) => t.label.replace(/^Like /, '')).filter((n) => n.toLowerCase() !== theirs)
  return names.some((n) => new RegExp(`\\b${n}\\b`, 'i').test(text)) ? '' : text
}

function cleanPrefill(q: Question, v: unknown) {
  if (q.key === 'photo' || q.key === 'email') return ''
  if (q.choices) return typeof v === 'string' && q.choices.some((c) => c.value === v) ? v : ''
  if (q.key === 'accent') return typeof v === 'string' && /^#[0-9a-fA-F]{6}$/.test(v) ? v.toUpperCase() : ''
  return plain(v, 300)
}

/** The rows Claude chooses from, for its prompt: each with its own words and any choices. */
export function rowsFor(answers: Answers, done: readonly string[]) {
  return pending(answers, done)
    .filter((key) => key !== LAST)
    .map((key) => {
      const q = questionOf(key)
      const choices = q.choices ? ` Choices (prefill must be one of these values): ${q.choices.map((c) => `${c.value} = ${c.label}`).join('; ')}.` : ''
      const own = q.suggestions ? ' Has its own suggestions: give none.' : ''
      const fixed = key === 'photo' || key === 'accent' ? ' Picked on its own control: give no suggestions or prefill.' : ''
      const must = UNSKIPPABLE.has(key) || q.required ? ' Never skip.' : ''
      return `- ${key} (part ${partOf(key)}): "${q.ask}"${q.why ? ` Why: ${q.why}` : ''}${choices}${own}${fixed}${must}`
    })
    .join('\n')
}

/** The look they picked, said as another app's, so Claude never takes it for their app's name. */
function templateSaid(value: string) {
  const t = TEMPLATES.find((x) => x.value === value.trim())
  return t ? `${t.label}, one of Fohm's own apps whose look they'd borrow (not their app, and not its name)` : value.trim()
}

/** What they've said so far, for Claude: the rows they answered, in their words. */
export function saidSoFar(answers: Answers, done: readonly string[]) {
  return done
    .filter((key) => key !== 'photo' && answers[key]?.trim())
    .map((key) => `- ${questionOf(key)?.ask ?? key}: ${key === 'template' ? templateSaid(answers[key]) : answers[key].trim()}`)
    .join('\n')
}
