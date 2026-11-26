import type {Settings} from '@/sanity/settings'
import {BRAND} from '@/brand'
import {Wordmark} from './wordmark'

export function SiteFooter({settings}: {settings: Settings}) {
  return (
    <>
      <Wordmark className="footer-mark" />
      <footer className="site-footer">
        <span>
          © {new Date().getFullYear()} {BRAND} · {settings?.name}
        </span>
        <span>{settings?.location}</span>
        <a href="/brand/index.html">Brand assets</a>
        <a href="/app-builder/mcp">App builder in Claude and ChatGPT</a>
        <a href="/privacy">Privacy</a>
        <a href="/terms">Terms</a>
        <a href="#top">Back to top</a>
      </footer>
    </>
  )
}
