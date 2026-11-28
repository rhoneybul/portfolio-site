'use client'

import {useEffect, useRef, useState, type CSSProperties} from 'react'
import {type Pic} from '@/components/app-prototype'
import {AppIcon} from '@/components/app-icon'
import {HeardAsk} from '@/components/heard-ask'
import {BookCall} from '@/components/book-call'
import {CallInvite} from '@/components/call-invite'
import {CopyButton} from '@/components/copy-button'
import {PrototypeThumb} from '@/components/prototype-frame'
import type {Answers, Options} from '@/app-builder/options'
import {HOUSE, type Drawn, type Job, type Look, type Plan, type Style} from '@/app-builder/prototype-doc'
import type {Mark} from '@/app-builder/logos'
import type {Spend} from '@/app-builder/cost'
import {addSpent} from '@/components/spent'
import type {ShareStatus} from '@/app-builder/mcp-build'

/**
 * Claude designing the visitor's app, live. The build runs on the server (/api/prototype/build,
 * app-builder/mcp-build.ts), so they can close the tab: they're emailed its link when it's done, and
 * the link works for a week. This page follows it every few seconds: the logo round (a tap picks the
 * icon used from the next screen drawn), the photos, the plan, then each part as it's drawn. While
 * it works: where they heard about Fohm, and a free call to book. If the build can't start (the
 * builder is paused, or they've drawn a few today) or Claude can't finish, it hands back to the
 * builder's quick sketch.
 */

export interface Built {
  id: string
  look: Look
  plan: Plan
  units: Drawn[]
}

type State = 'waiting' | 'drawing' | 'done' | 'failed'

const AT_ONCE = 5

/** How often the page asks how far the build has got. */
const EVERY = 2_500

/** What the build's page is told each time it asks (/api/prototype/build/<id>). */
interface Progress {
  status: ShareStatus
  parts: number
  drawn: string[]
  photos: {url: string; credit: string}[]
  marks: Mark[] | null
  mark: string | null
  job: {id: string; look: Look; plan: Plan} | null
  units: Drawn[]
  /** Parts said to be drawn that can't be read: the page stops waiting for them. */
  missing?: string[]
}

const iconOf = (d: string): Style['icon'] => ({shape: 'svg', letters: '', d})

/** The plan with the logo picked as its icon, as the server sets it (prototype.ts, withMark). */
const withLogo = (job: Job, d: string): Job => ({...job, look: {...job.look, style: {...(job.look.style ?? HOUSE), icon: iconOf(d)}}})

