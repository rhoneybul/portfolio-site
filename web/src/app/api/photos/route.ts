import {NextResponse} from 'next/server'
import {searchCommons, type Found} from '@/app-builder/commons'

/**
 * Open-licence photos from Wikimedia Commons for one search (app-builder/commons.ts), for the app
 * builder's photo step and the prototype. Cached at Vercel's edge for a day and in this instance,
 * so a search asks Commons once; a failed search is never cached.
 */

const known = new Map<string, Found[]>()

export async function GET(request: Request) {
  const q = (new URL(request.url).searchParams.get('q') ?? '').replace(/\s+/g, ' ').trim().slice(0, 80)
  if (!q) return NextResponse.json({photos: []}, {status: 400})
  const key = q.toLowerCase()
  try {
    const photos = known.get(key) ?? (await searchCommons(q))
    if (known.size > 500) known.clear()
    known.set(key, photos)
    return NextResponse.json({photos}, {headers: {'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800'}})
  } catch (error) {
    console.warn('[photos] Commons search failed', q, error instanceof Error ? error.message : error)
    return NextResponse.json({photos: []}, {status: 502, headers: {'Cache-Control': 'no-store'}})
  }
}
