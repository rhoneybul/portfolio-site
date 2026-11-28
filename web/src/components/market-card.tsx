'use client'

import {useEffect, useRef, useState} from 'react'
import type {Market, Overlap} from '@/app-builder/market'

/**
 * The market, in the conversation (/api/builder/market with the idea): searched from the web as soon
 * as they've said what the app does, and shown as a message of Claude's once it's found: the apps
 * already doing something like it, how close each comes and where theirs could differ, the closest
 * flagged plainly (worth knowing, rarely a reason to stop), and the gaps it could own. The same
 * research goes to the next questions and to the deck's Market slide.
 */

export type MarketResearch = {state: 'idle'} | {state: 'looking'} | {state: 'found'; market: Market} | {state: 'missed'}

export function useIdeaMarket(idea: string, business: string, on: boolean): MarketResearch {
  const [r, setR] = useState<MarketResearch>({state: 'idle'})
  const asked = useRef('')
  const said = idea.trim()
  useEffect(() => {
    if (!on || said.length < 12 || asked.current === said) return
    asked.current = said
    setR({state: 'looking'})
    fetch('/api/builder/market', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({idea: said, business})})
      .then(async (res) => {
        const json = (await res.json().catch(() => ({}))) as {market?: Market}
        if (asked.current === said) setR(json.market ? {state: 'found', market: json.market} : {state: 'missed'})
      })
      .catch(() => asked.current === said && setR({state: 'missed'}))
    // Asked once an idea; what they said about the business only joins the first ask.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [said, on])
  return r
}

export const OVERLAP_WORDS: Record<Overlap, string> = {close: 'Close to yours', some: 'Some overlap', instead: 'Used instead'}

const hostOf = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

/** While it searches: one quiet line, so they know it's coming. */
export function MarketLooking() {
  return (
    <div className="chat__msg chat__msg--claude market-chat market-chat--looking" aria-busy>
      <p>I’m looking up the apps already doing something like yours, and where the gaps are. It’ll show here in a minute or two; carry on.</p>
    </div>
  )
}

export function MarketCard({market, name}: {market: Market; name: string}) {
  const close = market.rivals.filter((r) => r.overlap === 'close')
  return (
    <section className="chat__msg chat__msg--claude market-chat" aria-labelledby="market-chat-title">
      <strong id="market-chat-title" className="market-chat__title">
        Apps already doing this
      </strong>
      {market.summary && <p className="market-chat__summary">{market.summary}</p>}

      {(market.flag || close.length > 0) && (
        <div className="market-chat__flag" role="note">
          <strong>Worth knowing</strong>
          <p>{market.flag || `${close.map((r) => r.name).join(' and ')} ${close.length > 1 ? 'come' : 'comes'} close to ${name}. That’s rarely a reason to stop: it shows people want it, and where yours has to be different.`}</p>
        </div>
      )}

      <ul className="market-chat__rivals">
        {market.rivals.map((r) => (
          <li key={r.name}>
            <div className="market-chat__head">
              <strong>{r.url ? <a href={r.url} target="_blank" rel="noopener noreferrer">{r.name}</a> : r.name}</strong>
              {r.overlap && <span className={`market-chat__overlap is-${r.overlap}`}>{OVERLAP_WORDS[r.overlap]}</span>}
            </div>
            <p>
              {r.what}
              {r.price && <span className="market-chat__price"> · {r.price}</span>}
            </p>
            {r.edge && <p className="market-chat__edge">Where yours could differ: {r.edge}</p>}
          </li>
        ))}
      </ul>

      <strong className="market-chat__sub">Where you could win</strong>
      <ul className="market-chat__gaps">
        {market.gaps.map((g) => (
          <li key={g}>{g}</li>
        ))}
      </ul>
      {market.position && (
        <p className="market-chat__position">
          <strong>One line {name} could own:</strong> {market.position}
        </p>
      )}
      {market.sources.length > 0 && (
        <p className="market-chat__sources">
          Sources:{' '}
          {market.sources.slice(0, 5).map((s, i) => (
            <span key={s.url}>
              {i > 0 && ' · '}
              <a href={s.url} target="_blank" rel="noopener noreferrer" title={s.title}>
                {hostOf(s.url)}
              </a>
            </span>
          ))}
        </p>
      )}
      <p className="market-chat__note">I’ll use this in the questions to come, and it’s in your deck with the prototype.</p>
    </section>
  )
}
