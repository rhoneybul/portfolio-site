import type {Metadata} from 'next'
import {getSettings} from '@/sanity/settings'
import {TopBar} from '@/components/top-bar'
import {SiteFooter} from '@/components/site-footer'

export const metadata: Metadata = {
  title: 'App builder in Claude and ChatGPT',
  description: 'Design a health, fitness or wellness app in Claude or ChatGPT: answer a few questions and Claude draws every screen as a prototype to tap through.',
}

const URL = 'https://www.fohm.io/mcp'

/** The connector's documentation: what directories link to as its docs and support page. */
const SECTIONS: [string, string[]][] = [
  [
    'What it does',
    [
      'Tell Claude or ChatGPT about the app you want: a coaching or training app, a studio, gym or clinic app, a wellbeing or habit app. It asks a few questions, then Claude designs every screen (the landing page, onboarding, home, a session, a goal and your dashboard) in your name, words and colour, in about 4 to 6 minutes.',
      'You tap through the prototype right in the chat, and it has a page of its own to keep and share. If you want it built, send it to Fohm from the chat or that page.',
    ],
  ],
  [
    'Connect it',
    [
      `Claude: Settings → Connectors → Add custom connector, and paste ${URL}. Or find Fohm App Builder in the connectors directory.`,
      `ChatGPT: find Fohm App Builder in the apps directory, or in developer mode add an app with the address ${URL}.`,
      `Claude Code: claude mcp add --transport http fohm-app-builder ${URL}, or /plugin marketplace add rhoneybul/portfolio-site then /plugin install fohm-app-builder@fohm.`,
      'No account or sign-in is needed.',
    ],
  ],
  [
    'Try asking',
    [
      '“Help me design an app for my Pilates studio in Islington.”',
      '“I’m a personal trainer. Mock up an app my clients could use between sessions.”',
      '“Prototype a running app that gets club members ready for the London Marathon.”',
      '“Design a calm, simple app for my breathwork and meditation classes.”',
    ],
  ],
  [
    'The tools',
    [
      'app_builder_questions (read only): the questions to ask before designing.',
      'build_app_prototype: starts the design from your answers and your email, and returns the prototype’s link.',
      'get_app_prototype (read only, used by the prototype view): how far the design has got, and the prototype once it’s done.',
      'contact_fohm: sends your prototype, name, email and note to Fohm, when you ask.',
    ],
  ],
  ['Limits', ['Three prototypes a day for each email. A prototype is a first look designed by AI, not a finished app or advice of any kind.']],
  ['Your data', ['What the builder keeps and why is on the privacy page (/privacy), and the terms are at /terms. It never reads your conversation beyond what you tell it.']],
  ['Support', ['Email rob@fohm.io. Fohm is Rob Honeybul’s app studio in London.']],
]

export default async function AppBuilderMcpPage() {
  const settings = await getSettings().catch(() => null)
  return (
    <>
      <TopBar settings={settings} active="app-builder" />
      <main>
        <section className="blog">
          <h1 className="case__title">App builder in Claude and ChatGPT</h1>
          {SECTIONS.map(([title, lines]) => (
            <div key={title} className="blog__soon">
              <span className="label">● {title}</span>
              {lines.map((l) => (
                <p key={l}>{l}</p>
              ))}
            </div>
          ))}
        </section>
      </main>
      <SiteFooter settings={settings} />
    </>
  )
}
