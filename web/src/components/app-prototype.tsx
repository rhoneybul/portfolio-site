'use client'

import {useEffect, useRef, useState, type CSSProperties, type ReactNode} from 'react'
import {interestsOf, liftedAccent, needsYou, onAccent, soften, type Options} from '@/app-builder/options'
import {RING_PATH} from '@/app-builder/prototype-doc'

/**
 * The screens fohm-scaffold's template draws, as a clickable prototype in a phone, in the house
 * style it ships with (template/src/lib/theme.ts and DESIGN.md: Space Grotesk 600 and DM Sans, a
 * cool grey canvas, white cards, hairline rows, the ink pill with an accent disc, the floating tab
 * bar), with the visitor's name, words, colour, photo, onboarding and method. Nothing is stored.
 */

type ScreenId = 'landing' | 'onboarding' | 'home' | 'path' | 'game' | 'dashboard'

const screensFor = (o: Options): {id: ScreenId; name: string}[] => [
  {id: 'landing', name: 'Landing page'},
  ...(o.kind === 'game' ? [] : [{id: 'onboarding' as const, name: 'Onboarding'}]),
  {id: 'home', name: 'Home'},
  ...(o.kind === 'coaching' ? [{id: 'path' as const, name: o.coach === 'yes' ? 'Your path' : 'Your program'}] : []),
  ...(o.kind === 'game' ? [{id: 'game' as const, name: 'The game'}] : []),
  {id: 'dashboard', name: 'Dashboard'},
]

const cap = (w: string) => w.charAt(0).toUpperCase() + w.slice(1)

// The template's sample progression (src/lib/progression.ts), used where the visitor gave none.
const SAMPLE_LEVELS = [
  {title: 'Getting started', skills: ['The basics', 'A routine you keep']},
  {title: 'Building', skills: ['Consistency', 'Using feedback']},
  {title: 'Progressing', skills: ['A real challenge', 'Reviewing your progress']},
]

/** "Foam board: paddling, pop-ups. Green waves: angling." as levels and their skills. */
function levelsOf(o: Options) {
  const parsed = (o.levels || '')
    .split(/\n|\.\s+|;\s*/)
    .map((chunk) => chunk.trim().replace(/\.$/, ''))
    .filter(Boolean)
    .map((chunk) => {
      const [title, rest] = chunk.split(/:\s*/, 2)
      return {title: cap(title.trim()), skills: (rest ?? '').split(/,\s*|\s+and\s+/).map((s) => cap(s.trim())).filter(Boolean)}
    })
    .filter((l) => l.title)
  return parsed.length ? parsed.map((l) => ({...l, skills: l.skills.length ? l.skills : ['The basics']})) : SAMPLE_LEVELS
}

/** The first goal they named: "Big-wave spots: Nazaré, Mavericks" is Nazaré. */
function firstGoal(o: Options) {
  const g = o.goals || ''
  const list = g.includes(':') ? g.split(':')[1] : g
  return list.split(/,|\n| and /)[0]?.trim() || 'Your goal'
}

/** The goals they named, a few: "Big-wave spots: Nazaré, Mavericks, Jaws" is those three. */
export function goalsOf(o: Options) {
  const g = o.goals || ''
  return (g.includes(':') ? g.split(':')[1] : g)
    .split(/,|\n| and /)
    .map((x) => x.trim())
    .filter(Boolean)
    .slice(0, 3)
}

const firstPlacing = (o: Options) => {
  const q = (o.placing || '').split('?')[0]?.trim()
  return q ? `${q}?` : 'How much have you done before?'
}

const SAMPLE_PEOPLE = ['Sam Okafor', 'Priya Shah', 'Tom Reilly', 'Ana Costa']

/** A photo for a slot: where it comes from, and its credit, shown inside its card. */
export interface Pic {
  url: string
  credit?: string
}

