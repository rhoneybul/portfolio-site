import {after} from 'next/server'
import {createMcpHandler} from 'mcp-handler'
import {registerAppResource, registerAppTool, RESOURCE_MIME_TYPE} from '@modelcontextprotocol/ext-apps/server'
import {z} from 'zod'
import {INSTRUCTIONS, SERVER_NAME, SERVER_TITLE, answersOf, buildInput, builtText, contactInput, questionsForChat, resolveOptions} from '@/app-builder/mcp'
import {readShare, runBuild, shareUrl, startShare, tell} from '@/app-builder/mcp-build'
import {readPrototype} from '@/app-builder/prototypes'
import {prototypeDocument} from '@/app-builder/prototype-doc'
import {viewDomains, viewHtml} from '@/app-builder/mcp-view'
import {limiter} from '@/app-builder/rate-limit'
import {siteUrl} from '@/site-url'

/**
 * The app builder as an MCP server, at /mcp: Streamable HTTP, stateless, no sign-in (claude.ai's and
 * ChatGPT's connectors can't send a token). Three tools: the questions; the prototype, which Claude
 * designs in the background (app-builder/mcp-build.ts) while the chat shows its link, drawn inline
 * where the client renders MCP Apps; and the lead to Fohm.
 */

// The build runs after the answer, in this invocation: plan and draw take 4 to 6 minutes.
export const maxDuration = 800

const VIEW = 'ui://fohm/prototype.html'
const site = new URL(siteUrl).origin

// Claude costs money: each email gets the website's 3 a day, and the whole server a few an hour.
const allowed = limiter()
const PER_EMAIL = {most: 3, window: 24 * 60 * 60_000}
const PER_HOUR = {most: 30, window: 60 * 60_000}
const leads = limiter()

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
          'Starts designing a clickable prototype of the user’s app from their answers (landing page, onboarding, home, a session, a goal and the owner’s dashboard, in their name, words and colour). The design takes about 4 to 6 minutes; returns at once with a link to the prototype, which fills in as it is drawn. Needs the email the user typed.',
        inputSchema: buildInput,
        annotations: {readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true},
        _meta: {ui: {resourceUri: VIEW}},
      },
      async (input: z.infer<typeof buildInput>) => {
        const answers = answersOf(input)
        const {options, errors} = resolveOptions(answers)
        if (errors.name || errors.email) return {isError: true, content: [{type: 'text', text: errors.name || errors.email}]}
        if (!allowed(`email:${input.email.toLowerCase()}`, PER_EMAIL) || !allowed('all', PER_HOUR))
          return {isError: true, content: [{type: 'text', text: `That's as many apps as the builder draws for now. Try again later, or design it at ${siteUrl}/app-builder.`}]}

        const share = await startShare(answers)
        after(() => runBuild(share, answers, input.photoSearches ?? [], Date.now() + (maxDuration - 20) * 1000))
        const link = shareUrl(share.id)
        return {
          content: [{type: 'text', text: builtText(options, link, share.status !== 'sketch', input.sector, input.location)}],
          structuredContent: {prototypeId: share.id, url: link, embedUrl: `${link}?embed=1`, name: options.name, tagline: options.tagline},
        }
      },
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
        description: 'Returns how far the design of a prototype started with build_app_prototype has got, and once it is done, the prototype to show. Used by the prototype view.',
        inputSchema: z.object({prototypeId: z.string().regex(/^[a-f0-9]{32}$/).describe('The id build_app_prototype returned.')}),
        annotations: {readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false},
        _meta: {ui: {resourceUri: VIEW, visibility: ['app']}},
      },
      async ({prototypeId}: {prototypeId: string}) => {
        const share = await readShare(prototypeId)
        if (!share) return {isError: true, content: [{type: 'text', text: 'No prototype with that id. Start one with build_app_prototype.'}]}
        const {options} = resolveOptions(share.answers)
        const saved = share.status === 'done' && share.prototype ? await readPrototype(share.prototype) : null
        const phone = saved ? saved.units.filter((u) => saved.job.plan.units.find((p) => p.id === u.id)?.frame === 'phone') : []
        const status = share.status === 'done' && !phone.length ? 'sketch' : share.status
        const state = {
          status,
          name: options.name,
          accent: options.accent,
          url: shareUrl(share.id),
          parts: share.parts ?? 0,
          drawn: share.drawn?.length ?? 0,
          ...(saved && phone.length ? {summary: saved.job.plan.summary, html: prototypeDocument({look: saved.job.look, units: phone, view: 'phone'})} : {}),
        }
        const words = {photos: 'Finding photos', planning: 'Planning the app', drawing: `Drawing: ${state.drawn} of ${state.parts} parts done`, done: 'Done', sketch: 'A quick sketch'}[status]
        return {content: [{type: 'text', text: `${options.name}: ${words}. ${state.url}`}], structuredContent: state}
      },
    )

    server.registerTool(
      'contact_fohm',
      {
        title: 'Ask Fohm to build it',
        description:
          'Sends the user’s prototype with their name, email and an optional note to Fohm, the app studio behind the builder, when the user asks to be contacted about building it.',
        inputSchema: contactInput,
        annotations: {readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: true},
      },
      async (input: z.infer<typeof contactInput>) => {
        const share = await readShare(input.prototypeId)
        if (!share) return {isError: true, content: [{type: 'text', text: 'That prototype wasn’t found. Design it again with build_app_prototype, then send it.'}]}
        if (leads(`${input.prototypeId}:${input.email.toLowerCase()}`, {most: 1, window: 10 * 60_000}))
          await tell('interest', {...share.answers, email: input.email}, share.prototype, share.id, {name: input.name, email: input.email, note: input.note ?? ''})
        const name = resolveOptions(share.answers).options.name
        return {
          content: [
            {
              type: 'text',
              text: `Sent. Rob at Fohm has ${name} and ${input.name.split(' ')[0]}'s details, and will be in touch at ${input.email}, usually within a working day. Nothing else is sent to that address. To talk sooner, there's a free call to book on ${shareUrl(share.id)}.`,
            },
          ],
        }
      },
    )
  },
  {serverInfo: {name: SERVER_NAME, version: '1.0.0'}, instructions: INSTRUCTIONS},
)

export {handler as GET, handler as POST, handler as DELETE}
