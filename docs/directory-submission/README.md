# Directory submission pack: Fohm App Builder

Everything to paste into Claude's Connectors Directory and ChatGPT's app directory.
The server is live at `https://www.fohm.io/mcp` (Streamable HTTP, no sign-in).

## The listing (both directories)

**Name** (100 max): Fohm App Builder

**One-liner** (200 max): Design a health, fitness or wellness app in a chat: Claude draws every screen as a prototype you tap through, then change it until it's right and take away its spec.

**Description** (2,000 max):

> Fohm App Builder turns an idea for an app into a prototype you can tap through, without leaving the chat.
>
> Tell it about the app you have in mind: a coaching or training app, an app for your studio, gym or clinic, or a wellbeing or habit app. It asks a few questions (what the app does and for whom, what people work towards, the look you like, your colour), then Claude designs every screen in your name, words and colour: the landing page, onboarding, home, a session, a goal and the owner's dashboard. It takes about 4 to 6 minutes, and you watch it come together.
>
> The prototype plays right in the chat: tap through it as a member would, or jump to any screen. It also has a page of its own to keep and share for 90 days. Photos are open-licence, from Wikimedia Commons, and credited.
>
> Then make it yours: ask for a change (the name, the words, the colour, a screen, a feature) and Claude designs a new version, keeping the last. When it's right, ask for its spec: every screen, what it shows and where it leads, the navigation and the look, as markdown to keep or hand to a developer or a coding assistant.
>
> No account and no email. Nothing you tell it is passed on to anyone.

