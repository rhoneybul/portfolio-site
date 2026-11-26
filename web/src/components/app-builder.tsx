'use client'

import {useEffect, useRef, useState, type CSSProperties, type FormEvent} from 'react'
import {Arrow} from '@/components/arrow'
import {goalsOf, type Pic} from '@/components/app-prototype'
import {AppIcon} from '@/components/app-icon'
import {PhotoSearch, ideasFor, mixed, search} from '@/components/photo-search'
import {Showcase} from '@/components/showcase'
import {BookCall} from '@/components/book-call'
import {PrototypeBuild, type Built} from '@/components/prototype-build'
import {ACCENTS, QUESTIONS, emptyAnswers, resolveOptions, type Answers, type Question, type Shots} from '@/app-builder/options'
import {REFERENCES} from '@/app-builder/references'
import {LAST, LISTS, PARTS, fallbackNext, needsClaude, totalQuestions, type Next, type Turn} from '@/app-builder/next-question'

/**
 * The app builder: asks what a first look at the visitor's app needs, one question to a screen in
 * three parts, each chosen by Claude from what they've said so far (/api/builder/next; the fixed
 * order without it), with the scaffolder's own defaults; then Claude designs their app, live, screen by
 * screen (PrototypeBuild: a few minutes); then it walks them through it as a deck (the prototype
 * Claude drew, the dashboard, alerts, metrics, monitoring, payments, security, the stores), and
 * ends on Build it with me. Without Claude (no ANTHROPIC_API_KEY, or it couldn't finish), the deck
 * shows the quick sketch instead. The full submission, with the brief for Claude, goes to the Fohm
 * Slack channel only (/api/builder-event): the visitor never sees it.
 */

type Phase = 'intro' | 'asking' | 'building' | 'built'

const KEPT = 'fohm-app-builder'

