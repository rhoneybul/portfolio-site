import Image from 'next/image'
import Link from 'next/link'
import {Fragment} from 'react'
import {sanityFetch} from '@/sanity/live'
import {HOME_QUERY} from '@/sanity/queries'
import {getSettings} from '@/sanity/settings'
import {urlFor} from '@/sanity/image'
import {TopBar} from '@/components/top-bar'
import {SiteFooter} from '@/components/site-footer'
import {ContactSection} from '@/components/contact-section'
import {RichText} from '@/components/rich-text'
import {BookCall} from '@/components/book-call'
import {Marquee} from '@/components/marquee'
import {ScrollBadge} from '@/components/scroll-badge'
import {SocialIcon} from '@/components/icons'
import {ToolIcon, brandColor} from '@/components/tool-icon'

const TOOL_CATEGORIES = [
  {value: 'ai', title: 'AI'},
  {value: 'build', title: 'Build & ship'},
  {value: 'cloud', title: 'Cloud & data'},
  {value: 'product', title: 'Product & team'},
]

// Lower-case a leading word for mid-sentence use, but keep acronyms like "AI".
function sentenceCase(text?: string | null) {
  if (!text) return ''
  return /^[A-Z][a-z]/.test(text) ? text[0].toLowerCase() + text.slice(1) : text
}

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
  const {settings, services, projects, experience, certifications} = data
  const surname = settings?.name?.split(' ').slice(-1)[0] ?? 'Honeybul'
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
          <h1 className="wordmark" aria-label={settings?.name ?? undefined}>
            {surname}
          </h1>
          <Marquee items={[settings?.role ?? '', settings?.role ?? '']} className="marquee-role" />
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
            <p className="intro__lead">
              {settings?.intro}{' '}
              {!!services.length && (
                <>
                  I can help you with{' '}
                  {services.map((s, i) => (
                    <Fragment key={s._id}>
                      <a href="#services">{sentenceCase(s.title)}</a>
                      {i < services.length - 2 ? ', ' : i === services.length - 2 ? ' and ' : '. '}
                    </Fragment>
                  ))}
                  <a href="#contact">How can I help you?</a>
                </>
              )}
            </p>
            <div className="intro__actions">
              {settings?.bookingUrl ? (
                <BookCall url={settings.bookingUrl} label="Book a call" />
              ) : (
                <a href="#contact" className="btn btn-primary">
                  Get in touch <span aria-hidden>↗</span>
                </a>
              )}
              {settings?.cvUrl && (
                <a href={`${settings.cvUrl}?dl=Rob_Honeybul_CV.pdf`} className="text-btn">
                  Download CV <span aria-hidden>↓</span>
                </a>
              )}
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
              ?.filter((t) => t.featured)
              .slice(0, 4)
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

        {/* Services */}
        <section id="services" className="section">
          <header className="section__head">
            <span className="label">● Services</span>
            <h2 className="section__title">What I do</h2>
          </header>
          <ol className="services">
            {services.map((service, i) => (
              <li key={service._id} className="service">
                <span className="service__index">{String(i + 1).padStart(2, '0')}</span>
                <h3 className="service__title">{service.title}</h3>
                <div className="service__body">
                  <p>{service.summary}</p>
                  <p className="service__deliverables">{service.deliverables?.join(', ')}</p>
                </div>
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

        {/* About + Experience */}
        <section id="experience" className="section">
          <header className="section__head">
            <span className="label">● Experience</span>
            <h2 className="section__title">About</h2>
          </header>
          <div className="about">
            <div className="about__body">
              <RichText value={settings?.about} />
            </div>
          </div>
          <ol className="timeline">
            {experience.map((job) => (
              <li key={job._id} className="job">
                <div className="job__meta">
                  <span>{job.period}</span>
                  <span>{job.location}</span>
                  {job.badge && <span className="job__badge">{job.badge}</span>}
                </div>
                <div className="job__body">
                  <span className="job__company">
                    {job.company}
                    {job.descriptor && ` · ${job.descriptor}`}
                  </span>
                  <h3 className="job__role">{job.role}</h3>
                  <div className="job__summary">
                    <RichText value={job.summary} />
                  </div>
                  {!!job.highlights?.length && (
                    <ul className="highlights">
                      {job.highlights.map((h) => (
                        <li key={h}>{h}</li>
                      ))}
                    </ul>
                  )}
                  {!!job.tags?.length && <p className="job__tags">{job.tags.join(', ')}</p>}
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* Certifications */}
        {!!certifications.length && (
          <section id="certifications" className="section">
            <header className="section__head">
              <span className="label">● Certifications</span>
              <h2 className="section__title">Certified</h2>
            </header>
            <ul className="certs">
              {certifications.map((cert) => {
                const href = cert.credentialUrl ?? cert.certificateUrl
                return (
                  <li key={cert._id} className="cert">
                    {cert.image?.asset && (
                      <a href={href ?? undefined} target="_blank" rel="noreferrer" className="cert__image">
                        <Image
                          src={urlFor(cert.image).width(1000).url()}
                          alt={cert.image.alt ?? cert.title ?? ''}
                          width={1000}
                          height={707}
                          sizes="(max-width: 900px) 90vw, 40vw"
                        />
                      </a>
                    )}
                    <div className="cert__body">
                      <span className="label">
                        {cert.issuer}
                        {cert.accreditation && ` · ${cert.accreditation}`}
                        {cert.issued && ` · ${new Date(cert.issued).getFullYear()}`}
                      </span>
                      <h3 className="cert__title">{cert.title}</h3>
                      {cert.description && <p>{cert.description}</p>}
                      {href && (
                        <a href={href} target="_blank" rel="noreferrer" className="text-btn">
                          {cert.credentialUrl ? 'Verify certificate' : 'View certificate'} <span aria-hidden>↗</span>
                        </a>
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>
          </section>
        )}

        {/* Toolkit + Education */}
        <section className="section toolkit">
          <header className="section__head">
            <span className="label">● Toolkit</span>
            <h2 className="section__title">Skills</h2>
          </header>
          <div className="toolkit__grid">
            {settings?.skillLevels?.map((s) => (
              <div key={s._key} className="skill">
                <span>{s.name}</span>
                <span className="skill__level">{s.level}</span>
              </div>
            ))}
          </div>
          {!!settings?.tools?.length && (
            <div className="tools">
              {TOOL_CATEGORIES.map((cat) => {
                const tools = settings.tools?.filter((t) => (t.category ?? 'build') === cat.value) ?? []
                if (!tools.length) return null
                return (
                  <div key={cat.value} className="tools__group">
                    <h3 className="label">{cat.title}</h3>
                    <ul className="tools__grid">
                      {tools.map((tool) => (
                        <li
                          key={tool._key}
                          className="tool"
                          style={{'--brand': brandColor(tool.icon) ?? 'var(--accent)'} as React.CSSProperties}
                        >
                          <ToolIcon name={tool.name ?? ''} slug={tool.icon} />
                          <span>{tool.name}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )
              })}
            </div>
          )}
          <div className="toolkit__groups">
            {settings?.skillGroups?.map((group) => (
              <div key={group._key}>
                <h3 className="label">{group.title}</h3>
                <p>{group.items?.join(', ')}</p>
              </div>
            ))}
            {settings?.education?.map((e) => (
              <div key={e._key}>
                <h3 className="label">Education · {e.period}</h3>
                <p>
                  <strong>{e.qualification}</strong>, {e.institution}. {e.field}. {e.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        <ContactSection settings={settingsMeta} />
      </main>

      <SiteFooter settings={settingsMeta} />
    </>
  )
}
