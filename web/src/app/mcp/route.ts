import {after} from 'next/server'
import {createMcpHandler} from 'mcp-handler'
import {registerAppResource, registerAppTool, RESOURCE_MIME_TYPE} from '@modelcontextprotocol/ext-apps/server'
import {z} from 'zod'
import {INSTRUCTIONS, SERVER_NAME, answersOf, buildInput, builtText, idInput, questionsForChat, resolveOptions, reviseInput, revisedAnswers, specOf, type ReviseInput} from '@/app-builder/mcp'
import {CHAT_LINK_DAYS, expired, readShare, runBuild, shareUrl, startShare, type Share} from '@/app-builder/mcp-build'
import type {Answers} from '@/app-builder/options'
import {builderPaused} from '@/app-builder/switch'
import {readPrototype} from '@/app-builder/prototypes'
import {iconMarkCss, prototypeDocument} from '@/app-builder/prototype-doc'
import {viewDomains, viewHtml} from '@/app-builder/mcp-view'
import {limiter} from '@/app-builder/rate-limit'
import {onAccent} from '@/app-builder/options'
import {siteUrl} from '@/site-url'

/**
 * The app builder as an MCP server, at /mcp: Streamable HTTP, stateless, no sign-in (claude.ai's and
 * ChatGPT's connectors can't send a token), and no email. Five tools: the questions; the prototype,
 * which Claude designs in the background (app-builder/mcp-build.ts) while the chat shows its link,
 * drawn inline where the client renders MCP Apps; how it's going; a new version with a change; and
 * its spec, to keep or hand to whoever builds it. Nothing goes to Fohm for follow-up.
 */

// The build runs after the answer, in this invocation: plan and draw take 4 to 6 minutes.
export const maxDuration = 800

const VIEW = 'ui://fohm/prototype.html'
const site = new URL(siteUrl).origin

// Claude costs money: each address gets a few designs a day (a revision is one), and the whole server a few an hour.
const allowed = limiter()
const PER_ADDRESS = {most: 6, window: 24 * 60 * 60_000}
const PER_HOUR = {most: 30, window: 60 * 60_000}

/** The address a tool call came from, as Vercel passes it on, from the request the handler serves. */
function callerAddress(ctx: unknown) {
  const headers = (ctx as {requestInfo?: {headers?: unknown}} | undefined)?.requestInfo?.headers
  const forwarded = headers instanceof Headers ? headers.get('x-forwarded-for') : (headers as Record<string, string | undefined> | undefined)?.['x-forwarded-for']
  return String(forwarded ?? '').split(',')[0].trim() || 'unknown'
}

const fail = (text: string) => ({isError: true, content: [{type: 'text' as const, text}]})

/** Starts a design from the answers, in the background, and says so: the first build and every revision. */
async function design(answers: Answers, searches: string[], ctx: unknown, revised = false) {
  const {options, errors} = resolveOptions(answers)
  if (errors.name) return fail(errors.name)
  if (!allowed(`address:${callerAddress(ctx)}`, PER_ADDRESS) || !allowed('all', PER_HOUR))
    return fail(`That's as many designs as the builder draws for now. Try again tomorrow, or design it at ${siteUrl}/app-builder.`)
  if (await builderPaused()) return fail('The app builder is paused for now. Try again later.')
  const share = await startShare(answers)
  after(() => runBuild(share, answers, searches, Date.now() + (maxDuration - 20) * 1000))
  const link = shareUrl(share.id)
  return {
    content: [{type: 'text' as const, text: builtText(options, link, share.status !== 'sketch', revised)}],
    structuredContent: {prototypeId: share.id, url: link, embedUrl: `${link}?embed=1`, name: options.name, tagline: options.tagline, keptForDays: CHAT_LINK_DAYS},
  }
}

/** The share a tool asks about, or why it can't be had. */
async function shareFor(prototypeId: string): Promise<Share | {error: ReturnType<typeof fail>}> {
  const share = await readShare(prototypeId)
  if (!share) return {error: fail('No prototype with that id. Start one with build_app_prototype.')}
  if (expired(share)) return {error: fail(`That prototype has expired: chat prototypes are kept ${CHAT_LINK_DAYS} days. Design it again with build_app_prototype.`)}
  return share
}

