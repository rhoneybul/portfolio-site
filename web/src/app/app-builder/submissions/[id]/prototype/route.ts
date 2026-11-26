import {readSubmission} from '@/app-builder/submissions'
import {readPrototype} from '@/app-builder/prototypes'
import {prototypeDocument, type Frame} from '@/app-builder/prototype-doc'

/**
 * The prototype Claude drew for a submission, as the visitor tapped through it: ?view=laptop for
 * the owner's dashboard. Served sandboxed (its own opaque origin), never cached or indexed, and
 * found only by the link in Slack, like the submission.
 */

export const dynamic = 'force-dynamic'

const CSP = [
  'sandbox allow-scripts',
  "default-src 'none'",
  "img-src https: data:",
  "style-src 'unsafe-inline' https://fonts.googleapis.com",
  'font-src https://fonts.gstatic.com',
  "script-src 'unsafe-inline'",
].join('; ')

export async function GET(request: Request, {params}: {params: Promise<{id: string}>}) {
  const {id} = await params
  const s = await readSubmission(id)
  const saved = s?.prototype ? await readPrototype(s.prototype) : null
  if (!saved) return new Response('Not found', {status: 404})
  const asked = new URL(request.url).searchParams.get('view')
  const view: Frame = asked === 'laptop' || asked === 'web' ? asked : 'phone'
  return new Response(prototypeDocument({look: saved.job.look, units: saved.units, view}), {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Security-Policy': CSP,
      'Cache-Control': 'private, no-store',
      'X-Robots-Tag': 'noindex, nofollow',
      'Referrer-Policy': 'no-referrer',
    },
  })
}
