import type {Metadata} from 'next'
import {getSettings} from '@/sanity/settings'
import {TopBar} from '@/components/top-bar'
import {SiteFooter} from '@/components/site-footer'

export const metadata: Metadata = {
  title: 'Privacy',
  description: 'What Fohm keeps when you use the app builder, on this site or in Claude, ChatGPT or another AI assistant, and why.',
}

/** What the app builder keeps, on the site and through its MCP server (/mcp). Change it with what the builder stores. */
const SECTIONS: [string, string[]][] = [
  [
    'Who we are',
    ['Fohm is Rob Honeybul’s app studio, in London. This page covers this website and the Fohm App Builder, on this site and as an MCP server used from AI assistants such as Claude and ChatGPT.'],
  ],
  [
    'What the app builder keeps',
    [
      'Your answers about your app (its name, what it does, who it’s for, your business, your colour and the like), and where you’re based if you say.',
      'On this site, your email address, which you give before your app is designed. From an AI assistant, no email: none is asked for.',
      'The prototype designed for you, and the photos chosen for it from Unsplash and Wikimedia Commons.',
      'On this site, if you ask to build it with us: your name, email and any note you add, and a call you book.',
      'From an AI assistant, only what it sends to the builder’s tools: never the rest of your conversation.',
    ],
  ],
  [
    'Why, and who sees it',
    [
      'To design your app, and, on this site, to get in touch about building it if you give your email. Nothing else is sent to your email, and it is never sold or shared for marketing.',
      'Your answers go to Anthropic’s API (Claude), which designs the prototype. Everything is stored privately in Vercel Blob. For a design made on this site, a summary goes to Fohm’s private Slack channel; for one made from an AI assistant, only that one was made. Calls are booked through Cal.com.',
      'Your prototype has a link of its own. Anyone you give it to can see the prototype, but never your email or details.',
    ],
  ],
  ['How long', ['A prototype made from an AI assistant is kept 90 days. Everything else, up to two years from your last contact with us. Either can be deleted sooner if you ask.']],
  [
    'Your rights',
    ['Under UK GDPR you can ask to see, correct or delete what we hold about you, or object to how we use it: email rob@fohm.io. You can also complain to the Information Commissioner’s Office (ico.org.uk).'],
  ],
  [
    'In an AI assistant',
    [
      'The builder’s tools receive only what the assistant sends them: your answers to its questions, and the changes you ask for. They ask for no email, name or other contact details, and pass nothing to Fohm to get in touch. They never read your conversation, the assistant’s memory, your chat history or your files.',
      'It sets no cookies and does no tracking in the assistant. The prototype shown there loads its photos from Unsplash and Wikimedia Commons and its fonts from Google Fonts.',
    ],
  ],
  [
    'Contact',
    ['Fohm, London. Email rob@fohm.io about anything on this page.'],
  ],
]

export default async function PrivacyPage() {
  const settings = await getSettings().catch(() => null)
  return (
    <>
      <TopBar settings={settings} />
      <main>
        <section className="blog">
          <h1 className="case__title">Privacy</h1>
          {SECTIONS.map(([title, lines]) => (
            <div key={title} className="blog__soon">
              <span className="label">● {title}</span>
              {lines.map((l) => (
                <p key={l}>{l}</p>
              ))}
            </div>
          ))}
          <div className="blog__soon">
            <p>Last updated 27 November 2026.</p>
          </div>
        </section>
      </main>
      <SiteFooter settings={settings} />
    </>
  )
}
