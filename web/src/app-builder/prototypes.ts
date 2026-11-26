/**
 * The prototypes Claude draws, kept for Fohm beside the submissions: the plan (with the facts and
 * photos it was drawn from) and each part as it's drawn, as private blobs in the same Vercel Blob
 * store (BLOB_READ_WRITE_TOKEN). The submission's page shows what the visitor tapped through.
 * Saving never holds up or fails a drawing. Server only.
 */
import {get, put} from '@vercel/blob'
import {submissionsOn} from './submissions'
import type {Drawn, Job} from './prototype-doc'

const dir = (id: string) => `prototypes/${id}`
export const isPrototypeId = (id: string) => /^[a-f0-9]{32}$/.test(id)

async function keep(path: string, body: string, contentType: string) {
  if (!submissionsOn()) return
  try {
    await put(path, body, {access: 'private', contentType, addRandomSuffix: false, allowOverwrite: true})
  } catch (error) {
    console.error('[prototype] save', path, error)
  }
}

export const saveJob = (job: Job) => keep(`${dir(job.id)}/plan.json`, JSON.stringify({at: new Date().toISOString(), ...job}), 'application/json')

export const saveUnit = (id: string, unit: Drawn) => keep(`${dir(id)}/${unit.id}.html`, unit.html, 'text/html')

async function read(path: string) {
  const found = await get(path, {access: 'private', useCache: false}).catch(() => null)
  return found?.stream ? new Response(found.stream).text() : null
}

/** A saved prototype: its plan, and the parts that were drawn, in the plan's order. */
export async function readPrototype(id: string): Promise<{job: Job; units: Drawn[]} | null> {
  if (!isPrototypeId(id) || !submissionsOn()) return null
  const plan = await read(`${dir(id)}/plan.json`)
  if (!plan) return null
  const job = JSON.parse(plan) as Job
  const units = await Promise.all(job.plan.units.map(async (u) => ({id: u.id, html: (await read(`${dir(id)}/${u.id}.html`)) ?? ''})))
  return {job, units: units.filter((u) => u.html)}
}
