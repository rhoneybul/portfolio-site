'use client'

import {useEffect, useRef, useState, type CSSProperties, type FormEvent} from 'react'
import {Arrow} from '@/components/arrow'
import {Mark, goalsOf, type Pic} from '@/components/app-prototype'
import {PhotoSearch, ideasFor, mixed, search} from '@/components/photo-search'
import {Showcase} from '@/components/showcase'
import {ACCENTS, SECTIONS, asked, emptyAnswers, resolveOptions, type Answers, type Shots} from '@/app-builder/options'
import {withWritten, type Written} from '@/app-builder/written'

/**
 * The app builder: asks what a first look at the visitor's app needs, one question to a screen in
 * sections, with the scaffolder's own defaults; then walks them through their app as a deck (the
 * prototype with its logo and photos, the dashboard, alerts, metrics, monitoring, payments,
 * security, the stores), and ends on Build it with me. The full submission, with the brief for
 * Claude, goes to the Fohm Slack channel only (/api/builder-event): the visitor never sees it.
 */

type Phase = 'asking' | 'built'

const KEPT = 'fohm-app-builder'

export function AppBuilder({whatsapp, className}: {whatsapp?: string | null; className?: string}) {
  const [answers, setAnswers] = useState<Answers>(emptyAnswers)
  const [step, setStep] = useState(0)
  const [phase, setPhase] = useState<Phase>('asking')
  const [error, setError] = useState<string | null>(null)
  const [gallery, setGallery] = useState<Pic[]>([])
  // Claude's words for the prototype: undefined while it writes, null if it couldn't.
  const [written, setWritten] = useState<Written | null | undefined>(undefined)
  const input = useRef<HTMLInputElement & HTMLTextAreaElement>(null)
  const top = useRef<HTMLDivElement>(null)

  // Answers survive a refresh in this tab only.
  useEffect(() => {
    try {
      const kept = sessionStorage.getItem(KEPT)
      if (kept) setAnswers({...emptyAnswers(), ...JSON.parse(kept)})
    } catch {
      // No storage: start empty.
    }
  }, [])
  useEffect(() => {
    try {
      sessionStorage.setItem(KEPT, JSON.stringify(answers))
    } catch {
      // No storage: nothing kept.
    }
  }, [answers])

  const questions = asked(answers)
  const at = Math.min(step, questions.length - 1)
  const q = questions[at]
  const resolved = resolveOptions(answers)
  const errors = resolved.errors
  const options = withWritten(resolved.options, written ?? null)

  useEffect(() => {
    if (phase !== 'asking') return
    input.current?.focus({preventScroll: true})
    // On a phone, the next question starts in view: back up to it if the page had scrolled past.
    if ((top.current?.getBoundingClientRect().top ?? 0) < 0) top.current?.scrollIntoView({block: 'start', behavior: 'smooth'})
  }, [at, phase])

  // Claude writes the app from their answers (/api/write-app), then its photo searches fill every slot.
  useEffect(() => {
    if (phase !== 'built') return
    let live = true
    setWritten(undefined)
    setGallery([])
    fetch('/api/write-app', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({answers})})
      .then((r) => r.json())
      .then((r: {written?: Written | null}) => r.written ?? null)
      .catch(() => null)
      .then(async (w) => {
        if (!live) return
        setWritten(w)
        const ideas = w?.photoSearches.length ? w.photoSearches : await ideasFor(answers)
        const terms = [...ideas, ...goalsOf(withWritten(resolveOptions(answers).options, w))]
          .filter((t, i, all) => t && all.indexOf(t) === i)
          .slice(0, 6)
        const lists = await Promise.all(terms.map((t) => search(t).catch(() => [])))
        // The first of each search, then the second of each, so slots vary.
        if (live) setGallery(mixed(lists, 16).map((f) => ({url: f.url, credit: f.credit})))
      })
      .catch(() => {})
    return () => {
      live = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  // Once their app is drawn, the channel hears about it.
  useEffect(() => {
    if (phase === 'built') tell('used')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  /** Tells the Fohm Slack channel what happened (/api/builder-event). Never waits, never fails the page. */
  const tell = (event: 'used' | 'whatsapp') => {
    try {
      const body = JSON.stringify({event, answers})
      if (!navigator.sendBeacon?.('/api/builder-event', new Blob([body], {type: 'application/json'})))
        void fetch('/api/builder-event', {method: 'POST', headers: {'Content-Type': 'application/json'}, body, keepalive: true}).catch(() => {})
    } catch {
      // Slack hears nothing: the builder carries on.
    }
  }

  const set = (v: string) => {
    setAnswers({...answers, [q.key]: v})
    setError(null)
  }

  const forward = () => {
    if (at < questions.length - 1) return setStep(at + 1)
    setPhase('built')
    top.current?.scrollIntoView({behavior: 'smooth', block: 'start'})
  }

  const next = (e?: FormEvent) => {
    e?.preventDefault()
    if (errors[q.key]) return setError(errors[q.key])
    forward()
  }

  const skip = () => {
    setAnswers({...answers, [q.key]: q.default ?? ''})
    setError(null)
    forward()
  }

  if (phase === 'built') {
    const message = `Hi Rob, I used the app builder on your website for ${options.name}. I’d like to build it with you.`
    return (
      <div className={`builder builder--built ${className ?? ''}`} ref={top}>
        <header className="ready" style={{'--x-accent': options.accent} as CSSProperties}>
          <span className="ready__mark">
            <Mark size={56} />
          </span>
          <div>
            <span className="label">Your app, as a prototype</span>
            <h2 className="ready__name">{options.name}</h2>
            <p className="ready__line">{options.tagline}</p>
          </div>
          <button type="button" className="text-btn ready__change" onClick={() => setPhase('asking')}>
            Change my answers
          </button>
        </header>

        {written === undefined ? (
          <p className="builder__real builder__writing" role="status">
            Claude is writing {options.name}: its headline, onboarding, path and photos. This takes up to half a minute.
          </p>
        ) : (
          <Showcase o={options} gallery={gallery} />
        )}

        <section id="interest" className="manifest interest" aria-labelledby="interest-title">
          <h2 id="interest-title" className="manifest__title">
            Build {options.name} with me
          </h2>
          <p className="manifest__lead">
            I’ll take {options.name} from this prototype to the web, the App Store and Google Play. Message me on WhatsApp, or
            leave your details and I’ll be in touch. Your answers come with it.
          </p>
          {whatsapp && (
            <a
              className="btn btn-primary"
              href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(message)}`}
              target="_blank"
              rel="noreferrer"
              onClick={() => tell('whatsapp')}
            >
              Message me on WhatsApp <Arrow />
            </a>
          )}
          <Interest answers={answers} />
        </section>
      </div>
    )
  }

  const value = answers[q.key] ?? ''
  const fallback = value.trim() ? '' : `${options[q.key] ?? ''}`
  const sectionAt = SECTIONS.indexOf(q.section as (typeof SECTIONS)[number])
  const chosen = value
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean)

  return (
    <div className={`builder ${className ?? ''}`} ref={top}>
      <ol className="builder__sections" aria-label="Sections">
        {SECTIONS.filter((s) => questions.some((x) => x.section === s)).map((s) => (
          <li key={s} className={s === q.section ? 'is-on' : SECTIONS.indexOf(s) < sectionAt ? 'is-past' : undefined}>
            {s}
          </li>
        ))}
      </ol>
      <form className="builder__ask" onSubmit={next}>
        <div className="builder__count">
          <span className="label">
            {String(at + 1).padStart(2, '0')} / {questions.length}
          </span>
          <span className="builder__bar" aria-hidden>
            <span style={{width: `${((at + 1) / questions.length) * 100}%`}} />
          </span>
        </div>

        <label className="builder__question" htmlFor={`q-${q.key}`}>
          {q.ask}
        </label>
        {q.why && <p className="builder__why">{q.why}</p>}

        {q.choices ? (
          <div className="builder__kinds" role={q.multi ? 'group' : 'radiogroup'} aria-label={q.ask}>
            {q.choices.map((c) => {
              const on = q.multi ? chosen.includes(c.value) : value === c.value
              const choice = (
                <button
                  key={c.value}
                  type="button"
                  role={q.multi ? 'checkbox' : 'radio'}
                  aria-checked={on}
                  className={`builder__kind${on ? ' is-active' : ''}`}
                  onClick={() => set(q.multi ? (on ? chosen.filter((x) => x !== c.value) : [...chosen, c.value]).join(', ') : c.value)}
                >
                  <strong>{c.label}</strong>
                  {c.hint && <span>{c.hint}</span>}
                  {c.description && <span className="builder__about">{c.description}</span>}
                  {c.shots && <Screenshots shots={c.shots} />}
                </button>
              )
              // A live app to look at sits beside its choice, never inside it: a link in a button is neither.
              return c.url ? (
                <div key={c.value} className="builder__template">
                  {choice}
                  <a className="builder__see" href={c.url} target="_blank" rel="noreferrer">
                    See {c.label.replace(/^Like /, '')} <Arrow />
                  </a>
                </div>
              ) : (
                choice
              )
            })}
          </div>
        ) : q.key === 'photo' ? (
          <PhotoSearch
            answers={answers}
            value={value}
            onChange={(url, credit) => {
              setAnswers({...answers, photo: url, photoCredit: credit})
              setError(null)
            }}
          />
        ) : q.key === 'accent' ? (
          <div className="builder__colour">
            <input
              type="color"
              aria-label="Pick a colour"
              value={/^#[0-9a-fA-F]{6}$/.test(value) ? value : '#2F6B4F'}
              onChange={(e) => set(e.target.value.toUpperCase())}
            />
            <input ref={input} id={`q-${q.key}`} value={value} onChange={(e) => set(e.target.value)} placeholder={`e.g. ${q.example}`} />
            <button
              type="button"
              className="text-btn builder__shuffle"
              onClick={() => set(ACCENTS.filter((c) => c !== value.toUpperCase())[Math.floor(Math.random() * (ACCENTS.length - 1))])}
            >
              Pick one for me
            </button>
          </div>
        ) : q.long ? (
          <textarea
            ref={input}
            id={`q-${q.key}`}
            rows={3}
            value={value}
            onChange={(e) => set(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) next(e)
            }}
            placeholder={`e.g. ${q.example}`}
          />
        ) : (
          <input
            ref={input}
            id={`q-${q.key}`}
            value={value}
            onChange={(e) => set(e.target.value)}
            placeholder={`e.g. ${q.example}`}
            type={q.key === 'email' ? 'email' : undefined}
            autoComplete={q.key === 'email' ? 'email' : undefined}
            autoCapitalize={q.key === 'email' ? 'none' : undefined}
            inputMode={q.key === 'email' ? 'email' : undefined}
          />
        )}

        {q.suggestions && (
          <div className="builder__picks" role="group" aria-label="Pick from these">
            {q.suggestions.map((s) => {
              const on = chosen.some((x) => x.toLowerCase() === s.toLowerCase())
              return (
                <button
                  key={s}
                  type="button"
                  aria-pressed={on}
                  className={`builder__pick${on ? ' is-on' : ''}`}
                  onClick={() => set((on ? chosen.filter((x) => x.toLowerCase() !== s.toLowerCase()) : [...chosen, s]).join(', '))}
                >
                  {s}
                </button>
              )
            })}
          </div>
        )}

        <p className="builder__hint">
          {error ? (
            <span className="builder__error">{error}</span>
          ) : value.trim() || q.choices ? (
            ' '
          ) : fallback ? (
            `Leave it blank for: ${fallback}`
          ) : (
            'Not sure yet? Skip it: Claude will ask.'
          )}
        </p>

        <div className="builder__nav">
          {at > 0 && (
            <button type="button" className="text-btn" onClick={() => setStep(at - 1)}>
              Back
            </button>
          )}
          <button type="submit" className="btn btn-primary">
            {at < questions.length - 1 ? 'Next' : 'See my app'} <Arrow />
          </button>
          {!q.required && !q.choices && (
            <button type="button" className="text-btn" onClick={skip}>
              Skip
            </button>
          )}
        </div>
      </form>
    </div>
  )
}

/**
 * An example's screenshots, inside its choice: the description says what they show, so they are
 * decoration to a screen reader, and a tap on one picks the app like the rest of the card.
 */
function Screenshots({shots}: {shots: Shots}) {
  return (
    <span className={`builder__shots${shots.wide ? ' builder__shots--wide' : ''}`}>
      {shots.srcs.map((src) => (
        <img key={src} src={src} alt="" loading="lazy" decoding="async" width={shots.wide ? 960 : 360} height={shots.wide ? 540 : 780} />
      ))}
    </span>
  )
}

/** "Build it with me": name, email and a note, sent with their answers to the Fohm Slack channel. */
function Interest({answers}: {answers: Answers}) {
  const [contact, setContact] = useState({name: '', email: answers.email ?? '', note: '', website: ''})
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'failed'>('idle')
  const [error, setError] = useState<string | null>(null)
  const field = (k: keyof typeof contact) => ({
    value: contact[k],
    onChange: (e: {target: {value: string}}) => setContact({...contact, [k]: e.target.value}),
  })

  const send = async (e: FormEvent) => {
    e.preventDefault()
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(contact.email.trim())) return setError('An email address, so I can get back to you.')
    setError(null)
    setState('sending')
    try {
      const res = await fetch('/api/builder-event', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({event: 'interest', answers, contact}),
      })
      setState(res.ok ? 'sent' : 'failed')
    } catch {
      setState('failed')
    }
  }

  if (state === 'sent')
    return (
      <p className="builder__real builder__real--ready" role="status">
        Thanks{contact.name.trim() ? `, ${contact.name.trim().split(' ')[0]}` : ''}. I’ve got your answers and I’ll be in touch.
      </p>
    )

  return (
    <form className="interest__form" onSubmit={send} noValidate>
      <label>
        <span>Your name</span>
        <input autoComplete="name" maxLength={100} {...field('name')} />
      </label>
      <label>
        <span>Your email</span>
        <input type="email" autoComplete="email" inputMode="email" required maxLength={200} {...field('email')} />
      </label>
      <label className="interest__wide">
        <span>Anything else I should know? (optional)</span>
        <textarea rows={3} maxLength={1000} {...field('note')} />
      </label>
      {/* Left empty by people; filled in by bots. */}
      <input className="interest__trap" tabIndex={-1} autoComplete="off" aria-hidden {...field('website')} />
      {(error || state === 'failed') && <p className="builder__error interest__wide">{error ?? 'That didn’t send. Try again, or use WhatsApp.'}</p>}
      <div className="interest__wide">
        <button type="submit" className="btn btn-primary" disabled={state === 'sending'}>
          {state === 'sending' ? 'Sending…' : 'I’m interested'} <Arrow />
        </button>
      </div>
    </form>
  )
}
