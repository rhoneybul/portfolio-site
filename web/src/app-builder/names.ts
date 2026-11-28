/**
 * The name round, for an owner not sure of their app's name: Claude suggests a few names from
 * what they've said, and from what they want of a name when they say (a feel, a language, a letter,
 * a length), each checked as their own name is (name-check.ts: domains, the App Store, UK
 * companies), clear ones first. Picking one makes it the app's name before anything is drawn.
 * A first look, not clearance: trade marks are still theirs to search. Server only.
 */
import {askClaude, ClaudeError, DRAW_MODEL} from './claude'
import {checkName, type NameCheck} from './name-check'
import type {Answers} from './options'

export interface NameIdea {
  name: string
  /** Why it fits, in a line. */
  idea: string
  check: NameCheck | null
}

const SYSTEM = `You are a naming consultant finding a name for a new health, fitness or wellness app.
Suggest six names.
When the owner says what they want from the name, that comes first: every name meets it, and it overrides any rule below it contradicts (a longer name, a real word in another language, a letter it starts with).
Otherwise, each:
- One or two short words, easy to say and spell after hearing it once, at most 12 letters.
- Ownable: an invented word, a compound or an unexpected real word, never a plain description ("Fitness Coach") and never an app or brand that already exists.
- Six genuinely different directions (within what the owner wants, if they said): from what members do, from the goal or the place, from a feeling, an invented word, a short real word used freshly, and one close to the working name if there is one worth keeping.
- No numbers, hyphens or puns that need explaining.

Reply as JSON: {"names": [{"name": "Tidepool", "idea": "Where surfers wait for the set: patient, steady training."}]}`

const NAMES_SCHEMA = {
  type: 'object',
  properties: {
    names: {
      type: 'array',
      items: {type: 'object', properties: {name: {type: 'string'}, idea: {type: 'string'}}, required: ['name', 'idea'], additionalProperties: false},
    },
  },
  required: ['names'],
  additionalProperties: false,
}

const plainText = (v: unknown, most: number) => (typeof v === 'string' ? v.replace(/[<>"]/g, '').replace(/\s+/g, ' ').trim().slice(0, most) : '')

/** Claude's names, checked: a name and a line each, none repeated, none already ruled out, six at most. */
export function parseNames(answer: string, without: string[] = []): Omit<NameIdea, 'check'>[] {
  const raw = JSON.parse(answer.slice(answer.indexOf('{'), answer.lastIndexOf('}') + 1)) as {names?: unknown}
  const seen = new Set(without.map((n) => n.toLowerCase()))
  const names = (Array.isArray(raw.names) ? raw.names : [])
    .map((n: Record<string, unknown>) => ({name: plainText(n?.name, 24), idea: plainText(n?.idea, 160)}))
    .filter((n) => n.name && !seen.has(n.name.toLowerCase()) && seen.add(n.name.toLowerCase()))
    .slice(0, 6)
  if (!names.length) throw new Error('No names in the answer')
  return names
}

/** What they've said about the app, for Claude to name it from. */
function brief(answers: Answers, without: string[], wants = '') {
  return [
    wants && `What they want from the name, which every name must meet: ${wants}`,
    answers.name && `The working name: ${answers.name}.`,
    answers.idea && `What it does, and for whom: ${answers.idea}`,
    answers.business && `The business: ${answers.business}`,
    answers.doing && `What people do in it: ${answers.doing}`,
    answers.goals && `What they work towards: ${answers.goals}`,
    answers.country && `Where it launches: ${answers.country}`,
    without.length && `Already suggested, so not these again: ${without.join(', ')}.`,
  ]
    .filter(Boolean)
    .join('\n')
}

/** Clear names first, then those with a free .com, keeping Claude's order otherwise. */
const rank = (i: NameIdea) => (i.check?.clear ? 0 : 2) + (i.check?.domains.find((d) => d.domain.endsWith('.com'))?.taken === false ? 0 : 1)

export async function suggestNames(answers: Answers, deadline: number, without: string[] = [], wants = ''): Promise<NameIdea[]> {
  let schema: Record<string, unknown> | undefined = NAMES_SCHEMA
  for (let attempt = 0; ; attempt++) {
    try {
      const names = parseNames(await askClaude({model: DRAW_MODEL(), system: [SYSTEM], user: brief(answers, without, wants), maxTokens: 1_500, deadline, schema}), without)
      const ideas = await Promise.all(names.map(async (n) => ({...n, check: await checkName(n.name).catch(() => null)})))
      return ideas.map((idea, i) => ({idea, i})).sort((a, b) => rank(a.idea) - rank(b.idea) || a.i - b.i).map(({idea}) => idea)
    } catch (e) {
      if (attempt >= 1 || deadline - Date.now() < 20_000) throw e
      if (e instanceof ClaudeError && e.status === 400) schema = undefined
      console.warn('[names] again:', e instanceof Error ? e.message : e)
    }
  }
}
