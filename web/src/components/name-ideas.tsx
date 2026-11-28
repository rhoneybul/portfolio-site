'use client'

import {useEffect, useState} from 'react'
import type {Answers} from '@/app-builder/options'
import type {NameIdea} from '@/app-builder/names'
import type {NameCheck} from '@/app-builder/name-check'
import type {Spend} from '@/app-builder/cost'
import {addSpent} from '@/components/spent'

/**
 * Names Claude suggests while they decide whether they're sure of theirs (/api/builder/name-ideas),
 * each checked for its domains and the App Store, clear ones first. They can say what they want from
 * a name (a feel, a language, a letter), and every round after follows it. A tap makes it the app's name,
 * before anything is drawn, so every screen carries it. Nothing shows when the round is off.
 */
export function NameIdeas({answers, onPick}: {answers: Answers; onPick: (idea: NameIdea) => void}) {
  const [ideas, setIdeas] = useState<NameIdea[] | 'thinking' | 'off' | 'failed'>('thinking')
  const [more, setMore] = useState(false)
  const [wants, setWants] = useState('')
  /** The brief the names on show were asked for, so More names keeps to it. */
  const [askedFor, setAskedFor] = useState('')

  const ask = async (without: string[], brief = askedFor) => {
    const res = await fetch('/api/builder/name-ideas', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({answers, without, wants: brief})}).catch(() => null)
    if (res?.status === 503) return 'off' as const
    const body = res?.ok ? ((await res.json().catch(() => null)) as {ideas?: NameIdea[]; spent?: Spend} | null) : null
    addSpent(body?.spent)
    return body?.ideas ?? null
  }

  useEffect(() => {
    let on = true
    void ask(answers.name ? [answers.name] : []).then((got) => on && setIdeas(got === 'off' ? 'off' : got?.length ? got : 'failed'))
    return () => {
      on = false
    }
    // Once, when the question shows: another round is a tap.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const another = async () => {
    if (more) return
    setMore(true)
    const had = Array.isArray(ideas) ? ideas : []
    const got = await ask([answers.name, ...had.map((i) => i.name)].filter(Boolean))
    setIdeas(Array.isArray(got) && got.length ? [...had, ...got] : had.length ? had : 'failed')
    setMore(false)
  }

  /** A fresh round to what they asked for: these names replace the ones on show, which aren't suggested again. */
  const askFor = async () => {
    const brief = wants.trim()
    if (!brief || more || ideas === 'thinking') return
    const had = Array.isArray(ideas) ? ideas : []
    setAskedFor(brief)
    setIdeas('thinking')
    const got = await ask([answers.name, ...had.map((i) => i.name)].filter(Boolean), brief)
    setIdeas(Array.isArray(got) && got.length ? got : had.length ? had : 'failed')
  }

  if (ideas === 'off') return null
  return (
    <section className="name-ideas" aria-labelledby="name-ideas">
      <div className="name-ideas__head">
        <strong id="name-ideas">Not sure? Some names to try</strong>
        <span>
          {ideas === 'thinking'
            ? 'Claude is thinking of a few, and checking each one’s domains and the App Store…'
            : ideas === 'failed'
              ? 'They didn’t come through this time.'
              : askedFor
                ? `Names for: ${askedFor}. Tap one to use it, or keep yours and carry on.`
                : 'Tap one to use it instead. Or keep yours and carry on.'}
        </span>
      </div>
      {/* Inside the question's form, so Enter asks for names here rather than sending the answer. */}
      <div className="name-ideas__wants">
        <label htmlFor="name-wants">What do you want from a name?</label>
        <div>
          <input
            id="name-wants"
            value={wants}
            onChange={(e) => setWants(e.target.value)}
            onKeyDown={(e) => {
              if (e.key !== 'Enter') return
              e.preventDefault()
              void askFor()
            }}
            maxLength={300}
            placeholder="Short and calm, a Japanese word, starts with K…"
          />
          <button type="button" className="btn btn-outline" onClick={askFor} disabled={!wants.trim() || more || ideas === 'thinking'}>
            Find names
          </button>
        </div>
      </div>
      <ul className={ideas === 'thinking' ? 'is-pending' : undefined}>
        {ideas === 'thinking'
          ? Array.from({length: 6}, (_, i) => (
              <li key={i} aria-hidden>
                <span className="name-ideas__blank" />
              </li>
            ))
          : (Array.isArray(ideas) ? ideas : []).map((idea) => (
              <li key={idea.name}>
                <button type="button" onClick={() => onPick(idea)} aria-label={`Use ${idea.name} as the name`}>
                  <strong>{idea.name}</strong>
                  {idea.idea && <span>{idea.idea}</span>}
                  <small className={idea.check?.clear ? 'is-clear' : idea.check ? 'is-clash' : undefined}>{lineOf(idea.check)}</small>
                </button>
              </li>
            ))}
        {more &&
          Array.from({length: 6}, (_, i) => (
            <li key={`more-${i}`} aria-hidden>
              <span className="name-ideas__blank" />
            </li>
          ))}
      </ul>
      {ideas !== 'thinking' && (
        <button type="button" className="text-btn name-ideas__more" onClick={another} disabled={more}>
          {more ? 'Thinking of more…' : ideas === 'failed' ? 'Try again' : 'More names'}
        </button>
      )}
    </section>
  )
}

/** What the check found, in a few words: the domain that's free, or what's in the way. */
function lineOf(c: NameCheck | null) {
  if (!c) return 'Not checked'
  const free = c.domains.find((d) => d.taken === false)?.domain ?? c.alternatives[0]
  if (c.apps.length) return `${c.apps.length === 1 ? 'An app' : `${c.apps.length} apps`} in the App Store use it`
  if (free) return `✓ ${free} is free`
  return c.domains.every((d) => d.taken === null) ? 'Couldn’t check its domains' : 'Its domains are taken'
}
