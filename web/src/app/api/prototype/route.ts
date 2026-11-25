import {randomBytes} from 'node:crypto'
import {NextResponse} from 'next/server'
import {QUESTIONS, resolveOptions, type Answers} from '@/app-builder/options'
import {makeApp} from '@/app-builder/make'
import {deploy, prototypesOn, underCap} from '@/app-builder/deploy'

// Downloading the scaffold, one Claude call and the upload: well under a minute, with room.
export const maxDuration = 300

/**
 * Makes a visitor's app with fohm-scaffold and starts Vercel building it as a working prototype.
 * Answers are checked as the builder checks them; only the builder's own questions are used, each
 * to a sensible length. Answers with the deployment's id, which the page then asks about.
 */
export async function POST(request: Request) {
  if (!prototypesOn()) return NextResponse.json({error: 'Building prototypes is off.'}, {status: 503})

  const body = (await request.json().catch(() => null)) as {answers?: Answers} | null
  const answers = Object.fromEntries(
    QUESTIONS.map((q) => [q.key, String(body?.answers?.[q.key] ?? '').slice(0, 600)]).filter(([, v]) => v),
  ) as Answers
  const {options, errors} = resolveOptions(answers)
  if (!answers.name || Object.keys(errors).length)
    return NextResponse.json({error: 'Some answers need another look.', fields: Object.keys(errors)}, {status: 400})

  try {
    if (!(await underCap())) return NextResponse.json({error: 'Lots of apps are being built right now. Try again in an hour.'}, {status: 429})
    const files = await makeApp(options, randomBytes(6).toString('hex'))
    const {id, url} = await deploy(files, {prototype: options.slug, kind: options.kind})
    return NextResponse.json({id, url})
  } catch (error) {
    console.error('[prototype] start', error)
    return NextResponse.json({error: 'The build couldn’t start. Try again in a minute.'}, {status: 502})
  }
}