const clock = (ms: number) => {
  const s = Math.max(0, Math.floor(ms / 1000))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

type Stage = 'photos' | 'planning' | 'drawing'

/** How long each part usually takes, until the build has timed parts of its own. */
const USUAL = {photos: 15_000, planning: 75_000, part: 80_000, parts: 13}

/** A share of the way through a wait of about `usual`: moves fast at first, never quite arrives. */
const creep = (ms: number, usual: number) => 1 - Math.exp(-ms / usual)

/**
 * Where the build is, as a share of the whole (photos 5%, the plan 20%, the drawing 75%) and the
 * time left. The drawing's time comes from the parts already drawn once there are some.
 */
export function progressOf(p: {stage: Stage; inStage: number; parts: number; done: number; drawingFor: number[]; partMs?: number}) {
  const part = p.partMs ?? USUAL.part
  const parts = p.parts || USUAL.parts
  const drawLeft = (left: number) => Math.ceil(left / AT_ONCE) * part
  if (p.stage === 'photos')
    return {share: 0.05 * creep(p.inStage, USUAL.photos), left: Math.max(USUAL.photos - p.inStage, 5_000) + USUAL.planning + drawLeft(parts)}
  if (p.stage === 'planning')
    return {share: 0.05 + 0.2 * creep(p.inStage, USUAL.planning), left: Math.max(USUAL.planning - p.inStage, 15_000) + drawLeft(parts)}
  const under = p.drawingFor.reduce((sum, ms) => sum + Math.min(ms / part, 0.9), 0)
  const waiting = parts - p.done - p.drawingFor.length
  const longestLeft = Math.max(0, ...p.drawingFor.map((ms) => part - ms))
  const left = p.done >= parts ? 0 : Math.max(longestLeft, 10_000) + drawLeft(Math.max(waiting, 0))
  return {share: 0.25 + (0.75 * (p.done + under)) / parts, left}
}

const timeLeft = (ms: number) => {
  if (ms <= 15_000) return 'Almost done'
  if (ms < 60_000) return 'Under a minute left'
  const m = Math.round(ms / 60_000)
  return m === 1 ? 'About a minute left' : `About ${m} minutes left`
}

export function PrototypeBuild({
  answers,
  options,
  favourites = [],
  onBuilt,
  onSketch,
  onGallery,
  heard = '',
  onHeard,
  spent,
  builderRef,
  bookingUrl,
}: {
  answers: Answers
  options: Options
  /** The photos they picked at the photo question, their favourite first. */
  favourites?: {url: string; credit: string}[]
  /** Where they heard about Fohm, asked while it builds (heard-ask.tsx). */
  heard?: string
  onHeard?: (v: string) => void
  /** What Claude cost for the questions, for the build's total in Slack. */
  spent?: Spend
  /** This visit's reference, so a call they book joins what they built. */
  builderRef?: string
  bookingUrl?: string | null
  onBuilt: (b: Built) => void
  onSketch: (note?: string) => void
  onGallery: (pics: Pic[]) => void
}) {
  const [stage, setStage] = useState<Stage>('photos')
  const [stageAt, setStageAt] = useState<Record<Stage, number>>({photos: Date.now(), planning: 0, drawing: 0})
  const [photoCount, setPhotoCount] = useState(0)
  const [partFrom, setPartFrom] = useState<Record<string, number>>({})
  const [took, setTook] = useState<Record<string, number>>({})
  const [now, setNow] = useState(Date.now())
  const [job, setJob] = useState<Job | null>(null)
  const [states, setStates] = useState<Record<string, State>>({})
  const [drawn, setDrawn] = useState<Record<string, Drawn>>({})
  const [elapsed, setElapsed] = useState(0)
  // The logo round, for an owner without a logo: the marks Claude drew, and the one picked (the first until they tap).
  const wantsLogo = answers.logo !== 'yes'
  // 'none' is no logo wanted; 'failed' is a round that came back empty, which can be drawn again.
  const [marks, setMarks] = useState<Mark[] | 'drawing' | 'none' | 'failed'>(wantsLogo ? 'drawing' : 'none')
  const [picked, setPicked] = useState(0)
  const [drawingMore, setDrawingMore] = useState(false)
  // The build on the server: its id once started, whether it will email them, and how long its link lasts.
  const [build, setBuild] = useState<{id: string; emailing: boolean; days: number; private?: boolean} | null>(null)
  const pickedRef = useRef(-1)
  // The mark they picked last, as a path: the finished app is handed over with it, even one picked just before the end.
  const pickedMark = useRef('')
  const started = useRef(false)
  // The props of the first render: the build runs once, from the answers it started with.
  const first = useRef({answers, options, favourites, onBuilt, onSketch, onGallery, spent, builderRef})

  useEffect(() => {
    const t0 = Date.now()
    const tick = setInterval(() => {
      setNow(Date.now())
      setElapsed(Date.now() - t0)
    }, 1000)
    return () => clearInterval(tick)
  }, [])

  // Whether the page is still showing: set again on a remount (React's development double mount), so a poll's answer is never lost.
  const alive = useRef(true)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  useEffect(() => {
    alive.current = true
    return () => {
      alive.current = false
    }
  }, [])
  useEffect(() => () => clearTimeout(timer.current), [])

  useEffect(() => {
    if (started.current) return
    started.current = true
    const {answers: a, favourites: liked, onBuilt: built, onSketch: sketch, onGallery: gallery, spent: before, builderRef: ref} = first.current
    const got: Record<string, Drawn> = {}
    const seenAt: Record<string, number> = {}
    let shown = {photos: false, planning: 0, drawing: 0}

    void (async () => {
      const res = await fetch('/api/prototype/build', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({answers: a, favourites: liked, spent: before, ref}),
      }).catch(() => null)
      const started = res?.ok ? ((await res.json().catch(() => null)) as {id: string; emailing: boolean; days: number; private?: boolean} | null) : null
      if (!started?.id) return sketch(((await res?.json().catch(() => null)) as {error?: string} | null)?.error)
      setBuild(started)

      const follow = async () => {
        const r = await fetch(`/api/prototype/build/${started.id}?have=${Object.keys(got).join(',')}`, {cache: 'no-store'}).catch(() => null)
        const p = r?.ok ? ((await r.json().catch(() => null)) as Progress | null) : null
        if (!alive.current) return
        if (p) {
          const now = Date.now()
          for (const u of p.units) {
            got[u.id] = u
            seenAt[u.id] ??= now
          }
          if (p.marks) setMarks((had) => (Array.isArray(had) && had.length > (p.marks?.length ?? 0) ? had : p.marks!.length ? p.marks! : 'failed'))
          if (p.status !== 'photos' && !shown.photos) {
            shown = {...shown, photos: true}
            setPhotoCount(p.photos.length)
            gallery(p.photos.filter((x) => x.url !== a.photo))
          }
          if ((p.status === 'planning' || p.status === 'drawing' || p.status === 'done') && !shown.planning) {
            shown = {...shown, planning: now}
            setStage('planning')
            setStageAt((at) => ({...at, planning: now}))
          }
          if (p.job) {
            const job = {...p.job, facts: '', photos: []} as Job
            setJob((had) => (had && pickedRef.current >= 0 ? {...job, look: had.look} : job))
            if (!shown.drawing) {
              shown = {...shown, drawing: now}
              setStage('drawing')
              setStageAt((at) => ({...at, drawing: now}))
            }
            const units = p.job.plan.units
            const order = units.filter((u) => !p.drawn.includes(u.id)).map((u) => u.id)
            setStates(Object.fromEntries(units.map((u) => [u.id, (p.drawn.includes(u.id) ? 'done' : order.indexOf(u.id) < AT_ONCE ? 'drawing' : 'waiting') as State])))
            setPartFrom((from) => Object.fromEntries(units.map((u) => [u.id, from[u.id] ?? (order.indexOf(u.id) < AT_ONCE ? now : 0)]).filter(([, t]) => t)))
            setDrawn({...got})
            setTook((t) => ({...t, ...Object.fromEntries(Object.keys(got).filter((id) => !t[id]).map((id) => [id, Math.max(1_000, seenAt[id] - (shown.drawing || now))]))}))
          }
          const allIn = p.drawn.every((id) => got[id] || p.missing?.includes(id))
          if (p.status === 'sketch') return sketch('Claude couldn’t finish it this time.')
          if (p.status === 'done' && p.job && allIn) {
            const units = p.job.plan.units.map((u) => got[u.id]).filter((u): u is Drawn => Boolean(u))
            const look = pickedMark.current ? withLogo({...p.job, facts: '', photos: []} as Job, pickedMark.current).look : p.job.look
            return built({id: p.job.id, look, plan: p.job.plan, units})
          }
        }
        timer.current = setTimeout(follow, EVERY)
      }
      void follow()
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /** Another of the logo round's marks: shown at once, and used by the build from the next part it draws. */
  const pick = (i: number) => {
    if (!Array.isArray(marks) || !marks[i]) return
    setPicked(i)
    pickedRef.current = i
    const d = marks[i].d
    pickedMark.current = d
    setJob((j) => (j ? withLogo(j, d) : j))
    if (build) void fetch(`/api/prototype/build/${build.id}`, {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({mark: d})}).catch(() => {})
  }
  /** Another round of logo ideas, added after the ones there are: the pick stays where it is. */
  const moreMarks = async () => {
    if (drawingMore || marks === 'drawing' || marks === 'none') return
    setDrawingMore(true)
    const res = await fetch('/api/prototype/logos', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({answers})}).catch(() => null)
    const answer = res?.ok ? ((await res.json().catch(() => null)) as {marks?: Mark[]; spent?: Spend} | null) : null
    addSpent(answer?.spent)
    const more = answer?.marks ?? []
    setMarks((had) => {
      const kept = Array.isArray(had) ? had : []
      const all = [...kept, ...more.filter((m) => !kept.some((h) => h.d === m.d))]
      return all.length ? all : 'failed'
    })
    setDrawingMore(false)
  }
  const pickedIcon = Array.isArray(marks) && marks[picked] ? iconOf(marks[picked].d) : undefined

  const units = job?.plan.units ?? []
  const count = units.filter((u) => states[u.id] === 'done').length
  const finished = units.filter((u) => states[u.id] === 'done' || states[u.id] === 'failed').length
  const drawingNow = units.filter((u) => states[u.id] === 'drawing')
  const times = Object.values(took)
  const {share, left} = progressOf({
    stage,
    inStage: now - stageAt[stage],
    parts: units.length,
    done: finished,
    drawingFor: drawingNow.map((u) => now - (partFrom[u.id] ?? now)),
    partMs: times.length ? times.reduce((a, b) => a + b, 0) / times.length : undefined,
  })
  const percent = Math.min(99, Math.round(share * 100))
  const tookFor = (from: Stage, to: Stage) => clock(stageAt[to] - stageAt[from])

  const steps: [string, string, boolean, boolean][] = [
    ...(wantsLogo
      ? [
          [
            'Drawing logo ideas',
            marks === 'drawing'
              ? 'Claude draws four marks for your app, judged at the size of a home-screen icon'
              : !Array.isArray(marks)
                ? 'The logo ideas didn’t come through: try again below, or your app keeps a lettered icon'
                : `${marks.length} ideas: tap one to use it, on every screen`,
            marks !== 'drawing',
            marks === 'drawing',
          ] as [string, string, boolean, boolean],
        ]
      : []),
    [
      'Finding photos',
      stage === 'photos' ? 'Searching for free-to-use photos that fit what you told us' : `${photoCount ? `${photoCount} photos found` : 'No photos found, so Claude draws without them'}, in ${tookFor('photos', 'planning')}`,
      stage !== 'photos',
      stage === 'photos',
    ],
    [
      'Planning your app',
      stage === 'drawing'
        ? `${units.length} parts planned, in ${tookFor('planning', 'drawing')}`
        : 'Claude reads your answers and plans the whole journey, from the landing page to your dashboard. Usually about a minute.',
      stage === 'drawing',
      stage === 'planning',
    ],
    [
      units.length ? `Drawing ${units.length} parts` : 'Drawing every screen',
      units.length
        ? `${count} of ${units.length} done${drawingNow.length ? `, ${drawingNow.length} being drawn now` : ''}. ${AT_ONCE} at a time, each in the house style.`
        : `${AT_ONCE} at a time, each in the house style. Each takes a minute or two.`,
      false,
      stage === 'drawing',
    ],
  ]

  return (
    <div className="builder building" style={{'--x-accent': options.accent} as CSSProperties}>
      <header className="ready">
        <span className="ready__mark">
          <AppIcon name={options.name} accent={options.accent} icon={pickedIcon ?? job?.look.style?.icon} />
        </span>
        <div>
          <span className="label">Claude is designing your app</span>
          <h2 className="ready__name">{options.name}</h2>
          <p className="ready__line">Every screen, from your answers. Usually 4 to 6 minutes.</p>
        </div>
      </header>

      <section className="building__mail" aria-label="When it's ready">
        <span className="building__mail-icon" aria-hidden>
          ✉
        </span>
        <div>
          {build?.emailing === false ? (
            <>
              <strong>You can close this tab: it keeps going without you.</strong>
              <span>Keep this link to come back to it. It works for {build.days} days.</span>
            </>
          ) : (
            <>
              <strong>We’ll email a link to {answers.email} when it’s ready.</strong>
              <span>
                You can close this tab: it keeps going without you. The link works for {build?.days ?? 7} days and opens only for{' '}
                {answers.email}: anyone else is asked to sign in with it. This browser can open it too, and{' '}
                <a href="/app-builder/mine">Your apps</a> keeps everything you design.
              </span>
            </>
          )}
          {build && (
            <span className="building__link">
              <a href={`/app-builder/p/${build.id}`} target="_blank" rel="noopener">
                {typeof window === 'undefined' ? '' : window.location.host}/app-builder/p/{build.id.slice(0, 8)}…
              </a>
              <CopyButton text={`${typeof window === 'undefined' ? '' : window.location.origin}/app-builder/p/${build.id}`} label="Copy link" />
            </span>
          )}
        </div>
      </section>

      <div className="building__progress">
        <div className="building__progress-head">
          <strong>{timeLeft(left)}</strong>
          <span>
            {percent}% · {clock(elapsed)} so far
          </span>
        </div>
        <div className="building__bar" role="progressbar" aria-label="Building your app" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent}>
          <span style={{width: `${percent}%`}} />
        </div>
      </div>

      {wantsLogo && marks !== 'none' && (
        <section className="building__logos" aria-labelledby="logo-ideas">
          <div className="building__logos-head">
            <strong id="logo-ideas">Your logo</strong>
            <span>
              {marks === 'drawing'
                ? 'Drawing a few ideas first…'
                : marks === 'failed'
                  ? 'Your app has a lettered icon for now.'
                  : 'Pick the one you like: it’s used on every screen. You can change it while the rest is drawn.'}
            </span>
          </div>
          {marks === 'failed' && !drawingMore && <p className="building__logos-failed">They didn’t come through this time.</p>}
          <ul className={marks === 'drawing' ? 'is-pending' : undefined}>
            {marks === 'drawing'
              ? Array.from({length: 4}, (_, i) => (
                  <li key={i} aria-hidden>
                    <span className="building__logo-blank" />
                  </li>
                ))
              : (Array.isArray(marks) ? marks : []).map((m, i) => (
                  <li key={m.d}>
                    <button type="button" aria-pressed={i === picked} className={i === picked ? 'is-on' : undefined} onClick={() => pick(i)}>
                      <AppIcon name={options.name} accent={options.accent} icon={iconOf(m.d)} size={64} />
                      <strong>{m.name || `Idea ${i + 1}`}</strong>
                      {m.idea && <span>{m.idea}</span>}
                    </button>
                  </li>
                ))}
            {drawingMore &&
              Array.from({length: 4}, (_, i) => (
                <li key={`more-${i}`} aria-hidden>
                  <span className="building__logo-blank" />
                </li>
              ))}
          </ul>
          {marks !== 'drawing' && (
            <button type="button" className="text-btn building__more" onClick={moreMarks} disabled={drawingMore}>
              {drawingMore ? 'Drawing more ideas…' : marks === 'failed' ? 'Try drawing logos again' : 'Draw more ideas'}
            </button>
          )}
        </section>
      )}

      <div className="building__while">
        {onHeard && (
          <HeardAsk
            value={heard}
            onChange={(v) => {
              onHeard(v)
              if (build && v) void fetch(`/api/prototype/build/${build.id}`, {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({heard: v})}).catch(() => {})
            }}
          />
        )}
        {bookingUrl && (
          <div className="building__call">
            <p>While it draws: pick a time for a free call, and we’ll go through it together.</p>
            <BookCall url={bookingUrl} label="Pick a time" from="app-builder-building" builderRef={builderRef} prefill={{email: answers.email, notes: `About ${options.name}, from the app builder.`}} />
          </div>
        )}
      </div>

      <ol className="building__steps" aria-live="polite">
        {steps.map(([title, line, isDone, isOn]) => (
          <li key={title} className={isDone ? 'is-done' : isOn ? 'is-on' : undefined}>
            <strong>{title}</strong>
            <span>{line}</span>
          </li>
        ))}
      </ol>

      {!job && (
        <>
          <p className="building__summary is-pending" aria-hidden />
          <ul className="building__units is-pending" aria-hidden>
            {Array.from({length: 12}, (_, i) => (
              <li key={i}>
                <span className={`gen-thumb gen-thumb--${i === 0 ? 'web' : 'phone'} gen-thumb--empty`} />
                <strong />
              </li>
            ))}
          </ul>
        </>
      )}
      {job && (
        <>
          {job.plan.summary && <p className="building__summary">{job.plan.summary}</p>}
          <ul className="building__units">
            {units.map((u) => (
              <li key={u.id} className={`is-${states[u.id] ?? 'waiting'}`}>
                {drawn[u.id] ? <PrototypeThumb look={job.look} unit={drawn[u.id]} view={u.frame} /> : <span className={`gen-thumb gen-thumb--${u.frame} gen-thumb--empty`} />}
                <strong>{u.title}</strong>
                <span>
                  {states[u.id] === 'drawing'
                    ? `Drawing… ${clock(now - (partFrom[u.id] ?? now))}`
                    : states[u.id] === 'done' && took[u.id]
                      ? `Done in ${clock(took[u.id])}`
                      : {waiting: 'Waiting its turn', drawing: 'Drawing…', done: 'Done', failed: 'Left out'}[states[u.id] ?? 'waiting']}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}

      {bookingUrl && builderRef && (
        <CallInvite url={bookingUrl} name={options.name} accent={options.accent} icon={pickedIcon ?? job?.look.style?.icon} email={answers.email} builderRef={builderRef} />
      )}

      <p className="building__next">
        When it’s done, you tap through your app as a member would, then see its dashboard and what it takes to launch it.
      </p>
    </div>
  )
}
