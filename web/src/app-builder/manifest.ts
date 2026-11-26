import {interestsOf, type Options} from './options'

/**
 * Everything fohm-scaffold builds into a new app, in the visitor's own names, from the scaffold's
 * README, its skills (new-app, app-design, app-launch) and its template. Keep it in step with the
 * scaffold: a new integration or step there is a new line here.
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
  const coach = o.coach === 'yes'

  return [
    {
      title: 'The app',
      items: [
        `A landing page at ${site}, led by a real photo, with ${o.name}’s headline, how it works in three steps and screens from inside the app`,
        'The web app, on phones and laptops, at the same address',
        'An iPhone app and an Android app from the same code, with the launch screen and its mark',
        'Home as a board: the greeting with their photo, first steps, the goal they train for as a photo card, the week, what’s next and a few numbers',
        'A floating tab bar on the main tabs, and Back on every other screen',
        ...(coaching
          ? [
              coach ? `A path of levels and skills, with drills and the ${owner}’s notes on each` : 'Programs to follow, dated to a goal, with nobody pretending to be a coach',
              'Check-ins after practice, and how it felt',
              coach ? `Questions and video clips to the ${owner}, with written or video replies` : `Notes to the ${owner}, answered by the team`,
              'A library of drills, videos and notes, pointing at what you already publish',
            ]
          : game
            ? ['A game to play in the browser and the apps, with scores saved', 'Feedback from players, answered from the dashboard']
            : [`${members.charAt(0).toUpperCase() + members.slice(1)} write things and get replies`]),
        ...(o.routes === 'yes' ? ['Routes planned on a map, snapped to real roads and paths (Mapbox)'] : []),
        'Saves and a to-do list: the goals and courses a member hearts come back on Home',
        'Demo mode: the whole app runs before anything is set up',
      ],
    },
    ...(game
      ? []
      : [
          {
            title: 'Onboarding',
            items: [
              'An opening over a photo that says what the app is for, a line to a screen',
              'Straight questions one to a screen, with progress dots and Skip on every screen',
              `What they’re here for as tiles: ${interestsOf(o).join(', ')}`,
              'Why it works, from the research, never invented numbers',
              ...(o.firstNumber ? [`A first number taken there and then: ${o.firstNumber.toLowerCase()}`] : []),
              'The week they can give, and the time that comes to',
              'Asks to notify them only where the phone can be asked now',
              'The end: where they start and what it builds up to, then into the app',
              'Every step seen, answered, skipped and left counted, as a funnel',
            ],
          },
        ]),
    {
      title: 'The house style',
      items: [
        'Naz’s and Etapa’s family: Space Grotesk for what’s read first, DM Sans for the rest, in sentence case',
        `A cool grey canvas, white cards, hairline rows, and one accent (${o.accent.toUpperCase()}) for what to press and what’s live now`,
        'The ink pill with an accent disc for the one thing to press on a screen',
        'Built only from the kit’s components and tokens, so every screen matches',
        'Text at 4.5:1 contrast, 44pt touch targets, safe areas, phone and laptop from one layout',
        o.logo === 'yes' ? 'Your logo traced into the mark, the app icon, the favicon and the share image' : 'A logo round: three or four concepts, judged at home-screen size, refined into the mark and every icon',
      ],
    },
    {
      title: 'Photos everywhere',
      items: [
        'The member’s own photo by the greeting, large on their account, and on the dashboard',
        'The goal they train for as the hero, a photo on every row and every hub card, and photos in empty states',
        `Only photos the app may show: ${o.ownPhotos === 'yes' ? 'yours, with your permission recorded, and ' : ''}open licences, each credited inside its card and listed on a Credits page`,
        'Video stills taken from the middle of a video, never a title card',
      ],
    },
    {
      title: 'Accounts and sign-in',
      items: [
        'Email and password, Continue with Google, and Sign in with Apple on iPhone',
        coach
          ? `Three roles: ${members}; coaches, who see only their own ${members}; and the owner, who sees everyone and gives each ${o.memberWord} a coach`
          : `Two roles: ${members}, and the ${owner} who runs it`,
        'A profile photo, picked and squared on the phone',
        'Delete my account, which deletes their data',
      ],
    },
    {
      title: 'The dashboard',
      items: [
        `At ${site}/admin, in graphite with your accent: People, with what needs you on top, and Activity, everything ${members} do and write, newest first`,
        'Every member action reaches it: the app won’t typecheck until a new field says where the dashboard shows it',
        'Each member’s page: their photo, their answers, their progress, last seen, their devices',
        'Pro given or taken away, and onboarding reset, from a member’s page',
      ],
    },
    {
      title: 'Backend and data',
      items: [
        'Supabase: a Postgres database, login and file storage for photos and videos',
        'An API on Vercel that decides who may read and write what, on the server',
        'Private notes that never reach a member, and fields each side can’t overwrite',
        'Migrations pushed on every deploy, safe to run twice',
      ],
    },
    {
      title: 'Monitoring and errors',
      items: [
        'Sentry on the web app, the iPhone and Android apps and the server: every error someone hits, with what they were doing, so the thing in their way is fixed before most people notice',
        'An error screen instead of a blank page, with the error reported',
        `A health check at ${site}/api/health that says what’s connected`,
        'Smoke tests on the live site after every deploy, so a broken release is caught in minutes',
      ],
    },
    {
      title: 'Analytics and consent',
      items: [
        'PostHog from the web and the apps: the journey people really take, so you can see who succeeds and make it easier for everyone else',
        'The onboarding funnel and what new members skip and leave by, the first places to make better',
        'Every event catalogued with why it’s there, and a test that holds the catalogue to the code',
        'Keyed to the account only: never names, emails, health numbers or anything people write; forgotten on sign-out and deletion',
        'A cookie banner on the landing page: counting only, or allow all',
      ],
    },
    {
      title: 'Payments',
      items: [
        `${o.name} Pro${o.price ? ` at ${o.price}` : ''}, the way your members pay: in the apps through the App Store and Google Play (RevenueCat, as in Naz and Etapa), or on the web through Stripe, with a free trial if you want one`,
        'Pro switches on and off from the store’s own record, and opens wherever they sign in',
      ],
    },
    ...(o.connects?.trim()
      ? [
          {
            title: 'Connections',
            items: [
              `Connects to ${o.connects.trim()}, so what ${members} do comes in on its own`,
              `Each connection in onboarding and Account, with what came from where`,
            ],
          },
        ]
      : []),
    {
      title: 'Email, notifications and sharing',
      items: [
        `Email in the app’s look, with a plain-text twin: the ${owner} hears when someone writes, ${members} hear when they get a reply`,
        'Sign-up and password emails in the same look',
        'Push notifications on iPhone and Android',
        'Invite links and share links that open the app on a phone (Tapp), with the channel each came from',
      ],
    },
    {
      title: 'AI',
      items: [`An AI assistant (Claude) for Pro ${members}, answering any time, with every question and answer on the dashboard`],
    },
    {
      title: 'Legal',
      items: [
        `A privacy policy and terms in ${o.name}’s name, with an address for questions`,
        'Credits for every photo shown',
        'Kept up to date whenever what’s stored, or who it’s shared with, changes',
      ],
    },
    {
      title: 'Tests, deploys and the stores',
      items: [
        'Typecheck and tests: access rules, the dashboard’s feed, onboarding, photos and their licences, analytics, migrations, payments',
        'GitHub Actions run every test against a local database on each pull request; nothing reaches main without one',
        'Vercel deploys main to production and a preview for every pull request, with screenshots at phone size',
        'iPhone and Android builds through Expo, TestFlight, and the App Store listing and its screenshots as data, submitted by a workflow',
      ],
    },
    {
      title: 'Launch and handover',
      items: [
        o.nameSure === 'yes' ? `The name, ${o.name}, settled` : 'A naming round: 12 to 15 names, each checked for domains, store clashes and trade marks, on a page you pick from',
        'Every step to going live, by phase, and a page of what only you can do (the domain, the business, the store accounts), slowest first',
        `Market research with sources, a product brief, design references${o.inspiration ? ` from ${o.inspiration}` : ''}, a proposal and a pitch deck`,
        'Notes and skills for Claude Code, so you can keep building on it yourself',
      ],
    },
  ]
}

/** Every integration starts off and switches on when its key is set, so nothing is paid for until it's wanted. */
export const OFF_UNTIL_SET = 'Stripe, PostHog, Sentry, Resend, the AI assistant, Google and Apple sign-in, push, share links and maps each switch on when their key is set.'
