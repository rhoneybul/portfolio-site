/**
 * The app builder's build, run on the server, for the website (/api/prototype/build) and for a chat
 * (the MCP server, app/mcp/route.ts), in the background, so the person can close the tab and come
 * back: the logo round (the website's), photos, Claude's plan, then each part drawn five at a time,
 * each saved as it's done. The share (below) says how far it has got: the website's building page
 * follows it, and its page (/app-builder/p/<id>) shows it for LINK_DAYS days. Every Claude call is
 * metered (cost.ts). At the end the build is saved as a submission, Slack hears it with what it cost,
 * and the visitor is emailed its link. Server only.
 */
import {randomBytes} from 'node:crypto'
import {get, put} from '@vercel/blob'
import {resolveOptions, type Answers, type Options} from './options'
import {claudeOn} from './claude'
import {searchPhotos} from './photos'
import {photoIdeas} from './photo-ideas'
import {drawUnit, planPrototype, withMark} from './prototype'
import {saveJob, saveUnit} from './prototypes'
import {saveSubmission, submissionsOn, type Contact} from './submissions'
import {appRows, message, toSlack} from './slack'
import {drawMarks, type Mark} from './logos'
import {Meter, addSpend, metered, noSpend, spendLine, type Spend} from './cost'
import {LINK_DAYS, emailOn, readyEmail, sendEmail} from './email'
import {cleanMarkPath, type Job, type Photo} from './prototype-doc'
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
  /** Where it was asked from: the website's builder, or a chat. */
  source?: 'web' | 'mcp'
  /** The logo round's marks, once drawn (the website's, for an owner without a logo); [] if it came back empty. */
  marks?: Mark[]
  /** Whether the visitor was emailed its link. */
  emailed?: boolean
}

/** What the visitor chooses while it builds, kept apart from the share so the build's own saves never undo it. */
export interface Choices {
  /** The mark they picked (its path): one of the round's, or one of more drawn from their page. */
  mark?: string
  /** Where they heard about Fohm. */
  heard?: string
}

// On globalThis: without the Blob store (development), each route is its own module and both must see one map.
const memory: Map<string, Share> = ((globalThis as {fohmShares?: Map<string, Share>}).fohmShares ??= new Map())
const sharePath = (id: string) => `shares/${id}.json`
const choicesMemory: Map<string, Choices> = ((globalThis as {fohmChoices?: Map<string, Choices>}).fohmChoices ??= new Map())
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

/** Whether a share's link has run out: it works for LINK_DAYS days. */
export const expired = (s: Share) => Date.now() - Date.parse(s.at) > LINK_DAYS * 86_400_000

/** Each choice is a file of its own, so a logo picked and an answer given at the same moment never undo each other. */
const choicePath = (id: string, key: keyof Choices) => `shares/${id}-${key}.json`

export async function readChoices(id: string): Promise<Choices> {
  if (!submissionsOn()) return choicesMemory.get(id) ?? {}
  const one = async (key: keyof Choices) => {
    const found = await get(choicePath(id, key), {access: 'private', useCache: false}).catch(() => null)
    return found?.stream ? (JSON.parse(await new Response(found.stream).text()) as string) : undefined
  }
  const [mark, heard] = await Promise.all([one('mark'), one('heard')])
  return {...(mark ? {mark} : {}), ...(heard ? {heard} : {})}
}

export async function saveChoices(id: string, patch: Choices) {
  if (!submissionsOn()) return void choicesMemory.set(id, {...(choicesMemory.get(id) ?? {}), ...patch})
  await Promise.all(
    (Object.entries(patch) as [keyof Choices, string][]).map(([key, value]) =>
      put(choicePath(id, key), JSON.stringify(value), {access: 'private', contentType: 'application/json', addRandomSuffix: false, allowOverwrite: true}),
    ),
  )
}

export async function startShare(answers: Answers, source: Share['source'] = 'mcp'): Promise<Share> {
  const {email: _email, ...drawn} = answers
  const s: Share = {id: randomBytes(16).toString('hex'), at: new Date().toISOString(), answers: drawn, status: claudeOn() ? 'photos' : 'sketch', photos: [], source}
  await saveShare(s)
  return s
}

/**
 * Open-licence photos for the app: the ones they picked first (the website's photo question), then
 * the searches (the chat's, or the answers' own words), then its goals, taking turns.
 */
