/**
 * The app builder's build, run on the server for a chat (the MCP server, app/mcp/route.ts): what the
 * website's browser does in PrototypeBuild, here in the background, so the person can leave and
 * come back. Photos from Commons, Claude's plan, then each part drawn five at a time, each saved as
 * it's done; the share (below) says how far it has got, and its page (/app-builder/p/<id>) shows it.
 * Then the build is saved as a submission and Slack hears it, as the website's does. Server only.
 */
import {randomBytes} from 'node:crypto'
import {get, put} from '@vercel/blob'
import {resolveOptions, type Answers, type Options} from './options'
import {claudeOn} from './claude'
import {searchPhotos} from './photos'
import {photoIdeas} from './photo-ideas'
import {drawUnit, planPrototype} from './prototype'
import {saveJob, saveUnit} from './prototypes'
import {saveSubmission, submissionsOn, type Contact} from './submissions'
import {appRows, message, toSlack} from './slack'
import type {Photo} from './prototype-doc'
import {siteUrl} from '@/site-url'

export type ShareStatus = 'photos' | 'planning' | 'drawing' | 'done' | 'sketch'

/**
 * A prototype made from a chat, to share: what its page draws and how far the build has got, under
 * an id of its own, so its link never opens the submission. Never the email: the link is handed to
 * the person and may be passed on.
 */
export interface Share {
  id: string
  at: string
  answers: Answers
  status: ShareStatus
  photos: Photo[]
  /** The prototype Claude drew (prototypes.ts), once it's planned. */
  prototype?: string
  parts?: number
  drawn?: string[]
  /** The submission it was saved as, once it's done. */
  submission?: string
}

// On globalThis: without the Blob store (development), each route is its own module and both must see one map.
const memory: Map<string, Share> = ((globalThis as {fohmShares?: Map<string, Share>}).fohmShares ??= new Map())
const sharePath = (id: string) => `shares/${id}.json`
export const isShareId = (id: string) => /^[a-f0-9]{32}$/.test(id)
export const shareUrl = (id: string) => `${siteUrl}/app-builder/p/${id}`

async function saveShare(s: Share) {
  if (!submissionsOn()) return void memory.set(s.id, s)
  await put(sharePath(s.id), JSON.stringify(s), {access: 'private', contentType: 'application/json', addRandomSuffix: false, allowOverwrite: true})
}

export async function readShare(id: string): Promise<Share | null> {
  if (!isShareId(id)) return null
  if (!submissionsOn()) return memory.get(id) ?? null
  const found = await get(sharePath(id), {access: 'private', useCache: false}).catch(() => null)
  return found?.stream ? (JSON.parse(await new Response(found.stream).text()) as Share) : null
}

export async function startShare(answers: Answers): Promise<Share> {
  const {email: _email, ...drawn} = answers
  const s: Share = {id: randomBytes(16).toString('hex'), at: new Date().toISOString(), answers: drawn, status: claudeOn() ? 'photos' : 'sketch', photos: []}
  await saveShare(s)
  return s
}

/** Open-licence photos for the app: the chat's searches (or the answers' own words), then its goals, taking turns. */
async function findPhotos(answers: Answers, searches: string[]): Promise<Photo[]> {
  const {options} = resolveOptions(answers)
  const terms = [...(searches.length ? searches : photoIdeas(answers)), ...goalsOf(options)].filter((t, i, all) => t && all.indexOf(t) === i).slice(0, 5)
  const lists = await Promise.all(terms.map((t) => searchPhotos(t).catch(() => [])))
  const found: Photo[] = []
  for (let r = 0; found.length < 11 && lists.some((l) => l[r]); r++)
    lists.forEach((l, i) => {
      const f = l[r]
      if (f && found.length < 11 && !found.some((x) => x.url === f.url)) found.push({url: f.url, credit: f.credit, about: f.alt ? `${terms[i]}: ${f.alt}` : terms[i]})
    })
  return found
}

const AT_ONCE = 5

