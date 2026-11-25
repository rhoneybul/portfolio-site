import {TEMPLATES, type Answers} from '@/app-builder/options'

/**
 * What to search Wikimedia Commons for, from everything the visitor has said about their app: a
 * few short searches for things a camera can photograph. Claude picks them when it can
 * (/api/photo-ideas); otherwise `photoIdeas` finds them in the answers. Plain: used on both sides.
 */

/** The answers the searches are found from, and the most of each that's sent. */
export const IDEA_KEYS = ['idea', 'business', 'template', 'doing', 'name', 'interests', 'goals'] as const

export const ideaAnswers = (a: Answers) => Object.fromEntries(IDEA_KEYS.map((k) => [k, String(a[k] ?? '').trim().slice(0, 600)])) as Answers

/** What each app already built on the scaffold is photographed by. */
const BY_TEMPLATE: Record<string, string> = {naz: 'big wave surfing', etapa: 'road cycling', aluzam: 'acoustic guitar', 'naz-surf': 'surfing wave', 'strawberry-fields': 'backcountry skiing'}

/** Words that say nothing a photo could show: the questions' own words, hedges, and app talk. */
const VAGUE = new Set(
  `a an the and or but so of to in on at by for from with without into onto about around through between over under
  is are be been being am was were can will would should could do does did have has had not no yes none n/a na
  i me my we us our you your they them their he she his her it its this that these those there here
  what which who whom where when why how all any some other others each every one two three lot lots few many
  more most less just also very really mainly mostly usually generally probably maybe etc eg ie like such things thing stuff
  app apps application platform tool tools people person users user members member customers clients someone everyone
  help helps helping make makes making tell tells find finds finding get gets getting use uses using want wants need needs
  next work works working way ways new best better good great simple easy quick online digital mobile phone based own
  week weeks weekly day days daily time times short long pocket plan plans planning track tracks tracking follow follows
  following pay pays paid already today sell sells selling sold run runs offer offers give gives keep keeps start starts
  train trains training first learn learns learning improve improves book books booking browse browsing buy buying
  places place events event trips trip goals goal towards toward`.split(/\s+/),
)

const words = (s: string) => s.toLowerCase().match(/[\p{L}][\p{L}'’-]*/gu) ?? []

/** "surfing", "surfers" and "surf" are one word. */
const stem = (w: string) => w.replace(/(ing|ers|er|es|s)$/, (m) => (w.length - m.length >= 3 ? '' : m))

/** The word the idea keeps coming back to ("surf" in a surf coach for a surf school), if any. */
function subject(a: Answers) {
  const seen = new Map<string, {word: string; count: number; at: number}>()
  let at = 0
  for (const text of [a.idea, a.doing, a.business, a.name])
    for (const w of words(text ?? '')) {
      at++
      if (w.length < 3 || VAGUE.has(w)) continue
      const s = stem(w)
      const got = seen.get(s)
      if (got) got.count++
      else seen.set(s, {word: w, count: 1, at})
    }
  const ranked = [...seen.values()].sort((x, y) => y.count - x.count || x.at - y.at)
  // A word said twice is the subject; said once, the first two together are the best guess.
  if (!ranked.length) return []
  if (ranked[0].count > 1) return [ranked[0].word]
  return [ranked.slice(0, 2).sort((x, y) => x.at - y.at).map((r) => r.word).join(' ')]
}

/** The things in a list answer ("Big-wave spots: Nazaré, Mavericks and Jaws"), without the hedges. */
function items(answer: string) {
  const list = answer.includes(':') ? answer.split(':').slice(1).join(':') : answer
  return list
    .split(/,|;|\n|\/| and | or /i)
    .map((x) =>
      x
        .split(/\s+/)
        .filter((w) => !['mainly', 'mostly', 'probably', 'maybe', 'etc', 'etc.', 'e.g.', 'eg', 'like', 'lots', 'of'].includes(w.toLowerCase()))
        .join(' ')
        .replace(/[.!?]+$/, '')
        .trim(),
    )
    .filter((x) => x.length > 2 && x.split(/\s+/).length <= 4 && words(x).some((w) => !VAGUE.has(w)))
}

/** Up to four searches from the answers alone: the subject, their goals and what people are there for; the app they picked if they said none of that. */
export function photoIdeas(a: Answers): string[] {
  const template = a.template && a.template !== 'other' ? BY_TEMPLATE[a.template] : undefined
  const fromContent = [...subject(a), ...items(a.goals ?? ''), ...items(a.interests ?? '')]
  return tidy(fromContent.length ? fromContent : template ? [template] : [])
}

/** Short, distinct, at most four. */
export function tidy(terms: unknown): string[] {
  if (!Array.isArray(terms)) return []
  const seen = new Set<string>()
  return terms
    .filter((t): t is string => typeof t === 'string')
    .map((t) => t.replace(/["“”]/g, '').replace(/\s+/g, ' ').trim().slice(0, 40))
    .filter((t) => t && t.split(' ').length <= 4 && !seen.has(t.toLowerCase()) && !!seen.add(t.toLowerCase()))
    .slice(0, 4)
}

/** The kind of app they picked, in words, for Claude. */
export const templateHint = (a: Answers) => {
  const t = TEMPLATES.find((x) => x.value === a.template)
  return t && t.value !== 'other' ? `${t.label}: ${t.hint}` : ''
}
