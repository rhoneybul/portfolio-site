/**
 * The app builder's submissions are the owner's alone: their pages, briefs and prototypes ask for
 * the password in APP_BUILDER_PASSWORD (any user name), and show nothing at all until it is set.
 * Claude, given a brief to build from, can't type a password, so the brief and the prototype also
 * open from a link keyed to their own path, which only the owner's page hands out.
 * Web Crypto only: used by the proxy and by the pages.
 */

const password = () => process.env.APP_BUILDER_PASSWORD ?? ''

export const ownerOn = () => password().length >= 12

const encoder = new TextEncoder()

const hex = (bytes: ArrayBuffer) => [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, '0')).join('')

/** Compares in time that doesn't depend on where two strings first differ. */
export function sameText(a: string, b: string) {
  const x = encoder.encode(a)
  const y = encoder.encode(b)
  let diff = x.length ^ y.length
  for (let i = 0; i < Math.max(x.length, y.length); i++) diff |= (x[i] ?? 0) ^ (y[i] ?? 0)
  return diff === 0
}

/** The key that opens one path without the password. */
export async function keyFor(path: string) {
  const key = await crypto.subtle.importKey('raw', encoder.encode(password()), {name: 'HMAC', hash: 'SHA-256'}, false, ['sign'])
  return hex(await crypto.subtle.sign('HMAC', key, encoder.encode(`app-builder:${path}`))).slice(0, 40)
}

/** A full URL that opens without the password. */
export async function keyedUrl(url: string) {
  const u = new URL(url)
  u.searchParams.set('k', await keyFor(u.pathname))
  return u.toString()
}

/** Whether an Authorization header carries the owner's password. */
export function isOwner(authorization: string | null) {
  if (!ownerOn() || !authorization?.startsWith('Basic ')) return false
  try {
    const decoded = atob(authorization.slice(6))
    return sameText(decoded.slice(decoded.indexOf(':') + 1), password())
  } catch {
    return false
  }
}

/** Only the brief and the prototype open by key: the page with their details always asks for the password. */
export const keyable = (path: string) => /^\/app-builder\/submissions\/[a-f0-9]{32}\/(brief|prototype)$/.test(path)
