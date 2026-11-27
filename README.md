# Fohm AI website

The site for Fohm AI, Rob Honeybul's technical leadership and AI engineering practice.
Brand kit (logo, colours, type, social and print assets): [`brand/`](brand/README.md), also served at `/brand/index.html`.

Design follows the ANDSAVU portfolio (off-white, one red-orange ink, giant serif wordmark, marquee),
with the greeting tag, offset-shadow buttons, portrait and services band from the David shot, and the
dark statement block, floating badges and text links from the H.A shot.

Monorepo with a standalone Sanity Studio and a Next.js site.

```
studio/   Sanity Studio (project 9q3oqv8p, dataset production)
web/      Next.js 16 App Router site, reads content from Sanity
brand/    Fohm AI brand kit and its generators
```

## Editing content

All copy, services, work, testimonials, experience, skills, your photo, CV, booking link and WhatsApp
number live in Sanity. Edit them in the Studio and the site updates live (no redeploy).

- Hosted Studio: https://fohm.sanity.studio (redeploy with `npm run deploy` in `studio/`)
- Local Studio: `cd studio && npm install && npm run dev` → http://localhost:3333

## Local development

```bash
cd web && npm install && npm run dev      # http://localhost:3000
cd studio && npm install && npm run dev   # http://localhost:3333
```

After changing schemas or GROQ queries, regenerate types and redeploy the schema:

```bash
cd studio
npm run typegen          # writes web/sanity.types.ts
npx sanity schema deploy # keeps the Sanity MCP / AI tools in sync
```

## Contact features

