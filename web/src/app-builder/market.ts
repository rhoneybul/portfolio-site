/**
 * Market research for a visitor's app: the apps already doing something like it, how close each
 * comes, how each sells itself, and the gaps theirs could own, found by Claude searching the web
 * (askClaudeWithSearch). Started in the conversation as soon as they've said what the app does
 * (kept by the idea's key, shown in the chat and given to the next questions), then copied beside
 * the prototype for the deck's Market slide; a prototype with none is researched from its facts. The prompt and the reading of the answer are plain, for the server; the types are shared.
 */
import type {Source} from './claude'

/** How close an app comes to theirs: doing the same thing for the same people, part of it, or what people use instead. */
export type Overlap = 'close' | 'some' | 'instead'
export const OVERLAPS: Overlap[] = ['close', 'some', 'instead']

/** An app already in the market. */
export interface Rival {
  name: string
  /** Its own site or store page. */
  url: string
  /** What it does, in a line. */
  what: string
  /** How it sells itself: who it's for and what it promises. */
  pitch: string
  /** What it costs, as its site says, when it says. */
  price: string
  /** How close it comes (absent on research kept before it was asked). */
  overlap?: Overlap
  /** Where theirs could be different from it, in a line. */
  edge?: string
}

export interface Market {
  /** The market in a sentence or two. */
  summary: string
  rivals: Rival[]
  /** What the apps there leave undone, each a line. */
  gaps: string[]
  /** Where this app could stand: one line it could own. */
  position: string
  /** The app closest to theirs, said plainly: worth knowing, rarely a reason to stop (empty when none comes close). */
  flag?: string
  /** The pages the research cites. */
  sources: Source[]
  at: string
}

export const MARKET_SYSTEM = `You research the market for a new app before it is built, for its owner, who is not technical.
Search the web for the apps already doing what theirs will do: direct rivals first, then the apps and ways people use instead (a spreadsheet, a coach's WhatsApp group, a generic app).
Read their own sites and store pages; never guess a price or a claim, and leave a price empty when the site doesn't give one.
For each, say how close it comes: "close" (the same thing for the same people), "some" (part of it, or for different people) or "instead" (what people use today in its place); and where this app could be different from it.
When one comes close, say so plainly in the flag: which app, what it already does that this one would, and why that is worth knowing rather than a reason to stop (a market with a rival is a market), with what to do about it. Leave the flag empty when none comes close. Never call a rival a blocker unless it truly does everything this app would, for the same people, and well.
Then say what they leave undone that this owner could do well, from what the owner has told you, and where the app could stand.
Plain English, short lines, no emoji, no hype, no jargon a business owner wouldn't use.
Answer with one JSON object and nothing after it:
{"summary": "the market in one or two sentences", "rivals": [{"name": "", "url": "", "what": "what it does, one line", "pitch": "who it's for and what it promises, one line", "price": "its plain price as its site says, under 50 characters (Free, or £4.99 a month), or empty", "overlap": "close | some | instead", "edge": "where this app could be different, one line"}], "flag": "the closest app, plainly, or empty", "gaps": ["one gap a line"], "position": "one line this app could own"}
Four to six rivals, the closest first, and three or four gaps.`

/** From the facts the prototype was drawn from (factsOf: what the owner said, never their email or address). */
export const marketPrompt = (facts: string) => `What the owner has said about their app:\n${facts.slice(0, 6_000)}\n\nResearch its market.`

/** From what the owner said the app does in the conversation, before anything is drawn: never their email. */
export const ideaMarketPrompt = (idea: string, business = '') =>
  marketPrompt(`What the app does, and for whom: ${idea.slice(0, 600)}${business.trim() ? `\nThe business behind it: ${business.slice(0, 600)}` : ''}`)

const text = (v: unknown, most: number) => (typeof v === 'string' ? v.replace(/\s+/g, ' ').trim().slice(0, most) : '')
/** Cut to size at a word, with an ellipsis, never mid-word ("…a 14-day free tria"). */
const clipped = (v: unknown, most: number) => {
  const all = text(v, 1_000)
  if (all.length <= most) return all
  const cut = all.slice(0, most - 1)
  return `${cut.slice(0, Math.max(cut.lastIndexOf(' '), most / 2)).replace(/[\s,;:(–-]+$/, '')}…`
}

const link = (v: unknown) => {
  const s = text(v, 300)
  try {
    const u = new URL(s)
    return u.protocol === 'https:' || u.protocol === 'http:' ? u.toString() : ''
  } catch {
    return ''
  }
}

/** The answer read as a Market: the JSON from its first `{` to its last `}`, every field checked and cut to size. Throws when there's none. */
export function readMarket(answer: string, sources: Source[], at = new Date()): Market {
  const start = answer.indexOf('{')
  const end = answer.lastIndexOf('}')
  if (start < 0 || end <= start) throw new Error('No research in the answer')
  const raw = JSON.parse(answer.slice(start, end + 1)) as Record<string, unknown>
  const rivals = (Array.isArray(raw.rivals) ? raw.rivals : [])
    .map((r) => r as Record<string, unknown>)
    .map((r) => ({
      name: text(r.name, 60),
      url: link(r.url),
      what: text(r.what, 200),
      pitch: text(r.pitch, 200),
      price: clipped(r.price, 60),
      overlap: OVERLAPS.find((o) => o === text(r.overlap, 10).toLowerCase()) ?? 'some',
      edge: text(r.edge, 200),
    }))
    .filter((r) => r.name && r.what)
    .slice(0, 6)
    // The closest first, whatever order they came in.
    .sort((a, b) => OVERLAPS.indexOf(a.overlap) - OVERLAPS.indexOf(b.overlap))
  const gaps = (Array.isArray(raw.gaps) ? raw.gaps : []).map((g) => text(g, 240)).filter(Boolean).slice(0, 4)
  if (!rivals.length || !gaps.length) throw new Error('The research came back empty')
  return {
    summary: text(raw.summary, 400),
    rivals,
    gaps,
    position: text(raw.position, 240),
    flag: text(raw.flag, 400),
    sources: sources.filter((s) => link(s.url)).slice(0, 12),
    at: at.toISOString(),
  }
}

/** The research as lines for a prompt: the apps there, how close each comes, and the gaps. */
export function marketSaid(m: Market) {
  return [
    m.summary,
    `The apps already there:\n${m.rivals.map((r) => `- ${r.name} (${r.overlap ?? 'some'} overlap): ${r.what}${r.edge ? ` Where theirs could differ: ${r.edge}` : ''}`).join('\n')}`,
    m.flag && `The closest: ${m.flag}`,
    `What they leave undone:\n${m.gaps.map((g) => `- ${g}`).join('\n')}`,
    m.position && `Where this app could stand: ${m.position}`,
  ]
    .filter(Boolean)
    .join('\n\n')
}
