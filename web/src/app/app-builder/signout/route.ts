import {NextResponse} from 'next/server'
import {SESSION} from '@/app-builder/visitor'

/** Signs the email out of this browser, back to "Your apps". The apps this browser designed still open. */
export async function POST(request: Request) {
  const res = NextResponse.redirect(new URL('/app-builder/mine', request.url), 303)
  res.cookies.delete(SESSION)
  return res
}
