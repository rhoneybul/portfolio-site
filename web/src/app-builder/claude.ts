/**
 * Claude, through the Anthropic API (ANTHROPIC_API_KEY, in Doppler's portfolio-site-web project,
 * synced to Vercel). Off until the key is set: the builder then shows its quick sketch instead.
 * Server only: the key never reaches the browser.
 */

import {meterStore, type Usage} from './cost'

// ANTHROPIC_BASE_URL, as Anthropic's own SDKs read it: a proxy, or a stand-in when testing.
const API = `${(process.env.ANTHROPIC_BASE_URL || 'https://api.anthropic.com').replace(/\/+$/, '')}/v1/messages`

export const claudeOn = () => Boolean(process.env.ANTHROPIC_API_KEY)

/** The model that plans the app, and the one that draws its screens (several at once, so a faster one). */
export const PLAN_MODEL = () => process.env.PROTOTYPE_PLAN_MODEL || 'claude-opus-5-5'
export const DRAW_MODEL = () => process.env.PROTOTYPE_MODEL || 'claude-sonnet-5-5'

/** A part of the user's message: text, or an image Anthropic fetches from its URL. */
export type UserBlock = {type: 'text'; text: string} | {type: 'image'; source: {type: 'url'; url: string}}

export class ClaudeError extends Error {
  constructor(
    message: string,
    readonly status = 0,
  ) {
    super(message)
  }
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

/**
 * One message, its text back. The system prompt comes in parts, each kept in Anthropic's prompt
 * cache: the kit and the rules are the same for every screen, and the app's plan for every screen
 * of one app. Busy or rate-limited answers are tried again, twice, inside the deadline.
 */
export async function askClaude({
  model,
  system,
  user,
  maxTokens,
  deadline,
  schema,
}: {
  model: string
  system: string[]
  /** The message: text, or content blocks (text and images by URL). */
  user: string | UserBlock[]
  maxTokens: number
  /** Epoch ms by which an answer is needed. */
  deadline: number
  /** A JSON schema the answer must follow (structured outputs): the answer is then always valid JSON. */
  schema?: Record<string, unknown>
}): Promise<string> {
  const key = process.env.ANTHROPIC_API_KEY
  if (!key) throw new ClaudeError('ANTHROPIC_API_KEY is not set')
  const body = JSON.stringify({
    model,
    max_tokens: maxTokens,
    system: system.map((text) => ({type: 'text', text, cache_control: {type: 'ephemeral'}})),
    messages: [{role: 'user', content: user}],
    ...(schema ? {output_config: {format: {type: 'json_schema', schema}}} : {}),
  })

  for (let attempt = 0; ; attempt++) {
    const left = deadline - Date.now()
    if (left < 5_000) throw new ClaudeError('Out of time')
    let res: Response
    try {
      res = await fetch(API, {
        method: 'POST',
        headers: {'x-api-key': key, 'anthropic-version': '2023-06-01', 'content-type': 'application/json'},
        body,
        signal: AbortSignal.timeout(left),
      })
    } catch (e) {
      throw new ClaudeError(e instanceof Error ? e.message : 'No answer')
    }
    if (res.ok) {
      const json = (await res.json()) as {content?: {type: string; text?: string}[]; stop_reason?: string; usage?: Usage}
      // Counted for whatever this call is part of (cost.ts), even an answer that's then thrown away.
      meterStore.getStore()?.add(model, json.usage)
      const text = (json.content ?? []).filter((c) => c.type === 'text').map((c) => c.text ?? '').join('')
      if (!text) throw new ClaudeError('An empty answer')
      if (json.stop_reason === 'max_tokens') console.warn('[claude] stopped at max_tokens', model)
      return text
    }
    const retry = res.status === 429 || res.status === 529 || res.status >= 500
    const detail = await res.text().catch(() => '')
    if (!retry || attempt >= 2) throw new ClaudeError(`Anthropic ${res.status}: ${detail.slice(0, 200)}`, res.status)
    const after = Number(res.headers.get('retry-after'))
    await wait(Math.min(Number.isFinite(after) && after > 0 ? after * 1000 : 2_000 * 2 ** attempt, 20_000))
  }
}