export function AppPrototype({o, gallery = []}: {o: Options; gallery?: Pic[]}) {
  const screens = screensFor(o)
  const [screen, setScreen] = useState<ScreenId>('landing')
  const [done, setDone] = useState<Set<string>>(new Set())
  const scroller = useRef<HTMLDivElement>(null)

  // A different kind of app starts again from its landing page.
  useEffect(() => setScreen('landing'), [o.kind])

  const go = (s: ScreenId) => {
    setScreen(s)
    scroller.current?.scrollTo({top: 0})
  }

  const vars = {
    '--x-accent': o.accent,
    '--x-on-accent': onAccent(o.accent),
    '--x-accent-soft': soften(o.accent),
    '--x-dash-accent': liftedAccent(o.accent),
    '--x-on-dash': onAccent(liftedAccent(o.accent)),
    '--x-needs-you': needsYou(o.accent),
  } as CSSProperties

  // Slot 0 leads (the landing page, onboarding, the goal): their own photo if they gave one. The rest go round the gallery.
  const photos: Pic[] = [...(o.photo ? [{url: o.photo, credit: o.photoCredit}] : []), ...gallery.filter((g) => g.url !== o.photo)]
  const pic = (slot: number): Pic | undefined => (photos.length ? photos[slot % photos.length] : undefined)
  const props: Props = {o, go, done, setDone, pic}
  const tabbed = screen === 'home' || screen === 'path' || screen === 'game'

  return (
    <div className="proto" style={vars}>
      <nav className="proto__tabs" aria-label="Screens">
        {screens.map((s) => (
          <button key={s.id} type="button" className={s.id === screen ? 'is-active' : undefined} onClick={() => go(s.id)}>
            {s.name}
          </button>
        ))}
      </nav>
      <div className={`proto__phone${screen === 'dashboard' ? ' proto__phone--dark' : ''}`}>
        <div className="proto__screen x" ref={scroller}>
          {screen === 'landing' && <Landing {...props} />}
          {screen === 'onboarding' && <Onboarding {...props} />}
          {screen === 'home' && <Home {...props} />}
          {screen === 'path' && <Path {...props} />}
          {screen === 'game' && <Game {...props} />}
          {screen === 'dashboard' && <Dashboard {...props} />}
        </div>
        {tabbed && <TabBar {...props} at={screen} />}
      </div>
    </div>
  )
}

type Props = {o: Options; go: (s: ScreenId) => void; done: Set<string>; setDone: (s: Set<string>) => void; pic: (slot: number) => Pic | undefined}

// ---------- The kit ----------

const Icon = ({d, size = 22}: {d: string; size?: number}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d={d} />
  </svg>
)
const ARROW = 'M5 12h14M13 6l6 6-6 6'
const CHEVRON = 'M9 6l6 6-6 6'
const IMAGE = 'M4 4h16v16H4zM8.5 10a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3M20 15l-5-5L5 20'
const HOME = 'M3 10l9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z'
const TREND = 'M23 6l-9.5 9.5-5-5L1 18M17 6h6v6'
const BOOK = 'M2 4h7a3 3 0 0 1 3 3v13a2 2 0 0 0-2-2H2zM22 4h-7a3 3 0 0 0-3 3v13a2 2 0 0 1 2-2h8z'
const USER = 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8'
const PLAY = 'M6 4l14 8-14 8z'
const FLAG = 'M4 22V4s1-1 4-1 5 2 8 2 4-1 4-1v11s-1 1-4 1-5-2-8-2-4 1-4 1'

/** The ink pill with the accent disc: the one thing to press. */
function Primary({children, onClick, disabled}: {children: ReactNode; onClick?: () => void; disabled?: boolean}) {
  return (
    <button type="button" className="x-primary" onClick={onClick} disabled={disabled}>
      <span>{children}</span>
      <span className="x-primary__disc">
        <Icon d={ARROW} size={20} />
      </span>
    </button>
  )
}

/** A photo slot, its credit inside it: a found or given photo, or the template's clean stand-in on the track grey. */
function Photo({p, className, children}: {p?: Pic; className?: string; children?: ReactNode}) {
  return (
    <div className={`x-photo ${className ?? ''}`}>
      {p ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={p.url} alt="" referrerPolicy="no-referrer" />
      ) : (
        <span className="x-photo__stand-in">
          <Icon d={IMAGE} size={26} />
        </span>
      )}
      {children}
      {p?.credit && <span className="x-photo__credit">{p.credit}</span>}
    </div>
  )
}