export function AppBuilder({whatsapp, bookingUrl, className}: {
  whatsapp?: string | null
  bookingUrl?: string | null
  className?: string
}) {
  const [answers, setAnswers] = useState<Answers>(emptyAnswers)
  // This visit's reference: sent with what they build and with a call they book, so Slack can join the two.
  const [ref] = useState(sessionRef)
  // The questions asked so far, in order, and the one on screen.
  const [turns, setTurns] = useState<Turn[]>(firstTurns)
  const [at, setAt] = useState(0)
  const [thinking, setThinking] = useState(false)
  const [phase, setPhase] = useState<Phase>('intro')
  const [error, setError] = useState<string | null>(null)
  const [gallery, setGallery] = useState<Pic[]>([])
  // Claude's prototype, and the answers it was drawn from: the same answers never draw twice.
  const [built, setBuilt] = useState<{for: string; app: Built | null} | null>(null)
  const [note, setNote] = useState<string | null>(null)
  const input = useRef<HTMLInputElement & HTMLTextAreaElement>(null)
  const top = useRef<HTMLDivElement>(null)
  // The newest message in the conversation: Claude's question, or its typing while it chooses.
  const latest = useRef<HTMLDivElement>(null)
  // The conversation's own scroll: it moves, the page doesn't.
  const log = useRef<HTMLDivElement>(null)

  // Answers survive a refresh in this tab only.
  useEffect(() => {
    try {
      const kept = sessionStorage.getItem(KEPT)
      if (kept) setAnswers({...emptyAnswers(), ...JSON.parse(kept)})
      const keptTurns = JSON.parse(sessionStorage.getItem(KEPT_TURNS) ?? 'null') as {turns?: Turn[]; at?: number} | null
      const restored = keptTurns?.turns?.filter((t) => t && typeof t.ask === 'string' && QUESTIONS.some((q) => q.key === t.key))
      if (restored?.length) {
        // Someone coming back mid-conversation carries on where they were, past the explainer.
        if (restored.length > 1) setPhase('asking')
        setTurns(restored)
        setAt(Math.min(Math.max(0, Number(keptTurns?.at) || 0), restored.length - 1))
      }
    } catch {
      // No storage: start empty.
    }
  }, [])
  useEffect(() => {
    try {
      sessionStorage.setItem(KEPT, JSON.stringify(answers))
      sessionStorage.setItem(KEPT_TURNS, JSON.stringify({turns, at}))
    } catch {
      // No storage: nothing kept.
    }
  }, [answers, turns, at])

  const turn = turns[at]
  const q = questionOf(turn.key)
  const {options, errors} = resolveOptions(answers)

  useEffect(() => {
    if (phase !== 'asking') return
    input.current?.focus({preventScroll: true})
    // The chat's window comes into view as the conversation starts, then the page stays where it is.
    if (at === 0 && !thinking) top.current?.scrollIntoView({block: 'nearest', behavior: 'smooth'})
    // The newest message stays in view as the conversation grows, inside the window.
    const el = log.current
    if (el) el.scrollTo({top: el.scrollHeight, behavior: at > 0 || thinking ? 'smooth' : 'auto'})
  }, [at, phase, thinking])

  // Photos for every slot, found from what they told us: the photo step's searches, then each goal.
  // Claude's build finds them first; the quick sketch, coming straight here, finds them now.
  useEffect(() => {
    if (phase !== 'built' || gallery.length) return
    let live = true
    ideasFor(answers)
      .then((ideas) => {
        const terms = [...ideas, ...goalsOf(options)].filter((t, i, all) => t && all.indexOf(t) === i).slice(0, 5)
        return Promise.all(terms.map((t) => search(t).catch(() => [])))
      })
      .then((lists) => {
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
      const body = JSON.stringify({event, answers, prototype: app?.id, ref})
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

  const key = JSON.stringify(answers)
  const app = built?.for === key ? built.app : null

  const build = () => {
    setPhase(built?.for === key ? 'built' : 'building')
    top.current?.scrollIntoView({behavior: 'smooth', block: 'start'})
  }

  /** On to the next question: Claude's pick from what they've said, or the fixed order's at once. */
  const forward = async (given: Answers) => {
    const done = turns.slice(0, at + 1).flatMap((t) => [t.key, ...(t.skip ?? [])])
    setThinking(true)
    const next = await nextTurn(given, done)
    setThinking(false)
    if (next.done) return build()
    // Rows their answers make irrelevant take their defaults; an answer they've already given waits for their yes.
    const skipped = Object.fromEntries((next.skip ?? []).map((k) => [k, questionOf(k).default ?? '']))
    const untouched = !given[next.key]?.trim() || given[next.key] === (questionOf(next.key).default ?? '')
    setAnswers({...given, ...skipped, ...(next.prefill && untouched ? {[next.key]: next.prefill} : {})})
    setTurns([...turns.slice(0, at + 1), next])
    setAt(at + 1)
  }

  const next = (e?: FormEvent) => {
    e?.preventDefault()
    if (thinking) return
    if (errors[q.key]) return setError(errors[q.key])
    void forward(answers)
  }

  const skip = () => {
    if (thinking) return
    const given = {...answers, [q.key]: q.default ?? ''}
    setAnswers(given)
    setError(null)
    void forward(given)
  }

  if (phase === 'intro')
    return (
      <div className={`builder builder--intro ${className ?? ''}`} ref={top}>
        <span className="label">● Early access</span>
        <h2 className="intro__title">Design your app in a conversation</h2>
        <p className="intro__lead">
          Tell Claude about the app you want to build. It asks about {totalQuestions(answers)} questions in three parts, the idea,
          how it works and how it looks, choosing each from what you’ve already said. Five minutes or so, and you can skip
          anything you’re not sure of.
        </p>
        <h3 className="intro__subtitle">What you get</h3>
        <ul className="intro__list">
          <li>
            <strong>A prototype you can tap through.</strong> Claude designs it while you watch: the landing page, sign-up, the
            screens your customers use and your dashboard, in your name, words and colour.
          </li>
          <li>
            <strong>The calls it made for you,</strong> so you can see why it looks the way it does.
          </li>
          <li>
            <strong>Everything behind it:</strong> payments, alerts, metrics, security and the App Store and Google Play, on the same
            foundations as Etapa and Naz.
          </li>
          <li>
            <strong>A way to build it for real.</strong> Book a free call and I’ll take it from the prototype to the stores.
          </li>
        </ul>
        <button type="button" className="btn btn-primary intro__start" onClick={() => setPhase('asking')}>
          Start <Arrow />
        </button>
      </div>
    )

  if (phase === 'building')
    return (
      <div className={className} ref={top}>
        <PrototypeBuild
          answers={answers}
          options={options}
          onGallery={setGallery}
          onBuilt={(b) => {
            setBuilt({for: key, app: b})
            setNote(null)
            setPhase('built')
          }}
          onSketch={(why) => {
            setBuilt({for: key, app: null})
            setNote(why ?? null)
            setPhase('built')
          }}
        />
      </div>
    )

  if (phase === 'built') {
    const message = `Hi Rob, I used the app builder on your website for ${options.name}. I’d like to build it with you.`
    return (
      <div className={`builder builder--built ${className ?? ''}`} ref={top}>
        <header className="ready" style={{'--x-accent': options.accent} as CSSProperties}>
          <span className="ready__mark">
            <AppIcon name={options.name} accent={options.accent} icon={app?.look.style?.icon} />
          </span>
          <div>
            <span className="label">{app ? 'Your app, designed by Claude' : 'Your app, as a quick sketch'}</span>
            <h2 className="ready__name">{options.name}</h2>
            <p className="ready__line">{app?.plan.summary || options.tagline}</p>
            {note && <p className="ready__note">{note}</p>}
          </div>
          <button type="button" className="text-btn ready__change" onClick={() => setPhase('asking')}>
            Change my answers
          </button>
        </header>

        {app && app.plan.decisions.length > 0 && (
          <section className="calls" aria-labelledby="calls-title">
            <h3 id="calls-title" className="calls__title">
              What Claude decided for you
            </h3>
            <ul>
              {app.plan.decisions.map((d) => (
                <li key={d}>{d}</li>
              ))}
            </ul>
            <p className="calls__line">Any of it can change: these are the calls we’d go through with you first.</p>
          </section>
        )}

        <Showcase o={options} gallery={gallery} built={app} />

        <section id="interest" className="manifest interest" aria-labelledby="interest-title">
          <h2 id="interest-title" className="manifest__title">
            Build {options.name} with me
          </h2>
          <p className="manifest__lead">
            Thanks for your interest in building {options.name}. I’ll take it from this prototype to the web, the App Store and
            Google Play. Book a free call, message me on WhatsApp, or leave your details and I’ll be in touch. Your answers
            come with it.
          </p>
          {(bookingUrl || whatsapp) && (
            <div className="interest__actions">
              {bookingUrl && (
                <BookCall url={bookingUrl} label="Book a free call" from="app-builder" builderRef={ref} prefill={{email: answers.email, notes: callNote(options.name)}} />
              )}
              {whatsapp && (
                <a
                  className={`btn ${bookingUrl ? 'btn-outline' : 'btn-primary'}`}
                  href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(message)}`}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => tell('whatsapp')}
                >
                  Message me on WhatsApp <Arrow />
                </a>
              )}
            </div>
          )}
          <Interest answers={answers} prototype={app?.id} name={options.name} bookingUrl={bookingUrl} builderRef={ref} />
        </section>
      </div>
    )
  }

  const value = answers[q.key] ?? ''
  const fallback = value.trim() ? '' : `${options[q.key] ?? ''}`
  const suggestions = turn.suggestions ?? q.suggestions
  const prefilled = Boolean(turn.prefill) && value === turn.prefill
  const chosen = value
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean)
  // While Claude chooses the next question, the one just answered joins the conversation.
  const past = turns.slice(0, thinking ? at + 1 : at)
  const typed = !q.choices && q.key !== 'photo'

  /** A single choice, or a pick under a one-line answer, is an answer in itself: it's sent as tapped. */
  const answerWith = (v: string) => {
    if (thinking) return
    const given = {...answers, [q.key]: v}
    setAnswers(given)
    setError(null)
    void forward(given)
  }

  return (
    <div className={`builder builder--chat ${className ?? ''}`} ref={top}>
      <ol className="builder__sections" aria-label="Parts">
        {PARTS.map((name, i) => (
          <li key={name} className={i + 1 === turn.part ? 'is-on' : i + 1 < turn.part ? 'is-past' : undefined}>
            {name}
          </li>
        ))}
      </ol>

      <div className="chat" ref={log} role="log" aria-live="polite" aria-label="Your app, in conversation">
        <div className="chat__msg chat__msg--claude">
          <p>Let’s start with the idea. Skip anything you’re not sure of, and I’ll ask later.</p>
        </div>
        {past.map((t, i) => (
          <div key={`${t.key}-${i}`} className="chat__pair">
            <div className="chat__msg chat__msg--claude">
              <p>{t.ask}</p>
            </div>
            <div className="chat__msg chat__msg--you">
              <Said q={questionOf(t.key)} value={answers[t.key] ?? ''} />
              <button type="button" className="chat__change" onClick={() => setAt(i)} disabled={thinking} aria-label={`Change: ${t.ask}`}>
                Change
              </button>
            </div>
          </div>
        ))}
        {thinking ? (
          <div className="chat__msg chat__msg--claude chat__msg--typing" ref={latest} aria-label="Choosing your next question">
            <span />
            <span />
            <span />
          </div>
        ) : (
          <div className="chat__msg chat__msg--claude chat__msg--now" ref={latest}>
            <p id={`ask-${q.key}`}>{turn.ask}</p>
            {turn.why && <p className="chat__why">{turn.why}</p>}
            <span className="chat__count">
              Part {turn.part} of {turn.parts} · {turn.left ? `about ${turn.left} to go` : 'last question'}
            </span>
          </div>
        )}
      </div>

      {!thinking && (
        <form className="chat__reply builder__ask" onSubmit={next} aria-labelledby={`ask-${q.key}`}>
          {q.choices ? (
            <div className="builder__kinds" role={q.multi ? 'group' : 'radiogroup'} aria-labelledby={`ask-${q.key}`}>
              {q.choices.map((c) => {
                const on = q.multi ? chosen.includes(c.value) : value === c.value
                const choice = (
                  <button
                    key={c.value}
                    type="button"
                    role={q.multi ? 'checkbox' : 'radio'}
                    aria-checked={on}
                    className={`builder__kind${on ? ' is-active' : ''}`}
                    onClick={() => (q.multi ? set((on ? chosen.filter((x) => x !== c.value) : [...chosen, c.value]).join(', ')) : answerWith(c.value))}
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
          ) : null}

          {q.key === 'inspiration' ? (
            <ul className="builder__refs" aria-label="Apps to pick from, each with a screen on Mobbin">
              {REFERENCES.map((r) => {
                const on = chosen.some((x) => x.toLowerCase() === r.name.toLowerCase())
                return (
                  <li key={r.name} className={`builder__ref${on ? ' is-on' : ''}`}>
                    <button
                      type="button"
                      aria-pressed={on}
                      onClick={() => set((on ? chosen.filter((x) => x.toLowerCase() !== r.name.toLowerCase()) : [...chosen, r.name]).join(', '))}
                    >
                      <strong>{r.name}</strong>
                      <span>{r.look}</span>
                    </button>
                    <a href={r.mobbin} target="_blank" rel="noopener noreferrer" aria-label={`${r.name} on Mobbin (opens in a new tab)`}>
                      Mobbin <Arrow />
                    </a>
                  </li>
                )
              })}
            </ul>
          ) : suggestions && (
            <div className="builder__picks" role="group" aria-label="Pick from these">
              {suggestions.map((s) => {
                const list = LISTS.has(q.key)
                const on = list ? chosen.some((x) => x.toLowerCase() === s.toLowerCase()) : value.trim().toLowerCase() === s.toLowerCase()
                return (
                  <button
                    key={s}
                    type="button"
                    aria-pressed={on}
                    className={`builder__pick${on ? ' is-on' : ''}`}
                    onClick={() => (list ? set((on ? chosen.filter((x) => x.toLowerCase() !== s.toLowerCase()) : [...chosen, s]).join(', ')) : answerWith(s))}
                  >
                    {s}
                  </button>
                )
              })}
            </div>
          )}

          {typed && (
            <div className={`chat__composer${q.key === 'accent' ? ' chat__composer--colour' : ''}`}>
              {q.key === 'accent' && (
                <input
                  type="color"
                  aria-label="Pick a colour"
                  value={/^#[0-9a-fA-F]{6}$/.test(value) ? value : '#2F6B4F'}
                  onChange={(e) => set(e.target.value.toUpperCase())}
                />
              )}
              {q.long ? (
                <textarea
                  ref={input}
                  id={`q-${q.key}`}
                  aria-labelledby={`ask-${q.key}`}
                  rows={2}
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
                  aria-labelledby={`ask-${q.key}`}
                  value={value}
                  onChange={(e) => set(e.target.value)}
                  placeholder={`e.g. ${q.example}`}
                  type={q.key === 'email' ? 'email' : undefined}
                  autoComplete={q.key === 'email' ? 'email' : undefined}
                  autoCapitalize={q.key === 'email' ? 'none' : undefined}
                  inputMode={q.key === 'email' ? 'email' : undefined}
                />
              )}
              <button type="submit" className="btn btn-primary chat__send">
                {turn.key === LAST ? 'See my app' : 'Send'} <Arrow />
              </button>
            </div>
          )}

          <div className="chat__foot">
          <p className="builder__hint">
            {error ? (
              <span className="builder__error">{error}</span>
            ) : prefilled ? (
              'Filled in from what you’ve told me: change it if it’s not right, then send.'
            ) : q.choices && !q.multi ? (
              'Tap one to answer.'
            ) : suggestions && LISTS.has(q.key) && !value.trim() ? (
              'Pick as many as you like, or type your own, then send.'
            ) : value.trim() || q.choices ? (
              ' '
            ) : fallback ? (
              `Leave it blank for: ${fallback}`
            ) : (
              ' '
            )}
          </p>

          <div className="builder__nav">
            {q.key === 'accent' && (
              <button
                type="button"
                className="text-btn builder__shuffle"
                onClick={() => set(ACCENTS.filter((c) => c !== value.toUpperCase())[Math.floor(Math.random() * (ACCENTS.length - 1))])}
              >
                Pick one for me
              </button>
            )}
            {!typed && (q.multi || q.key === 'photo') && (
              <button type="submit" className="btn btn-primary">
                Send <Arrow />
              </button>
            )}
            {!q.required && !(q.choices && !q.multi) && (
              <button type="button" className="text-btn" onClick={skip}>
                Skip
              </button>
            )}
          </div>
          </div>
        </form>
      )}
    </div>
  )
}

/** An answer as it reads in the conversation: a choice by its label, the photo as itself, the colour as a swatch. */
function Said({q, value}: {q: Question; value: string}) {
  if (!value.trim()) return <p className="chat__skipped">Skipped</p>
  if (q.key === 'photo') return <img className="chat__photo" src={value} alt="The photo picked for the app" width={160} height={100} loading="lazy" />
  if (q.key === 'accent')
    return (
      <p className="chat__swatch">
        <span style={{background: value}} aria-hidden /> {value.toUpperCase()}
      </p>
    )
  const picked = q.choices?.filter((c) => value.split(',').map((x) => x.trim()).includes(c.value)).map((c) => c.label)
  return <p>{picked?.length ? picked.join(', ') : value}</p>
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

const KEPT_TURNS = 'fohm-app-builder-turns'

const questionOf = (key: string) => QUESTIONS.find((q) => q.key === key) as Question

/** The first question is always the idea, asked before anything else is known. */
const firstTurns = (): Turn[] => [fallbackNext(emptyAnswers(), []) as Turn]

/** How long Claude gets to choose before the fixed order's next question is shown instead. */
const CHOOSING = 14_000

/**
 * The next question: Claude's pick (/api/builder/next) when there's a choice to make, else the
 * fixed order's, straight away. A slow or failed answer never holds them up: the fixed order's.
 */
async function nextTurn(answers: Answers, done: string[]): Promise<Next> {
  const fallback = fallbackNext(answers, done)
  if (!needsClaude(answers, done)) return fallback
  const stop = new AbortController()
  const timer = setTimeout(() => stop.abort(), CHOOSING)
  try {
    const res = await fetch('/api/builder/next', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({answers, done}),
      signal: stop.signal,
    })
    const next = res.ok ? ((await res.json()) as Next) : null
    if (!next) return fallback
    // Only a question still to ask: anything else is the fixed order's.
    return next.done || (typeof next.key === 'string' && !done.includes(next.key) && QUESTIONS.some((q) => q.key === next.key)) ? next : fallback
  } catch {
    return fallback
  } finally {
    clearTimeout(timer)
  }
}

/** A random reference for this visit (32 hex characters), never tied to who they are. */
function sessionRef() {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}

/** What a call booked from the builder is about, written into the booking's notes. */
export const callNote = (app: string) => `About ${app}, from the app builder.`

/**
 * "Build it with me": name, email and a note, sent with their answers to the Fohm Slack channel; then a thank-you,
 * with a call to book.
 */
export function Interest({answers, prototype, name, bookingUrl, builderRef}: {
  answers: Answers
  prototype?: string
  name: string
  bookingUrl?: string | null
  builderRef: string
}) {
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
        body: JSON.stringify({event: 'interest', answers, contact, prototype, ref: builderRef}),
      })
      setState(res.ok ? 'sent' : 'failed')
    } catch {
      setState('failed')
    }
  }

  if (state === 'sent')
    return (
      <div className="builder__real builder__real--ready interest__thanks" role="status">
        <p>
          Thank you for your interest in {name}{contact.name.trim() ? `, ${contact.name.trim().split(' ')[0]}` : ''}. I’ve got
          your answers and I’ll be in touch at {contact.email.trim()}.
        </p>
        {bookingUrl && (
          <>
            <p>Want to talk sooner? Pick a time that suits you.</p>
            <BookCall
              url={bookingUrl}
              label="Book a free call"
              from="app-builder"
              builderRef={builderRef}
              prefill={{name: contact.name.trim(), email: contact.email.trim(), notes: [callNote(name), contact.note.trim()].filter(Boolean).join('\n\n')}}
            />
          </>
        )}
      </div>
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
