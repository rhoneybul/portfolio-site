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

1. Import this repo at https://vercel.com/new.
2. Set **Root Directory** to `web` (framework is detected as Next.js).
3. Environment variables (optional, sensible defaults are built in):
   - `NEXT_PUBLIC_SITE_URL`: your final domain, e.g. `https://robhoneybul.com`
4. Deploy. Then add your production domain to Sanity CORS origins:
   `cd studio && npx sanity cors add https://your-domain.com`
   (`https://*.vercel.app` and `http://localhost:3000` are already allowed.)

## The app builder (`/app-builder`)

Asks what a first look at an app needs (17 questions), then walks the visitor through their app as a deck: the prototype with its logo and open-licence photos (found on Wikimedia Commons from searches Claude picks from their answers: `/api/photo-ideas`, through Vercel's AI Gateway with the project's OIDC token, falling back to words from the answers), the owner's dashboard, Slack alerts, PostHog metrics, Sentry monitoring, payments, security and the stores. It ends on Build it with me: WhatsApp, or a contact form. All of it runs in the browser.

Visitors give their email before they see their app, and never see the brief. Each finished build, and each lead from Build it with me, is saved as a private blob in the Vercel Blob store `fohm-app-builder` (`BLOB_READ_WRITE_TOKEN`), and the Fohm Slack channel (`SLACK_WEBHOOK_URL`) gets a summary linking to its page, `/app-builder/submissions/<id>`: their answers, what they saw, the brief, and how to build it with Claude (the raw brief is at `.../brief`). The id is random and only Slack is told it. Both keys are in Doppler's `portfolio-site-web` project, synced to Vercel.
