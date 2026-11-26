'use client'

import {useEffect, type CSSProperties} from 'react'
import {useRouter} from 'next/navigation'
import {Arrow} from '@/components/arrow'
import {AppIcon} from '@/components/app-icon'
import {Showcase} from '@/components/showcase'
import {BookCall} from '@/components/book-call'
import {PrototypeFrame} from '@/components/prototype-frame'
import {Interest, callNote} from '@/components/app-builder'
import type {Built} from '@/components/prototype-build'
import {resolveOptions, type Answers} from '@/app-builder/options'
import type {ShareStatus} from '@/app-builder/mcp-build'

/**
 * An app designed from a chat (the MCP server), as the website's builder ends: while Claude draws it,
 * how far it has got (the page looks again every few seconds); then the deck with the prototype
 * Claude drew, or the quick sketch if it couldn't, and Build it with me. Embedded in the chat
 * (`embed`), just the phone and the form.
 */
export function SharedApp({
  id,
  answers,
  status,
  parts,
  drawn,
  photos,
  built,
  embed,
  whatsapp,
  bookingUrl,
}: {
  id: string
  answers: Answers
  status: ShareStatus
  parts: number
  drawn: number
  photos: {url: string; credit: string}[]
  built: Built | null
  embed?: boolean
  whatsapp?: string | null
  bookingUrl?: string | null
}) {
  const router = useRouter()
  const {options} = resolveOptions(answers)
  const building = status === 'photos' || status === 'planning' || status === 'drawing'

  useEffect(() => {
    if (!building) return
    const t = setInterval(() => router.refresh(), 6000)
    return () => clearInterval(t)
  }, [building, router])

  const accent = {'--x-accent': options.accent} as CSSProperties

  if (building)
    return (
      <div className="builder building" style={accent}>
        <header className="ready">
          <span className="ready__mark">
            <AppIcon name={options.name} accent={options.accent} />
          </span>
          <div>
            <span className="label">Claude is designing your app</span>
            <h2 className="ready__name">{options.name}</h2>
            <p className="ready__line">Every screen, from your answers. Usually 4 to 6 minutes. You can leave and come back: this link keeps it.</p>
          </div>
        </header>
        <ol className="building__steps" aria-live="polite">
          {(
            [
              ['Finding photos', 'Free-to-use photos that fit what you told us', status === 'photos'],
              ['Planning your app', 'The whole journey, from the landing page to your dashboard', status === 'planning'],
              ['Drawing every screen', parts ? `${drawn} of ${parts} parts done, five at a time` : 'Five at a time, each in the house style', status === 'drawing'],
            ] as const
          ).map(([title, line, on], i, all) => (
            <li key={title} className={on ? 'is-on' : all.findIndex((s) => s[2]) > i ? 'is-done' : undefined}>
              <strong>{title}</strong>
              <span>{line}</span>
            </li>
          ))}
        </ol>
      </div>
    )

  const message = `Hi Rob, I designed ${options.name} with your app builder. I’d like to build it with you.`
  const interest = (
    <section id="interest" className="manifest interest" aria-labelledby="interest-title">
      <h2 id="interest-title" className="manifest__title">
        Build {options.name} with me
      </h2>
      <p className="manifest__lead">
        I’ll take {options.name} from this prototype to the web, the App Store and Google Play. I’m in London. Book a free call,
        or leave your details and I’ll be in touch. Your answers come with it.
      </p>
      {(bookingUrl || whatsapp) && (
        <div className="interest__actions">
          {bookingUrl && <BookCall url={bookingUrl} label="Book a free call" from="app-builder-mcp" builderRef={id} prefill={{notes: callNote(options.name)}} />}
          {whatsapp && !embed && (
            <a className={`btn ${bookingUrl ? 'btn-outline' : 'btn-primary'}`} href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(message)}`} target="_blank" rel="noreferrer">
              Message me on WhatsApp <Arrow />
            </a>
          )}
        </div>
      )}
      <Interest answers={answers} prototype={built?.id} name={options.name} bookingUrl={bookingUrl} builderRef={id} />
    </section>
  )

  if (embed)
    return (
      <div className="builder builder--built shared--embed" style={accent}>
        {built ? <PrototypeFrame look={built.look} units={built.units.filter((u) => built.plan.units.find((p) => p.id === u.id)?.frame === 'phone')} view="phone" title={options.name} /> : <Showcase o={options} gallery={photos} built={null} />}
        {interest}
      </div>
    )

  return (
    <div className="builder builder--built">
      <header className="ready" style={accent}>
        <span className="ready__mark">
          <AppIcon name={options.name} accent={options.accent} icon={built?.look.style?.icon} />
        </span>
        <div>
          <span className="label">{built ? 'Your app, designed by Claude' : 'Your app, as a quick sketch'}</span>
          <h2 className="ready__name">{options.name}</h2>
          <p className="ready__line">{built?.plan.summary || options.tagline}</p>
        </div>
      </header>
      {built && built.plan.decisions.length > 0 && (
        <section className="calls" aria-labelledby="calls-title">
          <h3 id="calls-title" className="calls__title">
            What Claude decided for you
          </h3>
          <ul>
            {built.plan.decisions.map((d) => (
              <li key={d}>{d}</li>
            ))}
          </ul>
          <p className="calls__line">Any of it can change: these are the calls we’d go through with you first.</p>
        </section>
      )}
      <Showcase o={options} gallery={photos} built={built} />
      {interest}
    </div>
  )
}
