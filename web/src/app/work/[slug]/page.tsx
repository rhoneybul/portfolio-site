import type {Metadata} from 'next'
import Image from 'next/image'
import Link from 'next/link'
import {notFound} from 'next/navigation'
import {client} from '@/sanity/client'
import {sanityFetch} from '@/sanity/live'
import {PROJECT_QUERY, PROJECT_SLUGS_QUERY} from '@/sanity/queries'
import {getSettings} from '@/sanity/settings'
import {urlFor} from '@/sanity/image'
import {SiteHeader} from '@/components/site-header'
import {SiteFooter} from '@/components/site-footer'
import {ContactSection} from '@/components/contact-section'
import {RichText} from '@/components/rich-text'

type Props = {params: Promise<{slug: string}>}

export async function generateStaticParams() {
  return client.withConfig({useCdn: false}).fetch(PROJECT_SLUGS_QUERY)
}

export async function generateMetadata({params}: Props): Promise<Metadata> {
  const {data: project} = await sanityFetch({query: PROJECT_QUERY, params: await params, stega: false})
  if (!project) return {}
  return {title: project.title ?? undefined, description: project.summary ?? undefined}
}

export default async function ProjectPage({params}: Props) {
  const [{data: project}, settings] = await Promise.all([
    sanityFetch({query: PROJECT_QUERY, params: await params}),
    getSettings(),
  ])
  if (!project) notFound()

  const next = project.next ?? project.first

  return (
    <div className="shell">
      <SiteHeader settings={settings} />
      <main>
        <article
          className="card case"
          style={{'--accent': project.accent ?? '#ECEAE3'} as React.CSSProperties}
        >
          <Link href="/#work" className="mono muted back">
            ← All work
          </Link>
          <span className="mono muted">{project.sector}</span>
          <h1 className="case__title">{project.title}</h1>
          <p className="lead">{project.summary}</p>

          <dl className="case__meta">
            {project.role && (
              <div>
                <dt className="mono muted">Role</dt>
                <dd>{project.role}</dd>
              </div>
            )}
            {project.period && (
              <div>
                <dt className="mono muted">When</dt>
                <dd>{project.period}</dd>
              </div>
            )}
            {project.url && (
              <div>
                <dt className="mono muted">Website</dt>
                <dd>
                  <a href={project.url} target="_blank" rel="noreferrer">
                    {project.url.replace(/^https?:\/\/(www\.)?/, '')} ↗
                  </a>
                </dd>
              </div>
            )}
          </dl>

          {project.coverImage?.asset ? (
            <Image
              src={urlFor(project.coverImage).width(1800).height(1000).url()}
              alt={project.coverImage.alt ?? project.title ?? ''}
              width={1800}
              height={1000}
              className="case__cover"
              priority
            />
          ) : (
            <div className="case__cover case__cover--blank" aria-hidden>
              <span>{project.title}</span>
            </div>
          )}

          <div className="case__content">
            <div className="prose case__body">
              <RichText value={project.body} />
            </div>
            <aside>
              {!!project.outcomes?.length && (
                <>
                  <h2 className="mono muted">Outcomes</h2>
                  <ul className="outcomes">
                    {project.outcomes.map((o) => (
                      <li key={o}>{o}</li>
                    ))}
                  </ul>
                </>
              )}
              {!!project.tags?.length && (
                <ul className="tags">
                  {project.tags.map((t) => (
                    <li key={t} className="pill mono">
                      {t}
                    </li>
                  ))}
                </ul>
              )}
            </aside>
          </div>

          {next?.slug && (
            <Link href={`/work/${next.slug}`} className="next-project">
              <span className="mono muted">Next project</span>
              <span className="next-project__title">{next.title} →</span>
            </Link>
          )}
        </article>
        <ContactSection settings={settings} />
      </main>
      <SiteFooter settings={settings} />
    </div>
  )
}
