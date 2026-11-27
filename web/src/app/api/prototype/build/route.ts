import {NextResponse, after} from 'next/server'
import {QUESTIONS, resolveOptions, type Answers} from '@/app-builder/options'
import {runBuild, startShare} from '@/app-builder/mcp-build'
import {cleanSpend} from '@/app-builder/cost'
import {addressOf, limiter} from '@/app-builder/rate-limit'
import {PAUSED, builderPaused} from '@/app-builder/switch'
import {client} from '@/sanity/client'
import {emailOn, LINK_DAYS} from '@/app-builder/email'

/**
 * Starts designing a visitor's app on the server (app-builder/mcp-build.ts, runBuild): the logo
 * round, photos, Claude's plan and every screen, in the background, so they can close the tab. It
 * answers at once with the build's id: the building page follows it (/api/prototype/build/<id>),
 * its link (/app-builder/p/<id>) opens it for seven days, and they're emailed that link when it's
 * done. Without ANTHROPIC_API_KEY the build is the quick sketch. Each email and each address can
 * build a few a day, and nothing starts while the builder is paused (switch.ts).
 */

export const maxDuration = 800

const PER_EMAIL = {most: 3, window: 24 * 60 * 60_000}
const PER_ADDRESS = {most: 6, window: 60 * 60_000}
const allowed = limiter()

const cleanFavourites = (v: unknown) =>
  (Array.isArray(v) ? v : [])
    .map((f: {url?: unknown; credit?: unknown}) => ({url: String(f?.url ?? ''), credit: String(f?.credit ?? '').slice(0, 200)}))
    .filter((f) => /^https:\/\/\S+$/.test(f.url) && f.url.length < 1000)
    .slice(0, 12)

export async function POST(request: Request) {
  if (await builderPaused()) return NextResponse.json(PAUSED, {status: 503})
  const body = (await request.json().catch(() => null)) as {answers?: Answers; favourites?: unknown; spent?: unknown; ref?: unknown} | null
  const keys = [...QUESTIONS.map((q) => q.key), 'photoCredit', 'scheme', 'nameCheck']
  const answers = Object.fromEntries(keys.map((k) => [k, String(body?.answers?.[k] ?? '').trim().slice(0, k === 'photo' ? 1000 : 600)])) as Answers
  const {errors} = resolveOptions(answers)
  if (errors.name || errors.email) return NextResponse.json({error: errors.name || errors.email}, {status: 400})
  if (!allowed(`email:${answers.email.toLowerCase()}`, PER_EMAIL) || !allowed(`address:${addressOf(request)}`, PER_ADDRESS))
    return NextResponse.json({error: 'You’ve designed a few today. Book a call and I’ll take you through it.'}, {status: 429})

  const ref = String(body?.ref ?? '')
  const bookingUrl = await client
    .fetch<string | null>(`*[_type == "siteSettings" && _id == "siteSettings"][0].bookingUrl`, {}, {signal: AbortSignal.timeout(2_500)})
    .catch(() => null)
  const share = await startShare(answers, 'web')
  after(() =>
    runBuild(share, answers, [], Date.now() + (maxDuration - 20) * 1000, {
      favourites: cleanFavourites(body?.favourites),
      ref: /^[a-f0-9]{32}$/.test(ref) ? ref : undefined,
      spentBefore: cleanSpend(body?.spent),
      bookingUrl,
    }),
  )
  return NextResponse.json({id: share.id, status: share.status, emailing: emailOn(), days: LINK_DAYS})
}
