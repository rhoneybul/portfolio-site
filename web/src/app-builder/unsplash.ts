/**
 * Photos from Unsplash, searched by this site's server with UNSPLASH_ACCESS_KEY (an Unsplash
 * developer app's access key, in Doppler's portfolio-site-web project, synced to Vercel). When the
 * key is set, the builder uses Unsplash's photos only (photos.ts). As its API guidelines ask: the
 * photos are shown from Unsplash's own addresses, each credited to its photographer on Unsplash,
 * and a photo picked is told to Unsplash's download address (trackDownload). Server only.
 */
import type {Found} from './commons'

export const unsplashOn = () => Boolean(process.env.UNSPLASH_ACCESS_KEY)

/**
 * Unsplash allows so many searches an hour (50 for a new app, 5,000 once approved for
 * production), and says how many are left on every answer. When few are left, or it says none,
 * this instance stops asking until the hour is up, and the builder finds photos elsewhere.
 */
const KEEP = 3
let restingUntil = 0

/** Whether to ask Unsplash now: its key is set and it hasn't said it's nearly out. */
export const unsplashReady = () => unsplashOn() && Date.now() >= restingUntil

function heed(res: Response) {
  const left = Number(res.headers.get('x-ratelimit-remaining'))
  if (res.status === 403 || res.status === 429 || (Number.isFinite(left) && left <= KEEP)) {
    restingUntil = Date.now() + 60 * 60_000
    console.warn('[photos] Unsplash is nearly out of searches this hour: Pexels and Commons until it resets')
  }
}

const API = 'https://api.unsplash.com'
const UTM = 'utm_source=fohm_app_builder&utm_medium=referral'

type Photo = {
  urls: {regular: string; small: string}
  user: {name: string; links: {html: string}}
  links: {html: string; download_location: string}
}

const headers = () => ({Authorization: `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}`, 'Accept-Version': 'v1'})

/** Landscape photos for a search, a dozen at most; none when the key isn't set. */
export async function searchUnsplash(q: string): Promise<Found[]> {
  if (!unsplashReady()) return []
  const params = new URLSearchParams({query: q, per_page: '12', orientation: 'landscape', content_filter: 'high'})
  const res = await fetch(`${API}/search/photos?${params}`, {headers: headers(), signal: AbortSignal.timeout(8_000)})
  heed(res)
  if (!res.ok) throw new Error(`Unsplash ${res.status}`)
  const photos = ((await res.json()) as {results?: Photo[]}).results ?? []
  return photos
    .filter((p) => p.urls?.regular?.startsWith('https://images.unsplash.com/') && p.links?.download_location?.startsWith(`${API}/`))
    .map((p) => {
      const author = p.user.name.replace(/[<>"]/g, '').slice(0, 80) || 'A photographer'
      return {
        url: p.urls.regular,
        thumb: p.urls.small,
        credit: `Photo by ${author} on Unsplash`,
        page: `${p.links.html}?${UTM}`,
        author,
        profile: p.user.links.html?.startsWith('https://unsplash.com/') ? `${p.user.links.html}?${UTM}` : undefined,
        download: p.links.download_location,
      }
    })
}

/** Tells Unsplash a photo was picked: its API asks for this each time one is used. Only its own addresses. */
export async function trackDownload(download: string) {
  if (!unsplashOn() || !download.startsWith(`${API}/photos/`)) return
  await fetch(download, {headers: headers(), signal: AbortSignal.timeout(5_000)}).catch(() => null)
}
