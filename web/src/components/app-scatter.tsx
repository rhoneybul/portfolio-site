import Image from 'next/image'
import Link from 'next/link'
import type {CSSProperties} from 'react'
import {Logo} from '@/components/logo'

type App = {
  _id: string
  title: string | null
  slug: string | null
  logo: Parameters<typeof Logo>[0]['image']
}

/**
 * Each app's real store icon, copied from its own repository into public/apps (288px): the icon
 * people see on their phone. An app without one here shows its logo from Sanity instead.
 */
const STORE_ICONS: Record<string, string> = {
  naz: '/apps/naz.png',
  etapa: '/apps/etapa.png',
  aluzam: '/apps/aluzam.png',
  'naz-surf': '/apps/naz-surf.png',
  'strawberry-fields': '/apps/strawberry-fields.png',
}

/**
 * The apps built through Fohm, scattered beside the hero like icons tossed on a table: each tilted,
 * at its own size, drifting a little. Placed by hand, not at random, so the page looks the same on
 * every visit and nothing lands on anything else. Positions are percentages of the scatter's box:
 * a column beside the headline on a wide screen, a strip above it on a phone. Past the last slot,
 * an app isn't shown here (Work lists them all).
 */
const SLOTS = [
  {x: 8, y: 6, size: 1.35, turn: -8},
  {x: 58, y: 0, size: 1, turn: 7},
  {x: 70, y: 40, size: 1.5, turn: -4},
  {x: 22, y: 50, size: 1.1, turn: 11},
  {x: 2, y: 82, size: 0.85, turn: -14},
  {x: 46, y: 78, size: 1.2, turn: 5},
  {x: 84, y: 86, size: 0.8, turn: 16},
  {x: 38, y: 24, size: 0.75, turn: -18},
]

/** Apps left out of the scatter (still listed under Work). */
const LEFT_OUT = new Set(['catalyst-planet'])

export function AppScatter({apps}: {apps: App[]}) {
  const shown = apps
    .filter((a) => a.slug && !LEFT_OUT.has(a.slug) && (STORE_ICONS[a.slug] || a.logo?.asset))
    .slice(0, SLOTS.length)
  if (!shown.length) return null
  return (
    <ul className="app-scatter" aria-label="Apps I’ve built">
      {shown.map((app, i) => {
        const slot = SLOTS[i]
        const style = {
          '--x': `${slot.x}%`,
          '--y': `${slot.y}%`,
          '--size': slot.size,
          '--turn': `${slot.turn}deg`,
          '--delay': `${-i * 1.7}s`,
        } as CSSProperties
        return (
          <li key={app._id} className="app-scatter__item" style={style}>
            <Link href={`/work/${app.slug}`} className="app-scatter__icon" aria-label={app.title ?? ''}>
              {STORE_ICONS[app.slug!] ? (
                <Image src={STORE_ICONS[app.slug!]} alt="" width={144} height={144} className="logo app-scatter__logo" />
              ) : (
                <Logo image={app.logo} className="app-scatter__logo" pixels={144} />
              )}
              <span className="app-scatter__name" aria-hidden>
                {app.title}
              </span>
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
