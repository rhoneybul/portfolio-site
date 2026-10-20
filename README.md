# Rob Honeybul: portfolio & consulting site

Monorepo with a standalone Sanity Studio and a Next.js site.

```
studio/   Sanity Studio (project 9q3oqv8p, dataset production)
web/      Next.js 16 App Router site, reads content from Sanity
```

## Editing content

All copy, services, work, experience, skills, your photo, CV, booking link and WhatsApp
number live in Sanity. Edit them in the Studio and the site updates live (no redeploy).

- Hosted Studio: https://rob-honeybul.sanity.studio (after `npm run deploy` in `studio/`)
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
| Book a call | [Cal.com](https://cal.com) (free) or Calendly (free tier) | Paste your booking link into **Site settings → Contact → Booking link**. Buttons and an embedded scheduler appear automatically. |
| Contact form | [Web3Forms](https://web3forms.com) (free, 250 submissions/month) | Create an access key with your email, then set `WEB3FORMS_ACCESS_KEY` in Vercel. Until then the form tells people to email/WhatsApp you. |
| WhatsApp | wa.me link | **Site settings → Contact → WhatsApp number** |

## Deploying to Vercel

1. Import this repo at https://vercel.com/new.
2. Set **Root Directory** to `web` (framework is detected as Next.js).
3. Environment variables (optional, sensible defaults are built in):
   - `NEXT_PUBLIC_SITE_URL`: your final domain, e.g. `https://robhoneybul.com`
   - `WEB3FORMS_ACCESS_KEY`: contact form key
4. Deploy. Then add your production domain to Sanity CORS origins:
   `cd studio && npx sanity cors add https://your-domain.com`
   (`https://*.vercel.app` and `http://localhost:3000` are already allowed.)
