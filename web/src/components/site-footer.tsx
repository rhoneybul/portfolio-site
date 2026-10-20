import type {Settings} from '@/sanity/settings'

export function SiteFooter({settings}: {settings: Settings}) {
  return (
    <footer className="site-footer">
      <span>
        © {new Date().getFullYear()} {settings?.name ?? 'Rob Honeybul'}
      </span>
      <span>{settings?.location}</span>
      <a href="#top">Back to top ↑</a>
    </footer>
  )
}
