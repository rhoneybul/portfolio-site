// Fohm AI quotes, as data, kept word for word with the Docs versions on claude.ai.
// build.mjs lays each out in the brand and renders it to A4 PDF. **bold** is the only markup.

export const issuer = {
  company: 'Fohm AI',
  email: 'rob@fohm.io',
  phone: '+44 7432 590745',
}

const parties = [
  ['Prepared for (the Client)', 'Amy Schrier, CEO, Catalyst Planet'],
  ['From (the Supplier)', 'Fohm AI · Rob Honeybul, Director · rob@fohm.io · +44 7432 590745'],
]

const signatories = [
  ['Name', 'Amy Schrier', 'Rob Honeybul'],
  ['Position', 'CEO', 'Director'],
  ['Signature', '', ''],
  ['Date', '', ''],
]

const general = (scope) =>
  `This document is the whole agreement and replaces earlier discussions. Changes are only valid in writing (email is enough) agreed by both parties. Notices are given by email to each party's usual address. If any clause is unenforceable, the rest still applies. Neither party may transfer this agreement without the other's written consent. This agreement is governed by the law of England and Wales, and the courts of England and Wales have exclusive jurisdiction.${scope}`

const liability = (extra) =>
  `Each party's total liability under this agreement is limited to the fees paid under it. Neither party is liable for indirect or consequential loss, including lost profits${extra}. Nothing here limits liability for death or personal injury caused by negligence, for fraud, or for anything else that cannot be limited by law.`

const latePayment =
  'Invoices are due within 14 days. The Supplier may pause work while an invoice is overdue, and may charge interest and compensation on late payments under the Late Payment of Commercial Debts (Interest) Act 1998.'