**Categories** (1 to 5, from the portal's list): Design, Health & fitness, Productivity (whichever of these the portal offers).

**Icon**: `icon-512.png` (512 × 512 PNG).
**Website**: https://www.fohm.io/app-builder
**Documentation**: https://www.fohm.io/app-builder/mcp
**Privacy policy**: https://www.fohm.io/privacy
**Terms of service**: https://www.fohm.io/terms
**Support**: rob@fohm.io (support page: https://www.fohm.io/app-builder/mcp)
**Company**: Fohm (Rob Honeybul), London. Website https://www.fohm.io.
**URL slug** (permanent): `fohm-app-builder`

## Screenshots, with their prompts

PNG, 1,440 px wide, cropped to the app's response, no prompt in the image.

1. `1-landing.png`: "Help me design an app for my reformer Pilates studio in Islington."
2. `2-onboarding.png`: "Show me what a new member sees when they first open it."
3. `3-home.png`: "What does a member's home screen look like on day one?"
4. `4-program.png`: "Show me the program it builds for them."
5. `5-building.png`: "Design it for me: I'm happy with those answers."

A sixth, if a portal takes one: the spec `get_app_spec` returns, shown in the chat.

## Claude: the portal

Who: a paid plan (Pro, Max, Team or Enterprise; on Team or Enterprise, an Owner).
Where: https://claude.ai/directory/manage → **Submit new** → **MCP connector**.

1. **Connection**: `https://www.fohm.io/mcp`.
2. **Tools**: syncs five tools (app_builder_questions, build_app_prototype, get_app_prototype, revise_app_prototype, get_app_spec). Each has a title and readOnly, destructive, idempotent and openWorld hints, so nothing should be flagged.
3. **Listing**: the fields above, and the screenshots with their prompts.
4. **Use cases**: designing a prototype of an app before building it; seeing how an idea for a fitness, health or wellness app would look; changing the design over several sessions; taking away a spec of every screen to build from. Prerequisites: none. Reads and writes: writes (it saves the answers and the prototype, for 90 days).
5. **Company**: Fohm, https://www.fohm.io, Rob Honeybul, rob@fohm.io.
6. **Authentication**: none (authless: the tools work on what the user tells them, no account).
7. **Data handling**: our own API (it runs on fohm.io). Personal health data: no (it asks about the app, not about the user's health). Sponsored content: no. It calls Anthropic's API to draw the prototype.
8. **Test & launch**: tested with the MCP Inspector and as a custom connector in Claude (do this once yourself in claude.ai before ticking it: Settings → Connectors → Add custom connector).
9. **Compliance**: the seven acknowledgements. No financial transactions; no image, video or audio generation (it draws UI mockups, which are allowed); no prompt injection in descriptions; no conversation data beyond the tools' inputs; public docs.
10. **Review and submit**. **Allowed link URIs**: `https://www.fohm.io` (the view's "Open the full page").

It's listed as a Community connector after an automatic scan; Anthropic may escalate it to a Verified review.
Questions: mcp-review@anthropic.com.

## ChatGPT: the OpenAI platform

Who: an OpenAI platform account with a verified identity (individual or organisation).
Where: platform.openai.com → Apps (or Plugins) → submit an app with an MCP server.

1. **MCP server**: `https://www.fohm.io/mcp`, no authentication.
2. **Domain verification**: the platform shows a token. Set it as `OPENAI_APPS_CHALLENGE` in Doppler's `portfolio-site-web` project (synced to Vercel) and redeploy: `https://www.fohm.io/.well-known/openai-apps-challenge` then serves it. Then press Verify.
3. **Listing**: the fields above (website, support, privacy and terms URLs are all required), the icon and screenshots.
4. **Countries**: the United Kingdom first (London is the market), or everywhere.
5. **Test cases**: below.

### Test cases

Positive (each should call the tools and show a prototype or an answer):

1. "Help me design an app for my reformer Pilates studio in Islington." → `app_builder_questions`, then the questions, then `build_app_prototype`; the view shows the design progressing, then the prototype.
2. "I'm a personal trainer in Hackney. Mock up an app my clients could use between sessions." → the questions, then `build_app_prototype` with a coaching template.
3. "Prototype an app for my running club that gets members ready for the London Marathon." → as above, with goals and races.
4. "How's my app coming along?" (after a build) → `get_app_prototype`: its status, screens and link.
5. "Make it dark, and have Home lead with this week's classes." → `revise_app_prototype` with that change; a new version and link.
6. "Give me the spec so my developer can build it." → `get_app_spec`: the screens, navigation, look and answers as markdown.

Negative (none should call the builder's tools):

1. "What's the weather in London today?"
2. "Write me a Python function that sorts a list."
3. "Book me a Pilates class for Thursday." (it designs apps; it doesn't book classes)

## Before you submit

- Add `https://www.fohm.io/mcp` as a custom connector in claude.ai and run test case 1 end to end.
- Read `/privacy` and `/terms` and confirm them: the two-year retention, England and Wales law, rob@fohm.io as support.
- On ChatGPT, OpenAI reviews what an app is for: this one designs, revises and specs a prototype, and asks for no contact details. Say that plainly if they ask.
- Re-run `screenshots.cjs` (the view no longer has the form; `extra-contact.png` is gone).

The screenshots were made by `docs/directory-submission/screenshots.cjs` against the live server: re-run it after a change to the view.

## Reply to Anthropic's review (Nov 27 2026)

Sent to the review email after the fix is live:

> Thanks for the review. We've changed the connector to address each point:
>
> - `build_app_prototype` no longer asks for an email or any contact details, and a chat's prototype is no longer passed to Fohm for follow-up: it's kept only to serve its link, for 90 days.
> - `contact_fohm` is removed, and the in-chat view and the prototype's page no longer carry a contact form, booking link or sales pitch.
> - Two new tools make it something people come back to: `revise_app_prototype` designs a new version with the change the user asks for, and `get_app_spec` returns the design (every screen, the navigation and the look) as markdown to keep or build from. `get_app_prototype` is now model-visible, so "how's my app going?" works.
>
> The privacy policy (https://www.fohm.io/privacy) and docs (https://www.fohm.io/app-builder/mcp) are updated to match. We'd be grateful if you'd take another look.
