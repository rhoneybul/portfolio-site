import {NextResponse} from 'next/server'
import {trackDownload} from '@/app-builder/unsplash'

/** A photo picked in the app builder: told to Unsplash's download address, as its API guidelines ask. */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {download?: unknown} | null
  await trackDownload(String(body?.download ?? ''))
  return NextResponse.json({ok: true})
}
