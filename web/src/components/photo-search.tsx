'use client'

import {useEffect, useState} from 'react'
import type {Answers} from '@/app-builder/options'
import {ideaAnswers, photoIdeas, tidy} from '@/app-builder/photo-ideas'
import type {Found} from '@/app-builder/commons'

export type {Found}

/**
 * Finds photos for the visitor's app on Wikimedia Commons from what they've told us about it: a
 * few searches picked from their answers (/api/photo-ideas), a few photos from each to choose
 * from (/api/photos, open licences only: app-builder/commons.ts), and their own words or a link to
 * their own if none fit.
 */

/**
 * Open-licence photos for a search, through this site's server (/api/photos): Commons refuses
 * searches straight from browsers it can't identify, so the server asks, named, and caches.
 */
export async function search(q: string): Promise<Found[]> {
  const res = await fetch(`/api/photos?q=${encodeURIComponent(q.trim().slice(0, 80))}`)
  if (!res.ok) throw new Error(`Photo search: ${res.status}`)
  return ((await res.json()) as {photos?: Found[]}).photos ?? []
}

// One browser tab's memory: the photo step and the finished app ask once for the same answers.
const asked = new Map<string, Promise<string[]>>()

/** The searches for their app: Claude's pick from their answers, or the answers' own words. */
export function ideasFor(answers: Answers): Promise<string[]> {
  const a = ideaAnswers(answers)
  const key = JSON.stringify(a)
  if (!asked.has(key))
    asked.set(
      key,
      fetch('/api/photo-ideas', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({answers: a})})
        .then((r) => (r.ok ? r.json() : null))
        .then((j) => {
          const terms = tidy(j?.terms)
          return terms.length ? terms : photoIdeas(a)
        })
        .catch(() => photoIdeas(a)),
    )
  return asked.get(key)!
}

/** The first of each search, then the second of each, and so on: a few of everything. */
export function mixed(lists: Found[][], most = 12) {
  const seen = new Set<string>()
  const out: Found[] = []
  for (let r = 0; out.length < most && lists.some((l) => l[r]); r++)
    for (const l of lists) if (l[r] && !seen.has(l[r].url) && seen.add(l[r].url) && out.length < most) out.push(l[r])
  return out
}

export function PhotoSearch({answers, value, onChange}: {answers: Answers; value: string; onChange: (url: string, credit: string) => void}) {
  const [terms, setTerms] = useState<string[]>([])
  const [found, setFound] = useState<Record<string, Found[]>>({})
  const [looking, setLooking] = useState(true)
  const [on, setOn] = useState('')
  const [q, setQ] = useState('')
  const [busy, setBusy] = useState(false)
  const [broken, setBroken] = useState<string[]>([])
  const [own, setOwn] = useState(value && !value.includes('wikimedia.org') ? value : '')

  // Straight away: searches from what they've told us, and a few photos from each.
  useEffect(() => {
    let live = true
    ideasFor(answers)
      .then(async (ideas) => {
        const lists = await Promise.all(ideas.map((t) => search(t).catch(() => [] as Found[])))
        if (!live) return
        const kept = ideas.filter((_, i) => lists[i].length)
        setTerms(kept)
        setFound(Object.fromEntries(ideas.map((t, i) => [t, lists[i]])))
      })
      .finally(() => live && setLooking(false))
    return () => {
      live = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const run = async (term: string) => {
    const t = term.trim()
    if (!t) return
    setBusy(true)
    try {
      const list = await search(t)
      setFound((f) => ({...f, [t]: list}))
      setTerms((all) => [t, ...all.filter((x) => x !== t)])
      setOn(t)
    } catch {
      setFound((f) => ({...f, [t]: []}))
      setOn(t)
    } finally {
      setBusy(false)
    }
  }

  const fine = (l: Found[]) => l.filter((f) => !broken.includes(f.thumb))
  const shown = on ? fine(found[on] ?? []) : mixed(terms.map((t) => fine(found[t] ?? [])))
  const chosen = Object.values(found)
    .flat()
    .find((f) => f.url === value)

  return (
    <div className="photos">
      <div className="photos__bar">
        <input
          aria-label="Search for a photo"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              void run(q)
            }
          }}
          placeholder="Or search your own words"
        />
        <button type="button" className="text-btn" onClick={() => run(q)} disabled={busy}>
          {busy ? 'Searching…' : 'Search'}
        </button>
      </div>

      {terms.length > 1 && (
        <div className="photos__terms" role="group" aria-label="Photos of">
          <button type="button" className={`photos__term${on ? '' : ' is-on'}`} aria-pressed={!on} onClick={() => setOn('')}>
            A few of each
          </button>
          {terms.map((t) => (
            <button key={t} type="button" className={`photos__term${on === t ? ' is-on' : ''}`} aria-pressed={on === t} onClick={() => setOn(t)}>
              {t}
            </button>
          ))}
        </div>
      )}

      {looking && !on ? (
        <>
          <p className="builder__hint" role="status">
            Finding photos from what you’ve told us…
          </p>
          <div className="photos__grid" aria-hidden>
            {Array.from({length: 6}, (_, i) => (
              <span key={i} className="photos__pick photos__pick--wait" />
            ))}
          </div>
        </>
      ) : !shown.length ? (
        <p className="builder__hint">{on ? 'No open-licence photos for that. Try other words.' : 'Nothing open-licence came up from your answers. Search your own words above.'}</p>
      ) : (
        <div className="photos__grid" role="radiogroup" aria-label="Photos">
          {shown.map((f) => (
            <button
              key={f.url}
              type="button"
              role="radio"
              aria-checked={value === f.url}
              className={`photos__pick${value === f.url ? ' is-on' : ''}`}
              onClick={() => onChange(value === f.url ? '' : f.url, value === f.url ? '' : f.credit)}
              title={f.credit}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={f.thumb} alt="" loading="lazy" referrerPolicy="no-referrer" onError={() => setBroken((b) => [...b, f.thumb])} />
            </button>
          ))}
        </div>
      )}
      <p className="photos__credit">{value && !own && chosen ? chosen.credit : 'Photos from Wikimedia Commons, open licences only.'}</p>

      <label className="photos__own">
        <span>Or a link to your own</span>
        <input
          inputMode="url"
          autoCapitalize="none"
          value={own}
          onChange={(e) => {
            setOwn(e.target.value)
            onChange(e.target.value.trim(), '')
          }}
          placeholder="https://…"
        />
      </label>
    </div>
  )
}
