import type {Settings} from '@/sanity/settings'
import {BRAND} from '@/brand'

export function SiteFooter({settings}: {settings: Settings}) {
  return (
    <footer className="site-footer">
      <span>
        © {new Date().getFullYear()} {BRAND} · {settings?.name}
      </span>
      <span>{settings?.location}</span>
      <a href="/brand/index.html">Brand assets</a>
      <a href="#top">Back to top ↑</a>
    </footer>
  )
}
