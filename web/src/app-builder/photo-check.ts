/**
 * Every photo found for an app is looked at before it goes into the prototype: a stock search for
 * "cricket county second XI" can answer with a county's countryside, and the prototype then shows
 * fields and sheep on a cricket app. Claude sees each photo (its thumbnail, by URL) with what the
 * app is about, and keeps only those that plainly show this app's world. No photo is better than a
 * wrong one: the prototype draws an empty slot as a tinted panel. Server only.
 */
import {askClaude, claudeOn, type UserBlock} from './claude'
import {toldOf} from './photo-searches'
import type {Answers} from './options'

const MODEL = 'claude-sonnet-5-5'

const ASK = `You check stock photos for a new app's screens before the owner sees them.
You are told what the app is about, then shown numbered photos.
Keep a photo only if a member of this app would see it as their own world: the sport or activity itself (the same sport, not one that looks a bit like it), its players or members, its kit, or the places it is done in, as the app describes them.
Drop anything else: another sport, a generic landscape, a city, an animal, an object that only shares a word with the search ("ashes" from a fire for a cricket app, a river for a gym), a stock office or laptop shot, text or a logo.
When unsure, drop it.`

const SCHEMA = {
  type: 'object',
  properties: {keep: {type: 'array', items: {type: 'integer'}}},
  required: ['keep'],
  additionalProperties: false,
}

export interface Candidate {
  /** The image shown, small: what Claude looks at. */
  thumb: string
  /** What it was searched for and its source's words for it. */
  about: string
}

/**
 * The indexes of the candidates that fit the app, in their order. Without Claude, or if it can't
 * answer, those whose own words name the activity, else all of them, as before this check.
 */
export async function fitting(candidates: Candidate[], answers: Answers, activity: string, deadline: number): Promise<number[]> {
  const all = candidates.map((_, i) => i)
  if (!candidates.length) return all
  if (!claudeOn()) return byWords(candidates, activity) ?? all
  const user: UserBlock[] = [
    {type: 'text', text: `The app:\n${toldOf(answers).join('\n')}${activity ? `\nIts activity: ${activity}` : ''}\n\nThe photos:`},
    ...candidates.flatMap((c, i): UserBlock[] => [
      {type: 'text', text: `Photo ${i + 1} (searched for, and its caption: ${c.about})`},
      {type: 'image', source: {type: 'url', url: c.thumb}},
    ]),
    {type: 'text', text: 'Which photos fit this app? Reply with their numbers in "keep".'},
  ]
  try {
    const text = await askClaude({model: MODEL, system: [ASK], user, maxTokens: 1_000, deadline, schema: SCHEMA})
    const keep = (JSON.parse(text) as {keep?: unknown}).keep
    if (!Array.isArray(keep)) throw new Error('No keep list')
    const picked = new Set(keep.filter((n): n is number => Number.isInteger(n)).map((n) => n - 1))
    return all.filter((i) => picked.has(i))
  } catch (e) {
    console.warn('[photos] check', e instanceof Error ? e.message : e)
    return byWords(candidates, activity) ?? all
  }
}

/** The candidates whose caption names the activity (any of its words), or null when none or no activity is known. */
export function byWords(candidates: Candidate[], activity: string): number[] | null {
  const words = activity.toLowerCase().match(/[\p{L}]{3,}/gu) ?? []
  if (!words.length) return null
  const kept = candidates.flatMap((c, i) => (words.some((w) => c.about.toLowerCase().split(':').slice(1).join(':').includes(w)) ? [i] : []))
  return kept.length ? kept : null
}
