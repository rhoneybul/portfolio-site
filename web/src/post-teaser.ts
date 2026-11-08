const TEASER_MAX_CHARS = 200

type TeaserSource = {excerpt?: string | null; opening?: string | null}

/**
 * What readers see of a post before opening it: the excerpt when one has been written,
 * otherwise the post's own opening words, so a teaser is never invented.
 */
export function postTeaser({excerpt, opening}: TeaserSource): string {
  return excerpt?.trim() || openingSentences(opening ?? '', TEASER_MAX_CHARS)
}

/** Whole sentences from the start of `text` that fit in `maxChars`; a longer first sentence is cut at a word. */
export function openingSentences(text: string, maxChars: number): string {
  const sentences = text.trim().split(/(?<=[.!?])\s+/).filter(Boolean)
  let teaser = ''
  for (const sentence of sentences) {
    const longer = teaser ? `${teaser} ${sentence}` : sentence
    if (longer.length > maxChars) break
    teaser = longer
  }
  if (teaser || sentences.length === 0) return teaser
  const cut = sentences[0].slice(0, maxChars)
  const lastSpace = cut.lastIndexOf(' ')
  return `${lastSpace > 0 ? cut.slice(0, lastSpace) : cut}…`
}
