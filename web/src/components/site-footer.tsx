import type {Settings} from '@/sanity/settings'

export function SiteFooter({settings}: {settings: Settings}) {
  return (
    <footer className="site-footer mono">
      <span>
        © {new Date().getFullYear()} {settings?.name ?? 'Rob Honeybul'}
      </span>
      <span>{settings?.role}</span>
      {settings?.cvUrl && (
        <a href={`${settings.cvUrl}?dl=Rob_Honeybul_CV.pdf`}>Download CV ↓</a>
      )}
    </footer>
  )
}
