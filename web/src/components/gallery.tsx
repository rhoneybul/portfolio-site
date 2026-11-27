'use client'

import {useEffect, useRef, useState, type ReactNode} from 'react'
import {createPortal} from 'react-dom'

/**
 * Pictures to swipe through: a sideways strip that snaps a picture at a time, with arrows either
 * side, a count, and a fade where more is hidden, so it's plain there is more to see. A tap on a
 * picture opens it large (Lightbox). Used by the example apps and the look and feel references in
 * the app builder.
 */

export interface Slide {
  src: string
  /** What it shows, under it in the lightbox: "Landing page", "The app". */
  label?: string
  /** A screen on its side (a game's), rather than an upright phone screen. */
  wide?: boolean
}

/** Where a sideways strip is scrolled to: which edges still hide something, and the first in view. */
function useStrip() {
  const track = useRef<HTMLDivElement & HTMLUListElement>(null)
  const [edges, setEdges] = useState({start: false, end: false, first: 0})
  useEffect(() => {
    const el = track.current
    if (!el) return
    const measure = () => {
      const kids = [...el.children] as HTMLElement[]
      const first = Math.max(0, kids.findIndex((k) => k.offsetLeft + k.offsetWidth / 2 >= el.scrollLeft))
      setEdges({start: el.scrollLeft > 4, end: el.scrollLeft + el.clientWidth < el.scrollWidth - 4, first})
    }
    measure()
    el.addEventListener('scroll', measure, {passive: true})
    const seen = new ResizeObserver(measure)
    seen.observe(el)
    return () => {
      el.removeEventListener('scroll', measure)
      seen.disconnect()
    }
  }, [])
  const step = (dir: 1 | -1) => {
    const el = track.current
    if (!el) return
    const kid = el.children[0] as HTMLElement | undefined
    const by = kid ? kid.offsetWidth + 10 : el.clientWidth * 0.8
    el.scrollBy({left: dir * Math.max(by, el.clientWidth * 0.7), behavior: 'smooth'})
  }
  return {track, edges, step}
}

function Arrows({edges, step, label}: {edges: {start: boolean; end: boolean}; step: (d: 1 | -1) => void; label: string}) {
  return (
    <>
      <button type="button" className="strip__arrow strip__arrow--prev" onClick={() => step(-1)} disabled={!edges.start} aria-label={`Previous ${label}`}>
        <span aria-hidden>‹</span>
      </button>
      <button type="button" className="strip__arrow strip__arrow--next" onClick={() => step(1)} disabled={!edges.end} aria-label={`Next ${label}`}>
        <span aria-hidden>›</span>
      </button>
    </>
  )
}

/** A strip of pictures; a tap opens the one tapped, large. */
export function Gallery({slides, name}: {slides: Slide[]; name: string}) {
  const {track, edges, step} = useStrip()
  const [open, setOpen] = useState<number | null>(null)
  if (!slides.length) return null
  return (
    <div className={`strip gallery${edges.start ? ' has-start' : ''}${edges.end ? ' has-end' : ''}`}>
      <div className="strip__track gallery__track" ref={track}>
        {slides.map((s, i) => (
          <button
            key={s.src}
            type="button"
            className={`gallery__slide${s.wide ? ' is-wide' : ''}`}
            onClick={() => setOpen(i)}
            aria-label={`${name}: ${s.label ?? `picture ${i + 1}`}, open large`}
          >
            <img src={s.src} alt="" loading="lazy" decoding="async" width={s.wide ? 960 : 360} height={s.wide ? 540 : 715} />
            {s.label && <span className="gallery__label">{s.label}</span>}
          </button>
        ))}
      </div>
      <Arrows edges={edges} step={step} label="picture" />
      <span className="strip__count" aria-hidden>
        {Math.min(edges.first + 1, slides.length)} / {slides.length}
      </span>
      {open !== null && <Lightbox slides={slides} start={open} title={name} onClose={() => setOpen(null)} />}
    </div>
  )
}

