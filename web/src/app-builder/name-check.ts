/**
 * Whether an app's name is free to use, checked as the visitor names it: its domains (each
 * registry's RDAP, which answers 404 for a name nobody holds), apps already in the App Store by that
 * name (Apple's public search), and, with COMPANIES_HOUSE_API_KEY (a free key from Companies House's
 * developer hub), UK companies by that name. Trade marks have no free API to ask, so the result links
 * to the registers' own searches. A first look, not clearance: the naming round does it properly.
 * Server only.
 */

export interface NameCheck {
  name: string
  /** Each domain, and whether someone holds it (null: the registry didn't answer). */
  domains: {domain: string; taken: boolean | null}[]
  /** Apps in the App Store with that name, or starting with it. */
  apps: {name: string; seller: string; url: string}[]
  /** UK companies with that name, or null when Companies House isn't set up to be asked. */
  companies: {name: string; status: string}[] | null
  trademarks: {label: string; url: string}[]
  /** In a line: clear, or worth a naming round, and why. */
  verdict: string
  clear: boolean
}

/** The name as a domain label: "Tide Pool!" is tidepool. */
export const domainLabel = (name: string) =>
  name
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 63)

/** Each registry's RDAP address for a domain under it. */
const RDAP: Record<string, (d: string) => string> = {
  com: (d) => `https://rdap.verisign.com/com/v1/domain/${d}`,
  app: (d) => `https://pubapi.registry.google/rdap/domain/${d}`,
  'co.uk': (d) => `https://rdap.nominet.uk/uk/domain/${d}`,
  io: (d) => `https://rdap.identitydigital.services/rdap/domain/${d}`,
}

async function domainTaken(domain: string, tld: string): Promise<boolean | null> {
  const res = await fetch(RDAP[tld](domain), {headers: {Accept: 'application/rdap+json'}, signal: AbortSignal.timeout(6_000)}).catch(() => null)
  if (!res) return null
  if (res.status === 404) return false
  return res.ok ? true : null
}

interface Found {
  trackName?: string
  sellerName?: string
  trackViewUrl?: string
  userRatingCount?: number
}

/** A name, compared as a person reads it: case, spaces and punctuation aside. */
const plain = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()

/** Whether an app's store name is this name: the whole of it, or it before a colon or dash ("Tidepool: Surf Coach"). */
export function sameName(name: string, storeName: string) {
  const want = plain(name)
  const has = plain(storeName.split(/\s[:\-–—|]\s?|:\s/)[0] ?? storeName)
  return Boolean(want) && (has === want || has.replace(/ /g, '') === want.replace(/ /g, ''))
}

async function appsNamed(name: string): Promise<NameCheck['apps']> {
  const seen = new Map<string, NameCheck['apps'][number]>()
  for (const country of ['gb', 'us']) {
    const url = `https://itunes.apple.com/search?${new URLSearchParams({term: name, entity: 'software', country, limit: '25'})}`
    const res = await fetch(url, {signal: AbortSignal.timeout(6_000)}).catch(() => null)
    if (!res?.ok) continue
    const results = ((await res.json().catch(() => null)) as {results?: Found[]} | null)?.results ?? []
    for (const r of results)
      if (r.trackName && sameName(name, r.trackName) && !seen.has(r.trackName))
        seen.set(r.trackName, {name: r.trackName, seller: r.sellerName ?? '', url: r.trackViewUrl ?? ''})
  }
  return [...seen.values()].slice(0, 5)
}

/** A company's name without its ending: "Tidepool Ltd" is tidepool. */
const companyCore = (s: string) => plain(s).replace(/\b(limited|ltd|plc|llp|lp|cic|company|co|uk)\b/g, '').replace(/\s+/g, ' ').trim()

async function companiesNamed(name: string): Promise<NameCheck['companies']> {
  const key = process.env.COMPANIES_HOUSE_API_KEY
  if (!key) return null
  const url = `https://api.company-information.service.gov.uk/search/companies?${new URLSearchParams({q: name, items_per_page: '20'})}`
  const res = await fetch(url, {headers: {Authorization: `Basic ${btoa(`${key}:`)}`}, signal: AbortSignal.timeout(6_000)}).catch(() => null)
  if (!res?.ok) return null
  const items = ((await res.json().catch(() => null)) as {items?: {title?: string; company_status?: string}[]} | null)?.items ?? []
  const want = companyCore(name)
  return items
    .filter((i) => i.title && companyCore(i.title) === want)
    .map((i) => ({name: i.title!, status: i.company_status ?? ''}))
    .slice(0, 5)
}

/** The registers' own searches, for trade marks: there's no free API to ask. */
const trademarkSearches = (): NameCheck['trademarks'] => [
  {label: 'UK trade marks', url: 'https://trademarks.ipo.gov.uk/ipo-tmtext'},
  {label: 'EU trade marks', url: 'https://euipo.europa.eu/eSearch/'},
  {label: 'US trade marks', url: 'https://tmsearch.uspto.gov/'},
]

export async function checkName(name: string): Promise<NameCheck> {
  const label = domainLabel(name)
  const [domains, apps, companies] = await Promise.all([
    label ? Promise.all(Object.keys(RDAP).map(async (tld) => ({domain: `${label}.${tld}`, taken: await domainTaken(`${label}.${tld}`, tld)}))) : Promise.resolve([]),
    appsNamed(name).catch(() => []),
    companiesNamed(name).catch(() => null),
  ])
  const free = domains.filter((d) => d.taken === false).map((d) => d.domain)
  const comFree = domains.find((d) => d.domain.endsWith('.com'))?.taken === false
  const problems = [
    apps.length && (apps.length === 1 ? 'an app in the App Store already uses it' : `${apps.length} apps in the App Store already use it`),
    companies?.length && `${companies.length === 1 ? 'a UK company has' : `${companies.length} UK companies have`} that name`,
    !free.length && domains.length && 'none of its domains are free',
  ].filter(Boolean) as string[]
  const clear = !problems.length
  const verdict = clear
    ? `Looks clear so far${comFree ? `, and ${label}.com is free` : free.length ? `, and ${free[0]} is free` : ''}. Check trade marks before you settle on it.`
    : `Worth a naming round: ${problems.join(', and ')}.`
  return {name, domains, apps, companies, trademarks: trademarkSearches(), verdict, clear}
}
