/**
 * Tells the Fohm Slack channel what people do in the app builder: an incoming webhook
 * (SLACK_WEBHOOK_URL, made in the Fohm workspace for the channel). Never throws, and does nothing
 * until the webhook is set, so the builder never waits on Slack or breaks without it.
 */
import {type Answers, type Options} from './options'

export const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/** The app in a few lines: what it is, for whom, and whose business. */
export function appLines(o: Options, raw: Answers) {
  return [
    `*${esc(o.name)}* · ${o.kind === 'coaching' ? (o.coach === 'yes' ? 'coaching, with a coach' : 'coaching, programs') : o.kind}`,
    raw.idea && `> ${esc(raw.idea)}`,
    raw.business && `Business: ${esc(raw.business)}`,
    raw.country && `Country: ${esc(raw.country)}`,
    raw.audience && `Audience: ${esc(raw.audience)}`,
    raw.sector && `Sector: ${esc(raw.sector)}`,
    raw.location && `Based in: ${esc(raw.location)}${/\blondon\b/i.test(raw.location) ? ' :round_pushpin: *London*' : ''}`,
  ].filter(Boolean) as string[]
}

export async function toSlack(lines: string[]) {
  const url = process.env.SLACK_WEBHOOK_URL
  if (!url) return
  try {
    const res = await fetch(url, {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({text: lines.join('\n')})})
    if (!res.ok) console.error('[slack]', res.status)
  } catch (error) {
    console.error('[slack]', error)
  }
}
