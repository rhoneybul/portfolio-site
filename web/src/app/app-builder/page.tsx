import type {Metadata} from 'next'
import {DM_Sans, Space_Grotesk} from 'next/font/google'
import {getSettings} from '@/sanity/settings'
import {TopBar} from '@/components/top-bar'
import {SiteFooter} from '@/components/site-footer'
import {ContactSection} from '@/components/contact-section'
import {AppBuilder} from '@/components/app-builder'
import {builderSwitch} from '@/app-builder/switch'

export const metadata: Metadata = {
  title: 'App builder',
  description: 'Answer a few questions about your business and tap through a prototype of your app.',
}

// The house style's two faces (fohm-scaffold's template: src/lib/fonts.ts), for the prototype.
const display = Space_Grotesk({subsets: ['latin'], weight: ['500', '600'], variable: '--x-display'})
const text = DM_Sans({subsets: ['latin'], weight: ['400', '500', '600'], variable: '--x-text'})

export default async function AppBuilderPage() {
  const [settings, power] = await Promise.all([getSettings(), builderSwitch()])

  return (
    <>
      <TopBar settings={settings} active="app-builder" />
      <main>
        <section className="blog builder-page">
          <h1 className="sr-only">App builder</h1>
          <AppBuilder
            whatsapp={settings?.whatsapp}
            bookingUrl={settings?.bookingUrl}
            paused={power.paused ? power.message || 'The app builder is paused for now.' : null}
            className={`${display.variable} ${text.variable}`}
          />
        </section>
        <ContactSection settings={settings} />
      </main>
      <SiteFooter settings={settings} />
    </>
  )
}
