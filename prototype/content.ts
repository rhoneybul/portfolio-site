/**
 * One small Claude call that writes the app's own content from the visitor's answers: the levels
 * and their skills, the placing questions, a short library, onboarding's opening and the landing
 * page's words. Structured output, so it comes back as data that drops straight into the template.
 * Any failure (no key, a refusal, a bad response) returns null, and the job uses the answers as
 * they are instead: a prototype always builds.
 */
import Anthropic from '@anthropic-ai/sdk'
import {zodOutputFormat} from '@anthropic-ai/sdk/helpers/zod'
import {z} from 'zod'
import type {Options} from './options.ts'
import type {Content} from './fill.ts'

const line = z.string()
const Schema = z.object({
  hello: z.array(line),
  description: line,
  steps: z.array(z.object({title: line, body: line})),
  features: z.array(z.object({title: line, body: line})),
  levels: z.array(z.object({title: line, summary: line, skills: z.array(z.object({title: line, why: line, drills: z.array(line)}))})),
  assessment: z.array(z.object({question: line, answers: z.array(line)})),
  library: z.array(z.object({title: line, kind: z.enum(['video', 'drill', 'note']), body: line})),
})

const SYSTEM = `You write the starting content for a new app made from a template, from its owner's answers.
Plain English, sentence case, second person, no emoji, no hype. Never invent a statistic, a price, a person or a claim the answers don't support.
Keep the owner's own words for their levels and skills wherever they gave them.
Sizes: hello is 3 lines (the first is the key value as a question, each under 90 characters). description is one or two sentences, 140 to 160 characters. steps and features are 3 each, titles under 30 characters, bodies under 90. levels are 3 to 5, each with 2 or 3 skills, each skill with a one-line why and 2 short drills. assessment is 2 questions with 3 answers each, from least to most experienced. library is 3 items.`

/** Only the answers the content needs, so the request stays small. */
function brief(o: Options) {
  const keep = ['name', 'idea', 'business', 'kind', 'coach', 'memberWord', 'ownerWord', 'tagline', 'description', 'keyValue', 'interests', 'firstNumber', 'week', 'goals', 'levels', 'placing', 'content'] as const
  return keep
    .filter((k) => o[k])
    .map((k) => `${k}: ${o[k]}`)
    .join('\n')
}

export async function contentFromClaude(o: Options): Promise<Content | null> {
  if (!process.env.ANTHROPIC_API_KEY) return null
  try {
    const client = new Anthropic({maxRetries: 1, timeout: 120_000})
    const response = await client.messages.parse({
      model: process.env.PROTOTYPE_MODEL || 'claude-opus-5-5',
      max_tokens: 4000,
      system: SYSTEM,
      // Low effort: this is short, well-specified writing, and the cost of each prototype stays small.
      output_config: {effort: 'low', format: zodOutputFormat(Schema)},
      messages: [{role: 'user', content: `The owner's answers:\n${brief(o)}`}],
    })
    console.log(`[content] ${response.usage.input_tokens} in, ${response.usage.output_tokens} out, ${response.stop_reason}`)
    if (response.stop_reason !== 'end_turn' || !response.parsed_output) return null
    const c = response.parsed_output
    return c.levels.length && c.assessment.length && c.hello.length ? c : null
  } catch (error) {
    if (error instanceof Anthropic.APIError) console.log(`[content] Claude said ${error.status}: ${error.message}`)
    else console.log(`[content] ${error instanceof Error ? error.message : error}`)
    return null
  }
}
