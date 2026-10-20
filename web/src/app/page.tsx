import Image from 'next/image'
import Link from 'next/link'
import {sanityFetch} from '@/sanity/live'
import {HOME_QUERY} from '@/sanity/queries'
import {getSettings} from '@/sanity/settings'
import {urlFor} from '@/sanity/image'
import {SiteHeader} from '@/components/site-header'
import {SiteFooter} from '@/components/site-footer'
import {ContactSection} from '@/components/contact-section'
import {RichText} from '@/components/rich-text'
import {BookCall} from '@/components/book-call'
import {LocalTime} from '@/components/local-time'

const LEVEL_WIDTH: Record<string, number> = {expert: 95, advanced: 82, proficient: 68}

function Headline({text, accent}: {text: string; accent?: string | null}) {
  if (!accent || !text.includes(accent)) return <>{text}</>
  const [before, after] = text.split(accent)
  return (
    <>
      {before}
      <em>{accent}</em>
      {after}
    </>
  )
}

export default async function HomePage() {
  const [{data}, settingsMeta] = await Promise.all([sanityFetch({query: HOME_QUERY}), getSettings()])
  const {settings, services, projects, experience} = data

  return (
    <div className="shell">
      <SiteHeader settings={settingsMeta} />

      <main>
        {/* Hero */}
        <section className="card hero">
          <div className="hero__text">
            <h1 className="hero__name">{settings?.name}</h1>
            <p className="mono muted">{settings?.role}</p>
            <h2 className="display hero__headline">
              <Headline text={settings?.headline ?? ''} accent={settings?.headlineAccent} />
            </h2>
            <p className="lead">{settings?.intro}</p>
            <div className="hero__actions">
              {settings?.bookingUrl ? (
                <BookCall url={settings.bookingUrl} />
              ) : (
                <a href="#contact" className="btn btn-primary">
                  Start a conversation <span aria-hidden>→</span>
                </a>
              )}
              {settings?.cvUrl && (
                <a href={`${settings.cvUrl}?dl=Rob_Honeybul_CV.pdf`} className="btn btn-ghost">
                  Download CV <span aria-hidden>↓</span>
                </a>
              )}
            </div>
          </div>
          <figure className="hero__portrait">
            {settings?.portrait?.asset && (
              <Image
                src={urlFor(settings.portrait).width(900).height(1100).url()}
                alt={settings.portrait.alt ?? settings.name ?? ''}
                width={900}
                height={1100}
                priority
                sizes="(max-width: 860px) 100vw, 40vw"
              />
            )}
            <figcaption className="mono">
              <span>{settings?.location}</span>
              <span>
                Local time <LocalTime />
              </span>
            </figcaption>
          </figure>
        </section>

        {/* Numbers */}
        {!!settings?.stats?.length && (
          <section className="card stats" aria-label="By the numbers">
            {settings.stats.map((s) => (
              <div key={s._key} className="stat">
                <span className="stat__value">{s.value}</span>
                <span className="muted">{s.label}</span>
              </div>
            ))}
          </section>
        )}

        {/* Services */}
        <section id="services" className="card">
          <SectionIntro label="Services" title="How I can help">
            hands-on technical leadership for founders and teams building with AI.
          </SectionIntro>
          <ol className="services">
            {services.map((service, i) => (
              <li key={service._id} className="service">
                <span className="mono muted service__index">{String(i + 1).padStart(2, '0')}</span>
                <div>
                  <h3 className="service__title">{service.title}</h3>
                  <p className="muted">{service.summary}</p>
                </div>
                <ul className="tags">
                  {service.deliverables?.map((d) => (
                    <li key={d} className="pill">
                      {d}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
        </section>

        {/* Work */}
        <section id="work" className="card">
          <SectionIntro label="Selected work" title="Recent work">
            products I’ve founded, advised and helped ship.
          </SectionIntro>
          <div className="work-grid">
            {projects.map((project, i) => (
              <Link
                key={project._id}
                href={`/work/${project.slug}`}
                className="work-card"
                style={{'--accent': project.accent ?? '#ECEAE3'} as React.CSSProperties}
              >
                {project.coverImage?.asset && (
                  <Image
                    src={urlFor(project.coverImage).width(1200).height(800).url()}
                    alt={project.coverImage.alt ?? project.title ?? ''}
                    width={1200}
                    height={800}
                    className="work-card__image"
                  />
                )}
                <div className="work-card__top mono">
                  <span>{String(i + 1).padStart(2, '0')}</span>
                  <span>{project.period}</span>
                </div>
                <div className="work-card__body">
                  <span className="mono muted">{project.sector}</span>
                  <h3 className="work-card__title">{project.title}</h3>
                  <p>{project.summary}</p>
                  <span className="mono work-card__role">
                    {project.role} <span aria-hidden>→</span>
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Approach */}
        {!!settings?.process?.length && (
          <section className="card">
            <SectionIntro label="Approach" title="How I work">
              close to the people who depend on the system, in tight loops.
            </SectionIntro>
            <ol className="process">
              {settings.process.map((step, i) => (
                <li key={step._key}>
                  <span className="mono muted">{String(i + 1).padStart(2, '0')}</span>
                  <h3>{step.title}</h3>
                  <p className="muted">{step.description}</p>
                </li>
              ))}
            </ol>
          </section>
        )}

        {/* About + Experience */}
        <section id="experience" className="card">
          <div className="about">
            <SectionIntro label="Experience" title="My experience">
              a decade building systems that run at scale and do genuine good.
            </SectionIntro>
            <div className="about__body prose">
              <RichText value={settings?.about} />
            </div>
          </div>
          <ol className="timeline">
            {experience.map((job) => (
              <li key={job._id} className="job">
                <div className="job__meta mono muted">
                  <span>{job.period}</span>
                  <span>{job.location}</span>
                  {job.badge && <span className="badge">{job.badge}</span>}
                </div>
                <div className="job__body">
                  <span className="mono muted">
                    {job.company}
                    {job.descriptor && ` · ${job.descriptor}`}
                  </span>
                  <h3 className="job__role">{job.role}</h3>
                  <div className="prose muted">
                    <RichText value={job.summary} />
                  </div>
                  {!!job.highlights?.length && (
                    <ul className="highlights">
                      {job.highlights.map((h) => (
                        <li key={h} className="muted">
                          {h}
                        </li>
                      ))}
                    </ul>
                  )}
                  {!!job.tags?.length && (
                    <ul className="tags">
                      {job.tags.map((t) => (
                        <li key={t} className="pill mono">
                          {t}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* Toolkit */}
        {!!settings?.skillLevels?.length && (
          <section className="card card-dark">
            <SectionIntro label="Skills" title="My toolkit" dark>
              the languages and infrastructure I reach for to build reliable systems at scale.
            </SectionIntro>
            <div className="skills">
              {settings.skillLevels.map((s) => (
                <div key={s._key} className="skill">
                  <div className="skill__row">
                    <span>{s.name}</span>
                    <span className="mono muted-dark">{s.level}</span>
                  </div>
                  <div className="skill__bar">
                    <span style={{width: `${LEVEL_WIDTH[s.level ?? 'proficient'] ?? 70}%`}} />
                  </div>
                </div>
              ))}
            </div>
            {settings.skillGroups?.map((group) => (
              <div key={group._key} className="skill-group">
                <h3 className="mono muted-dark">{group.title}</h3>
                <ul className="tags">
                  {group.items?.map((item) => (
                    <li key={item} className="pill pill-dark mono">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </section>
        )}

        {/* Education */}
        {!!settings?.education?.length && (
          <section className="card">
            <SectionIntro label="Education" title="My education">
              a foundation in pure mathematics, from differential geometry to chaos theory.
            </SectionIntro>
            {settings.education.map((e) => (
              <div key={e._key} className="job">
                <div className="job__meta mono muted">
                  <span>{e.period}</span>
                </div>
                <div className="job__body">
                  <h3 className="job__role">{e.qualification}</h3>
                  <span className="mono muted">
                    {e.institution}
                    {e.field && ` · ${e.field}`}
                  </span>
                  <p className="muted">{e.description}</p>
                </div>
              </div>
            ))}
          </section>
        )}

        <ContactSection settings={settingsMeta} />
      </main>

      <SiteFooter settings={settingsMeta} />
    </div>
  )
}

function SectionIntro({
  label,
  title,
  children,
  dark,
}: {
  label: string
  title: string
  children: React.ReactNode
  dark?: boolean
}) {
  return (
    <div className="section-intro">
      <span className={`pill ${dark ? 'pill-dark' : ''}`}>{label}</span>
      <p className="section-intro__text">
        <span className="underline">{title}</span> — <span className={dark ? 'muted-dark' : 'muted'}>{children}</span>
      </p>
    </div>
  )
}
