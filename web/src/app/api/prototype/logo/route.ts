import {NextResponse, after} from 'next/server'
import {signJob, verifyJob, withMark, type Job} from '@/app-builder/prototype'
import {cleanMarkPath} from '@/app-builder/prototype-doc'
import {saveJob} from '@/app-builder/prototypes'

/**
 * A different logo picked while the app is drawn: set on a plan this server signed, saved, and
 * signed again, so every screen and the saved prototype use the one picked.
 */

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {job?: Job; token?: string; d?: unknown} | null
  const job = body?.job
  if (!job || typeof job !== 'object' || !/^[a-f0-9]{32}$/.test(String(job.id)) || !verifyJob(job, String(body?.token ?? '')))
    return NextResponse.json({error: 'Not a plan from here.'}, {status: 403})
  const d = cleanMarkPath(body?.d)
  if (!d) return NextResponse.json({error: 'Not a logo.'}, {status: 400})
  const changed = withMark(job, d)
  after(() => saveJob(changed))
  return NextResponse.json({job: changed, token: signJob(changed)})
}
