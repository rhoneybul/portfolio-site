import type {Options} from './options'

/**
 * Everything fohm-scaffold builds into a new app, in the visitor's own names, from the scaffold's
 * README, its steps (lib/steps.mjs) and its template (api/, src/, tests/, .github/, docs/). Keep it
 * in step with the scaffold: a new integration or step there is a new line here.
 */

export interface Part {
  title: string
  items: string[]
}

export function whatYouGet(o: Options): Part[] {
  const site = o.domain || `${o.slug}.vercel.app`
  const members = `${o.memberWord}s`
  const owner = o.ownerWord
  const coaching = o.kind === 'coaching'
  const game = o.kind === 'game'

  return [
    {
      title: 'The app',
      items: [
        `A landing page at ${site}, with ${o.name}’s headline and the way in`,
        `The web app, on phones and laptops, at the same address`,
        `An iPhone app and an Android app from the same code (${o.bundleId})`,
        `The ${owner}’s dashboard at ${site}/admin: People, with what needs you on top, and Activity, everything ${members} do and write`,
        ...(coaching
          ? [
              'A level assessment that places each new member on the path',
              `A path of levels and skills, with drills and the ${owner}’s notes on each`,
              'Check-ins after practice, and how it felt',
              `Questions and video clips to the ${owner}, with written or video replies`,
              'A library of drills, videos and notes',
            ]
          : game
            ? ['A game to play in the browser and the apps, with scores saved', 'Every round and best score on the dashboard', 'Feedback from players, answered from the dashboard']
            : [`${members.charAt(0).toUpperCase() + members.slice(1)} write things and get replies`, 'Every entry and reply on the dashboard']),
        `Demo mode: the whole app runs before anything is set up`,
      ],
    },
    {
      title: 'Accounts and sign-in',
      items: [
        'Sign up and sign in with an email and password',
        'Continue with Google',
        `Three roles: ${members}; coaches, who see only their own ${members}; and the owner, who sees everyone and gives each ${o.memberWord} a coach`,
        `Pro given or taken away from the dashboard`,
        'Delete my account, which deletes their data',
      ],
    },
    {
      title: 'Backend and data',
      items: [
        'Supabase: a Postgres database, login and file storage for videos',
        'An API on Vercel that decides who may read and write what, on the server',
        'Private notes that never reach a member, and fields each side can’t overwrite',
        'Database migrations pushed on every deploy, safe to run twice',
      ],
    },
    {
      title: 'Monitoring and errors',
      items: [
        'Sentry error reports from the web app, the iPhone and Android apps and the server, so you know something broke before anyone tells you',
        'A friendly error screen instead of a blank page, with the error reported',
        `A health check at ${site}/api/health that says what’s connected`,
        'Smoke tests that check the live site after every deploy, so a broken release is caught in minutes',
      ],
    },
    {
      title: 'Analytics',
      items: [
        'PostHog product analytics from the web and the apps: page views, sign-ups, what people make, games played, questions asked, Pro started and ended',
        'Keyed to the account only: never names, emails or anything people write',
      ],
    },
    {
      title: 'Payments',
      items: [
        `Stripe: a ${o.name} Pro plan bought on the web, with a free trial if you want one`,
        'Pro switches on and off from Stripe’s own record, through its webhook',
        'Pro bought on the web opens in the apps too',
      ],
    },
    {
      title: 'Email and notifications',
      items: [
        `Email through Resend, from ${o.supportEmail}: the ${owner} hears when someone writes, ${members} hear when they get a reply`,
        'Push notifications on iPhone and Android',
      ],
    },
    {
      title: 'AI',
      items: [`An AI assistant (Claude) for Pro ${members}, answering any time, with every question and answer on the dashboard`],
    },
    {
      title: 'Legal',
      items: [
        `A privacy policy and terms for ${o.operator}${o.registration ? ` (${o.registration})` : ''}, with ${o.supportEmail} for questions`,
        'Kept up to date whenever what’s stored, or who it’s shared with, changes',
      ],
    },
    {
      title: 'Tests and deploys',
      items: [
        'Typecheck and tests: the API’s access rules, the dashboard’s feed, migrations, payments and the integrations',
        'GitHub Actions run every test against a local database on each pull request',
        'Vercel deploys main to production and a preview for every pull request',
        'iPhone and Android builds and store submission through Expo',
      ],
    },
    {
      title: 'Launch and handover',
      items: [
        'Every step to going live, by phase, with what’s done and what’s next: research, design, build, launch, grow, hand over',
        'A page of what only you can do (the domain, the business, the store accounts), slowest first',
        `Market research, a product brief, design references${o.inspiration ? ` from ${o.inspiration}` : ''}, a proposal and a pitch deck`,
        'Notes for Claude Code, so you can keep building on it yourself',
      ],
    },
  ]
}

/** Every integration starts off and switches on when its key is set, so nothing is paid for until it's wanted. */
export const OFF_UNTIL_SET = 'Stripe, PostHog, Sentry, Resend, the AI assistant, Google sign-in and push each switch on when their key is set.'
