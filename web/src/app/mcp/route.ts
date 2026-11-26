import {after} from 'next/server'
import {createMcpHandler} from 'mcp-handler'
import {registerAppResource, registerAppTool, RESOURCE_MIME_TYPE} from '@modelcontextprotocol/ext-apps/server'
import {z} from 'zod'
import {INSTRUCTIONS, SERVER_NAME, SERVER_TITLE, answersOf, buildInput, builtText, contactInput, questionsForChat, resolveOptions} from '@/app-builder/mcp'
import {readShare, runBuild, shareUrl, startShare, tell} from '@/app-builder/mcp-build'
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
// The bridge to the host, pinned; the view is a frame around the prototype's own page.
const BRIDGE = 'https://unpkg.com/@modelcontextprotocol/ext-apps@2.0.4/dist/src/app-with-deps.js'

const viewHtml = `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<style>html,body{margin:0;background:transparent;font:14px system-ui,sans-serif}iframe{display:block;width:100%;height:900px;border:0}p{margin:24px;color:#555}</style>
</head><body><p id="wait">Starting your app…</p><iframe id="proto" title="Your app, as a prototype" hidden></iframe>
<script type="module">
import {App} from '${BRIDGE}'
const app = new App({name: '${SERVER_TITLE}', version: '1.0.0'})
app.ontoolresult = ({structuredContent}) => {
  const url = structuredContent && structuredContent.embedUrl
  if (!url) return
  const frame = document.getElementById('proto')
  frame.src = url
  frame.hidden = false
  document.getElementById('wait').hidden = true
}
await app.connect()
</script></body></html>`

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
          'The questions Fohm asks before designing a health, fitness or wellness app (a coaching or training app, a studio, gym, clinic or wellbeing app), with examples and choices. Call this first when someone wants to design, plan, mock up or prototype an app, then ask them the questions in your own words.',
        inputSchema: z.object({}),
        annotations: {readOnlyHint: true, openWorldHint: false},
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
        title: 'Design my app',
        description:
          'Claude designs the person’s app from their answers, every screen (landing page, onboarding, home, a session, their goal, the owner’s dashboard) in their name, words and colour, in about 4 to 6 minutes, and returns a link that fills in as it’s drawn. Use the answers from app_builder_questions, including the email the person typed. Show them the link.',
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
          text: viewHtml,
          _meta: {ui: {csp: {resourceDomains: ['https://unpkg.com'], frameDomains: [site]}, prefersBorder: true}},
        },
      ],
    }))

    server.registerTool(
      'contact_fohm',
      {
        title: 'Send my app to Fohm',
        description:
          'Sends the person’s prototype and their details to Rob at Fohm, a London app studio, so he can get in touch about building it. Only when they have asked for that; use the name and email they typed, never a guess.',
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
