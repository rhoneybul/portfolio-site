import Image from 'next/image'
import Link from 'next/link'
import {stegaClean} from 'next-sanity'
import {sanityFetch} from '@/sanity/live'
import {HOME_QUERY} from '@/sanity/queries'
import {getSettings} from '@/sanity/settings'
import {urlFor} from '@/sanity/image'
import {TopBar} from '@/components/top-bar'
import {BRAND} from '@/brand'
import {SiteFooter} from '@/components/site-footer'
import {ContactSection} from '@/components/contact-section'
import {RichText} from '@/components/rich-text'
import {BookCall} from '@/components/book-call'

function Headline({text, accent}: {text: string; accent?: string | null}) {
  if (!accent || !text.includes(accent)) return <>{text}</>
  const [before, after] = text.split(accent)
  return (
    <>
      {before}
      <span className="accent">{accent}</span>
      {after}
    </>
  )
}

export default async function HomePage() {
  const [{data}, settingsMeta] = await Promise.all([sanityFetch({query: HOME_QUERY}), getSettings()])
  const {settings, services: allServices, projects} = data
  // Main offers lead the page; leadership is its own, separate message
  const services = allServices.filter((s) => stegaClean(s.track) !== 'leadership')
  const leadership = allServices.filter((s) => stegaClean(s.track) === 'leadership')
  const firstName = settings?.name?.split(' ')[0] ?? 'Rob'
  const socials = [
    ...(settings?.socials ?? []).map((s) => ({key: s._key, label: s.label ?? '', url: s.url ?? '#'})),
    ...(settings?.whatsapp ? [{key: 'wa', label: 'WhatsApp', url: `https://wa.me/${settings.whatsapp}`}] : []),
  ]

  return (
    <>
      <TopBar settings={settingsMeta} />

      <main>
        {/* Hero: the offer, stated plainly. Each need opens to a short answer. */}
        <section className="hero">
          <div className="hero__text">
          <h1 className="hero__lead">
            If you’re looking to
            <span className="sr-only">
              {' '}
              {services.map((s) => s.need).filter(Boolean).join(', ')}, {BRAND} can help.
            </span>
          </h1>
          <ul className="needs">
            {services.map((s, i) => (
              <li key={s._id}>
                <details className="need">
                  <summary>
                    <span className="need__text">{s.need ?? s.title}</span>
                    <span className="need__toggle" aria-hidden />
                  </summary>
                  <div className="need__body">
                    <p>{s.summary}</p>
                    {!!s.proof?.length && (
                      <p className="need__proof">
                        {s.proof.map((p) => p.title).join(' · ')}
                      </p>
                    )}
                    <a href={`#service-${i + 1}`} className="text-btn">
                      How I do it
                    </a>
                  </div>
                </details>
              </li>
            ))}
          </ul>
          <div className="hero__close">
            <p className="hero__help">I can help.</p>
            {settings?.bookingUrl ? (
              <BookCall url={settings.bookingUrl} label="Book a free 30-min call" />
            ) : (
              <a href="#contact" className="btn btn-primary">
                Get in touch
              </a>
            )}
          </div>
          {!!leadership.length && (
            <p className="hero__aside">
              Need senior technical leadership instead? <a href="#leadership">Fractional CTO and team building</a>
            </p>
          )}
          </div>

          {settings?.portrait?.asset && (
            <figure className="hero__portrait">
              <div className="hero__photo">
                <Image
                  src={urlFor(settings.portrait).width(900).height(1125).url()}
                  alt={settings.portrait.alt ?? settings.name ?? ''}
                  width={900}
                  height={1125}
                  priority
                  sizes="(max-width: 900px) 70vw, 30vw"
                />
                {/* The brand's waterline: below the wave the photo sits in the water */}
                <svg className="hero__water" viewBox="0 0 100 40" preserveAspectRatio="none" aria-hidden>
                  <path d="M0 10C14 10 22 2 36 2S58 12 72 12 90 4 100 4V40H0Z" />
                </svg>
              </div>
              <figcaption>
                <span>{settings?.name}</span>
                <span>Director, {BRAND}</span>
              </figcaption>
            </figure>
          )}
        </section>

        {/* Intro: one statement, one action */}
        <section id="about" className="intro">
          <div className="intro__text">
            <h2 className="intro__headline">
              <Headline text={settings?.headline ?? ''} accent={settings?.headlineAccent} />
            </h2>
            <p className="intro__lead">{settings?.intro}</p>
            <div className="intro__actions">
              {settings?.bookingUrl ? (
                <BookCall url={settings.bookingUrl} label="Book a call" />
              ) : (
                <a href="#contact" className="btn btn-primary">
                  Get in touch
                </a>
              )}
              <Link href="/pricing" className="text-btn">
                See pricing
              </Link>
            </div>
            {!!socials.length && (
              <ul className="text-links intro__links">
                {socials.map((s) => (
                  <li key={s.key}>
                    <a href={s.url} target="_blank" rel="noreferrer">
                      {s.label}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {/* Services: the three focus areas */}
        <section id="services" className="section">
          <header className="section__head">
            <span className="label">● What I do</span>
            <h2 className="section__title">{services.length === 2 ? 'Two things' : 'What I do'}</h2>
          </header>
          <ol className="services">
            {services.map((service, i) => (
              <li key={service._id} id={`service-${i + 1}`} className="service">
                <span className="service__index">{String(i + 1).padStart(2, '0')}</span>
                <div className="service__main">
                  <h3 className="service__title">{service.title}</h3>
                  <p className="service__summary">{service.summary}</p>
                  <p className="service__deliverables">{service.deliverables?.join(' · ')}</p>
                </div>
                {!!service.proof?.length && <Proof items={service.proof} />}
              </li>
            ))}
          </ol>
        </section>

        {/* Leadership: a separate offer, its own message */}
        {leadership.map((lead) => (
          <section key={lead._id} id="leadership" className="leadership">
            <div className="leadership__main">
              <h2 className="leadership__title">Need a technical leader?</h2>
              <p className="leadership__name">{lead.title}</p>
              <p className="leadership__summary">{lead.summary}</p>
              <p className="service__deliverables">{lead.deliverables?.join(' · ')}</p>
              {settings?.bookingUrl ? (
                <BookCall url={settings.bookingUrl} label="Talk about leadership" />
              ) : (
                <a href="#contact" className="btn btn-primary">
                  Talk about leadership
                </a>
              )}
            </div>
            <div className="leadership__side">
              {!!lead.proof?.length && <Proof items={lead.proof} />}
              {!!settings?.stats?.length && (
                <dl className="stats">
                  {settings.stats.map((s) => (
                    <div key={s._key}>
                      <dt>{s.value}</dt>
                      <dd>{s.label}</dd>
                    </div>
                  ))}
                </dl>
              )}
            </div>
          </section>
        ))}

        {/* Work */}
        <section id="work" className="section">
          <header className="section__head">
            <span className="label">● Selected work</span>
            <h2 className="section__title">Work</h2>
          </header>
          <ol className="work-list">
            {projects.map((project, i) => (
              <li key={project._id}>
                <Link href={`/work/${project.slug}`} className="work-row">
                  <span className="work-row__index">{String(i + 1).padStart(2, '0')}</span>
                  <span className="work-row__title">{project.title}</span>
                  <span className="work-row__meta">
                    <span>{project.sector}</span>
                    <span>{project.role}</span>
                  </span>
                  <span className="work-row__arrow" aria-hidden>
                    ↗︎
                  </span>
                  {project.coverImage?.asset && (
                    <Image
                      src={urlFor(project.coverImage).width(640).height(420).url()}
                      alt=""
                      width={640}
                      height={420}
                      className="work-row__preview"
                    />
                  )}
                </Link>
              </li>
            ))}
          </ol>
        </section>

        <ContactSection settings={settingsMeta} />
      </main>

      <SiteFooter settings={settingsMeta} />
    </>
  )
}

type ProofItem = {_key: string; title: string | null; detail: string | null; url: string | null; slug: string | null}

function Proof({items}: {items: ProofItem[]}) {
  return (
    <div className="service__proof">
      <span className="label">Proof</span>
      <ul>
        {items.map((p) => {
          const href = p.slug ? `/work/${p.slug}` : p.url
          const inner = (
            <>
              <span className="proof__title">{p.title}</span>
              {href && (
                <span className="proof__arrow" aria-hidden>
                  ↗︎
                </span>
              )}
              {p.detail && <span className="proof__detail">{p.detail}</span>}
            </>
          )
          return (
            <li key={p._key}>
              {href ? (
                <Link href={href} className="proof" {...(p.slug ? {} : {target: '_blank', rel: 'noreferrer'})}>
                  {inner}
                </Link>
              ) : (
                <div className="proof">{inner}</div>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
