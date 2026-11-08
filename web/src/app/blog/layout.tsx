import type {ReactNode} from 'react'

// Blog pages render on every visit with fresh Sanity data. sanityFetch otherwise caches until a
// live event, and live events only reach the site while someone has it open, so a post published
// at a quiet moment stayed off the blog until the next deploy.
export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

export default function BlogLayout({children}: {children: ReactNode}) {
  return children
}
