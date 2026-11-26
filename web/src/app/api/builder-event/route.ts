import {NextResponse} from 'next/server'
import {QUESTIONS, resolveOptions, type Answers} from '@/app-builder/options'
import {appLines, esc, toSlack} from '@/app-builder/slack'
import {toEmail} from '@/app-builder/email'
import {saveSubmission, submissionsOn} from '@/app-builder/submissions'
import {isPrototypeId} from '@/app-builder/prototypes'
import {siteUrl} from '@/site-url'

/**
 * What people do in the app builder, for Fohm only. A finished build and a lead are saved whole
 * (app-builder/submissions.ts) and the Fohm Slack channel gets a summary with a link to the
 * submission's page, where the brief for Claude is. A tap on WhatsApp is just a ping. Nothing
 * comes back to the visitor but ok.
 */
const EVENTS = {
  used: ':hammer_and_wrench: Someone built an app in the app builder',
  whatsapp: ':speech_balloon: Someone tapped WhatsApp from the app builder',
  interest: ':raised_hand: Someone wants to build their app with Fohm',
} as const

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/

// One instance's memory: enough to stop a page that loops from flooding the channel.
const recent = new Map<string, number>()

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    event?: string
    answers?: Answers
    contact?: {name?: string; email?: string; note?: string; website?: string}
    ref?: string
    prototype?: string
  } | null
  const event = body?.event as keyof typeof EVENTS
  if (!event || !(event in EVENTS)) return NextResponse.json({error: 'Unknown event.'}, {status: 400})
  // The form's hidden field: a person never fills it in.
  if (body?.contact?.website) return NextResponse.json({ok: true})

  const keys = [...QUESTIONS.map((q) => q.key), 'photoCredit']
  const answers = Object.fromEntries(keys.map((k) => [k, String(body?.answers?.[k] ?? '').trim().slice(0, 600)])) as Answers
  const contact = {
    name: String(body?.contact?.name ?? '').trim().slice(0, 100),
    email: String(body?.contact?.email ?? '').trim().slice(0, 200),
    note: String(body?.contact?.note ?? '').trim().slice(0, 1000),
  }
  if (event === 'used' && !EMAIL.test(answers.email ?? '')) return NextResponse.json({error: 'An email address, please.'}, {status: 400})
  if (event === 'interest' && !EMAIL.test(contact.email)) return NextResponse.json({error: 'An email address, so I can get back to you.'}, {status: 400})

  const key = `${event}:${answers.name}:${answers.email}:${contact.email}`
  if (Date.now() - (recent.get(key) ?? 0) < 60_000) return NextResponse.json({ok: true})
  recent.set(key, Date.now())

  const {options} = resolveOptions(answers)
  // The prototype Claude drew for them, if it did: its id, never its contents.
  const prototype = isPrototypeId(String(body?.prototype ?? '')) ? String(body?.prototype) : undefined
  let id = ''
  let notSaved = 'BLOB_READ_WRITE_TOKEN isn’t set.'
  if ((event === 'used' || event === 'interest') && submissionsOn()) {
    try {
      id = await saveSubmission(event, answers, event === 'interest' ? contact : undefined, prototype, String(body?.ref ?? ''))
    } catch (error) {
      console.error('[builder] save', error)
      notSaved = `the save failed: ${error instanceof Error ? error.message : String(error)}`
    }
  }

  const page = id ? `${siteUrl}/app-builder/submissions/${id}` : ''
  const lines = [
    EVENTS[event],
    ...(event === 'interest'
      ? [`*${esc(contact.name || 'No name given')}* · ${esc(contact.email)}`, ...(contact.note ? [`> ${esc(contact.note)}`] : [])]
      : answers.email
        ? [`From ${esc(answers.email)}`]
        : []),
    ...appLines(options, answers),
    ...(page ? [`<${page}|Open the submission>${prototype ? ` · <${page}/prototype|The prototype Claude drew>` : ' · _the quick sketch: Claude didn’t draw one_'} · <${page}/brief|The brief for Claude>`] : event === 'whatsapp' ? [] : [`_Not saved: ${esc(notSaved)}_`]),
  ]
  // Slack hears everything; a note left to build it together is emailed too, with a reply going to them.
  await Promise.all([toSlack(lines), event === 'interest' ? toEmail(`App builder: ${options.name}, from ${contact.name || contact.email}`, lines, contact.email) : null])
  return NextResponse.json({ok: true})
}
