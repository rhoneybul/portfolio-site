import {NextResponse} from 'next/server'
import {toSlack} from '@/app-builder/slack'
import {builderLines, claimBooking, embedLines} from '@/booking/booking'

/**
 * The booking embed saying a call was booked (components/book-call.tsx). Pings Slack unless
 * Cal.com's webhook already has for this booking (claimBooking): a webhook that's set up but not
 * sending never leaves a booking unseen.
 */

// One instance's memory: one ping per booking, and a page that loops can't flood the channel.
const seen = new Map<string, number>()

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null
  if (!body) return NextResponse.json({error: 'Not JSON.'}, {status: 400})

  const key = String(body.uid ?? body.startTime ?? '').slice(0, 100)
  if (!key) return NextResponse.json({error: 'Which booking?'}, {status: 400})
  if (Date.now() - (seen.get(key) ?? 0) < 10 * 60_000) return NextResponse.json({ok: true})
  seen.set(key, Date.now())
  if (!(await claimBooking(key))) return NextResponse.json({ok: true})

  await toSlack([...embedLines(body), ...(await builderLines(body.ref))])
  return NextResponse.json({ok: true})
}
