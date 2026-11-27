import type {Metadata} from 'next'
import {cookies} from 'next/headers'
import Link from 'next/link'
import {getSettings} from '@/sanity/settings'
import {TopBar} from '@/components/top-bar'
import {SiteFooter} from '@/components/site-footer'
import {AppsSignIn} from '@/components/apps-sign-in'
import {SESSION, appsOf, emailOfSession, privateLinks} from '@/app-builder/visitor'
import {LINK_DAYS} from '@/app-builder/email'

/**
 * "Your apps": every app an email has designed with the builder, once it's signed in (visitor.ts),
 * each with its link and how long it has left. Signed out, the email to send a link to.
 */
export const dynamic = 'force-dynamic'
export const metadata: Metadata = {title: 'Your apps', robots: {index: false, follow: false}}

const daysLeft = (at: string) => Math.ceil((Date.parse(at) + LINK_DAYS * 86_400_000 - Date.now()) / 86_400_000)

export default async function YourAppsPage({searchParams}: {searchParams: Promise<{expired?: string}>}) {
  const [settings, jar, {expired}] = await Promise.all([getSettings().catch(() => null), cookies(), searchParams])
  const email = emailOfSession(jar.get(SESSION)?.value)
  const apps = email ? await appsOf(email) : []

  return (
    <>
      <TopBar settings={settings} active="app-builder" />
      <main>
        <section className="blog">
          <div className="builder your-apps">
            <span className="label">The app builder</span>
            <h1 className="intro__title">Your apps</h1>
            {!privateLinks() ? (
              <p className="intro__lead">Each app’s link opens it from anywhere. Keep the link from the page that designed it.</p>
            ) : !email ? (
              <AppsSignIn
                next="/app-builder/mine"
                lead={
                  expired
                    ? 'That link has run out. Ask for a new one: we’ll email it to the address you designed your apps with.'
                    : 'Your apps open only for the email you designed them with. We’ll email you a link that signs you in on this device.'
                }
              />
            ) : (
              <>
                <p className="intro__lead">
                  Signed in as <strong>{email}</strong>. Each app’s link works for {LINK_DAYS} days from when it was designed.
                </p>
                {apps.length ? (
                  <ul className="your-apps__list">
                    {apps.map((a) => {
                      const left = daysLeft(a.at)
                      return (
                        <li key={a.id}>
                          <strong>{a.name}</strong>
                          <span>{left > 0 ? `${left} day${left === 1 ? '' : 's'} left` : 'Expired'}</span>
                          {left > 0 ? <Link href={`/app-builder/p/${a.id}`}>Open</Link> : <Link href="/app-builder">Design it again</Link>}
                        </li>
                      )
                    })}
                  </ul>
                ) : (
                  <p>No apps yet for this email.</p>
                )}
                <div className="interest__actions">
                  <Link className="btn btn-primary" href="/app-builder">
                    Design another app
                  </Link>
                  <form action="/app-builder/signout" method="post">
                    <button type="submit" className="btn btn-outline">
                      Sign out
                    </button>
                  </form>
                </div>
              </>
            )}
          </div>
        </section>
      </main>
      <SiteFooter settings={settings} />
    </>
  )
}
