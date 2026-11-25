/**
 * The app's own content, and writing it into an app fohm-scaffold just made: the levels, the
 * questions that place someone, the library, what members are here for and onboarding's opening
 * (src/lib/progression.ts), and the landing page's words (src/lib/brand.ts). Content comes from
 * Claude when there's a key (content.ts), else straight from the visitor's answers, so a prototype
 * always builds. Plain logic, tested in Node (fill.test.ts).
 */
import {slugify, type Options} from './options'

export interface Content {
  hello: string[]
  description: string
  steps: {title: string; body: string}[]
  features: {title: string; body: string}[]
  levels: {title: string; summary: string; skills: {title: string; why: string; drills: string[]}[]}[]
  assessment: {question: string; answers: string[]}[]
  library: {title: string; kind: 'video' | 'drill' | 'note'; body: string}[]
}

const cap = (w: string) => w.charAt(0).toUpperCase() + w.slice(1)

/** "Foam board: paddling, pop-ups. Green waves: angling." as levels and their skills. */
export function levelsFromAnswer(text: string) {
  return text
    .split(/\n|\.\s+|;\s*/)
    .map((chunk) => chunk.trim().replace(/\.$/, ''))
    .filter(Boolean)
    .map((chunk) => {
      const [title, rest] = chunk.split(/:\s*/, 2)
      return {title: cap(title.trim()), skills: (rest ?? '').split(/,\s*|\s+and\s+/).map((s) => cap(s.trim())).filter(Boolean)}
    })
    .filter((l) => l.title)
    .slice(0, 5)
}

/** The content from the answers alone, with no model: the visitor's own words wherever they gave them. */
export function contentFromAnswers(o: Options): Content {
  const given = levelsFromAnswer(o.levels || '')
  const levels = (given.length ? given : [{title: 'Getting started', skills: ['The basics', 'A routine you keep']}, {title: 'Building', skills: ['Consistency', 'Using feedback']}, {title: 'Progressing', skills: ['A real challenge', 'Reviewing your progress']}]).map((l) => ({
    title: l.title,
    summary: `What ${o.memberWord}s work on at ${l.title.toLowerCase()}.`,
    skills: (l.skills.length ? l.skills : ['The basics']).map((s) => ({title: s, why: `A step on the way through ${l.title.toLowerCase()}.`, drills: [`Practise ${s.toLowerCase()}`, 'Check in after you practise']})),
  }))
  const questions = (o.placing || 'How much have you done before?')
    .split('?')
    .map((q) => q.trim())
    .filter(Boolean)
    .slice(0, 3)
  return {
    hello: [o.keyValue || 'Want to get better at it, week by week?', o.idea || 'It’s built a little at a time, at your level.', `${o.name} starts you where you are and shows you what to do next.`],
    description: o.description || o.idea || `${o.name}: ${o.tagline}`,
    steps: [
      {title: 'Tell it where you are', body: 'A few questions about where you are now and what you want from it.'},
      {title: 'Follow your path', body: 'A step at a time, at your level, on your phone or laptop.'},
      {title: 'See what changed', body: 'Everything you do is kept, so you can see how far you have come.'},
    ],
    features: [
      {title: 'Start in a minute', body: 'Create an account and you are in. Nothing to install on the web.'},
      {title: 'On your phone and laptop', body: 'The same account on the web, iPhone and Android.'},
      {title: o.coach === 'yes' ? 'A real person behind it' : 'Built from a real method', body: o.coach === 'yes' ? `Everything you do reaches your ${o.ownerWord}, and they reply.` : `The ${o.ownerWord}’s method, a step at a time.`},
    ],
    levels,
    assessment: questions.map((q) => ({question: `${q}?`, answers: ['Not yet, or only once or twice', 'A few times, and I know the basics', 'Regularly, and I want to push on']})),
    library: [{title: 'Welcome, and how this works', kind: 'note', body: `Check in after you practise, and work on the next skills on your path.`}],
  }
}

