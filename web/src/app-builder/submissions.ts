/**
 * Submissions from the app builder, kept for Fohm only: every answer, the visitor's email and, when
 * they get in touch, their details, as a private blob in the site's Vercel Blob store (read and
 * written with BLOB_READ_WRITE_TOKEN; never readable by a public link). Each has a random id, and
 * only the Fohm Slack channel is told it: the visitor never sees the id, the page or the brief.
 */
import {randomBytes} from 'node:crypto'
import {get, put} from '@vercel/blob'
import {claudePrompt} from './prompt'
import {resolveOptions, type Answers} from './options'
import {siteUrl} from '@/site-url'

export interface Contact {
  name: string
  email: string
  note: string
}

export interface Submission {
  id: string
  at: string
  event: 'used' | 'interest'
  answers: Answers
  contact?: Contact
  /** The prototype Claude drew for them (app-builder/prototypes.ts), when it did. */
  prototype?: string
}

export const submissionsOn = () => Boolean(process.env.BLOB_READ_WRITE_TOKEN)
const path = (id: string) => `submissions/${id}.json`
export const isId = (id: string) => /^[a-f0-9]{32}$/.test(id)

/**
 * A visitor's session in the builder has a random reference of its own (made in their browser), so a call they book
 * from it can be traced to what they built without the visitor ever holding the submission's id: the reference
 * points to their latest submission, and only the server can follow it.
 */
const refPath = (ref: string) => `refs/${ref}.json`
export const isRef = isId

export async function saveSubmission(
  event: Submission['event'],
  answers: Answers,
  contact?: Contact,
  prototype?: string,
  ref?: string,
): Promise<string> {
  const id = randomBytes(16).toString('hex')
  const s: Submission = {id, at: new Date().toISOString(), event, answers, ...(contact ? {contact} : {}), ...(prototype ? {prototype} : {})}
  await put(path(id), JSON.stringify(s), {access: 'private', contentType: 'application/json', addRandomSuffix: false})
  if (ref && isRef(ref))
    await put(refPath(ref), JSON.stringify({id}), {access: 'private', contentType: 'application/json', addRandomSuffix: false, allowOverwrite: true})
  return id
}

/** The latest submission a builder session made, from its reference. */
export async function submissionOfRef(ref: string): Promise<Submission | null> {
  if (!isRef(ref) || !submissionsOn()) return null
  const found = await get(refPath(ref), {access: 'private', useCache: false})
  if (!found?.stream) return null
  const {id} = JSON.parse(await new Response(found.stream).text()) as {id: string}
  return readSubmission(id)
}

export async function readSubmission(id: string): Promise<Submission | null> {
  if (!isId(id) || !submissionsOn()) return null
  const found = await get(path(id), {access: 'private', useCache: false})
  if (!found?.stream) return null
  return JSON.parse(await new Response(found.stream).text()) as Submission
}

/** The page of the prototype Claude drew for a submission, when it did. */
export const prototypeUrlOf = (s: Submission) => (s.prototype ? `${siteUrl}/app-builder/submissions/${s.id}/prototype` : undefined)

/** The brief to give Claude, made from what was saved. */
export const briefOf = (s: Submission) => claudePrompt(resolveOptions(s.answers).options, s.answers, prototypeUrlOf(s))
