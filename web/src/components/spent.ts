/**
 * What Claude has cost so far in this tab's run through the app builder, before the build: each
 * route that asks Claude for the visitor (the next question, the photo searches, more logo ideas)
 * says what its call cost, and it's added up here, then sent with the build for Slack's total
 * (app-builder/cost.ts). Plain counting in the browser.
 */
import type {Spend} from '@/app-builder/cost'

let total: Spend = {calls: 0, input: 0, output: 0, cacheRead: 0, cacheWrite: 0, usd: 0}

/** Adds what one answer from the server says it cost, if it says. */
export function addSpent(s: unknown) {
  const r = s as Partial<Spend> | null | undefined
  if (!r || typeof r.usd !== 'number') return
  const n = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : 0)
  total = {
    calls: total.calls + n(r.calls),
    input: total.input + n(r.input),
    output: total.output + n(r.output),
    cacheRead: total.cacheRead + n(r.cacheRead),
    cacheWrite: total.cacheWrite + n(r.cacheWrite),
    usd: total.usd + n(r.usd),
  }
}

export const spentSoFar = () => total

/** Back to nothing: a new app from the first question. */
export function resetSpent() {
  total = {calls: 0, input: 0, output: 0, cacheRead: 0, cacheWrite: 0, usd: 0}
}
