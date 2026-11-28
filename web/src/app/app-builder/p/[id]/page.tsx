import type {Metadata} from 'next'
import {notFound} from 'next/navigation'
import {DM_Sans, Space_Grotesk} from 'next/font/google'
import {getSettings} from '@/sanity/settings'
import {TopBar} from '@/components/top-bar'
import {SiteFooter} from '@/components/site-footer'
import {SharedApp} from '@/components/shared-app'
import {expired, readShare} from '@/app-builder/mcp-build'
import {LINK_DAYS} from '@/app-builder/email'
import {BookCall} from '@/components/book-call'
import {AppsSignIn} from '@/components/apps-sign-in'
import {DEVICE, SESSION, mayOpen} from '@/app-builder/visitor'
import {cookies} from 'next/headers'
import {readPrototype} from '@/app-builder/prototypes'

// An app designed from a chat (the MCP server): building, then the deck. Found only from its link.
export const dynamic = 'force-dynamic'
export const metadata: Metadata = {title: 'Your app', robots: {index: false, follow: false}}

const display = Space_Grotesk({subsets: ['latin'], weight: ['500', '600'], variable: '--x-display'})
const text = DM_Sans({subsets: ['latin'], weight: ['400', '500', '600'], variable: '--x-text'})

export default async function SharedAppPage({params, searchParams}: {params: Promise<{id: string}>; searchParams: Promise<{embed?: string}>}) {
  const [{id}, {embed}] = await Promise.all([params, searchParams])
  const share = await readShare(id)
  if (!share) notFound()
  if (expired(share)) {
    const settings = await getSettings().catch(() => null)
    return (
      <>
        <TopBar settings={settings} active="app-builder" />
        <main>
          <section className="blog">
            <div className="builder link-expired">
              <span className="label">This link has expired</span>
              <h2 className="intro__title">Links to a designed app last {LINK_DAYS} days</h2>
              <p className="intro__lead">
                This one has run out. Design it again in a few minutes, or book a free call and I’ll take you through it, and how to build it for real.
              </p>
              <div className="interest__actions">
                <a className="btn btn-primary" href="/app-builder">
                  Design it again
                </a>
                {settings?.bookingUrl && <BookCall url={settings.bookingUrl} label="Book a free call" variant="outline" from="app-builder-expired" />}
              </div>
            </div>
          </section>
        </main>
        <SiteFooter settings={settings} />
      </>
    )
  }
  const jar = await cookies()
  if (!mayOpen(share, {session: jar.get(SESSION)?.value, device: jar.get(DEVICE)?.value})) {
    const settings = await getSettings().catch(() => null)
    return (
      <>
        <TopBar settings={settings} active="app-builder" />
        <main>
          <section className="blog">
            <div className="builder link-expired">
              <span className="label">A private app</span>
              <h2 className="intro__title">Sign in to open it</h2>
              <AppsSignIn
                next={`/app-builder/p/${share.id}`}
                lead="This app opens only for the email it was designed with. Enter it and we’ll email you a link that signs you in on this device."
              />
            </div>
          </section>
        </main>
        <SiteFooter settings={settings} />
      </>
    )
  }
  const saved = share.status === 'done' && share.prototype ? await readPrototype(share.prototype) : null
  const settings = await getSettings().catch(() => null)
  const app = (
    <SharedApp
      id={share.id}
      answers={share.answers}
      status={share.status === 'done' && !saved ? 'sketch' : share.status}
      parts={share.parts ?? 0}
      drawn={share.drawn?.length ?? 0}
      photos={share.photos.map(({url, credit}) => ({url, credit}))}
      built={saved ? {id: saved.job.id, look: saved.job.look, plan: saved.job.plan, units: saved.units, build: share.id, marks: share.marks ?? []} : null}
      embed={Boolean(embed)}
      whatsapp={settings?.whatsapp}
      bookingUrl={settings?.bookingUrl}
    />
  )
  const fonts = `${display.variable} ${text.variable}`

  if (embed) return <main className={fonts}>{app}</main>
  return (
    <>
      <TopBar settings={settings} active="app-builder" />
      <main>
        <section className={`blog ${fonts}`}>{app}</section>
      </main>
      <SiteFooter settings={settings} />
    </>
  )
}
