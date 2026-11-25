'use client'

import {useState, type CSSProperties, type FormEvent} from 'react'
import {Arrow} from '@/components/arrow'

// A placeholder for the outreach app builder: the visitor describes their business and sees what
// fohm-scaffold would make for them. Nothing is generated yet; the answers go to Rob on WhatsApp,
// and the scaffold runs on a call. When the builder runs for real, `onSubmit` is where it starts.

type Kind = 'coaching' | 'app' | 'game'

const KINDS: {value: Kind; label: string; hint: string}[] = [
  {value: 'coaching', label: 'Coaching app', hint: 'Assessments, a path of skills, check-ins and video feedback'},
  {value: 'app', label: 'Plain app', hint: 'Accounts, a dashboard and the integrations, ready to build on'},
  {value: 'game', label: 'Game', hint: 'A browser game with scores saved and a leaderboard'},
]

const INCLUDED: Record<Kind, string[]> = {
  coaching: [
    'A level assessment and a path of skills for each member',
    'Check-ins, questions and video uploads for the coach',
    'Several coaches, each seeing only their own members',
  ],
  app: ['Sign-in and accounts, with demo mode before any setup', 'A library and the screens your business needs'],
  game: ['A game in the browser, on phones first', 'Scores saved and shown on your dashboard'],
}

const ALWAYS = [
  'A landing page, a web app, and iPhone and Android apps from one codebase',
  'An owner’s dashboard that sees everything people do',
  'Payments, analytics, error reports, email and an AI assistant, each off until you switch it on',
  'Privacy policy, terms, tests and deploys',
]

export function AppBuilder({whatsapp}: {whatsapp?: string | null}) {
  const [idea, setIdea] = useState('')
  const [name, setName] = useState('')
  const [kind, setKind] = useState<Kind>('coaching')
  const [accent, setAccent] = useState('#f4401b')
  const [built, setBuilt] = useState(false)

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    setBuilt(true)
  }

  const appName = name.trim() || 'Your app'
  const kindLabel = KINDS.find((k) => k.value === kind)?.label ?? ''
  const message = [
    'Hi Rob, I tried the app builder on your website.',
    `Name: ${appName}`,
    `Kind: ${kindLabel}`,
    `What it’s for: ${idea.trim()}`,
    `Colour: ${accent}`,
  ].join('\n')

  return (
    <div className="builder" style={{'--app-accent': accent} as CSSProperties}>
      <form className="builder__form" onSubmit={onSubmit}>
        <label className="builder__field">
          <span className="label">01 · What does your business do?</span>
          <textarea
            required
            rows={3}
            maxLength={400}
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            placeholder="I coach adult beginners through their first triathlon."
          />
        </label>

        <label className="builder__field">
          <span className="label">02 · What’s the app called?</span>
          <input
            required
            maxLength={40}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Tide Pool"
          />
        </label>

        <fieldset className="builder__field">
          <legend className="label">03 · What kind of app?</legend>
          <div className="builder__kinds">
            {KINDS.map((k) => (
              <label key={k.value} className={`builder__kind${kind === k.value ? ' is-active' : ''}`}>
                <input
                  type="radio"
                  name="kind"
                  value={k.value}
                  checked={kind === k.value}
                  onChange={() => setKind(k.value)}
                />
                <strong>{k.label}</strong>
                <span>{k.hint}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <label className="builder__field builder__field--row">
          <span className="label">04 · Your colour</span>
          <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} />
        </label>

        <button type="submit" className="btn btn-primary">
          {built ? 'Update my app' : 'Show me my app'} <Arrow />
        </button>
      </form>

      {built && (
        <section className="builder__result" aria-live="polite">
          <div className="builder__preview">
            <span className="builder__preview-mark" aria-hidden />
            <p className="builder__preview-name">{appName}</p>
            <p className="builder__preview-idea">{idea}</p>
          </div>

          <div className="builder__plan">
            <span className="label">What you’d get</span>
            <ul className="highlights">
              {[...INCLUDED[kind], ...ALWAYS].map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>

            <p className="builder__note">
              The builder is in early access: I run it with you on a call, then walk you through every step to the
              web and the app stores.
            </p>

            {whatsapp && (
              <a
                className="btn btn-primary"
                href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(message)}`}
                target="_blank"
                rel="noreferrer"
              >
                Build it with me <Arrow />
              </a>
            )}
          </div>
        </section>
      )}
    </div>
  )
}
