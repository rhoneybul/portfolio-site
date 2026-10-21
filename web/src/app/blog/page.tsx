import type {Metadata} from 'next'
import Link from 'next/link'
import {sanityFetch} from '@/sanity/live'
import {POSTS_QUERY} from '@/sanity/queries'
import {getSettings} from '@/sanity/settings'
import {TopBar} from '@/components/top-bar'
import {SiteFooter} from '@/components/site-footer'
import {ContactSection} from '@/components/contact-section'
import {Marquee} from '@/components/marquee'

export const metadata: Metadata = {title: 'Blog'}

const dateFormat = new Intl.DateTimeFormat('en-GB', {day: 'numeric', month: 'long', year: 'numeric'})

export default async function BlogPage() {
  const [{data: posts}, settings] = await Promise.all([sanityFetch({query: POSTS_QUERY}), getSettings()])

  return (
    <>
      <TopBar settings={settings} active="blog" />
      <main>
        <section className="blog">
          <h1 className="case__title">Blog</h1>
          {posts.length ? (
            <ol className="work-list blog__list">
              {posts.map((post) => (
                <li key={post._id}>
                  <Link href={`/blog/${post.slug}`} className="post-row">
                    <span className="post-row__date">
                      {post.publishedAt && dateFormat.format(new Date(post.publishedAt))}
                    </span>
                    <span className="post-row__title">{post.title}</span>
                    {post.excerpt && <span className="post-row__excerpt">{post.excerpt}</span>}
                  </Link>
                </li>
              ))}
            </ol>
          ) : (
            <>
              <Marquee items={['Coming soon', 'Coming soon', 'Coming soon']} separator="●" className="marquee-role" />
              <div className="blog__soon">
                <span className="label">● Coming soon</span>
                <p>
                  Notes on shipping products fast, using AI to grow what you already have, and building engineering
                  teams from the first hire to Series A.
                </p>
                <Link href="/#contact" className="text-btn">
                  Get in touch in the meantime <span aria-hidden>→︎</span>
                </Link>
              </div>
            </>
          )}
        </section>
        <ContactSection settings={settings} />
      </main>
      <SiteFooter settings={settings} />
    </>
  )
}
