import {NextResponse} from 'next/server'
import {checkName, type NameCheck} from '@/app-builder/name-check'
import {addressOf, limiter} from '@/app-builder/rate-limit'

/**
 * Whether the name a visitor gave their app is free to use (app-builder/name-check.ts): its
 * domains, the App Store and UK companies. Asked when they're asked whether they're sure of it.
 * A name is checked once in this instance; each address gets a few an hour.
 */

export const maxDuration = 20

const PER_ADDRESS = {most: 20, window: 60 * 60_000}
const allowed = limiter()
const known = new Map<string, {at: number; check: NameCheck}>()
const HOUR = 60 * 60_000

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {name?: unknown} | null
  const name = String(body?.name ?? '').replace(/[<>"]/g, '').replace(/\s+/g, ' ').trim().slice(0, 60)
  if (!name) return NextResponse.json({error: 'A name to check.'}, {status: 400})
  const key = name.toLowerCase()
  const hit = known.get(key)
  if (hit && Date.now() - hit.at < HOUR) return NextResponse.json(hit.check)
  if (!allowed(`address:${addressOf(request)}`, PER_ADDRESS)) return NextResponse.json({error: 'Checked enough names for now.'}, {status: 429})
  const check = await checkName(name)
  if (known.size > 500) known.clear()
  known.set(key, {at: Date.now(), check})
  return NextResponse.json(check)
}
