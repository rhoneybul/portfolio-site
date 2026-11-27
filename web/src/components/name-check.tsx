'use client'

import {useEffect, useState} from 'react'
import {Arrow} from '@/components/arrow'
import type {NameCheck} from '@/app-builder/name-check'

/**
 * The name they gave, checked while they decide whether they're sure of it
 * (/api/builder/name-check): its domains, apps in the App Store by that name, UK companies, and
 * where to look for trade marks. `onChecked` hands the result back in a line, for the submission.
 */
export function NameCheckPanel({name, onChecked}: {name: string; onChecked?: (summary: string) => void}) {
  const [check, setCheck] = useState<NameCheck | 'checking' | 'failed'>('checking')
  useEffect(() => {
    let on = true
    setCheck('checking')
    fetch('/api/builder/name-check', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({name})})
      .then((r) => (r.ok ? (r.json() as Promise<NameCheck>) : Promise.reject()))
      .then((c) => {
        if (!on) return
        setCheck(c)
        onChecked?.(summaryOf(c))
      })
      .catch(() => on && setCheck('failed'))
    return () => {
      on = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name])

  if (check === 'failed') return null
  if (check === 'checking')
    return (
      <div className="name-check is-pending" role="status">
        <strong>Checking “{name}”…</strong>
        <span>Domains, the App Store and UK companies</span>
      </div>
    )
  return (
    <div className={`name-check${check.clear ? ' is-clear' : ' is-clash'}`} role="status">
      <strong>{check.verdict}</strong>
      <ul>
        {check.domains.map((d) => (
          <li key={d.domain} className={d.taken === null ? 'is-unknown' : d.taken ? 'is-taken' : 'is-free'}>
            <span className="name-check__mark" aria-hidden>
              {d.taken === null ? '?' : d.taken ? '×' : '✓'}
            </span>
            {d.domain} {d.taken === null ? 'couldn’t be checked' : d.taken ? 'is taken' : 'is free'}
          </li>
        ))}
        {check.alternatives.length > 0 && (
          <li className="is-free">
            <span className="name-check__mark" aria-hidden>
              ✓
            </span>
            <span>Free close by: {check.alternatives.join(', ')}</span>
          </li>
        )}
        {check.apps.length ? (
          check.apps.map((a) => (
            <li key={a.name} className="is-taken">
              <span className="name-check__mark" aria-hidden>
                ×
              </span>
              <span>
                In the App Store:{' '}
                <a href={a.url} target="_blank" rel="noopener noreferrer">
                  {a.name}
                </a>
                {a.seller && `, by ${a.seller}`}
              </span>
            </li>
          ))
        ) : (
          <li className="is-free">
            <span className="name-check__mark" aria-hidden>
              ✓
            </span>
            No app in the App Store by that name
          </li>
        )}
        {check.companies !== null &&
          (check.companies.length ? (
            check.companies.map((c) => (
              <li key={c.name} className="is-flag">
                <span className="name-check__mark" aria-hidden>
                  !
                </span>
                A UK company has the name: {c.name}
                {c.status && ` (${c.status})`}. Worth knowing, not a blocker.
              </li>
            ))
          ) : (
            <li className="is-free">
              <span className="name-check__mark" aria-hidden>
                ✓
              </span>
              No UK company by that name
            </li>
          ))}
      </ul>
      <p className="name-check__marks">
        Trade marks:{' '}
        {check.trademarks.map((t, i) => (
          <span key={t.url}>
            {i > 0 && ' · '}
            <a href={t.url} target="_blank" rel="noopener noreferrer">
              {t.label} <Arrow />
            </a>
          </span>
        ))}
      </p>
    </div>
  )
}

/** The check in a line, as the browser sends it with the answers. */
const summaryOf = (c: NameCheck) =>
  [
    c.verdict,
    `Domains: ${c.domains.map((d) => `${d.domain} ${d.taken === null ? 'unknown' : d.taken ? 'taken' : 'free'}`).join(', ')}.`,
    c.alternatives.length ? `Free close by: ${c.alternatives.join(', ')}.` : '',
    c.apps.length ? `App Store: ${c.apps.map((a) => a.name).join('; ')}.` : 'No app by that name in the App Store.',
    c.companies === null ? '' : c.companies.length ? `UK companies with the name (a flag, not a blocker): ${c.companies.map((x) => x.name).join('; ')}.` : 'No UK company by that name.',
  ]
    .filter(Boolean)
    .join(' ')
