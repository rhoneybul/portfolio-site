import {NextResponse} from 'next/server'
import {readShare} from '@/app-builder/mcp-build'
import {emailOn, sendEmail, signInEmail} from '@/app-builder/email'
import {appsOf, cleanEmail, emailKey, signInToken} from '@/app-builder/visitor'
import {addressOf, limiter} from '@/app-builder/rate-limit'
import {siteUrl} from '@/site-url'

/**
 * Asks for a link to sign in (visitor.ts): to one app (`next` is its page) or to "Your apps". The link
 * goes only to an email that has designed an app (that app, when it's one), so this can't be used to
 * send email to anyone. The answer is the same either way, so it never says whose apps are whose.
 */

const allowed = limiter()
const SAME = {ok: true, message: 'If that’s the email it was designed with, a link to sign in is on its way. It works for 7 days.'}

export async function POST(request: Request) {
  if (!emailOn()) return NextResponse.json({error: 'Signing in by email isn’t set up yet.'}, {status: 503})
  const body = (await request.json().catch(() => null)) as {email?: unknown; next?: unknown} | null
  const email = cleanEmail(String(body?.email ?? '')).slice(0, 200)
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return NextResponse.json({error: 'An email address, please.'}, {status: 400})
  if (!allowed(`address:${addressOf(request)}`, {most: 8, window: 60 * 60_000}) || !allowed(`email:${email}`, {most: 3, window: 60 * 60_000}))
    return NextResponse.json({error: 'That’s a few links already. Check your inbox, or try again in an hour.'}, {status: 429})

  const next = String(body?.next ?? '')
  const app = /^\/app-builder\/p\/([a-f0-9]{32})$/.exec(next)?.[1]
  const theirs = app ? (await readShare(app))?.owner === emailKey(email) : (await appsOf(email)).length > 0
  if (theirs) {
    const url = `${siteUrl}/app-builder/signin?${new URLSearchParams({t: signInToken(email), next: app ? next : '/app-builder/mine'})}`
    await sendEmail({to: email, ...signInEmail(url)})
  }
  return NextResponse.json(SAME)
}
