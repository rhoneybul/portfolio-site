'use client'

import {useEffect, useRef, useState, type CSSProperties, type FormEvent} from 'react'
import {Arrow} from '@/components/arrow'
import {AppPrototype, goalsOf, type Pic} from '@/components/app-prototype'
import {AppReveal, BuildBar} from '@/components/app-reveal'
import {BuildDialog} from '@/components/build-dialog'
import {PhotoSearch, ideasFor, mixed, search, type Picked} from '@/components/photo-search'
import {Showcase} from '@/components/showcase'
import {BookCall} from '@/components/book-call'
import {PrototypeBuild, type Built} from '@/components/prototype-build'
import {QUESTIONS, emptyAnswers, resolveOptions, type Answers, type Question, type Shots} from '@/app-builder/options'
import {REFERENCES} from '@/app-builder/references'
import {schemeById, schemesFor} from '@/app-builder/schemes'
import {onAccent} from '@/app-builder/options'
import {RefPicture} from '@/components/ref-picture'
import {Gallery, Lightbox, Strip, type Slide} from '@/components/gallery'
import {NameCheckPanel, summaryOf} from '@/components/name-check'
import {NameIdeas} from '@/components/name-ideas'
import {addSpent, resetSpent, spentSoFar} from '@/components/spent'
import {useListing} from '@/components/ref-picture'
import type {Reference} from '@/app-builder/references'
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

