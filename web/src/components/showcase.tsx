'use client'

import {useState, type CSSProperties, type ReactNode} from 'react'
import {Arrow} from '@/components/arrow'
import {AppPrototype, Mark, goalsOf, type Pic} from '@/components/app-prototype'
import {whatYouGet} from '@/app-builder/manifest'
import {liftedAccent, needsYou, onAccent, soften, type Options} from '@/app-builder/options'

/**
 * The walkthrough after the questions: a short deck of what the visitor's app comes with, each
 * slide a view drawn in their name and colour (the app itself, the owner's dashboard, the Slack
 * alerts, the PostHog metrics, the error monitoring, payments, security, the stores) beside what
 * the scaffold really builds for it (manifest.ts). Arrows, dots or the keyboard move through it.
 */

const PEOPLE = ['Priya Shah', 'Tom Reilly', 'Ana Costa', 'Sam Okafor', 'Leo Marsh']

function Slide({kicker, title, line, items, children}: {kicker: string; title: string; line: string; items: string[]; children: ReactNode}) {
  return (
    <div className="deck__slide">
      <div className="deck__text">
        <span className="label">{kicker}</span>
        <h3 className="deck__title">{title}</h3>
        <p className="deck__line">{line}</p>
        <ul className="highlights">
          {items.map((i) => (
            <li key={i}>{i}</li>
          ))}
        </ul>
      </div>
      <div className="deck__visual">{children}</div>
    </div>
  )
}

function Laptop({o, children}: {o: Options; children: ReactNode}) {
  return (
    <div className="laptop">
      <div className="laptop__bar">
        <span />
        <span />
        <span />
        <em>{o.domain || `${o.slug}.app`}/admin</em>
      </div>
      <div className="laptop__screen">{children}</div>
    </div>
  )
}

