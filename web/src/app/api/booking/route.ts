import {NextResponse} from 'next/server'
import {toSlack} from '@/app-builder/slack'
import {builderLines, embedLines, webhookOn} from '@/booking/booking'

/**
 * The booking embed saying a call was booked (components/book-call.tsx). Pings Slack only while
 * Cal.com's webhook isn't set up: once it is, the webhook tells Slack, with who booked.
 */

// One instance's memory: one ping per booking, and a page that loops can't flood the channel.
const seen = new Map<string, number>()

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null
  if (!body) return NextResponse.json({error: 'Not JSON.'}, {status: 400})
  if (webhookOn()) return NextResponse.json({ok: true})

  const key = String(body.uid ?? body.startTime ?? '').slice(0, 100)
  if (!key) return NextResponse.json({error: 'Which booking?'}, {status: 400})
  if (Date.now() - (seen.get(key) ?? 0) < 10 * 60_000) return NextResponse.json({ok: true})
  seen.set(key, Date.now())

  await toSlack([...embedLines(body), ...(await builderLines(body.ref))])
  return NextResponse.json({ok: true})
}
