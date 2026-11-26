import type {Metadata} from 'next'
import {notFound} from 'next/navigation'
import {DM_Sans, Space_Grotesk} from 'next/font/google'
import {getSettings} from '@/sanity/settings'
import {TopBar} from '@/components/top-bar'
import {SiteFooter} from '@/components/site-footer'
import {Showcase} from '@/components/showcase'
import {CopyButton} from '@/components/copy-button'
import {QUESTIONS, SECTIONS, asked, resolveOptions} from '@/app-builder/options'
import {briefOf, prototypeUrlOf, readSubmission} from '@/app-builder/submissions'
import {siteUrl} from '@/site-url'
import {keyedUrl} from '@/app-builder/owner'
import {startOn, startedFor} from '@/app-builder/claude-session'
import {fromCommand} from '@/app-builder/prompt'

// A submission is the owner's: behind their password (src/proxy.ts), never indexed, never cached.
export const dynamic = 'force-dynamic'
export const metadata: Metadata = {title: 'App builder submission', robots: {index: false, follow: false}}

const display = Space_Grotesk({subsets: ['latin'], weight: ['500', '600'], variable: '--x-display'})
const text = DM_Sans({subsets: ['latin'], weight: ['400', '500', '600'], variable: '--x-text'})
const when = new Intl.DateTimeFormat('en-GB', {dateStyle: 'medium', timeStyle: 'short', timeZone: 'Europe/London'})

export default async function SubmissionPage({params, searchParams}: {
  params: Promise<{id: string}>
  searchParams: Promise<{start?: string}>
}) {
  const [{id}, {start}] = await Promise.all([params, searchParams])
  const [s, settings] = await Promise.all([readSubmission(id), getSettings()])
  if (!s) notFound()
  const started = await startedFor(s)
  const {options} = resolveOptions(s.answers)
  const brief = await briefOf(s)
  const prototype = prototypeUrlOf(s)
  // Claude can't type the password: the link it reads is keyed to the brief alone.
  const briefUrl = await keyedUrl(`${siteUrl}/app-builder/submissions/${id}/brief`)
  const ask = `Read ${briefUrl} and build this app with fohm-scaffold, following its new-app skill.`
  const create = fromCommand(await keyedUrl(`${siteUrl}/app-builder/submissions/${id}/brief.json`))
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
            {startOn() ? (
              <form className="submission__start" method="post" action={`/app-builder/submissions/${id}/start`}>
                <p>
                  Starts a Claude Code session on fohm-scaffold with this brief, their answers and the prototype. It asks the owner only what the
                  builder left open, then researches, prototypes in Claude Design and, once the owner approves, makes the app with{' '}
                  <code>new --from</code>.
                </p>
                {started && (
                  <p>
                    Started {when.format(new Date(started.at))}: <a href={started.url}>open the session</a>.
                  </p>
                )}
                {start === 'failed' && <p className="submission__error">It didn&apos;t start. Slack has the reason.</p>}
                <button type="submit" className="btn btn-primary">
                  {started ? 'Start another session' : 'Start in Claude'}
                </button>
              </form>
            ) : (
              <p className="submission__note">
                Start in Claude is off: set <code>CLAUDE_BUILD_FIRE_URL</code> and <code>CLAUDE_BUILD_TOKEN</code> (README, Start in Claude). Until then, by hand:
              </p>
            )}
            <ol className="submission__steps">
              <li>
                Clone the scaffold and open Claude Code in it, so its skills load:
                <code>git clone https://github.com/rhoneybul/fohm-scaffold && cd fohm-scaffold && claude</code>
              </li>
              <li>
                Give it this:
                <code>{ask}</code>
                <CopyButton text={ask} label="Copy the instruction" />
              </li>
              <li>
                Once the owner approves the prototype, this makes the app with every answer, and keeps the brief as <code>docs/BRIEF.md</code>:
                <code>{create}</code>
                <CopyButton text={create} label="Copy the command" />
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
            {prototype ? (
              <>
                <p>
                  The prototype Claude drew from their answers: <a href={prototype}>on a phone</a> · <a href={`${prototype}?view=laptop`}>their dashboard</a>.
                </p>
                <div className="submission__prototype">
                  <iframe src={prototype} title={`${options.name} on a phone`} sandbox="allow-scripts" className="submission__phone" />
                  <iframe src={`${prototype}?view=laptop`} title={`${options.name}: the dashboard`} sandbox="allow-scripts" className="submission__laptop" />
                </div>
              </>
            ) : (
              <Showcase o={options} gallery={[]} />
            )}
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
