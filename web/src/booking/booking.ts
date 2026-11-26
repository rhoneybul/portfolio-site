/**
 * Calls booked through the site's Cal.com embed, told to the Fohm Slack channel.
 *
 * Two ways a booking reaches Slack:
 * - Cal.com's webhook (/api/cal-webhook), signed with CAL_WEBHOOK_SECRET: who booked, their email,
 *   when, and their note. The full story, for every booking, made on the site or not.
 * - The embed itself (/api/booking): the browser says a booking was made. Only when the webhook
 *   isn't set up yet, so a booking never goes unseen and never pings twice.
 */
import {createHmac, timingSafeEqual} from 'node:crypto'
import {appLines, esc} from '@/app-builder/slack'
import {resolveOptions} from '@/app-builder/options'
import {submissionOfRef} from '@/app-builder/submissions'
import {siteUrl} from '@/site-url'

export const webhookOn = () => Boolean(process.env.CAL_WEBHOOK_SECRET)

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
  BOOKING_CREATED: ':calendar: New call booked',
  BOOKING_RESCHEDULED: ':arrows_counterclockwise: Call rescheduled',
  BOOKING_CANCELLED: ':x: Call cancelled',
}

/** The Slack lines for a Cal.com webhook, or null for an event Slack needn't hear about. */
export function webhookLines(body: CalWebhook): string[] | null {
  const heading = HEADINGS[body.triggerEvent ?? '']
  if (!heading) return null
  const p = body.payload ?? {}
  const who = p.attendees?.[0] ?? {}
  const note = p.additionalNotes || String(p.responses?.notes?.value ?? '')
  return [
    heading,
    `*${esc(who.name || 'Someone')}*${who.email ? ` · ${esc(who.email)}` : ''}`,
    [p.title && esc(p.title), whenOf(p.startTime)].filter(Boolean).join(' · '),
    who.timeZone && `Their time zone: ${esc(who.timeZone)}`,
    note && `> ${esc(note.slice(0, 600))}`,
  ].filter(Boolean) as string[]
}

/** The Slack lines for a booking the embed told us of: no name or email, which only the webhook carries. */
export function embedLines(b: {title?: unknown; startTime?: unknown; from?: unknown; page?: unknown}) {
  const title = String(b.title ?? '').slice(0, 200)
  const from = String(b.from ?? '').slice(0, 80)
  const page = String(b.page ?? '').slice(0, 120)
  return [
    ':calendar: New call booked through the website',
    [title && esc(title), whenOf(b.startTime)].filter(Boolean).join(' · '),
    (from || page) && `From ${esc(from || 'the site')}${page ? ` on ${esc(page)}` : ''}`,
    'Who booked is in Cal.com.',
  ].filter(Boolean) as string[]
}

/**
 * For a call booked from the app builder: the app they built and a link to their submission (its answers, the
 * prototype and the brief), found from the session's reference. Empty when it can't be found; a booking is never held
 * up by it.
 */
export async function builderLines(ref: unknown): Promise<string[]> {
  const submission = await submissionOfRef(String(ref ?? '')).catch((error) => {
    console.error('[booking] submission', error)
    return null
  })
  if (!submission) return []
  const page = `${siteUrl}/app-builder/submissions/${submission.id}`
  return [
    '*From the app builder*',
    ...appLines(resolveOptions(submission.answers).options, submission.answers),
    `<${page}|Open their submission> · <${page}/brief|The brief for Claude>`,
  ]
}
