import {NextResponse} from 'next/server'
import {QUESTIONS, resolveOptions, type Answers} from '@/app-builder/options'
import {appLines, esc, toSlack} from '@/app-builder/slack'

/**
 * What people do in the app builder, sent to the Fohm Slack channel: someone finished the
 * questions and saw their app, took the brief, tapped WhatsApp, or left their details to hear back.
 */
const EVENTS = {
  used: ':hammer_and_wrench: Someone built an app in the app builder',
  brief: ':page_facing_up: Someone took the brief for Claude',
  whatsapp: ':speech_balloon: Someone tapped WhatsApp from the app builder',
  interest: ':raised_hand: Someone wants to build their app with Fohm',
} as const

// One instance's memory: enough to stop a page that loops from flooding the channel.
const recent = new Map<string, number>()

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    event?: string
    answers?: Answers
    contact?: {name?: string; email?: string; note?: string; website?: string}
  } | null
  const event = body?.event as keyof typeof EVENTS
  if (!event || !(event in EVENTS)) return NextResponse.json({error: 'Unknown event.'}, {status: 400})
  // The form's hidden field: a person never fills it in.
  if (body?.contact?.website) return NextResponse.json({ok: true})

  const answers = Object.fromEntries(QUESTIONS.map((q) => [q.key, String(body?.answers?.[q.key] ?? '').slice(0, 400)])) as Answers
  const contact = {
    name: String(body?.contact?.name ?? '').trim().slice(0, 100),
    email: String(body?.contact?.email ?? '').trim().slice(0, 200),
    note: String(body?.contact?.note ?? '').trim().slice(0, 1000),
  }
  if (event === 'interest' && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(contact.email))
    return NextResponse.json({error: 'An email address, so I can get back to you.'}, {status: 400})

  const key = `${event}:${answers.name}:${contact.email}`
  if (Date.now() - (recent.get(key) ?? 0) < 60_000) return NextResponse.json({ok: true})
  recent.set(key, Date.now())

  const {options} = resolveOptions(answers)
  await toSlack([
    EVENTS[event],
    ...(event === 'interest'
      ? [`*${esc(contact.name || 'No name given')}* · ${esc(contact.email)}`, ...(contact.note ? [`> ${esc(contact.note)}`] : [])]
      : []),
    ...appLines(options, answers),
  ])
  return NextResponse.json({ok: true})
}
