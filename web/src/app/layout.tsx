import {siteUrl} from '@/site-url'
import type {Metadata} from 'next'
import {DM_Sans} from 'next/font/google'
import {SanityLive} from '@/sanity/live'
import {sanityFetch} from '@/sanity/live'
import {SETTINGS_QUERY} from '@/sanity/queries'
import {BRAND} from '@/brand'
import './globals.css'

// One family, the logo's: DM Sans, variable in weight and optical size
const sans = DM_Sans({subsets: ['latin'], variable: '--font-sans', axes: ['opsz']})

export async function generateMetadata(): Promise<Metadata> {
  const {data: settings} = await sanityFetch({query: SETTINGS_QUERY, stega: false})
  const title = settings?.seo?.title || BRAND
  const description = settings?.seo?.description || undefined
  return {
    metadataBase: new URL(siteUrl),
    title: {default: title, template: `%s · ${BRAND}`},
    applicationName: BRAND,
    description,
    openGraph: {title, description, type: 'website', siteName: BRAND},
    twitter: {card: 'summary_large_image', title, description},
  }
}

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en-GB" className={sans.variable}>
      <body id="top">
        {children}
        <SanityLive />
      </body>
    </html>
  )
}
