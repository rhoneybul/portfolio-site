import type {Metadata} from 'next'
import {getSettings} from '@/sanity/settings'
import {TopBar} from '@/components/top-bar'
import {SiteFooter} from '@/components/site-footer'
import {ContactSection} from '@/components/contact-section'
import {Marquee} from '@/components/marquee'
import {AppBuilder} from '@/components/app-builder'

export const metadata: Metadata = {
  title: 'App builder',
  description: 'Answer a few questions about your business and tap through a prototype of your app.',
}

export default async function AppBuilderPage() {
  const settings = await getSettings()

  return (
    <>
      <TopBar settings={settings} active="app-builder" />
      <main>
        <section className="blog">
          <h1 className="case__title">App builder</h1>
          <Marquee items={['Early access', 'Early access', 'Early access']} separator="●" className="marquee-role" />
          <div className="blog__soon">
            <span className="label">● Early access</span>
            <p>
              Answer the questions the Fohm app builder asks, and see your app: its landing page, the screens your
              customers use and your dashboard, in your name and colour. The same foundations as Etapa and Naz.
            </p>
          </div>
          <AppBuilder whatsapp={settings?.whatsapp} />
        </section>
        <ContactSection settings={settings} />
      </main>
      <SiteFooter settings={settings} />
    </>
  )
}
