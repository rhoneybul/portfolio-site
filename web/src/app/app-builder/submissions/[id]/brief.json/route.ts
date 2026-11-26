import {briefJson, readSubmission} from '@/app-builder/submissions'

/** The brief as JSON, for `fohm-scaffold new --from <this link>`: one command makes the app from it. */
export async function GET(_request: Request, {params}: {params: Promise<{id: string}>}) {
  const {id} = await params
  const s = await readSubmission(id)
  if (!s) return Response.json({error: 'Not found.'}, {status: 404})
  return Response.json(briefJson(s), {headers: {'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex'}})
}
