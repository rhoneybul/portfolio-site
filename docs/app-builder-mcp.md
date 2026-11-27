# The app builder as an MCP: plan and launch

A design tool people come back to: someone planning a health, fitness or wellness app designs it in the chat they already use, taps through it as a prototype, changes it until it's right, and takes away its spec.
The target for the first months is London: personal trainers, run and HYROX coaches, reformer, yoga and Pilates studios, physios, nutritionists, wellbeing practitioners and health-tech founders.

Anthropic's directory review turned down the first version (Nov 27 2026) as a lead-generation funnel: `build_app_prototype` needed an email and sent the prototype to Fohm for follow-up, `contact_fohm` forwarded the person's details, and there was no tool to return to.
This version fixes all three: no email, nothing passed to Fohm, and tools to come back with.

## What it does

1. Someone asks Claude or ChatGPT to help plan a fitness, health or wellness app.
2. The assistant finds Fohm App Builder (by its tool descriptions, which name those sectors) and asks the builder's questions in conversation.
3. `build_app_prototype` answers at once with a link to `www.fohm.io/app-builder/p/<id>`, and Claude designs the app in the background (4 to 6 minutes); the page fills in, inline in the chat too where MCP Apps render.
4. They come back to it: `get_app_prototype` says how it's going and lists its screens, and `revise_app_prototype` designs a new version with the change they ask for.
5. `get_app_spec` gives them the design as markdown, to keep or hand to whoever builds it.
6. Slack hears only that a prototype was made from a chat, and what Claude cost: no answers, no contact details.

The client's model does the talking and picks the photo searches; Claude's design costs what the website's does, under a limit by address (6 a day, a revision counting as one) and 30 an hour in all.

## Decisions taken

1. The MCP lives in the site (`/mcp`, Vercel), not a separate server: one deploy, and the questions and prototype stay the website's own code.
2. Stateless and open, no sign-in: claude.ai's and ChatGPT's connectors can't send a token, and nothing it serves is private.
3. No email and no contact tool in the chat (after the directory review, Nov 27 2026): the limit is by the caller's address instead of the email.
4. The shared prototype has its own random id, so a link passed on never opens anything else; a chat's is kept 90 days (`CHAT_LINK_DAYS`), since the person comes back to it, against the website's 7.
5. A chat's build is the person's own: it isn't saved as a submission, and its page has no Build it with me, booking or form.
6. A revision is a new version from the last one's answers plus the change in the person's words (`revision`, which the plan's facts put above everything else); the earlier version stays, so nothing is overwritten.
7. The spec is built from the saved plan (`specOf`), with no Claude call, so it's free and instant.
8. The build runs on the server, after the tool answers, so a chat never waits minutes for a reply and the link keeps the result. The in-chat view draws the prototype from `get_app_prototype`, so the prototype has one implementation.

## Listings

- **Claude Code plugin marketplace** (this repository): `/plugin marketplace add rhoneybul/portfolio-site`, then `/plugin install fohm-app-builder@fohm`. The repository must be public for others to add it.
- **MCP registry** (which PulseMCP, Glama and others read): `server.json`, published by the owner with `mcp-publisher login github` then `mcp-publisher publish` from the repository's root.
- **Claude's connector directory**: submitted by the owner through Anthropic's form for remote MCP servers: the URL, `/privacy`, the three tools with their annotations, and a support contact. No sign-in, so no test account.
- **ChatGPT's apps directory**: submitted from the OpenAI platform, with the same URL and privacy page.
- **Anyone, today**: claude.ai → Settings → Connectors → Add custom connector → `https://www.fohm.io/mcp`.

## Getting it in front of London

- **A landing page for the search**: `/build-a-fitness-app` (London in its title and copy): Add to Claude, the web builder, Naz and Etapa as proof, and an in-person call in London.
- **Show the result, not the tool**: a 30-second screen recording of a chat turning into a tappable app, for LinkedIn and Instagram, posted weekly with a different London business each time (a run club, a reformer studio, a physio).
- **Make prototypes for them first**: build a prototype for 20 named London studios, coaches and clinics from their own websites, and send each its link with one line. The prototype is the pitch.
- **Where the founders are**: London health-tech and fitness-business meetups and accelerators (DigitalHealth.London is one), and the communities run clubs and studios already use. Demo it live: someone names their app, and it's on their phone a minute later.
- **For health, lead on the hard part**: health data is special-category data under UK GDPR, and an app that diagnoses or treats can be a medical device in the MHRA's eyes. Fohm builds in consent and age checks from day one, as in Naz; say so to clinics and health founders.
- **Partners who don't build apps**: gym-software consultants, fitness marketing agencies and business coaches for PTs, each with a link that tags their leads.

## How it's measured

Slack is the first dashboard: prototypes and revisions made from the MCP, with what they cost.
Watch two numbers a week: prototypes built, and the share revised at least once (people coming back).
The chat sends no leads; people who want it built find Fohm from the website, as anyone else does.
