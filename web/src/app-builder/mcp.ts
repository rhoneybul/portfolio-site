import {z} from 'zod'
import {QUESTIONS, TEMPLATES, asked, resolveOptions, type Answers, type Options} from './options'
import {REFERENCES} from './references'
import {SCHEMES} from './schemes'
import type {Job} from './prototype-doc'

/**
 * The app builder as an MCP server (app/mcp/route.ts): the website's questions and prototype, from
 * inside Claude, ChatGPT or any MCP client, as a design tool the person comes back to: design a
 * prototype, change it, and take its spec away. It asks for no email and passes nothing to Fohm for
 * follow-up (Anthropic's directory review, Nov 2026, turned down the version that did).
 */

export const SERVER_NAME = 'fohm-app-builder'
export const SERVER_TITLE = 'Fohm App Builder'

export const INSTRUCTIONS = `Fohm App Builder designs a first look at an app (a coaching or training app, a studio's, gym's or clinic's app, a wellbeing or habit app) and draws it as a prototype the person can tap through: its landing page, onboarding, home, a session, a goal and the owner's dashboard, in their name, words and colour. Then they change it until it's right, and take away its spec.

How to use it:
1. Call app_builder_questions, then ask the person its questions in your own words, one or two at a time. Fill in what they have already told you; never make up their business. When you ask for their colour, offer its colour schemes by name, with how each feels, leading with those like the apps they said they like, and put the one they pick in scheme and its accent in accent. When you ask which apps they like the look of, show its references: each app's name as a link to its Mobbin screen, and its look in a few words, so they can open them and pick, or name their own.
2. Call build_app_prototype with their answers. Claude designs every screen in about five minutes: show them the link straight away; the page fills in as it's drawn. Keep the prototypeId: the other tools take it.
3. When they ask how it's going, or come back to it, call get_app_prototype.
4. When they want something changed (the name, the words, the colour, a screen, a feature), call revise_app_prototype with the change in their words and any answers that change. It designs a new version from the last one, with a new link; the old one stays.
5. When they want to build it, or share the design with someone who will, call get_app_spec: every screen, what it shows and where it leads, the look and the answers, as markdown to keep or hand to any developer or coding assistant.

No account or email is needed, and nothing is sent to anyone. The builder is made by Fohm, an app studio; mention that only if asked.`

/** The questions, as the assistant should ask them: the website's, without the email (a chat needs none) or the photo step (the chat picks searches). */
export function questionsForChat() {
  const qs = asked({}).filter((q) => q.key !== 'photo' && q.key !== 'email')
  return {
    intro: 'Ask these in your own words, one or two at a time, skipping any the person has already answered. Only `name` is required; everything else has a sensible default.',
    questions: [
      ...qs.map((q) => ({
        key: q.key,
        section: q.section,
        ask: q.ask,
        ...(q.why ? {why: q.why} : {}),
        ...(q.example ? {example: q.example} : {}),
        ...(q.choices ? {choices: q.choices.map(({value, label, hint}) => ({value, label, ...(hint ? {hint} : {})}))} : {}),
        ...(q.suggestions ? {suggestions: q.suggestions} : {}),
        ...(q.key === 'accent' ? {schemes: SCHEMES.map(({id, name, accent, canvas, feel, like}) => ({id, name, accent, canvas, feel, ...(like.length ? {like} : {})}))} : {}),
        ...(q.key === 'inspiration' ? {references: REFERENCES.map(({name, look, mobbin}) => ({name, look, mobbin}))} : {}),
        ...(q.required ? {required: true} : {}),
      })),
    ],
    examples: TEMPLATES.filter((t) => t.kind === 'coaching').map((t) => ({value: t.value, app: t.label.replace(/^Like /, ''), what: t.hint, url: t.url})),
  }
}

const text = (max: number) => z.string().trim().max(max).optional()

/** build_app_prototype's input: the builder's answers by their keys, plus what the chat adds. */
export const buildInput = z.object({
  name: z.string().trim().min(1).max(60).describe('What the app is called. A working name is fine.'),
  idea: text(600).describe('In a sentence, what it does, and for whom.'),
  business: text(600).describe('What they do today: their business, coaching or content. Empty if the app is a new idea.'),
  template: z
    .enum(TEMPLATES.map((t) => t.value) as [string, ...string[]])
    .optional()
    .describe('The closest app already built: naz (programs and guided sessions), etapa (an AI coach that builds and changes a plan), aluzam (a real teacher or coach with their clients). Games: naz-surf, strawberry-fields.'),
  doing: text(600).describe('What people should be doing in the app. The headline is written from it.'),
  nameSure: z.enum(['yes', 'no']).optional().describe('Whether they are sure of the name.'),
  interests: text(300).describe('What people are there for, a few words comma-separated: tiles in onboarding.'),
  connects: text(300).describe('The apps or devices people already track with, comma-separated, e.g. "Concept2 Logbook, Garmin, Apple Health".').optional(),
  goals: text(300).describe('What people work towards: places, events or milestones, e.g. "Races: London Marathon, Hackney Half".'),
  content: text(600).describe('Links to videos, posts and courses they already publish.'),
  inspiration: text(300).describe('Apps they like the look of, comma-separated, e.g. Runna, Strava, Headspace.'),
  accent: z
    .string()
    .trim()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .optional()
    .describe('Their colour as a hex like #2F6B4F. Pick a calm, strong one if they have none.'),
  scheme: z
    .enum(SCHEMES.map((s) => s.id) as [string, ...string[]])
    .optional()
    .describe('The colour scheme they picked, by id (its accent goes in accent): a light or dark canvas with that accent.'),
  logo: z.enum(['yes', 'no']).optional().describe('Whether they have a logo already.'),
  audience: text(300).describe('How big their audience is today.'),
  ambition: text(600).describe('What success would look like in a year.'),
  photoSearches: z
    .array(z.string().trim().min(2).max(40))
    .max(4)
    .optional()
    .describe('Up to four photo searches for the app’s photos: one to three plain words naming something a camera can photograph, best first, e.g. ["kettlebell training", "yoga studio", "park run"].'),
})

