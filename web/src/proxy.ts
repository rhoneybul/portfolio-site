import {NextResponse, type NextRequest} from 'next/server'
import {isOwner, keyFor, keyable, ownerOn, sameText} from '@/app-builder/owner'

/**
 * The app builder's submissions open only for the owner (app-builder/owner.ts): the password, or
 * for a brief or prototype, the key in its link. Until the password is set, they don't exist.
 */
export async function proxy(request: NextRequest) {
  if (!ownerOn()) return new NextResponse('Not found', {status: 404, headers: {'X-Robots-Tag': 'noindex'}})
  if (isOwner(request.headers.get('authorization'))) return NextResponse.next()

  const path = request.nextUrl.pathname
  const k = request.nextUrl.searchParams.get('k')
  if (k && keyable(path) && sameText(k, await keyFor(path))) return NextResponse.next()

  return new NextResponse('Only the owner can see this.', {
    status: 401,
    headers: {'WWW-Authenticate': 'Basic realm="Fohm app builder", charset="UTF-8"', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex'},
  })
}

export const config = {matcher: '/app-builder/submissions/:path*'}
