// Fohm AI quotes, as data. build.mjs lays each out in the brand and renders it to A4 PDF.
const rob = {
  name: 'Rob Honeybul',
  email: 'rob@fohm.io',
}

export const issuer = {
  company: 'Fohm AI',
  name: 'Rob Honeybul',
  role: 'Director',
  email: 'rob@fohm.io',
  whatsapp: '+44 7432 590745',
  site: 'portfolio-site-web-lime.vercel.app',
}

export const quotes = [
  {
    file: 'fohm-quote-001-squarespace-ai-trip-search',
    number: 'FOHM-Q-2026-001',
    date: '4 November 2026',
    validUntil: '4 December 2026',
    to: rob,
    title: 'AI trip search for Squarespace',
    summary:
      'A Squarespace plugin that lets visitors search your existing trip catalogue in plain English ("a week of surfing in Portugal in May", "family trips under £2,000") and see the trips that match, on your own site, in your own style.',
    scopeTitle: 'What you get',
    scope: [
      ['Catalogue indexing', 'Your existing trips, read from your Squarespace site, indexed so the search understands destinations, dates, activities, prices and descriptions.'],
      ['AI search', 'Natural-language search over that catalogue, returning the best-matching trips with a short line on why each one fits.'],
      ['Search interface', 'A simple search box and results list, embedded on the Squarespace pages you choose and styled to match your site, on phone and desktop.'],
      ['Installation', 'Installed on your site through Squarespace code injection, tested on live pages.'],
      ['Handover', 'A short written guide: how it works, how new trips get picked up, and how to switch it off.'],
    ],
    excludedTitle: 'Not included',
    excluded: [
      'Monitoring, uptime alerts, error reporting or analytics dashboards',
      'Booking, payments, enquiry forms or changes to checkout',
      'Writing, editing or restructuring the trip catalogue itself',
      'Hosting and AI usage costs, which run on your own accounts',
    ],
    lines: [
      { item: 'AI trip search plugin for Squarespace', detail: 'Build, installation and handover, as above', amount: '£2,500', fixed: true },
      { item: 'Bug fixes and extra development', detail: 'After handover, on request. Turnaround within one week of the request', amount: '£100 / hour', fixed: false },
    ],
    total: '£2,500',
    totalNote: 'Fixed price for the build. Hourly work is billed only when you ask for it.',
    terms: [
      'Prices are in GBP.',
      'The build is invoiced 50% on acceptance and 50% on handover; hourly work is invoiced monthly in arrears.',
      'Needs a Squarespace plan that allows code injection, and access to the site for installation.',
      'Hourly work is estimated before it starts and nothing is billed beyond the estimate without your agreement.',
    ],
  },
  {
    file: 'fohm-quote-002-advisory-developer-quotes',
    number: 'FOHM-Q-2026-002',
    date: '4 November 2026',
    validUntil: '18 November 2026',
    to: rob,
    title: 'Advisory: website build quotes from US developers',
    summary:
      'Technical advisory from now until 15 December 2026, to get your website rebuild properly priced: a clear brief, the right US developers asked, and three comparable quotes in hand, with a recommendation on which to take.',
    scopeTitle: 'Deliverables',
    scope: [
      ['2 × Next.js + Sanity quotes', 'Two written quotes from US-based developers or studios for building the site on Next.js with Sanity as the content editor.'],
      ['1 × WordPress quote', 'One written quote from a US-based developer or studio for building the same site on WordPress.'],
      ['The brief', 'One build brief, sent to all three, so the quotes cover the same scope and can be compared like for like.'],
      ['Comparison and recommendation', 'A side-by-side of price, timeline, what each includes and leaves out, and the running costs of each platform, with my recommendation.'],
      ['Advisory until 15 December', 'Calls and messages as needed through the period: questions on the quotes, the developers and the choice between platforms.'],
    ],
    excludedTitle: 'Not included',
    excluded: [
      'Building, designing or hosting the website',
      'Managing the chosen developer once the build starts',
      "The developers' own fees, which are agreed directly between you and them",
    ],
    lines: [
      { item: 'Advisory and developer quotes', detail: 'Until 15 December 2026: brief, three US developer quotes (2 × Next.js + Sanity, 1 × WordPress), comparison and recommendation', amount: '£1,000', fixed: true },
    ],
    total: '£1,000',
    totalNote: 'Fixed fee for the period.',
    terms: [
      'Prices are in GBP.',
      'Invoiced on acceptance.',
      'The advisory period ends on 15 December 2026.',
      'The quotes are the developers’ own; Fohm AI takes no commission or referral fee from them.',
    ],
  },
]
