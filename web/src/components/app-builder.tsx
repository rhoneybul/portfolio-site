'use client'

import {useEffect, useMemo, useRef, useState, type FormEvent} from 'react'
import {Arrow} from '@/components/arrow'
import {AppPrototype} from '@/components/app-prototype'
import {OFF_UNTIL_SET, whatYouGet} from '@/app-builder/manifest'
import {SECTIONS, asked, buildSteps, emptyAnswers, resolveOptions, type Answers} from '@/app-builder/options'
import {claudePrompt} from '@/app-builder/prompt'

/**
 * The app builder: asks everything fohm-scaffold's first phase asks, one question to a screen in
 * sections, with the scaffolder's own defaults; plays the build; shows the app as a clickable
 * prototype in the house style; lists everything the app comes with; and hands over a brief for
 * Claude with every answer filled in. Nothing is generated or stored; answers stay in this tab.
 */

type Phase = 'asking' | 'building' | 'built'

const KEPT = 'fohm-app-builder'

export function AppBuilder({whatsapp, className}: {whatsapp?: string | null; className?: string}) {
  const [answers, setAnswers] = useState<Answers>(emptyAnswers)
  const [step, setStep] = useState(0)
  const [phase, setPhase] = useState<Phase>('asking')
  const [error, setError] = useState<string | null>(null)
  const [built, setBuilt] = useState(0)
  const [copied, setCopied] = useState(false)
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
  const {options, errors} = resolveOptions(answers)
  const steps = buildSteps(options)
  const brief = useMemo(() => claudePrompt(options, answers), [options, answers])

  useEffect(() => {
    if (phase === 'asking') input.current?.focus({preventScroll: true})
  }, [at, phase])

  useEffect(() => {
    if (phase !== 'building') return
    const finished = built >= steps.length
    const t = setTimeout(() => (finished ? setPhase('built') : setBuilt(built + 1)), finished ? 400 : 320)
    return () => clearTimeout(t)
  }, [phase, built, steps.length])

  // Once their app is drawn, the channel hears about it.
  useEffect(() => {
    if (phase === 'built') tell('used')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  /** Tells the Fohm Slack channel what happened (/api/builder-event). Never waits, never fails the page. */
  const tell = (event: 'used' | 'brief' | 'whatsapp') => {
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
    setBuilt(0)
    setPhase('building')
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

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(brief)
      tell('brief')
      setCopied(true)
      setTimeout(() => setCopied(false), 2400)
    } catch {
      setCopied(false)
    }
  }

  const download = () => {
    tell('brief')
    const url = URL.createObjectURL(new Blob([brief], {type: 'text/markdown'}))
    const a = document.createElement('a')
    a.href = url
    a.download = `${options.slug}-app-brief.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (phase !== 'asking') {
    const message = `Hi Rob, I used the app builder on your website for ${options.name}. I’d like to build it with you.`
    return (
      <div className={`builder builder--built ${className ?? ''}`} ref={top}>
        <div className="builder__log" aria-live="polite">
          <span className="label">{phase === 'built' ? `${options.name} is ready to try` : `Building ${options.name}`}</span>
          <ol>
            {steps.slice(0, built).map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ol>
          {phase === 'built' && (
            <div className="builder__next">
              <p>
                This is the app fohm-scaffold makes from your answers, as a prototype: tap through it. Below it, everything it
                comes with, and a brief with every answer filled in to paste into Claude.
              </p>
              <a className="btn btn-primary" href="#brief">
                Get the brief for Claude <Arrow />
              </a>
              <a className="text-btn" href="#interest">
                Build it with me
              </a>
              <button
                type="button"
                className="text-btn"
                onClick={() => setPhase('asking')}
              >
                Change my answers
              </button>
            </div>
          )}
        </div>
        {phase === 'built' && <AppPrototype o={options} />}

        {phase === 'built' && (
          <section className="manifest" aria-labelledby="manifest-title">
            <h2 id="manifest-title" className="manifest__title">
              Everything in {options.name}
            </h2>
            <p className="manifest__lead">{OFF_UNTIL_SET}</p>
            <div className="manifest__grid">
              {whatYouGet(options).map((part, i) => (
                <div key={part.title} className="manifest__part">
                  <span className="label">
                    {String(i + 1).padStart(2, '0')} · {part.title}
                  </span>
                  <ul className="highlights">
                    {part.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        )}

        {phase === 'built' && (
          <section id="brief" className="manifest brief" aria-labelledby="brief-title">
            <h2 id="brief-title" className="manifest__title">
              Your brief for Claude
            </h2>
            <p className="manifest__lead">
              Every answer, the command that creates the app, and what to do next. Paste it into Claude with fohm-scaffold’s
              new-app skill and it starts where these questions end.
            </p>
            <div className="brief__actions">
              <button type="button" className="btn btn-primary" onClick={copy}>
                {copied ? 'Copied' : 'Copy the brief'} <Arrow />
              </button>
              <button type="button" className="btn btn-outline" onClick={download}>
                Download it <Arrow />
              </button>
              {whatsapp && (
                <a
                  className="text-btn"
                  href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(message)}`}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => tell('whatsapp')}
                >
                  Or message me on WhatsApp
                </a>
              )}
            </div>
            <pre className="brief__text" tabIndex={0}>
              {brief}
            </pre>
          </section>
        )}

        {phase === 'built' && (
          <section id="interest" className="manifest interest" aria-labelledby="interest-title">
            <h2 id="interest-title" className="manifest__title">
              Build {options.name} with me
            </h2>
            <p className="manifest__lead">
              Leave your details and I’ll be in touch about taking {options.name} from this prototype to the App Store,
              Google Play and the web. Your answers come with it.
            </p>
            <Interest answers={answers} />
          </section>
        )}
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
        ) : q.key === 'accent' ? (
          <div className="builder__colour">
            <input
              type="color"
              aria-label="Pick a colour"
              value={/^#[0-9a-fA-F]{6}$/.test(value) ? value : '#2F6B4F'}
              onChange={(e) => set(e.target.value.toUpperCase())}
            />
            <input ref={input} id={`q-${q.key}`} value={value} onChange={(e) => set(e.target.value)} placeholder={`e.g. ${q.example}`} />
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
            autoCapitalize={['supportEmail', 'domain', 'bundleId', 'photo'].includes(q.key) ? 'none' : undefined}
            inputMode={q.key === 'supportEmail' ? 'email' : q.key === 'domain' || q.key === 'photo' ? 'url' : undefined}
          />
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
            {at < questions.length - 1 ? 'Next' : 'Build my app'} <Arrow />
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

/** "Build it with me": name, email and a note, sent with their answers to the Fohm Slack channel. */
function Interest({answers}: {answers: Answers}) {
  const [contact, setContact] = useState({name: '', email: '', note: '', website: ''})
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