/** A strip of anything (the reference cards): arrows, a fade and a hint while more is hidden to the side. */
export function Strip({children, label, className}: {children: ReactNode; label: string; className?: string}) {
  const {track, edges, step} = useStrip()
  return (
    <div className={`strip${edges.start ? ' has-start' : ''}${edges.end ? ' has-end' : ''}`}>
      <ul className={`strip__track ${className ?? ''}`} ref={track} aria-label={label}>
        {children}
      </ul>
      <Arrows edges={edges} step={step} label="apps" />
      {edges.end && !edges.start && (
        <span className="strip__hint" aria-hidden>
          Swipe for more →
        </span>
      )}
    </div>
  )
}

/**
 * Pictures large, over the page (a modal dialog on the body): swipe or use the arrows and keys, Escape or the cross to close.
 * `aside` sits beside them (the reference's look, a way to pick it).
 */
export function Lightbox({
  slides,
  start = 0,
  title,
  aside,
  onClose,
}: {
  slides: Slide[]
  start?: number
  title: string
  aside?: ReactNode
  onClose: () => void
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  const track = useRef<HTMLDivElement>(null)
  const [at, setAt] = useState(start)

  useEffect(() => {
    const d = dialog.current
    if (!d) return
    if (!d.open) d.showModal()
    const el = track.current
    const first = el?.children[start] as HTMLElement | undefined
    if (el && first) el.scrollLeft = first.offsetLeft - el.offsetLeft
    const close = () => onClose()
    d.addEventListener('close', close)
    return () => d.removeEventListener('close', close)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const el = track.current
    if (!el) return
    const measure = () => setAt(Math.round(el.scrollLeft / Math.max(1, el.clientWidth)))
    el.addEventListener('scroll', measure, {passive: true})
    return () => el.removeEventListener('scroll', measure)
  }, [])

  const go = (i: number) => {
    const el = track.current
    if (!el) return
    const n = Math.max(0, Math.min(slides.length - 1, i))
    el.scrollTo({left: n * el.clientWidth, behavior: 'smooth'})
  }

  // On the page's body, not inside the card that opened it: the card's own styles never reach it.
  return createPortal(
    <dialog
      ref={dialog}
      className="lightbox"
      aria-label={title}
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight') go(at + 1)
        if (e.key === 'ArrowLeft') go(at - 1)
      }}
      onClick={(e) => {
        // A tap on the dim backdrop closes it.
        if (e.target === dialog.current) dialog.current?.close()
      }}
    >
      <div className="lightbox__bar">
        <strong>{title}</strong>
        <span>
          {at + 1} / {slides.length}
          {slides[at]?.label ? ` · ${slides[at].label}` : ''}
        </span>
        <button type="button" className="lightbox__close" onClick={() => dialog.current?.close()} aria-label="Close">
          ×
        </button>
      </div>
      <div className={`lightbox__body${aside ? ' has-aside' : ''}`}>
        <div className="lightbox__stage">
          <div className="lightbox__track" ref={track}>
            {slides.map((s, i) => (
              <figure key={s.src} className={`lightbox__slide${s.wide ? ' is-wide' : ''}`} aria-hidden={i !== at}>
                <img src={s.src} alt={s.label ? `${title}: ${s.label}` : `${title}, picture ${i + 1}`} decoding="async" />
              </figure>
            ))}
          </div>
          <button type="button" className="lightbox__arrow lightbox__arrow--prev" onClick={() => go(at - 1)} disabled={at === 0} aria-label="Previous picture">
            ‹
          </button>
          <button
            type="button"
            className="lightbox__arrow lightbox__arrow--next"
            onClick={() => go(at + 1)}
            disabled={at >= slides.length - 1}
            aria-label="Next picture"
          >
            ›
          </button>
          <div className="lightbox__dots" aria-hidden>
            {slides.map((s, i) => (
              <i key={s.src} className={i === at ? 'is-on' : undefined} />
            ))}
          </div>
        </div>
        {aside && <div className="lightbox__aside">{aside}</div>}
      </div>
    </dialog>,
    document.body,
  )
}
