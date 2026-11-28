import {NextResponse} from 'next/server'
import {askClaude, claudeOn} from '@/app-builder/claude'
import {Meter, metered} from '@/app-builder/cost'
import {builderPaused} from '@/app-builder/switch'
import {readIdeaMarket, readSubject} from '@/app-builder/prototypes'
import {marketSaid, type Market} from '@/app-builder/market'
import {addressOf, limiter} from '@/app-builder/rate-limit'
import {subjectKey, subjectSaid, type Subject} from '@/app-builder/subject'
import {cleanRequest, cleanTurn, fallbackNext, needsClaude, plain, rowsFor, saidSoFar, type Next} from '@/app-builder/next-question'

/**
 * The app builder's next question, chosen by Claude from what the visitor has said so far
 * (claude-opus-5-5 through Anthropic's API: the questions and their picks are the first thing a visitor judges), like fohm-scaffold's discovery chat: the most
 * important row still to ask, in their words, with picks for their app. Its answer is checked
 * (cleanTurn), and on anything wrong, or without Claude, the next row comes from the fixed order.
 * Each address asks Claude at most PER_ADDRESS times an hour (a whole run is about 15); past that,
 * the fixed order carries on, so nobody is stopped mid-way and nobody can run up a bill.
 */

const PER_ADDRESS = {most: 60, window: 60 * 60_000}
const allowed = limiter()

const MODEL = process.env.BUILDER_QUESTIONS_MODEL || 'claude-opus-5-5'

// Opus takes longer than Haiku did; the browser waits a little longer than this (CHOOSING in app-builder.tsx).
const THINKING_MS = 22_000
export const maxDuration = 30

const SYSTEM = `You run a short, friendly interview that gathers what's needed to design a first prototype of someone's app.
They answer one question to a screen. You choose the next question from the rows still to ask, given what they've said so far.

Choose:
- The most important row their answers make relevant, keeping roughly to the parts' order (part 1 the idea, part 2 how it works, part 3 how it looks and the practical bits).
- Never ask what they've already told you, in any words. If an earlier answer already gives a row's answer, choose that row with a "prefill" for them to confirm with a tap, or skip it; for a row with choices the prefill is one of its values.
- idea, doing, interests and goals all touch what people want from the app; each has one job: idea is what it does and for whom; doing is what people do in it day to day; interests are the parts people choose between (onboarding's tiles); goals is one concrete thing they work towards. Ask each only for what the others haven't said: when an answer already covers another, prefill it or skip it, and never ask what people want to achieve twice. ambition is the owner's business, never their members'.
- The template row names one of Fohm's own apps (Naz, Etapa, Aluzam...) whose look they'd borrow: never their app. Until they've answered the name row, their app has no name: say "the app" or "your app", never another app's name.
- connects is the real devices, machines and services their members already record with (for rowing: Concept2 Logbook and its PM5 monitor, Garmin, Apple Health, Strava). Suggest the real ones for their activity by name; skip it only when nothing like that exists for it.
- features is what this app must do that's specific to it, beyond programs, sessions and a library: a route planner, a trip planner, a booking calendar, a tide and wind check. Suggest the real ones for their activity (sea kayaking: Route planner, Trip planner, Tide and wind check, Kit list); when idea or doing already names one, prefill it. Ask it straight after doing.
- featureHow, featureLooks and featureData follow a named feature up until it could be drawn and built, one a turn: how it works step by step (where someone starts, what they choose, what they end up with), the screen it is drawn on, and what it reads from the world. Word each about the feature they named, in their activity ("Walk me through planning a kayak trip: where do they start, and what do they end up with?"), with suggestions from that feature's world (for a trip planner's look: A day-by-day list, A map with each day's leg, Camps on the map, The kit list), and for featureHow, an example that walks it through. With two features, ask about both in one question. Their answers show what to ask next: never ask what an earlier one said.
- Rows their answers make pointless (no content to link for a brand-new idea, say) go in "skip". Never skip a row marked "Never skip".

Word it:
- "ask": the row's question reworded in their world, using their words (their sport, their members, their business). One short question, plain English, no emoji, under 120 characters.
- "why": one short line on why it's asked or what it becomes, under 160 characters.
- "suggestions": short example answers tailored to their app (a few words each), only for rows answered by typing that don't have their own suggestions. Make them answers this owner could really give: specific to their sport, members and business, different from one another, and never generic filler ("Track progress", "Stay motivated"). Each is one item with no comma.
- "example": for a row answered by typing, one realistic example answer in their world, under 80 characters, shown faintly in the empty box. Never the same as a suggestion.
- "multi": true when people would pick several of the suggestions together (the parts of the app, goals, kinds of content, the apps they like), false when one answers it (who it's for, a price, a name). With multi give four to six suggestions, without it three or four.

Know the subject:
- When research on the subject comes with their answers, it is what an expert in their activity knows: the sessions and exercises people really do, how they grade where they are, what they build towards, the tests they measure by, what holds them back, what they log with. Use it on every question: suggestions are its real names and numbers (for climbing: "Limit bouldering", "Hangboard repeaters", "A first V5", "A 7a redpoint", "Max hang on 20 mm"), never vague categories. For interests, offer its disciplines and kinds of training; for goals, its milestones across the levels, beginner to strong; for doing, what a week of its sessions looks like; for connects, what it says people log with.
- Ask in its words, and when it shows a choice that shapes the app (which discipline, which level they start from, a benchmark to take first), ask that inside the row it belongs to, offering the options.
- Their own words win: never contradict what they said, and leave out what they said the app doesn't do.

Know the market:
- When research on the market comes with their answers, it is the apps already doing something like theirs and what they leave undone. Use it where it shapes the app: when asking what makes it different, its features or who it's for, suggest the gaps it found, and when an app comes close, ask in that row how theirs will be different from it (naming the app). Never tell them to stop because a rival exists.

Be a sharp product designer, not a form: each question should show you understood what they said, and move their app forward. Ask about what's specific to their app, not about apps in general.

Reply with JSON only:
{"key": "doing", "ask": "...", "why": "...", "example": "...", "suggestions": ["...", "..."], "multi": false, "prefill": "...", "skip": ["content"]}
Leave out "prefill", "example", "suggestions", "multi" or "skip" when they don't apply.`

