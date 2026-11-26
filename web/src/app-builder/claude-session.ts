/**
 * Starts a Claude Code cloud session that builds a submission's app, from the submission's page: the owner taps
 * Start in Claude, and a scheduled task on the owner's claude.ai account (its API trigger) starts a fresh session on
 * fohm-scaffold, handed the brief's keyed links. The task's own prompt says what to do with them (docs in README.md,
 * "Start in Claude"). Off until CLAUDE_BUILD_FIRE_URL and CLAUDE_BUILD_TOKEN are set, both in Doppler's
 * portfolio-site-web project, synced to Vercel. Each start is kept beside the submission (sessions/<id>.json) and
 * told to Slack. Server only.
 */
import {get, put} from '@vercel/blob'
import {submissionsOn, type Submission} from './submissions'

const fireUrl = () => process.env.CLAUDE_BUILD_FIRE_URL ?? ''
const token = () => process.env.CLAUDE_BUILD_TOKEN ?? ''

/** The beta the fire endpoint asks for (code.claude.com/docs/en/routines). */
const BETA = 'experimental-cc-routine-2026-04-01'

export const startOn = () => /^https:\/\/api\.anthropic\.com\/v1\/claude_code\/routines\/[\w-]+\/fire$/.test(fireUrl()) && token().length > 0

export interface Started {
  at: string
  url: string
}

const path = (id: string) => `sessions/${id}.json`

/** The session last started for a submission, if one was. */
export async function startedFor(s: Submission): Promise<Started | null> {
  if (!submissionsOn()) return null
  const found = await get(path(s.id), {access: 'private', useCache: false}).catch(() => null)
  return found?.stream ? (JSON.parse(await new Response(found.stream).text()) as Started) : null
}

/** What the session is handed: the brief's links, and nothing the visitor typed. */
export const handover = (briefUrl: string, briefJsonUrl: string) =>
  [
    'An app builder submission to build with fohm-scaffold.',
    `The brief (markdown): ${briefUrl}`,
    `The brief (JSON, for fohm-scaffold new --from): ${briefJsonUrl}`,
  ].join('\n')

/** Fires the task and keeps the session's link; throws with what went wrong. */
export async function startSession(s: Submission, briefUrl: string, briefJsonUrl: string): Promise<Started> {
  if (!startOn()) throw new Error('Start in Claude is off: set CLAUDE_BUILD_FIRE_URL and CLAUDE_BUILD_TOKEN.')
  const res = await fetch(fireUrl(), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token()}`,
      'anthropic-beta': BETA,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({text: handover(briefUrl, briefJsonUrl)}),
  })
  const body = (await res.json().catch(() => null)) as {claude_code_session_url?: string} | null
  const url = body?.claude_code_session_url
  if (!res.ok || !url || !/^https:\/\/claude\.ai\//.test(url)) throw new Error(`Claude didn't start a session (${res.status}).`)
  const started = {at: new Date().toISOString(), url}
  if (submissionsOn())
    await put(path(s.id), JSON.stringify(started), {access: 'private', contentType: 'application/json', addRandomSuffix: false, allowOverwrite: true})
  return started
}
