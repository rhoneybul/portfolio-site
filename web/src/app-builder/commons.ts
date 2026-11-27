/**
 * Open-licence photos from Wikimedia Commons, searched by this site's server. Commons rate-limits
 * anonymous browser searches hard (a visitor's build once found none, so Claude drew every photo
 * slot empty), so the server asks with a User-Agent that names the site, as Wikimedia's policy
 * asks, one search at a time per term, and the answers are cached.
 * Only licences the scaffold lets an app show (public domain, CC0, CC BY, CC BY-SA, with a named
 * author where the licence asks for one; never NC or ND), each with its author and licence, which
 * the brief carries as the credit. Server only.
 */

export interface Found {
  url: string
  thumb: string
  credit: string
  page: string
  /** The photographer's name and their profile, for a credit linked as Unsplash asks (components/photo-credit.tsx). */
  author?: string
  profile?: string
  /** Unsplash's download address for the photo, told when it's picked, as its API guidelines ask (unsplash.ts). */
  download?: string
}

const ALLOWED = /^(cc0|public domain|pd|cc by(-sa)?( \d\.\d)?)/i
const NAMELESS = /^(unknown|anonymous|unknown author)?$/i

const plain = (html: string) => html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()

// The file's path, without the ?utm_source=… Commons now adds to every imageinfo url.
const COMMONS = /^https:\/\/upload\.wikimedia\.org\/wikipedia\/commons\/(?:thumb\/)?([0-9a-f]\/[0-9a-f]{2}\/[^/?#]+)/

/**
 * A Commons file at a standard width. Commons refuses hotlinks at any other width (a 429 or a 400:
 * mediawiki.org/wiki/Common_thumbnail_sizes), which is why the grid's 320px thumbnails broke.
 */
export function atWidth(url: string, width: 330 | 500 | 960 | 1280, original: number) {
  const m = url.match(COMMONS)
  if (!m) return url
  if (original <= width) return `https://upload.wikimedia.org/wikipedia/commons/${m[1]}`
  return `https://upload.wikimedia.org/wikipedia/commons/thumb/${m[1]}/${width}px-${m[1].split('/').pop()}`
}

export const USER_AGENT = 'FohmAppBuilder/1.0 (https://www.fohm.io/app-builder)'

type Info = {url: string; width: number; descriptionurl: string; extmetadata?: Record<string, {value: string}>}

async function query(gsrsearch: string): Promise<Found[]> {
  const params = new URLSearchParams({
    action: 'query',
    format: 'json',
    generator: 'search',
    gsrsearch,
    gsrnamespace: '6',
    gsrlimit: '30',
    prop: 'imageinfo',
    iiprop: 'url|size|extmetadata',
    iiextmetadatafilter: 'LicenseShortName|Artist',
  })
  const res = await fetch(`https://commons.wikimedia.org/w/api.php?${params}`, {
    headers: {'User-Agent': USER_AGENT, 'Api-User-Agent': USER_AGENT},
    signal: AbortSignal.timeout(8_000),
  })
  if (!res.ok) throw new Error(`Commons ${res.status}`)
  const pages = Object.values(((await res.json()).query?.pages ?? {}) as Record<string, {index?: number; imageinfo?: Info[]}>)
  return pages
    .sort((x, y) => (x.index ?? 0) - (y.index ?? 0))
    .map((p) => p.imageinfo?.[0])
    .filter((i): i is Info => Boolean(i?.url))
    .map((i) => {
      const licence = plain(i.extmetadata?.LicenseShortName?.value ?? '')
      const author = plain(i.extmetadata?.Artist?.value ?? '').slice(0, 80)
      return {licence, author, found: {url: atWidth(i.url, 1280, i.width), thumb: atWidth(i.url, 500, i.width), credit: `${author || 'Unknown author'} · ${licence}`, page: i.descriptionurl}}
    })
    .filter(({licence, author}) => ALLOWED.test(licence) && !/\b(nc|nd)\b/i.test(licence) && (/^(cc0|public domain|pd)/i.test(licence) || !NAMELESS.test(author)))
    .map(({found}) => found)
    .slice(0, 12)
}


/**
 * Open-licence photos for a search: Commons' Quality images first (photos its reviewers judged
 * technically excellent, so far fewer phone snaps of a boat shed), then big JPEGs (photos, not
 * logos or diagrams), then any bitmap if there are none.
 */
export async function searchCommons(q: string): Promise<Found[]> {
  // One at a time (Commons rate-limits hard), and the second only when the best don't fill the grid.
  const best = await query(`hastemplate:"QualityImage" filetype:bitmap filemime:jpeg ${q}`).catch(() => [])
  const big = best.length >= 12 ? [] : await query(`filetype:bitmap filemime:jpeg filew:>1300 ${q}`).catch(() => [])
  const photos = [...best, ...big].filter((p, i, all) => all.findIndex((x) => x.url === p.url) === i).slice(0, 12)
  return photos.length ? photos : query(`filetype:bitmap ${q}`)
}
