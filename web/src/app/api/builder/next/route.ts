import {NextResponse} from 'next/server'
import {askClaude, claudeOn} from '@/app-builder/claude'
import {addressOf, limiter} from '@/app-builder/rate-limit'
import {cleanRequest, cleanTurn, fallbackNext, needsClaude, rowsFor, saidSoFar, type Next} from '@/app-builder/next-question'

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
- Rows their answers make pointless (no content to link for a brand-new idea, say) go in "skip". Never skip a row marked "Never skip".

Word it:
- "ask": the row's question reworded in their world, using their words (their sport, their members, their business). One short question, plain English, no emoji, under 120 characters.
- "why": one short line on why it's asked or what it becomes, under 160 characters.
- "suggestions": short example answers tailored to their app (a few words each), only for rows answered by typing that don't have their own suggestions. Make them answers this owner could really give: specific to their sport, members and business, different from one another, and never generic filler ("Track progress", "Stay motivated"). Each is one item with no comma.
- "multi": true when people would pick several of the suggestions together (the parts of the app, goals, kinds of content, the apps they like), false when one answers it (who it's for, a price, a name). With multi give four to six suggestions, without it three or four.

Be a sharp product designer, not a form: each question should show you understood what they said, and move their app forward. Ask about what's specific to their app, not about apps in general.

Reply with JSON only:
{"key": "doing", "ask": "...", "why": "...", "suggestions": ["...", "..."], "multi": false, "prefill": "...", "skip": ["content"]}
Leave out "prefill", "suggestions", "multi" or "skip" when they don't apply.`

// One instance's memory: the same answers never ask twice.
const known = new Map<string, Next>()

export async function POST(request: Request) {
  const {answers, done} = cleanRequest(await request.json().catch(() => null))
  const fallback = fallbackNext(answers, done)
  if (!claudeOn() || !needsClaude(answers, done)) return NextResponse.json({...fallback, from: 'order'})

  const cacheKey = JSON.stringify([answers, done])
  const cached = known.get(cacheKey)
  if (cached) return NextResponse.json({...cached, from: 'claude'})
  if (!allowed(`address:${addressOf(request)}`, PER_ADDRESS)) return NextResponse.json({...fallback, from: 'order'})

  try {
    const text = await askClaude({
      model: MODEL,
      system: [SYSTEM],
      user: `What they've said so far:\n${saidSoFar(answers, done) || '- Nothing yet'}\n\nThe rows still to ask:\n${rowsFor(answers, done)}`,
      maxTokens: 1_200,
      deadline: Date.now() + THINKING_MS,
    })
    const turn = cleanTurn(JSON.parse(text.match(/\{[\s\S]*\}/)?.[0] ?? '{}'), answers, done)
    if (known.size > 500) known.clear()
    known.set(cacheKey, turn)
    return NextResponse.json({...turn, from: 'claude'})
  } catch (e) {
    console.warn('builder/next: the fixed order instead of Claude', e instanceof Error ? e.message : e)
    return NextResponse.json({...fallback, from: 'order'})
  }
}
