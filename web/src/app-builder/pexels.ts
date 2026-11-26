/**
 * Professional stock photos from Pexels, free to use and change, in an app too (pexels.com/license),
 * searched by this site's server with PEXELS_API_KEY (in Doppler's portfolio-site-web project,
 * synced to Vercel). Off until the key is set: the builder then finds Commons' photos alone.
 * Each is credited to its photographer, and the photo step says the photos come from Pexels, as
 * its API asks. Server only.
 */
import type {Found} from './commons'

export const pexelsOn = () => Boolean(process.env.PEXELS_API_KEY)

type Photo = {url: string; photographer: string; alt?: string; src: {large2x: string; medium: string}}

/** Landscape photos for a search, a dozen at most; none when the key isn't set. */
export async function searchPexels(q: string): Promise<Found[]> {
  const key = process.env.PEXELS_API_KEY
  if (!key) return []
  const params = new URLSearchParams({query: q, per_page: '12', orientation: 'landscape'})
  const res = await fetch(`https://api.pexels.com/v1/search?${params}`, {headers: {Authorization: key}, signal: AbortSignal.timeout(8_000)})
  if (!res.ok) throw new Error(`Pexels ${res.status}`)
  const photos = ((await res.json()) as {photos?: Photo[]}).photos ?? []
  return photos
    .filter((p) => p.src?.large2x?.startsWith('https://images.pexels.com/'))
    .map((p) => ({url: p.src.large2x, thumb: p.src.medium, credit: `${p.photographer.replace(/[<>"]/g, '').slice(0, 80) || 'A photographer'} · Pexels`, page: p.url}))
}