async function findPhotos(answers: Answers, searches: string[], favourites: {url: string; credit: string}[] = []): Promise<Photo[]> {
  const {options} = resolveOptions(answers)
  const terms = [...(searches.length ? searches : photoIdeas(answers)), ...goalsOf(options)].filter((t, i, all) => t && all.indexOf(t) === i).slice(0, 5)
  const lists = await Promise.all(terms.map((t) => searchPhotos(t).catch(() => [])))
  const found: Photo[] = []
  for (let r = 0; found.length < 11 && lists.some((l) => l[r]); r++)
    lists.forEach((l, i) => {
      const f = l[r]
      if (f && found.length < 11 && !found.some((x) => x.url === f.url)) found.push({url: f.url, credit: f.credit, about: f.alt ? `${terms[i]}: ${f.alt}` : terms[i]})
    })
  const own = options.photo ? [{url: options.photo, credit: options.photoCredit || 'The owner’s own photo', about: 'the photo the owner picked to lead'}] : []
  const picked = favourites.filter((f) => f.url !== options.photo).map((f) => ({url: f.url, credit: f.credit || 'The owner’s own photo', about: 'a photo the owner picked'}))
  const chosen = [...own, ...picked]
  return [...chosen, ...found.filter((f) => !chosen.some((c) => c.url === f.url))].slice(0, 12)
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

/** How long the plan waits for the logo round before it goes on with the icon its plan chooses. */
const LOGOS_WAIT = 75_000

export interface BuildOptions {
  /** The photos they picked, their favourite first (the website's photo question). */
  favourites?: {url: string; credit: string}[]
  /** Their visit's reference (the website's), so a call they book joins what they built. */
  ref?: string
  /** What Claude cost before the build: the questions, asked from their browser. */
  spentBefore?: Spend
  /** The booking link, for the email. */
  bookingUrl?: string | null
}

/**
 * Runs the whole build, saving the share as it goes. Never throws: whatever happens, it ends as done
 * or a sketch, Slack hears with what it cost, and the visitor is emailed its link.
 */
export async function runBuild(share: Share, answers: Answers, searches: string[], deadline: number, opts: BuildOptions = {}) {
  const meter = new Meter()
  await metered(meter, () => build(share, answers, searches, deadline, opts, meter))
}

async function build(share: Share, answers: Answers, searches: string[], deadline: number, opts: BuildOptions, meter: Meter) {
  const s = {...share}
  const update = async (patch: Partial<Share>) => {
    Object.assign(s, patch)
    await saveShare(s).catch((e) => console.error('[build] share', e))
  }
  const {options} = resolveOptions(answers)
  try {
    // The logo round runs beside the photos, for an owner without a logo of their own (the website's).
    const wantsLogo = s.source === 'web' && answers.logo !== 'yes' && s.status !== 'sketch'
    const logos: Promise<Mark[]> = wantsLogo
      ? drawMarks(options, answers, deadline)
          .catch((e) => (console.warn('[build] logos', e instanceof Error ? e.message : e), [] as Mark[]))
          .then(async (marks) => (await update({marks}), marks))
      : Promise.resolve([])
    const photos = await findPhotos(answers, searches, opts.favourites).catch(() => [])
    await update({photos})
    if (s.status !== 'sketch') {
      await update({status: 'planning'})
      const [planned, marks] = await Promise.all([
        planPrototype(options, answers, photos, deadline),
        Promise.race([logos, new Promise<Mark[]>((r) => setTimeout(() => r([]), LOGOS_WAIT))]),
      ])
      // The mark they've picked (the round's first until they tap one) is the icon on every screen; a later pick applies from the next part drawn.
      let picked = ''
      let job: Job = planned
      // Saves of the plan go one after another, so an older pick never lands after a newer one.
      let saving: Promise<unknown> = Promise.resolve()
      const save = () => (saving = saving.then(() => saveJob(job)))
      const withPick = async () => {
        const chosen = cleanMarkPath((await readChoices(s.id).catch(() => ({}) as Choices)).mark)
        const want = chosen || (s.marks?.length ? s.marks : marks)[0]?.d || ''
        if (!want || want === picked) return
        picked = want
        job = withMark(job, want)
        await save()
      }
      await withPick()
      await saveJob(job)
      await update({status: 'drawing', prototype: job.id, parts: job.plan.units.length, drawn: []})
      const queue = [...job.plan.units]
      const drawn: string[] = []
      const worker = async () => {
        for (let u = queue.shift(); u; u = queue.shift())
          for (let attempt = 0; attempt < 2; attempt++) {
            try {
              await withPick()
              await saveUnit(job.id, await drawUnit(job, u.id, deadline))
              drawn.push(u.id)
              await update({drawn: [...drawn]})
              break
            } catch (e) {
              console.warn('[build] draw', u.id, e instanceof Error ? e.message : e)
            }
          }
      }
      await Promise.all(Array.from({length: AT_ONCE}, worker))
      await withPick()
      // The plan as it ends, saved last whatever happened before: the pick the finished app shows.
      await save()
      const phones = job.plan.units.filter((u) => u.frame === 'phone')
      const enough = phones.filter((u) => drawn.includes(u.id)).length >= Math.ceil(phones.length / 2)
      await update({status: enough ? 'done' : 'sketch'})
    }
  } catch (e) {
    console.warn('[build] build', e instanceof Error ? e.message : e)
    await update({status: 'sketch'})
  }

  const choices = await readChoices(s.id).catch(() => ({}) as Choices)
  const said = {...answers, ...(choices.heard ? {heard: choices.heard} : {})}
  const emailed = await emailLink(s, said, opts.bookingUrl)
  const spent = addSpend(opts.spentBefore ?? noSpend(), meter.spent)
  const submission = await tell('used', said, {prototype: s.status === 'done' ? s.prototype : undefined, share: s.id, ref: opts.ref, source: s.source, spent, emailed})
  await update({submission: submission || undefined, emailed})
}

/** The visitor's link to their app, by email, once it's ready: off until the email service is set. */
async function emailLink(s: Share, answers: Answers, bookingUrl?: string | null) {
  const to = answers.email?.trim()
  // Only the website's builds: a chat tells the person its link itself, and says nothing else is sent to them.
  if (s.source !== 'web' || !emailOn() || !to || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(to)) return false
  const {options} = resolveOptions(answers)
  return sendEmail({to, ...readyEmail({name: options.name, url: shareUrl(s.id), drawn: s.status === 'done', bookingUrl})})
}

export interface Told {
  /** The prototype Claude drew, if it did. */
  prototype?: string
  /** The share its link opens. */
  share?: string
  /** The visit's reference, so a call booked from it joins this submission (the website's; a chat's is its share). */
  ref?: string
  source?: Share['source']
  contact?: Contact
  /** What Claude cost for it. */
  spent?: Spend
  /** Whether the visitor was emailed its link. */
  emailed?: boolean
}

/** Saves a build or a lead as a submission, as the website's /api/builder-event does, and tells Slack. Returns its id, or ''. */
export async function tell(event: 'used' | 'interest', answers: Answers, t: Told = {}) {
  const {options} = resolveOptions(answers)
  const chat = t.source !== 'web'
  let id = ''
  if (submissionsOn())
    try {
      id = await saveSubmission(event, answers, t.contact, t.prototype, t.ref ?? t.share)
    } catch (e) {
      console.error('[build] save', e)
    }
  const page = id ? `${siteUrl}/app-builder/submissions/${id}` : ''
  const who = t.contact?.name || t.contact?.email || answers.email || 'Someone'
  const where = chat ? ' (from a chat)' : ''
  await toSlack(
    message(
      event === 'interest'
        ? `:raised_hand: ${who} wants to build ${options.name}${where}`
        : `:hammer_and_wrench: ${who} built ${options.name} in the app builder${chat ? ' from a chat (MCP)' : ''}`,
      [
        ['Email', t.contact?.email ?? answers.email],
        ['Their note', t.contact?.note],
        ...appRows(options, answers),
        ['Heard about Fohm', answers.heard],
        ['Name check', answers.nameCheck],
        ['Claude cost', t.spent && t.spent.calls > 0 && spendLine(t.spent)],
        ['Emailed their link', event === 'used' && !chat && (t.emailed ? 'yes' : emailOn() ? 'no: the send failed' : 'no: RESEND_API_KEY and APP_BUILDER_FROM aren’t set')],
        ['Not saved', !page && 'BLOB_READ_WRITE_TOKEN isn’t set'],
      ],
      [
        ...(t.share ? ([['What they see', shareUrl(t.share)]] as [string, string][]) : []),
        ...(page ? ([['Submission', page], ...(t.prototype ? [['Prototype', `${page}/prototype`]] : []), ['Brief', `${page}/brief`]] as [string, string][]) : []),
      ],
    ),
  )
  return id
}
