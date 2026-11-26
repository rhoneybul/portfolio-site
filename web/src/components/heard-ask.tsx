'use client'

import {useState} from 'react'

/** Where they heard about Fohm, asked while Claude designs their app: a tap, or a few words of their own. */
const PLACES = ['Google', 'Instagram', 'LinkedIn', 'A friend or colleague', 'Claude or ChatGPT', 'Somewhere else']

export function HeardAsk({value, onChange}: {value: string; onChange: (v: string) => void}) {
  const [other, setOther] = useState(false)
  const [typed, setTyped] = useState('')
  if (value)
    return (
      <div className="heard heard--done" role="status">
        Thanks: {value}.{' '}
        <button type="button" className="heard__change" onClick={() => onChange('')}>
          Change
        </button>
      </div>
    )
  return (
    <div className="heard" role="group" aria-labelledby="heard-ask">
      <p id="heard-ask">While Claude works: how did you hear about Fohm?</p>
      <div className="builder__picks">
        {PLACES.map((p) => (
          <button key={p} type="button" className={`builder__pick${other && p === 'Somewhere else' ? ' is-on' : ''}`} onClick={() => (p === 'Somewhere else' ? setOther(true) : onChange(p))}>
            {p}
          </button>
        ))}
      </div>
      {other && (
        <form
          className="heard__other"
          onSubmit={(e) => {
            e.preventDefault()
            if (typed.trim()) onChange(typed.trim().slice(0, 120))
          }}
        >
          <input aria-label="Where you heard about Fohm" placeholder="Where?" maxLength={120} value={typed} onChange={(e) => setTyped(e.target.value)} autoFocus />
          <button type="submit" className="btn btn-primary">
            Send
          </button>
        </form>
      )}
    </div>
  )
}
