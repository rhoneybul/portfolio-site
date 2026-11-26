'use client'

import {useEffect, useState} from 'react'
import {RefSketch} from '@/components/ref-sketch'

/**
 * One app on the look and feel question as it really looks: its App Store screenshots
 * (/api/builder/shots), asked once for the whole list. Until they come, or when the App Store
 * has none, its sketch. Decoration: the name and the line under it say what it is.
 */

let asked: Promise<Record<string, string[]>> | null = null
const shotsByName = () =>
  (asked ??= fetch('/api/builder/shots')
    .then((r) => (r.ok ? r.json() : {shots: {}}))
    .then((b: {shots?: Record<string, string[]>}) => b.shots ?? {})
    .catch((): Record<string, string[]> => ({})))

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
