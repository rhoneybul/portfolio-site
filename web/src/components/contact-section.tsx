import type {Settings} from '@/sanity/settings'
import {BookCall} from './book-call'
import {ContactForm} from './contact-form'

export function ContactSection({settings}: {settings: Settings}) {
  const whatsapp = settings?.whatsapp
  return (
    <section id="contact" className="card card-dark contact">
      <div className="contact__intro">
        <span className="pill pill-dark">Contact</span>
        <h2 className="display">
          {settings?.contactHeading ?? 'Let’s build something that matters.'}
        </h2>
        <p className="muted-dark">
          Tell me what you’re working on. I reply to every message within one working day.
        </p>
        <div className="contact__actions">
          {settings?.bookingUrl && <BookCall url={settings.bookingUrl} variant="light" label="Book a 30-min intro call" />}
          {whatsapp && (
            <a
              className="btn btn-outline-dark"
              href={`https://wa.me/${whatsapp}?text=${encodeURIComponent('Hi Rob, I found you through your website.')}`}
              target="_blank"
              rel="noreferrer"
            >
              WhatsApp <span aria-hidden>↗</span>
            </a>
          )}
        </div>
        <dl className="contact__list">
          {settings?.email && (
            <div>
              <dt className="mono">Email</dt>
              <dd className="mono">
                <a href={`mailto:${settings.email}`}>{settings.email}</a>
              </dd>
            </div>
          )}
          {whatsapp && (
            <div>
              <dt className="mono">WhatsApp</dt>
              <dd className="mono">
                <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noreferrer">
                  Message me ↗
                </a>
              </dd>
            </div>
          )}
          {settings?.location && (
            <div>
              <dt className="mono">Location</dt>
              <dd className="mono">{settings.location}</dd>
            </div>
          )}
          {settings?.socials?.map((s) => (
            <div key={s._key}>
              <dt className="mono">{s.label}</dt>
              <dd className="mono">
                <a href={s.url ?? '#'} target="_blank" rel="noreferrer">
                  {s.url?.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')} ↗
                </a>
              </dd>
            </div>
          ))}
        </dl>
      </div>
      <ContactForm />
    </section>
  )
}
