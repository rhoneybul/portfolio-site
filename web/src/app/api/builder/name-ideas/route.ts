import {NextResponse} from 'next/server'
import {QUESTIONS, type Answers} from '@/app-builder/options'
import {claudeOn} from '@/app-builder/claude'
import {suggestNames} from '@/app-builder/names'
import {addressOf, limiter} from '@/app-builder/rate-limit'
import {Meter, metered} from '@/app-builder/cost'
import {PAUSED, builderPaused} from '@/app-builder/switch'

/**
 * The name round (app-builder/names.ts): names for an app whose owner isn't sure of theirs, each
 * checked, asked when they're asked whether they're sure. `without` holds the names already shown,
 * for another round. Off without ANTHROPIC_API_KEY (503: they keep the name they gave). A few an hour an address.
 */

export const maxDuration = 60

const PER_ADDRESS = {most: 6, window: 60 * 60_000}
const allowed = limiter()

export async function POST(request: Request) {
  if (!claudeOn()) return NextResponse.json({off: true}, {status: 503})
  if (await builderPaused()) return NextResponse.json(PAUSED, {status: 503})
  const body = (await request.json().catch(() => null)) as {answers?: Answers; without?: unknown} | null
  const answers = Object.fromEntries(QUESTIONS.map((q) => [q.key, String(body?.answers?.[q.key] ?? '').trim().slice(0, 600)])) as Answers
  const without = (Array.isArray(body?.without) ? body.without : []).map((n) => String(n).slice(0, 24)).slice(0, 30)
  if (!allowed(`address:${addressOf(request)}`, PER_ADDRESS)) return NextResponse.json({error: 'Suggested enough names for now.'}, {status: 429})

  const meter = new Meter()
  try {
    const ideas = await metered(meter, () => suggestNames(answers, Date.now() + (maxDuration - 10) * 1000, without))
    return NextResponse.json({ideas, spent: meter.spent})
  } catch (e) {
    console.warn('[builder] name ideas', e instanceof Error ? e.message : e)
    return NextResponse.json({error: 'Claude couldn’t suggest names this time.'}, {status: 502})
  }
}
