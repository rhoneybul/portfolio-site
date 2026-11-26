'use client'

import {useEffect, useId, useRef, useState} from 'react'
import {Arrow} from '@/components/arrow'

/**
 * Book a call through Cal.com's own embed (app.cal.com/embed/embed.js), loaded on the first open, so the
 * whole booking happens in the dialog. A plain iframe of a Cal.com page can be refused by the browser;
 * the embed is the way Cal.com supports. When a booking is made, /api/booking is told, which pings the
 * Fohm Slack channel unless Cal.com's webhook (/api/cal-webhook) already does.
 */

type CalApi = ((...args: unknown[]) => void) & {ns?: Record<string, (...args: unknown[]) => void>; q?: unknown[]; loaded?: boolean}
declare global {
  interface Window {
    Cal?: CalApi
  }
}

const EMBED_SCRIPT = 'https://app.cal.com/embed/embed.js'

/** Cal.com's loader snippet: queues calls until embed.js has loaded. */
function calApi(): CalApi {
  if (window.Cal) return window.Cal
  const cal = function (...args: unknown[]) {
    const self = window.Cal!
    if (!self.loaded) {
      self.ns = {}
      self.q = self.q ?? []
      const script = document.createElement('script')
      script.src = EMBED_SCRIPT
      document.head.appendChild(script)
      self.loaded = true
    }
    if (args[0] === 'init' && typeof args[1] === 'string') {
      const namespace = args[1]
      const api = function (...inner: unknown[]) {
        ;(api as unknown as {q: unknown[]}).q.push(inner)
      } as CalApi
      ;(api as unknown as {q: unknown[]}).q = []
      self.ns![namespace] = self.ns![namespace] ?? api
      ;(self.ns![namespace] as unknown as {q: unknown[]}).q.push(args)
      self.q!.push(['initNamespace', namespace])
      return
    }
    self.q!.push(args)
  } as CalApi
  window.Cal = cal
  return cal
}

/** "https://cal.com/someone/30min" → origin and the link Cal.com's embed takes ("someone/30min"). */
export function calLinkOf(url: string) {
  const u = new URL(url)
  return {origin: u.origin, calLink: u.pathname.replace(/^\/+|\/+$/g, '')}
}

/** Details already given, filled into Cal.com's form so nobody types them twice. Empty ones are left out. */
type Prefill = {name?: string; email?: string; notes?: string}

/**
 * Cal.com's embed config: the layout, what's already known, and where the booking came from. Cal.com keeps
 * `metadata[...]` on the booking and sends it in its webhook, which is how /api/cal-webhook knows a call came from
 * the app builder and which session (`ref`) made it.
 */
export function embedConfig(prefill: Prefill = {}, from?: string, builderRef?: string) {
  const known = Object.fromEntries(Object.entries(prefill).filter(([, v]) => v?.trim()))
  return {
    theme: 'light',
    ...known,
    ...(from ? {'metadata[from]': from} : {}),
    ...(builderRef ? {'metadata[ref]': builderRef} : {}),
  }
}

/**
 * Starts Cal.com's embed inside an element, with what's known filled in, and tells /api/booking
 * (and `onBooked`) when a call is booked.
 */
function startCal({namespace, elementId, url, prefill, from, builderRef, label, onBooked}: {
  namespace: string
  elementId: string
  url: string
  prefill?: Prefill
  from?: string
  builderRef?: string
  label: string
  onBooked?: (startTime?: string) => void
}) {
  const {origin, calLink} = calLinkOf(url)
  const cal = calApi()
  cal('init', namespace, {origin})
  const ns = cal.ns![namespace]
  ns('inline', {elementOrSelector: `#${elementId}`, calLink, layout: 'month_view', config: embedConfig(prefill, from, builderRef)})
  ns('ui', {hideEventTypeDetails: false, layout: 'month_view'})
  ns('on', {
    action: 'bookingSuccessfulV2',
    callback: (e: CustomEvent<{data?: Record<string, unknown>}>) => {
      const data = e.detail?.data ?? {}
      onBooked?.(typeof data.startTime === 'string' ? data.startTime : undefined)
      void fetch('/api/booking', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({uid: data.uid, title: data.title, startTime: data.startTime, endTime: data.endTime, from: label, page: window.location.pathname, ref: builderRef}),
      }).catch(() => {})
    },
  })
}

