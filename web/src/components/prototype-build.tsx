'use client'

import {useEffect, useRef, useState, type CSSProperties} from 'react'
import {Mark, goalsOf, type Pic} from '@/components/app-prototype'
import {ideasFor, search} from '@/components/photo-search'
import {PrototypeThumb} from '@/components/prototype-frame'
import type {Answers, Options} from '@/app-builder/options'
import type {Drawn, Job, Look, Photo, Plan} from '@/app-builder/prototype-doc'

/**
 * Claude designing the visitor's app, live: photos found from their answers, then Claude plans the
 * whole journey (/api/prototype/plan), then draws its parts several at a time
 * (/api/prototype/screen), each appearing as it's done. A few minutes, start to finish. If Claude
 * is off (no ANTHROPIC_API_KEY), busy, or the visitor has drawn a few today, it hands back to the
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

/** Open-licence photos for the app: their own first, then a few from each search, taking turns. */
async function findPhotos(answers: Answers, o: Options): Promise<Photo[]> {
  const ideas = await ideasFor(answers).catch(() => [] as string[])
  const terms = [...ideas, ...goalsOf(o)].filter((t, i, all) => t && all.indexOf(t) === i).slice(0, 5)
  const lists = await Promise.all(terms.map((t) => search(t).catch(() => [])))
  const found: Photo[] = []
  for (let r = 0; found.length < 11 && lists.some((l) => l[r]); r++)
    lists.forEach((l, i) => {
      const f = l[r]
      if (f && found.length < 11 && !found.some((x) => x.url === f.url)) found.push({url: f.url, credit: f.credit, about: terms[i]})
    })
  const own = o.photo ? [{url: o.photo, credit: o.photoCredit || 'The owner’s own photo', about: 'their own photo'}] : []
  return [...own, ...found.filter((f) => f.url !== o.photo)]
}

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
  onBuilt,
  onSketch,
  onGallery,
}: {
  answers: Answers
  options: Options
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
  const started = useRef(false)
  // The props of the first render: the build runs once, from the answers it started with.
  const first = useRef({answers, options, onBuilt, onSketch, onGallery})

  useEffect(() => {
    const t0 = Date.now()
    const tick = setInterval(() => {
      setNow(Date.now())
      setElapsed(Date.now() - t0)
    }, 1000)
    return () => clearInterval(tick)
  }, [])

  useEffect(() => {
    if (started.current) return
    started.current = true
    const {answers: a, options: o, onBuilt: built, onSketch: sketch, onGallery: gallery} = first.current
    const post = (path: string, body: unknown) =>
      fetch(path, {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(body)})

    void (async () => {
      const photos = await findPhotos(a, o)
      gallery(photos.filter((p) => p.url !== o.photo).map((p) => ({url: p.url, credit: p.credit})))
      setPhotoCount(photos.length)
      setStage('planning')
      setStageAt((at) => ({...at, planning: Date.now()}))

      const planned = await post('/api/prototype/plan', {answers: a, photos}).catch(() => null)
      if (!planned?.ok) return sketch((await planned?.json().catch(() => null))?.error)
      const {job: j, token} = (await planned.json()) as {job: Job; token: string}
      setJob(j)
      setStates(Object.fromEntries(j.plan.units.map((u) => [u.id, 'waiting' as State])))
      setStage('drawing')
      setStageAt((at) => ({...at, drawing: Date.now()}))

      const done: Record<string, Drawn> = {}
      const queue = [...j.plan.units]
      const worker = async () => {
        for (let u = queue.shift(); u; u = queue.shift()) {
          const id = u.id
          const from = Date.now()
          setStates((s) => ({...s, [id]: 'drawing'}))
          setPartFrom((s) => ({...s, [id]: from}))
          for (let attempt = 0; attempt < 2 && !done[id]; attempt++) {
            const res = await post('/api/prototype/screen', {job: j, token, unit: id}).catch(() => null)
            const unit = res?.ok ? ((await res.json().catch(() => null)) as {unit?: Drawn} | null)?.unit : undefined
            if (unit?.html) done[id] = unit
            if (res?.status === 429 || res?.status === 403) break
          }
          setStates((s) => ({...s, [id]: done[id] ? 'done' : 'failed'}))
          if (done[id]) setTook((t) => ({...t, [id]: Date.now() - from}))
          if (done[id]) setDrawn((d) => ({...d, [id]: done[id]}))
        }
      }
      await Promise.all(Array.from({length: AT_ONCE}, worker))

      const units = j.plan.units.map((u) => done[u.id]).filter((u): u is Drawn => Boolean(u))
      const phones = j.plan.units.filter((u) => u.frame === 'phone')
      if (phones.filter((u) => done[u.id]).length < Math.ceil(phones.length / 2)) return sketch('Claude couldn’t finish it this time.')
      built({id: j.id, look: j.look, plan: j.plan, units})
    })()
  }, [])

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
    [
      'Finding photos',
      stage === 'photos' ? 'Searching Wikimedia Commons for open-licence photos that fit what you told us' : `${photoCount ? `${photoCount} photos found` : 'No photos found, so Claude draws without them'}, in ${tookFor('photos', 'planning')}`,
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
          <Mark size={56} />
        </span>
        <div>
          <span className="label">Claude is designing your app</span>
          <h2 className="ready__name">{options.name}</h2>
          <p className="ready__line">Every screen, from your answers. Usually 4 to 6 minutes: keep this tab open, closing it stops the build.</p>
        </div>
      </header>

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

      <ol className="building__steps" aria-live="polite">
        {steps.map(([title, line, isDone, isOn]) => (
          <li key={title} className={isDone ? 'is-done' : isOn ? 'is-on' : undefined}>
            <strong>{title}</strong>
            <span>{line}</span>
          </li>
        ))}
      </ol>

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

      <p className="building__next">
        When it’s done, you tap through your app as a member would, then see its dashboard and what it takes to launch it.
      </p>
    </div>
  )
}
