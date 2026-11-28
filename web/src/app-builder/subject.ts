/**
 * The subject an app is about, researched before the questions that need it: for a climbing app,
 * the sessions climbers really do (limit bouldering, hangboard repeaters, ARC), what they build
 * towards (a first V5, a 7a redpoint, a big wall), how they measure it (a max hang, a grade
 * pyramid) and the devices they log with. Found by Claude searching the web from the idea alone
 * (askClaudeWithSearch), once per idea, and then given to the next-question chat (so its picks are
 * the subject's own), to the prototype's plan (so its sessions and goals are real) and to the brief
 * fohm-scaffold builds from. Server only.
 */
import {createHash} from 'node:crypto'
import type {Source} from './claude'

export interface Subject {
  /** The activity and who does it, in a sentence. */
  summary: string
  /** How people in it say where they are: grades, levels, belts, times. */
  levels: string
  /** The kinds of it people choose between (bouldering, sport, trad): onboarding's tiles. */
  disciplines: string[]
  /** The sessions and exercises people really do, each with what it builds. */
  sessions: string[]
  /** What people build towards: milestones, grades, events, places. */
  goals: string[]
  /** The tests and numbers people measure themselves by. */
  benchmarks: string[]
  /** What holds people back, and the injuries or risks the app must respect. */
  pains: string[]
  /** The apps, devices and services people already log with. */
  tracks: string[]
  /** The words people in it use, each with what it means. */
  words: string[]
  sources: Source[]
  at: string
}

export const SUBJECT_SYSTEM = `You research the subject a new app is about, before its owner is interviewed about the app, so every question can offer the subject's own answers.
Search the web for how people in this activity really train, practise or take part: coaching sites, governing bodies, respected guides, and the forums where they talk.
Find what an expert coach in it would know and a newcomer wouldn't: the sessions and exercises people do and what each builds, how they grade where they are, the milestones they build towards, the tests they measure by, what holds them back and the injuries to respect, and the apps and devices they log with.
Be specific to this activity: real exercise names, real grades and numbers, real events and places, real products. Never generic filler ("track progress", "stay motivated"), never guesses.
Plain English, short lines, no emoji, no hype.
Answer with one JSON object and nothing after it:
{"summary": "the activity and who does it, one sentence", "levels": "how people say where they are, one line with the real scale", "disciplines": ["a kind of it people choose between, a few words"], "sessions": ["a session or exercise: what it builds, one line"], "goals": ["a milestone, grade, event or place people build towards, a few words"], "benchmarks": ["a test or number people measure by, and how it's taken, one line"], "pains": ["what holds people back or hurts them, one line"], "tracks": ["an app, device or service people log with"], "words": ["a word people use: what it means"]}
Three to six disciplines, eight to twelve sessions, six to ten goals across the levels, four to six benchmarks, three to five pains, three to six tracks, five to eight words.`

/** From what the owner said the app does (and their business, when they've said it): never their email. */
export const subjectPrompt = (idea: string, business = '') =>
  `What the app does, and for whom: ${idea.slice(0, 600)}${business.trim() ? `\nThe business behind it: ${business.slice(0, 600)}` : ''}\n\nResearch the subject it's about.`

/** Which research an idea shares: the same idea, however it's spaced or capitalised, is researched once. */
export const subjectKey = (idea: string) =>
  createHash('sha256').update(idea.toLowerCase().replace(/\s+/g, ' ').trim()).digest('hex').slice(0, 32)

const text = (v: unknown, most: number) => (typeof v === 'string' ? v.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim().slice(0, most) : '')
const list = (v: unknown, most: number, each: number) => (Array.isArray(v) ? v.map((x) => text(x, each)).filter(Boolean).slice(0, most) : [])

/** The answer read as a Subject: the JSON from its first `{` to its last `}`, each field checked and cut to size. Throws when it says nothing usable. */
export function readSubject(answer: string, sources: Source[], at = new Date()): Subject {
  const start = answer.indexOf('{')
  const end = answer.lastIndexOf('}')
  if (start < 0 || end <= start) throw new Error('No research in the answer')
  const raw = JSON.parse(answer.slice(start, end + 1)) as Record<string, unknown>
  const subject: Subject = {
    summary: text(raw.summary, 300),
    levels: text(raw.levels, 300),
    disciplines: list(raw.disciplines, 6, 60),
    sessions: list(raw.sessions, 12, 200),
    goals: list(raw.goals, 10, 100),
    benchmarks: list(raw.benchmarks, 6, 200),
    pains: list(raw.pains, 5, 200),
    tracks: list(raw.tracks, 6, 60),
    words: list(raw.words, 8, 160),
    sources: sources.filter((s) => /^https?:\/\//.test(s.url)).slice(0, 12),
    at: at.toISOString(),
  }
  if (!subject.sessions.length || !subject.goals.length) throw new Error('The research came back empty')
  return subject
}

/** The research as lines for a prompt or a brief, the sections that came back only. */
export function subjectSaid(s: Subject) {
  const block = (label: string, items: string[]) => (items.length ? `${label}:\n${items.map((x) => `- ${x}`).join('\n')}` : '')
  return [
    s.summary,
    s.levels && `How people say where they are: ${s.levels}`,
    block('The kinds of it people choose between', s.disciplines),
    block('The sessions and exercises people do', s.sessions),
    block('What people build towards', s.goals),
    block('What people measure themselves by', s.benchmarks),
    block('What holds people back, and what to respect', s.pains),
    block('What people already log with', s.tracks),
    block('The words people use', s.words),
  ]
    .filter(Boolean)
    .join('\n\n')
}
