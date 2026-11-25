import {randomBytes} from 'node:crypto'
import {NextResponse} from 'next/server'
import {QUESTIONS, resolveOptions, type Answers} from '@/app-builder/options'
import {prototypeUrl, prototypesOn, startPrototype, underCap} from '@/app-builder/github'

/**
 * Starts building a visitor's app as a working prototype (.github/workflows/prototype.yml), and
 * answers with its id and the address it will be at. Answers are checked as the builder checks
 * them; only the builder's own questions are passed on, each to a sensible length.
 */
export async function POST(request: Request) {
  if (!prototypesOn()) return NextResponse.json({error: 'Building prototypes is off.'}, {status: 503})

  const body = (await request.json().catch(() => null)) as {answers?: Answers} | null
  const answers = Object.fromEntries(
    QUESTIONS.map((q) => [q.key, String(body?.answers?.[q.key] ?? '').slice(0, 600)]).filter(([, v]) => v),
  ) as Answers
  const {errors} = resolveOptions(answers)
  if (!answers.name || Object.keys(errors).length)
    return NextResponse.json({error: 'Some answers need another look.', fields: Object.keys(errors)}, {status: 400})

  try {
    if (!(await underCap())) return NextResponse.json({error: 'Lots of apps are being built right now. Try again in an hour.'}, {status: 429})
    const id = randomBytes(6).toString('hex')
    await startPrototype(id, answers)
    return NextResponse.json({id, url: prototypeUrl(id)})
  } catch (error) {
    console.error('[prototype] start', error)
    return NextResponse.json({error: 'The build couldn’t start. Try again in a minute.'}, {status: 502})
  }
}
