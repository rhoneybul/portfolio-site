import type {Metadata} from 'next'
import {Instrument_Serif, Inter_Tight, JetBrains_Mono} from 'next/font/google'
import {SanityLive} from '@/sanity/live'
import {sanityFetch} from '@/sanity/live'
import {SETTINGS_QUERY} from '@/sanity/queries'
import './globals.css'

const sans = Inter_Tight({subsets: ['latin'], variable: '--font-sans'})
const serif = Instrument_Serif({subsets: ['latin'], weight: '400', style: ['normal', 'italic'], variable: '--font-serif'})
const mono = JetBrains_Mono({subsets: ['latin'], variable: '--font-mono'})

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

export async function generateMetadata(): Promise<Metadata> {
  const {data: settings} = await sanityFetch({query: SETTINGS_QUERY, stega: false})
  const title = settings?.seo?.title || settings?.name || 'Rob Honeybul'
  const description = settings?.seo?.description || undefined
  const image = settings?.portraitUrl ? `${settings.portraitUrl}?w=1200&h=630&fit=crop` : undefined
  return {
    metadataBase: new URL(siteUrl),
    title: {default: title, template: `%s · ${settings?.name ?? 'Rob Honeybul'}`},
    description,
    openGraph: {title, description, type: 'website', images: image ? [image] : undefined},
    twitter: {card: 'summary_large_image', title, description},
  }
}

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en-GB" className={`${sans.variable} ${serif.variable} ${mono.variable}`}>
      <body>
        {children}
        <SanityLive />
      </body>
    </html>
  )
}