/** A row's photo: the 56pt square thumbnail every list row carries. */
function Thumb({p}: {p?: Pic}) {
  return (
    <span className="x-thumb">
      {p ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={p.url} alt="" referrerPolicy="no-referrer" />
      ) : (
        <Icon d={IMAGE} size={18} />
      )}
    </span>
  )
}

/** The template's mark until the logo round draws the app's own: a ring and a dot, in the app's colour. */
export function Mark({size = 28, tone = 'accent'}: {size?: number; tone?: 'accent' | 'white'}) {
  return (
    <svg className={`x-mark x-mark--${tone}`} width={size} height={size} viewBox="192 192 640 640" aria-hidden>
      <path d={RING_PATH} fillRule="evenodd" />
    </svg>
  )
}

function Avatar({name, size = 56}: {name: string; size?: number}) {
  return (
    <span className="x-avatar" style={{width: size, height: size, fontSize: size * 0.42}} aria-hidden>
      {name.charAt(0)}
    </span>
  )
}

function Row({title, line, lead, onClick, chevron = true}: {title: string; line?: string; lead?: ReactNode; onClick?: () => void; chevron?: boolean}) {
  return (
    <button type="button" className="x-row" onClick={onClick}>
      {lead}
      <span className="x-row__text">
        <span className="x-row__title">{title}</span>
        {line && <span className="x-row__line">{line}</span>}
      </span>
      {chevron && (
        <span className="x-row__chevron">
          <Icon d={CHEVRON} size={20} />
        </span>
      )}
    </button>
  )
}

function Dots({at, of}: {at: number; of: number}) {
  return (
    <span className="x-dots" aria-label={`Step ${at + 1} of ${of}`}>
      {Array.from({length: of}, (_, i) => (
        <span key={i} className={i === at ? 'is-on' : i < at ? 'is-past' : undefined} />
      ))}
    </span>
  )
}

function TabBar({o, go, at}: Props & {at: ScreenId}) {
  const tabs: {id: ScreenId | null; label: string; d: string}[] = [
    {id: 'home', label: 'Home', d: HOME},
    ...(o.kind === 'coaching' ? [{id: 'path' as const, label: o.coach === 'yes' ? 'Path' : 'Program', d: TREND}] : []),
    ...(o.kind === 'game' ? [{id: 'game' as const, label: 'Play', d: PLAY}] : []),
    {id: null, label: 'Library', d: BOOK},
    {id: null, label: 'You', d: USER},
  ]
  return (
    <nav className="x-tabbar" aria-label="Tabs">
      {tabs.map((t) => (
        <button key={t.label} type="button" className={t.id === at ? 'is-on' : undefined} onClick={() => t.id && go(t.id)}>
          <Icon d={t.d} />
          <span>{t.label}</span>
        </button>
      ))}
    </nav>
  )
}

// ---------- The screens ----------

function Landing({o, go, pic}: Props) {
  return (
    <div className="x-landing">
      <Photo p={pic(0)} className="x-landing__photo">
        <div className="x-landing__bar">
          <span className="x-landing__name">
            <Mark size={26} tone="white" />
            {o.name}
          </span>
          <button type="button" className="x-landing__signin" onClick={() => go('home')}>
            Sign in
          </button>
        </div>
      </Photo>
      <div className="x-landing__body">
        <h3 className="x-hero">{o.tagline}</h3>
        <p className="x-body">
          {o.description || `${o.idea || 'What this app does, for whom, and what changes for them once they use it.'}`}
        </p>
        <Primary onClick={() => go(o.kind === 'game' ? 'home' : 'onboarding')}>Get started</Primary>
        <button type="button" className="x-link" onClick={() => go('home')}>
          I already have an account
        </button>
      </div>
    </div>
  )
}

