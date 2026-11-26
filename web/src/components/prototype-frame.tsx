'use client'

import {useEffect, useMemo, useRef, useState} from 'react'
import {SIZE, prototypeDocument, type Drawn, type Frame, type Look} from '@/app-builder/prototype-doc'

/**
 * Claude's prototype of the visitor's app, in a sandboxed frame (scripts only, no same origin:
 * nothing in it reaches the page), drawn at the real size of the phone or the laptop and scaled to
 * fit. Its screens are listed beside it, and a tap on one goes there.
 */

/** The width a box has, as it changes. */
function useWidth() {
  const ref = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const watch = new ResizeObserver(([e]) => setWidth(e.contentRect.width))
    watch.observe(el)
    return () => watch.disconnect()
  }, [])
  return [ref, width] as const
}

export function PrototypeFrame({look, units, view, title}: {look: Look; units: Drawn[]; view: Frame; title: string}) {
  const doc = useMemo(() => prototypeDocument({look, units, view}), [look, units, view])
  const frame = useRef<HTMLIFrameElement>(null)
  const [box, width] = useWidth()
  const [screens, setScreens] = useState<{id: string; title: string}[]>([])
  const [at, setAt] = useState('')
  const [round, setRound] = useState(0)
  const {w, h} = SIZE[view]
  const scale = width ? Math.min(1, width / w) : 0

  useEffect(() => {
    const hear = (e: MessageEvent) => {
      if (e.source !== frame.current?.contentWindow) return
      const d = e.data as {fohm?: string; id?: string; list?: {id: string; title: string}[]}
      if (d?.fohm === 'screens' && Array.isArray(d.list)) setScreens(d.list.slice(0, 60).map((s) => ({id: String(s.id), title: String(s.title).slice(0, 60)})))
      if (d?.fohm === 'at' && typeof d.id === 'string') setAt(d.id)
    }
    window.addEventListener('message', hear)
    return () => window.removeEventListener('message', hear)
  }, [])

  const go = (id: string) => frame.current?.contentWindow?.postMessage({fohm: 'go', id}, '*')

  return (
    <div className={`gen gen--${view}`}>
      <div className="gen__device">
        <div className="gen__screen" ref={box} style={{aspectRatio: `${w} / ${h}`}}>
          {scale > 0 && (
            <iframe
              key={round}
              ref={frame}
              title={title}
              srcDoc={doc}
              sandbox="allow-scripts"
              referrerPolicy="no-referrer"
              style={{width: w, height: h, transform: `scale(${scale})`}}
            />
          )}
        </div>
      </div>
      {screens.length > 1 && (
        <nav className="gen__screens" aria-label={`${title}: screens`}>
          {screens.map((s) => (
            <button key={s.id} type="button" className={s.id === at ? 'is-active' : undefined} aria-current={s.id === at ? 'true' : undefined} onClick={() => go(s.id)}>
              {s.title}
            </button>
          ))}
          <button type="button" className="gen__again" onClick={() => setRound(round + 1)}>
            Start again
          </button>
        </nav>
      )}
    </div>
  )
}

/** One drawn part, small and still: for the progress while the rest are drawn. */
export function PrototypeThumb({look, unit, view}: {look: Look; unit: Drawn; view: Frame}) {
  const doc = useMemo(() => prototypeDocument({look, units: [unit], view}), [look, unit, view])
  const [box, width] = useWidth()
  const {w, h} = SIZE[view]
  const scale = width ? width / w : 0
  return (
    <div className={`gen-thumb gen-thumb--${view}`} ref={box} style={{aspectRatio: `${w} / ${h}`}} aria-hidden>
      {scale > 0 && <iframe srcDoc={doc} sandbox="allow-scripts" tabIndex={-1} title="" style={{width: w, height: h, transform: `scale(${scale})`}} />}
    </div>
  )
}
