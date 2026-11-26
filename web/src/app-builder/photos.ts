/**
 * Photos for the visitor's app: Unsplash's only when its key is set (unsplash.ts); else Pexels' professional ones first when its key is set (pexels.ts),
 * then Commons' open-licence ones, best first (commons.ts), a dozen at most. Either can fail
 * without the other. Server only.
 */
import {searchCommons, type Found} from './commons'
import {pexelsOn, searchPexels} from './pexels'
import {searchUnsplash, unsplashOn} from './unsplash'

export type {Found}

/** Where the photos come from, for the photo step's note. */
export const photoSources = () => (unsplashOn() ? ['Unsplash'] : [...(pexelsOn() ? ['Pexels'] : []), 'Wikimedia Commons'])

export async function searchPhotos(q: string): Promise<Found[]> {
  // Unsplash alone whenever its key is set: the photos are the best there are, and one source keeps them alike.
  if (unsplashOn()) return searchUnsplash(q)
  const [stock, open] = await Promise.all([
    searchPexels(q).catch((e) => (console.warn('[photos] Pexels', e instanceof Error ? e.message : e), [] as Found[])),
    searchCommons(q).catch((e) => (console.warn('[photos] Commons', e instanceof Error ? e.message : e), [] as Found[])),
  ])
  if (!stock.length && !open.length) throw new Error('No photo search answered')
  // Pexels' professional photos alone when it found enough: Commons' are often off the subject
  // (a search for rowing found a child's bike), so they only fill in for a thin search.
  if (stock.length >= 4) return stock.slice(0, 12)
  return [...stock, ...open].slice(0, 12)
}
