'use client'

import {useEffect, useState} from 'react'

/**
 * Finds a photo for the visitor's app on Wikimedia Commons, in the browser: only licences the
 * scaffold lets an app show (public domain, CC0, CC BY, CC BY-SA; never NC or ND), each with its
 * author and licence, which the brief carries as the credit. Or a link to their own.
 */

export interface Found {
  url: string
  thumb: string
  credit: string
  page: string
}

const ALLOWED = /^(cc0|public domain|pd|cc by(-sa)?( \d\.\d)?)/i

const plain = (html: string) => html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()

async function search(q: string): Promise<Found[]> {
  const params = new URLSearchParams({
    action: 'query',
    format: 'json',
    origin: '*',
    generator: 'search',
    gsrsearch: `filetype:bitmap ${q}`,
    gsrnamespace: '6',
    gsrlimit: '24',
    prop: 'imageinfo',
    iiprop: 'url|extmetadata',
    iiurlwidth: '1200',
  })
  const res = await fetch(`https://commons.wikimedia.org/w/api.php?${params}`)
  const pages = Object.values(((await res.json()).query?.pages ?? {}) as Record<string, {imageinfo?: {thumburl: string; descriptionurl: string; extmetadata?: Record<string, {value: string}>}[]}>)
  return pages
    .map((p) => p.imageinfo?.[0])
    .filter((i): i is NonNullable<typeof i> => Boolean(i?.thumburl))
    .map((i) => {
      const licence = plain(i.extmetadata?.LicenseShortName?.value ?? '')
      const author = plain(i.extmetadata?.Artist?.value ?? '') || 'Unknown author'
      return {licence, found: {url: i.thumburl, thumb: i.thumburl.replace(/\/\d+px-/, '/320px-'), credit: `${author} · ${licence}`, page: i.descriptionurl}}
    })
    .filter(({licence}) => ALLOWED.test(licence) && !/nc|nd/i.test(licence))
    .map(({found}) => found)
    .slice(0, 12)
}

export function PhotoSearch({start, value, onChange}: {start: string; value: string; onChange: (url: string, credit: string) => void}) {
  const [q, setQ] = useState(start)
  const [found, setFound] = useState<Found[] | null>(null)
  const [busy, setBusy] = useState(false)
  const [own, setOwn] = useState(value && !value.includes('wikimedia.org') ? value : '')

  const run = async (term: string) => {
    if (!term.trim()) return
    setBusy(true)
    try {
      setFound(await search(term.trim()))
    } catch {
      setFound([])
    } finally {
      setBusy(false)
    }
  }

  // Search straight away from what they've told us, so there's something to pick.
  useEffect(() => {
    void run(start)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="photos">
      <div className="photos__bar">
        <input
          aria-label="Search for a photo"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              void run(q)
            }
          }}
          placeholder="Search photos, e.g. surfing big waves"
        />
        <button type="button" className="text-btn" onClick={() => run(q)} disabled={busy}>
          {busy ? 'Searching…' : 'Search'}
        </button>
      </div>

      {found && !found.length && !busy && <p className="builder__hint">No open-licence photos for that. Try other words.</p>}
      {!!found?.length && (
        <div className="photos__grid" role="radiogroup" aria-label="Photos">
          {found.map((f) => (
            <button
              key={f.url}
              type="button"
              role="radio"
              aria-checked={value === f.url}
              className={`photos__pick${value === f.url ? ' is-on' : ''}`}
              onClick={() => onChange(value === f.url ? '' : f.url, value === f.url ? '' : f.credit)}
              title={f.credit}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={f.thumb} alt="" loading="lazy" referrerPolicy="no-referrer" />
            </button>
          ))}
        </div>
      )}
      <p className="photos__credit">{value && !own ? found?.find((f) => f.url === value)?.credit : 'Photos from Wikimedia Commons, open licences only.'}</p>

      <label className="photos__own">
        <span>Or a link to your own</span>
        <input
          inputMode="url"
          autoCapitalize="none"
          value={own}
          onChange={(e) => {
            setOwn(e.target.value)
            onChange(e.target.value.trim(), '')
          }}
          placeholder="https://…"
        />
      </label>
    </div>
  )
}