/** Cal.com's calendar in place, started once it's mounted: for a window that holds it with other things (build-dialog.tsx). */
export function CalInline({url, prefill, from, builderRef, label = 'Build it with me', onBooked}: {
  url: string
  prefill?: Prefill
  from?: string
  builderRef?: string
  label?: string
  onBooked?: (startTime?: string) => void
}) {
  const namespace = `cal${useId().replace(/[^a-zA-Z0-9]/g, '')}`
  const elementId = `${namespace}-inline`
  const started = useRef(false)
  useEffect(() => {
    if (started.current) return
    started.current = true
    startCal({namespace, elementId, url, prefill, from, builderRef, label, onBooked})
    // Started once, with what was known when it opened.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return <div id={elementId} className="booking-dialog__cal" />
}

export function BookCall({url, label = 'Book a call', variant = 'primary', from, builderRef, prefill}: {
  url: string
  label?: string
  variant?: 'primary' | 'outline'
  /** Where on the site the call was booked from, e.g. "app-builder". */
  from?: string
  /** The app builder session it was booked from (components/app-builder.tsx). */
  builderRef?: string
  prefill?: Prefill
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  const started = useRef(false)
  const namespace = `book${useId().replace(/[^a-zA-Z0-9]/g, '')}`
  const elementId = `${namespace}-inline`
  const [booked, setBooked] = useState<{at?: string} | null>(null)

  function open() {
    dialog.current?.showModal()
    if (started.current) return
    started.current = true
    startCal({namespace, elementId, url, prefill, from, builderRef, label, onBooked: (at) => setBooked({at})})
  }

  return (
    <>
      <button type="button" className={`btn btn-${variant}`} onClick={open}>
        {label}
        <Arrow />
      </button>
      <dialog
        ref={dialog}
        className="booking-dialog"
        onClick={(e) => e.target === dialog.current && dialog.current?.close()}
      >
        <div className="booking-dialog__bar">
          <span>{label}</span>
          <div className="booking-dialog__actions">
            <a href={url} target="_blank" rel="noreferrer">
              Open in new tab <Arrow />
            </a>
            <button type="button" onClick={() => dialog.current?.close()}>
              Close ✕
            </button>
          </div>
        </div>
        <div id={elementId} className="booking-dialog__cal" />
        {booked && <Booked at={booked.at} onDone={() => dialog.current?.close()} />}
      </dialog>
    </>
  )
}

/** The call's time in the visitor's own words and time zone: "Friday 27 November at 9:45". */
export function callTime(iso?: string) {
  const d = iso ? new Date(iso) : null
  if (!d || Number.isNaN(d.getTime())) return ''
  const day = d.toLocaleDateString('en-GB', {weekday: 'long', day: 'numeric', month: 'long'})
  const time = d.toLocaleTimeString('en-GB', {hour: 'numeric', minute: '2-digit'})
  return `${day} at ${time}`
}

/**
 * Over the booking window once a call is booked: a big, plain thank-you, so nobody is left reading
 * Cal.com's small print to find out whether it worked.
 */
export function Booked({at, name, onDone}: {at?: string; name?: string; onDone: () => void}) {
  const when = callTime(at)
  return (
    <div className="booked" role="status" aria-live="polite">
      <span className="booked__tick" aria-hidden>
        ✓
      </span>
      <h2 className="booked__title">Thank you for booking</h2>
      <p className="booked__line">
        {when ? (
          <>
            Your call with Rob is on <strong>{when}</strong>.
          </>
        ) : (
          'Your call with Rob is booked.'
        )}{' '}
        The invite and the link are in your email, and Rob will be in touch before then{name ? ` about ${name}` : ''}.
      </p>
      <button type="button" className="btn btn-primary booked__done" onClick={onDone}>
        Done
      </button>
    </div>
  )
}
