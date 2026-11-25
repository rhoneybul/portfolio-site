import type {Metadata} from 'next'
import {DM_Sans, Space_Grotesk} from 'next/font/google'
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

// The house style's two faces (fohm-scaffold's template: src/lib/fonts.ts), for the prototype.
const display = Space_Grotesk({subsets: ['latin'], weight: ['500', '600'], variable: '--x-display'})
const text = DM_Sans({subsets: ['latin'], weight: ['400', '500', '600'], variable: '--x-text'})

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
              Answer what we ask before building any app, and see yours: its landing page, onboarding, the screens your
              customers use and your dashboard, in your name, words and colour. Then take a brief with every answer in it
              straight into Claude. The same foundations as Etapa and Naz.
            </p>
          </div>
          <AppBuilder whatsapp={settings?.whatsapp} className={`${display.variable} ${text.variable}`} />
        </section>
        <ContactSection settings={settings} />
      </main>
      <SiteFooter settings={settings} />
    </>
  )
}
