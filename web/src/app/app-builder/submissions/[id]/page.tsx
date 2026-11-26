import type {Metadata} from 'next'
import {notFound} from 'next/navigation'
import {DM_Sans, Space_Grotesk} from 'next/font/google'
import {getSettings} from '@/sanity/settings'
import {TopBar} from '@/components/top-bar'
import {SiteFooter} from '@/components/site-footer'
import {Showcase} from '@/components/showcase'
import {CopyButton} from '@/components/copy-button'
import {QUESTIONS, SECTIONS, asked, resolveOptions} from '@/app-builder/options'
import {briefOf, briefUrl, prototypeUrl, readSubmission} from '@/app-builder/submissions'

// A submission is Fohm's: never indexed, never cached, and only found by the link in Slack.
export const dynamic = 'force-dynamic'
export const metadata: Metadata = {title: 'App builder submission', robots: {index: false, follow: false}}

const display = Space_Grotesk({subsets: ['latin'], weight: ['500', '600'], variable: '--x-display'})
const text = DM_Sans({subsets: ['latin'], weight: ['400', '500', '600'], variable: '--x-text'})
const when = new Intl.DateTimeFormat('en-GB', {dateStyle: 'medium', timeStyle: 'short', timeZone: 'Europe/London'})

export default async function SubmissionPage({params}: {params: Promise<{id: string}>}) {
  const {id} = await params
  const [s, settings] = await Promise.all([readSubmission(id), getSettings()])
  if (!s) notFound()
  const {options} = resolveOptions(s.answers)
  const brief = briefOf(s)
  const markdown = briefUrl(id)
  const prototype = prototypeUrl(id)
  const ask = `Read ${markdown} and build this app with fohm-scaffold, following its new-app skill: start from the answers and the prototype in it, and create the app with its command once I approve the prototype.`
  const label = (key: string, v: string) => QUESTIONS.find((q) => q.key === key)?.choices?.find((c) => c.value === v)?.label ?? v

  return (
    <>
      <TopBar settings={settings} />
      <main>
        <section className="blog submission">
          <span className="label">
            {s.event === 'interest' ? 'A lead' : 'Built in the app builder'} · {when.format(new Date(s.at))}
          </span>
          <h1 className="case__title">{options.name}</h1>
          <div className="submission__who">
            {s.contact ? (
              <p>
                <strong>{s.contact.name || 'No name given'}</strong> · <a href={`mailto:${s.contact.email}`}>{s.contact.email}</a>
                {s.contact.note && <span className="submission__note">“{s.contact.note}”</span>}
              </p>
            ) : null}
            {s.answers.email && (
              <p>
                Email: <a href={`mailto:${s.answers.email}`}>{s.answers.email}</a>
              </p>
            )}
          </div>

          <div className="submission__block">
            <h2 className="manifest__title">Build it with Claude</h2>
            <ol className="submission__steps">
              <li>
                Open Claude Code with fohm-scaffold&apos;s skills (clone it and run <code>claude</code> in it, or have them as account skills):
                <code>git clone https://github.com/rhoneybul/fohm-scaffold && cd fohm-scaffold && claude</code>
              </li>
              <li>
                Give it this. The brief carries their answers, <a href={prototype}>the prototype they tapped through</a> and the command that makes the app, which Claude runs itself once the prototype is approved, then launches it.
                <code>{ask}</code>
                <CopyButton text={ask} label="Copy the prompt" />
              </li>
              <li>
                Or paste the whole brief (below, or <a href={markdown}>as markdown</a>).
              </li>
            </ol>
          </div>

          <div className="submission__block">
            <h2 className="manifest__title">Their answers</h2>
            {SECTIONS.map((section) => {
              const qs = asked(s.answers).filter((q) => q.section === section)
              if (!qs.length) return null
              return (
                <dl key={section} className="submission__answers">
                  <dt className="label">{section}</dt>
                  {qs.map((q) => (
                    <div key={q.key}>
                      <dt>{q.ask}</dt>
                      <dd>{s.answers[q.key] ? label(q.key, s.answers[q.key]) : <em>Not answered</em>}</dd>
                    </div>
                  ))}
                </dl>
              )
            })}
          </div>

          <div className={`submission__block ${display.variable} ${text.variable}`}>
            <h2 className="manifest__title">What they saw</h2>
            <Showcase o={options} gallery={[]} />
          </div>

          <div className="submission__block">
            <h2 className="manifest__title">The brief</h2>
            <CopyButton text={brief} label="Copy the brief" />
            <pre className="brief__text">{brief}</pre>
          </div>
        </section>
      </main>
      <SiteFooter settings={settings} />
    </>
  )
}
