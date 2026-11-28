'use client'

import {useEffect, useRef, useState} from 'react'
import {Arrow} from '@/components/arrow'
import {AppIcon} from '@/components/app-icon'
import {Booked, CalInline} from '@/components/book-call'
import type {Style} from '@/app-builder/prototype-doc'

/** How long into the build the invitation opens: long enough to have read the page, well before it's done. */
export const INVITE_AFTER_MS = 20_000

/** Asked once per visit: dismissing it (Not now, Esc, a tap outside) keeps it closed, as does booking. */
const seenKey = (ref: string) => `fohm:call-invite:${ref}`

export function wasInvited(ref: string) {
  try {
    return sessionStorage.getItem(seenKey(ref)) === '1'
  } catch {
    return false
  }
}

function markInvited(ref: string) {
  try {
    sessionStorage.setItem(seenKey(ref), '1')
  } catch {}
}

/**
 * While Claude draws the app (prototype-build.tsx): a window that opens by itself a little way in,
 * offering a free call to go through it with Rob. Pick a time turns it into Cal.com's calendar in place;
 * Not now closes it for good. The call joins the build through `builderRef`, as every booking does.
 */
export function CallInvite({url, name, accent, icon, email, builderRef}: {
  url: string
  name: string
  accent: string
  icon?: Style['icon']
  email?: string
  builderRef: string
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  const [picking, setPicking] = useState(false)
  const [booked, setBooked] = useState<{at?: string} | null>(null)

  useEffect(() => {
    if (wasInvited(builderRef)) return
    const t = window.setTimeout(() => {
      if (document.querySelector('dialog[open]')) return
      markInvited(builderRef)
      dialog.current?.showModal()
    }, INVITE_AFTER_MS)
    return () => window.clearTimeout(t)
  }, [builderRef])

  const close = () => dialog.current?.close()

  return (
    <dialog
      ref={dialog}
      className={picking ? 'booking-dialog call-invite is-picking' : 'call-invite'}
      aria-labelledby="call-invite-title"
      onClick={(e) => e.target === dialog.current && close()}
    >
      {picking ? (
        <>
          <div className="booking-dialog__bar">
            <span id="call-invite-title">A free call about {name}</span>
            <div className="booking-dialog__actions">
              <a href={url} target="_blank" rel="noreferrer">
                Open in new tab <Arrow />
              </a>
              <button type="button" onClick={close}>
                Close ✕
              </button>
            </div>
          </div>
          <CalInline
            url={url}
            from="app-builder-invite"
            builderRef={builderRef}
            label="Call invite while it builds"
            prefill={{email, notes: `About ${name}, from the app builder.`}}
            onBooked={(at) => setBooked({at})}
          />
          {booked && <Booked at={booked.at} name={name} email={email} builderRef={builderRef} onDone={close} />}
        </>
      ) : (
        <div className="call-invite__card">
          <button type="button" className="call-invite__x" onClick={close} aria-label="Close">
            ✕
          </button>
          <AppIcon name={name} accent={accent} icon={icon} size={56} />
          <span className="label">While it draws</span>
          <h2 id="call-invite-title">Go through {name} with Rob</h2>
          <p>A free call: what it would take to build it for real, and what to launch first. Your prototype will be ready to look through together.</p>
          <div className="call-invite__actions">
            <button type="button" className="btn btn-primary" autoFocus onClick={() => setPicking(true)}>
              Pick a time <Arrow />
            </button>
            <button type="button" className="text-btn" onClick={close}>
              Not now
            </button>
          </div>
        </div>
      )}
    </dialog>
  )
}
