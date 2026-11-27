import {NextResponse, after} from 'next/server'
import {claudeOn} from '@/app-builder/claude'
import {PAUSED, builderPaused} from '@/app-builder/switch'
import {drawUnit, verifyJob, type Job} from '@/app-builder/prototype'
import {saveUnit} from '@/app-builder/prototypes'

/**
 * The second half: Claude draws one part of a planned prototype (a screen, or a short flow of
 * them) on the house kit. Only for a plan this server made and signed (/api/prototype/plan), and
 * only so many draws a plan, so it is never a way to use Claude for anything else.
 */

export const maxDuration = 300

// One instance's memory: draws so far, by plan.
const draws = new Map<string, number>()

export async function POST(request: Request) {
  if (!claudeOn()) return NextResponse.json({off: true}, {status: 503})
  if (await builderPaused()) return NextResponse.json(PAUSED, {status: 503})
  const body = (await request.json().catch(() => null)) as {job?: Job; token?: string; unit?: string} | null
  const job = body?.job
  if (!job || typeof job !== 'object' || !/^[a-f0-9]{32}$/.test(String(job.id)) || !verifyJob(job, String(body?.token ?? '')))
    return NextResponse.json({error: 'Not a plan from here.'}, {status: 403})
  const unit = job.plan.units.find((u) => u.id === body?.unit)
  if (!unit) return NextResponse.json({error: 'No such part.'}, {status: 400})

  const count = (draws.get(job.id) ?? 0) + 1
  if (count > job.plan.units.length * 2 + 2) return NextResponse.json({error: 'Drawn enough.'}, {status: 429})
  draws.set(job.id, count)
  if (draws.size > 2_000) draws.clear()

  try {
    const drawn = await drawUnit(job, unit.id, Date.now() + (maxDuration - 20) * 1000)
    after(() => saveUnit(job.id, drawn))
    return NextResponse.json({unit: drawn})
  } catch (e) {
    console.warn('[prototype] draw', unit.id, e instanceof Error ? e.message : e)
    return NextResponse.json({error: 'Claude couldn’t draw it this time.'}, {status: 502})
  }
}
