'use client'

import {useEffect, useRef, useState, type CSSProperties, type ReactNode} from 'react'
import {Arrow} from '@/components/arrow'
import {AppPrototype, Mark, goalsOf, type Pic} from '@/components/app-prototype'
import {AppIcon} from '@/components/app-icon'
import type {Style} from '@/app-builder/prototype-doc'
import {PrototypeFrame} from '@/components/prototype-frame'
import type {Built} from '@/components/prototype-build'
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

/** The services an app runs on, as icons by layer: where people use it, what runs it, and what watches it and tells you. */
const STACK: {layer: string; items: {key: IconKey; name: string; role: string; colour: string}[]}[] = [
  {
    layer: 'Where people use it',
    items: [
      {key: 'web', name: 'The web', role: 'The app and its landing page at your domain', colour: '#3F4A5A'},
      {key: 'apple', name: 'App Store', role: 'The iPhone app, reviewed and listed by Apple', colour: '#0A84FF'},
      {key: 'play', name: 'Google Play', role: 'The Android app, from the same code', colour: '#01875F'},
    ],
  },
  {
    layer: 'What runs it',
    items: [
      {key: 'vercel', name: 'Vercel', role: 'Hosts the web app and its API; deploys each change', colour: '#111111'},
      {key: 'supabase', name: 'Supabase', role: 'The database, sign-in and files, with rules on the server', colour: '#3ECF8E'},
      {key: 'expo', name: 'Expo', role: 'Builds the iPhone and Android apps and ships updates', colour: '#4630EB'},
      {key: 'stripe', name: 'Stripe', role: 'Takes payments for Pro, in your business’s name', colour: '#635BFF'},
    ],
  },
  {
    layer: 'What watches it and tells you',
    items: [
      {key: 'posthog', name: 'PostHog', role: 'What people do: funnels, dashboards, drop-off', colour: '#F54E00'},
      {key: 'sentry', name: 'Sentry', role: 'Errors on the web, the apps and the server', colour: '#7553C7'},
      {key: 'slack', name: 'Slack', role: 'Sign-ups, payments and anything that needs you', colour: '#E01E5A'},
      {key: 'email', name: 'Resend', role: 'Sign-in links, welcome and reminder emails', colour: '#3F4A5A'},
    ],
  },
]

type IconKey = 'web' | 'apple' | 'play' | 'vercel' | 'supabase' | 'expo' | 'stripe' | 'posthog' | 'sentry' | 'slack' | 'email'

/** A simple glyph for each service: drawn here, never the service's own logo. */
const GLYPHS: Record<IconKey, ReactNode> = {
  web: (
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="M4 12h16M12 4c2.5 2.5 2.5 13.5 0 16M12 4c-2.5 2.5-2.5 13.5 0 16" />
    </>
  ),
  apple: (
    <>
      <rect x="7" y="3" width="10" height="18" rx="2.5" />
      <path d="M10.5 18h3" />
    </>
  ),
  play: <path d="M8 5l10 7-10 7z" />,
  vercel: <path d="M12 5l8 14H4z" />,
  supabase: <path d="M13 3L6 13h6l-1 8 7-10h-6z" />,
  expo: <path d="M12 5l7 13H5z M9 15h6" />,
  stripe: (
    <>
      <rect x="4" y="6" width="16" height="12" rx="2" />
      <path d="M4 10h16" />
    </>
  ),
  posthog: <path d="M5 19V11M10 19V7M15 19v-5M20 19V9" />,
  sentry: (
    <>
      <path d="M12 4l9 16H3z" />
      <path d="M12 10v4M12 17v.01" />
    </>
  ),
  slack: <path d="M9 4v16M15 4v16M4 9h16M4 15h16" />,
  email: (
    <>
      <rect x="4" y="6" width="16" height="12" rx="2" />
      <path d="M4 8l8 5 8-5" />
    </>
  ),
}

function Stack() {
  return (
    <div className="panel stack">
      {STACK.map(({layer, items}, i) => (
        <section key={layer} className="stack__layer" aria-label={layer}>
          <p className="panel__title">{layer}</p>
          <ul className="stack__tiles">
            {items.map((t) => (
              <li key={t.name} className="stack__tile" style={{'--x-service': t.colour} as CSSProperties}>
                <span className="stack__icon" aria-hidden>
                  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    {GLYPHS[t.key]}
                  </svg>
                </span>
                <strong>{t.name}</strong>
                <span>{t.role}</span>
              </li>
            ))}
          </ul>
          {i < STACK.length - 1 && <span className="stack__down" aria-hidden />}
        </section>
      ))}
    </div>
  )
}

