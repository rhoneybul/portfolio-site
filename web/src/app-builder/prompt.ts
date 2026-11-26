import {QUESTIONS, SECTIONS, asked, type Answers, type Options} from './options'

/**
 * The prompt the builder hands over: everything answered, ready to paste into Claude with
 * fohm-scaffold's new-app skill, so its first phase (Discover) is done and it starts building.
 */

/** A value for the command line: the scaffolder refuses quotes and backslashes, so they never get here. */
const arg = (v: string) => `"${v.replace(/["\\`$]/g, '')}"`

/** What `fohm-scaffold new` takes, by its option keys (its lib/options.mjs QUESTIONS) and its flags. */
const SCAFFOLD_OPTIONS: [key: string, flag: string][] = [
  ['name', 'name'],
  ['idea', 'idea'],
  ['business', 'business'],
  ['kind', 'kind'],
  ['coach', 'coach'],
  ['routes', 'routes'],
  ['inspiration', 'inspiration'],
  ['tagline', 'tagline'],
  ['memberWord', 'member-word'],
  ['ownerWord', 'owner-word'],
  ['operator', 'operator'],
  ['country', 'country'],
  ['registration', 'registration'],
  ['address', 'address'],
  ['supportEmail', 'support-email'],
  ['domain', 'domain'],
  ['bundleId', 'bundle-id'],
  ['accent', 'accent'],
]

/** The answers as `fohm-scaffold new`'s options, only those set: what brief.json carries and the command spells out. */
export function scaffoldOptions(o: Options): Record<string, string> {
  const value = (key: string) => (key === 'accent' ? o.accent.toUpperCase() : o[key])
  return Object.fromEntries(SCAFFOLD_OPTIONS.map(([key]) => [key, value(key)]).filter(([, v]) => v))
}

/** The command that makes the app from its brief.json: every answer comes with it, so nothing is retyped. */
export const fromCommand = (briefJsonUrl: string) => `npx github:rhoneybul/fohm-scaffold new --from ${briefJsonUrl}`

export function scaffoldCommand(o: Options) {
  const options = scaffoldOptions(o)
  const parts = SCAFFOLD_OPTIONS.filter(([key]) => options[key]).map(([key, flag]) => `  --${flag} ${arg(options[key])}`)
  return `npx github:rhoneybul/fohm-scaffold new ${o.slug} \\\n${parts.join(' \\\n')} \\\n  --json`
}

/** `briefJsonUrl`: the submission's brief.json, when the brief is read from its page; the create step is then one command. */
export function claudePrompt(o: Options, raw: Answers, briefJsonUrl?: string) {
  // The visitor's email is for getting in touch, not for building: it stays out of the brief.
  const shown = asked(raw).filter((q) => q.key !== 'email')
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
    o.logo === 'yes' ? 'I have a logo: ask me for the artwork and trace it into assets/brand/.' : 'I have no logo: run the logo round (the app-design skill’s reference/logo.md) once the name is settled.',
    o.photo
      ? `Lead the landing page, onboarding’s opening and Home’s goal card with this photo${o.photoCredit ? ` (${o.photoCredit}, from Wikimedia Commons)` : ', once its licence or my permission is recorded'}: ${o.photo}`
      : 'Find open-licence photos for every slot (reference/photos.md).',
    `It’s ${o.kind === 'game' ? 'a game' : o.coach === 'yes' ? 'programs to follow, and a real person who answers people: both' : 'programs to follow, with nobody pretending to be a coach'}.`,
  ]

  // What the builder left to Claude, so the first phase isn't a wall of questions.
  const stillToAsk = [
    'what people are called in the app, and the person who runs it',
    'the business’s details for the privacy policy and terms: who runs it, the country, its registration and registered office',
    'the support email, the domain and the app id',
    'the naming direction, if the name isn’t final',
    ...(o.kind === 'game' ? [] : ['the one question the app answers for people, which opens onboarding over a photo']),
    ...(o.kind === 'coaching' ? ['the levels people move through, and the skills and drills at each: my method, for the path'] : []),
    'the design questions: the navigation, and apps I don’t like',
    ...(o.kind === 'game' ? [] : ['how much time people can give it each week, and a first number they can measure', 'the questions that place someone at a level']),
    'what Pro costs',
    'my revenue, time, budget and content rights, for the research',
  ]

  return `I want to make a new app with fohm-scaffold (github.com/rhoneybul/fohm-scaffold), following its new-app skill end to end.
My answers to the Discover phase are below. Take them as answered, ask me only what's marked as not answered, then carry on with the playbook.

## The app

${sections.join('\n\n')}

## Still to ask me

${stillToAsk.map((l) => `- ${l}`).join('\n')}

## Create it

${
    briefJsonUrl
      ? `Every answer above is in the brief's JSON, so one command makes the app and keeps this brief as docs/BRIEF.md. Run it once the name is settled; a flag beside it wins over the brief, so add one for each answer the chat changed or settled (\`--name\`, \`--operator\`, \`--support-email\`, \`--domain\`, \`--bundle-id\`):

\`\`\`bash
${fromCommand(briefJsonUrl)} --json
\`\`\``
      : `Once the name is settled and you have those, create it with this, putting my answers in place of the placeholders (the operator, the support email and the app id):

\`\`\`bash
${scaffoldCommand(o)}
\`\`\``
  }

## What to do with these answers

${next.map((l) => `- ${l}`).join('\n')}
- Publish my checklist of what only I can do (the app-launch skill, step 1): the domain, the business and the store accounts take days, so they start today.
- Research the market into docs/RESEARCH.md with sources, from my audience and ambition above.
- Write the landing page's headline and description from what people should be doing in the app, and PRODUCT.md from my idea and business.
- Write onboarding's steps (\`ONBOARDING\` in src/lib/progression.ts) from my idea, what people are here for and what they work towards, as the template's docs/ONBOARDING.md says.${o.kind === 'coaching' ? `
- Put my method into src/lib/progression.ts once you have the levels and skills from me.` : ''}
- Research the catalogue of goals and the courses that prepare for them, with open-licence photos (reference/research.md).
- Design with the app-design skill: my references from Mobbin within the house style (Space Grotesk and DM Sans, the grey canvas and white cards, the ink pill with the ${o.accent.toUpperCase()} disc), my answers to its three questions above, photos in every slot, and a fresh review before I see anything.
- Then launch with the app-launch skill, each integration off until its key is set, and never ask me for a secret in the chat.
`
}
