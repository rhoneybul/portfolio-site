'use client'

import {cloneElement, isValidElement, useEffect, useRef, useState, type CSSProperties, type ReactNode} from 'react'
import {Arrow} from '@/components/arrow'
import {AppPrototype, Mark, goalsOf, type Pic} from '@/components/app-prototype'
import {AppIcon} from '@/components/app-icon'
import {BrandLogo, type Brand} from '@/components/brand-logos'
import {openBuild} from '@/components/build-dialog'
import type {Style} from '@/app-builder/prototype-doc'
import {PrototypeFrame, PrototypeThumb} from '@/components/prototype-frame'
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

function Laptop({o, children, path = '/admin'}: {o: Options; children: ReactNode; path?: string}) {
  return (
    <div className="laptop">
      <div className="laptop__bar">
        <span />
        <span />
        <span />
        <em>
          {o.domain || `${o.slug}.app`}
          {path}
        </em>
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

function Slack({o, icon}: {o: Options; icon?: Style['icon']}) {
  const msgs: [string, string, string][] = [
    ['New sign-up', `Priya Shah joined ${o.name} on iPhone`, 'just now'],
    ['Pro started', 'Tom Reilly started Pro, yearly', '4 min'],
    [o.kind === 'game' ? 'New best score' : 'Needs a reply', o.kind === 'game' ? 'Ana Costa set a new best score' : 'Priya sent a clip for feedback', '12 min'],
    ['Onboarding', 'Sam Okafor finished onboarding', '1 h'],
  ]
  return (
    <div className="slack">
      <div className="slack__head">
        <BrandLogo brand="slack" size={18} /> # {o.slug}-alerts
      </div>
      {msgs.map(([t, b, w]) => (
        <div key={t} className="slack__msg">
          <AppIcon name={o.name} accent={o.accent} icon={icon} size={36} />
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

/** The events PostHog takes in, as they would arrive: the names, never made-up counts. */
const LIVE_EVENTS = ['landing_viewed', 'signup_completed', 'onboarding_step_answered', 'onboarding_finished', 'session_started', 'session_finished', 'pro_viewed', 'pro_started']

function Funnel({o}: {o: Options}) {
  const steps = ['Saw the landing page', 'Signed up', 'Finished onboarding', o.kind === 'game' ? 'Played a round' : 'Did a first session', 'Started Pro']
  const [tick, setTick] = useState(0)
  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const t = setInterval(() => setTick((n) => n + 1), 2200)
    return () => clearInterval(t)
  }, [])
  const feed = [0, 1, 2].map((i) => LIVE_EVENTS[(tick + LIVE_EVENTS.length - i) % LIVE_EVENTS.length])
  return (
    <div className="panel">
      <div className="panel__brand">
        <BrandLogo brand="posthog" size={22} />
        <strong>PostHog</strong>
        <span className="live-dot">Live</span>
      </div>
      <ul className="events" aria-label="Events as they arrive">
        {feed.map((e, i) => (
          <li key={`${tick}-${i}`} className={i === 0 ? 'is-new' : undefined}>
            <code>{e}</code>
            <span>{['just now', 'a moment ago', 'a minute ago'][i]}</span>
          </li>
        ))}
      </ul>
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

/**
 * Talking to people from the dashboard: marketing emails and push through Customer.io and Expo, and
 * support, a message in and a reply out, through the dashboard's inbox and Resend. Audiences, never counts.
 */
function Reach({o}: {o: Options}) {
  const members = `${o.memberWord}s`
  const ways: [Brand[], string, string][] = [
    [['customerio'], 'Marketing emails', `A welcome series, a nudge when someone goes quiet, news to every ${o.memberWord}`],
    [['expo', 'customerio'], 'Notifications', 'Push to iPhone and Android: everyone, a group, or a step in a journey'],
    [['resend'], 'Support', `Messages from ${members} land in one inbox; your reply goes by email and push`],
  ]
  return (
    <div className="panel">
      <div className="panel__brand">
        <span className="pay-way__logos">
          {(['customerio', 'resend', 'expo'] as Brand[]).map((b) => (
            <BrandLogo key={b} brand={b} size={22} />
          ))}
        </span>
        <strong>From your dashboard</strong>
      </div>
      <div className="plan-card reach-card">
        <span className="reach-card__kind">Email · Draft</span>
        <span className="plan-card__name">We’ve missed you: here’s what’s new</span>
        <span>To: {members} who haven’t opened {o.name} in a week</span>
        <span className="plan-card__pill" style={{background: o.accent, color: onAccent(o.accent)}}>
          Send
        </span>
      </div>
      <p className="panel__title">One place to reach everyone, and to answer anyone</p>
      <div className="issues">
        {ways.map(([brands, t, l]) => (
          <div key={t} className="issues__row pay-way">
            <span className="pay-way__logos reach__logos">
              {brands.map((b) => (
                <BrandLogo key={b} brand={b} size={20} />
              ))}
            </span>
            <span>
              <strong>{t}</strong>: {l}
            </span>
          </div>
        ))}
      </div>
      <p className="panel__title">Inbox</p>
      <div className="issues">
        <div className="issues__row">
          <span>
            <strong>Priya Shah</strong>: Can I change my goal?
          </span>
          <em>Needs a reply</em>
        </div>
        <div className="issues__row">
          <span>
            <strong>Tom Reilly</strong>: Where do I change my plan?
          </span>
          <em>Answered</em>
        </div>
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
      <div className="panel__brand">
        <BrandLogo brand="sentry" size={22} />
        <strong>Sentry</strong>
        <span className="live-dot">Watching</span>
      </div>
      <p className="panel__title">Every error someone hits, with what they were doing</p>
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

function Payments({o, icon}: {o: Options; icon?: Style['icon']}) {
  const ways: [Brand[], string][] = [
    [['appstore', 'googleplay', 'revenuecat'], 'In the apps: the App Store and Google Play, kept in step by RevenueCat, as in Naz and Etapa'],
    [['stripe'], 'On the web: Stripe, if you sell there too'],
  ]
  return (
    <div className="panel">
      <div className="plan-card">
        <span className="plan-card__name">
          <AppIcon name={o.name} accent={o.accent} icon={icon} size={28} /> {o.name} Pro
        </span>
        <span>Your price, monthly or yearly, with a free trial if you want one</span>
        <span className="plan-card__pill">Start Pro</span>
      </div>
      <p className="panel__title">However your members pay</p>
      <div className="issues">
        {ways.map(([brands, w]) => (
          <div key={w} className="issues__row pay-way">
            <span className="pay-way__logos">
              {brands.map((b) => (
                <BrandLogo key={b} brand={b} size={20} />
              ))}
            </span>
            <span>{w}</span>
          </div>
        ))}
        {['Pro opens wherever they sign in', 'Given or taken away from your dashboard'].map((w) => (
          <div key={w} className="issues__row">
            <span>{w}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function Security() {
  // A service's logo where it does that job (as on Naz and Etapa), else a tick.
  const items: [string, string, Brand?][] = [
    ['Access rules on the server', 'Each person reads and writes only their own; coaches see only theirs', 'supabase'],
    ['Private notes stay private', 'What you write about someone never reaches them'],
    ['Consent first', 'A cookie banner, and analytics that never carry names or anything typed'],
    ['Delete my account', 'Removes their data, and forgets them in analytics'],
    ['Dependencies kept patched', 'Dependabot flags a known flaw in a package and opens the fix', 'dependabot'],
    ['Every change tested first', 'Nothing goes live except through a pull request its tests passed', 'github'],
    ['Keys locked away', 'Kept encrypted in Vercel, never in the code or a chat', 'vercel'],
  ]
  return (
    <div className="panel shields">
      {items.map(([t, l, brand]) => (
        <div key={t}>
          {brand ? (
            <span className="shields__tick shields__tick--brand">
              <BrandLogo brand={brand} size={15} />
            </span>
          ) : (
            <span className="shields__tick" aria-hidden>
              ✓
            </span>
          )}
          <p>
            <strong>{t}</strong>
            <span>{l}</span>
          </p>
        </div>
      ))}
    </div>
  )
}

/**
 * The services an app runs on, by layer: where people use it, what runs it, and what watches it and
 * tells you. Each shows the service's own logo (brand-logos.tsx); the web, which is no one's brand, a globe.
 * Every service another slide names (RevenueCat on Payments, Customer.io on Marketing, GitHub and Dependabot on Security, PostHog, Sentry and Slack on theirs) is here too.
 */
const STACK: {layer: string; items: {logo: Brand | 'web'; name: string; role: string}[]}[] = [
  {
    layer: 'Where people use it',
    items: [
      {logo: 'web', name: 'The web', role: 'The app and its landing page at your domain'},
      {logo: 'appstore', name: 'App Store', role: 'The iPhone app, reviewed and listed by Apple'},
      {logo: 'googleplay', name: 'Google Play', role: 'The Android app, from the same code'},
    ],
  },
  {
    layer: 'What runs it',
    items: [
      {logo: 'vercel', name: 'Vercel', role: 'Hosts the web app and its API; deploys each change'},
      {logo: 'supabase', name: 'Supabase', role: 'The database, sign-in and files, with rules on the server'},
      {logo: 'expo', name: 'Expo', role: 'Builds the iPhone and Android apps and ships updates'},
      {logo: 'revenuecat', name: 'RevenueCat', role: 'Keeps Pro in step across the App Store and Google Play'},
      {logo: 'stripe', name: 'Stripe', role: 'Takes payments for Pro, in your business’s name'},
      {logo: 'github', name: 'GitHub', role: 'Keeps the code; tests each change before it goes live'},
    ],
  },
  {
    layer: 'What watches it and tells you',
    items: [
      {logo: 'posthog', name: 'PostHog', role: 'What people do: funnels, dashboards, drop-off'},
      {logo: 'sentry', name: 'Sentry', role: 'Errors on the web, the apps and the server'},
      {logo: 'slack', name: 'Slack', role: 'Sign-ups, payments and anything that needs you'},
      {logo: 'resend', name: 'Resend', role: 'Sign-in links, welcome and reminder emails'},
      {logo: 'customerio', name: 'Customer.io', role: 'Marketing emails and push campaigns'},
      {logo: 'dependabot', name: 'Dependabot', role: 'Flags a flawed package and opens the fix'},
    ],
  },
]

const GLOBE = (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#3F4A5A" strokeWidth="1.8" strokeLinecap="round" aria-label="The web" role="img">
    <circle cx="12" cy="12" r="8" />
    <path d="M4 12h16M12 4c2.5 2.5 2.5 13.5 0 16M12 4c-2.5 2.5-2.5 13.5 0 16" />
  </svg>
)

function Stack() {
  return (
    <div className="panel stack">
      {STACK.map(({layer, items}, i) => (
        <section key={layer} className="stack__layer" aria-label={layer}>
          <p className="panel__title">{layer}</p>
          <ul className="stack__tiles">
            {items.map((t) => (
              <li key={t.name} className="stack__tile">
                <span className="stack__icon" aria-hidden>
                  {t.logo === 'web' ? GLOBE : <BrandLogo brand={t.logo} size={22} />}
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

type StoreName = 'apple' | 'google'

/** The three screenshots a store listing leads with: the prototype's own phone screens where Claude drew them, else photos. */
function storeShots(o: Options, pic: (n: number) => Pic | undefined, built?: Built | null) {
  const captions = ['Start where you are', goalsOf(o)[0] ? `Train for ${goalsOf(o)[0]}` : 'Your goal, step by step', 'Every week, a little further']
  const phones = built ? built.plan.units.filter((u) => u.frame === 'phone').map((u) => built.units.find((d) => d.id === u.id)).filter((d): d is Built['units'][number] => Boolean(d)) : []
  // Home and the work itself sell an app better than its sign-in: those first, onboarding's opening last.
  const rank = (id: string) => (/home|today/.test(id) ? 0 : /session|program|plan|path|goal|week/.test(id) ? 1 : /onboard|sign|welcome|start/.test(id) ? 3 : 2)
  const best = [...phones].sort((a, b) => rank(a.id) - rank(b.id)).slice(0, 3)
  return captions.map((caption, i) => ({caption, unit: best[i], photo: pic(i)}))
}

/**
 * The app as it will look in each store, a phone's view of its listing: the App Store's (the icon, the
 * name and subtitle, Get, the facts strip, the screenshots with their captions) and Google Play's (the
 * icon beside the name and developer, its facts row, Install, the screenshots, About this app).
 * Nothing invented: a new app has no ratings or downloads yet, so neither store shows any.
 */
function Stores({o, pic, icon, built}: {o: Options; pic: (n: number) => Pic | undefined; icon?: Style['icon']; built?: Built | null}) {
  const [store, setStore] = useState<StoreName>('apple')
  const shots = storeShots(o, pic, built)
  const paid = o.charge !== 'free'
  const category = o.kind === 'game' ? 'Games' : 'Health & Fitness'
  const developer = o.operator || o.name
  const about = o.idea || o.tagline
  const shot = (s: (typeof shots)[number], i: number) => (
    <span key={i} className="store-shot" style={{'--x-accent': o.accent} as CSSProperties}>
      <em>{s.caption}</em>
      <span className="store-shot__phone">
        {s.unit && built ? (
          <PrototypeThumb look={built.look} unit={s.unit} view="phone" />
        ) : s.photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={s.photo.url} alt="" referrerPolicy="no-referrer" />
        ) : null}
      </span>
    </span>
  )
  return (
    <div className="panel stores">
      <div className="stores__tabs" role="tablist" aria-label="Which store">
        {(
          [
            ['apple', 'App Store', 'appstore'],
            ['google', 'Google Play', 'googleplay'],
          ] as const
        ).map(([key, label, brand]) => (
          <button key={key} type="button" role="tab" aria-selected={store === key} className={store === key ? 'is-on' : undefined} onClick={() => setStore(key)}>
            <BrandLogo brand={brand} size={16} /> {label}
          </button>
        ))}
      </div>

      {store === 'apple' ? (
        <div className="store-page store-page--apple" role="tabpanel" aria-label={`${o.name} in the App Store, as it will look`}>
          <span className="store-page__nav">‹ Search</span>
          <div className="store-page__head">
            <AppIcon name={o.name} accent={o.accent} icon={icon} size={96} />
            <div>
              <strong>{o.name}</strong>
              <span>{o.tagline}</span>
              <span className="store-page__get">
                <b>Get</b>
                {paid && <small>In-App Purchases</small>}
              </span>
            </div>
          </div>
          <dl className="store-page__facts">
            <div>
              <dt>Ratings</dt>
              <dd>New</dd>
              <dt className="sub">Not enough yet</dt>
            </div>
            <div>
              <dt>Age</dt>
              <dd>4+</dd>
              <dt className="sub">Years old</dt>
            </div>
            <div>
              <dt>Category</dt>
              <dd className="sm">{category}</dd>
            </div>
            <div>
              <dt>Developer</dt>
              <dd className="sm">{developer}</dd>
            </div>
          </dl>
          <div className="store-page__shots">{shots.map(shot)}</div>
          <p className="store-page__about">{about}</p>
        </div>
      ) : (
        <div className="store-page store-page--google" role="tabpanel" aria-label={`${o.name} on Google Play, as it will look`}>
          <span className="store-page__nav">←</span>
          <div className="store-page__head">
            <AppIcon name={o.name} accent={o.accent} icon={icon} size={72} />
            <div>
              <strong>{o.name}</strong>
              <span className="store-page__dev">{developer}</span>
              <span className="store-page__meta">{paid ? 'In-app purchases' : 'Free'}</span>
            </div>
          </div>
          <dl className="store-page__facts">
            <div>
              <dd>New</dd>
              <dt>No reviews yet</dt>
            </div>
            <div>
              <dd>
                <span className="store-page__rated">3+</span>
              </dd>
              <dt>Rated for 3+</dt>
            </div>
            <div>
              <dd className="sm">{category}</dd>
              <dt>Category</dt>
            </div>
          </dl>
          <span className="store-page__install">Install</span>
          <div className="store-page__shots">{shots.map(shot)}</div>
          <strong className="store-page__h">About this app →</strong>
          <p className="store-page__about">{about}</p>
        </div>
      )}
    </div>
  )
}

/** Moves the deck on a slide, from anywhere on the page (the reveal's "See your landing page"). */
export const nextSlide = () => window.dispatchEvent(new Event('fohm:deck-next'))

/** How much of the deck they've seen, told to the page as it changes (BuildBar waits for the whole tour). */
export interface DeckProgress {
  seen: number
  total: number
}

/** With `built`, the app and the dashboard are the prototype Claude drew; without it, the quick sketch. */
/**
 * The deck, with `intro` (the app's reveal: its icon, name, look and the phone to tap through) as
 * its first slide when given, so the finished app is one deck, not a stage and a deck under it.
 * The reveal's phone is the app, so the deck's own "The app" slide steps aside for it.
 */
export function Showcase({o, gallery, built, intro}: {o: Options; gallery: Pic[]; built?: Built | null; intro?: {name: string; node: ReactNode}}) {
  const parts = Object.fromEntries(whatYouGet(o).map((p) => [p.title, p.items]))
  const lead = gallery.find((g) => g.url === o.photo)
  const photos: Pic[] = [...(o.photo ? [{url: o.photo, credit: o.photoCredit, author: lead?.author, profile: lead?.profile}] : []), ...gallery.filter((g) => g.url !== o.photo)]
  const pic = (n: number) => (photos.length ? photos[n % photos.length] : undefined)
  const pick = (title: string, n = 4) => (parts[title] ?? []).slice(0, n)

  const landing = built?.units.filter((u) => u.id === 'landing') ?? []
  const all = [
    {
      name: 'Landing page',
      node: (
        <Slide
          kicker="01 · Your landing page"
          title={`Where people first meet ${o.name}`}
          line="The first thing people see decides whether they try it: your photo, your promise and how it works, so the right people start, at your own domain."
          items={pick('The app', 2)}
        >
          {landing.length && built!.plan.units[0]?.frame === 'web' ? (
            <Laptop o={o} path="">
              <PrototypeFrame look={built!.look} units={landing} view="web" title={`${o.name}: the landing page`} />
            </Laptop>
          ) : landing.length ? (
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
              ? 'Every screen built around what your members came for, from signing up to reaching their goal. Tap through it as they would, and leave a note on anything you’d change.'
              : 'The landing page, onboarding and the screens people use, in your name and colour. Tap through it.'
          }
          items={[...pick('The app', 3), ...pick('Onboarding', 2)]}
        >
          {built ? <PrototypeFrame look={built.look} units={built.units} view="phone" title={`${o.name} on a phone`} notes /> : <AppPrototype o={o} gallery={gallery} />}
        </Slide>
      ),
    },
    {
      name: 'Dashboard',
      node: (
        <Slide kicker="03 · Your dashboard" title="See who needs you, before they drift away" line="Everything people do, in one place: who joined, who’s stuck and who’s waiting on a reply, so nobody falls through the cracks." items={pick('The dashboard')}>
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
        <Slide kicker="04 · Alerts" title="Reply while it still matters" line="Sign-ups, payments and anything that needs you reach Slack, email and push the moment they happen, so people hear back while they’re still keen." items={pick('Email, notifications and sharing')}>
          <Slack o={o} icon={built?.look.style?.icon} />
        </Slide>
      ),
    },
    {
      name: 'Marketing and support',
      node: (
        <Slide
          kicker="05 · Marketing and support"
          title="Keep people coming back, and never leave one waiting"
          line="Marketing emails, notifications and support, all from your dashboard: welcome people in, bring back the ones who drift, and answer every question in one inbox."
          items={pick('Marketing and support')}
        >
          <Reach o={o} />
        </Slide>
      ),
    },
    {
      name: 'Metrics',
      node: (
        <Slide
          kicker="05 · Metrics"
          title="See what helps people succeed"
          line="PostHog shows the journey people really take: where they get stuck, what they skip and what brings them back, so every change makes the app easier to use."
          items={pick('Analytics and consent')}
        >
          <Funnel o={o} />
        </Slide>
      ),
    },
    {
      name: 'Monitoring',
      node: (
        <Slide
          kicker="06 · Monitoring"
          title="Find what gets in people’s way, and fix it first"
          line="Monitoring is how you know people are succeeding: every error someone hits, on the web, the apps or the server, reaches Sentry with what they were doing, so it’s fixed before most people notice."
          items={pick('Monitoring and errors')}
        >
          <Monitoring o={o} />
        </Slide>
      ),
    },
    {
      name: 'Payments',
      node: (
        <Slide kicker="07 · Payments" title="Paying is easy, so more people stay" line="Pro the way your members already pay: in the apps through the App Store and Google Play, or on the web through Stripe, a tap or two from deciding to start." items={pick('Payments')}>
          <Payments o={o} icon={built?.look.style?.icon} />
        </Slide>
      ),
    },
    {
      name: 'Security',
      node: (
        <Slide kicker="08 · Security and privacy" title="People trust it with what matters to them" line="Each person sees only their own, the rules live on the server, consent comes first and the legal pages come with it, so people feel safe telling it the truth." items={[...pick('Backend and data', 2), ...pick('Legal', 2)]}>
          <Security />
        </Slide>
      ),
    },
    {
      name: 'How it runs',
      node: (
        <Slide
          kicker="09 · How it runs"
          title="Fast and dependable, so it never gets in the way"
          line="Proven services behind it, each with one job and set up in your business’s name: changes go live in minutes and the app stays quick and up, so people keep coming back."
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
        <Slide kicker="10 · Launch" title="Wherever your people already are" line="On the web, the App Store and Google Play from one codebase, so everyone gets the same experience, and every step to get there is taken care of." items={[...pick('Tests, deploys and the stores', 3), ...pick('Launch and handover', 2)]}>
          <Stores o={o} pic={pic} icon={built?.look.style?.icon} built={built} />
        </Slide>
      ),
    },
  ]

  // Numbered as they stand, so the numbers follow whichever slides there are.
  const shown = [...(intro ? [intro] : []), ...all.filter((s) => !(intro && s.name === 'The app'))]
  const slides = shown.map((s, i) =>
    isValidElement<{kicker?: string}>(s.node) && s.node.type === Slide
      ? {...s, node: cloneElement(s.node, {kicker: `${String(i + 1).padStart(2, '0')} · ${(s.node.props.kicker ?? '').replace(/^\d+ · /, '')}`})}
      : s,
  )

  const [at, setAt] = useState(0)
  // The slides they've opened: ticked in the steps, and counted, so nothing is easy to miss.
  const [seen, setSeen] = useState<Set<number>>(() => new Set([0]))
  const deck = useRef<HTMLElement>(null)
  const moved = useRef(false)
  const go = (n: number) => {
    moved.current = true
    const next = (n + slides.length) % slides.length
    setAt(next)
    setSeen((had) => new Set(had).add(next))
  }
  const goRef = useRef(go)
  goRef.current = go
  const atRef = useRef(at)
  atRef.current = at

  useEffect(() => {
    const onNext = () => goRef.current(atRef.current + 1)
    window.addEventListener('fohm:deck-next', onNext)
    return () => window.removeEventListener('fohm:deck-next', onNext)
  }, [])

  useEffect(() => {
    window.dispatchEvent(new CustomEvent<DeckProgress>('fohm:deck-progress', {detail: {seen: seen.size, total: slides.length}}))
  }, [seen, slides.length])

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
      <nav className="deck__dots" aria-label={`The tour: ${seen.size} of ${slides.length} seen`}>
        {slides.map((s, i) => (
          <button
            key={s.name}
            type="button"
            className={`${i === at ? 'is-on' : ''}${seen.has(i) ? ' is-seen' : ' is-new'}`}
            aria-current={i === at ? 'step' : undefined}
            onClick={() => go(i)}
          >
            <span className="deck__step" aria-hidden>
              {seen.has(i) && i !== at ? '✓' : i + 1}
            </span>
            {s.name}
            {!seen.has(i) && <span className="sr-only"> (not seen yet)</span>}
          </button>
        ))}
      </nav>
      <div className="deck__stage" aria-live="polite">
        {slides[at].node}
      </div>
      <div className="deck__nav">
        <button type="button" className="deck__back" onClick={() => go(at - 1)} disabled={at === 0}>
          ← Back
        </button>
        <span className="deck__count">
          <span className="deck__progress" aria-hidden>
            <i style={{width: `${(seen.size / slides.length) * 100}%`}} />
          </span>
          {seen.size === slides.length ? 'All seen' : `${seen.size} of ${slides.length} seen`}
        </span>
        <button type="button" className="deck__next" onClick={() => (at === slides.length - 1 ? openBuild() : go(at + 1))}>
          {at === slides.length - 1 ? 'Build it with me' : <>Next: {slides[at + 1].name}</>} <Arrow />
        </button>
      </div>
    </section>
  )
}
