'use client'

import {useEffect, useRef, useState, type CSSProperties, type ReactNode} from 'react'
import {onAccent, soften, type Options} from '@/app-builder/options'

/**
 * The screens fohm-scaffold's template draws, as a clickable prototype in a phone: the landing
 * page, the member app and the owner's dashboard, in the visitor's name, words and colour. Drawn
 * from template/src (components/ui.tsx, landing.tsx, app/onboarding.tsx, home.tsx, path.tsx,
 * game.tsx, admin/) with the template's sample progression, so it looks like what the scaffold
 * makes on day one. Nothing here is stored.
 */

type ScreenId = 'landing' | 'onboarding' | 'home' | 'path' | 'game' | 'dashboard'

const SCREEN_NAMES: Record<ScreenId, string> = {
  landing: 'Landing page',
  onboarding: 'Where are you at?',
  home: 'Home',
  path: 'Your path',
  game: 'The game',
  dashboard: 'Dashboard',
}

const screensFor = (kind: Options['kind']): ScreenId[] =>
  kind === 'coaching'
    ? ['landing', 'onboarding', 'home', 'path', 'dashboard']
    : kind === 'game'
      ? ['landing', 'home', 'game', 'dashboard']
      : ['landing', 'home', 'dashboard']

// The template's sample progression (src/lib/progression.ts), which the coach's own replaces.
const LEVELS = [
  {id: 'start', title: 'Getting started', summary: 'The first things everyone needs, done safely and with confidence.', skills: [['The basics', 'Everything else is built on this.'], ['A routine you keep', 'Little and often beats once in a while.']]},
  {id: 'building', title: 'Building', summary: 'Turning the basics into something reliable.', skills: [['Consistency', 'Doing it well most of the time, not once.'], ['Using feedback', 'The fastest way forward is someone who can see what you can’t.']]},
  {id: 'progressing', title: 'Progressing', summary: 'Stretching into harder things, with a plan.', skills: [['A real challenge', 'Growth happens just past comfortable.'], ['Reviewing your progress', 'Seeing how far you’ve come keeps you going.']]},
]
const ASSESSMENT = [
  {question: 'How much have you done before?', answers: ['Never, or only once or twice', 'A few times, and I know the basics', 'Regularly, and I want to push on']},
  {question: 'How confident do you feel?', answers: ['Not yet', 'Getting there', 'Confident']},
]
const FEATURES = [
  {title: 'Start in a minute', body: 'Create an account and you are in. Nothing to install on the web.'},
  {title: 'On your phone and laptop', body: 'The same account on the web, iPhone and Android.'},
  {title: 'A real person behind it', body: 'Everything you do reaches the people who run it, and they reply.'},
]
const SAMPLE_PEOPLE = ['Sam Okafor', 'Priya Shah', 'Tom Reilly', 'Ana Costa']

const cap = (w: string) => w.charAt(0).toUpperCase() + w.slice(1)

export function AppPrototype({o}: {o: Options}) {
  const screens = screensFor(o.kind)
  const [screen, setScreen] = useState<ScreenId>('landing')
  const [level, setLevel] = useState(0)
  const [got, setGot] = useState<Set<string>>(new Set())
  const scroller = useRef<HTMLDivElement>(null)

  // A new kind of app starts again from its landing page.
  useEffect(() => setScreen('landing'), [o.kind])

  const go = (s: ScreenId) => {
    setScreen(s)
    scroller.current?.scrollTo({top: 0})
  }

  const vars = {
    '--p-accent': o.accent,
    '--p-on-accent': onAccent(o.accent),
    '--p-accent-soft': soften(o.accent),
  } as CSSProperties

  const s = {go, level, setLevel, got, setGot, o}

  return (
    <div className="proto" style={vars}>
      <nav className="proto__tabs" aria-label="Screens">
        {screens.map((id) => (
          <button key={id} type="button" className={id === screen ? 'is-active' : undefined} onClick={() => go(id)}>
            {SCREEN_NAMES[id]}
          </button>
        ))}
      </nav>
      <div className={`proto__phone${screen === 'dashboard' ? ' proto__phone--dark' : ''}`}>
        <div className="proto__status" aria-hidden>
          <span>9:41</span>
          <span>{o.domain || `${o.slug}.vercel.app`}</span>
        </div>
        <div className="proto__screen" ref={scroller}>
          {screen === 'landing' && <Landing {...s} />}
          {screen === 'onboarding' && <Onboarding {...s} />}
          {screen === 'home' && <Home {...s} />}
          {screen === 'path' && <Path {...s} />}
          {screen === 'game' && <Game {...s} />}
          {screen === 'dashboard' && <Dashboard {...s} />}
        </div>
      </div>
    </div>
  )
}

type Props = {
  o: Options
  go: (s: ScreenId) => void
  level: number
  setLevel: (n: number) => void
  got: Set<string>
  setGot: (s: Set<string>) => void
}

function Btn({children, onClick, secondary, disabled}: {children: ReactNode; onClick?: () => void; secondary?: boolean; disabled?: boolean}) {
  return (
    <button type="button" className={`p-btn${secondary ? ' p-btn--secondary' : ''}`} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  )
}