const handler = createMcpHandler(
  (server) => {
    server.registerTool(
      'app_builder_questions',
      {
        title: 'App builder questions',
        description:
          'Returns the questions to ask before designing a prototype of an app (for example a fitness, health or wellness app: a coaching or training app, a studio, gym, clinic or wellbeing app), with examples and choices, for when the user asks to design, plan or prototype an app.',
        inputSchema: z.object({}),
        annotations: {readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false},
      },
      async () => {
        const q = questionsForChat()
        return {content: [{type: 'text', text: JSON.stringify(q, null, 2)}], structuredContent: q}
      },
    )

    registerAppTool(
      server,
      'build_app_prototype',
      {
        title: 'Design an app prototype',
        description:
          'Starts designing a clickable prototype of the user’s app from their answers (landing page, onboarding, home, a session, a goal and the owner’s dashboard, in their name, words and colour). The design takes about 4 to 6 minutes; returns at once with a prototypeId and a link to the prototype, which fills in as it is drawn. No email or account is needed.',
        inputSchema: buildInput,
        annotations: {readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true},
        _meta: {ui: {resourceUri: VIEW}},
      },
      async (input: z.infer<typeof buildInput>, ctx: unknown) => design(answersOf(input), input.photoSearches ?? [], ctx),
    )

    registerAppResource(server, 'App prototype', VIEW, {description: 'The app build_app_prototype designs, to watch and tap through in the chat.'}, async () => ({
      contents: [
        {
          uri: VIEW,
          mimeType: RESOURCE_MIME_TYPE,
          text: viewHtml(site),
          _meta: {ui: {csp: {resourceDomains: viewDomains(site)}, prefersBorder: true}},
        },
      ],
    }))

    registerAppTool(
      server,
      'get_app_prototype',
      {
        title: 'Get the app prototype',
        description:
          'Returns how far the design of a prototype has got and its link, and once it is done, its summary and screens, and the prototype to show. For when the user asks how their app is coming along, or comes back to it.',
        inputSchema: idInput,
        annotations: {readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false},
        _meta: {ui: {resourceUri: VIEW}},
      },
      async ({prototypeId}: {prototypeId: string}) => {
        const share = await shareFor(prototypeId)
        if ('error' in share) return share.error
        const {options} = resolveOptions(share.answers)
        const saved = share.status === 'done' && share.prototype ? await readPrototype(share.prototype) : null
        const phone = saved ? saved.units.filter((u) => saved.job.plan.units.find((p) => p.id === u.id)?.frame === 'phone') : []
        const status = share.status === 'done' && !phone.length ? 'sketch' : share.status
        const state = {
          prototypeId: share.id,
          status,
          name: options.name,
          accent: options.accent,
          onAccent: onAccent(options.accent),
          // The app's own icon, once Claude has chosen it: the view draws its mark from this.
          ...(saved?.job.look.style ? {iconCss: iconMarkCss('.icon::after', saved.job.look.style.icon)} : {}),
          url: shareUrl(share.id),
          parts: share.parts ?? 0,
          drawn: share.drawn?.length ?? 0,
          ...(saved && phone.length ? {summary: saved.job.plan.summary, html: prototypeDocument({look: saved.job.look, units: phone, view: 'phone'})} : {}),
        }
        const words = {photos: 'Finding photos', planning: 'Planning the app', drawing: `Drawing: ${state.drawn} of ${state.parts} parts done`, done: 'Done', sketch: 'A quick sketch'}[status]
        const screens = saved ? saved.job.plan.units.map((u) => u.title) : []
        const said = [`${options.name}: ${words}. ${state.url}`, state.summary, screens.length && `Screens: ${screens.join(', ')}.`].filter(Boolean).join('\n\n')
        return {content: [{type: 'text', text: said}], structuredContent: {...state, screens}}
      },
    )

    registerAppTool(
      server,
      'revise_app_prototype',
      {
        title: 'Change the app prototype',
        description:
          'Designs a new version of a prototype with a change the user asks for (its name, words, colour or look, a screen, a feature), from the last version’s answers and every change asked for since. Takes 4 to 6 minutes; returns at once with the new version’s prototypeId and link. The earlier version stays as it was.',
        inputSchema: reviseInput,
        annotations: {readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true},
        _meta: {ui: {resourceUri: VIEW}},
      },
      async (input: ReviseInput, ctx: unknown) => {
        const share = await shareFor(input.prototypeId)
        if ('error' in share) return share.error
        return design(revisedAnswers(share.answers, input), input.photoSearches ?? [], ctx, true)
      },
    )

    server.registerTool(
      'get_app_spec',
      {
        title: 'Get the app’s spec',
        description:
          'Returns the spec of a designed prototype as markdown: what the app is, its look, every screen with what it shows and where it leads, the navigation, the calls made in the design, and the answers it was designed from. For when the user wants to keep the design, build it themselves, or hand it to a developer or a coding assistant.',
        inputSchema: idInput,
        annotations: {readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false},
      },
      async ({prototypeId}: {prototypeId: string}) => {
        const share = await shareFor(prototypeId)
        if ('error' in share) return share.error
        const {options} = resolveOptions(share.answers)
        const job = share.status === 'done' && share.prototype ? ((await readPrototype(share.prototype))?.job ?? null) : null
        const spec = specOf(options, share.answers, job, shareUrl(share.id))
        return {content: [{type: 'text', text: spec}], structuredContent: {prototypeId, name: options.name, status: share.status, markdown: spec}}
      },
    )
  },
  {serverInfo: {name: SERVER_NAME, version: '2.0.0'}, instructions: INSTRUCTIONS},
)

export {handler as GET, handler as POST, handler as DELETE}
