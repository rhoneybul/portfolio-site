'use client'

import {useEffect, useRef, useState, type FormEvent} from 'react'
import {Arrow} from '@/components/arrow'
import {AppPrototype} from '@/components/app-prototype'
import {
  KIND_LABELS,
  KINDS,
  QUESTIONS,
  buildSteps,
  emptyAnswers,
  resolveOptions,
  type Answers,
  type Kind,
} from '@/app-builder/options'

/**
 * The outreach app builder: asks what fohm-scaffold's `new` asks, one question to a screen, fills
 * in the same defaults, plays the build, then shows the screens the scaffold makes as a clickable
 * prototype. Nothing is generated or stored; Build it for real sends the answers to Rob.
 */

type Phase = 'asking' | 'building' | 'built'

export function AppBuilder({whatsapp}: {whatsapp?: string | null}) {
  const [answers, setAnswers] = useState<Answers>(emptyAnswers)
  const [step, setStep] = useState(0)
  const [phase, setPhase] = useState<Phase>('asking')
  const [error, setError] = useState<string | null>(null)
  const [built, setBuilt] = useState(0)
  const input = useRef<HTMLInputElement & HTMLTextAreaElement>(null)
  const top = useRef<HTMLDivElement>(null)

  const q = QUESTIONS[step]
  const {options, errors} = resolveOptions(answers)
  const steps = buildSteps(options)

  useEffect(() => {
    if (phase === 'asking') input.current?.focus({preventScroll: true})
  }, [step, phase])

  // The build, a line at a time.
  useEffect(() => {
    if (phase !== 'building') return
    if (built >= steps.length) {
      const t = setTimeout(() => setPhase('built'), 400)
      return () => clearTimeout(t)
    }
    const t = setTimeout(() => setBuilt(built + 1), 380)
    return () => clearTimeout(t)
  }, [phase, built, steps.length])

  const set = (v: string) => {
    setAnswers({...answers, [q.key]: v})
    setError(null)
  }

  const next = (e?: FormEvent) => {
    e?.preventDefault()
    const problem = errors[q.key]
    if (problem) return setError(problem)
    if (step < QUESTIONS.length - 1) return setStep(step + 1)
    setBuilt(0)
    setPhase('building')
    top.current?.scrollIntoView({behavior: 'smooth', block: 'start'})
  }

  const back = () => {
    setError(null)
    setStep(Math.max(0, step - 1))
  }

  const editAnswers = () => {
    setPhase('asking')
    setStep(0)
  }

  if (phase !== 'asking') {
    const summary = QUESTIONS.map((x) => `${x.ask}\n${options[x.key] || '(blank)'}`).join('\n\n')
    const message = `Hi Rob, I tried the app builder on your website. Here are my answers.\n\n${summary}`
    return (
      <div className="builder builder--built" ref={top}>
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
                This is the app fohm-scaffold makes from your answers, as a prototype: tap through it. The real one is a
                web app, iPhone and Android apps, and a dashboard, with sign-in, payments, analytics and email ready to
                switch on.
              </p>
              {whatsapp && (
                <a
                  className="btn btn-primary"
                  href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(message)}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Build it for real <Arrow />
                </a>
              )}
              <button type="button" className="text-btn" onClick={editAnswers}>
                Change my answers
              </button>
            </div>
          )}
        </div>
        {phase === 'built' && <AppPrototype o={options} />}
      </div>
    )
  }

  const value = answers[q.key]
  const placeholder = `e.g. ${q.example}`
  // What a blank answer becomes, by the scaffolder's own defaults.
  const fallback = value.trim() ? '' : `${options[q.key] ?? ''}`

  return (
    <div className="builder" ref={top}>
      <form className="builder__ask" onSubmit={next}>
        <div className="builder__count">
          <span className="label">
            {String(step + 1).padStart(2, '0')} / {QUESTIONS.length}
          </span>
          <span className="builder__bar" aria-hidden>
            <span style={{width: `${((step + 1) / QUESTIONS.length) * 100}%`}} />
          </span>
        </div>

        <label className="builder__question" htmlFor={`q-${q.key}`}>
          {q.ask}
        </label>

        {q.choices ? (
          <div className="builder__kinds" role="radiogroup" aria-label={q.ask}>
            {KINDS.map((k: Kind) => (
              <button
                key={k}
                type="button"
                role="radio"
                aria-checked={value === k}
                className={`builder__kind${value === k ? ' is-active' : ''}`}
                onClick={() => set(k)}
              >
                <strong>{KIND_LABELS[k].label}</strong>
                <span>{KIND_LABELS[k].hint}</span>
              </button>
            ))}
          </div>
        ) : q.key === 'accent' ? (
          <div className="builder__colour">
            <input
              type="color"
              aria-label="Pick a colour"
              value={/^#[0-9a-fA-F]{6}$/.test(value) ? value : '#2F6B4F'}
              onChange={(e) => set(e.target.value.toUpperCase())}
            />
            <input ref={input} id={`q-${q.key}`} value={value} onChange={(e) => set(e.target.value)} placeholder={placeholder} />
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
            placeholder={placeholder}
          />
        ) : (
          <input
            ref={input}
            id={`q-${q.key}`}
            value={value}
            onChange={(e) => set(e.target.value)}
            placeholder={placeholder}
            autoCapitalize={['supportEmail', 'domain', 'bundleId'].includes(q.key) ? 'none' : undefined}
            inputMode={q.key === 'supportEmail' ? 'email' : q.key === 'domain' ? 'url' : undefined}
          />
        )}

        <p className="builder__hint">
          {error ? (
            <span className="builder__error">{error}</span>
          ) : q.required ? (
            'No name yet? A working name is fine; you can change it later.'
          ) : value.trim() || q.choices ? (
            '\u00a0'
          ) : fallback ? (
            `Leave it blank for: ${fallback}`
          ) : (
            'You can leave this blank for now.'
          )}
        </p>

        <div className="builder__nav">
          {step > 0 && (
            <button type="button" className="text-btn" onClick={back}>
              Back
            </button>
          )}
          <button type="submit" className="btn btn-primary">
            {step < QUESTIONS.length - 1 ? 'Next' : 'Build my app'} <Arrow />
          </button>
        </div>
      </form>
    </div>
  )
}