function Dashboard({o, pic}: {o: Options; pic: (n: number) => Pic | undefined}) {
  const members = `${o.memberWord}s`
  return (
    <Laptop o={o}>
      <div className="dash x">
        <aside className="dash__side">
          <span className="dash__brand">
            <Mark size={20} tone="white" />
            {o.name}
          </span>
          {['People', 'Activity', 'Programs', 'Settings'].map((n, i) => (
            <span key={n} className={i === 0 ? 'is-on' : undefined}>
              {n}
            </span>
          ))}
        </aside>
        <div className="dash__main">
          <p className="dash__title">People</p>
          <div className="dash__tiles">
            {[
              [`${members.charAt(0).toUpperCase()}${members.slice(1)}`, 'everyone who has joined'],
              ['Active', 'this week'],
              ['On Pro', 'paying'],
              ['Needs you', 'to reply'],
            ].map(([n, l], i) => (
              <div key={n} className={i === 3 ? 'is-needs' : undefined}>
                <strong className="dash__tile-name">{n}</strong>
                <span>{l}</span>
              </div>
            ))}
          </div>
          <div className="dash__table">
            {PEOPLE.slice(0, 4).map((p, i) => (
              <div key={p} className="dash__row">
                <span className="dash__avatar">
                  {pic(i + 3) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={pic(i + 3)!.url} alt="" referrerPolicy="no-referrer" />
                  ) : (
                    p.charAt(0)
                  )}
                </span>
                <span className="dash__name">{p}</span>
                <span className="dash__meta">{['Sent a clip', 'Finished a week', 'Started Pro', 'Joined today'][i]}</span>
                {i === 0 && <span className="dash__badge">Needs you</span>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </Laptop>
  )
}

function Slack({o}: {o: Options}) {
  const msgs: [string, string, string][] = [
    ['New sign-up', `Priya Shah joined ${o.name} on iPhone`, 'just now'],
    ['Pro started', 'Tom Reilly started Pro, yearly', '4 min'],
    [o.kind === 'game' ? 'New best score' : 'Needs a reply', o.kind === 'game' ? 'Ana Costa set a new best score' : 'Priya sent a clip for feedback', '12 min'],
    ['Onboarding', 'Sam Okafor finished onboarding', '1 h'],
  ]
  return (
    <div className="slack">
      <div className="slack__head"># {o.slug}-alerts</div>
      {msgs.map(([t, b, w]) => (
        <div key={t} className="slack__msg">
          <span className="slack__icon">
            <Mark size={22} tone="white" />
          </span>
          <div>
            <p>
              <strong>{o.name}</strong> <em>{w}</em>
            </p>
            <p>
              <b>{t}:</b> {b}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}

function Funnel({o}: {o: Options}) {
  const steps = ['Saw the landing page', 'Signed up', 'Finished onboarding', o.kind === 'game' ? 'Played a round' : 'Did a first session', 'Started Pro']
  return (
    <div className="panel">
      <p className="panel__title">The funnel it tracks, from the first screen to Pro</p>
      <ol className="steps">
        {steps.map((l) => (
          <li key={l}>{l}</li>
        ))}
      </ol>
      <p className="panel__title">Dashboards made for you in PostHog</p>
      <div className="checks">
        {['Onboarding', 'What people skip', 'Who comes back', 'Pro'].map((d) => (
          <span key={d}>
            <i /> {d}
          </span>
        ))}
      </div>
    </div>
  )
}

function Monitoring({o}: {o: Options}) {
  const checks: [string, string][] = [
    ['Database', 'ok'],
    ['Sign-in', 'ok'],
    ['Payments', 'on'],
    ['Email', 'on'],
    ['Push', 'on'],
  ]
  return (
    <div className="panel">
      <p className="panel__title">Errors reported to Sentry</p>
      <div className="issues">
        {['The web app', 'The iPhone and Android apps', 'The server'].map((w) => (
          <div key={w} className="issues__row">
            <span>{w}</span>
            <em>Watched</em>
          </div>
        ))}
      </div>
      <p className="panel__title">{(o.domain || `${o.slug}.app`) + '/api/health'}</p>
      <div className="checks">
        {checks.map(([k, v]) => (
          <span key={k}>
            <i /> {k}: {v}
          </span>
        ))}
      </div>
      <p className="panel__title">After every deploy</p>
      <div className="checks">
        <span>
          <i /> Smoke tests passed on the live site
        </span>
      </div>
    </div>
  )
}

function Payments({o}: {o: Options}) {
  return (
    <div className="panel">
      <div className="plan-card">
        <span className="plan-card__name">
          <Mark size={22} /> {o.name} Pro
        </span>
        <span>Your price, monthly or yearly, with a free trial if you want one</span>
        <span className="plan-card__pill">Start Pro</span>
      </div>
      <div className="issues">
        {['Bought on the web, through Stripe', 'Opens in the iPhone and Android apps', 'Given or taken away from your dashboard'].map((w) => (
          <div key={w} className="issues__row">
            <span>{w}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function Security() {
  const items: [string, string][] = [
    ['Access rules on the server', 'Each person reads and writes only their own; coaches see only theirs'],
    ['Private notes stay private', 'What you write about someone never reaches them'],
    ['Consent first', 'A cookie banner, and analytics that never carry names or anything typed'],
    ['Delete my account', 'Removes their data, and forgets them in analytics'],
    ['Keys never in the chat', 'Every integration is off until its key is set in the host'],
  ]
  return (
    <div className="panel shields">
      {items.map(([t, l]) => (
        <div key={t}>
          <span className="shields__tick" aria-hidden>
            ✓
          </span>
          <p>
            <strong>{t}</strong>
            <span>{l}</span>
          </p>
        </div>
      ))}
    </div>
  )
}

function Stores({o, pic}: {o: Options; pic: (n: number) => Pic | undefined}) {
  return (
    <div className="panel store">
      <div className="store__head">
        <span className="store__icon">
          <Mark size={44} tone="white" />
        </span>
        <div>
          <strong>{o.name}</strong>
          <span>{o.tagline}</span>
          <span className="store__get">Get</span>
        </div>
      </div>
      <div className="store__shots">
        {[0, 1, 2].map((i) => (
          <span key={i}>
            {pic(i) ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={pic(i)!.url} alt="" referrerPolicy="no-referrer" />
            ) : null}
            <em>{['Start where you are', goalsOf(o)[0] || 'Your goal', 'Every week, a little further'][i]}</em>
          </span>
        ))}
      </div>
      <div className="store__where">
        <span>The web</span>
        <span>App Store</span>
        <span>Google Play</span>
      </div>
    </div>
  )
}

export function Showcase({o, gallery}: {o: Options; gallery: Pic[]}) {
  const parts = Object.fromEntries(whatYouGet(o).map((p) => [p.title, p.items]))
  const photos: Pic[] = [...(o.photo ? [{url: o.photo, credit: o.photoCredit}] : []), ...gallery]
  const pic = (n: number) => (photos.length ? photos[n % photos.length] : undefined)
  const pick = (title: string, n = 4) => (parts[title] ?? []).slice(0, n)

  const slides = [
    {
      name: 'The app',
      node: (
        <Slide kicker="01 · The app" title={`${o.name}, on every phone`} line="The landing page, onboarding and the screens people use, in your name and colour. Tap through it." items={[...pick('The app', 3), ...pick('Onboarding', 2)]}>
          <AppPrototype o={o} gallery={gallery} />
        </Slide>
      ),
    },
    {
      name: 'Dashboard',
      node: (
        <Slide kicker="02 · Your dashboard" title="Everything people do, in one place" line="Who joined, who’s stuck, who needs a reply, and what they’re working on." items={pick('The dashboard')}>
          <Dashboard o={o} pic={pic} />
        </Slide>
      ),
    },
    {
      name: 'Alerts',
      node: (
        <Slide kicker="03 · Alerts" title="Know the moment it happens" line="Sign-ups, payments and anything that needs you, straight into Slack, email and push." items={pick('Email, notifications and sharing')}>
          <Slack o={o} />
        </Slide>
      ),
    },
    {
      name: 'Metrics',
      node: (
        <Slide kicker="04 · Metrics" title="See what works" line="PostHog from the web and the apps, with the funnels and dashboards made for you." items={pick('Analytics and consent')}>
          <Funnel o={o} />
        </Slide>
      ),
    },
    {
      name: 'Monitoring',
      node: (
        <Slide kicker="05 · Monitoring" title="Know when something breaks, first" line="Sentry on the web, the apps and the server, a health check, and tests on every deploy." items={pick('Monitoring and errors')}>
          <Monitoring o={o} />
        </Slide>
      ),
    },
    {
      name: 'Payments',
      node: (
        <Slide kicker="06 · Payments" title="Paid for from day one" line="A Pro plan through Stripe on the web, opening in the apps too." items={pick('Payments')}>
          <Payments o={o} />
        </Slide>
      ),
    },
    {
      name: 'Security',
      node: (
        <Slide kicker="07 · Security and privacy" title="Safe by default" line="The rules live on the server, not in the app, and the legal pages come with it." items={[...pick('Backend and data', 2), ...pick('Legal', 2)]}>
          <Security />
        </Slide>
      ),
    },
    {
      name: 'The stores',
      node: (
        <Slide kicker="08 · Launch" title="On the web, the App Store and Google Play" line="One codebase, three places, and every step to get there." items={[...pick('Tests, deploys and the stores', 3), ...pick('Launch and handover', 2)]}>
          <Stores o={o} pic={pic} />
        </Slide>
      ),
    },
  ]

  const [at, setAt] = useState(0)
  const go = (n: number) => setAt((n + slides.length) % slides.length)

  const vars = {
    '--x-accent': o.accent,
    '--x-on-accent': onAccent(o.accent),
    '--x-accent-soft': soften(o.accent),
    '--x-dash-accent': liftedAccent(o.accent),
    '--x-on-dash': onAccent(liftedAccent(o.accent)),
    '--x-needs-you': needsYou(o.accent),
  } as CSSProperties

  return (
    <section
      className="deck"
      style={vars}
      aria-roledescription="carousel"
      aria-label={`What ${o.name} comes with`}
      onKeyDown={(e) => {
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
        if (e.key === 'ArrowRight') go(at + 1)
        if (e.key === 'ArrowLeft') go(at - 1)
      }}
    >
      <nav className="deck__dots" aria-label="Slides">
        {slides.map((s, i) => (
          <button key={s.name} type="button" className={i === at ? 'is-on' : undefined} aria-current={i === at} onClick={() => go(i)}>
            {s.name}
          </button>
        ))}
      </nav>
      <div className="deck__stage" aria-live="polite">
        {slides[at].node}
      </div>
      <div className="deck__nav">
        <button type="button" className="text-btn" onClick={() => go(at - 1)}>
          Back
        </button>
        <span className="deck__count">
          {String(at + 1).padStart(2, '0')} / {String(slides.length).padStart(2, '0')}
        </span>
        <button type="button" className="btn btn-primary" onClick={() => (at === slides.length - 1 ? document.getElementById('interest')?.scrollIntoView({behavior: 'smooth'}) : go(at + 1))}>
          {at === slides.length - 1 ? 'Build it with me' : 'Next'} <Arrow />
        </button>
      </div>
    </section>
  )
}
