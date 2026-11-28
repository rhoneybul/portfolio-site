import {QUESTIONS, SECTIONS, asked, inStores, onWeb, type Answers, type Options} from './options'

/**
 * The prompt the builder hands over: everything answered, ready to paste into Claude with
 * fohm-scaffold's new-app skill, so its first phase (Discover) is done. It follows the skill's
 * order: research, then the end-to-end prototype in Claude Design that the owner approves, and
 * only then the scaffold command. The builder's own prototype, when Claude drew one, is the
 * first sketch the real one starts from.
 */

/** A value for the command line: the scaffolder refuses quotes and backslashes, so they never get here. */
const arg = (v: string) => `"${v.replace(/["\\`$]/g, '')}"`

/** The answers as `fohm-scaffold new`'s flags, by its option keys (its lib/options.mjs QUESTIONS), only those set. */
function scaffoldFlags(o: Options): [key: string, flag: string, value: string][] {
  const flags: [string, string, string][] = [
    ['name', 'name', o.name],
    ['idea', 'idea', o.idea],
    ['business', 'business', o.business],
    ['kind', 'kind', o.kind],
    ['coach', 'coach', o.coach],
    ['routes', 'routes', o.routes],
    ['inspiration', 'inspiration', o.inspiration],
    ['tagline', 'tagline', o.tagline],
    ['memberWord', 'member-word', o.memberWord],
    ['ownerWord', 'owner-word', o.ownerWord],
    ['operator', 'operator', o.operator],
    ['country', 'country', o.country],
    ['registration', 'registration', o.registration],
    ['address', 'address', o.address],
    ['supportEmail', 'support-email', o.supportEmail],
    ['domain', 'domain', o.domain],
    ['bundleId', 'bundle-id', o.bundleId],
    ['accent', 'accent', o.accent.toUpperCase()],
  ]
  return flags.filter(([, , v]) => v)
}

/** What brief.json carries as `new`'s options (fohm-scaffold's lib/brief.mjs, version 1). */
export const scaffoldOptions = (o: Options) => Object.fromEntries(scaffoldFlags(o).map(([key, , v]) => [key, v]))

/** Every flag spelled out: the way to create it when there's no brief.json to read. */
export function scaffoldCommand(o: Options) {
  const parts = scaffoldFlags(o).map(([, flag, v]) => `  --${flag} ${arg(v)}`)
  return `npx github:rhoneybul/fohm-scaffold new ${o.slug} \\\n${parts.join(' \\\n')} \\\n  --json`
}

/** One command that makes the app from a submission's brief.json: every answer comes with it. */
export const fromCommand = (briefJsonUrl: string) => `npx github:rhoneybul/fohm-scaffold new --from "${briefJsonUrl}" --json`

/** Links the brief carries: the builder's prototype, and the brief.json `new --from` reads. */
export interface BriefLinks {
  prototype?: string
  briefJson?: string
  /** The subject researched while they answered (subject.ts's subjectSaid), when it was found. */
  subject?: string
}

/** Where people use it, as what to build: the template makes the web app and the store apps from one codebase. */
function platformsLine(o: Options) {
  if (!inStores(o))
    return 'People use it on the web only, in a phone’s or a laptop’s browser: build and deploy the web app, leave the iPhone and Android builds, the store listings and store payments out of the launch, and have the landing page lead with Get started in the browser.'
  if (!onWeb(o))
    return 'People use it in the iPhone and Android apps only: the web build is the landing page that sends them to the App Store and Google Play, and the launch puts the store accounts, builds and listings first.'
  return 'People use it in the iPhone and Android apps and on the web: every feature works the same in both, the landing page leads with the App Store and Google Play, and the web app is a quiet link under them.'
}

