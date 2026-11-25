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

/** The real app's build (the prototype job): where it has got to, and its address once it's live. */
type Real = {state: 'idle' | 'starting' | 'waiting' | 'building' | 'ready' | 'failed'; id?: string; url?: string; error?: string; started?: number}

/** A build not live by now has gone wrong somewhere. */
const GIVE_UP = 20 * 60_000

const KEPT = 'fohm-app-builder'
const KEPT_REAL = 'fohm-app-builder-real'

const REAL_LINE: Record<Real['state'], string> = {
  idle: '',
  starting: 'Starting the build…',
  waiting: 'In the queue. It usually starts within a minute.',
  building: 'Building your app from the template. This takes three or four minutes.',
  ready: 'Your app is live, in demo mode: everything works, and nothing is saved beyond your browser.',
  failed: 'The build didn’t finish. Try again, or send me your answers.',
}

export function AppBuilder({whatsapp, className, prototypes = false}: {whatsapp?: string | null; className?: string; prototypes?: boolean}) {
  const [answers, setAnswers] = useState<Answers>(emptyAnswers)
  const [step, setStep] = useState(0)
  const [phase, setPhase] = useState<Phase>('asking')
  const [error, setError] = useState<string | null>(null)
  const [built, setBuilt] = useState(0)
  const [copied, setCopied] = useState(false)
  const [real, setReal] = useState<Real>({state: 'idle'})
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

  // A build under way carries on through a refresh.
  useEffect(() => {
    try {
      const kept = sessionStorage.getItem(KEPT_REAL)
      if (kept) setReal(JSON.parse(kept))
    } catch {
      // No storage: no build to carry on.
    }
  }, [])
  useEffect(() => {
    try {
      if (real.id) sessionStorage.setItem(KEPT_REAL, JSON.stringify(real))
    } catch {
      // No storage: nothing kept.
    }
  }, [real])

  // Ask where the build has got to every ten seconds until it's live or has failed.
  useEffect(() => {
    if (!real.id || (real.state !== 'waiting' && real.state !== 'building')) return
    if (real.started && Date.now() - real.started > GIVE_UP) return setReal((r) => ({...r, state: 'failed'}))
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/prototype/${real.id}`, {cache: 'no-store'})
        const next = (await res.json()) as {state: Real['state']; url?: string}
        setReal((r) => ({...r, state: next.state, url: next.url ?? r.url}))
      } catch {
        setReal((r) => ({...r}))
      }
    }, 10_000)
    return () => clearTimeout(t)
  }, [real])

  const questions = asked(answers)
  const at = Math.min(step, questions.length - 1)
  const q = questions[at]
  const {options, errors} = resolveOptions(answers)
  const steps = buildSteps(options)
  const brief = useMemo(() => claudePrompt(options, answers, real.state === 'ready' ? real.url : undefined), [options, answers, real])

  useEffect(() => {
    if (phase === 'asking') input.current?.focus({preventScroll: true})
  }, [at, phase])

  useEffect(() => {
    if (phase !== 'building') return
    const finished = built >= steps.length
    const t = setTimeout(() => (finished ? setPhase('built') : setBuilt(built + 1)), finished ? 400 : 320)
    return () => clearTimeout(t)
  }, [phase, built, steps.length])

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
      setCopied(true)
      setTimeout(() => setCopied(false), 2400)
    } catch {
      setCopied(false)
    }
  }

  const buildReal = async () => {
    setReal({state: 'starting'})
    try {
      const res = await fetch('/api/prototype', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({answers})})
      const body = (await res.json()) as {id?: string; url?: string; error?: string}
      setReal(res.ok && body.id ? {state: 'waiting', id: body.id, url: body.url, started: Date.now()} : {state: 'failed', error: body.error})
    } catch {
      setReal({state: 'failed'})
    }
  }

  const download = () => {
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
              {prototypes && (real.state === 'idle' || real.state === 'failed') && (
                <button type="button" className="btn btn-primary" onClick={buildReal}>
                  {real.state === 'failed' ? 'Try building it again' : 'Build my real app'} <Arrow />
                </button>
              )}
              {real.state !== 'idle' && (
                <p className={`builder__real builder__real--${real.state}`} role="status">
                  {real.error ?? REAL_LINE[real.state]}
                </p>
              )}
              {real.state === 'ready' && real.url && (
                <a className="btn btn-primary" href={real.url} target="_blank" rel="noreferrer">
                  Open {options.name} <Arrow />
                </a>
              )}
              <a className={prototypes ? 'text-btn' : 'btn btn-primary'} href="#brief">
                Get the brief for Claude {prototypes ? null : <Arrow />}
              </a>
              <button
                type="button"
                className="text-btn"
                onClick={() => {
                  setPhase('asking')
                  setReal({state: 'idle'})
                  try {
                    sessionStorage.removeItem(KEPT_REAL)
                  } catch {
                    // No storage: nothing to clear.
                  }
                }}
              >
                Change my answers
              </button>
            </div>
          )}
        </div>
        {phase === 'built' && <AppPrototype o={options} live={real.state === 'ready' ? real.url : undefined} />}

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
                <a className="text-btn" href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(message)}`} target="_blank" rel="noreferrer">
                  Or build it with me
                </a>
              )}
            </div>
            <pre className="brief__text" tabIndex={0}>
              {brief}
            </pre>
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
              return (
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
