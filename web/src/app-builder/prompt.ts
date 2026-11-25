import {QUESTIONS, SECTIONS, asked, type Answers, type Options} from './options'

/**
 * The prompt the builder hands over: everything answered, ready to paste into Claude with
 * fohm-scaffold's new-app skill, so its first phase (Discover) is done and it starts building.
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

export function claudePrompt(o: Options, raw: Answers, live?: string) {
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
    o.photo ? `Lead the landing page, onboarding’s opening and Home’s goal card with this photo, once its licence or my permission is recorded: ${o.photo}` : 'Find open-licence photos for every slot (reference/photos.md).',
  ]

  return `I want to make a new app with fohm-scaffold (github.com/rhoneybul/fohm-scaffold), following its new-app skill end to end.
My answers to the Discover phase are below. Take them as answered, ask me only what's marked as not answered, then carry on with the playbook.

## The app

${sections.join('\n\n')}

## Create it
${live ? `\nA prototype made from these answers is live in demo mode at ${live}: the template with my name, words, colour, onboarding and method. Build the real one from the same answers.\n` : ''}
Once the name is settled, create it with:

\`\`\`bash
${scaffoldCommand(o)}
\`\`\`

## What to do with these answers

${next.map((l) => `- ${l}`).join('\n')}
- Publish my checklist of what only I can do (the app-launch skill, step 1): the domain, the business and the store accounts take days, so they start today.
- Research the market into docs/RESEARCH.md with sources, using my audience, revenue, time, ambition, budget and content rights above.
- Write PRODUCT.md from my idea and business, and onboarding's steps (\`ONBOARDING\` in src/lib/progression.ts) from my key value, what members are here for, the first number and the week they can give, as the template's docs/ONBOARDING.md says.${o.kind === 'coaching' ? `
- Put my method into src/lib/progression.ts: the levels, skills and placing questions above.` : ''}
- Research the catalogue of goals and the courses that prepare for them, with open-licence photos (reference/research.md).
- Design with the app-design skill: my references from Mobbin within the house style (Space Grotesk and DM Sans, the grey canvas and white cards, the ink pill with the ${o.accent.toUpperCase()} disc), my answers to its three questions above, photos in every slot, and a fresh review before I see anything.
- Then launch with the app-launch skill, each integration off until its key is set, and never ask me for a secret in the chat.
`
}
