import {NextResponse} from 'next/server'
import {PLAN_MODEL, askClaudeWithSearch, claudeOn} from '@/app-builder/claude'
import {MARKET_SYSTEM, marketPrompt, readMarket as readAnswer, type Market} from '@/app-builder/market'
import {isPrototypeId, readJob, readMarket, saveMarket} from '@/app-builder/prototypes'
import {addressOf, limiter} from '@/app-builder/rate-limit'
import {Meter, metered} from '@/app-builder/cost'
import {PAUSED, builderPaused} from '@/app-builder/switch'

/**
 * The deck's Market slide (app-builder/market.ts) for a drawn prototype: the apps like it, how they
 * sell themselves and the gaps, found by Claude searching the web from the facts the prototype was
 * drawn from (never from what the request says, so nobody can plant research on someone else's
 * app). Found once and kept beside the prototype; after that the kept research comes back, free.
 * Off without ANTHROPIC_API_KEY (503). A few an hour an address, and one search at a time a prototype.
 */

export const maxDuration = 120

const PER_ADDRESS = {most: 4, window: 60 * 60_000}
const allowed = limiter()
// The research under way, per prototype on this instance, so two tabs share one search.
const underway = new Map<string, Promise<Market>>()

function research(id: string, facts: string) {
  const meter = new Meter()
  return metered(meter, () =>
    askClaudeWithSearch({model: PLAN_MODEL(), system: [MARKET_SYSTEM], user: marketPrompt(facts), maxTokens: 16_000, deadline: Date.now() + (maxDuration - 10) * 1000, searches: 8}),
  ).then(async (found) => {
    const market = readAnswer(found.text, found.sources)
    await saveMarket(id, market)
    console.info('[builder] market', id, `$${meter.spent.usd.toFixed(2)}`)
    return market
  })
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {id?: unknown} | null
  const id = typeof body?.id === 'string' && isPrototypeId(body.id) ? body.id : ''
  if (!id) return NextResponse.json({error: 'It comes with the build.'}, {status: 400})
  const kept = await readMarket(id).catch(() => null)
  if (kept) return NextResponse.json({market: kept})
  if (!claudeOn()) return NextResponse.json({error: 'It comes with the build: researched with sources before anything is designed.'}, {status: 503})
  if (await builderPaused()) return NextResponse.json(PAUSED, {status: 503})
  const job = await readJob(id).catch(() => null)
  if (!job) return NextResponse.json({error: 'It comes with the build.'}, {status: 404})

  let search = underway.get(id)
  if (!search) {
    if (!allowed(`address:${addressOf(request)}`, PER_ADDRESS)) return NextResponse.json({error: 'Researched enough for now.'}, {status: 429})
    search = research(id, job.facts).finally(() => underway.delete(id))
    underway.set(id, search)
  }
  try {
    return NextResponse.json({market: await search})
  } catch (e) {
    console.warn('[builder] market', e instanceof Error ? e.message : e)
    return NextResponse.json({error: 'It didn’t come back this time.'}, {status: 502})
  }
}
