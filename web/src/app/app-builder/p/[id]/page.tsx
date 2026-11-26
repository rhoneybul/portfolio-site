import type {Metadata} from 'next'
import {notFound} from 'next/navigation'
import {DM_Sans, Space_Grotesk} from 'next/font/google'
import {getSettings} from '@/sanity/settings'
import {TopBar} from '@/components/top-bar'
import {SiteFooter} from '@/components/site-footer'
import {SharedApp} from '@/components/shared-app'
import {readShare} from '@/app-builder/mcp-build'
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
      built={saved ? {id: saved.job.id, look: saved.job.look, plan: saved.job.plan, units: saved.units} : null}
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
