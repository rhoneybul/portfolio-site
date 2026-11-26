/**
 * Calls booked through the site's Cal.com embed, told to the Fohm Slack channel.
 *
 * Two ways a booking reaches Slack:
 * - Cal.com's webhook (/api/cal-webhook), signed with CAL_WEBHOOK_SECRET: who booked, their email,
 *   when, and their note. The full story, for every booking, made on the site or not.
 * - The embed itself (/api/booking): the browser says a booking was made.
 * Both claim the booking first (claimBooking), so whichever arrives first tells Slack and the other
 * stays quiet: a booking pings once, and is never lost to a webhook Cal.com isn't sending.
 */
import {createHmac, timingSafeEqual} from 'node:crypto'
import {put} from '@vercel/blob'
import {submissionsOn} from '@/app-builder/submissions'
import {appRows, message, type Row} from '@/app-builder/slack'
import {resolveOptions} from '@/app-builder/options'
import {submissionOfRef} from '@/app-builder/submissions'
import {siteUrl} from '@/site-url'

export const webhookOn = () => Boolean(process.env.CAL_WEBHOOK_SECRET)

// Without the Blob store (development), this instance's memory.
const claimed = new Set<string>()

/**
 * True for the first to claim a booking (by Cal.com's uid, or its start time): a marker blob that
 * can't be written twice. Shared by the webhook and the embed's route, on any instance.
 */
export async function claimBooking(uid: string) {
  const key = uid.replace(/[^A-Za-z0-9_-]/g, '').slice(0, 100)
  if (!key) return true
  if (!submissionsOn()) {
    if (claimed.has(key)) return false
    claimed.add(key)
    return true
  }
  try {
    await put(`bookings/${key}.json`, JSON.stringify({at: new Date().toISOString()}), {access: 'private', contentType: 'application/json', addRandomSuffix: false, allowOverwrite: false})
    return true
  } catch (error) {
    // Already there: the other way told Slack. Anything else: better twice than never.
    return !/already exists/i.test(error instanceof Error ? error.message : String(error))
  }
}

/** Cal.com signs the raw body: X-Cal-Signature-256 is its HMAC-SHA256, in hex, with the webhook's secret. */
export function signedByCal(rawBody: string, signature: string | null, secret: string) {
  if (!signature) return false
  const expected = createHmac('sha256', secret).update(rawBody).digest('hex')
  const a = Buffer.from(expected)
  const b = Buffer.from(signature.trim())
  return a.length === b.length && timingSafeEqual(a, b)
}

/** "Thu 3 Dec, 14:30" in London time, where Fohm is. */
export function whenOf(startTime: unknown) {
  const date = new Date(String(startTime ?? ''))
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/London',
  }).format(date) + ' (London)'
}

type Person = {name?: string; email?: string; timeZone?: string}
export type CalWebhook = {
  triggerEvent?: string
  payload?: {
    title?: string
    startTime?: string
    endTime?: string
    additionalNotes?: string
    attendees?: Person[]
    responses?: Record<string, {value?: unknown} | undefined>
    location?: string
    uid?: string
    /** What the site put on the booking (components/book-call.tsx): where it came from, and the builder session. */
    metadata?: {from?: string; ref?: string}
  }
}

const HEADINGS: Record<string, string> = {
  BOOKING_CREATED: ':calendar: Call booked',
  BOOKING_RESCHEDULED: ':arrows_counterclockwise: Call moved',
  BOOKING_CANCELLED: ':x: Call cancelled',
}

/** A booking in a few labelled rows, for Slack (slack.ts, message): who, when, and where it came from. */
export interface Booking {
  title: string
  rows: Row[]
}

/** A Cal.com webhook as a booking, or null for an event Slack needn't hear about. */
export function webhookBooking(body: CalWebhook): Booking | null {
  const heading = HEADINGS[body.triggerEvent ?? '']
  if (!heading) return null
  const p = body.payload ?? {}
  const who = p.attendees?.[0] ?? {}
  const note = p.additionalNotes || String(p.responses?.notes?.value ?? '')
  return {
    title: `${heading}${whenOf(p.startTime) ? `: ${whenOf(p.startTime)}` : ''}`,
    rows: [
      ['Who', [who.name, who.email].filter(Boolean).join(' · ')],
      ['Their time zone', who.timeZone],
      ['Their note', note.slice(0, 600)],
    ],
  }
}

/** A booking the embed told us of: no name or email, which only Cal.com's webhook carries. */
export function embedBooking(b: {startTime?: unknown; from?: unknown; page?: unknown}): Booking {
  const from = String(b.from ?? '').slice(0, 80)
  const page = String(b.page ?? '').slice(0, 120)
  return {
    title: `:calendar: Call booked${whenOf(b.startTime) ? `: ${whenOf(b.startTime)}` : ''}`,
    rows: [['Booked from', (from || page) && `${from || 'the site'}${page ? ` on ${page}` : ''}`]],
  }
}

/**
 * The Slack message for a booking, with the app they built when it came from the app builder (its
 * answers and a link to their submission), found from the session's reference. A booking is never
 * held up by the lookup.
 */
export async function bookingMessage(booking: Booking, ref: unknown): Promise<string[]> {
  const submission = await submissionOfRef(String(ref ?? '')).catch((error) => {
    console.error('[booking] submission', error)
    return null
  })
  if (!submission) return message(booking.title, booking.rows)
  const page = `${siteUrl}/app-builder/submissions/${submission.id}`
  const rows: Row[] = [...booking.rows, ...appRows(resolveOptions(submission.answers).options, submission.answers)]
  if (!booking.rows.some(([label, v]) => label === 'Who' && v)) rows.unshift(['Who', [submission.contact?.name, submission.contact?.email ?? submission.answers.email].filter(Boolean).join(' · ')])
  return message(booking.title, rows, [['Submission', page], ['Brief', `${page}/brief`]])
}
