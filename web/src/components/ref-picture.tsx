'use client'

import {useEffect, useState} from 'react'
import {RefSketch} from '@/components/ref-sketch'

/**
 * One app on the look and feel question as it really looks: its App Store screenshots
 * (/api/builder/shots), asked once for the whole list. Until they come, or when the App Store
 * has none, its sketch. Decoration: the name and the line under it say what it is.
 */

type Listings = {shots: Record<string, string[]>; icons: Record<string, string>}
let asked: Promise<Listings> | null = null
const listings = () =>
  (asked ??= fetch('/api/builder/shots')
    .then((r) => (r.ok ? r.json() : {}))
    .then((b: Partial<Listings>) => ({shots: b.shots ?? {}, icons: b.icons ?? {}}))
    .catch((): Listings => ({shots: {}, icons: {}})))
const shotsByName = () => listings().then((l) => l.shots)

/** One reference's App Store screenshots and icon, once they've come: for its See screens. */
export function useListing(name: string) {
  const [listing, setListing] = useState<{shots: string[]; icon: string} | null>(null)
  useEffect(() => {
    let on = true
    void listings().then((l) => on && setListing({shots: l.shots[name] ?? [], icon: l.icons[name] ?? ''}))
    return () => {
      on = false
    }
  }, [name])
  return listing
}

export function RefPicture({name}: {name: string}) {
  const [shots, setShots] = useState<string[] | null>(null)
  const [broken, setBroken] = useState(false)
  useEffect(() => {
    let on = true
    void shotsByName().then((all) => on && setShots(all[name] ?? []))
    return () => {
      on = false
    }
  }, [name])

  if (!shots?.length || broken) return <RefSketch name={name} />
  return (
    <span className="ref-shots" aria-hidden>
      {shots.slice(0, 2).map((src) => (
        <img key={src} src={src} alt="" loading="lazy" decoding="async" width={62} height={134} onError={() => setBroken(true)} />
      ))}
    </span>
  )
}
