'use client'

import {useId, useRef} from 'react'
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

export function BookCall({url, label = 'Book a call', variant = 'primary'}: {
  url: string
  label?: string
  variant?: 'primary' | 'outline'
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  const started = useRef(false)
  const namespace = `book${useId().replace(/[^a-zA-Z0-9]/g, '')}`
  const elementId = `${namespace}-inline`

  function open() {
    dialog.current?.showModal()
    if (started.current) return
    started.current = true
    const {origin, calLink} = calLinkOf(url)
    const cal = calApi()
    cal('init', namespace, {origin})
    const ns = cal.ns![namespace]
    ns('inline', {elementOrSelector: `#${elementId}`, calLink, layout: 'month_view', config: {theme: 'light'}})
    ns('ui', {hideEventTypeDetails: false, layout: 'month_view'})
    ns('on', {
      action: 'bookingSuccessfulV2',
      callback: (e: CustomEvent<{data?: Record<string, unknown>}>) => {
        const data = e.detail?.data ?? {}
        void fetch('/api/booking', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({
            uid: data.uid,
            title: data.title,
            startTime: data.startTime,
            endTime: data.endTime,
            from: label,
            page: window.location.pathname,
          }),
        }).catch(() => {})
      },
    })
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
      </dialog>
    </>
  )
}