function Stores({o, pic, icon}: {o: Options; pic: (n: number) => Pic | undefined; icon?: Style['icon']}) {
  return (
    <div className="panel store">
      <div className="store__head">
        <AppIcon name={o.name} accent={o.accent} icon={icon} size={76} />
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

/** With `built`, the app and the dashboard are the prototype Claude drew; without it, the quick sketch. */
export function Showcase({o, gallery, built}: {o: Options; gallery: Pic[]; built?: Built | null}) {
  const parts = Object.fromEntries(whatYouGet(o).map((p) => [p.title, p.items]))
  const photos: Pic[] = [...(o.photo ? [{url: o.photo, credit: o.photoCredit}] : []), ...gallery]
  const pic = (n: number) => (photos.length ? photos[n % photos.length] : undefined)
  const pick = (title: string, n = 4) => (parts[title] ?? []).slice(0, n)

  const landing = built?.units.filter((u) => u.id === 'landing') ?? []
  const slides = [
    {
      name: 'Landing page',
      node: (
        <Slide
          kicker="01 · Your landing page"
          title={`Where people first meet ${o.name}`}
          line="The page that sells the app, at your own domain: your photo, your headline, how it works, and Get started."
          items={pick('The app', 2)}
        >
          {landing.length ? (
            <PrototypeFrame look={built!.look} units={landing} view="phone" title={`${o.name}: the landing page`} />
          ) : (
            <AppPrototype o={o} gallery={gallery} />
          )}
        </Slide>
      ),
    },
    {
      name: 'The app',
      node: (
        <Slide
          kicker="02 · The app"
          title={`${o.name}, on every phone`}
          line={
            built
              ? 'Claude designed every screen from your answers, in the house style Etapa and Naz share. Tap through it, from the landing page on.'
              : 'The landing page, onboarding and the screens people use, in your name and colour. Tap through it.'
          }
          items={[...pick('The app', 3), ...pick('Onboarding', 2)]}
        >
          {built ? <PrototypeFrame look={built.look} units={built.units} view="phone" title={`${o.name} on a phone`} /> : <AppPrototype o={o} gallery={gallery} />}
        </Slide>
      ),
    },
    {
      name: 'Dashboard',
      node: (
        <Slide kicker="03 · Your dashboard" title="Everything people do, in one place" line="Who joined, who’s stuck, who needs a reply, and what they’re working on." items={pick('The dashboard')}>
          {built?.plan.units.some((u) => u.frame === 'laptop') ? (
            <Laptop o={o}>
              <PrototypeFrame look={built.look} units={built.units} view="laptop" title={`${o.name}: your dashboard`} />
            </Laptop>
          ) : (
            <Dashboard o={o} pic={pic} />
          )}
        </Slide>
      ),
    },
    {
      name: 'Alerts',
      node: (
        <Slide kicker="04 · Alerts" title="Know the moment it happens" line="Sign-ups, payments and anything that needs you, straight into Slack, email and push." items={pick('Email, notifications and sharing')}>
          <Slack o={o} />
        </Slide>
      ),
    },
    {
      name: 'Metrics',
      node: (
        <Slide kicker="05 · Metrics" title="See what works" line="PostHog from the web and the apps, with the funnels and dashboards made for you." items={pick('Analytics and consent')}>
          <Funnel o={o} />
        </Slide>
      ),
    },
    {
      name: 'Monitoring',
      node: (
        <Slide kicker="06 · Monitoring" title="Know when something breaks, first" line="Sentry on the web, the apps and the server, a health check, and tests on every deploy." items={pick('Monitoring and errors')}>
          <Monitoring o={o} />
        </Slide>
      ),
    },
    {
      name: 'Payments',
      node: (
        <Slide kicker="07 · Payments" title="Paid for from day one" line="A Pro plan through Stripe on the web, opening in the apps too." items={pick('Payments')}>
          <Payments o={o} />
        </Slide>
      ),
    },
    {
      name: 'Security',
      node: (
        <Slide kicker="08 · Security and privacy" title="Safe by default" line="The rules live on the server, not in the app, and the legal pages come with it." items={[...pick('Backend and data', 2), ...pick('Legal', 2)]}>
          <Security />
        </Slide>
      ),
    },
    {
      name: 'How it runs',
      node: (
        <Slide
          kicker="09 · How it runs"
          title="The services behind it, each with one job"
          line="Each is set up in your business’s name, and each stays off until its key is set."
          items={[
            'Vercel puts every merged change live, on its own',
            'Supabase keeps the data, and the rules on who sees what',
            'Expo builds the store apps and sends updates without a release',
            'PostHog and Sentry show what people do and what breaks',
          ]}
        >
          <Stack />
        </Slide>
      ),
    },
    {
      name: 'The stores',
      node: (
        <Slide kicker="10 · Launch" title="On the web, the App Store and Google Play" line="One codebase, three places, and every step to get there." items={[...pick('Tests, deploys and the stores', 3), ...pick('Launch and handover', 2)]}>
          <Stores o={o} pic={pic} icon={built?.look.style?.icon} />
        </Slide>
      ),
    },
  ]

  const [at, setAt] = useState(0)
  const deck = useRef<HTMLElement>(null)
  const moved = useRef(false)
  const go = (n: number) => {
    moved.current = true
    setAt((n + slides.length) % slides.length)
  }

  // On a phone, a new slide starts in view: its tab scrolled into the row, and the deck's top on screen if it had scrolled away.
  useEffect(() => {
    if (!moved.current) return
    deck.current?.querySelector('.deck__dots .is-on')?.scrollIntoView({block: 'nearest', inline: 'center', behavior: 'smooth'})
    if ((deck.current?.getBoundingClientRect().top ?? 0) < 0) deck.current?.scrollIntoView({block: 'start', behavior: 'smooth'})
  }, [at])

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
      ref={deck}
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