function Onboarding({o, go, pic}: Props) {
  const interests = interestsOf(o)
  const steps = ['hello', 'placing', 'interests', 'week', 'ready'] as const
  const [at, setAt] = useState(0)
  const [picked, setPicked] = useState<string[]>([])
  const [placed, setPlaced] = useState<number | null>(null)
  const [days, setDays] = useState(3)
  const [minutes, setMinutes] = useState(30)
  const levels = levelsOf(o)
  const step = steps[at]
  const next = () => (at < steps.length - 1 ? setAt(at + 1) : go('home'))
  const dotted = steps.length - 2

  // The opening, a line to a screen: what the app is for, what people do in it, and where it starts them.
  const helloLines = [
    o.idea || 'Want to get better at it, week by week?',
    o.tagline,
    `${o.name} starts you where you are and shows you what to do next.`,
  ]
  const [line, setLine] = useState(0)

  if (step === 'hello')
    return (
      <div className="x-onb x-onb--hello">
        <Photo p={pic(1)} className="x-onb__photo" />
        <button type="button" className="x-skip" onClick={() => go('home')}>
          Skip
        </button>
        <div className="x-onb__foot">
          <p className="x-onb__line">{helloLines[line]}</p>
          <Dots at={line} of={helloLines.length} />
          <Primary onClick={() => (line < helloLines.length - 1 ? setLine(line + 1) : next())}>
            {line < helloLines.length - 1 ? 'Continue' : 'Get started'}
          </Primary>
        </div>
      </div>
    )

  return (
    <div className="x-onb">
      <div className="x-onb__top">
        <Dots at={at - 1} of={dotted} />
        <button type="button" className="x-skip x-skip--light" onClick={next}>
          Skip
        </button>
      </div>

      {step === 'placing' && (
        <>
          <h3 className="x-display">{firstPlacing(o)}</h3>
          <div className="x-card x-card--rows">
            {['Never, or only once or twice', 'A few times, and I know the basics', 'Regularly, and I want to push on'].map((label, i) => (
              <Row
                key={label}
                title={label}
                chevron={false}
                lead={<span className={`x-radio${placed === i ? ' is-on' : ''}`} />}
                onClick={() => {
                  setPlaced(Math.min(i, levels.length - 1))
                  setTimeout(next, 180)
                }}
              />
            ))}
          </div>
        </>
      )}

      {step === 'interests' && (
        <>
          <h3 className="x-display">What are you here for?</h3>
          <p className="x-body">Pick any. We put them first.</p>
          <div className="x-grid">
            {interests.map((w) => (
              <button
                key={w}
                type="button"
                className={`x-tile${picked.includes(w) ? ' is-on' : ''}`}
                aria-pressed={picked.includes(w)}
                onClick={() => setPicked(picked.includes(w) ? picked.filter((x) => x !== w) : [...picked, w])}
              >
                {w}
              </button>
            ))}
          </div>
          <Primary onClick={next}>Continue</Primary>
        </>
      )}

      {step === 'week' && (
        <>
          <h3 className="x-display">How much can you give it?</h3>
          <p className="x-body">Be honest: a routine you keep beats one you don’t.</p>
          <p className="x-label">Days a week</p>
          <div className="x-chips">
            {[1, 2, 3, 4, 5, 6].map((d) => (
              <button key={d} type="button" className={`x-chip${days === d ? ' is-on' : ''}`} onClick={() => setDays(d)}>
                {d}
              </button>
            ))}
          </div>
          <p className="x-label">Minutes a session</p>
          <div className="x-chips">
            {[15, 20, 30, 45, 60].map((m) => (
              <button key={m} type="button" className={`x-chip${minutes === m ? ' is-on' : ''}`} onClick={() => setMinutes(m)}>
                {m}
              </button>
            ))}
          </div>
          <div className="x-card x-numeral">
            <span className="x-stat">{Math.round(((days * minutes) / 60) * 10) / 10}</span>
            <span className="x-body">hours a week</span>
          </div>
          <Primary onClick={next}>Continue</Primary>
        </>
      )}

      {step === 'ready' && (
        <>
          <h3 className="x-display">Where you start</h3>
          <Photo p={pic(0)} className="x-photocard">
            <span className="x-photocard__shade" />
            <span className="x-photocard__text">
              <span className="x-photocard__title">
                {o.kind === 'coaching' ? `You’ll start at ${levels[placed ?? 0].title}` : `Your ${o.name}`}
              </span>
              <span className="x-photocard__line">
                {days} days a week, {minutes} minutes a session
              </span>
            </span>
          </Photo>
          <div className="x-card x-card--rows">
            {(picked.length ? picked : interests.slice(0, 3)).map((w) => (
              <Row key={w} title={w} line="First in your app" chevron={false} />
            ))}
          </div>
          <Primary onClick={() => go('home')}>Start</Primary>
        </>
      )}
    </div>
  )
}

