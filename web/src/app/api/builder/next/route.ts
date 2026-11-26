import {NextResponse} from 'next/server'
import {askClaude, claudeOn} from '@/app-builder/claude'
import {addressOf, limiter} from '@/app-builder/rate-limit'
import {cleanRequest, cleanTurn, fallbackNext, needsClaude, rowsFor, saidSoFar, type Next} from '@/app-builder/next-question'

/**
 * The app builder's next question, chosen by Claude from what the visitor has said so far
 * (claude-haiku-5-5 through Anthropic's API), like fohm-scaffold's discovery chat: the most
 * important row still to ask, in their words, with picks for their app. Its answer is checked
 * (cleanTurn), and on anything wrong, or without Claude, the next row comes from the fixed order.
 * Each address asks Claude at most PER_ADDRESS times an hour (a whole run is about 15); past that,
 * the fixed order carries on, so nobody is stopped mid-way and nobody can run up a bill.
 */

const PER_ADDRESS = {most: 60, window: 60 * 60_000}
const allowed = limiter()

const MODEL = 'claude-haiku-5-5'

const SYSTEM = `You run a short, friendly interview that gathers what's needed to design a first prototype of someone's app.
They answer one question to a screen. You choose the next question from the rows still to ask, given what they've said so far.

Choose:
- The most important row their answers make relevant, keeping roughly to the parts' order (part 1 the idea, part 2 how it works, part 3 how it looks and the practical bits).
- Never ask what they've already told you. If an earlier answer already gives a row's answer, you may choose that row with a "prefill" for them to confirm; for a row with choices the prefill is one of its values.
- Rows their answers make pointless (no content to link for a brand-new idea, say) go in "skip". Never skip a row marked "Never skip".

Word it:
- "ask": the row's question reworded in their world, using their words (their sport, their members, their business). One short question, plain English, no emoji, under 120 characters.
- "why": one short line on why it's asked or what it becomes, under 160 characters.
- "suggestions": three or four short example answers tailored to their app (a few words each), only for rows answered by typing that don't have their own suggestions. For a row answered as a comma-separated list, give four to six, each a single item with no comma (they can pick several).

Reply with JSON only:
{"key": "doing", "ask": "...", "why": "...", "suggestions": ["...", "..."], "prefill": "...", "skip": ["content"]}
Leave out "prefill", "suggestions" or "skip" when they don't apply.`

// One instance's memory: the same answers never ask twice.
const known = new Map<string, Next>()

export async function POST(request: Request) {
  const {answers, done} = cleanRequest(await request.json().catch(() => null))
  const fallback = fallbackNext(answers, done)
  if (!claudeOn() || !needsClaude(answers, done)) return NextResponse.json({...fallback, from: 'order'})

  const cacheKey = JSON.stringify([answers, done])
  const cached = known.get(cacheKey)
  if (cached) return NextResponse.json({...cached, from: 'claude'})
  if (!allowed(`address:${addressOf(request)}`, PER_ADDRESS)) return NextResponse.json({...fallback, from: 'order'})

  try {
    const text = await askClaude({
      model: MODEL,
      system: [SYSTEM],
      user: `What they've said so far:\n${saidSoFar(answers, done) || '- Nothing yet'}\n\nThe rows still to ask:\n${rowsFor(answers, done)}`,
      maxTokens: 1_500,
      deadline: Date.now() + 12_000,
    })
    const turn = cleanTurn(JSON.parse(text.match(/\{[\s\S]*\}/)?.[0] ?? '{}'), answers, done)
    if (known.size > 500) known.clear()
    known.set(cacheKey, turn)
    return NextResponse.json({...turn, from: 'claude'})
  } catch (e) {
    console.warn('builder/next: the fixed order instead of Claude', e instanceof Error ? e.message : e)
    return NextResponse.json({...fallback, from: 'order'})
  }
}
