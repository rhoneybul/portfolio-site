/**
 * The logo round, for an owner without a logo: Claude draws a few marks for the app while it is
 * being designed, the visitor picks one, and it becomes the app's icon on every screen
 * (Style['icon'] with shape 'svg', drawn by prototype-doc.ts's iconMarkCss). Each mark is one
 * path on a 100 square, filled in one colour on the accent's square, as an app icon is.
 * Server only.
 */
import {askClaude, DRAW_MODEL} from './claude'
import {cleanMarkPath} from './prototype-doc'
import type {Answers, Options} from './options'

export interface Mark {
  /** A word or two naming the idea: "Rising swell". */
  name: string
  /** What it stands for, in a line. */
  idea: string
  /** One SVG path on a 100 by 100 square, filled even-odd. */
  d: string
}

const SYSTEM = `You are a senior brand designer drawing logo marks for a new app's icon.
Draw four different concepts. Each is a symbol only (no words, no letters unless it is a monogram), drawn as ONE SVG path on a 100 by 100 square, filled in a single colour with the even-odd rule (so a shape inside another cuts a hole). It sits in white on the app's coloured square, at home-screen size (about 60 pixels), so:
- Bold, simple geometry that reads at that size: a few confident shapes, no hairlines, no detail under 6 units wide.
- Fill most of the square from about 12 to 88 on both axes, centred, balanced.
- Absolute commands (M, L, H, V, C, Q, A, Z), numbers with at most one decimal, closed shapes.
- Four genuinely different ideas: say, one from what members do, one from the goal or the place, one abstract, one a monogram from the name's first letter drawn as shapes.
- Never a cliché clip-art icon (a dumbbell, a generic heart, a lightbulb) and never another brand's mark.

Reply with JSON only:
{"marks": [{"name": "Rising swell", "idea": "A wave building under a horizon line: the step up to bigger surf.", "d": "M 12 70 C ... Z"}]}`

const plainText = (v: unknown, most: number) => (typeof v === 'string' ? v.replace(/[<>"]/g, '').replace(/\s+/g, ' ').trim().slice(0, most) : '')

/** Claude's marks, checked: real path data only, a name and a line each, four at most. */
export function parseMarks(answer: string): Mark[] {
  const raw = JSON.parse(answer.slice(answer.indexOf('{'), answer.lastIndexOf('}') + 1)) as {marks?: unknown}
  const marks = (Array.isArray(raw.marks) ? raw.marks : [])
    .map((m: Record<string, unknown>) => ({name: plainText(m?.name, 40), idea: plainText(m?.idea, 160), d: cleanMarkPath(m?.d)}))
    .filter((m) => m.d)
    .slice(0, 4)
  if (!marks.length) throw new Error('No marks in the answer')
  return marks
}

export async function drawMarks(o: Options, answers: Answers, deadline: number): Promise<Mark[]> {
  const about = [
    `The app: ${o.name}.`,
    answers.idea && `What it does, and for whom: ${answers.idea}`,
    answers.business && `The business: ${answers.business}`,
    answers.doing && `What people do in it: ${answers.doing}`,
    answers.goals && `What they work towards: ${answers.goals}`,
    answers.inspiration && `Apps the owner likes the look of: ${answers.inspiration}`,
  ]
    .filter(Boolean)
    .join('\n')
  const answer = await askClaude({model: DRAW_MODEL(), system: [SYSTEM], user: about, maxTokens: 4_000, deadline})
  return parseMarks(answer)
}
