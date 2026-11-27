/**
 * The app builder's off switch, so it can be stopped from a phone without a deploy: Site settings →
 * App builder → Paused, in the Studio (fohm.sanity.studio), or APP_BUILDER_OFF=1 on Vercel (which
 * needs a redeploy). Paused, the page says so and offers a call, and every route that asks Claude
 * refuses: nothing more is spent. Read at most every 30 seconds per instance; if Sanity can't be
 * asked within a couple of seconds, the builder stays on. Server only.
 */
import {client} from '@/sanity/client'

export interface BuilderSwitch {
  paused: boolean
  /** What the page says while it's paused, when the Studio gives a line of its own. */
  message: string
}

const QUERY = `*[_type == "siteSettings" && _id == "siteSettings"][0]{appBuilderPaused, appBuilderPausedMessage}`
const FRESH = 30_000

let known: {at: number; value: BuilderSwitch} | null = null

export async function builderSwitch(): Promise<BuilderSwitch> {
  if (process.env.APP_BUILDER_OFF === '1') return {paused: true, message: ''}
  if (known && Date.now() - known.at < FRESH) return known.value
  try {
    const found = await client
      .withConfig({useCdn: false})
      .fetch<{appBuilderPaused?: boolean; appBuilderPausedMessage?: string} | null>(QUERY, {}, {cache: 'no-store', signal: AbortSignal.timeout(2_500)})
    const value = {paused: Boolean(found?.appBuilderPaused), message: String(found?.appBuilderPausedMessage ?? '').trim().slice(0, 300)}
    known = {at: Date.now(), value}
    return value
  } catch {
    return known?.value ?? {paused: false, message: ''}
  }
}

export const builderPaused = async () => (await builderSwitch()).paused

/** What a route that asks Claude answers while the builder is paused. */
export const PAUSED = {error: 'The app builder is paused for now. Book a call and I’ll design it with you.', paused: true}
