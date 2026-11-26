import {NextResponse, after} from 'next/server'
import {QUESTIONS, resolveOptions, type Answers} from '@/app-builder/options'
import {claudeOn} from '@/app-builder/claude'
import {cleanPhotos, planPrototype, signJob} from '@/app-builder/prototype'
import {saveJob} from '@/app-builder/prototypes'

/**
 * The first half of drawing a visitor's app: Claude plans the whole prototype from their answers
 * and the photos found for them, and the plan comes back signed, for /api/prototype/screen to draw
 * part by part. Off until ANTHROPIC_API_KEY is set (503, and the builder shows its quick sketch).
 * Each email and each address can plan a few a day, so the builder can't run up a bill.
 */

export const maxDuration = 300

const PER_EMAIL = {most: 3, window: 24 * 60 * 60_000}
const PER_ADDRESS = {most: 6, window: 60 * 60_000}

// One instance's memory: a soft limit, enough to stop a loop or a bored visitor.
const seen = new Map<string, number[]>()

function allowed(key: string, {most, window}: {most: number; window: number}) {
  const now = Date.now()
  const recent = (seen.get(key) ?? []).filter((t) => now - t < window)
  if (recent.length >= most) return false
  seen.set(key, [...recent, now])
  if (seen.size > 5_000) seen.clear()
  return true
}

export async function POST(request: Request) {
  if (!claudeOn()) return NextResponse.json({off: true}, {status: 503})
  const body = (await request.json().catch(() => null)) as {answers?: Answers; photos?: unknown} | null
  const keys = [...QUESTIONS.map((q) => q.key), 'photoCredit']
  const answers = Object.fromEntries(keys.map((k) => [k, String(body?.answers?.[k] ?? '').trim().slice(0, 600)])) as Answers
  const {options, errors} = resolveOptions(answers)
  if (errors.name || errors.email) return NextResponse.json({error: errors.name || errors.email}, {status: 400})

  const address = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  if (!allowed(`email:${answers.email.toLowerCase()}`, PER_EMAIL) || !allowed(`address:${address}`, PER_ADDRESS))
    return NextResponse.json({error: 'You’ve drawn a few today. Here’s the quick sketch instead.'}, {status: 429})

  try {
    const job = await planPrototype(options, answers, cleanPhotos(body?.photos), Date.now() + (maxDuration - 20) * 1000)
    after(() => saveJob(job))
    return NextResponse.json({job, token: signJob(job)})
  } catch (e) {
    console.warn('[prototype] plan', e instanceof Error ? e.message : e)
    return NextResponse.json({error: 'Claude couldn’t plan it this time.'}, {status: 502})
  }
}
