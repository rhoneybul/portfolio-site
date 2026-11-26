import {NextResponse} from 'next/server'
import {toSlack} from '@/app-builder/slack'
import {builderLines, claimBooking, signedByCal, webhookLines, type CalWebhook} from '@/booking/booking'

/**
 * Cal.com's webhook (Cal.com → Settings → Developer → Webhooks, subscriber URL
 * https://<site>/api/cal-webhook, with a secret saved as CAL_WEBHOOK_SECRET): each call booked,
 * rescheduled or cancelled goes to the Fohm Slack channel. Off until the secret is set, so nobody
 * else can post to the channel through it.
 */
export async function POST(request: Request) {
  const secret = process.env.CAL_WEBHOOK_SECRET
  if (!secret) return NextResponse.json({error: 'Not set up.'}, {status: 404})
  const raw = await request.text()
  if (!signedByCal(raw, request.headers.get('x-cal-signature-256'), secret)) {
    return NextResponse.json({error: 'Bad signature.'}, {status: 401})
  }
  let body: CalWebhook
  try {
    body = JSON.parse(raw)
  } catch {
    return NextResponse.json({error: 'Not JSON.'}, {status: 400})
  }
  // Cal.com's "Ping test" and events Slack needn't hear about: acknowledged, nothing sent.
  const lines = webhookLines(body)
  // A new booking pings once, whichever of this and the embed's route claims it first; a change or a cancellation always does.
  const fresh = body.triggerEvent !== 'BOOKING_CREATED' || (await claimBooking(String(body.payload?.uid ?? body.payload?.startTime ?? '')))
  if (lines && fresh) await toSlack([...lines, ...(await builderLines(body.payload?.metadata?.ref))])
  return NextResponse.json({ok: true})
}
