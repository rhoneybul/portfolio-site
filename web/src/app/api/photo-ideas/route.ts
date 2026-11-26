import Anthropic from '@anthropic-ai/sdk'
import {zodOutputFormat} from '@anthropic-ai/sdk/helpers/zod'
import {NextResponse} from 'next/server'
import {z} from 'zod'
import {ideaAnswers, photoIdeas, templateHint, tidy} from '@/app-builder/photo-ideas'
import type {Answers} from '@/app-builder/options'

/**
 * Turns what a visitor has said about their app into a few photo searches, with Claude through
 * Anthropic's API (ANTHROPIC_API_KEY). If Claude can't be reached, the searches come from the
 * answers alone (photoIdeas), so the photo step always has something to show.
 */

const MODEL = 'claude-haiku-5-5'

const ASK = `You pick photo searches for a new app's landing page, onboarding and home screen.
The photos come from Wikimedia Commons, whose search matches words in file titles and descriptions, so plain, concrete words work best.
Give four searches, best first, each one to three plain English words naming something a camera can photograph: an activity, a scene, a place or an object.
No abstract words (events, community, success, wellbeing), no app or brand names.`

const Searches = z.object({terms: z.array(z.string()).describe('Four searches, best first.')})

// One instance's memory: the same answers never ask twice.
const known = new Map<string, string[]>()
let client: Anthropic | null = null

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {answers?: Answers} | null
  const a = ideaAnswers(body?.answers ?? {})
  const fallback = photoIdeas(a)
  const key = JSON.stringify(a)
  if (known.has(key)) return NextResponse.json({terms: known.get(key), from: 'claude'})

  const told = [
    a.name && `Name: ${a.name}`,
    a.idea && `What it does, for whom: ${a.idea}`,
    a.business && `The business behind it: ${a.business}`,
    templateHint(a) && `Closest kind of app: ${templateHint(a)}`,
    a.doing && `What people do in it: ${a.doing}`,
    a.interests && `What people are there for: ${a.interests}`,
    a.goals && `What people work towards: ${a.goals}`,
  ].filter(Boolean)
  if (!process.env.ANTHROPIC_API_KEY || !told.length) return NextResponse.json({terms: fallback, from: 'answers'})

  try {
    client ??= new Anthropic()
    const response = await client.messages.parse(
      {
        model: MODEL,
        max_tokens: 1000,
        output_config: {effort: 'low', format: zodOutputFormat(Searches)},
        system: ASK,
        messages: [{role: 'user', content: told.join('\n')}],
      },
      {timeout: 10_000, maxRetries: 0},
    )
    const terms = tidy(response.parsed_output?.terms)
    if (!terms.length) throw new Error(`No terms (${response.stop_reason})`)
    if (known.size > 500) known.clear()
    known.set(key, terms)
    return NextResponse.json({terms, from: 'claude'})
  } catch (e) {
    console.warn('photo-ideas: from the answers instead of Claude', e instanceof Error ? e.message : e)
    return NextResponse.json({terms: fallback, from: 'answers'})
  }
}
