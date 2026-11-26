import {interestsOf, type Options} from './options'

/**
 * The prototype the app builder draws (components/app-prototype.tsx): its screens and what each
 * shows, from the visitor's answers. Plain TypeScript, so the brief can describe the same prototype
 * the visitor tapped through, for Claude to start the app from.
 */

export type ScreenId = 'landing' | 'onboarding' | 'home' | 'path' | 'game' | 'dashboard'

export const screensFor = (o: Options): {id: ScreenId; name: string}[] => [
  {id: 'landing', name: 'Landing page'},
  ...(o.kind === 'game' ? [] : [{id: 'onboarding' as const, name: 'Onboarding'}]),
  {id: 'home', name: 'Home'},
  ...(o.kind === 'coaching' ? [{id: 'path' as const, name: o.coach === 'yes' ? 'Your path' : 'Your program'}] : []),
  ...(o.kind === 'game' ? [{id: 'game' as const, name: 'The game'}] : []),
  {id: 'dashboard', name: 'Dashboard'},
]

export const cap = (w: string) => w.charAt(0).toUpperCase() + w.slice(1)

// The template's sample progression (src/lib/progression.ts), used where the visitor gave none.
const SAMPLE_LEVELS = [
  {title: 'Getting started', skills: ['The basics', 'A routine you keep']},
  {title: 'Building', skills: ['Consistency', 'Using feedback']},
  {title: 'Progressing', skills: ['A real challenge', 'Reviewing your progress']},
]

/** "Foam board: paddling, pop-ups. Green waves: angling." as levels and their skills. */
export function levelsOf(o: Options) {
  const parsed = (o.levels || '')
    .split(/\n|\.\s+|;\s*/)
    .map((chunk) => chunk.trim().replace(/\.$/, ''))
    .filter(Boolean)
    .map((chunk) => {
      const [title, rest] = chunk.split(/:\s*/, 2)
      return {title: cap(title.trim()), skills: (rest ?? '').split(/,\s*|\s+and\s+/).map((s) => cap(s.trim())).filter(Boolean)}
    })
    .filter((l) => l.title)
  return parsed.length ? parsed.map((l) => ({...l, skills: l.skills.length ? l.skills : ['The basics']})) : SAMPLE_LEVELS
}

/** The first goal they named: "Big-wave spots: Nazaré, Mavericks" is Nazaré. */
export function firstGoal(o: Options) {
  const g = o.goals || ''
  const list = g.includes(':') ? g.split(':')[1] : g
  return list.split(/,|\n| and /)[0]?.trim() || 'Your goal'
}

/** The goals they named, a few: "Big-wave spots: Nazaré, Mavericks, Jaws" is those three. */
export function goalsOf(o: Options) {
  const g = o.goals || ''
  return (g.includes(':') ? g.split(':')[1] : g)
    .split(/,|\n| and /)
    .map((x) => x.trim())
    .filter(Boolean)
    .slice(0, 3)
}

export const firstPlacing = (o: Options) => {
  const q = (o.placing || '').split('?')[0]?.trim()
  return q ? `${q}?` : 'How much have you done before?'
}

const list = (xs: string[]) => xs.join(', ')

/**
 * The prototype as markdown, screen by screen, as the visitor saw it: the brief's "The prototype"
 * section, which the new-app skill takes as the first draft of the app's Claude Design prototype.
 */
export function prototypeBrief(o: Options, link?: string) {
  const levels = levelsOf(o)
  const goals = goalsOf(o)
  const coach = o.coach === 'yes'
  const screens: Record<ScreenId, string> = {
    landing: `a photo${o.photo ? ' (the one I picked, below)' : ''} under ${o.name}'s mark and Sign in; the headline "${o.tagline}"; ${o.idea ? `"${o.idea}" under it` : 'a line on what it does'}; Get started and I already have an account.`,
    onboarding: `an opening over a photo, a line to a screen ("${o.idea || 'Want to get better at it, week by week?'}", "${o.tagline}", "${o.name} starts you where you are and shows you what to do next."); then with dots and Skip: "${firstPlacing(o)}" (three answers that place them at a level); "What are you here for?" as tiles (${list(interestsOf(o))}); "How much can you give it?" (days a week, minutes a session, hours a week); and "Where you start", a photo card with their level and week.`,
    home: `a greeting with their photo; Getting started with first steps (${o.kind === 'game' ? 'play your first round, set your best score, tell us what you think' : o.kind === 'coaching' ? `find your level, check in after you practise, ${coach ? `ask your ${o.ownerWord} something` : 'save a goal'}` : 'write your first entry, add your photo, save a goal'}); ${o.kind === 'game' ? 'the game as a photo card' : `the goal as a tall photo card ("${firstGoal(o)}"${o.kind === 'coaching' ? `, up next: ${levels[0].skills[0]}` : ''}), then ${goals.length ? `places to work towards (${list(goals)})` : 'saved goals'}`}; This week's seven days; ${o.kind === 'coaching' ? (coach ? 'Your path' : 'Your program') : o.kind === 'game' ? 'Play' : ''} as the button to press.`,
    path: `skills done of all, a progress bar, and the levels with their skills ticked off (${levels.map((l) => `${l.title}: ${list(l.skills)}`).join('; ')}${o.levels ? '' : ', the template’s sample levels until I give you mine'})${coach ? `, the ${o.ownerWord}'s note on each one done` : ''}.`,
    game: `the example game, Catch the dot: points, a 30-second round, a streak worth one more each catch.`,
    dashboard: `the ${o.ownerWord}'s dashboard: People, Activity and Settings; ${o.memberWord}s and how many need you; Needs you on top (${o.kind === 'coaching' ? (coach ? 'a clip sent for feedback' : 'a note to the team') : o.kind === 'game' ? 'feedback sent' : 'something written'}, Needs a reply); then everyone, each with ${o.kind === 'coaching' ? 'their level' : o.kind === 'game' ? 'their best' : 'what they wrote'}, and who's Pro.`,
  }
  return [
    `In the app builder I tapped through a prototype of ${o.name} in its phone, in the house style (Space Grotesk and DM Sans, the grey canvas and white cards, the ink pill with the ${o.accent.toUpperCase()} disc, the floating tab bar)${link ? `: ${link}` : ''}. It's the first draft of the prototype: start the Claude Design canvas from it, screen by screen, and build out from there (the workflow, sign-in, the paywall, Account).`,
    '',
    ...screensFor(o).map((s) => `- **${s.name}**: ${screens[s.id]}`),
  ].join('\n')
}
