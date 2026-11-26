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
  const s = Math.floor(ms / 1000)
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
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
  const [stage, setStage] = useState<'photos' | 'planning' | 'drawing'>('photos')
  const [job, setJob] = useState<Job | null>(null)
  const [states, setStates] = useState<Record<string, State>>({})
  const [drawn, setDrawn] = useState<Record<string, Drawn>>({})
  const [elapsed, setElapsed] = useState(0)
  const started = useRef(false)
  // The props of the first render: the build runs once, from the answers it started with.
  const first = useRef({answers, options, onBuilt, onSketch, onGallery})

  useEffect(() => {
    const t0 = Date.now()
    const tick = setInterval(() => setElapsed(Date.now() - t0), 1000)
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
      setStage('planning')

      const planned = await post('/api/prototype/plan', {answers: a, photos}).catch(() => null)
      if (!planned?.ok) return sketch((await planned?.json().catch(() => null))?.error)
      const {job: j, token} = (await planned.json()) as {job: Job; token: string}
      setJob(j)
      setStates(Object.fromEntries(j.plan.units.map((u) => [u.id, 'waiting' as State])))
      setStage('drawing')

      const done: Record<string, Drawn> = {}
      const queue = [...j.plan.units]
      const worker = async () => {
        for (let u = queue.shift(); u; u = queue.shift()) {
          const id = u.id
          setStates((s) => ({...s, [id]: 'drawing'}))
          for (let attempt = 0; attempt < 2 && !done[id]; attempt++) {
            const res = await post('/api/prototype/screen', {job: j, token, unit: id}).catch(() => null)
            const unit = res?.ok ? ((await res.json().catch(() => null)) as {unit?: Drawn} | null)?.unit : undefined
            if (unit?.html) done[id] = unit
            if (res?.status === 429 || res?.status === 403) break
          }
          setStates((s) => ({...s, [id]: done[id] ? 'done' : 'failed'}))
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
  const steps: [string, string, boolean, boolean][] = [
    ['Finding photos', 'Open-licence photos, from what you told us', stage !== 'photos', stage === 'photos'],
    ['Planning your app', 'Claude reads your answers and plans the whole journey, from the landing page to your dashboard', stage === 'drawing', stage === 'planning'],
    [units.length ? `Drawing ${units.length} parts: ${count} done` : 'Drawing every screen', 'Several at once, each in the house style', false, stage === 'drawing'],
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
          <p className="ready__line">Every screen, from your answers. It takes a few minutes: keep this tab open.</p>
        </div>
        <span className="building__clock" aria-label="Time so far">
          {clock(elapsed)}
        </span>
      </header>

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
                <span>{{waiting: 'Waiting', drawing: 'Drawing…', done: 'Done', failed: 'Left out'}[states[u.id] ?? 'waiting']}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}
