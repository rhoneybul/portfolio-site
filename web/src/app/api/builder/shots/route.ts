import {NextResponse} from 'next/server'
import {appStoreShots} from '@/app-builder/app-store'
import {REFERENCES} from '@/app-builder/references'

/**
 * The App Store screenshots of every app on the look and feel question, by name: asked once a
 * day at Vercel's edge and in this instance. An app the App Store doesn't answer for has none,
 * and the builder draws its sketch instead.
 */

let known: {at: number; shots: Record<string, string[]>} | null = null
const DAY = 86_400_000

export async function GET() {
  if (!known || Date.now() - known.at > DAY) {
    const all = await Promise.all(REFERENCES.map(async (r) => [r.name, await appStoreShots(r.name)] as const))
    const shots = Object.fromEntries(all.filter(([, s]) => s.length))
    if (Object.keys(shots).length) known = {at: Date.now(), shots}
    else return NextResponse.json({shots: {}}, {headers: {'Cache-Control': 'no-store'}})
  }
  return NextResponse.json({shots: known.shots}, {headers: {'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800'}})
}
