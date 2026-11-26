/**
 * Tells the Fohm Slack channel what people do in the app builder: an incoming webhook
 * (SLACK_WEBHOOK_URL, made in the Fohm workspace for the channel). Never throws, and does nothing
 * until the webhook is set, so the builder never waits on Slack or breaks without it.
 */
import {type Answers, type Options} from './options'

export const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/** One labelled line of a message: left out when it has no value. */
export type Row = [label: string, value: string | undefined | null | false]

/**
 * A Slack message that reads at a glance: a bold title, a blank line, then one short labelled
 * line each, then the links on a line of their own. No quotes, which run lines together.
 */
export function message(title: string, rows: Row[], links: [label: string, url: string][] = []) {
  const one = (v: string) => esc(v.replace(/\s+/g, ' ').trim())
  const body = rows.filter(([, v]) => v && String(v).trim()).map(([label, v]) => `*${label}:* ${one(String(v)).slice(0, 300)}`)
  const linkLine = links.filter(([, url]) => url).map(([label, url]) => `<${url}|${label}>`).join('  ·  ')
  return [`*${title}*`, '', ...body, ...(linkLine ? ['', linkLine] : [])]
}

/** The app in a few rows: its name and what it is, and the business behind it. */
export function appRows(o: Options, raw: Answers): Row[] {
  return [
    ['App', `${o.name}${raw.idea ? `: ${raw.idea}` : ''}`],
    ['Business', raw.business],
    ['Based in', raw.location && `${raw.location}${/\blondon\b/i.test(raw.location) ? ' :round_pushpin:' : ''}`],
    ['Audience', raw.audience],
  ]
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