| Feature | Service | Setup |
| --- | --- | --- |
| Book a call | [Cal.com](https://cal.com) (free) | **Site settings → Contact → Booking link** (currently your Cal.com profile, which offers the 15 and 30-minute calls). Opens in an embedded scheduler. |
| Contact form | WhatsApp | The form opens WhatsApp with the visitor's message pre-filled to **Site settings → Contact → WhatsApp number**. No backend or keys. |
| Blog | Sanity | **Blog** in the Studio. `/blog` shows "Coming soon" until the first post is published, then lists posts. |
| Pricing | Sanity | **Site settings → Pricing**: the plans on `/pricing` (price, unit, description, button). |

## Deploying to Vercel

The live site is the Vercel project `fohm-site` (renamed from `portfolio-site-web`, Nov 2026), deploying `main` to https://www.fohm.io. Its secrets live in Doppler's `portfolio-site-web` project, synced to it.

1. Import this repo at https://vercel.com/new.
2. Set **Root Directory** to `web` (framework is detected as Next.js).
3. Environment variables (optional, sensible defaults are built in):
   - `NEXT_PUBLIC_SITE_URL`: your final domain, e.g. `https://robhoneybul.com`
4. Deploy. Then add your production domain to Sanity CORS origins:
   `cd studio && npx sanity cors add https://your-domain.com`
   (`https://*.vercel.app` and `http://localhost:3000` are already allowed.)

## The app builder (`/app-builder`)

Asks what a first look at an app needs, then Claude designs the visitor's app while they watch, a few minutes start to finish.

The questions are a chat, like fohm-scaffold's new-app discovery chat: Claude's questions on the left, their answers on the right, and under the newest question the options to tap (a kind of app, yes or no, picks tailored to their app) or a box to type in.
A single choice or a pick under a one-line answer is sent as it's tapped; any earlier answer has Change, which takes the chat back to it.
A heads-up before the first says about how many there are, in three parts (the idea; how it works; how it looks and the practical bits), and every question says where they are ("Part 2 of 3 · about 6 to go").
The idea is always first and the email always last; in between, Claude (`claude-haiku-5-5`, `/api/builder/next`) picks the next row of the catalogue (`QUESTIONS` in `web/src/app-builder/options.ts`) from what they've said, rewords it in their terms with picks for their app, fills in what an earlier answer already said for them to confirm, and skips what their answers make irrelevant.
Each address asks Claude for at most 60 questions an hour (a whole run is about 15); past that, the fixed order carries on (`web/src/app-builder/rate-limit.ts`, shared with the prototype's limits).
Everything it sends back is checked (`web/src/app-builder/next-question.ts`), and without Claude, or when it's slow or wrong, the next question comes from the fixed order at once.
Then:

1. Open-licence photos are found on Wikimedia Commons from searches Claude picks from their answers (`/api/photo-ideas`, falling back to words from the answers). The site's server searches Commons (`/api/photos`, `src/app-builder/commons.ts`), named by its User-Agent and cached for a day, because Commons rate-limits anonymous searches from browsers: one build found no photos that way, and Claude drew every photo slot empty.
2. Claude plans the whole prototype (`/api/prototype/plan`): every screen a member meets, from the landing page through onboarding, Home, a session and a goal to Account, and the owner's dashboard, with what they all share. The plan comes back signed, so the next step draws only plans this site made.
3. Claude draws each part on the house kit (`/api/prototype/screen`, five at a time), and each appears as it's done. The kit is fohm-scaffold's house style (`src/app-builder/prototype-doc.ts`), so the screens are one app.

Its first choice, the app closest to theirs, shows each example built on fohm-scaffold (Naz, Etapa, Aluzam, Naz Surf, Strawberry Fields) with a description and three screenshots (`TEMPLATES` in `web/src/app-builder/options.ts`, images in `web/public/app-builder/examples/<value>-1.webp` to `-3.webp`). The apps' screens come from their own repositories' published screenshots (Naz's landing, Etapa's pitch deck, Aluzam's landing); the games' are rendered from their builds with Playwright at 1280×720. A tap on a screenshot picks its app.

Then the deck walks them through it: the prototype Claude drew (in a sandboxed frame, tapped through screen by screen), its dashboard, Slack alerts, PostHog metrics, Sentry monitoring, payments, security and the stores. It ends on Build it with me: WhatsApp, or a contact form.

Claude is reached through the Anthropic API: `ANTHROPIC_API_KEY`, in Doppler's `portfolio-site-web` project, synced to Vercel. `PROTOTYPE_PLAN_MODEL` (default `claude-opus-5-5`) plans and `PROTOTYPE_MODEL` (default `claude-sonnet-5-5`) draws. Until the key is set, or if Claude can't finish, the deck shows the quick sketch drawn in the browser (`app-prototype.tsx`) instead. Each email can draw 3 prototypes a day and each address 6 an hour, so the builder can't run up a bill.

The website's build runs on the server (`/api/prototype/build`, `src/app-builder/mcp-build.ts`, as the chat's does), so a visitor can close the tab: the building page follows it, and its link, `/app-builder/p/<id>`, works for 7 days. When it's done they're emailed that link through Resend, once `RESEND_API_KEY` and `APP_BUILDER_FROM` (a sender on a domain verified in Resend, `Rob at Fohm <apps@send.fohm.io>`, on the Resend-verified domain send.fohm.io) are set; `APP_BUILDER_REPLY_TO` is optional. Until then the page tells them to keep the link. Every Claude call for a visitor is priced (`src/app-builder/cost.ts`), and Slack's message for each build says what it cost, the questions included.

To switch the builder off without a deploy: Site settings → App builder → Pause the app builder, in the Studio. Within a minute the page offers a call instead of Start, and no route asks Claude for anything. `APP_BUILDER_OFF=1` on Vercel does the same, after a redeploy.

Once email is set up, an app designed on the website opens only for the email it was designed with (`src/app-builder/visitor.ts`). The emailed link signs that address in on the browser that opens it (a signed cookie, 30 days), and the browser that designed the app can always open it. Anyone else opening the link is asked for the owner's email and sent a sign-in link, which goes only to an address that designed that app. `/app-builder/mine` ("Your apps") lists everything an email has designed. The signatures use `APP_BUILDER_SECRET` (set one in Doppler), else `PROTOTYPE_SECRET` or the Anthropic key. Apps from a chat stay open by link, since the chat shows them in place.

The name check on "Are you sure of that name?" asks the domain registries and the App Store as it is. It checks UK company names too once `COMPANIES_HOUSE_API_KEY` (a free key from Companies House's developer hub) is set.

Visitors give their email before they see their app, and never see the brief. Each prototype Claude draws is saved as private blobs (`prototypes/<id>/`). Each finished build, and each lead from Build it with me, is saved as a private blob in the Vercel Blob store `fohm-app-builder-private` (`BLOB_READ_WRITE_TOKEN`; the store must be private, as every blob is written private), and the Fohm Slack channel (`SLACK_WEBHOOK_URL`) gets a summary linking to its page, `/app-builder/submissions/<id>`: their answers, what they saw (Claude's prototype, at `.../prototype` and `.../prototype?view=laptop`), the brief, and how to build it with Claude (the raw brief is at `.../brief`). The brief follows fohm-scaffold's new-app skill: research, then the real prototype in Claude Design, starting from this one, approved before anything is created. The id is random and only Slack is told it, and every submission page, brief and prototype asks for the owner's password, `APP_BUILDER_PASSWORD` (any user name, at least 12 characters; in Doppler's `portfolio-site-web` project, synced to Vercel), and doesn't exist until it's set (`src/proxy.ts`, `src/app-builder/owner.ts`). Claude can't type a password, so the brief's link on the page, and the prototype's link in the brief, carry a key that opens that one path. Both keys are in Doppler's `portfolio-site-web` project, synced to Vercel.

**`new --from` reads the brief.** Each submission has its brief as JSON too (`.../brief.json`, fohm-scaffold's `lib/brief.mjs`, version 1: the answers as `new`'s options, the rest of the answers, the prototype's link and the markdown brief, never the visitor's email). Its link opens with a key like the brief's, so the brief's create step is one command: `npx github:rhoneybul/fohm-scaffold new --from "<that link>" --json`.

**Handing it to Claude.** The submission's page gives one prompt to paste into a Claude Code session opened in fohm-scaffold: it links the brief (keyed), which carries every answer, the prototype's link, what's still to ask the owner and the `new --from` command.

A call booked from Build it with me opens Cal.com with their email and a note about their app filled in, and carries the builder session's random reference (`metadata[ref]`, made in the browser). The Slack message for the booking (from Cal.com's webhook, `/api/cal-webhook`, or the embed, `/api/booking`) follows it to their latest submission (`refs/<ref>.json` in the same Blob store) and links it, so the visitor never holds the submission's id.

## The app builder as an MCP server (`/mcp`)

The same builder from inside Claude, ChatGPT or any MCP client, at `https://www.fohm.io/mcp` (Streamable HTTP, stateless, no sign-in), aimed at people building health, fitness and wellness apps, first in London.
Plan, launch and listings: [`docs/app-builder-mcp.md`](docs/app-builder-mcp.md).

- `app_builder_questions`: the builder's questions (`QUESTIONS`, the email last, no photo step), plus the sector and the city.
- `build_app_prototype`: needs the email the person typed, as the website does, and the same limits (3 a day an email, 30 an hour in all). It answers at once with a link, `/app-builder/p/<id>`, and Claude designs the app in the background (`web/src/app-builder/mcp-build.ts`: Commons photos from the chat's searches, Claude's plan, five parts at a time, `maxDuration` 800s), saving how far it has got in `shares/<id>.json` (never the email). The page shows the progress, then the website's deck and Build it with me; the build is then saved as a submission and Slack hears it. Where the client renders MCP Apps, the phone and the form show in the chat (`ui://fohm/prototype.html`, a frame around `?embed=1`).
- `contact_fohm`: the lead, as the website's form sends it, only when the person asks.

Listed as a Claude Code plugin in this repository's marketplace (`.claude-plugin/marketplace.json`), and in the MCP registry from `server.json`. What the builder keeps is on `/privacy`: change it with what the builder stores.
