import {NextResponse} from 'next/server'
import {resolveOptions, type Answers} from '@/app-builder/options'
import {writeApp} from '@/app-builder/write-app'

/**
 * Claude writes the visitor's prototype from their answers (write-app.ts). Answers `{written}`,
 * null when there's no ANTHROPIC_API_KEY or Claude couldn't: the builder then draws the
 * prototype from the answers alone, so the page never waits on a failure.
 */

export const maxDuration = 60

// One instance's memory: the same answers are written once.
const known = new Map<string, unknown>()

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {answers?: Answers} | null
  const {options} = resolveOptions(body?.answers ?? {})
  if (!options.name) return NextResponse.json({written: null}, {status: 400})

  const key = JSON.stringify(body?.answers)
  if (known.has(key)) return NextResponse.json({written: known.get(key)})
  try {
    const written = await writeApp(options)
    if (written) {
      if (known.size > 200) known.clear()
      known.set(key, written)
    }
    return NextResponse.json({written})
  } catch (e) {
    console.warn('write-app: drawn from the answers instead of Claude', e instanceof Error ? e.message : e)
    return NextResponse.json({written: null})
  }
}