export function AppBuilder({whatsapp, bookingUrl, className, paused}: {
  whatsapp?: string | null
  bookingUrl?: string | null
  className?: string
  /** Set while the builder is switched off (app-builder/switch.ts): what the page says instead of Start. */
  paused?: string | null
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
  // The photos they picked at the photo question, their favourite first: the first is answers.photo too.
  const [picks, setPicks] = useState<Picked[]>([])
  // Claude's prototype, and the answers it was drawn from: the same answers never draw twice.
  const [built, setBuilt] = useState<{for: string; app: Built | null} | null>(null)
  const [note, setNote] = useState<string | null>(null)
  // Where they heard about Fohm, asked while it builds: kept beside the answers, so the build stays theirs.
  const [heard, setHeard] = useState('')
  const input = useRef<HTMLInputElement & HTMLTextAreaElement>(null)
  const top = useRef<HTMLDivElement>(null)
  // The newest message in the conversation: Claude's question, or its typing while it chooses.
  const latest = useRef<HTMLDivElement>(null)
  // The conversation's own scroll: it moves, the page doesn't.
  const log = useRef<HTMLDivElement>(null)

  // A conversation kept from earlier in this tab: offered back on the intro, never reopened unasked.
  const [resumable, setResumable] = useState(false)
  // Nothing is written to the tab's storage until what it held has been read back, so a first empty render never overwrites it.
  const [loaded, setLoaded] = useState(false)

  // Answers survive a refresh in this tab only (sessionStorage): closing the tab forgets them.
  useEffect(() => {
    try {
      const kept = sessionStorage.getItem(KEPT)
      if (kept) setAnswers({...emptyAnswers(), ...JSON.parse(kept)})
      const keptPicks = JSON.parse(sessionStorage.getItem(KEPT_PICKS) ?? '[]') as Picked[]
      if (Array.isArray(keptPicks)) setPicks(keptPicks.filter((p) => p && typeof p.url === 'string').slice(0, 12))
      const keptTurns = JSON.parse(sessionStorage.getItem(KEPT_TURNS) ?? 'null') as {turns?: Turn[]; at?: number} | null
      const restored = keptTurns?.turns?.filter((t) => t && typeof t.ask === 'string' && QUESTIONS.some((q) => q.key === t.key))
      if (restored?.length) {
        // Someone coming back chooses: carry on where they were, or start a new app.
        if (restored.length > 1) setResumable(true)
        setTurns(restored)
        setAt(Math.min(Math.max(0, Number(keptTurns?.at) || 0), restored.length - 1))
      }
    } catch {
      // No storage: start empty.
    }
    setLoaded(true)
  }, [])
  useEffect(() => {
    if (!loaded) return
    try {
      sessionStorage.setItem(KEPT, JSON.stringify(answers))
      sessionStorage.setItem(KEPT_TURNS, JSON.stringify({turns, at}))
      sessionStorage.setItem(KEPT_PICKS, JSON.stringify(picks))
    } catch {
      // No storage: nothing kept.
    }
  }, [answers, turns, at, picks, loaded])

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
        const terms = [...ideas, ...(ideas.length < 3 ? goalsOf(options) : [])].filter((t, i, all) => t && all.indexOf(t) === i).slice(0, 5)
        return Promise.all(terms.map((t) => search(t).catch(() => [])))
      })
      .then((lists) => {
        // Their favourites first (the lead too, so its credit keeps its links), then the first of each search, then the second of each, so slots vary.
        const found = mixed(lists, 16).map((f) => ({url: f.url, credit: f.credit, author: f.author, profile: f.profile}))
        if (live) setGallery([...picks, ...found.filter((f) => !picks.some((p) => p.url === f.url))])
      })
      .catch(() => {})
    return () => {
      live = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  /**
   * Tells the Fohm Slack channel what happened (/api/builder-event). Never waits, never fails the page.
   * A build tells it itself, from the server, with what it cost (app-builder/mcp-build.ts).
   */
  const tell = (event: 'whatsapp') => {
    try {
      const body = JSON.stringify({event, answers: {...answers, heard}, prototype: app?.id, ref})
      if (!navigator.sendBeacon?.('/api/builder-event', new Blob([body], {type: 'application/json'})))
        void fetch('/api/builder-event', {method: 'POST', headers: {'Content-Type': 'application/json'}, body, keepalive: true}).catch(() => {})
    } catch {
      // Slack hears nothing: the builder carries on.
    }
  }

  /** Everything forgotten, here and in the tab's storage: a new app from the first question. */
  const startNew = () => {
    try {
      sessionStorage.removeItem(KEPT)
      sessionStorage.removeItem(KEPT_TURNS)
      sessionStorage.removeItem(KEPT_PICKS)
    } catch {
      // No storage: nothing to forget.
    }
    resetSpent()
    setAnswers(emptyAnswers())
    setTurns(firstTurns())
    setAt(0)
    setBuilt(null)
    setNote(null)
    setGallery([])
    setPicks([])
    setError(null)
    setResumable(false)
    setPhase('asking')
    top.current?.scrollIntoView({behavior: 'smooth', block: 'start'})
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

  if (phase === 'intro') {
    const start = (
      <button type="button" className="btn btn-primary intro__start" onClick={() => setPhase('asking')}>
        {resumable ? 'Carry on' : 'Start designing'} <Arrow />
      </button>
    )
    return (
      <div className={`builder builder--intro ${className ?? ''}`} ref={top}>
        <span className="label">● Early access</span>
        <h2 className="intro__title">Design your app in a conversation</h2>
        <p className="intro__lead">
          Tell Claude about the app you want to build. It asks about {totalQuestions(answers)} questions in three parts, the idea,
          how it works and how it looks, choosing each from what you’ve already said. Five minutes or so, and you can skip
          anything you’re not sure of.
        </p>
        {paused ? (
          <div className="intro__paused" role="status">
            <p>
              <strong>{paused}</strong> I can still design your app with you on a free call.
            </p>
            {bookingUrl && <BookCall url={bookingUrl} label="Book a free call" from="app-builder-paused" builderRef={ref} />}
          </div>
        ) : resumable ? (
          <div className="intro__resume">
            <p>
              You started designing <strong>{answers.name?.trim() || 'an app'}</strong> earlier. Carry on where you left off, or start a new one.
            </p>
            <div className="intro__resume-actions">
              {start}
              <button type="button" className="btn btn-outline" onClick={startNew}>
                Start a new app
              </button>
            </div>
          </div>
        ) : (
          <div className="intro__actions">
            {start}
            <span className="intro__note">Free. About five minutes.</span>
          </div>
        )}
        <p className="intro__mine">
          Designed one before? <a href="/app-builder/mine">Your apps</a>
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
        {!paused && start}
      </div>
    )
  }

  if (phase === 'building')
    return (
      <div className={className} ref={top}>
        <PrototypeBuild
          answers={answers}
          favourites={picks}
          options={options}
          onGallery={setGallery}
          heard={heard}
          onHeard={setHeard}
          spent={spentSoFar()}
          builderRef={ref}
          bookingUrl={bookingUrl}
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
        <Showcase
          o={options}
          gallery={gallery}
          built={app}
          intro={{
            name: 'Your app',
            node: <AppReveal options={options} app={app} note={note} onChange={() => setPhase('asking')} onNew={startNew} sketch={<AppPrototype o={options} gallery={gallery} />} />,
          }}
        />

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
          <Interest answers={{...answers, heard}} prototype={app?.id} name={options.name} bookingUrl={bookingUrl} builderRef={ref} />
        </section>
        <BuildDialog answers={{...answers, heard}} prototype={app?.id} name={options.name} accent={options.accent} icon={app?.look.style?.icon} tagline={options.tagline} bookingUrl={bookingUrl} builderRef={ref} from="app-builder" />
        <BuildBar name={options.name} accent={options.accent} />
      </div>
    )
  }

  const value = answers[q.key] ?? ''
  const fallback = value.trim() ? '' : `${options[q.key] ?? ''}`
  const suggestions = turn.suggestions ?? q.suggestions
  // Several picks or one: Claude says which for its own picks, a list row's are several.
  const several = turn.suggestions ? (turn.multi ?? LISTS.has(q.key)) : LISTS.has(q.key)
  const prefilled = Boolean(turn.prefill) && value === turn.prefill
  const chosen = value
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean)
  // While Claude chooses the next question, the one just answered joins the conversation.
  const past = turns.slice(0, thinking ? at + 1 : at)
  const typed = !q.choices && q.key !== 'photo'
  // The box's faint example: Claude's, in their world; else, once Claude has reworded the question, a
  // neutral line (the row's own example is about surfing, and read oddly under a rowing question).
  const placeholder = turn.example ? `e.g. ${turn.example}` : turn.ask === q.ask && q.example ? `e.g. ${q.example}` : q.key === 'email' ? 'you@example.com' : 'Type your answer'

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
              <Said q={questionOf(t.key)} value={answers[t.key] ?? ''} scheme={answers.scheme} picks={picks} />
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
          {q.key === 'nameSure' && answers.name?.trim() && (
            <NameCheckPanel name={answers.name.trim()} onChecked={(summary) => setAnswers((a) => ({...a, nameCheck: summary}))} />
          )}
          {q.key === 'nameSure' && (
            <NameIdeas
              answers={answers}
              onPick={(idea) => {
                if (thinking) return
                const given = {...answers, name: idea.name, nameSure: 'yes', nameCheck: idea.check ? summaryOf(idea.check) : ''}
                setAnswers(given)
                setError(null)
                void forward(given)
              }}
            />
          )}
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
                    className={`builder__kind${on ? ' is-active' : ''}${c.shots ? ' has-icon' : ''}`}
                    onClick={() => (q.multi ? set((on ? chosen.filter((x) => x !== c.value) : [...chosen, c.value]).join(', ')) : answerWith(c.value))}
                  >
                    {c.shots && <img className="builder__icon" src={c.shots.icon} alt="" width={48} height={48} />}
                    <strong>{c.label}</strong>
                    {c.hint && <span>{c.hint}</span>}
                    {c.description && <span className="builder__about">{c.description}</span>}
                  </button>
                )
                // A live app to look at, and its pictures to swipe through, sit beside its choice, never
                // inside it: a link or a button in a button is neither.
                return c.url || c.shots ? (
                  <div key={c.value} className={`builder__template${on ? ' is-active' : ''}`}>
                    {choice}
                    {c.url && (
                      <a className="builder__see" href={c.url} target="_blank" rel="noreferrer">
                        See {c.label.replace(/^Like /, '')} <Arrow />
                      </a>
                    )}
                    {c.shots && <Gallery name={c.label.replace(/^Like /, '')} slides={slidesOf(c.shots)} />}
                  </div>
                ) : (
                  choice
                )
              })}
            </div>
          ) : q.key === 'photo' ? (
            <PhotoSearch
              answers={answers}
              picks={picks}
              onChange={(next) => {
                setPicks(next)
                setAnswers({...answers, photo: next[0]?.url ?? '', photoCredit: next[0]?.credit ?? ''})
                setError(null)
              }}
            />
          ) : null}

          {q.key === 'inspiration' ? (
            <Strip className="builder__refs" label="Apps to pick from: swipe for more, and open any to see its screens">
              {REFERENCES.map((r) => {
                const on = chosen.some((x) => x.toLowerCase() === r.name.toLowerCase())
                const toggle = () => set((on ? chosen.filter((x) => x.toLowerCase() !== r.name.toLowerCase()) : [...chosen, r.name]).join(', '))
                return <RefCard key={r.name} reference={r} on={on} onToggle={toggle} />
              })}
            </Strip>
          ) : q.key === 'logoLikes' ? (
            <Strip className="builder__refs builder__logos" label="App icons to pick from: swipe for more">
              {REFERENCES.map((r) => {
                const on = chosen.some((x) => x.toLowerCase() === r.name.toLowerCase())
                const toggle = () => set((on ? chosen.filter((x) => x.toLowerCase() !== r.name.toLowerCase()) : [...chosen, r.name]).join(', '))
                return <LogoCard key={r.name} reference={r} on={on} onToggle={toggle} />
              })}
            </Strip>
          ) : suggestions && (
            <div className="builder__picks" role="group" aria-label={several ? 'Pick any of these' : 'Pick one of these'}>
              {suggestions.map((s) => {
                const list = several
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

          {q.key === 'accent' && (
            <ul className="schemes" aria-label="Colour schemes">
              {schemesFor(answers).map((s) => {
                const on = answers.scheme === s.id
                return (
                  <li key={s.id}>
                    <button
                      type="button"
                      aria-pressed={on}
                      className={`scheme${on ? ' is-on' : ''}`}
                      onClick={() => {
                        setAnswers({...answers, accent: s.accent, scheme: s.id})
                        setError(null)
                      }}
                    >
                      <span className="scheme__palette" aria-hidden>
                        {(
                          [
                            [s.palette.bg, 1],
                            [s.palette.surface, 1],
                            [s.palette.tint, 1],
                            [s.accent, 2],
                            [s.palette.deep, 1.4],
                          ] as const
                        ).map(([c, grow], i) => (
                          <i key={i} style={{background: c, flexGrow: grow}} />
                        ))}
                      </span>
                      <strong>{s.name}</strong>
                      <span>
                        {s.feel} · {s.canvas}
                      </span>
                      {s.likeApp ? <em>Like {s.likeApp}</em> : s.fits && <em>Suits yours</em>}
                    </button>
                  </li>
                )
              })}
            </ul>
          )}

          {typed && (
            <div className={`chat__composer${q.key === 'accent' ? ' chat__composer--colour' : ''}`}>
              {q.key === 'accent' && (
                <input
                  type="color"
                  aria-label="Pick a colour"
                  value={/^#[0-9a-fA-F]{6}$/.test(value) ? value : '#2F6B4F'}
                  onChange={(e) => {
                    // Their own colour: Claude chooses the canvas again.
                    setAnswers({...answers, accent: e.target.value.toUpperCase(), scheme: ''})
                    setError(null)
                  }}
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
                  placeholder={placeholder}
                />
              ) : (
                <input
                  ref={input}
                  id={`q-${q.key}`}
                  aria-labelledby={`ask-${q.key}`}
                  value={value}
                  onChange={(e) => set(e.target.value)}
                  placeholder={placeholder}
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
            ) : suggestions && several && !value.trim() ? (
              'Pick as many as you like, or type your own, then send.'
            ) : suggestions && !value.trim() ? (
              'Tap one to answer, or type your own.'
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
                onClick={() => {
                  // One of the schemes that suit them (or any, if none does), never the one they're on.
                  const all = schemesFor(answers)
                  const pool = (all.some((s) => s.fits) ? all.filter((s) => s.fits) : all).filter((s) => s.id !== answers.scheme)
                  const s = (pool.length ? pool : all)[Math.floor(Math.random() * (pool.length || all.length))]
                  setAnswers({...answers, accent: s.accent, scheme: s.id})
                }}
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
function Said({q, value, scheme, picks}: {q: Question; value: string; scheme?: string; picks?: Picked[]}) {
  if (!value.trim()) return <p className="chat__skipped">Skipped</p>
  if (q.key === 'photo')
    return (
      <span className="chat__photos">
        {(picks?.length ? picks.map((p) => p.url) : [value]).slice(0, 4).map((url, i) => (
          <img key={url} className="chat__photo" src={url} alt={i ? '' : 'The lead photo picked for the app'} width={160} height={100} loading="lazy" />
        ))}
        {(picks?.length ?? 0) > 4 && <em>+{picks!.length - 4}</em>}
      </span>
    )
  if (q.key === 'accent')
    return (
      <p className="chat__swatch">
        <span style={{background: value}} aria-hidden /> {schemeById(scheme)?.name ?? value.toUpperCase()}
      </p>
    )
  const picked = q.choices?.filter((c) => value.split(',').map((x) => x.trim()).includes(c.value)).map((c) => c.label)
  return <p>{picked?.length ? picked.join(', ') : value}</p>
}

/**
 * One app on the look and feel question: a tap picks it (or takes it back); See screens opens its App
 * Store screens large, with its look in words and a way to pick it there; Mobbin opens it there.
 */
function RefCard({reference: r, on, onToggle}: {reference: Reference; on: boolean; onToggle: () => void}) {
  const [open, setOpen] = useState(false)
  const listing = useListing(r.name)
  const shots = listing?.shots ?? []
  return (
    <li className={`builder__ref${on ? ' is-on' : ''}`}>
      <button type="button" aria-pressed={on} onClick={onToggle}>
        <RefPicture name={r.name} />
        <strong>{r.name}</strong>
        <span>{r.look}</span>
      </button>
      <div className="builder__ref-links">
        {shots.length > 0 && (
          <button type="button" onClick={() => setOpen(true)} aria-label={`See ${r.name}'s screens`}>
            Screens
          </button>
        )}
        <a href={r.mobbin} target="_blank" rel="noopener noreferrer" aria-label={`${r.name} on Mobbin (opens in a new tab)`}>
          Mobbin <Arrow />
        </a>
      </div>
      {open && (
        <Lightbox
          title={r.name}
          slides={shots.map((src, i) => ({src, label: `App Store screen ${i + 1}`}))}
          onClose={() => setOpen(false)}
          aside={
            <div className="ref-aside">
              {listing?.icon && <img className="ref-aside__icon" src={listing.icon} alt="" width={56} height={56} />}
              <strong>{r.name}</strong>
              <p>{r.look}</p>
              <button type="button" className={`btn ${on ? 'btn-outline' : 'btn-primary'} ref-aside__pick`} onClick={onToggle} aria-pressed={on}>
                {on ? 'Picked: tap to take it back' : 'Pick this look'}
              </button>
              <a href={r.mobbin} target="_blank" rel="noopener noreferrer">
                More of it on Mobbin <Arrow />
              </a>
            </div>
          }
        />
      )}
    </li>
  )
}

/**
 * One app icon on the logo question: its icon as the App Store shows it (the mark Mobbin lists the
 * app under), its name and its mark in words; a tap picks it, Mobbin opens the app there.
 */
function LogoCard({reference: r, on, onToggle}: {reference: Reference; on: boolean; onToggle: () => void}) {
  const icon = useListing(r.name)?.icon
  const [broken, setBroken] = useState(false)
  return (
    <li className={`builder__ref builder__logo${on ? ' is-on' : ''}`}>
      <button type="button" aria-pressed={on} onClick={onToggle}>
        {icon && !broken ? (
          <img className="builder__logo-icon" src={icon} alt="" width={64} height={64} loading="lazy" decoding="async" onError={() => setBroken(true)} />
        ) : (
          <span className="builder__logo-icon builder__logo-letter" aria-hidden>
            {r.name.charAt(0).toUpperCase()}
          </span>
        )}
        <strong>{r.name}</strong>
        <span>{r.mark.charAt(0).toUpperCase() + r.mark.slice(1)}</span>
      </button>
      <div className="builder__ref-links">
        <a href={r.mobbin} target="_blank" rel="noopener noreferrer" aria-label={`${r.name} on Mobbin (opens in a new tab)`}>
          Mobbin <Arrow />
        </a>
      </div>
    </li>
  )
}

/** An example's pictures to swipe through: its landing page first, then the app. */
const slidesOf = (shots: Shots): Slide[] => [
  {src: shots.landing, label: 'Landing page'},
  ...shots.srcs.map((src, i) => ({src, label: shots.wide ? `The game, ${i + 1}` : `The app, ${i + 1}`, wide: shots.wide})),
]

const KEPT_TURNS = 'fohm-app-builder-turns'
const KEPT_PICKS = 'fohm-app-builder-photos'

const questionOf = (key: string) => QUESTIONS.find((q) => q.key === key) as Question

/** The first question is always the idea, asked before anything else is known. */
const firstTurns = (): Turn[] => [fallbackNext(emptyAnswers(), []) as Turn]

/** How long Claude gets to choose before the fixed order's next question is shown instead. */
const CHOOSING = 26_000

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
    const next = res.ok ? ((await res.json()) as Next & {spent?: unknown}) : null
    addSpent(next?.spent)
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