export const quotes = [
  {
    file: 'fohm-quote-001-squarespace-ai-trip-search',
    number: 'FOHM-Q-2026-001',
    kind: 'Quote and development agreement',
    title: 'AI trip search for Squarespace',
    parties,
    meta: [
      ['Reference', 'FOHM-Q-2026-001 (quote this on all payments)'],
      ['Date issued', '4 November 2026'],
      ['Valid until', '4 December 2026'],
      ['Currency', 'GBP'],
    ],
    summary:
      'A Squarespace plugin that lets visitors search your existing trip catalogue in plain English ("a week of surfing in Portugal in May", "family trips under £2,000") and see the trips that match, on your own site, in your own style. **£2,500 fixed**, with bug fixes and extra development afterwards at **£100 an hour**, with each request or bug reviewed within one week and a timeline then agreed.',
    scopeTitle: 'What you get',
    scope: [
      ['Catalogue indexing', 'Your existing trips, read from your Squarespace site, indexed so the search understands destinations, dates, activities, prices and descriptions.'],
      ['AI search', 'Natural-language search over that catalogue, returning the best-matching trips with a short line on why each one fits.'],
      ['Search interface', 'A simple search box and results list, embedded on the Squarespace pages you choose and styled to match your site, on phone and desktop.'],
      ['Installation', 'Installed on your site through Squarespace code injection, tested on live pages.'],
      ['Handover', 'A short written guide: how it works, how new trips get picked up, and how to switch it off.'],
    ],
    excluded: [
      'Monitoring, uptime alerts, error reporting or analytics dashboards',
      'Booking, payments, enquiry forms or changes to checkout',
      'Writing, editing or restructuring the trip catalogue itself',
    ],
    timeline: {
      title: 'Delivery',
      intro: 'The build is delivered in four milestones, about four weeks from kick-off. Kick-off is the later of the deposit being paid and access to the site and catalogue being given.',
      head: ['Milestone', 'What happens', 'Target'],
      rows: [
        ['1. Kick-off', 'Deposit paid, access given, search pages agreed', 'Week 0'],
        ['2. Search working', 'Catalogue indexed and search running on a test page for your review', 'Week 2'],
        ['3. Installed', 'Search installed on the agreed live pages, styled to your site', 'Week 3'],
        ['4. Handover', 'Handover guide and source code delivered; acceptance period starts', 'Week 4'],
      ],
      note: 'Target dates are estimates, not guarantees, and move with any delay in access, feedback or payment.',
    },
    lines: [
      ['1', 'AI trip search plugin for Squarespace: build, installation and handover, as above', '1', '£2,500.00', '£2,500.00'],
    ],
    totalLabel: 'Total due for the build',
    total: '£2,500.00',
    priceNote:
      '**Optional, after handover:** bug fixes and extra development at £100.00 per hour. Each request or bug is reviewed within one week, then a timeline and estimate are agreed with you before work starts. Nothing is billed beyond the agreed estimate without your written approval.',
    schedule: [
      ['Deposit (50%)', 'On signing this agreement', '£1,250.00', 'Before kick-off'],
      ['Balance (50%)', 'At handover (milestone 4)', '£1,250.00', '14 days from invoice'],
      ['Hourly work', 'Monthly in arrears, with hours itemised', '£100.00 / hour', '14 days from invoice'],
    ],
    terms: [
      '**Hosting and AI usage.** These start at no cost to you. If usage grows to the point where those costs rise over time, we will review the terms together before anything changes.',
      '**Requirements.** A Squarespace plan that allows code injection, and access to the site for installation.',
    ],
    agreementIntro: 'Once signed by both parties, this quote is the agreement between the Client and Fohm AI (the Supplier) for the work above.',
    clauses: [
      ['Scope and changes', 'The Supplier delivers the work in What you get. Anything outside it, or any change to it, is a change request: the Supplier reviews it within one week and confirms the cost and timeline in writing before starting. Approved changes are billed at £100 an hour.'],
      ['Client responsibilities', "The Client gives timely access to the Squarespace site, the trip catalogue and the accounts needed, gives feedback within 5 working days of a request, and confirms it has the rights to all content supplied. Delays on the Client's side move the delivery dates accordingly."],
      ['Acceptance', 'The Client has 10 working days after handover to report, in writing, anything that does not match the scope, which the Supplier fixes at no charge. If nothing is reported in that time, or the plugin is used on the live site, the work is accepted. Later fixes are billed hourly.'],
      ['Payment', latePayment],
      ['Ownership and handover', 'When all fees are paid, the Client owns the code written for this project, and the Supplier hands over the source code, documentation and any credentials it holds, so the Client or another developer can take the work on. Until then the Supplier keeps ownership and grants the Client a licence to use the work. Open-source libraries and third-party services keep their own licences. The Supplier keeps its pre-existing tools and general know-how, and grants the Client a perpetual licence to use any of them included in the work.'],
      ['Third-party platforms', 'The plugin runs on Squarespace and third-party AI and hosting services. The Supplier is not responsible for their outages, pricing, policy or API changes, or for breakage those changes cause; fixes needed because of them are billed hourly.'],
      ['Security and data', "The plugin is built with reasonable care and common good practice, but no software is free of vulnerabilities. The Supplier does not warrant that the work is secure, uninterrupted or error-free, and is not liable for security breaches, data loss or unauthorised access, including through the platforms it runs on. The Client is responsible for its site, accounts, backups and compliance with data protection law. Where the Supplier handles personal data for the Client, it does so only on the Client's instructions and to deliver this work."],
      ['AI results', "Search results are generated by an AI model and can occasionally be incomplete or inaccurate. They help visitors find trips and are not a statement of availability, price or suitability; the Client's catalogue remains the source of truth."],
      ['Warranty', 'The Supplier warrants that the work will be carried out with reasonable skill and care. Beyond the acceptance period, the work is provided as is, and all other warranties are excluded to the extent the law allows.'],
      ['Liability', liability(', bookings, revenue or data')],
      ['Termination', "Either party can end this agreement at any time with 14 days' written notice, or immediately if the other materially breaches it and does not put it right within 14 days of being told. On termination the Client pays for work done to the end date (the build at the share completed, hourly work at £100 an hour) and, once paid, receives everything produced to that point. The deposit covers work already done and is not refundable. Clauses 5, 7, 10, 12 and 15 continue after termination."],
      ['Confidentiality', "Each party keeps the other's non-public information confidential and uses it only for this work. The Supplier may name the Client and describe the work in general terms in its portfolio unless the Client asks it not to."],
      ['Independent contractor', 'The Supplier works as an independent contractor, chooses how the work is done, and may use subcontractors while remaining responsible for their work.'],
      ['Events outside control', 'Neither party is liable for delays caused by events beyond its reasonable control, such as platform outages, illness or natural disasters, provided it tells the other party promptly.'],
      ['General', general('')],
    ],
    signatories,
  },
  {
    file: 'fohm-quote-002-advisory-developer-quotes',
    number: 'FOHM-Q-2026-002',
    kind: 'Quote and advisory agreement',
    title: 'Advisory: website build quotes from US developers',
    parties,
    meta: [
      ['Reference', 'FOHM-Q-2026-002 (quote this on all payments)'],
      ['Date issued', '4 November 2026'],
      ['Valid until', '15 November 2026'],
      ['Currency', 'GBP'],
    ],
    summary:
      'Technical advisory to get your website rebuild properly priced: a clear brief, the right US developers asked, and three comparable quotes in hand, with a recommendation on which to take. **Advisory until 15 November 2026 is provided free of charge.** After that, concluding the quotes takes about 4 hours of work, billed as a **fixed £1,000**, with the quotes and recommendation delivered by 15 December 2026.',
    scopeTitle: 'Deliverables',
    scope: [
      ['2 × Next.js + Sanity quotes', 'Two written quotes from US-based developers or studios for building the site on Next.js, with Sanity as the content editor.'],
      ['1 × WordPress quote', 'One written quote from a US-based developer or studio for building the same site on WordPress.'],
      ['The brief', 'One build brief, sent to all three, so the quotes cover the same scope and can be compared like for like.'],
      ['Comparison and recommendation', 'A side-by-side of price, timeline, what each includes and leaves out, and the running costs of each platform, with my recommendation.'],
      ['Advisory throughout', 'Calls and messages as needed through the period: questions on the quotes, the developers and the choice between platforms.'],
    ],
    excluded: [
      'Building, designing or hosting the website',
      'Managing the chosen developer once the build starts',
      "The developers' own fees, which are agreed directly between you and them",
    ],
    timeline: {
      title: 'Timeline',
      head: ['Period', 'What happens', 'Cost'],
      rows: [
        ['4 to 15 November 2026', 'Free advisory: the brief drafted and agreed, US developers identified and approached', 'No charge'],
        ['16 November to 15 December 2026', 'About 4 hours to conclude: chasing and checking the three quotes, the comparison and the recommendation', '£1,000 fixed'],
        ['By 15 December 2026', 'Three quotes, comparison and recommendation delivered', ''],
      ],
      note: 'Developers set their own response times, so the 15 December date depends on them replying in time; if one does not, the Supplier will find a replacement where it can.',
    },
    lines: [
      ['1', 'Advisory, 4 to 15 November 2026', '1', '£0.00', 'No charge'],
      ['2', 'Concluding the developer quotes, from 16 November 2026: three US developer quotes (2 × Next.js + Sanity, 1 × WordPress), comparison and recommendation, about 4 hours', '1', '£1,000.00', '£1,000.00'],
    ],
    totalLabel: 'Total due',
    total: '£1,000.00',
    priceNote: 'The £1,000 is a fixed fee: it does not go up if the work takes longer than 4 hours.',
    schedule: [
      ['Advisory fee', '16 November 2026, when the paid work starts', '£1,000.00', '14 days from invoice'],
    ],
    terms: [],
    agreementIntro: 'Once signed by both parties, this quote is the agreement between the Client and Fohm AI (the Supplier) for the advisory above.',
    clauses: [
      ['Scope and changes', 'The Supplier delivers the deliverables above. Anything outside them, such as more quotes, other platforms or managing the build, is a change request: the Supplier confirms the cost and timeline in writing before starting, billed at £100 an hour.'],
      ['Free advisory period', 'Advisory until 15 November 2026 is free and creates no obligation on either side. Either party can stop at any point in that period without charge.'],
      ['Client responsibilities', 'The Client gives the information needed for the brief, answers questions within 5 working days, and confirms it has the rights to any content shared with developers.'],
      ['Payment', latePayment],
      ['Third-party developers', "The developers who quote are independent of the Supplier. Their quotes, prices, timelines and work are their own, and any build contract is made directly between the Client and the developer. The Supplier is not responsible for a developer's quote, performance, delays, security or quality, or for any loss arising from them. The Supplier takes no commission or referral fee from developers."],
      ['Advice', 'The Supplier gives its advice with reasonable skill and care, based on the information available at the time. The decision on which developer and platform to use, and its consequences, rest with the Client.'],
      ['Ownership', 'Once paid, the Client owns the brief, comparison and recommendation, and may share them with anyone. The Supplier keeps its general know-how and templates.'],
      ['Liability', liability(' or revenue')],
      ['Termination', "Either party can end this agreement at any time with 7 days' written notice, or immediately if the other materially breaches it and does not put it right within 7 days of being told. If it ends after 15 November 2026, the Client pays for the paid work done to that point (at £250 an hour, up to the £1,000 fixed fee) and, once paid, receives everything produced so far."],
      ['Confidentiality', "Each party keeps the other's non-public information confidential and uses it only for this work. The brief is shared with the developers approached, with the Client's agreement. The Supplier may name the Client and describe the work in general terms in its portfolio unless the Client asks it not to."],
      ['Independent contractor', 'The Supplier works as an independent contractor and chooses how the work is done.'],
      ['Events outside control', 'Neither party is liable for delays caused by events beyond its reasonable control, including developers not responding, provided it tells the other party promptly.'],
      ['General', general('')],
    ],
    signatories,
  },
]
