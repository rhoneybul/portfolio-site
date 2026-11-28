/**
 * The prototypes Claude draws, kept for Fohm beside the submissions: the plan (with the facts and
 * photos it was drawn from) and each part as it's drawn, as private blobs in the same Vercel Blob
 * store (BLOB_READ_WRITE_TOKEN). The submission's page shows what the visitor tapped through.
 * Saving never holds up or fails a drawing. Server only.
 */
import {get, put} from '@vercel/blob'
import {submissionsOn} from './submissions'
import type {Drawn, Job} from './prototype-doc'
import type {Market} from './market'
import type {Subject} from './subject'

const dir = (id: string) => `prototypes/${id}`
// Without the Blob store (development), one map every route sees, as the shares keep theirs (mcp-build.ts).
const memory: Map<string, string> = ((globalThis as {fohmPrototypes?: Map<string, string>}).fohmPrototypes ??= new Map())
export const isPrototypeId = (id: string) => /^[a-f0-9]{32}$/.test(id)

/** Saves one file; false when the save failed (it's logged, and never throws). */
async function keep(path: string, body: string, contentType: string): Promise<boolean> {
  if (!submissionsOn()) return void memory.set(path, body), true
  try {
    await put(path, body, {access: 'private', contentType, addRandomSuffix: false, allowOverwrite: true})
    return true
  } catch (error) {
    console.error('[prototype] save', path, error)
    return false
  }
}

export const saveJob = (job: Job) => keep(`${dir(job.id)}/plan.json`, JSON.stringify({at: new Date().toISOString(), ...job}), 'application/json')

/** A drawn part, saved; throws when it couldn't be, so a build never counts a part nobody can open. */
export async function saveUnit(id: string, unit: Drawn) {
  if (!(await keep(`${dir(id)}/${unit.id}.html`, unit.html, 'text/html'))) throw new Error(`Couldn’t save ${unit.id}`)
}

async function read(path: string) {
  if (!submissionsOn()) return memory.get(path) ?? null
  const found = await get(path, {access: 'private', useCache: false}).catch(() => null)
  return found?.stream ? new Response(found.stream).text() : null
}

/** A saved prototype's plan alone, as it is now (the logo picked last included). */
export async function readJob(id: string): Promise<Job | null> {
  if (!isPrototypeId(id)) return null
  const plan = await read(`${dir(id)}/plan.json`)
  return plan ? (JSON.parse(plan) as Job) : null
}

/** One part of a saved prototype, as drawn. */
export async function readUnit(id: string, unitId: string): Promise<Drawn | null> {
  if (!isPrototypeId(id) || !/^[a-z0-9-]{1,40}$/.test(unitId)) return null
  const html = await read(`${dir(id)}/${unitId}.html`)
  return html ? {id: unitId, html} : null
}

/** A saved prototype: its plan, and the parts that were drawn, in the plan's order. */
export async function readPrototype(id: string): Promise<{job: Job; units: Drawn[]} | null> {
  if (!isPrototypeId(id)) return null
  const plan = await read(`${dir(id)}/plan.json`)
  if (!plan) return null
  const job = JSON.parse(plan) as Job
  const units = await Promise.all(job.plan.units.map(async (u) => ({id: u.id, html: (await read(`${dir(id)}/${u.id}.html`)) ?? ''})))
  return {job, units: units.filter((u) => u.html)}
}

/** The market research found for a prototype, once (market.ts); kept so it's searched once per app. */
export const saveMarket = (id: string, market: Market) => (isPrototypeId(id) ? keep(`${dir(id)}/market.json`, JSON.stringify(market), 'application/json') : Promise.resolve(false))

export async function readMarket(id: string): Promise<Market | null> {
  if (!isPrototypeId(id)) return null
  const found = await read(`${dir(id)}/market.json`)
  return found ? (JSON.parse(found) as Market) : null
}

/** The subject researched for an idea (subject.ts), kept by its key so each idea is searched once, whoever asks. */
const isSubjectKey = (key: string) => /^[a-f0-9]{32}$/.test(key)

export const saveSubject = (key: string, subject: Subject) => (isSubjectKey(key) ? keep(`subjects/${key}.json`, JSON.stringify(subject), 'application/json') : Promise.resolve(false))

export async function readSubject(key: string): Promise<Subject | null> {
  if (!isSubjectKey(key)) return null
  const found = await read(`subjects/${key}.json`).catch(() => null)
  return found ? (JSON.parse(found) as Subject) : null
}
