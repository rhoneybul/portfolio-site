import {NextResponse, after} from 'next/server'
import {QUESTIONS, resolveOptions, type Answers} from '@/app-builder/options'
import {claudeOn} from '@/app-builder/claude'
import {PAUSED, builderPaused} from '@/app-builder/switch'
import {cleanPhotos, planPrototype, signJob, withMark} from '@/app-builder/prototype'
import {cleanMarkPath} from '@/app-builder/prototype-doc'
import {readIdeaMarket, saveJob, saveMarket} from '@/app-builder/prototypes'
import {plain} from '@/app-builder/next-question'
import {subjectKey} from '@/app-builder/subject'
import {addressOf, limiter} from '@/app-builder/rate-limit'

/**
 * The first half of drawing a visitor's app: Claude plans the whole prototype from their answers
 * and the photos found for them, and the plan comes back signed, for /api/prototype/screen to draw
 * part by part. Off until ANTHROPIC_API_KEY is set (503, and the builder shows its quick sketch).
 * Each email and each address can plan a few a day, so the builder can't run up a bill.
 */

export const maxDuration = 300

const PER_EMAIL = {most: 3, window: 24 * 60 * 60_000}
const PER_ADDRESS = {most: 6, window: 60 * 60_000}

const allowed = limiter()

export async function POST(request: Request) {
  if (!claudeOn()) return NextResponse.json({off: true}, {status: 503})
  if (await builderPaused()) return NextResponse.json(PAUSED, {status: 503})
  const body = (await request.json().catch(() => null)) as {answers?: Answers; photos?: unknown; logo?: unknown} | null
  const keys = [...QUESTIONS.map((q) => q.key), 'photoCredit', 'scheme']
  const answers = Object.fromEntries(keys.map((k) => [k, String(body?.answers?.[k] ?? '').trim().slice(0, 600)])) as Answers
  const {options, errors} = resolveOptions(answers)
  if (errors.name || errors.email) return NextResponse.json({error: errors.name || errors.email}, {status: 400})

  const address = addressOf(request)
  if (!allowed(`email:${answers.email.toLowerCase()}`, PER_EMAIL) || !allowed(`address:${address}`, PER_ADDRESS))
    return NextResponse.json({error: 'You’ve drawn a few today. Here’s the quick sketch instead.'}, {status: 429})

  try {
    const planned = await planPrototype(options, answers, cleanPhotos(body?.photos), Date.now() + (maxDuration - 20) * 1000)
    // The logo they picked from the logo round, when they have none of their own: their icon on every screen.
    const logo = cleanMarkPath(body?.logo)
    const job = logo ? withMark(planned, logo) : planned
    after(async () => {
      await saveJob(job)
      // The market researched while they answered (/api/builder/market) goes beside the prototype, for the deck's Market slide.
      const idea = plain(answers.idea, 600)
      const market = idea.length >= 12 ? await readIdeaMarket(subjectKey(idea)).catch(() => null) : null
      if (market) await saveMarket(job.id, market)
    })
    return NextResponse.json({job, token: signJob(job)})
  } catch (e) {
    console.warn('[prototype] plan', e instanceof Error ? e.message : e)
    return NextResponse.json({error: 'Claude couldn’t plan it this time.'}, {status: 502})
  }
}
