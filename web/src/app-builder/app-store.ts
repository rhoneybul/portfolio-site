/**
 * The App Store's own screenshots of an app on the look and feel question (references.ts), from
 * Apple's public search API: the pictures its makers publish to sell it, loaded from Apple, so the
 * visitor sees the real app and nothing is copied from Mobbin. Server only.
 */

interface Found {
  trackName?: string
  sellerName?: string
  userRatingCount?: number
  screenshotUrls?: string[]
  artworkUrl512?: string
  artworkUrl100?: string
}

/**
 * The app itself, not one named like it: its App Store name is the name, or the name and then a
 * colon or dash ("Runna: Running & Marathon"), or starts with it from a seller of that name.
 * "Calm Radar" isn't Calm. The most rated first.
 */
export function bestMatch(name: string, results: Found[]) {
  const wanted = name.toLowerCase()
  const named = results.filter((r) => {
    const track = (r.trackName ?? '').toLowerCase()
    if (track === wanted) return true
    if (!track.startsWith(wanted) || /[a-z0-9]/.test(track.charAt(wanted.length))) return false
    return /^\s*[:\-–—|]/.test(track.slice(wanted.length)) || (r.sellerName ?? '').toLowerCase().includes(wanted)
  })
  return named.filter((r) => r.screenshotUrls?.length).sort((a, b) => (b.userRatingCount ?? 0) - (a.userRatingCount ?? 0))[0]
}

/** Up to `most` of the app's iPhone screenshots and its icon, or none when the App Store can't be asked or has no such app. */
export async function appStoreListing(name: string, most = 8): Promise<{shots: string[]; icon: string}> {
  for (const country of ['gb', 'us']) {
    const url = `https://itunes.apple.com/search?${new URLSearchParams({term: name, entity: 'software', country, limit: '15'})}`
    const res = await fetch(url, {signal: AbortSignal.timeout(6_000), next: {revalidate: 86_400}}).catch(() => null)
    if (!res?.ok) continue
    const found = bestMatch(name, ((await res.json().catch(() => null)) as {results?: Found[]} | null)?.results ?? [])
    if (found) return {shots: found.screenshotUrls!.slice(0, most), icon: found.artworkUrl512 || found.artworkUrl100 || ''}
  }
  return {shots: [], icon: ''}
}

export const appStoreShots = async (name: string, most = 3) => (await appStoreListing(name, most)).shots
