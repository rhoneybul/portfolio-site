/** Unsplash's home, with the referral its API guidelines ask every link to carry. */
export const UNSPLASH_HOME = 'https://unsplash.com/?utm_source=fohm_app_builder&utm_medium=referral'

export interface Credited {
  credit?: string
  author?: string
  profile?: string
}

/**
 * A photo's credit. An Unsplash photo reads "Photo by <photographer> on Unsplash", both linked, as
 * Unsplash's API guidelines ask; any other photo shows its credit as written.
 */
export function PhotoCredit({p, className}: {p: Credited; className?: string}) {
  if (!p.author || !p.profile)
    return p.credit ? <span className={className}>{p.credit}</span> : null
  const link = (href: string, text: string) => (
    <a href={href} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
      {text}
    </a>
  )
  return (
    <span className={className}>
      Photo by {link(p.profile, p.author)} on {link(UNSPLASH_HOME, 'Unsplash')}
    </span>
  )
}
