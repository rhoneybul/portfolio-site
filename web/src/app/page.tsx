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
import {Arrow} from '@/components/arrow'
import {Testimonials} from '@/components/testimonials'
import {WorkList} from '@/components/work-list'
import {Logo} from '@/components/logo'

// Rendered on every visit with fresh Sanity data, as the blog is (see blog/layout.tsx): a cached copy
// only refreshes on a live event, which reaches the site only while someone has it open, so a project
// published at a quiet moment stayed off the site until the next deploy.
export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

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
  const {settings, services: allServices, projects, testimonials} = data
  const background = projects.filter((p) => stegaClean(p.kind) === 'background')
  const work = projects.filter((p) => stegaClean(p.kind) !== 'background')
  // Main offers lead the page; leadership is its own, separate message
  const services = allServices.filter((s) => stegaClean(s.track) !== 'leadership')
  const leadership = allServices.filter((s) => stegaClean(s.track) === 'leadership')

  return (
    <>
      <TopBar settings={settingsMeta} />

      <main>
        {/* Hero: building an app leads, straight into the app builder, with what a first build costs.
            The other needs follow, each opening to a short answer. */}
        <section className="hero">
          <div className="hero__text">
          <h1 className="hero__lead">
            <Link href="/app-builder" className="hero__link">
              Looking to build an app?
            </Link>
          </h1>
          <p className="hero__price">
            A first build costs <strong>£5k to £20k</strong>, depending on what it needs. See yours before you spend a
            penny: answer a few questions and the app builder walks you through it.
          </p>
          <div className="hero__actions">
            <Link href="/app-builder" className="btn btn-primary">
              Try the app builder <Arrow />
            </Link>
            {settings?.bookingUrl ? (
              <BookCall url={settings.bookingUrl} label="Book a free call" variant="outline" />
            ) : (
              <a href="#contact" className="btn btn-outline">
                Get in touch
              </a>
            )}
          </div>
          <h2 className="hero__or">
            Or if you’re looking to
            <span className="sr-only">
              {' '}
              {services.map((s) => s.need).filter(Boolean).join(', ')}, {BRAND} can help.
            </span>
          </h2>
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

        </section>

        {/* Intro: one statement and who is behind it */}
        <section id="about" className="intro">
          <h2 className="intro__headline">
            <Headline text={settings?.headline ?? ''} accent={settings?.headlineAccent} />
          </h2>
          <div className="intro__body">
            <p className="intro__lead">{settings?.intro}</p>
            <figure className="byline">
              {settings?.portrait?.asset && (
                <Image
                  src={urlFor(settings.portrait).width(160).height(160).url()}
                  alt={settings.portrait.alt ?? settings.name ?? ''}
                  width={160}
                  height={160}
                />
              )}
              <figcaption>
                <span>{settings?.name}</span>
                <span>Director, {BRAND}</span>
              </figcaption>
            </figure>
          </div>
        </section>

        {/* Services: the three focus areas */}
        <section id="services" className="section">
          <header className="section__head">
            <h2 className="section__title">{services.length === 2 ? 'Two things' : 'What I do'}</h2>
          </header>
          <ol className="services">
            {services.map((service, i) => (
              <li key={service._id} id={`service-${i + 1}`} className="service">
                <div className="service__main">
                  <h3 className="service__title">{service.title}</h3>
                  <p className="service__summary">{service.summary}</p>
                </div>
                {!!service.proof?.length && <Proof items={service.proof} />}
              </li>
            ))}
          </ol>
        </section>

        {/* Testimonials: what clients say, straight after the offers they speak to */}
        <Testimonials items={testimonials} />

        {/* Leadership: a separate offer, its own message */}
        {leadership.map((lead) => (
          <section key={lead._id} id="leadership" className="leadership">
            <div className="leadership__main">
              <h2 className="leadership__title">Need a technical leader?</h2>
              <p className="leadership__name">{lead.title}</p>
              <p className="leadership__summary">{lead.summary}</p>
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
            </div>
          </section>
        ))}

        {/* Work: products built through Fohm. Background: roles held before it. A project with no
            kind set is work, so a new one shows there until it is filed. */}
        <section id="work" className="section">
          <header className="section__head">
            <h2 className="section__title">Work</h2>
          </header>
          <WorkList projects={work} />
        </section>

        {!!background.length && (
          <section id="background" className="section">
            <header className="section__head">
              <h2 className="section__title">Background</h2>
            </header>
            <WorkList projects={background} />
          </section>
        )}

        <ContactSection settings={settingsMeta} />
      </main>

      <SiteFooter settings={settingsMeta} />
    </>
  )
}

type ProofItem = {
  _key: string
  title: string | null
  detail: string | null
  url: string | null
  slug: string | null
  logo: Parameters<typeof Logo>[0]['image']
}

function Proof({items}: {items: ProofItem[]}) {
  return (
    <div className="service__proof">
      <ul>
        {items.map((p) => {
          const href = p.slug ? `/work/${p.slug}` : p.url
          const inner = (
            <>
              <span className="proof__title">
                <Logo image={p.logo} className="proof__logo" pixels={36} />
                {p.title}
              </span>
              {href && (
                <span className="proof__arrow">
                  <Arrow />
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
