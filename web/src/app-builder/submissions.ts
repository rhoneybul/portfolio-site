/**
 * Submissions from the app builder, kept for Fohm only: every answer, the visitor's email and, when
 * they get in touch, their details, as a private blob in the site's Vercel Blob store (read and
 * written with BLOB_READ_WRITE_TOKEN; never readable by a public link). Each has a random id, and
 * only the Fohm Slack channel is told it: the visitor never sees the id, the page or the brief.
 */
import {randomBytes} from 'node:crypto'
import {get, put} from '@vercel/blob'
import {claudePrompt, scaffoldOptions} from './prompt'
import {siteUrl} from '@/site-url'
import {resolveOptions, type Answers} from './options'

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
}

export const submissionsOn = () => Boolean(process.env.BLOB_READ_WRITE_TOKEN)
const path = (id: string) => `submissions/${id}.json`
export const isId = (id: string) => /^[a-f0-9]{32}$/.test(id)

export async function saveSubmission(event: Submission['event'], answers: Answers, contact?: Contact): Promise<string> {
  const id = randomBytes(16).toString('hex')
  const s: Submission = {id, at: new Date().toISOString(), event, answers, ...(contact ? {contact} : {})}
  await put(path(id), JSON.stringify(s), {access: 'private', contentType: 'application/json', addRandomSuffix: false})
  return id
}

export async function readSubmission(id: string): Promise<Submission | null> {
  if (!isId(id) || !submissionsOn()) return null
  const found = await get(path(id), {access: 'private', useCache: false})
  if (!found?.stream) return null
  return JSON.parse(await new Response(found.stream).text()) as Submission
}

/** Where a submission's brief is read: the markdown for Claude, the JSON for `fohm-scaffold new --from`. */
export const briefUrl = (id: string) => `${siteUrl}/app-builder/submissions/${id}/brief`
export const briefJsonUrl = (id: string) => `${briefUrl(id)}.json`

/** The brief to give Claude, made from what was saved. */
export const briefOf = (s: Submission) => claudePrompt(resolveOptions(s.answers).options, s.answers, briefJsonUrl(s.id))

/**
 * The brief as `fohm-scaffold new --from` reads it (its lib/brief.mjs, version 1): the answers as its
 * options, the rest of the answers for the new-app skill, and the markdown brief, which the new app
 * keeps as docs/BRIEF.md. Never the visitor's contact details or email: the scaffolder doesn't need them.
 */
export function briefJson(s: Submission) {
  const {options} = resolveOptions(s.answers)
  const {email: _email, ...answers} = s.answers
  // Its brief leaves out the submission's own link: the new app commits it, and the link opens the page with their details.
  return {fohm: 'app-builder-brief', version: 1, at: s.at, options: scaffoldOptions(options), answers, brief: claudePrompt(options, s.answers)}
}
