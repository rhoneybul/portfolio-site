import Link from 'next/link'
import type {Settings} from '@/sanity/settings'
import {BRAND} from '@/brand'

const STATUS_TITLE: Record<string, string> = {
  available: 'Available for new work',
  limited: 'Taking on select engagements',
  booked: 'Fully booked',
}

export function TopBar({settings, active}: {settings: Settings; active?: 'work' | 'pricing' | 'blog' | 'app-builder'}) {
  const status = settings?.availability?.status ?? 'available'
  const role = settings?.role?.toLowerCase()
  return (
    <header className="top-bar">
      <Link href="/" className="top-bar__intro">
        <strong>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className="top-bar__logo"
            src="/brand/svg/fohm-wordmark-tight.svg"
            alt={BRAND}
            title={settings?.availability?.label ?? STATUS_TITLE[status]}
          />
        </strong>
        <span>
          {role ? `${role} by ` : ''}
          {settings?.name}
          {settings?.location && <>, based in {settings.location}</>}.
        </span>
        {settings?.availability?.label && <span className="top-bar__status">{settings.availability.label}.</span>}
      </Link>
      <nav className="top-bar__nav" aria-label="Main">
        {/* Links to a section of the home page are plain links: a full load always lands on the
            section, and brings the home page fresh. */}
        <a href="/#work" className={active === 'work' ? 'is-active' : undefined}>
          Work
        </a>
        ,<a href="/#services">Services</a>,
        <Link href="/pricing" className={active === 'pricing' ? 'is-active' : undefined}>
          Pricing
        </Link>
        ,
        <Link href="/blog" className={active === 'blog' ? 'is-active' : undefined}>
          Blog
        </Link>
        ,
        <Link href="/app-builder" className={active === 'app-builder' ? 'is-active' : undefined}>
          App builder
        </Link>
        ,
        <a href="/#contact">Let’s talk</a>
      </nav>
    </header>
  )
}
