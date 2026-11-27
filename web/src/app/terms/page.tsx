import type {Metadata} from 'next'
import {getSettings} from '@/sanity/settings'
import {TopBar} from '@/components/top-bar'
import {SiteFooter} from '@/components/site-footer'

export const metadata: Metadata = {title: 'Terms', description: 'The terms for using the Fohm App Builder, on this site and in AI assistants.'}

const SECTIONS: [string, string[]][] = [
  ['The service', ['The Fohm App Builder is a free tool from Fohm, Rob Honeybul’s app studio in London. It designs a prototype of an app from your answers, on this site or through its MCP server in AI assistants such as Claude and ChatGPT.']],
  [
    'Using it',
    [
      'Use it for an app you are thinking of building. Don’t use it to break the law, to send anything harmful, or to overload or probe the service.',
      'It is limited to a few prototypes a day for each email, and may be paused or changed at any time.',
    ],
  ],
  [
    'What you get',
    [
      'A prototype is a first look, designed by AI from what you told us: it may be wrong or incomplete, and is not advice of any kind (medical, legal, financial or otherwise).',
      'Your ideas stay yours. You may use your prototype as you like. Photos in it are free-to-use photos from Unsplash (the Unsplash licence) and Wikimedia Commons (open licences), credited where they appear, and keep their own licences.',
      'Building the app for real is a separate agreement with Fohm, if you choose to.',
    ],
  ],
  ['Your information', ['What we keep and why is on the privacy page (/privacy).']],
  ['Liability', ['The builder is provided as it is, without warranties. As far as the law allows, Fohm isn’t liable for any loss from using it. Nothing here limits rights you have by law.']],
  ['Contact', ['Fohm, London. rob@fohm.io. These terms are governed by the law of England and Wales.']],
]

export default async function TermsPage() {
  const settings = await getSettings().catch(() => null)
  return (
    <>
      <TopBar settings={settings} />
      <main>
        <section className="blog">
          <h1 className="case__title">Terms</h1>
          {SECTIONS.map(([title, lines]) => (
            <div key={title} className="blog__soon">
              <span className="label">● {title}</span>
              {lines.map((l) => (
                <p key={l}>{l}</p>
              ))}
            </div>
          ))}
          <div className="blog__soon">
            <p>Last updated 26 November 2026.</p>
          </div>
        </section>
      </main>
      <SiteFooter settings={settings} />
    </>
  )
}
