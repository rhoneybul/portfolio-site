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

export async function saveSubmission(event: Submission['event'], answers: Answers, contact?: Contact, prototype?: string): Promise<string> {
  const id = randomBytes(16).toString('hex')
  const s: Submission = {id, at: new Date().toISOString(), event, answers, ...(contact ? {contact} : {}), ...(prototype ? {prototype} : {})}
  await put(path(id), JSON.stringify(s), {access: 'private', contentType: 'application/json', addRandomSuffix: false})
  return id
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
