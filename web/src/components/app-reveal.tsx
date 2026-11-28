'use client'

import {useEffect, useRef, useState, type CSSProperties, type ReactNode} from 'react'
import {Arrow} from '@/components/arrow'
import {AppIcon} from '@/components/app-icon'
import {PrototypeFrame} from '@/components/prototype-frame'
import {nextSlide, type DeckProgress} from '@/components/showcase'
import {openBuild} from '@/components/build-dialog'
import type {Built} from '@/components/prototype-build'
import {onAccent, type Options} from '@/app-builder/options'
import {TYPE_FACES} from '@/app-builder/prototype-doc'
import {referencesIn} from '@/app-builder/references'
import {LogoChange} from '@/components/logo-change'
import type {Answers} from '@/app-builder/options'
import type {Style} from '@/app-builder/prototype-doc'

/**
 * The moment the visitor first sees their app: a dark stage where its icon, its name and then the
 * phone come up one after another, with a way to have it built right beside it. The page is taken
 * to the stage's top once, without a scroll animation, so nothing slides about under the reveal.
 * What Claude decided waits, folded, under it. Without Claude's prototype, `sketch` is the phone.
 */
export function AppReveal({
  options,
  app,
  sketch,
  note,
  onChange,
  onNew,
  answers,
  onIcon,
}: {
  options: Options
  app: Built | null
  sketch?: ReactNode
  note?: string | null
  onChange?: () => void
  /** Forgets this app and starts another from the first question. */
  onNew?: () => void
  /** The answers the logo ideas are drawn from: with `onIcon`, the logo can still be changed here. */
  answers?: Answers
  /** A new icon picked: the page shows it on every screen. */
  onIcon?: (icon: Style['icon']) => void
}) {
  const stage = useRef<HTMLElement>(null)
  useEffect(() => {
    stage.current?.scrollIntoView({block: 'start'})
  }, [])

  const style = app?.look.style
  const liked = referencesIn(options.inspiration).map((r) => r.name)
  const look = style
    ? [style.canvas === 'dark' ? 'A dark canvas' : 'A light canvas', `${TYPE_FACES[style.type].display} for titles`, `${style.corners === 'square' ? 'Square' : style.corners === 'round' ? 'Round' : 'Soft'} corners`, ...(liked.length ? [`After ${liked.join(' and ')}`] : [])]
    : []
  const phone = app ? app.units.filter((u) => app.plan.units.find((p) => p.id === u.id)?.frame === 'phone') : []
  const vars = {'--x-accent': options.accent, '--x-on-accent': onAccent(options.accent)} as CSSProperties

  return (
    <>
      <section ref={stage} className="reveal" style={vars} aria-labelledby="reveal-name">
        <div className="reveal__glow" aria-hidden />
        <div className="reveal__copy">
          <span className="reveal__kicker reveal__in" style={{'--i': 0} as CSSProperties}>
            {app ? 'Your app is ready' : 'Your app, as a quick sketch'}
          </span>
          <span className="reveal__icon">
            <AppIcon name={options.name} accent={options.accent} icon={style?.icon} size={88} />
          </span>
          {app && answers && onIcon && (
            <LogoChange options={options} answers={answers} build={app.build} marks={app.marks} icon={style?.icon} onIcon={onIcon} />
          )}
          <h2 id="reveal-name" className="reveal__name reveal__in" style={{'--i': 1} as CSSProperties}>
            {options.name}
          </h2>
          <p className="reveal__line reveal__in" style={{'--i': 2} as CSSProperties}>
            {options.tagline}
          </p>
          {look.length > 0 && (
            <ul className="reveal__look reveal__in" style={{'--i': 3} as CSSProperties} aria-label="Its look">
              {look.map((l) => (
                <li key={l}>{l}</li>
              ))}
            </ul>
          )}
          {note && <p className="reveal__note reveal__in" style={{'--i': 3} as CSSProperties}>{note}</p>}
          <div className="reveal__actions reveal__in" style={{'--i': 4} as CSSProperties}>
            <button type="button" className="btn btn-primary reveal__cta" onClick={nextSlide}>
              Start the tour: your landing page <Arrow />
            </button>
            <button type="button" className="text-btn reveal__change" onClick={openBuild}>
              Build {options.name} with Rob
            </button>
            {onChange && (
              <button type="button" className="text-btn reveal__change" onClick={onChange}>
                Change my answers
              </button>
            )}
            {onNew && (
              <button type="button" className="text-btn reveal__change" onClick={onNew}>
                Start a new app
              </button>
            )}
          </div>
        </div>
        <div className="reveal__phone">{phone.length ? <PrototypeFrame look={app!.look} units={phone} view="phone" title={`${options.name} on a phone`} notes /> : sketch}</div>
      </section>

      {app && app.plan.decisions.length > 0 && (
        <details className="calls">
          <summary className="calls__title">Why it looks like this</summary>
          {app.plan.summary && <p className="calls__summary">{app.plan.summary}</p>}
          <ul>
            {app.plan.decisions.map((d) => (
              <li key={d}>{d}</li>
            ))}
          </ul>
          <p className="calls__line">Any of it can change: these are the calls we’d go through with you first.</p>
        </details>
      )}
    </>
  )
}

/**
 * A bar always at the foot of the screen once the app is shown: the one thing to do next, in the
 * app's own colour, with Rob's free call as the big button.
 */
export function BuildBar({name, accent, children}: {name: string; accent?: string; children?: ReactNode}) {
  const vars = accent ? ({'--x-accent': accent, '--x-on-accent': onAccent(accent)} as CSSProperties) : undefined
  // It waits for the tour: once every slide is seen it stays, and till then it never covers the deck's own Next.
  const [shown, setShown] = useState(false)
  useEffect(() => {
    const onProgress = (e: Event) => {
      const {seen, total} = (e as CustomEvent<DeckProgress>).detail
      if (seen >= total) setShown(true)
    }
    window.addEventListener('fohm:deck-progress', onProgress)
    return () => window.removeEventListener('fohm:deck-progress', onProgress)
  }, [])
  if (!shown) return null
  return (
    <div className="build-bar" role="complementary" aria-label={`Build ${name}`} style={vars}>
      <p>
        <strong>Want {name} for real?</strong>
        <span>Rob builds it with you: web, App Store and Google Play. Book a free 15-minute call.</span>
      </p>
      <div className="build-bar__actions">
        {children}
        <button type="button" className="btn build-bar__go" onClick={openBuild}>
          Build {name} with Rob <Arrow />
        </button>
      </div>
    </div>
  )
}
