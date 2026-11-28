import {NextResponse} from 'next/server'
import {PLAN_MODEL, askClaudeWithSearch, claudeOn} from '@/app-builder/claude'
import {Meter, metered} from '@/app-builder/cost'
import {plain} from '@/app-builder/next-question'
import {readSubject, saveSubject} from '@/app-builder/prototypes'
import {addressOf, limiter} from '@/app-builder/rate-limit'
import {SUBJECT_SYSTEM, readSubject as readAnswer, subjectKey, subjectPrompt, type Subject} from '@/app-builder/subject'
import {builderPaused} from '@/app-builder/switch'

/**
 * The subject an app is about (app-builder/subject.ts), researched from the web as soon as the
 * visitor has said what their app does: the browser asks once and doesn't wait for it. Kept by the
 * idea's key, so the next questions (/api/builder/next), the prototype's plan and the brief all find
 * it there. Off without ANTHROPIC_API_KEY (503). A few an hour an address, one search at a time an idea.
 */

export const maxDuration = 120

const PER_ADDRESS = {most: 4, window: 60 * 60_000}
const allowed = limiter()
const underway = new Map<string, Promise<Subject>>()

function research(key: string, idea: string, business: string) {
  const meter = new Meter()
  return metered(meter, () =>
    askClaudeWithSearch({model: PLAN_MODEL(), system: [SUBJECT_SYSTEM], user: subjectPrompt(idea, business), maxTokens: 12_000, deadline: Date.now() + (maxDuration - 10) * 1000, searches: 6}),
  ).then(async (found) => {
    const subject = readAnswer(found.text, found.sources)
    await saveSubject(key, subject)
    console.info('[builder] subject', key, `$${meter.spent.usd.toFixed(2)}`)
    return subject
  })
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {idea?: unknown; business?: unknown} | null
  const idea = plain(body?.idea, 600)
  if (idea.length < 12) return NextResponse.json({error: 'Say what the app does first.'}, {status: 400})
  const key = subjectKey(idea)
  const kept = await readSubject(key).catch(() => null)
  if (kept) return NextResponse.json({subject: kept})
  if (!claudeOn() || (await builderPaused())) return NextResponse.json({error: 'Not researched this time.'}, {status: 503})

  let search = underway.get(key)
  if (!search) {
    if (!allowed(`address:${addressOf(request)}`, PER_ADDRESS)) return NextResponse.json({error: 'Researched enough for now.'}, {status: 429})
    search = research(key, idea, plain(body?.business, 600)).finally(() => underway.delete(key))
    underway.set(key, search)
  }
  try {
    return NextResponse.json({subject: await search})
  } catch (e) {
    console.warn('[builder] subject', e instanceof Error ? e.message : e)
    return NextResponse.json({error: 'It didn’t come back this time.'}, {status: 502})
  }
}