/** The app's mark until the owner's own artwork is traced: its initial on the accent. */
function Mark({o, size = 32}: {o: Options; size?: number}) {
  return (
    <span className="p-mark" style={{width: size, height: size, fontSize: size * 0.5}} aria-hidden>
      {o.name.charAt(0).toUpperCase()}
    </span>
  )
}

function Landing({o, go}: Props) {
  return (
    <div className="p-landing">
      <div className="p-landing__bar">
        <span className="p-brand">
          <Mark o={o} size={26} />
          {o.name}
        </span>
        <button type="button" className="p-link" onClick={() => go('home')}>
          Sign in
        </button>
      </div>
      <h3 className="p-hero">{o.tagline}</h3>
      <div className="p-row">
        <Btn onClick={() => go(o.kind === 'coaching' ? 'onboarding' : 'home')}>Get started</Btn>
        <Btn secondary onClick={() => go('home')}>
          Sign in
        </Btn>
      </div>
      {FEATURES.map((f) => (
        <div key={f.title} className="p-card">
          <p className="p-heading">{f.title}</p>
          <p className="p-body">{f.body}</p>
        </div>
      ))}
      <div className="p-foot">
        <span>© {o.operator}</span>
        <span>Privacy</span>
        <span>Terms</span>
      </div>
    </div>
  )
}

function Onboarding({o, go, setLevel}: Props) {
  const [answers, setAnswers] = useState<(number | null)[]>([null, null])
  const complete = answers.every((a) => a !== null)
  // The template's assess(): most votes wins, the earliest level on a tie.
  const placed = complete
    ? [0, 1, 2].reduce((best, l) => (answers.filter((a) => a === l).length > answers.filter((a) => a === best).length ? l : best), 0)
    : null
  return (
    <div className="p-page">
      <h3 className="p-title">Where are you at?</h3>
      <p className="p-body">A few questions, so {o.name} starts you in the right place.</p>
      {ASSESSMENT.map((q, qi) => (
        <div key={q.question} className="p-stack" role="radiogroup" aria-label={q.question}>
          <p className="p-heading">{q.question}</p>
          {q.answers.map((a, ai) => (
            <button
              key={a}
              type="button"
              role="radio"
              aria-checked={answers[qi] === ai}
              className={`p-choice${answers[qi] === ai ? ' is-on' : ''}`}
              onClick={() => setAnswers(answers.map((x, i) => (i === qi ? ai : x)))}
            >
              {a}
            </button>
          ))}
        </div>
      ))}
      {placed !== null && (
        <div className="p-stack">
          <p className="p-heading">You’ll start at “{LEVELS[placed].title}”</p>
          <p className="p-small">{LEVELS[placed].summary}</p>
        </div>
      )}
      <Btn
        disabled={!complete}
        onClick={() => {
          setLevel(placed ?? 0)
          go('home')
        }}
      >
        Start
      </Btn>
    </div>
  )
}

function nextUp(level: number, got: Set<string>) {
  const skills = LEVELS.slice(level).flatMap((l) => l.skills.map((s) => ({title: s[0], level: l.title})))
  const left = skills.filter((s) => !got.has(s.title))
  return {next: left.slice(0, 3), current: left[0]?.level, finished: skills.length - left.length, total: skills.length}
}

function Home({o, go, level, got}: Props) {
  const path = nextUp(level, got)
  return (
    <div className="p-page">
      <h3 className="p-title">Hi, Sam</h3>
      {o.kind === 'coaching' && (
        <div className="p-card">
          <p className="p-small">
            {path.current ? `${path.current} · ${path.finished} of ${path.total} skills` : 'Every skill done'}
          </p>
          <p className="p-heading">{path.next.length ? 'Next up' : 'You’ve finished the path'}</p>
          {path.next.map((s) => (
            <p key={s.title} className="p-body">
              - {s.title}
            </p>
          ))}
          <Btn>Check in</Btn>
          <Btn secondary onClick={() => go('path')}>
            Your path
          </Btn>
          <p className="p-small">Check in after you practise.</p>
        </div>
      )}
      {o.kind === 'game' && (
        <div className="p-card">
          <p className="p-heading">Catch the dot</p>
          <p className="p-body">Your best: 0 points</p>
          <Btn onClick={() => go('game')}>Play</Btn>
        </div>
      )}
      <div className="p-card">
        <p className="p-heading">
          {o.kind === 'coaching' ? `Ask your ${o.ownerWord}` : o.kind === 'game' ? 'Send feedback' : 'Write something'}
        </p>
        {o.kind === 'coaching' && (
          <p className="p-small">A question, or a clip for feedback: attach a video, or paste a link to one.</p>
        )}
        <span className="p-label">Title</span>
        <span className="p-input" />
        <span className="p-label">Details</span>
        <span className="p-input p-input--tall" />
        {o.kind === 'coaching' && <Btn secondary>Attach a video</Btn>}
        <Btn>Save</Btn>
      </div>
      <div className="p-card">
        <p className="p-heading">{o.kind === 'coaching' ? 'My first clip' : 'First thoughts'}</p>
        <p className="p-body">{o.kind === 'coaching' ? 'Is my timing right on this one?' : 'Loving it so far.'}</p>
        <div className="p-reply">
          <p className="p-small p-small--accent">Reply</p>
          <p className="p-body">
            {o.kind === 'coaching' ? 'Nearly. Start a beat earlier and send me another.' : `Thanks, Sam. Glad you’re here.`}
          </p>
        </div>
      </div>
      {o.kind === 'coaching' && <Btn secondary>Library</Btn>}
      <Btn secondary>Your account</Btn>
    </div>
  )
}

