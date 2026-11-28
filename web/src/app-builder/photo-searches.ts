/**
 * The photo searches for a visitor's app, picked by Claude from everything they've said (the
 * photo step's, through /api/photo-ideas, and the build's, so both look for the same things).
 * When Claude can't be asked, the answers' own words (photoIdeas), each with the app's activity.
 * Server only.
 */
import {askClaude, claudeOn} from './claude'
import {ideaAnswers, photoIdeas, templateHint, tidy} from './photo-ideas'
import type {Answers} from './options'

const MODEL = 'claude-sonnet-5-5'

const ASK = `You pick photo searches for a new app's landing page, onboarding and home screen.
The photos come from a stock library (Unsplash), whose search matches plain, concrete words.
Reply with JSON only, like {"activity": "road cycling", "terms": ["road cycling", "peloton race", "cycling alpine pass", "road bike"]}:
"activity" is the sport or activity the app is about, in one to three plain words.
"terms" are four searches, best first, each one to three plain English words naming something a camera can photograph: the activity itself as its members do it, a scene, a place or the kit.
Every search names the activity, or kit that belongs to nothing else, so it can only find a photo of THIS app's world: "cricket batsman", never "batsman"; "cricket ground", never "ground" or "pitch"; "rowing river", never "river".
Never search for an event, a team, a league or a competition by name ("The Ashes", "County Championship", "Wimbledon"): the library reads them as plain words.
No abstract words (events, community, success, wellbeing), no app or brand names.`

export interface Searches {
  /** The sport or activity the app is about, for checking the photos found (photo-check.ts). */
  activity: string
  terms: string[]
}

/** What the visitor has said, a line each, for Claude. */
export function toldOf(answers: Answers) {
  const a = ideaAnswers(answers)
  return [
    a.name && `Name: ${a.name}`,
    a.idea && `What it does, for whom: ${a.idea}`,
    a.business && `The business behind it: ${a.business}`,
    templateHint(a) && `Closest kind of app: ${templateHint(a)}`,
    a.doing && `What people do in it: ${a.doing}`,
    a.interests && `What people are there for: ${a.interests}`,
    a.goals && `What people work towards: ${a.goals}`,
  ].filter(Boolean) as string[]
}

/** The searches from the answers alone: each one carries the subject, so "county second XI" is searched as "cricket county second XI". */
export function searchesFromAnswers(answers: Answers): Searches {
  const terms = photoIdeas(ideaAnswers(answers))
  const activity = terms[0] ?? ''
  return {activity, terms: tidy(terms.map((t, i) => (i === 0 || !activity || t.toLowerCase().includes(activity.toLowerCase()) ? t : `${activity} ${t}`)))}
}

// One instance's memory: the same answers never ask twice.
const known = new Map<string, Searches>()

/** Claude's searches; throws when Claude can't be asked or answers none. */
export async function claudeSearches(answers: Answers, deadline: number): Promise<Searches> {
  const told = toldOf(answers)
  if (!claudeOn() || !told.length) throw new Error('Nothing to ask Claude with')
  const key = JSON.stringify(ideaAnswers(answers))
  const hit = known.get(key)
  if (hit) return hit
  const text = await askClaude({model: MODEL, system: [ASK], user: told.join('\n'), maxTokens: 2_000, deadline})
  const json = JSON.parse(text.match(/\{[\s\S]*\}/)?.[0] ?? '{}') as {activity?: unknown; terms?: unknown}
  const terms = tidy(json.terms)
  if (!terms.length) throw new Error('No terms')
  const found = {activity: typeof json.activity === 'string' ? json.activity.trim().slice(0, 40) : '', terms}
  if (known.size > 500) known.clear()
  known.set(key, found)
  return found
}

/** Claude's searches, or the answers' when it can't be asked. Never throws. */
export async function photoSearches(answers: Answers, deadline: number): Promise<Searches & {from: 'claude' | 'answers'}> {
  try {
    return {...(await claudeSearches(answers, deadline)), from: 'claude'}
  } catch (e) {
    console.warn('[photos] searches from the answers instead of Claude', e instanceof Error ? e.message : e)
    return {...searchesFromAnswers(answers), from: 'answers'}
  }
}
