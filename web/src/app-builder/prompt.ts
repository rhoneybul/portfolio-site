import {QUESTIONS, SECTIONS, asked, type Answers, type Options} from './options'

/**
 * The prompt the builder hands over: everything answered, ready to paste into Claude with
 * fohm-scaffold's new-app skill, so its first phase (Discover) is done. It follows the skill's
 * order: research, then the end-to-end prototype in Claude Design that the owner approves, and
 * only then the scaffold command. The builder's own prototype, when Claude drew one, is the
 * first sketch the real one starts from.
 */

/** A value for the command line: the scaffolder refuses quotes and backslashes, so they never get here. */
const arg = (v: string) => `"${v.replace(/["\\`$]/g, '')}"`

export function scaffoldCommand(o: Options) {
  const flags: [string, string][] = [
    ['name', o.name],
    ['idea', o.idea],
    ['business', o.business],
    ['kind', o.kind],
    ['coach', o.coach],
    ['routes', o.routes],
    ['inspiration', o.inspiration],
    ['tagline', o.tagline],
    ['member-word', o.memberWord],
    ['owner-word', o.ownerWord],
    ['operator', o.operator],
    ['country', o.country],
    ['registration', o.registration],
    ['address', o.address],
    ['support-email', o.supportEmail],
    ['domain', o.domain],
    ['bundle-id', o.bundleId],
    ['accent', o.accent.toUpperCase()],
  ]
  const parts = flags.filter(([, v]) => v).map(([k, v]) => `  --${k} ${arg(v)}`)
  return `npx github:rhoneybul/fohm-scaffold new ${o.slug} \\\n${parts.join(' \\\n')} \\\n  --json`
}

export function claudePrompt(o: Options, raw: Answers, prototypeUrl?: string) {
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

  const order = [
    `Research the market first, before anything is drawn (the skill's step 2), from my audience and ambition above, with a source for every number.`,
    `Then prototype the whole app end to end in Claude Design (the skill's step 3 and its reference/prototype.md): every screen my members meet, and my dashboard, in the house style, my words and real photos, clickable from the first screen. Send me the link that plays it, with the calls you made and the research's open questions, and revise it until I say build it.${prototypeUrl ? ` The app builder already drew a first prototype from these answers: ${prototypeUrl} (the dashboard's screens: ${prototypeUrl}${prototypeUrl.includes('?') ? '&' : '?'}view=laptop). Start from it, but make the real one on a Claude Design canvas.` : ''}`,
    'Only once I’ve approved the prototype, create the app (below), with the flags the prototype settled.',
  ]

  return `I want to make a new app with fohm-scaffold (github.com/rhoneybul/fohm-scaffold), following its new-app skill end to end.
My answers to the Discover phase are below. Take them as answered, ask me only what's marked as not answered, then carry on with the playbook.

## The app

${sections.join('\n\n')}

## Still to ask me

${stillToAsk.map((l) => `- ${l}`).join('\n')}

## Before anything is created

${order.map((l, i) => `${i + 1}. ${l}`).join('\n')}

## Create it, once I've approved the prototype

With the name settled and those answers in, create it with this, putting my answers in place of the placeholders (the operator, the support email and the app id):

\`\`\`bash
${scaffoldCommand(o)}
\`\`\`

## What to do with these answers

${next.map((l) => `- ${l}`).join('\n')}
- Publish my checklist of what only I can do (the app-launch skill, step 1): the domain, the business and the store accounts take days, so they start today.
- Once the app exists, the research becomes docs/RESEARCH.md and the prototype's link goes in DESIGN.md under Prototype.
- Write the landing page's headline and description from what people should be doing in the app, and PRODUCT.md from my idea and business.
- Write onboarding's steps (\`ONBOARDING\` in src/lib/progression.ts) from my idea, what people are here for and what they work towards, as the template's docs/ONBOARDING.md says.${o.kind === 'coaching' ? `
- Put my method into src/lib/progression.ts once you have the levels and skills from me.` : ''}
- Research the catalogue of goals and the courses that prepare for them, with open-licence photos (reference/research.md).
- Design with the app-design skill, building the approved prototype for real: my references from Mobbin within the house style (Space Grotesk and DM Sans, the grey canvas and white cards, the ink pill with the ${o.accent.toUpperCase()} disc), photos in every slot, and a fresh review against the prototype before I see anything.
- Then launch with the app-launch skill, each integration off until its key is set, and never ask me for a secret in the chat.
`
}