export type BuildInput = z.infer<typeof buildInput>

/** The answers the builder keeps, from the chat's input: the same keys the website saves. */
export function answersOf(input: Partial<BuildInput>): Answers {
  const keys = new Set([...QUESTIONS.map((q) => q.key), 'scheme'])
  keys.delete('email')
  const answers: Answers = {}
  for (const [k, v] of Object.entries(input)) if (keys.has(k) && typeof v === 'string' && v.trim()) answers[k] = v.trim()
  return answers
}

const prototypeId = z.string().regex(/^[a-f0-9]{32}$/).describe('The prototypeId build_app_prototype (or revise_app_prototype) returned.')

/** get_app_prototype's and get_app_spec's input. */
export const idInput = z.object({prototypeId})

/** revise_app_prototype's input: the change in the person's words, and any answers it changes. */
export const reviseInput = buildInput.partial().extend({
  prototypeId,
  change: z
    .string()
    .trim()
    .min(3)
    .max(800)
    .describe('What to change, in the person’s words: e.g. "make Home lead with this week’s classes", "a dark canvas", "add a screen for booking a class".'),
})

export type ReviseInput = z.infer<typeof reviseInput>

/** The answers a revision designs from: the last version's, with what changed, and every change asked for so far. */
export function revisedAnswers(previous: Answers, input: ReviseInput): Answers {
  const {prototypeId: _id, change, photoSearches: _p, ...changed} = input
  const asked = [previous.revision, change].filter(Boolean).join(' Then: ')
  return {...previous, ...answersOf(changed), revision: asked.slice(-1500)}
}

/** What the tool says back: the link, and what the person can do next. */
export function builtText(o: Options, link: string, drawing: boolean, revised = false) {
  return [
    drawing
      ? `Claude is designing ${revised ? `a new version of ${o.name}` : o.name} now, every screen: about 4 to 6 minutes. Here's the link, which fills in as each part is drawn and stays there to come back to: ${link}`
      : `Here's ${o.name}, as a quick sketch to tap through (Claude couldn't draw the full prototype this time): ${link}`,
    `"${o.tagline}"`,
    drawing && 'When it’s done, they tap through it as a member would (the landing page, onboarding, home, a session, their goal) and see the owner’s dashboard.',
    'To change anything, use revise_app_prototype with their words. For the full spec of every screen, to keep or hand to whoever builds it, use get_app_spec.',
  ]
    .filter(Boolean)
    .join('\n\n')
}

/** The prototype's spec as markdown: what it is, its look, every screen and where it leads, the calls Claude made, and the answers. */
export function specOf(o: Options, answers: Answers, job: Job | null, link: string) {
  const answered = QUESTIONS.filter((q) => q.key !== 'email' && q.key !== 'photo' && answers[q.key]?.trim()).map((q) => `- **${q.ask}** ${answers[q.key].trim()}`)
  const plan = job?.plan
  const title = (id: string) => plan?.units.find((u) => u.id === id)?.title ?? id
  return [
    `# ${o.name}`,
    `> ${o.tagline}`,
    plan?.summary ?? o.idea,
    `Prototype: ${link}`,
    `## Look\n\n- Accent: ${o.accent.toUpperCase()}${job?.look.style ? `\n- Canvas: ${job.look.style.canvas}\n- Corners: ${job.look.style.corners}\n- Type: ${job.look.style.type}` : ''}${o.inspiration ? `\n- Like: ${o.inspiration}` : ''}`,
    plan?.tabs.length && `## Navigation\n\n${plan.tabs.map((t) => `- ${t.label} → ${title(t.to)}`).join('\n')}`,
    plan?.units.length &&
      `## Screens\n\n${plan.units
        .map((u) => `### ${u.title} (${u.frame === 'phone' ? 'member app' : 'owner dashboard'}${u.steps > 1 ? `, ${u.steps} steps` : ''})\n\n${u.shows}${u.layout ? `\n\nLayout: ${u.layout}` : ''}${u.links.length ? `\n\nLeads to: ${u.links.map(title).join(', ')}` : ''}`)
        .join('\n\n')}`,
    plan?.world.length && `## What every screen shares\n\n${plan.world.map((w) => `- ${w}`).join('\n')}`,
    plan?.decisions.length && `## Calls made in the design\n\n${plan.decisions.map((d) => `- ${d}`).join('\n')}`,
    answers.revision && `## Changes asked for\n\n${answers.revision}`,
    answered.length && `## The answers it was designed from\n\n${answered.join('\n')}`,
    !plan && '_The full design isn’t drawn yet (or only a quick sketch was), so this spec has the answers alone._',
  ]
    .filter(Boolean)
    .join('\n\n')
}

export {resolveOptions}
