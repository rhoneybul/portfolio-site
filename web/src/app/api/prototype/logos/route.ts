import {NextResponse} from 'next/server'
import {QUESTIONS, resolveOptions, type Answers} from '@/app-builder/options'
import {claudeOn} from '@/app-builder/claude'
import {drawMarks} from '@/app-builder/logos'
import {addressOf, limiter} from '@/app-builder/rate-limit'

/**
 * The logo round, while the app is designed: Claude draws a few marks for an owner without a logo
 * (logos.ts), shown first on the building page, and the one picked is the app's icon everywhere.
 * Off without ANTHROPIC_API_KEY (503: the app keeps the icon its plan chooses). A few an hour an address.
 */

export const maxDuration = 90

const PER_ADDRESS = {most: 6, window: 60 * 60_000}
const allowed = limiter()

export async function POST(request: Request) {
  if (!claudeOn()) return NextResponse.json({off: true}, {status: 503})
  const body = (await request.json().catch(() => null)) as {answers?: Answers} | null
  const keys = [...QUESTIONS.map((q) => q.key), 'photoCredit', 'scheme']
  const answers = Object.fromEntries(keys.map((k) => [k, String(body?.answers?.[k] ?? '').trim().slice(0, 600)])) as Answers
  const {options, errors} = resolveOptions(answers)
  if (errors.name) return NextResponse.json({error: errors.name}, {status: 400})
  if (!allowed(`address:${addressOf(request)}`, PER_ADDRESS)) return NextResponse.json({error: 'Drawn enough logos for now.'}, {status: 429})

  try {
    return NextResponse.json({marks: await drawMarks(options, answers, Date.now() + (maxDuration - 15) * 1000)})
  } catch (e) {
    console.warn('[prototype] logos', e instanceof Error ? e.message : e)
    return NextResponse.json({error: 'Claude couldn’t draw logos this time.'}, {status: 502})
  }
}
