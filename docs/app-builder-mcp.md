# The app builder as an MCP: plan and launch

A marketing tool: people planning a health, fitness or wellness app design it in the chat they already use, tap through it as a prototype, and send it to Fohm.
The target for the first months is London: personal trainers, run and HYROX coaches, reformer, yoga and Pilates studios, physios, nutritionists, wellbeing practitioners and health-tech founders.

## What it does

1. Someone asks Claude or ChatGPT to help plan a fitness, health or wellness app.
2. The assistant finds Fohm App Builder (by its tool descriptions, which name those sectors) and asks the builder's questions in conversation.
3. Last, the email, as on the website. `build_app_prototype` answers at once with a link to `www.fohm.io/app-builder/p/<id>`, and Claude designs the app in the background (4 to 6 minutes); the page fills in, then shows the website's deck with Build it with me under it, inline in the chat too where MCP Apps render.
4. They send it to Fohm, from the page's form or by asking the assistant (`contact_fohm`).
5. Slack hears every build and every lead, tagged as from the MCP, with the sector and city (London is pinned).

The client's model does the talking and picks the photo searches; Claude's design costs what the website's does, under the same limits (3 a day an email, and 30 an hour in all).

## Decisions taken

1. The MCP lives in the site (`/mcp`, Vercel), not a separate server: one deploy, and the questions, prototype and Slack summary stay the website's own code.
2. Stateless and open, no sign-in: claude.ai's and ChatGPT's connectors can't send a token, and nothing it serves is private.
3. The email is asked before the prototype, as on the website (Robert, Nov 26 2026), typed by the person, never guessed by the assistant.
4. The shared prototype has its own random id, separate from the submission's, so a link passed on never opens the submission page or the brief.
5. `contact_fohm` only runs when the person asks and types their own name and email; the tool says so to the model.
6. The build runs on the server, after the tool answers, so a chat never waits minutes for a reply and the link keeps the result. The in-chat view is a frame around the hosted page, so the prototype has one implementation.
7. Sector and city are two new optional answers, asked only in the chat, so the website's builder is unchanged.

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

Slack is the first dashboard: builds and leads from the MCP, by sector, with London pinned.
Watch three numbers a week: prototypes built, the share of them sent to Fohm, and calls booked from them.
If prototypes come but leads don't, the deck under the prototype is the thing to change; if nothing comes, it's discovery: the listings and the landing page.
