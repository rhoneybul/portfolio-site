/**
 * Photos for the visitor's app: Unsplash's whenever its key is set and it can be asked
 * (unsplash.ts); otherwise, or when it finds none, Commons' open-licence ones, best first
 * (commons.ts), a dozen at most. Server only.
 */
import {searchCommons, type Found} from './commons'
import {searchUnsplash, unsplashReady} from './unsplash'

export type {Found}

/** Where the photos come from, for the photo step's note. */
export const photoSources = () => (unsplashReady() ? ['Unsplash'] : ['Wikimedia Commons'])

export async function searchPhotos(q: string): Promise<Found[]> {
  // Unsplash alone whenever it can be asked: the photos are the best there are, and one source keeps them alike.
  // Out of searches for the hour, or failing, Commons stands in.
  if (unsplashReady()) {
    const found = await searchUnsplash(q).catch((e) => (console.warn('[photos] Unsplash', e instanceof Error ? e.message : e), [] as Found[]))
    if (found.length) return found
  }
  const open = await searchCommons(q)
  if (!open.length) throw new Error('No photo search answered')
  return open.slice(0, 12)
}