/** Where the array or object that opens at `from` (its `[` or `{`) closes. Strings are skipped. */
function closing(source: string, from: number) {
  let depth = 0
  let quote: string | null = null
  for (let i = from; i < source.length; i++) {
    const c = source[i]
    if (quote) {
      if (c === '\\') i++
      else if (c === quote) quote = null
      continue
    }
    if (c === "'" || c === '"' || c === '`') quote = c
    else if (c === '[' || c === '{') depth++
    else if (c === ']' || c === '}') {
      depth--
      if (depth === 0) return i
    }
  }
  throw new Error(`No closing bracket after ${from}`)
}

/** `source` with the literal after `marker` (an array or object, opening at the first bracket after it) replaced. */
export function replaceLiteral(source: string, marker: string, literal: string, after = 0) {
  const at = source.indexOf(marker, after)
  if (at < 0) throw new Error(`Not found: ${marker}`)
  const open = source.slice(at + marker.length).search(/[[{]/) + at + marker.length
  return source.slice(0, open) + literal + source.slice(closing(source, open) + 1)
}

/** `export const NAME: <type> = [...]` with its value replaced, whatever its type annotation holds. */
export function replaceConst(source: string, name: string, literal: string) {
  const at = source.indexOf(`export const ${name}`)
  if (at < 0) throw new Error(`Not found: ${name}`)
  return replaceLiteral(source, '= ', literal, source.indexOf('= ', at))
}

const json = (v: unknown) => JSON.stringify(v, null, 2)

/** The template's interest ids, in order: the four kinds of training, then the library (a part of the app that needs none). */
const INTEREST_IDS = [
  {id: 'skills', icon: 'award'},
  {id: 'routine', icon: 'repeat'},
  {id: 'confidence', icon: 'smile'},
  {id: 'feedback', icon: 'message-circle'},
  {id: 'library', icon: 'book-open'},
]

export function writeProgression(source: string, c: Content, o: Options) {
  const levels = c.levels.map((l) => ({
    id: slugify(l.title),
    title: l.title,
    summary: l.summary,
    skills: l.skills.map((s) => ({id: `${slugify(l.title)}-${slugify(s.title)}`, title: s.title, why: s.why, drills: s.drills})),
  }))
  // Each question's answers point at the levels in order: the first at the first, the last at the furthest.
  const assessment = c.assessment.map((q, i) => ({
    id: `q${i + 1}`,
    question: q.question,
    answers: q.answers.map((label, a) => ({label, level: levels[Math.min(Math.round((a * (levels.length - 1)) / Math.max(1, q.answers.length - 1)), levels.length - 1)].id})),
  }))
  const library = c.library.map((x) => ({id: slugify(x.title), ...x}))
  const words = (o.interests || '').split(',').map((x) => x.trim()).filter(Boolean)
  const interests = words.length ? INTEREST_IDS.slice(0, Math.min(words.length, 5)).map((x, i) => ({...x, label: words[i]})) : null

  let s = source.replace(/^\/\/ fohm:template-content.*\n/m, '')
  s = replaceConst(s, 'LEVELS', json(levels))
  s = replaceConst(s, 'ASSESSMENT', json(assessment))
  s = replaceConst(s, 'LIBRARY', json(library))
  if (interests) s = replaceConst(s, 'INTERESTS', json(interests))
  s = replaceLiteral(s, 'lines:', json(c.hello), s.indexOf('export const ONBOARDING'))
  return s
}

export function writeBrand(source: string, c: Content) {
  let s = source.replace(/^(\s*description: )'.*',$/m, (_, lead) => `${lead}${JSON.stringify(c.description)},`)
  const app = s.indexOf('export const APP')
  s = replaceLiteral(s, '  steps:', json(c.steps), app)
  s = replaceLiteral(s, '  features:', json(c.features), app)
  return s
}
