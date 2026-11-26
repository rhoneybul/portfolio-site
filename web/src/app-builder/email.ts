/**
 * Emails Fohm what Slack hears about the app builder's leads: a note left from Build it with me, and a call
 * booked. Slack first; email where it can, through Resend (RESEND_API_KEY, the shared key in Doppler, with
 * BUILDER_EMAIL_TO and BUILDER_EMAIL_FROM set in Doppler's portfolio-site-web project). Never throws, and does
 * nothing until all three are set, so a lead is never held up by email. Server only.
 */

/** Slack's mrkdwn as plain text: links as "text: url", bold and italics unwrapped, quotes kept as quotes. */
export function plainText(lines: string[]) {
  return lines
    .map((l) =>
      l
        .replace(/<([^|>]+)\|([^>]+)>/g, '$2: $1')
        .replace(/<(https?:[^>]+)>/g, '$1')
        .replace(/(^|\s)[*_]([^*_]+)[*_](?=\s|$|[.,;:])/g, '$1$2')
        .replace(/:[a-z_]+: ?/g, '')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&'),
    )
    .join('\n')
}

export const emailOn = () => Boolean(process.env.RESEND_API_KEY && process.env.BUILDER_EMAIL_TO && process.env.BUILDER_EMAIL_FROM)

/** Sends one plain-text email to Fohm; `replyTo` lets a reply go straight to the visitor. */
export async function toEmail(subject: string, lines: string[], replyTo?: string) {
  if (!emailOn()) return
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json'},
      body: JSON.stringify({
        from: process.env.BUILDER_EMAIL_FROM,
        to: process.env.BUILDER_EMAIL_TO,
        subject: subject.slice(0, 200),
        text: plainText(lines),
        ...(replyTo ? {reply_to: replyTo} : {}),
      }),
    })
    if (!res.ok) console.error('[email]', res.status)
  } catch (error) {
    console.error('[email]', error)
  }
}
