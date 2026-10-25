import type {Settings} from '@/sanity/settings'
import {Marquee} from './marquee'
import {WhatsAppButton} from './whatsapp-button'

export function ContactSection({settings}: {settings: Settings}) {
  const whatsapp = settings?.whatsapp
  // WhatsApp has its own button below, so the links are the socials only
  const links = (settings?.socials ?? []).map((s) => ({label: s.label ?? '', href: s.url ?? '#'}))

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
            {whatsapp && <WhatsAppButton number={whatsapp} message="Hi Rob, I found you through your website." />}
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
