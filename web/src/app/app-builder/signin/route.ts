import {NextResponse} from 'next/server'
import {SESSION, SESSION_DAYS, emailOfToken, sessionCookie} from '@/app-builder/visitor'

/**
 * The link in an app builder email: signs that email in on this browser (visitor.ts) and goes on to
 * the page it was for, one of their apps or "Your apps". A link that has run out, or was changed,
 * goes to "Your apps", which asks for the email again.
 */

const safeNext = (next: string | null) => (next && /^\/app-builder\/(p\/[a-f0-9]{32}|mine)$/.test(next) ? next : '/app-builder/mine')

export async function GET(request: Request) {
  const url = new URL(request.url)
  const email = emailOfToken(url.searchParams.get('t') ?? undefined)
  const res = NextResponse.redirect(new URL(email ? safeNext(url.searchParams.get('next')) : '/app-builder/mine?expired=1', url))
  if (email) res.cookies.set(SESSION, sessionCookie(email), {httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: SESSION_DAYS * 86_400})
  return res
}
