import {z} from 'zod'
import {PLATFORMS, QUESTIONS, TEMPLATES, asked, inStores, onWeb, resolveOptions, type Answers, type Options} from './options'
import {REFERENCES} from './references'
import {SCHEMES} from './schemes'

/**
 * The app builder as an MCP server (app/mcp/route.ts): the same questions, the same prototype and
 * the same "Build it with me", from inside Claude, ChatGPT or any MCP client. The client's own
 * model asks the questions and picks the photo searches, so a build costs Fohm nothing but a blob.
 * Aimed at people building health, fitness and wellness apps, first in London.
 */

export const SERVER_NAME = 'fohm-app-builder'
export const SERVER_TITLE = 'Fohm App Builder'

/** What kind of app it is, for who's asking: Fohm's focus is the first three. */
export const SECTORS = ['fitness', 'health', 'wellness', 'other'] as const
export type Sector = (typeof SECTORS)[number]

export const INSTRUCTIONS = `Fohm App Builder designs a first look at a health, fitness or wellness app (a coaching app, a training program, a studio's or a clinic's app, a wellbeing or habit app) and draws it as a prototype the person can tap through: its landing page, onboarding, home, program and the owner's dashboard, in their name, words and colour.

Fohm is Rob Honeybul's app studio in London. Its apps include Etapa (an AI cycling coach in the App Store and Google Play) and Naz (training and breathwork for big-wave surfers). The prototype is built on the same foundations.

How to use it:
1. Call app_builder_questions, then ask the person its questions in your own words, one or two at a time. Fill in what they have already told you; never make up their business. Once they've said what the app does, search the web for the apps already doing something like it, and tell them before going on: each app's name as a link, what it does, how close it comes to theirs and where theirs could differ, then the gaps it could own. When one comes close, flag it plainly as worth knowing, not a reason to stop (a market with a rival is a market), and ask how theirs will be different. Also find out the subject it's about before the questions that need it (search the web if you can): the sessions and exercises people in it really do, how they grade where they are, the milestones they build towards, the tests they measure by and what they log with. Then offer those back as picks in its own words: for a climbing app, limit bouldering and hangboard repeaters, a first V5 or a 7a redpoint, a max hang on a 20 mm edge, never vague categories. When you ask for their colour, offer its colour schemes by name, with how each feels, leading with those like the apps they said they like, and put the one they pick in scheme and its accent in accent. When they aren't sure of the app's name, ask what they want from one (a feel, a word or language, a letter it starts with, how long), then suggest a few short, ownable names that meet it and fit what they've told you, each with why it fits, and use the one they pick (with nameSure yes); otherwise keep theirs as a working name. When you ask which apps they like the look of, show its references: each app's name as a link to its Mobbin screen, and its look in a few words, so they can open them and pick, or name their own. Ask whether the app must do something specific to it (a route planner, a trip planner): when it must, ask how it works step by step, what it looks like and what it needs to know, so the prototype draws it. When someone has no logo, ask which app icons they like from its logos the same way: each name as a link to its Mobbin screen, and its mark in a few words.
2. Ask for their email last (they type it; never guess one), then call build_app_prototype with their answers. Claude designs every screen in about five minutes: show them the link straight away; the page fills in as it's drawn, and stays there to come back to.
3. If they want it built, offer to pass it to Fohm with contact_fohm. Call it only once they have asked for that. Never invent or guess an email.

Be plain about what this is: a free prototype from Fohm, a studio that builds apps for a fee.`

/** The questions, as the assistant should ask them: the website's, the email last, without the photo step (the chat picks searches). */
export function questionsForChat() {
  // Every question at once, those asked only after an earlier answer marked with onlyWhen.
  const qs = QUESTIONS.filter((q) => (q.onlyWhen || asked({}).includes(q)) && q.key !== 'photo' && q.key !== 'email')
  const email = QUESTIONS.find((q) => q.key === 'email')!
  return {
    intro:
      'Ask these in your own words, one or two at a time, skipping any the person has already answered. `name` and `email` are required (ask for the email last, and use only one the person types); everything else has a sensible default. Ask `features` for every app, suggesting the ones real to their activity (for sea kayaking: a route planner, a trip planner, a tide and wind check); when they name one, ask its follow-ups (`onlyWhen`) one at a time about that feature, until you could draw it: how it works step by step, what it looks like, and what it needs to know.',
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
        ...(q.key === 'logoLikes' ? {logos: REFERENCES.map(({name, mark, mobbin}) => ({name, mark, mobbin}))} : {}),
        ...(q.onlyWhen ? {onlyWhen: q.onlyWhen} : {}),
        ...(q.required ? {required: true} : {}),
      })),
      {key: 'sector', section: 'The idea', ask: 'Is it a fitness, health or wellness app?', choices: SECTORS.map((value) => ({value, label: value}))},
      {key: 'location', section: 'About you', ask: 'Where are you based?', why: 'Fohm is in London, and can meet in person there.', example: 'London'},
      {key: 'email', section: 'About you', ask: email.ask, why: `${email.why} Needed before the prototype is drawn: the person types it themselves.`, example: email.example, required: true},
    ],
    examples: TEMPLATES.filter((t) => t.kind === 'coaching').map((t) => ({value: t.value, app: t.label.replace(/^Like /, ''), what: t.hint, url: t.url})),
  }
}

const text = (max: number) => z.string().trim().max(max).optional()