/** The goals they named, a few: "Races: Hackney Half, London Marathon" is those two (as app-prototype.tsx's goalsOf, which is client-only). */
function goalsOf(o: Options) {
  const g = o.goals || ''
  return (g.includes(':') ? g.split(':')[1] : g)
    .split(/,|\n| and /)
    .map((x) => x.trim())
    .filter(Boolean)
    .slice(0, 3)
}

/** Runs the whole build, saving the share as it goes. Never throws: whatever happens, it ends as done or a sketch, and Slack hears. */
export async function runBuild(share: Share, answers: Answers, searches: string[], deadline: number) {
  const s = {...share}
  const update = async (patch: Partial<Share>) => {
    Object.assign(s, patch)
    await saveShare(s).catch((e) => console.error('[mcp] share', e))
  }
  try {
    const photos = await findPhotos(answers, searches).catch(() => [])
    await update({photos})
    if (s.status !== 'sketch') {
      await update({status: 'planning'})
      const {options} = resolveOptions(answers)
      const job = await planPrototype(options, answers, photos, deadline)
      await saveJob(job)
      await update({status: 'drawing', prototype: job.id, parts: job.plan.units.length, drawn: []})
      const queue = [...job.plan.units]
      const drawn: string[] = []
      const worker = async () => {
        for (let u = queue.shift(); u; u = queue.shift())
          for (let attempt = 0; attempt < 2; attempt++) {
            try {
              await saveUnit(job.id, await drawUnit(job, u.id, deadline))
              drawn.push(u.id)
              await update({drawn: [...drawn]})
              break
            } catch (e) {
              console.warn('[mcp] draw', u.id, e instanceof Error ? e.message : e)
            }
          }
      }
      await Promise.all(Array.from({length: AT_ONCE}, worker))
      const phones = job.plan.units.filter((u) => u.frame === 'phone')
      const enough = phones.filter((u) => drawn.includes(u.id)).length >= Math.ceil(phones.length / 2)
      await update({status: enough ? 'done' : 'sketch'})
    }
  } catch (e) {
    console.warn('[mcp] build', e instanceof Error ? e.message : e)
    await update({status: 'sketch'})
  }
  await update({submission: (await tell('used', answers, s.status === 'done' ? s.prototype : undefined, s.id)) || undefined})
}

const EVENTS = {
  used: ':hammer_and_wrench: Someone built an app in the app builder, from a chat (MCP)',
  interest: ':raised_hand: Someone wants to build their app with Fohm, from a chat (MCP)',
} as const

/** Saves a build or a lead as a submission, as the website's /api/builder-event does, and tells Slack. Returns its id, or ''. */
export async function tell(event: keyof typeof EVENTS, answers: Answers, prototype?: string, ref?: string, contact?: Contact) {
  const {options} = resolveOptions(answers)
  let id = ''
  if (submissionsOn())
    try {
      id = await saveSubmission(event, answers, contact, prototype, ref)
    } catch (e) {
      console.error('[mcp] save', e)
    }
  const page = id ? `${siteUrl}/app-builder/submissions/${id}` : ''
  const who = contact?.name || contact?.email || answers.email || 'Someone'
  await toSlack(
    message(
      event === 'interest' ? `:raised_hand: ${who} wants to build ${options.name} (from a chat)` : `:hammer_and_wrench: ${who} built ${options.name} in a chat (MCP)`,
      [
        ['Email', contact?.email ?? answers.email],
        ['Their note', contact?.note],
        ...appRows(options, answers),
        ['Not saved', !page && 'BLOB_READ_WRITE_TOKEN isn’t set'],
      ],
      [
        ...(ref ? ([['What they see', shareUrl(ref)]] as [string, string][]) : []),
        ...(page ? ([['Submission', page], ...(prototype ? [['Prototype', `${page}/prototype`]] : []), ['Brief', `${page}/brief`]] as [string, string][]) : []),
      ],
    ),
  )
  return id
}
