/**
 * Email from the app builder, through Resend's API (RESEND_API_KEY, with APP_BUILDER_FROM, a sender
 * on a domain verified in Resend, "Rob at Fohm <apps@send.fohm.io>" (send.fohm.io is verified in Resend)). Off until both are set:
 * nothing is sent and nothing fails. Used for one thing: telling a visitor their app is ready, with
 * its link. Server only.
 */
import {esc} from './slack'

export const emailOn = () => Boolean(process.env.RESEND_API_KEY && sender())

/**
 * Who the email is from: APP_BUILDER_FROM as an address ("Rob at Fohm <apps@send.fohm.io>"), or just
 * the sending domain ("send.fohm.io"), which is made into that address. Resend needs an address.
 */
export function sender() {
  const from = (process.env.APP_BUILDER_FROM ?? '').trim()
  if (!from) return ''
  if (from.includes('@')) return from
  const domain = from.replace(/^https?:\/\//, '').replace(/\/.*$/, '').toLowerCase()
  return /^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(domain) ? `Rob at Fohm <apps@${domain}>` : ''
}

/** How long a visitor's link to their app keeps working. */
export const LINK_DAYS = 7

export async function sendEmail({to, subject, text, html}: {to: string; subject: string; text: string; html: string}) {
  if (!emailOn()) return false
  try {
    // RESEND_BASE_URL: a stand-in when testing.
    const res = await fetch(`${(process.env.RESEND_BASE_URL || 'https://api.resend.com').replace(/\/+$/, '')}/emails`, {
      method: 'POST',
      headers: {Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json'},
      body: JSON.stringify({from: sender(), to: [to], reply_to: process.env.APP_BUILDER_REPLY_TO || undefined, subject, text, html}),
      signal: AbortSignal.timeout(10_000),
    })
    if (!res.ok) console.error('[email]', res.status, (await res.text().catch(() => '')).slice(0, 200))
    return res.ok
  } catch (error) {
    console.error('[email]', error)
    return false
  }
}

/** The email that signs someone in to see their apps (/app-builder/mine or one app's page). */
export function signInEmail(url: string) {
  const subject = 'Your link to your apps'
  const text = `Open your apps from the app builder: ${url}\n\nThe link signs you in on this device and works for 7 days. If you didn't ask for it, ignore this email.\n\nRob, Fohm`
  const html = `<div style="font:16px/1.5 -apple-system,Segoe UI,Helvetica,Arial,sans-serif;color:#161616;max-width:520px">
<p>Here's your link to the apps you designed with the app builder.</p>
<p><a href="${esc(url)}" style="display:inline-block;padding:12px 22px;border-radius:999px;background:#f4401b;color:#fff;font-weight:600;text-decoration:none">Open my apps</a></p>
<p style="color:#5f5f5f">It signs you in on this device and works for 7 days. If you didn't ask for it, ignore this email.</p>
<p>Rob, Fohm</p></div>`
  return {subject, text, html}
}

/** The email that says their app is ready: its link, how long it lasts, and a call to book. */
export function readyEmail({name, url, drawn, bookingUrl}: {name: string; url: string; drawn: boolean; bookingUrl?: string | null}) {
  const subject = drawn ? `${name} is ready to tap through` : `Your first look at ${name}`
  const lines = [
    drawn
      ? `Claude has finished designing ${name}: the landing page, onboarding, the screens your members use and your dashboard.`
      : `Claude couldn’t finish every screen of ${name} this time, so here is the quick sketch of it, with everything behind it.`,
    `Open it here: ${url}`,
    `The link works for ${LINK_DAYS} days, and opens only for this email address: it signs you in as you open it. Anyone else is asked to sign in with it.`,
    ...(bookingUrl ? [`When you want to build it for real, book a free call: ${bookingUrl}`] : []),
    'Rob, Fohm',
  ]
  const text = lines.join('\n\n')
  const html = `<div style="font:16px/1.5 -apple-system,Segoe UI,Helvetica,Arial,sans-serif;color:#161616;max-width:520px">
<p>${esc(lines[0])}</p>
<p><a href="${esc(url)}" style="display:inline-block;padding:12px 22px;border-radius:999px;background:#f4401b;color:#fff;font-weight:600;text-decoration:none">Open ${esc(name)}</a></p>
<p style="color:#5f5f5f">${esc(lines[2])}</p>
${bookingUrl ? `<p>When you want to build it for real, <a href="${esc(bookingUrl)}">book a free call</a>.</p>` : ''}
<p>Rob, Fohm</p></div>`
  return {subject, text, html}
}
