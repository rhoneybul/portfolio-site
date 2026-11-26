import type {Options} from './options'

/** What Claude writes for the prototype (write-app.ts, on the server). Plain: the page reads it too. */
export interface Written {
  tagline: string
  description: string
  interests: string[]
  goals: string
  levels: string
  placing: string
  memberWord: string
  ownerWord: string
  photoSearches: string[]
}

/**
 * The answers with Claude's words: in every place the builder doesn't ask (the headline, the
 * description, the path, the placing question, what people are called), and in the asked ones
 * (interests, goals) only where the visitor left them blank.
 */
export function withWritten(o: Options, w: Written | null): Options {
  if (!w) return o
  const theirs = (k: string) => Boolean(o[k]?.trim())
  return {
    ...o,
    tagline: w.tagline,
    description: w.description,
    interests: theirs('interests') ? o.interests : w.interests.join(', '),
    goals: theirs('goals') ? o.goals : w.goals,
    levels: w.levels,
    placing: w.placing,
    memberWord: w.memberWord.toLowerCase(),
    ownerWord: w.ownerWord.toLowerCase(),
  }
}
