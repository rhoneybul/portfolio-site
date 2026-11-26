'use client'

import {useEffect, useRef, useState, type FormEvent} from 'react'
import {Arrow} from '@/components/arrow'
import {BookCall} from '@/components/book-call'
import {notesText, useNotes} from '@/components/prototype-notes'
import type {Answers} from '@/app-builder/options'

/**
 * "Build it with me", from anywhere on the finished page (the reveal, the bar at the foot, the
 * deck's last slide): a window that sends their app to Rob the moment it opens when their email is
 * already known (it is, from the chat), and says so plainly, then offers a call and room for more.
 * Without an email (a prototype shared from a chat), it asks for one first. Anything sent goes as
 * a lead (/api/builder-event, interest) with their notes on the prototype's screens.
 */

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/

/** Opens the window from any button on the page. */
export const openBuild = () => window.dispatchEvent(new Event('fohm:build'))

export function BuildDialog({answers, prototype, name, bookingUrl, builderRef, from}: {
  answers: Answers
  prototype?: string
  name: string
  bookingUrl?: string | null
  builderRef: string
  from: string
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  const notes = useNotes()
  const [contact, setContact] = useState({name: '', email: answers.email ?? '', note: ''})
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'failed'>('idle')
  const [added, setAdded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const count = Object.keys(notes).length

  const send = async (c = contact) => {
    if (!EMAIL.test(c.email.trim())) return setError('An email address, so Rob can get back to you.')
    setError(null)
    setState('sending')
    try {
      const res = await fetch('/api/builder-event', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({event: 'interest', answers, prototype, ref: builderRef, contact: {...c, email: c.email.trim(), notes: notesText(notes)}}),
      })
      setState(res.ok ? 'sent' : 'failed')
      return res.ok
    } catch {
      setState('failed')
    }
  }

  // Opening it sends it, once, when the email is known: the visitor sees it has gone, not a form.
  const sent = useRef(false)
  useEffect(() => {
    const open = () => {
      dialog.current?.showModal()
      if (!sent.current && EMAIL.test(contact.email.trim())) {
        sent.current = true
        void send()
      }
    }
    window.addEventListener('fohm:build', open)
    return () => window.removeEventListener('fohm:build', open)
  })

  const more = async (e: FormEvent) => {
    e.preventDefault()
    sent.current = true
    if (await send()) setAdded(true)
  }

  const field = (k: keyof typeof contact) => ({value: contact[k], onChange: (e: {target: {value: string}}) => setContact({...contact, [k]: e.target.value})})

  return (
    <dialog ref={dialog} className="build-dialog" aria-labelledby="build-dialog-title" onClick={(e) => e.target === dialog.current && dialog.current?.close()}>
      <div className="build-dialog__body">
        <button type="button" className="build-dialog__close" aria-label="Close" onClick={() => dialog.current?.close()}>
          ×
        </button>
        {state === 'sent' ? (
          <>
            <span className="build-dialog__tick" aria-hidden>
              ✓
            </span>
            <h2 id="build-dialog-title">Sent to Rob</h2>
            <p className="build-dialog__lead">
              Rob has {name}: your answers, the prototype Claude designed{count ? ` and your ${count} ${count === 1 ? 'note' : 'notes'} on it` : ''}. He’ll be in touch at{' '}
              <strong>{contact.email.trim()}</strong>.
            </p>
          </>
        ) : (
          <>
            <h2 id="build-dialog-title">Build {name} with Rob</h2>
            <p className="build-dialog__lead">
              Rob at Fohm, a London app studio, takes it from this prototype to the web, the App Store and Google Play. Send it to him
              {count ? `, with your ${count} ${count === 1 ? 'note' : 'notes'}` : ''}, and he’ll be in touch.
            </p>
          </>
        )}

        {bookingUrl && (state === 'sent' || !contact.email) && (
          <div className="build-dialog__call">
            <p>{state === 'sent' ? 'Want to talk it through sooner? Pick a time:' : 'Or book a free call straight away:'}</p>
            <BookCall url={bookingUrl} label="Book a free call" from={from} builderRef={builderRef} prefill={{name: contact.name.trim(), email: contact.email.trim(), notes: [`About ${name}, from the app builder.`, contact.note.trim()].filter(Boolean).join('\n\n')}} />
          </div>
        )}

        <form className="build-dialog__form" onSubmit={more} noValidate>
          {state === 'sent' && <p className="build-dialog__more">{added ? 'Added. Thank you.' : 'Anything to add? It goes to Rob too.'}</p>}
          <label>
            <span>Your name</span>
            <input autoComplete="name" maxLength={100} {...field('name')} />
          </label>
          {state !== 'sent' && (
            <label>
              <span>Your email</span>
              <input type="email" autoComplete="email" inputMode="email" required maxLength={200} {...field('email')} />
            </label>
          )}
          <label>
            <span>Anything Rob should know? (optional)</span>
            <textarea rows={2} maxLength={1000} {...field('note')} />
          </label>
          {(error || state === 'failed') && <p className="builder__error">{error ?? 'That didn’t send. Try again in a moment.'}</p>}
          <div>
            <button type="submit" className="btn btn-primary" disabled={state === 'sending'}>
              {state === 'sending' ? 'Sending…' : state === 'sent' ? 'Add this' : 'Send it to Rob'} <Arrow />
            </button>
          </div>
        </form>
      </div>
    </dialog>
  )
}
