/**
 * A soft limit on what the app builder asks Claude for, so it can't run up a bill: each key (an
 * email, an address) gets so many calls in a sliding window. One instance's memory, enough to
 * stop a loop or a bored visitor. Server only.
 */

export interface Limit {
  most: number
  window: number
}

export function limiter() {
  const seen = new Map<string, number[]>()
  return function allowed(key: string, {most, window}: Limit) {
    const now = Date.now()
    const recent = (seen.get(key) ?? []).filter((t) => now - t < window)
    if (recent.length >= most) return false
    seen.set(key, [...recent, now])
    if (seen.size > 5_000) seen.clear()
    return true
  }
}

/** The address a request came from, as Vercel passes it on. */
export const addressOf = (request: Request) => request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
