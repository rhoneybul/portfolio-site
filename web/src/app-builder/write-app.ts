import Anthropic from '@anthropic-ai/sdk'
import {zodOutputFormat} from '@anthropic-ai/sdk/helpers/zod'
import {z} from 'zod'
import type {Options} from './options'
import type {Written} from './written'

/**
 * Claude writes the visitor's app from their answers: the words every screen of the prototype
 * shows (the headline, onboarding's tiles and question, the goals, the path's levels, what the
 * people are called) and the Wikimedia Commons searches that fill its photo slots. Server only:
 * it reads ANTHROPIC_API_KEY. The visitor's own answers always win over what Claude writes.
 */

export const WrittenApp = z.object({
  tagline: z.string().describe('The landing page headline: under 60 characters, a promise in plain words, ending in a full stop.'),
  description: z.string().describe('Two sentences under the headline: what the app does, for whom, and what changes for them.'),
  interests: z.array(z.string()).describe('Five or six tiles for "What are you here for?" in onboarding: one or two words each.'),
  goals: z.string().describe('What people work towards, as "Category: First, Second, Third" with three real, named places, events or milestones.'),
  levels: z.string().describe('The path in three or four levels, as "Level name: skill, skill. Next level: skill, skill." Two or three skills each, a few words per skill.'),
  placing: z.string().describe('The one question onboarding asks to place someone on the path, ending in a question mark.'),
  memberWord: z.string().describe('What the people who use the app are called, singular and lower case: surfer, student, climber.'),
  ownerWord: z.string().describe('What the person or team who runs it is called, singular and lower case: coach, teacher, team.'),
  photoSearches: z.array(z.string()).describe('Four Wikimedia Commons searches, best first, each one to three plain English words naming something a camera can photograph for this app: an activity, a scene, a place. No abstract words, no brand names.'),
})

// The schema and the page's type stay one shape: this fails to compile if they drift.
const sameShape: Written = {} as z.infer<typeof WrittenApp>
void sameShape

const MODEL = 'claude-opus-5-5'

const SYSTEM = `You write the first prototype of a new app for a small business, from the owner's answers to a short questionnaire.
The prototype is a phone app with a landing page, onboarding, a home screen, a path or program of levels, and the owner's dashboard.
Write in plain, warm British English, second person, sentence case, no emoji, no hype ("revolutionise", "unlock", "journey").
Use the owner's own words, places and numbers wherever they gave them, and invent no facts about their business: no prices, awards or client counts.`

/** What the visitor told us, as lines Claude reads. Only what they answered. */
function brief(o: Options) {
  const lines: [string, string | undefined][] = [
    ['App name', o.name],
    ['What it does, for whom', o.idea],
    ['The business behind it', o.business],
    ['Kind of app', o.kind],
    ['What people do in it', o.doing],
    ['What people are there for', o.interests],
    ['What people work towards', o.goals],
    ['What they already publish', o.content],
    ['Their audience today', o.audience],
    ['Success in a year', o.ambition],
  ]
  return lines
    .filter(([, v]) => v?.trim())
    .map(([k, v]) => `${k}: ${v}`)
    .join('\n')
}

let client: Anthropic | null = null

/** Claude's prototype for these answers, or null when there's no key or Claude declines. Throws on an API failure. */
export async function writeApp(o: Options): Promise<Written | null> {
  if (!process.env.ANTHROPIC_API_KEY) return null
  client ??= new Anthropic()
  const response = await client.messages.parse(
    {
      model: MODEL,
      max_tokens: 4000,
      output_config: {effort: 'low', format: zodOutputFormat(WrittenApp)},
      system: SYSTEM,
      messages: [{role: 'user', content: `Write the prototype for this app.\n\n${brief(o)}`}],
    },
    {timeout: 45_000, maxRetries: 1},
  )
  if (response.stop_reason === 'refusal') return null
  return (response.parsed_output as Written | null) ?? null
}
