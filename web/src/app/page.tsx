import Image from 'next/image'
import Link from 'next/link'
import {sanityFetch} from '@/sanity/live'
import {HOME_QUERY} from '@/sanity/queries'
import {getSettings} from '@/sanity/settings'
import {urlFor} from '@/sanity/image'
import {TopBar} from '@/components/top-bar'
import {BRAND, BRAND_MARK} from '@/brand'
import {SiteFooter} from '@/components/site-footer'
import {ContactSection} from '@/components/contact-section'
import {RichText} from '@/components/rich-text'
import {BookCall} from '@/components/book-call'
import {Marquee} from '@/components/marquee'
import {ScrollBadge} from '@/components/scroll-badge'
import {SocialIcon} from '@/components/icons'
import {ToolIcon, brandColor} from '@/components/tool-icon'

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
  const {settings, services, projects} = data
  const firstName = settings?.name?.split(' ')[0] ?? 'Rob'
  const socials = [
    ...(settings?.socials ?? []).map((s) => ({key: s._key, label: s.label ?? '', url: s.url ?? '#'})),
    ...(settings?.whatsapp ? [{key: 'wa', label: 'WhatsApp', url: `https://wa.me/${settings.whatsapp}`}] : []),
  ]

  return (
    <>
      <TopBar settings={settingsMeta} />

      <main>
        {/* Wordmark hero */}
        <section className="wordmark-hero">
          <h1 className="wordmark" aria-label={BRAND}>
            {BRAND_MARK}
            <span className="charge" aria-hidden />
          </h1>
          <Marquee items={[...services, ...services].map((s) => s.title ?? '')} separator="●" className="marquee-role" />
          <div className="wordmark-hero__foot">
            <a href="#about" className="scroll-down">
              Scroll down
            </a>
            <ScrollBadge />
          </div>
        </section>

        {/* Intro */}
        <section id="about" className="intro">
          <div className="intro__text">
            <span className="hello-tag">
              Hi everyone 👋, I’m {settings?.name}
              <i aria-hidden />
              <i aria-hidden />
              <i aria-hidden />
              <i aria-hidden />
            </span>
            <h2 className="intro__headline">
              <Headline text={settings?.headline ?? ''} accent={settings?.headlineAccent} />
            </h2>
            <p className="intro__lead">{settings?.intro}</p>
            {!!services.length && (
              <ol className="focus-list">
                {services.map((s, i) => (
                  <li key={s._id}>
                    <a href={`#service-${i + 1}`}>
                      <span className="focus-list__index">{String(i + 1).padStart(2, '0')}</span>
                      <span className="focus-list__title">{s.title}</span>
                      <span aria-hidden>↓</span>
                    </a>
                  </li>
                ))}
              </ol>
            )}
            <div className="intro__actions">
              {settings?.bookingUrl ? (
                <BookCall url={settings.bookingUrl} label="Book a call" />
              ) : (
                <a href="#contact" className="btn btn-primary">
                  Get in touch <span aria-hidden>↗</span>
                </a>
              )}
              <Link href="/pricing" className="text-btn">
                See pricing <span aria-hidden>→</span>
              </Link>
            </div>
            {!!socials.length && (
              <div className="find-me">
                <span>Find me on:</span>
                <ul>
                  {socials.map((s) => (
                    <li key={s.key}>
                      <a href={s.url} target="_blank" rel="noreferrer" aria-label={s.label} title={s.label}>
                        <SocialIcon name={s.label} />
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <figure className="portrait">
            <svg className="portrait__swoosh" viewBox="0 0 400 300" aria-hidden>
              <path d="M40 250 L330 110" />
              <path d="M150 280 L370 170" />
            </svg>
            <span className="portrait__squiggle" aria-hidden>
              <svg viewBox="0 0 60 30">
                <path d="M2 26 L18 6 L30 22 L44 4 L58 18" />
              </svg>
            </span>
            {settings?.portrait?.asset && (
              <Image
                src={urlFor(settings.portrait).width(900).height(1100).url()}
                alt={settings.portrait.alt ?? settings.name ?? ''}
                width={900}
                height={1100}
                priority
                sizes="(max-width: 860px) 90vw, 36vw"
              />
            )}
            {settings?.tools
              ?.slice(0, 4)
              .map((tool, i) => (
                <span
                  key={tool._key}
                  className={`badge-float badge-float--${i + 1}`}
                  title={tool.name ?? undefined}
                  style={{'--brand': brandColor(tool.icon) ?? 'var(--accent)'} as React.CSSProperties}
                >
                  <ToolIcon name={tool.name ?? ''} slug={tool.icon} size={24} />
                </span>
              ))}
          </figure>
        </section>

        {/* Services band */}
        {!!services.length && (
          <div className="band" aria-hidden>
            <Marquee items={services.map((s) => s.title ?? '')} separator="✦" className="marquee-band" />
          </div>
        )}

        {/* Services: the three focus areas */}
        <section id="services" className="section">
          <header className="section__head">
            <span className="label">● What I do</span>
            <h2 className="section__title">Three things</h2>
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
                {!!service.proof?.length && (
                  <div className="service__proof">
                    <span className="label">Proof</span>
                    <ul>
                      {service.proof.map((p) => {
                        const href = p.slug ? `/work/${p.slug}` : p.url
                        const inner = (
                          <>
                            <span className="proof__title">
                              {p.title}
                              {href && <span aria-hidden> ↗</span>}
                            </span>
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
                )}
              </li>
            ))}
          </ol>
        </section>

        {/* Statement */}
        <section className="statement">
          <svg className="squiggle squiggle--a" viewBox="0 0 50 60" aria-hidden>
            <path d="M4 4 V22 H24 V40 H44 V56" />
          </svg>
          <svg className="squiggle squiggle--b" viewBox="0 0 70 30" aria-hidden>
            <path d="M2 26 L18 10 L28 22 L44 6 L56 18 L68 8" />
          </svg>
          <svg className="squiggle squiggle--c" viewBox="0 0 70 30" aria-hidden>
            <path d="M2 26 L18 10 L28 22 L44 6 L56 18 L68 8" />
          </svg>
          <svg className="squiggle squiggle--d" viewBox="0 0 50 60" aria-hidden>
            <path d="M4 4 V22 H24 V40 H44 V56" />
          </svg>
          <p className="statement__kicker">I help teams turn hard, real-world problems into</p>
          <p className="statement__big">systems that matter</p>
          <a href="#work" className="statement__link">
            Check out my work <span aria-hidden>›</span>
          </a>
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
        </section>

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
                    ↗
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
