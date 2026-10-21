import type {Metadata} from 'next'
import Image from 'next/image'
import Link from 'next/link'
import {notFound} from 'next/navigation'
import {client} from '@/sanity/client'
import {sanityFetch} from '@/sanity/live'
import {POST_QUERY, POST_SLUGS_QUERY} from '@/sanity/queries'
import {getSettings} from '@/sanity/settings'
import {urlFor} from '@/sanity/image'
import {TopBar} from '@/components/top-bar'
import {SiteFooter} from '@/components/site-footer'
import {ContactSection} from '@/components/contact-section'
import {RichText} from '@/components/rich-text'

type Props = {params: Promise<{slug: string}>}

const dateFormat = new Intl.DateTimeFormat('en-GB', {day: 'numeric', month: 'long', year: 'numeric'})

export async function generateStaticParams() {
  return client.withConfig({useCdn: false}).fetch(POST_SLUGS_QUERY)
}

export async function generateMetadata({params}: Props): Promise<Metadata> {
  const {data: post} = await sanityFetch({query: POST_QUERY, params: await params, stega: false})
  if (!post) return {}
  return {title: post.title ?? undefined, description: post.excerpt ?? undefined}
}

export default async function PostPage({params}: Props) {
  const [{data: post}, settings] = await Promise.all([
    sanityFetch({query: POST_QUERY, params: await params}),
    getSettings(),
  ])
  if (!post) notFound()

  return (
    <>
      <TopBar settings={settings} active="blog" />
      <main>
        <article className="case post">
          <Link href="/blog" className="label back">
            ←︎ All posts
          </Link>
          <h1 className="post__title">{post.title}</h1>
          <div className="case__intro">
            <p className="case__summary">{post.excerpt}</p>
            <dl className="case__meta">
              <div>
                <dt className="label">Published</dt>
                <dd>{post.publishedAt && dateFormat.format(new Date(post.publishedAt))}</dd>
              </div>
              <div>
                <dt className="label">By</dt>
                <dd>{settings?.name}</dd>
              </div>
            </dl>
          </div>
          {post.coverImage?.asset && (
            <Image
              src={urlFor(post.coverImage).width(1800).height(1000).url()}
              alt={post.coverImage.alt ?? post.title ?? ''}
              width={1800}
              height={1000}
              className="case__cover"
              priority
            />
          )}
          <div className="case__content">
            <div className="case__body">
              <RichText value={post.body} />
            </div>
          </div>
        </article>
        <ContactSection settings={settings} />
      </main>
      <SiteFooter settings={settings} />
    </>
  )
}
