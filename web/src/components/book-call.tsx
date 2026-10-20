'use client'

import {useRef} from 'react'

export function BookCall({url, label = 'Book a call', variant = 'primary'}: {
  url: string
  label?: string
  variant?: 'primary' | 'ghost' | 'light'
}) {
  const dialog = useRef<HTMLDialogElement>(null)

  return (
    <>
      <button type="button" className={`btn btn-${variant}`} onClick={() => dialog.current?.showModal()}>
        {label}
        <span aria-hidden>↗</span>
      </button>
      <dialog
        ref={dialog}
        className="booking-dialog"
        onClick={(e) => e.target === dialog.current && dialog.current?.close()}
      >
        <div className="booking-dialog__bar">
          <span className="mono">Book an intro call</span>
          <div className="booking-dialog__actions">
            <a href={url} target="_blank" rel="noreferrer" className="mono">
              Open in new tab ↗
            </a>
            <button type="button" className="mono" onClick={() => dialog.current?.close()}>
              Close ✕
            </button>
          </div>
        </div>
        <iframe src={url} title="Book a call" loading="lazy" />
      </dialog>
    </>
  )
}