function Home({o, go, pic}: Props) {
  const levels = levelsOf(o)
  const today = (new Date().getDay() + 6) % 7
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Morning' : hour < 18 ? 'Afternoon' : 'Evening'
  const coach = o.coach === 'yes'
  return (
    <div className="x-page">
      <div className="x-greeting">
        <h3 className="x-hero">{greeting}, Sam</h3>
        <Avatar name="Sam" />
      </div>

      <div className="x-card x-card--rows">
        <Row title="Getting started" line={o.tagline} chevron={false} lead={<span className="x-well"><Icon d={FLAG} size={20} /></span>} />
        {(o.kind === 'game'
          ? ['Play your first round', 'Set your best score', 'Tell us what you think']
          : o.kind === 'coaching'
            ? ['Find your level', 'Check in after you practise', coach ? `Ask your ${o.ownerWord} something` : 'Save a goal']
            : ['Write your first entry', 'Add your photo', 'Save a goal']
        ).map((t, i) => (
          <Row key={t} title={t} line={['A few questions, to see where you start', 'How it went, in a tap', coach ? 'A question, or a clip for feedback' : 'It comes back on Home'][i]} lead={<span className="x-radio" />} />
        ))}
      </div>

      {o.kind !== 'game' && (
        <Photo p={pic(0)} className="x-photocard x-photocard--tall">
          <span className="x-badge">
            <span className="x-badge__dot" />
            Your goal
          </span>
          <span className="x-photocard__shade" />
          <span className="x-photocard__text">
            <span className="x-photocard__title">{firstGoal(o)}</span>
            <span className="x-photocard__line">{o.kind === 'coaching' ? `Up next: ${levels[0].skills[0]}` : 'Saved, with what gets you there'}</span>
          </span>
        </Photo>
      )}

      {o.kind === 'game' && (
        <Photo p={pic(0)} className="x-photocard x-photocard--tall">
          <span className="x-photocard__shade" />
          <span className="x-photocard__text">
            <span className="x-photocard__title">Catch the dot</span>
            <span className="x-photocard__line">Your best: 0 points</span>
          </span>
        </Photo>
      )}

      {o.kind !== 'game' && (
        <div className="x-section">
          <p className="x-heading">{goalsOf(o).length > 1 ? 'Places to work towards' : 'Saved'}</p>
          <div className="x-card x-card--rows">
            {(goalsOf(o).length ? goalsOf(o) : ['Your first goal', 'A course to get there']).map((g, i) => (
              <Row key={g} title={g} line={i === 0 ? 'Your goal' : 'Saved'} lead={<Thumb p={pic(i + 2)} />} />
            ))}
          </div>
        </div>
      )}

      <div className="x-card">
        <p className="x-heading">This week</p>
        <div className="x-week">
          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
            <span key={i} className={`x-day${i === today ? ' is-today' : ''}`}>
              <span>{d}</span>
              <span className="x-day__ring" />
            </span>
          ))}
        </div>
      </div>

      {o.kind === 'coaching' && <Primary onClick={() => go('path')}>{coach ? 'Your path' : 'Your program'}</Primary>}
      {o.kind === 'game' && <Primary onClick={() => go('game')}>Play</Primary>}
      <div className="x-tabbar-room" />
    </div>
  )
}

