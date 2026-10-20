'use client'

import {useActionState} from 'react'
import {sendEnquiry, type ContactState} from '@/app/actions'

const initial: ContactState = {status: 'idle'}

export function ContactForm() {
  const [state, action, pending] = useActionState(sendEnquiry, initial)

  if (state.status === 'success') {
    return (
      <div className="form-success">
        <p className="display-sm">Thanks, message received.</p>
        <p className="muted">I’ll get back to you within one working day.</p>
      </div>
    )
  }

  return (
    <form action={action} className="contact-form">
      <div className="field-row">
        <label className="field">
          <span className="mono">Name</span>
          <input name="name" required autoComplete="name" />
        </label>
        <label className="field">
          <span className="mono">Email</span>
          <input name="email" type="email" required autoComplete="email" />
        </label>
      </div>
      <div className="field-row">
        <label className="field">
          <span className="mono">Company</span>
          <input name="company" autoComplete="organization" />
        </label>
        <label className="field">
          <span className="mono">Engagement</span>
          <select name="budget" defaultValue="">
            <option value="" disabled>Select…</option>
            <option>Advisory / a few hours a month</option>
            <option>Fractional CTO (1–3 days a week)</option>
            <option>Project build</option>
            <option>Not sure yet</option>
          </select>
        </label>
      </div>
      <label className="field">
        <span className="mono">What are you working on?</span>
        <textarea name="message" rows={4} required />
      </label>
      <input type="text" name="company_website" tabIndex={-1} autoComplete="off" className="hp" aria-hidden />
      <div className="form-footer">
        {state.status === 'error' && <p className="form-error">{state.message}</p>}
        <button type="submit" className="btn btn-light" disabled={pending}>
          {pending ? 'Sending…' : 'Send message'} <span aria-hidden>→</span>
        </button>
      </div>
    </form>
  )
}
