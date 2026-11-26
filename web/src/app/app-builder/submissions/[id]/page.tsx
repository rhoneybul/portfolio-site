import type {Metadata} from 'next'
import {notFound} from 'next/navigation'
import {DM_Sans, Space_Grotesk} from 'next/font/google'
import {getSettings} from '@/sanity/settings'
import {TopBar} from '@/components/top-bar'
import {SiteFooter} from '@/components/site-footer'
import {Showcase} from '@/components/showcase'
import {CopyButton} from '@/components/copy-button'
import {QUESTIONS, SECTIONS, asked, resolveOptions} from '@/app-builder/options'
import {briefJsonUrl, briefOf, briefUrl, readSubmission} from '@/app-builder/submissions'
import {fromCommand} from '@/app-builder/prompt'

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
  const create = fromCommand(briefJsonUrl(id))
  const ask = `Read ${markdown} and build this app with fohm-scaffold, following its new-app skill.`
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
                Make the app in one command, in the folder it should live in: every answer comes from the brief, and the brief is kept in the app as <code>docs/BRIEF.md</code>.
                <code>{create}</code>
                <CopyButton text={create} label="Copy the command" />
              </li>
              <li>
                Open the new folder in Claude Code and run the new-app skill. It reads <code>docs/BRIEF.md</code>, asks only what the builder left open, makes the prototype, and launches it with the app-launch skill.
              </li>
              <li>
                Or, before anything is made (to settle the name first), give Claude this with fohm-scaffold&apos;s skills loaded:
                <code>{ask}</code>
                <CopyButton text={ask} label="Copy the instruction" />
                The brief (below, or <a href={markdown}>as markdown</a>) ends with the same command.
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
