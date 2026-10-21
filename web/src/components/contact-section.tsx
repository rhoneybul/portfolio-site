import type {Settings} from '@/sanity/settings'
import {BookCall} from './book-call'
import {Marquee} from './marquee'

export function ContactSection({settings}: {settings: Settings}) {
  const whatsapp = settings?.whatsapp
  const links = [
    ...(settings?.socials ?? []).map((s) => ({label: s.label ?? '', href: s.url ?? '#'})),
    whatsapp && {label: 'WhatsApp', href: `https://wa.me/${whatsapp}`},
  ].filter(Boolean) as {label: string; href: string}[]

  return (
    <section id="contact" className="contact">
      <h2 className="contact__wordmark">Let’s talk</h2>
      <Marquee items={[settings?.contactHeading ?? 'Let’s build something that matters.']} className="marquee-light" />

      <div className="contact__grid">
        <div className="contact__info">
          <p className="contact__lead">Tell me what you’re working on.</p>
          {settings?.email && (
            <a className="contact__email" href={`mailto:${settings.email}`}>
              {settings.email}
            </a>
          )}
          <div className="contact__actions">
            {settings?.bookingUrl && <BookCall url={settings.bookingUrl} label="Book a call" />}
            {whatsapp && (
              <a
                className="btn btn-outline"
                href={`https://wa.me/${whatsapp}?text=${encodeURIComponent('Hi Rob, I found you through your website.')}`}
                target="_blank"
                rel="noreferrer"
              >
                Message on WhatsApp <span aria-hidden>↗︎</span>
              </a>
            )}
          </div>
          <ul className="text-links">
            {links.map((l) => (
              <li key={l.label}>
                <a href={l.href} target="_blank" rel="noreferrer">
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
