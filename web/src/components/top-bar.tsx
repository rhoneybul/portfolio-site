import Link from 'next/link'
import type {Settings} from '@/sanity/settings'
import {BRAND} from '@/brand'

const STATUS_TITLE: Record<string, string> = {
  available: 'Available for new work',
  limited: 'Taking on select engagements',
  booked: 'Fully booked',
}

export function TopBar({settings, active}: {settings: Settings; active?: 'work' | 'pricing' | 'blog'}) {
  const status = settings?.availability?.status ?? 'available'
  const role = settings?.role?.toLowerCase()
  return (
    <header className="top-bar">
      <Link href="/" className="top-bar__intro">
        <strong>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className="top-bar__mark"
            src="/brand/svg/fohm-symbol-tight.svg"
            alt=""
            width={18}
            height={18}
            title={settings?.availability?.label ?? STATUS_TITLE[status]}
          />
          {BRAND}
        </strong>
        <span>
          {role ? `${role} by ` : ''}
          {settings?.name}
          {settings?.location && <>, based in {settings.location}</>}.
        </span>
        {settings?.availability?.label && <span className="top-bar__status">{settings.availability.label}.</span>}
      </Link>
      <nav className="top-bar__nav" aria-label="Main">
        <Link href="/#work" className={active === 'work' ? 'is-active' : undefined}>
          Work
        </Link>
        ,<Link href="/#services">Services</Link>,
        <Link href="/pricing" className={active === 'pricing' ? 'is-active' : undefined}>
          Pricing
        </Link>
        ,
        <Link href="/blog" className={active === 'blog' ? 'is-active' : undefined}>
          Blog <sup className="soon">soon</sup>
        </Link>
        ,
        <Link href="/#contact">Let’s talk</Link>
      </nav>
    </header>
  )
}