/** build_app_prototype's input: the builder's answers by their keys, plus what the chat adds. */
export const buildInput = z.object({
  name: z.string().trim().min(1).max(60).describe('What the app is called. A working name is fine.'),
  email: z.string().trim().email().max(200).describe('The person’s email, as they typed it in this conversation: never guessed or taken from elsewhere. Fohm uses it only to get in touch about this app.'),
  idea: text(600).describe('In a sentence, what it does, and for whom.'),
  business: text(600).describe('What they do today: their business, coaching or content. Empty if the app is a new idea.'),
  template: z
    .enum(TEMPLATES.map((t) => t.value) as [string, ...string[]])
    .optional()
    .describe('The closest app already built: naz (programs and guided sessions), etapa (an AI coach that builds and changes a plan), aluzam (a real teacher or coach with their clients). Games: naz-surf, strawberry-fields.'),
  platforms: z
    .enum(PLATFORMS.map((p) => p.value) as [string, ...string[]])
    .optional()
    .describe('Where people use it: both (the App Store, Google Play and the web), mobile (the store apps only) or web (a web app only, nothing to install). Ask them; both if they have no preference.'),
  doing: text(600).describe('What people should be doing in the app. The headline is written from it.'),
  nameSure: z.enum(['yes', 'no']).optional().describe('Whether they are sure of the name.'),
  interests: text(300).describe('What people are there for, a few words comma-separated: tiles in onboarding.'),
  connects: text(300).describe('The apps or devices people already track with, comma-separated, e.g. "Concept2 Logbook, Garmin, Apple Health".').optional(),
  features: text(300).describe('What the app must do that’s specific to it, comma-separated, e.g. "Route planner, Trip planner". Empty or "none" if nothing.'),
  featureHow: text(600).describe('How each of those works, step by step, in their words: where someone starts, what they choose, what they end up with.'),
  featureLooks: text(300).describe('What each of those looks like, e.g. "A map with the route drawn, the trip as a list of days".'),
  featureData: text(300).describe('What each of those needs to know from the world, e.g. "Tide times, wind forecast, launch spots, campsites".'),
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
  logoLikes: text(300).describe('For someone without a logo: app icons they like, comma-separated by name from the logos list, e.g. Strava, Headspace.'),
  audience: text(300).describe('How big their audience is today.'),
  ambition: text(600).describe('What success would look like in a year.'),
  sector: z.enum(SECTORS).optional().describe('Fitness, health or wellness (or other).'),
  location: text(100).describe('Where they are based: a city.'),
  photoSearches: z
    .array(z.string().trim().min(2).max(40))
    .max(4)
    .optional()
    .describe('Up to four photo searches for the app’s photos: one to three plain words naming something a camera can photograph, best first, e.g. ["kettlebell training", "yoga studio", "park run"].'),
})

export type BuildInput = z.infer<typeof buildInput>

/** The answers the builder keeps, from the chat's input: the same keys the website saves. */
export function answersOf(input: BuildInput): Answers {
  const keys = new Set([...QUESTIONS.map((q) => q.key), 'sector', 'location', 'scheme'])
  const answers: Answers = {}
  for (const [k, v] of Object.entries(input)) if (keys.has(k) && typeof v === 'string' && v.trim()) answers[k] = v.trim()
  return answers
}

export const contactInput = z.object({
  prototypeId: z.string().regex(/^[a-f0-9]{32}$/).describe('The id build_app_prototype returned.'),
  name: z.string().trim().min(1).max(100).describe('Their name, as they typed it.'),
  email: z.string().trim().email().max(200).describe('The email they gave for the prototype, or another they typed. Never guessed.'),
  note: z.string().trim().max(1000).optional().describe('Anything else they want Rob to know: timing, budget, what matters most.'),
})

export type ContactInput = z.infer<typeof contactInput>

export const isLondon = (location?: string) => /\blondon\b/i.test(location ?? '')

/** Words for the health side, where it applies: what Fohm already does that a health app needs. */
function sectorLine(sector?: string) {
  if (sector === 'health')
    return 'Health data is special-category data under UK GDPR: Fohm builds in the consent, age checks and data rules a health app needs from day one, as it did for Naz.'
  if (sector === 'fitness' || sector === 'wellness')
    return 'It comes with what a fitness or wellness app needs to sell: subscriptions in the App Store and Google Play, analytics, and a dashboard for the coach.'
  return ''
}

/** Where the real app ships, in words: the stores, the web, or both. */
const whereItShips = (o: Options) =>
  [onWeb(o) && 'the web', inStores(o) && 'the App Store and Google Play'].filter(Boolean).join(', ')

/** What the tool says back: the link, what happens next, and the way to build it. */
export function builtText(o: Options, link: string, drawing: boolean, sector?: string, location?: string) {
  return [
    drawing
      ? `Claude is designing ${o.name} now, every screen from these answers: about 4 to 6 minutes. Here's the link, which fills in as each part is drawn and stays to come back to: ${link}`
      : `Here's ${o.name}, as a quick sketch to tap through (Claude couldn't draw the full prototype this time): ${link}`,
    `"${o.tagline}"`,
    drawing && 'When it’s done they tap through it as a member would (the landing page, onboarding, home, a session, their goal) and see the owner’s dashboard and what it takes to launch.',
    sectorLine(sector),
    `To build it for real (${whereItShips(o)}), they can book a free call or leave their details on that page, or ask you to send it to Fohm with contact_fohm${isLondon(location) ? ': Fohm is in London and can meet in person' : ''}.`,
  ]
    .filter(Boolean)
    .join('\n\n')
}

export {resolveOptions}