export function claudePrompt(o: Options, raw: Answers, {prototype: prototypeUrl, briefJson, subject}: BriefLinks = {}) {
  const shown = asked(raw)
  const answered = (key: string) => {
    const q = QUESTIONS.find((x) => x.key === key)!
    const given = (raw[key] ?? '').trim()
    const label = q.choices?.filter((c) => given.split(',').map((x) => x.trim()).includes(c.value)).map((c) => c.label).join(', ')
    return label || given || (o[key] && o[key] !== given ? `${o[key]} (the default)` : '')
  }

  const sections = SECTIONS.map((section) => {
    const lines = shown
      .filter((q) => q.section === section)
      .map((q) => `- **${q.ask}** ${answered(q.key) || '_not answered: ask me_'}`)
    return lines.length ? `### ${section}\n\n${lines.join('\n')}` : ''
  }).filter(Boolean)

  const next = [
    o.nameSure === 'yes'
      ? `The name is final: ${o.name}.`
      : `The name isn't final: run the naming round first (reference/naming.md), in the direction above, and put **Name not final** on the checklist until I pick one.`,
    ...(raw.nameCheck?.trim() ? [`The builder checked the name as I gave it: ${raw.nameCheck.trim()}`] : []),
    ...(o.connects?.trim()
      ? [`Connect to what my members already track with (${o.connects.trim()}): find each one's API and its terms, import what they've done with its source, and keep each off until its keys are set.`]
      : []),
    o.logo === 'yes' ? 'I have a logo: ask me for the artwork and trace it into assets/brand/.' : `I have no logo: run the logo round (the app-design skill’s reference/logo.md) once the name is settled.${o.logoLikes ? ` Logos I like, for the kind of mark (not its shape): ${o.logoLikes}.` : ''}`,
    o.photo
      ? `Lead the landing page, onboarding’s opening and Home’s goal card with this photo${o.photoCredit ? ` (${o.photoCredit}${/on Unsplash$/.test(o.photoCredit) ? ', under the Unsplash licence' : ', from Wikimedia Commons'})` : ', once its licence or my permission is recorded'}: ${o.photo}`
      : 'Find open-licence photos for every slot (reference/photos.md).',
    platformsLine(o),
    `It’s ${o.kind === 'game' ? 'a game' : o.coach === 'yes' ? 'programs to follow, and a real person who answers people: both' : 'programs to follow, with nobody pretending to be a coach'}.`,
  ]

  // What the builder left to Claude, so the first phase isn't a wall of questions.
  const stillToAsk = [
    'what people are called in the app, and the person who runs it',
    'the business’s details for the privacy policy and terms: who runs it, the country, its registration and registered office',
    inStores(o) ? 'the support email, the domain and the app id' : 'the support email and the domain',
    'the naming direction, if the name isn’t final',
    ...(o.kind === 'game' ? [] : ['the one question the app answers for people, which opens onboarding over a photo']),
    ...(o.kind === 'coaching' ? ['the levels people move through, and the skills and drills at each: my method, for the path'] : []),
    'the design questions: the navigation, and apps I don’t like',
    ...(o.kind === 'game' ? [] : ['how much time people can give it each week, and a first number they can measure', 'the questions that place someone at a level']),
    'what Pro costs',
    'my revenue, time, budget and content rights, for the research',
  ]

  const order = [
    `Research the market first, before anything is drawn (the skill's step 2), from my audience and ambition above, with a source for every number.`,
    `Then prototype the whole app end to end in Claude Design (the skill's step 3 and its reference/prototype.md): every screen my members meet, and my dashboard, in the house style, my words and real photos, clickable from the first screen. Send me the link that plays it, with the calls you made and the research's open questions, and revise it until I say build it.${prototypeUrl ? ` The app builder already drew a first prototype from these answers: ${prototypeUrl} (the dashboard's screens: ${prototypeUrl}${prototypeUrl.includes('?') ? '&' : '?'}view=laptop). Start from it, but make the real one on a Claude Design canvas.` : ''}`,
    'Only once I’ve approved the prototype, create the app (below), with the flags the prototype settled.',
  ]

  return `I want to make a new app with fohm-scaffold (github.com/rhoneybul/fohm-scaffold), following its new-app skill end to end.
My answers to the Discover phase are below. Take them as answered, ask me only what's marked as not answered, then carry on with the playbook.

## The app

${sections.join('\n\n')}
${
    subject
      ? `
## The subject

The app builder researched the subject my app is about from the web while I answered: what an expert in it knows. Use it through the new-app skill (reference/discovery.md, *Know the subject*): offer its real sessions, goals and tests back to me as picks, and build the programs, onboarding and catalogues from it, checking each against its sources first. My answers above win where they differ.

${subject}
`
      : ''
  }
## Still to ask me

${stillToAsk.map((l) => `- ${l}`).join('\n')}

## Before anything is created

${order.map((l, i) => `${i + 1}. ${l}`).join('\n')}

## Create it, once I've approved the prototype

${
    briefJson
      ? `Every answer above is in the brief's JSON, so one command makes the app and keeps this brief as docs/BRIEF.md. A flag beside it wins over the brief: add one for each answer the chat or the prototype settled (\`--name\`, \`--operator\`, \`--country\`, \`--registration\`, \`--support-email\`, \`--domain\`, \`--bundle-id\`, \`--scheme\`):

\`\`\`bash
${fromCommand(briefJson)}
\`\`\``
      : `With the name settled and those answers in, create it with this, putting my answers in place of the placeholders (the operator, the support email and the app id):

\`\`\`bash
${scaffoldCommand(o)}
\`\`\``
  }

## What to do with these answers

${next.map((l) => `- ${l}`).join('\n')}
- Publish my checklist of what only I can do (the app-launch skill, step 1): the domain, the business and the store accounts take days, so they start today.
- Once the app exists, the research becomes docs/RESEARCH.md and the prototype's link goes in DESIGN.md under Prototype.
- Write the landing page's headline and description from what people should be doing in the app, and PRODUCT.md from my idea and business.
- Write onboarding's steps (\`ONBOARDING\` in src/lib/progression.ts) from my idea, what people are here for and what they work towards, as the template's docs/ONBOARDING.md says.${o.kind === 'coaching' ? `
- Put my method into src/lib/progression.ts once you have the levels and skills from me.` : ''}
- Research the catalogue of goals and the courses that prepare for them, with open-licence photos (reference/research.md).
- Design with the app-design skill, building the approved prototype for real: my references from Mobbin within the house style, in the look the prototype settled (its canvas, corners, faces and icon, with the ${o.accent.toUpperCase()} accent), photos in every slot, and a fresh review against the prototype before I see anything.
- Then launch with the app-launch skill, each integration off until its key is set, and never ask me for a secret in the chat.
`
}