// One instance's memory: the same answers never ask twice.
const known = new Map<string, Next>()

// The subject research found for an idea (/api/builder/subject), once found; an idea not yet researched is looked for again next time.
const subjects = new Map<string, Subject>()

async function subjectOf(said = '') {
  const idea = plain(said, 600)
  if (idea.length < 12) return null
  const key = subjectKey(idea)
  const found = subjects.get(key) ?? (await readSubject(key).catch(() => null))
  if (found) {
    if (subjects.size > 200) subjects.clear()
    subjects.set(key, found)
  }
  return found
}

// The market researched for an idea (/api/builder/market), once found, like its subject.
const markets = new Map<string, Market>()

async function marketOf(said = '') {
  const idea = plain(said, 600)
  if (idea.length < 12) return null
  const key = subjectKey(idea)
  const found = markets.get(key) ?? (await readIdeaMarket(key).catch(() => null))
  if (found) {
    if (markets.size > 200) markets.clear()
    markets.set(key, found)
  }
  return found
}

export async function POST(request: Request) {
  const {answers, done} = cleanRequest(await request.json().catch(() => null))
  const fallback = fallbackNext(answers, done)
  if (!claudeOn() || !needsClaude(answers, done) || (await builderPaused())) return NextResponse.json({...fallback, from: 'order'})

  const [subject, market] = await Promise.all([subjectOf(answers.idea), marketOf(answers.idea)])
  const cacheKey = JSON.stringify([answers, done, Boolean(subject), Boolean(market)])
  const cached = known.get(cacheKey)
  if (cached) return NextResponse.json({...cached, from: 'claude'})
  if (!allowed(`address:${addressOf(request)}`, PER_ADDRESS)) return NextResponse.json({...fallback, from: 'order'})

  const meter = new Meter()
  try {
    const text = await metered(meter, () => askClaude({
      model: MODEL,
      system: [SYSTEM],
      user: `What they've said so far:\n${saidSoFar(answers, done) || '- Nothing yet'}\n\n${subject ? `Research on the subject their app is about:\n${subjectSaid(subject)}\n\n` : ''}${market ? `Research on the market for their app:\n${marketSaid(market)}\n\n` : ''}The rows still to ask:\n${rowsFor(answers, done)}`,
      maxTokens: 1_200,
      deadline: Date.now() + THINKING_MS,
    }))
    const turn = cleanTurn(JSON.parse(text.match(/\{[\s\S]*\}/)?.[0] ?? '{}'), answers, done)
    if (known.size > 500) known.clear()
    known.set(cacheKey, turn)
    return NextResponse.json({...turn, from: 'claude', spent: meter.spent})
  } catch (e) {
    console.warn('builder/next: the fixed order instead of Claude', e instanceof Error ? e.message : e)
    return NextResponse.json({...fallback, from: 'order', spent: meter.spent})
  }
}
