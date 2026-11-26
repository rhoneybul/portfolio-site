import {NextResponse} from 'next/server'
import {keyedUrl} from '@/app-builder/owner'
import {appLines, esc, toSlack} from '@/app-builder/slack'
import {resolveOptions} from '@/app-builder/options'
import {keyedBriefUrl, readSubmission} from '@/app-builder/submissions'
import {startSession} from '@/app-builder/claude-session'
import {siteUrl} from '@/site-url'

/**
 * Start in Claude, from a submission's page: owner only (src/proxy.ts asks for the password, and this path takes no
 * key), and only from the page itself, so another site can't start sessions with the owner's saved password.
 * Back to the page, which shows the session's link.
 */
export async function POST(request: Request, {params}: {params: Promise<{id: string}>}) {
  const {id} = await params
  if (request.headers.get('origin') !== new URL(siteUrl).origin) return new NextResponse('Only from the submission’s page.', {status: 403})
  const s = await readSubmission(id)
  if (!s) return new NextResponse('Not found.', {status: 404})

  const page = `${siteUrl}/app-builder/submissions/${id}`
  try {
    const brief = await keyedBriefUrl(s)
    const started = await startSession(s, brief, await keyedUrl(`${siteUrl}/app-builder/submissions/${id}/brief.json`))
    await toSlack([':robot_face: A Claude session is building an app from the app builder', ...appLines(resolveOptions(s.answers).options, s.answers), `<${started.url}|Open the session> · <${page}|The submission>`])
    return NextResponse.redirect(page, 303)
  } catch (error) {
    const why = error instanceof Error ? error.message : 'It didn’t start.'
    console.error('[start]', why)
    await toSlack([`:warning: Start in Claude failed for a submission: ${esc(why)}`, `<${page}|The submission>`])
    return NextResponse.redirect(`${page}?start=failed`, 303)
  }
}
