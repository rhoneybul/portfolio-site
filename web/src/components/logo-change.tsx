'use client'

import {useState} from 'react'
import {AppIcon} from '@/components/app-icon'
import {addSpent} from '@/components/spent'
import type {Answers, Options} from '@/app-builder/options'
import type {Mark} from '@/app-builder/logos'
import type {Spend} from '@/app-builder/cost'
import type {Style} from '@/app-builder/prototype-doc'

/**
 * Changing the logo once the app is shown: the logo round's marks (and more drawn on asking), a tap
 * making one the icon on every screen. The pick is saved to the build, so its link and Your apps
 * show it too.
 */
export function LogoChange({
  options,
  answers,
  build,
  marks: drawn = [],
  icon,
  onIcon,
}: {
  options: Options
  answers: Answers
  /** The build on the server (its share id), which keeps the pick. */
  build?: string
  marks?: Mark[]
  icon?: Style['icon']
  onIcon: (icon: Style['icon']) => void
}) {
  const [open, setOpen] = useState(false)
  const [marks, setMarks] = useState<Mark[]>(drawn)
  const [drawing, setDrawing] = useState(false)
  const [failed, setFailed] = useState(false)
  const current = icon?.shape === 'svg' ? icon.d : undefined
  // The mark in use stays a choice even when it isn't among these (one drawn on the building page).
  const shown = current && !marks.some((m) => m.d === current) ? [{name: 'Your logo', idea: '', d: current}, ...marks] : marks

  const pick = (d: string) => {
    onIcon({shape: 'svg', letters: '', d})
    if (build) void fetch(`/api/prototype/build/${build}`, {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({mark: d})}).catch(() => {})
  }

  const drawMore = async () => {
    if (drawing) return
    setDrawing(true)
    setFailed(false)
    const res = await fetch('/api/prototype/logos', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({answers})}).catch(() => null)
    const answer = res?.ok ? ((await res.json().catch(() => null)) as {marks?: Mark[]; spent?: Spend} | null) : null
    addSpent(answer?.spent)
    const more = answer?.marks ?? []
    if (!more.length) setFailed(true)
    setMarks((had) => [...had, ...more.filter((m) => !had.some((h) => h.d === m.d))])
    setDrawing(false)
  }

  if (!open)
    return (
      <button type="button" className="text-btn reveal__change reveal__logo-open" onClick={() => setOpen(true)}>
        Change the logo
      </button>
    )

  return (
    <section className="reveal__logos" aria-label="Change the logo">
      {(shown.length > 0 || drawing) && (
        <ul>
          {shown.map((m, i) => (
            <li key={m.d}>
              <button type="button" aria-pressed={m.d === current} className={m.d === current ? 'is-on' : undefined} onClick={() => pick(m.d)} title={m.idea || undefined}>
                <AppIcon name={options.name} accent={options.accent} icon={{shape: 'svg', letters: '', d: m.d}} size={48} />
                <span>{m.name || `Idea ${i + 1}`}</span>
              </button>
            </li>
          ))}
          {drawing &&
            Array.from({length: 4}, (_, i) => (
              <li key={`more-${i}`} aria-hidden>
                <span className="reveal__logo-blank" />
              </li>
            ))}
        </ul>
      )}
      {failed && <p className="reveal__logos-line">The ideas didn’t come through this time.</p>}
      <div className="reveal__logos-actions">
        <button type="button" className="text-btn reveal__change" onClick={drawMore} disabled={drawing}>
          {drawing ? 'Drawing ideas…' : shown.length ? 'Draw more ideas' : 'Draw logo ideas'}
        </button>
        <button type="button" className="text-btn reveal__change" onClick={() => setOpen(false)}>
          Done
        </button>
      </div>
    </section>
  )
}
