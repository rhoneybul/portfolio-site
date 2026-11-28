import {NextResponse} from 'next/server'
import {PLAN_MODEL, askClaudeWithSearch, claudeOn} from '@/app-builder/claude'
import {MARKET_SYSTEM, ideaMarketPrompt, marketPrompt, readMarket as readAnswer, type Market} from '@/app-builder/market'
import {plain} from '@/app-builder/next-question'
import {isPrototypeId, readIdeaMarket, readJob, readMarket, saveIdeaMarket, saveMarket} from '@/app-builder/prototypes'
import {subjectKey} from '@/app-builder/subject'
import {addressOf, limiter} from '@/app-builder/rate-limit'
import {Meter, metered} from '@/app-builder/cost'
import {PAUSED, builderPaused} from '@/app-builder/switch'

/**
 * Market research (app-builder/market.ts): the apps like theirs, how close each comes, how they sell
 * themselves and the gaps, found by Claude searching the web. Two ways in:
 * - `{idea, business}`: in the conversation, as soon as they've said what the app does. Kept by the
 *   idea's key, so the chat's card, the next questions and the plan all find the same research.
 * - `{id}`: the deck's Market slide for a drawn prototype. The plan copies the idea's research beside
 *   it; a prototype without one is researched from the facts it was drawn from (never from what the
 *   request says, so nobody can plant research on someone else's app).
 * Found once and kept; after that it comes back free. Off without ANTHROPIC_API_KEY (503).
 * A few an hour an address, and one search at a time an idea or a prototype.
 */

export const maxDuration = 120

const PER_ADDRESS = {most: 4, window: 60 * 60_000}
const allowed = limiter()
// The research under way on this instance, so two tabs share one search.
const underway = new Map<string, Promise<Market>>()

type Body = {id?: unknown; idea?: unknown; business?: unknown} | null
type Found = {kept: Market} | {key: string; start: () => Promise<Market>} | {error: string; status: number}

function research(prompt: string, save: (m: Market) => Promise<unknown>, what: string) {
  const meter = new Meter()
  return metered(meter, () =>
    askClaudeWithSearch({model: PLAN_MODEL(), system: [MARKET_SYSTEM], user: prompt, maxTokens: 16_000, deadline: Date.now() + (maxDuration - 10) * 1000, searches: 8}),
  ).then(async (found) => {
    const market = readAnswer(found.text, found.sources)
    await save(market)
    console.info('[builder] market', what, `$${meter.spent.usd.toFixed(2)}`)
    return market
  })
}

/** The research kept for a prototype or an idea, or how to start it. */
async function marketFor(body: Body): Promise<Found> {
  const id = typeof body?.id === 'string' && isPrototypeId(body.id) ? body.id : ''
  if (id) {
    const kept = await readMarket(id).catch(() => null)
    if (kept) return {kept}
    const job = await readJob(id).catch(() => null)
    if (!job) return {error: 'It comes with the build.', status: 404}
    return {key: `prototype:${id}`, start: () => research(marketPrompt(job.facts), (m) => saveMarket(id, m), id)}
  }
  const idea = plain(body?.idea, 600)
  if (idea.length < 12) return {error: 'Say what the app does first.', status: 400}
  const key = subjectKey(idea)
  const kept = await readIdeaMarket(key).catch(() => null)
  if (kept) return {kept}
  return {key: `idea:${key}`, start: () => research(ideaMarketPrompt(idea, plain(body?.business, 600)), (m) => saveIdeaMarket(key, m), key)}
}

export async function POST(request: Request) {
  const found = await marketFor((await request.json().catch(() => null)) as Body)
  if ('kept' in found) return NextResponse.json({market: found.kept})
  if ('error' in found) return NextResponse.json({error: found.error}, {status: found.status})
  if (!claudeOn()) return NextResponse.json({error: 'It comes with the build: researched with sources before anything is designed.'}, {status: 503})
  if (await builderPaused()) return NextResponse.json(PAUSED, {status: 503})

  let search = underway.get(found.key)
  if (!search) {
    if (!allowed(`address:${addressOf(request)}`, PER_ADDRESS)) return NextResponse.json({error: 'Researched enough for now.'}, {status: 429})
    search = found.start().finally(() => underway.delete(found.key))
    underway.set(found.key, search)
  }
  try {
    return NextResponse.json({market: await search})
  } catch (e) {
    console.warn('[builder] market', e instanceof Error ? e.message : e)
    return NextResponse.json({error: 'It didn’t come back this time.'}, {status: 502})
  }
}