function Path({o, go, level, got, setGot}: Props) {
  const path = nextUp(level, got)
  const toggle = (t: string) => {
    const n = new Set(got)
    if (n.has(t)) n.delete(t)
    else n.add(t)
    setGot(n)
  }
  return (
    <div className="p-page">
      <h3 className="p-title">Your path</h3>
      <p className="p-body">
        {path.finished} of {path.total} skills{path.current ? `, working on “${path.current}”` : ': all done'}
      </p>
      <div className="p-progress" role="progressbar" aria-valuemin={0} aria-valuemax={path.total} aria-valuenow={path.finished}>
        <span style={{width: `${(path.finished / path.total) * 100}%`}} />
      </div>
      {LEVELS.slice(level).map((l) => (
        <div key={l.id} className={`p-card${l.title === path.current ? ' p-card--current' : ''}`}>
          <p className="p-heading">{l.title}</p>
          <p className="p-small">{l.summary}</p>
          {l.skills.map(([title, why]) => (
            <button key={title} type="button" role="checkbox" aria-checked={got.has(title)} className="p-skill" onClick={() => toggle(title)}>
              <span className={`p-check${got.has(title) ? ' is-on' : ''}`} aria-hidden />
              <span>
                <strong>{title}</strong>
                <span className="p-small">{why}</span>
                {got.has(title) && title === 'The basics' && (
                  <span className="p-small p-small--accent">
                    {cap(o.ownerWord)}: Lovely. Keep it up.
                  </span>
                )}
              </span>
            </button>
          ))}
        </div>
      ))}
      <Btn secondary onClick={() => go('home')}>
        Back
      </Btn>
    </div>
  )
}

function Game({go}: Props) {
  const [points, setPoints] = useState(0)
  const [streak, setStreak] = useState(0)
  const [dot, setDot] = useState({x: 40, y: 30})
  const move = () => setDot({x: 8 + Math.random() * 74, y: 8 + Math.random() * 74})
  return (
    <div className="p-page">
      <h3 className="p-title">Catch the dot</h3>
      <div className="p-row p-row--between">
        <p className="p-heading">{points} points</p>
        <p className="p-heading">30s</p>
      </div>
      <div
        className="p-board"
        onClick={(e) => {
          if (e.target === e.currentTarget) setStreak(0)
        }}
      >
        <button
          type="button"
          aria-label="The dot"
          className="p-dot"
          style={{left: `${dot.x}%`, top: `${dot.y}%`}}
          onClick={() => {
            setPoints(points + streak + 1)
            setStreak(streak + 1)
            move()
          }}
        />
      </div>
      <p className="p-body" style={{textAlign: 'center'}}>
        Tap the dot before it moves. Each catch in a row is worth one more point.
      </p>
      <Btn secondary onClick={() => go('home')}>
        Back
      </Btn>
    </div>
  )
}

function Dashboard({o}: Props) {
  const coaching = o.kind === 'coaching'
  return (
    <div className="p-page p-dash">
      <div className="p-dash__tabs">
        <span className="is-on">People</span>
        <span>Activity</span>
        <span>Settings</span>
      </div>
      <h3 className="p-title">People</h3>
      <p className="p-small">Everyone with an account, with what needs you on top.</p>
      <p className="p-dash__section">Needs you</p>
      <div className="p-dash__card">
        <div className="p-row p-row--between">
          <strong>{SAMPLE_PEOPLE[1]}</strong>
          <span className="p-badge p-badge--highlight">Needs a reply</span>
        </div>
        <span className="p-small">{coaching ? 'Sent a clip: “Is my timing right on this one?”' : o.kind === 'game' ? 'Feedback: “Can there be a harder level?”' : 'Wrote: “First thoughts”'}</span>
      </div>
      <p className="p-dash__section">Everyone ({SAMPLE_PEOPLE.length})</p>
      {SAMPLE_PEOPLE.map((p, i) => (
        <div key={p} className="p-dash__card">
          <div className="p-row p-row--between">
            <strong>{p}</strong>
            {i === 2 ? <span className="p-badge p-badge--good">Pro</span> : null}
          </div>
          <span className="p-small">
            {cap(o.memberWord)} ·{' '}
            {coaching ? `${LEVELS[i % 3].title}, ${i + 1} check-in${i ? 's' : ''}` : o.kind === 'game' ? `Best ${(4 - i) * 37} points` : `${i + 2} entries`}
          </span>
        </div>
      ))}
    </div>
  )
}
