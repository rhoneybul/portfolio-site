import {briefOf, readSubmission} from '@/app-builder/submissions'

/** The brief as plain markdown: what Claude reads to build the app (its page links here). */
export async function GET(_request: Request, {params}: {params: Promise<{id: string}>}) {
  const {id} = await params
  const s = await readSubmission(id)
  if (!s) return new Response('Not found.', {status: 404})
  return new Response(briefOf(s), {headers: {'Content-Type': 'text/markdown; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex'}})
}
