import {NextResponse} from 'next/server'
import {expired, readChoices, readShare, saveChoices} from '@/app-builder/mcp-build'
import {readJob, readUnit} from '@/app-builder/prototypes'
import {cleanMarkPath} from '@/app-builder/prototype-doc'

/**
 * A build under way on the server, for its building page: GET says how far it has got (its status,
 * the logo round's marks and the one picked, the plan once there is one) and hands over the parts
 * drawn since the page last asked (`have` lists the ones it has). POST saves what the visitor
 * chooses while it builds: the mark they pick (used from the next part drawn) and where they heard
 * about Fohm. Found only by its id.
 */

export const dynamic = 'force-dynamic'

export async function GET(request: Request, {params}: {params: Promise<{id: string}>}) {
  const {id} = await params
  const share = await readShare(id)
  if (!share) return NextResponse.json({error: 'No such build.'}, {status: 404})
  if (expired(share)) return NextResponse.json({error: 'This link has expired.'}, {status: 410})
  const have = new Set((new URL(request.url).searchParams.get('have') ?? '').split(',').filter(Boolean))
  const [choices, job] = await Promise.all([readChoices(id).catch(() => ({})), share.prototype ? readJob(share.prototype) : Promise.resolve(null)])
  const fresh = (share.drawn ?? []).filter((u) => !have.has(u))
  // A part that can't be read is left out and said to be missing, so the page never waits on it.
  const read = share.prototype ? await Promise.all(fresh.map((u) => readUnit(share.prototype!, u))) : []
  const units = read.filter(Boolean)
  const missing = fresh.filter((_, i) => !read[i])
  return NextResponse.json(
    {
      status: share.status,
      parts: share.parts ?? 0,
      drawn: share.drawn ?? [],
      photos: share.photos.map(({url, credit}) => ({url, credit})),
      marks: share.marks ?? null,
      mark: (choices as {mark?: string}).mark ?? null,
      job: job ? {id: job.id, look: job.look, plan: job.plan} : null,
      units,
      missing,
      emailed: share.emailed ?? null,
      finished: Boolean(share.submission) || share.emailed !== undefined,
    },
    {headers: {'Cache-Control': 'no-store'}},
  )
}

export async function POST(request: Request, {params}: {params: Promise<{id: string}>}) {
  const {id} = await params
  const share = await readShare(id)
  if (!share) return NextResponse.json({error: 'No such build.'}, {status: 404})
  const body = (await request.json().catch(() => null)) as {mark?: unknown; heard?: unknown} | null
  const mark = body?.mark === undefined ? '' : cleanMarkPath(body.mark)
  if (body?.mark !== undefined && !mark) return NextResponse.json({error: 'Not a logo.'}, {status: 400})
  const heard = typeof body?.heard === 'string' ? body.heard.replace(/[<>]/g, '').trim().slice(0, 200) : undefined
  await saveChoices(id, {...(mark ? {mark} : {}), ...(heard !== undefined ? {heard} : {})})
  return NextResponse.json({ok: true})
}
