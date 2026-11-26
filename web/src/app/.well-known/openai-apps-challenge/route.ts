/**
 * ChatGPT's domain check for the app builder's listing: the token the OpenAI platform shows when
 * the app is submitted, set as OPENAI_APPS_CHALLENGE (Doppler, synced to Vercel). 404 until it is.
 */
export const dynamic = 'force-dynamic'

export function GET() {
  const token = process.env.OPENAI_APPS_CHALLENGE?.trim()
  if (!token) return new Response('Not found', {status: 404})
  return new Response(token, {headers: {'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store'}})
}
