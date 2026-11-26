'use client'

import {useEffect, useRef, useState, type FormEvent} from 'react'
import {Arrow} from '@/components/arrow'
import {AppIcon} from '@/components/app-icon'
import {CalInline} from '@/components/book-call'
import {notesText, useNotes} from '@/components/prototype-notes'
import type {Answers} from '@/app-builder/options'
import type {Style} from '@/app-builder/prototype-doc'

/**
 * "Build it with me", from anywhere on the finished page (the reveal, the bar at the foot, the
 * deck's last slide): one large window, like the booking one, that always captures three things.
 * What they're building goes to Rob the moment it opens, when their email is known (it is, from the
 * chat), with their notes on the screens; who they are, which they can add to; and a call, in
 * Cal.com's calendar inside the same window. Without an email (a prototype shared from a chat), it
 * asks for one before sending. A lead is /api/builder-event's interest event.
 */

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/

/** Opens the window from any button on the page. */
export const openBuild = () => window.dispatchEvent(new Event('fohm:build'))

export function BuildDialog({answers, prototype, name, accent, icon, tagline, bookingUrl, builderRef, from}: {
  answers: Answers
  prototype?: string
  name: string
  accent: string
  icon?: Style['icon']
  tagline?: string
  bookingUrl?: string | null
  builderRef: string
  from: string
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  const notes = useNotes()
  const [opened, setOpened] = useState(false)
  const [contact, setContact] = useState({name: '', email: answers.email ?? '', note: ''})
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'failed'>('idle')
  const [updated, setUpdated] = useState(false)
  const [booked, setBooked] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const count = Object.keys(notes).length

  const send = async () => {
    if (!EMAIL.test(contact.email.trim())) {
      setError('Your email, so Rob can get back to you.')
      return false
    }
    setError(null)
    setState('sending')
    try {
      const res = await fetch('/api/builder-event', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({event: 'interest', answers, prototype, ref: builderRef, contact: {...contact, email: contact.email.trim(), notes: notesText(notes)}}),
      })
      setState(res.ok ? 'sent' : 'failed')
      return res.ok
    } catch {
      setState('failed')
      return false
    }
  }

  // Opening it sends what they're building, once, when the email is known: they see it has gone.
  const sentOnce = useRef(false)
  useEffect(() => {
    const open = () => {
      dialog.current?.showModal()
      setOpened(true)
      if (!sentOnce.current && EMAIL.test(contact.email.trim())) {
        sentOnce.current = true
        void send()
      }
    }
    window.addEventListener('fohm:build', open)
    return () => window.removeEventListener('fohm:build', open)
  })

  const save = async (e: FormEvent) => {
    e.preventDefault()
    const first = state !== 'sent'
    sentOnce.current = true
    if ((await send()) && !first) setUpdated(true)
  }

  const field = (k: keyof typeof contact) => ({
    value: contact[k],
    onChange: (e: {target: {value: string}}) => {
      setContact({...contact, [k]: e.target.value})
      setUpdated(false)
    },
  })
  const close = () => dialog.current?.close()

  return (
    <dialog ref={dialog} className="booking-dialog build-dialog" aria-labelledby="build-dialog-title" onClick={(e) => e.target === dialog.current && close()}>
      <div className="booking-dialog__bar">
        <span id="build-dialog-title">Build {name} with Rob</span>
        <div className="booking-dialog__actions">
          {bookingUrl && (
            <a href={bookingUrl} target="_blank" rel="noreferrer">
              Calendar in a new tab <Arrow />
            </a>
          )}
          <button type="button" onClick={close}>
            Close ✕
          </button>
        </div>
      </div>

      <div className="build-dialog__grid">
        <div className="build-dialog__side">
          <section className="build-dialog__step">
            <h3>
              <span>1</span> What you’re building
            </h3>
            <div className="build-dialog__app">
              <AppIcon name={name} accent={accent} icon={icon} size={44} />
              <div>
                <strong>{name}</strong>
                {tagline && <span>{tagline}</span>}
              </div>
            </div>
            <p className="build-dialog__status" role="status">
              {state === 'sent' ? (
                <>
                  <b className="build-dialog__tick" aria-hidden>
                    ✓
                  </b>{' '}
                  Sent to Rob: your answers, the prototype{count ? ` and your ${count} ${count === 1 ? 'note' : 'notes'}` : ''}.
                </>
              ) : state === 'sending' ? (
                'Sending it to Rob…'
              ) : state === 'failed' ? (
                'That didn’t send. Press Send below to try again.'
              ) : (
                `Your answers and the prototype${count ? `, with your ${count} ${count === 1 ? 'note' : 'notes'}` : ''}, go to Rob with your email.`
              )}
            </p>
          </section>

          <form className="build-dialog__step build-dialog__form" onSubmit={save} noValidate>
            <h3>
              <span>2</span> Who you are
            </h3>
            <label>
              <span>Your name</span>
              <input autoComplete="name" maxLength={100} {...field('name')} />
            </label>
            <label>
              <span>Your email</span>
              <input type="email" autoComplete="email" inputMode="email" required maxLength={200} {...field('email')} />
            </label>
            <label>
              <span>Anything Rob should know? (optional)</span>
              <textarea rows={2} maxLength={1000} {...field('note')} />
            </label>
            {error && <p className="builder__error">{error}</p>}
            <div className="build-dialog__save">
              <button type="submit" className="btn btn-primary" disabled={state === 'sending'}>
                {state === 'sent' ? 'Update' : 'Send to Rob'} <Arrow />
              </button>
              {updated && <span>Updated</span>}
            </div>
          </form>
        </div>

        <section className="build-dialog__step build-dialog__call" aria-labelledby="build-dialog-call">
          <h3 id="build-dialog-call">
            <span>3</span> {booked ? 'Booked. See you then.' : 'Book a free call'}
          </h3>
          {bookingUrl && opened ? (
            <CalInline
              url={bookingUrl}
              from={from}
              builderRef={builderRef}
              prefill={{name: contact.name.trim(), email: contact.email.trim(), notes: [`About ${name}, from the app builder.`, contact.note.trim()].filter(Boolean).join('\n\n')}}
              onBooked={() => setBooked(true)}
            />
          ) : (
            !bookingUrl && <p className="build-dialog__status">Rob will write to you to find a time.</p>
          )}
        </section>
      </div>
    </dialog>
  )
}
