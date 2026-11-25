/**
 * Prototypes on Vercel: each visitor's app is a deployment of the project PROTOTYPE_PROJECT
 * (fohm-prototypes, with deployment protection off), built by Vercel from the template in demo mode
 * with no database. Vercel's build is the background job: the API route uploads the files and
 * starts it, and the page asks the deployment how it's getting on. Needs VERCEL_TOKEN; without it,
 * building prototypes is off.
 */
import {createHash} from 'node:crypto'
import type {AppFile} from './make'

const TEAM = process.env.PROTOTYPE_TEAM_ID || 'team_S6BAr6FITixLlfT9YhqAA03m'
const PROJECT = process.env.PROTOTYPE_PROJECT || 'fohm-prototypes'
/** How many prototypes may start in an hour, across everyone: the cap on what they cost. */
const HOURLY = Number(process.env.PROTOTYPE_HOURLY_LIMIT || 6)

export const prototypesOn = () => Boolean(process.env.VERCEL_TOKEN)

async function vercel(path: string, init?: RequestInit) {
  const res = await fetch(`https://api.vercel.com${path}${path.includes('?') ? '&' : '?'}teamId=${TEAM}`, {
    ...init,
    cache: 'no-store',
    headers: {Authorization: `Bearer ${process.env.VERCEL_TOKEN}`, ...init?.headers},
  })
  if (!res.ok) throw new Error(`Vercel ${res.status} on ${path.split('?')[0]}: ${(await res.text()).slice(0, 200)}`)
  return res.json()
}

/** How many prototypes started in the last hour. */
export async function underCap() {
  const since = Date.now() - 3600_000
  const {deployments} = await vercel(`/v6/deployments?app=${PROJECT}&since=${since}&limit=100`)
  return deployments.length < HOURLY
}

/** One file, tried twice: a dropped upload is worth one more go. */
async function uploadOne(f: {data: Buffer; sha: string}, tries = 2): Promise<void> {
  try {
    await vercel('/v2/files', {
      method: 'POST',
      headers: {'Content-Type': 'application/octet-stream', 'x-vercel-digest': f.sha},
      body: new Uint8Array(f.data),
    })
  } catch (error) {
    if (tries <= 1) throw error
    await uploadOne(f, tries - 1)
  }
}

/** Uploads each file once (Vercel keeps one it already has by its hash, so a repeat is quick), eight at a time. */
async function upload(files: AppFile[]) {
  const listed = files.map((f) => ({file: f.file, data: f.data, sha: createHash('sha1').update(f.data).digest('hex'), size: f.data.length}))
  for (let i = 0; i < listed.length; i += 8) await Promise.all(listed.slice(i, i + 8).map((f) => uploadOne(f)))
  return listed.map(({file, sha, size}) => ({file, sha, size}))
}

/** Starts the build: the deployment's id, and the address it will be at. */
export async function deploy(files: AppFile[], meta: Record<string, string>) {
  const listed = await upload(files)
  const d = await vercel('/v13/deployments?skipAutoDetectionConfirmation=1', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    // The app's own vercel.json says how to build it: the template's build, in demo mode.
    body: JSON.stringify({name: PROJECT, project: PROJECT, files: listed, projectSettings: {framework: null}, meta}),
  })
  return {id: d.id as string, url: `https://${d.url}`}
}

export type State = 'waiting' | 'building' | 'ready' | 'failed'

export async function deployment(id: string): Promise<{state: State; url: string}> {
  const d = await vercel(`/v13/deployments/${encodeURIComponent(id)}`)
  // Only the prototypes' own deployments: never another of the team's.
  if (d.name !== PROJECT) throw new Error('Not a prototype.')
  const state: State =
    d.readyState === 'READY' ? 'ready' : d.readyState === 'ERROR' || d.readyState === 'CANCELED' ? 'failed' : d.readyState === 'BUILDING' ? 'building' : 'waiting'
  return {state, url: `https://${d.url}`}
}
