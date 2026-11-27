/**
 * Who may open an app designed on the website: the email it was designed with, signed in by the link
 * we email them (a signed cookie, 30 days), or the browser that designed it (a signed cookie holding
 * the ids of the apps made there). Anyone else opening its link is asked for that email and sent a
 * link to sign in. "Your apps" (/app-builder/mine) lists every app an email has designed. Apps from a
 * chat aren't kept private: the chat shows them in place, by link. Until email is set up (email.ts),
 * nobody could sign in, so every link stays open. Server only.
 */
import {createHash, createHmac, timingSafeEqual} from 'node:crypto'
import {get, put} from '@vercel/blob'
import {submissionsOn} from './submissions'
import {emailOn} from './email'
import type {Share} from './mcp-build'

export const SESSION = 'fohm_apps_email'
export const DEVICE = 'fohm_apps_here'
export const SESSION_DAYS = 30

const secret = () => process.env.APP_BUILDER_SECRET || process.env.PROTOTYPE_SECRET || process.env.ANTHROPIC_API_KEY || 'development only'

const hmac = (text: string) => createHmac('sha256', secret()).update(text).digest('base64url')

const same = (a: string, b: string) => a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b))

export const cleanEmail = (email: string) => email.trim().toLowerCase()

/** An email as it's kept beside an app: hashed, so a share never holds the address. */
export const emailKey = (email: string) => createHash('sha256').update(`fohm-apps:${cleanEmail(email)}`).digest('hex')

/** Something signed, with when it runs out: `body.expiry.signature`. */
function seal(kind: string, body: string, days: number) {
  const until = Date.now() + days * 86_400_000
  const payload = `${Buffer.from(body).toString('base64url')}.${until}`
  return `${payload}.${hmac(`${kind}:${payload}`)}`
}

function open(kind: string, sealed: string | undefined): string | null {
  const [body, until, sig] = (sealed ?? '').split('.')
  if (!body || !until || !sig || !same(sig, hmac(`${kind}:${body}.${until}`)) || Date.now() > Number(until)) return null
  return Buffer.from(body, 'base64url').toString()
}

/** The link's token that signs an email in, good for a week. */
export const signInToken = (email: string) => seal('signin', cleanEmail(email), 7)
export const emailOfToken = (token: string | undefined) => open('signin', token)

/** The signed-in email's cookie, and reading it back. */
export const sessionCookie = (email: string) => seal('session', cleanEmail(email), SESSION_DAYS)
export const emailOfSession = (cookie: string | undefined) => open('session', cookie)

/** The apps this browser designed, as its cookie holds them, and the cookie with one more. */
export const appsHere = (cookie: string | undefined) => (open('device', cookie) ?? '').split(',').filter((id) => /^[a-f0-9]{32}$/.test(id))
export const deviceCookie = (cookie: string | undefined, id: string) => seal('device', [id, ...appsHere(cookie).filter((x) => x !== id)].slice(0, 40).join(','), 365)

/** Whether links are private at all: only once email can sign people in. */
export const privateLinks = () => emailOn()

/** Whether these cookies may open this app. */
export function mayOpen(share: Share, cookies: {session?: string; device?: string}) {
  if (!share.owner || !privateLinks()) return true
  if (appsHere(cookies.device).includes(share.id)) return true
  const email = emailOfSession(cookies.session)
  return Boolean(email && emailKey(email) === share.owner)
}

// ---------- Each email's apps ----------

export interface OwnedApp {
  id: string
  name: string
  at: string
}

const ownedPath = (key: string) => `owners/${key}.json`
const ownedMemory: Map<string, OwnedApp[]> = ((globalThis as {fohmOwned?: Map<string, OwnedApp[]>}).fohmOwned ??= new Map())

export async function appsOf(email: string): Promise<OwnedApp[]> {
  const key = emailKey(email)
  if (!submissionsOn()) return ownedMemory.get(key) ?? []
  const found = await get(ownedPath(key), {access: 'private', useCache: false}).catch(() => null)
  return found?.stream ? ((JSON.parse(await new Response(found.stream).text()) as OwnedApp[]) ?? []) : []
}

export async function addApp(email: string, app: OwnedApp) {
  const key = emailKey(email)
  const all = [app, ...(await appsOf(email)).filter((a) => a.id !== app.id)].slice(0, 100)
  if (!submissionsOn()) return void ownedMemory.set(key, all)
  await put(ownedPath(key), JSON.stringify(all), {access: 'private', contentType: 'application/json', addRandomSuffix: false, allowOverwrite: true})
}
