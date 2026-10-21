import type {Metadata} from 'next'
import Image from 'next/image'
import Link from 'next/link'
import {notFound} from 'next/navigation'
import {client} from '@/sanity/client'
import {sanityFetch} from '@/sanity/live'
import {PROJECT_QUERY, PROJECT_SLUGS_QUERY} from '@/sanity/queries'
import {getSettings} from '@/sanity/settings'
import {urlFor} from '@/sanity/image'
import {TopBar} from '@/components/top-bar'
import {SiteFooter} from '@/components/site-footer'
import {ContactSection} from '@/components/contact-section'
import {RichText} from '@/components/rich-text'
import {Marquee} from '@/components/marquee'

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
    <>
      <TopBar settings={settings} active="work" />
      <main>
        <article className="case">
          <Link href="/#work" className="label back">
            ←︎ All work
          </Link>
          <h1 className="case__title">{project.title}</h1>
          <Marquee items={[project.sector ?? '', project.sector ?? '']} className="marquee-role" />

          <div className="case__intro">
            <p className="case__summary">{project.summary}</p>
            <dl className="case__meta">
              {project.role && (
                <div>
                  <dt className="label">Role</dt>
                  <dd>{project.role}</dd>
                </div>
              )}
              {project.period && (
                <div>
                  <dt className="label">When</dt>
                  <dd>{project.period}</dd>
                </div>
              )}
              {project.url && (
                <div>
                  <dt className="label">Website</dt>
                  <dd>
                    <a href={project.url} target="_blank" rel="noreferrer">
                      {project.url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')} ↗︎
                    </a>
                  </dd>
                </div>
              )}
            </dl>
          </div>

          {project.coverImage?.asset && (
            <Image
              src={urlFor(project.coverImage).width(1800).height(1000).url()}
              alt={project.coverImage.alt ?? project.title ?? ''}
              width={1800}
              height={1000}
              className="case__cover"
              priority
            />
          )}

          <div className="case__content">
            <div className="case__body">
              <RichText value={project.body} />
            </div>
            <aside>
              {!!project.outcomes?.length && (
                <>
                  <h2 className="label">● Outcomes</h2>
                  <ul className="outcomes">
                    {project.outcomes.map((o) => (
                      <li key={o}>{o}</li>
                    ))}
                  </ul>
                </>
              )}
              {!!project.tags?.length && (
                <>
                  <h2 className="label">● Stack</h2>
                  <p>{project.tags.join(', ')}</p>
                </>
              )}
            </aside>
          </div>

          {next?.slug && (
            <Link href={`/work/${next.slug}`} className="next-project">
              <span className="label">Next project</span>
              <span className="next-project__title">{next.title} ↗︎</span>
            </Link>
          )}
        </article>
        <ContactSection settings={settings} />
      </main>
      <SiteFooter settings={settings} />
    </>
  )
}
