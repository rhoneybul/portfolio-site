import type {Metadata} from 'next'
import {Gloock, Inter_Tight} from 'next/font/google'
import {SanityLive} from '@/sanity/live'
import {sanityFetch} from '@/sanity/live'
import {SETTINGS_QUERY} from '@/sanity/queries'
import './globals.css'

const sans = Inter_Tight({subsets: ['latin'], variable: '--font-sans'})
const display = Gloock({subsets: ['latin'], weight: '400', variable: '--font-display'})

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
    <html lang="en-GB" className={`${sans.variable} ${display.variable}`}>
      <body id="top">
        {children}
        <SanityLive />
      </body>
    </html>
  )
}
