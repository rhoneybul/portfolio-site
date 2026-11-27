'use client'

import {useState, type FormEvent} from 'react'
import {Arrow} from '@/components/arrow'

/**
 * Sign in to see your apps (app-builder/visitor.ts): your email, and a link to it that signs you in.
 * On one app's page, `next` is that page; on "Your apps", the list.
 */
export function AppsSignIn({next, lead}: {next: string; lead: string}) {
  const [email, setEmail] = useState('')
  const [state, setState] = useState<'idle' | 'sending' | 'sent'>('idle')
  const [said, setSaid] = useState<string | null>(null)

  const send = async (e: FormEvent) => {
    e.preventDefault()
    setState('sending')
    setSaid(null)
    const res = await fetch('/api/builder/signin', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({email, next})}).catch(() => null)
    const body = (await res?.json().catch(() => null)) as {message?: string; error?: string} | null
    setSaid(body?.message ?? body?.error ?? 'That didn’t send. Try again.')
    setState(res?.ok ? 'sent' : 'idle')
  }

  return (
    <div className="apps-sign-in">
      <p className="intro__lead">{lead}</p>
      {state === 'sent' ? (
        <p className="apps-sign-in__sent" role="status">
          {said}
        </p>
      ) : (
        <form onSubmit={send} className="apps-sign-in__form">
          <label htmlFor="apps-email">The email you designed it with</label>
          <div>
            <input id="apps-email" type="email" required autoComplete="email" inputMode="email" maxLength={200} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
            <button type="submit" className="btn btn-primary apps-sign-in__send" disabled={state === 'sending'}>
              {state === 'sending' ? 'Sending…' : 'Email me a link'} <Arrow />
            </button>
          </div>
          {said && <p className="builder__error">{said}</p>}
        </form>
      )}
    </div>
  )
}
