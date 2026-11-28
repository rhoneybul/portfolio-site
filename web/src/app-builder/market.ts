/**
 * Market research for a visitor's app: the apps already doing something like it, how each sells
 * itself, and the gaps theirs could own, found by Claude searching the web (askClaudeWithSearch)
 * and shown on the deck's Market slide. Kept beside the prototype once found, so it's searched once
 * per app, from the facts the prototype was drawn from. The prompt and the reading of the answer are plain, for the server; the types are shared.
 */
import type {Source} from './claude'

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
}

export interface Market {
  /** The market in a sentence or two. */
  summary: string
  rivals: Rival[]
  /** What the apps there leave undone, each a line. */
  gaps: string[]
  /** Where this app could stand: one line it could own. */
  position: string
  /** The pages the research cites. */
  sources: Source[]
  at: string
}

export const MARKET_SYSTEM = `You research the market for a new app before it is built, for its owner, who is not technical.
Search the web for the apps already doing what theirs will do: direct rivals first, then the apps people use instead.
Read their own sites and store pages; never guess a price or a claim, and leave a price empty when the site doesn't give one.
Then say what they leave undone that this owner could do well, from what the owner has told you, and where the app could stand.
Plain English, short lines, no emoji, no hype, no jargon a business owner wouldn't use.
Answer with one JSON object and nothing after it:
{"summary": "the market in one or two sentences", "rivals": [{"name": "", "url": "", "what": "what it does, one line", "pitch": "who it's for and what it promises, one line", "price": "as its site says, or empty"}], "gaps": ["one gap a line"], "position": "one line this app could own"}
Four to six rivals, three or four gaps.`

/** From the facts the prototype was drawn from (factsOf: what the owner said, never their email or address). */
export const marketPrompt = (facts: string) => `What the owner has said about their app:\n${facts.slice(0, 6_000)}\n\nResearch its market.`

const text = (v: unknown, most: number) => (typeof v === 'string' ? v.replace(/\s+/g, ' ').trim().slice(0, most) : '')
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
    .map((r) => ({name: text(r.name, 60), url: link(r.url), what: text(r.what, 200), pitch: text(r.pitch, 200), price: text(r.price, 80)}))
    .filter((r) => r.name && r.what)
    .slice(0, 6)
  const gaps = (Array.isArray(raw.gaps) ? raw.gaps : []).map((g) => text(g, 240)).filter(Boolean).slice(0, 4)
  if (!rivals.length || !gaps.length) throw new Error('The research came back empty')
  return {
    summary: text(raw.summary, 400),
    rivals,
    gaps,
    position: text(raw.position, 240),
    sources: sources.filter((s) => link(s.url)).slice(0, 12),
    at: at.toISOString(),
  }
}
