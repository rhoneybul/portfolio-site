/**
 * What Claude cost for one visitor's run through the app builder: every call's tokens, priced by
 * its model, added up so Slack can say what a submission cost. A build on the server is metered as
 * it runs (meterStore: askClaude adds each answer's usage to the meter of the work it's part of); the
 * questions asked before it come from the visitor's browser as one total (cleanSpend). Server only.
 */
import {AsyncLocalStorage} from 'node:async_hooks'

/** The usage an answer from the Messages API reports. */
export interface Usage {
  input_tokens?: number
  output_tokens?: number
  cache_read_input_tokens?: number
  cache_creation_input_tokens?: number
}

/** Tokens and dollars, added up. */
export interface Spend {
  calls: number
  input: number
  output: number
  cacheRead: number
  cacheWrite: number
  usd: number
}

/** US dollars per million tokens (Anthropic's list prices, Nov 2026). A cache write costs 1.25 times the input price. */
const PRICES: Record<string, {input: number; output: number; cacheRead: number}> = {
  'claude-opus-5-5': {input: 4, output: 20, cacheRead: 0.2},
  'claude-sonnet-5-5': {input: 2, output: 10, cacheRead: 0.1},
  'claude-haiku-5-5': {input: 0.1, output: 0.5, cacheRead: 0.01},
  'claude-fable-5-2': {input: 8, output: 40, cacheRead: 0.2},
}

export const noSpend = (): Spend => ({calls: 0, input: 0, output: 0, cacheRead: 0, cacheWrite: 0, usd: 0})

/** One answer's tokens and what they cost; a model not in the table is priced as Opus. */
export function spendOf(model: string, u: Usage = {}): Spend {
  const p = PRICES[model] ?? PRICES['claude-opus-5-5']
  const input = u.input_tokens ?? 0
  const output = u.output_tokens ?? 0
  const cacheRead = u.cache_read_input_tokens ?? 0
  const cacheWrite = u.cache_creation_input_tokens ?? 0
  const usd = (input * p.input + output * p.output + cacheRead * p.cacheRead + cacheWrite * p.input * 1.25) / 1_000_000
  return {calls: 1, input, output, cacheRead, cacheWrite, usd}
}

export const addSpend = (a: Spend, b: Spend): Spend => ({
  calls: a.calls + b.calls,
  input: a.input + b.input,
  output: a.output + b.output,
  cacheRead: a.cacheRead + b.cacheRead,
  cacheWrite: a.cacheWrite + b.cacheWrite,
  usd: a.usd + b.usd,
})

/** A running total, for the work it's attached to. */
export class Meter {
  spent = noSpend()
  add(model: string, usage?: Usage) {
    this.spent = addSpend(this.spent, spendOf(model, usage))
  }
}

/** The meter of the work under way, if it's metered. */
export const meterStore = new AsyncLocalStorage<Meter>()

/** Runs `work` with `meter` counting every Claude call in it, however deep. */
export const metered = <T,>(meter: Meter, work: () => Promise<T>) => meterStore.run(meter, work)

/** A total sent by a browser, checked: numbers only, within reason, or nothing. */
export function cleanSpend(raw: unknown): Spend {
  const r = (raw ?? {}) as Record<string, unknown>
  const n = (v: unknown, most: number) => (typeof v === 'number' && Number.isFinite(v) && v >= 0 ? Math.min(v, most) : 0)
  return {calls: n(r.calls, 500), input: n(r.input, 5e7), output: n(r.output, 5e7), cacheRead: n(r.cacheRead, 5e8), cacheWrite: n(r.cacheWrite, 5e7), usd: n(r.usd, 500)}
}

const tokens = (n: number) => (n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${Math.round(n / 1e3)}k` : String(Math.round(n)))

/** In a line, for Slack: "$1.84 · 21 calls · 312k in, 1.1M from cache · 96k out". */
export const spendLine = (s: Spend) =>
  `$${s.usd.toFixed(2)} · ${s.calls} call${s.calls === 1 ? '' : 's'} · ${tokens(s.input + s.cacheWrite)} in${s.cacheRead ? `, ${tokens(s.cacheRead)} from cache` : ''} · ${tokens(s.output)} out`
