import Link from 'next/link'
import type {Settings} from '@/sanity/settings'

export function SiteHeader({settings}: {settings: Settings}) {
  const initials = (settings?.name ?? 'Rob Honeybul')
    .split(' ')
    .map((p) => p[0])
    .join('')
  const status = settings?.availability?.status ?? 'available'

  return (
    <header className="site-header">
      <Link href="/" className="monogram" aria-label="Home">
        {initials}
      </Link>
      {settings?.availability?.label && (
        <span className={`pill status status-${status}`}>
          <span className="dot" aria-hidden />
          {settings.availability.label}
        </span>
      )}
      <nav className="site-nav">
        <Link href="/#services">Services</Link>
        <Link href="/#work">Work</Link>
        <Link href="/#experience">Experience</Link>
        <Link href="/#contact" className="nav-cta">
          Contact
        </Link>
      </nav>
    </header>
  )
}