function Path({o, done, setDone}: Props) {
  const levels = levelsOf(o)
  const all = levels.flatMap((l) => l.skills)
  const finished = all.filter((s) => done.has(s)).length
  const current = levels.find((l) => l.skills.some((s) => !done.has(s)))
  const toggle = (s: string) => {
    const n = new Set(done)
    if (n.has(s)) n.delete(s)
    else n.add(s)
    setDone(n)
  }
  return (
    <div className="x-page">
      <h3 className="x-hero">{o.coach === 'yes' ? 'Your path' : 'Your program'}</h3>
      <p className="x-body">
        {finished} of {all.length} skills{current ? `, working on ${current.title}` : ': all done'}
      </p>
      <div className="x-progress" role="progressbar" aria-valuemin={0} aria-valuemax={all.length} aria-valuenow={finished}>
        <span style={{width: `${(finished / all.length) * 100}%`}} />
      </div>
      {levels.map((l) => (
        <div key={l.title} className="x-section">
          <p className="x-heading">{l.title}</p>
          <div className="x-card x-card--rows">
            {l.skills.map((s) => (
              <Row
                key={s}
                title={s}
                line={done.has(s) ? (o.coach === 'yes' ? `${cap(o.ownerWord)}: lovely, keep it up` : 'Done') : 'Tap when you’ve got it'}
                chevron={false}
                lead={<span className={`x-check${done.has(s) ? ' is-on' : ''}`} />}
                onClick={() => toggle(s)}
              />
            ))}
          </div>
        </div>
      ))}
      <div className="x-tabbar-room" />
    </div>
  )
}

function Game({o}: Props) {
  const [points, setPoints] = useState(0)
  const [streak, setStreak] = useState(0)
  const [dot, setDot] = useState({x: 40, y: 30})
  return (
    <div className="x-page">
      <h3 className="x-hero">Catch the dot</h3>
      <div className="x-split">
        <span className="x-stat x-stat--small">{points}</span>
        <span className="x-body">points · 30s</span>
      </div>
      <div className="x-board" onClick={(e) => e.target === e.currentTarget && setStreak(0)}>
        <button
          type="button"
          aria-label="The dot"
          className="x-dot"
          style={{left: `${dot.x}%`, top: `${dot.y}%`}}
          onClick={() => {
            setPoints(points + streak + 1)
            setStreak(streak + 1)
            setDot({x: 8 + Math.random() * 74, y: 8 + Math.random() * 74})
          }}
        />
      </div>
      <p className="x-body">Tap the dot before it moves. Each catch in a row is worth one more point, in {o.name}.</p>
      <div className="x-tabbar-room" />
    </div>
  )
}

function Dashboard({o}: Props) {
  const coaching = o.kind === 'coaching'
  const members = `${o.memberWord}s`
  return (
    <div className="x-page x-dash">
      <div className="x-dash__tabs">
        <span className="is-on">People</span>
        <span>Activity</span>
        <span>Settings</span>
      </div>
      <h3 className="x-hero">People</h3>
      <p className="x-body">Everyone with an account, with what needs you on top.</p>
      <div className="x-dash__stats">
        <div>
          <span className="x-stat x-stat--small">{SAMPLE_PEOPLE.length}</span>
          <span>{members}</span>
        </div>
        <div>
          <span className="x-stat x-stat--small">1</span>
          <span>needs you</span>
        </div>
      </div>
      <p className="x-heading">Needs you</p>
      <div className="x-dash__card">
        <Avatar name={SAMPLE_PEOPLE[1]} size={40} />
        <span className="x-row__text">
          <span className="x-row__title">{SAMPLE_PEOPLE[1]}</span>
          <span className="x-row__line">
            {coaching ? (o.coach === 'yes' ? 'Sent a clip for feedback' : 'Wrote to the team') : o.kind === 'game' ? 'Sent feedback' : 'Wrote something'}
          </span>
        </span>
        <span className="x-dash__badge">Needs a reply</span>
      </div>
      <p className="x-heading">Everyone ({SAMPLE_PEOPLE.length})</p>
      <div className="x-dash__list">
        {SAMPLE_PEOPLE.map((p, i) => (
          <div key={p} className="x-dash__row">
            <Avatar name={p} size={40} />
            <span className="x-row__text">
              <span className="x-row__title">{p}</span>
              <span className="x-row__line">
                {cap(o.memberWord)} · {coaching ? levelsOf(o)[i % levelsOf(o).length].title : o.kind === 'game' ? `Best ${(4 - i) * 37}` : `${i + 2} entries`}
              </span>
            </span>
            {i === 2 && <span className="x-dash__pro">Pro</span>}
          </div>
        ))}
      </div>
    </div>
  )
}
