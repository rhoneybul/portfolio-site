'use client'

import {useState} from 'react'

// Sends the enquiry as a pre-filled WhatsApp message, so there's no backend or form service to run.
export function ContactForm({whatsapp}: {whatsapp: string}) {
  const [error, setError] = useState<string | null>(null)

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    const get = (key: string) => String(data.get(key) ?? '').trim()
    const name = get('name')
    const message = get('message')
    if (!name || !message) {
      setError('Please add your name and a short message.')
      return
    }
    setError(null)
    const engagement = get('engagement')
    const text = [
      `Hi Rob, I'm ${name}${get('company') ? ` from ${get('company')}` : ''}.`,
      ...(engagement ? [`Looking for: ${engagement}`] : []),
      '',
      message,
    ].join('\n')
    window.open(`https://wa.me/${whatsapp}?text=${encodeURIComponent(text)}`, '_blank', 'noopener')
  }

  return (
    <form onSubmit={onSubmit} className="contact-form">
      <div className="field-row">
        <label className="field">
          <span>Name</span>
          <input name="name" required autoComplete="name" />
        </label>
        <label className="field">
          <span>Company</span>
          <input name="company" autoComplete="organization" />
        </label>
      </div>
      <label className="field">
        <span>Engagement</span>
        <select name="engagement" defaultValue="">
          <option value="">Select…</option>
          <option>Advisory / a few hours a month</option>
          <option>Fractional CTO (1–3 days a week)</option>
          <option>Project build</option>
          <option>Not sure yet</option>
        </select>
      </label>
      <label className="field">
        <span>What are you working on?</span>
        <textarea name="message" rows={4} required />
      </label>
      <div className="form-footer">
        {error && <p className="form-error">{error}</p>}
        <button type="submit" className="btn btn-primary">
          Send on WhatsApp <span aria-hidden>↗</span>
        </button>
      </div>
    </form>
  )
}
