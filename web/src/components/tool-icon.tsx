import * as icons from 'simple-icons'

type SimpleIcon = {title: string; path: string; hex: string}
const bySlug = new Map<string, SimpleIcon>(
  Object.values(icons as unknown as Record<string, SimpleIcon & {slug: string}>)
    .filter((i) => i && typeof i === 'object' && 'slug' in i)
    .map((i) => [i.slug, i]),
)

// Brand mark from Simple Icons, or the tool's initials when there isn't one.
export function ToolIcon({name, slug, size = 22}: {name: string; slug?: string | null; size?: number}) {
  const icon = slug ? bySlug.get(slug) : undefined
  if (!icon) {
    const initials = name
      .split(/[\s.]+/)
      .filter(Boolean)
      .map((w) => w[0])
      .join('')
      .slice(0, 2)
    return (
      <span className="tool-initials" style={{fontSize: size * 0.62}} aria-hidden>
        {initials}
      </span>
    )
  }
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" aria-hidden>
      <path d={icon.path} />
    </svg>
  )
}

export function brandColor(slug?: string | null) {
  const hex = slug ? bySlug.get(slug)?.hex : undefined
  return hex ? `#${hex}` : undefined
}
