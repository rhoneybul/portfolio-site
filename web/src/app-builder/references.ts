/**
 * The apps offered on the look and feel question: each one on Mobbin, each a different look, with
 * a screen of it to open there. `look` is for the visitor, in a line; `takes` is what its screens
 * show, written from Mobbin's screens of it, for Claude to design from (prototype.ts, factsOf).
 * Mobbin's images aren't shown or copied: only links to its pages. Plain: browser and server.
 */

export interface Reference {
  name: string
  /** How it looks, in a line, for the person choosing. */
  look: string
  /** What its screens show, for the designer. */
  takes: string
  /** One of its screens on Mobbin. */
  mobbin: string
}

const screen = (id: string) => `https://mobbin.com/screens/${id}`

export const REFERENCES: Reference[] = [
  {
    name: 'Runna',
    look: 'Clean and data-led: your plan’s progress first, light or dark',
    takes:
      'a grey canvas (or dark) with white rounded cards; the plan as one card with a segmented progress bar and weeks done and distance as big numbers; a strip of the week’s days on Today; kinds of workout as a grid of bold tiles; a solid black primary button; five tabs with thin icons; bold grotesk headings',
    mobbin: screen('00dbceb2-0ac2-41dc-8266-253a48e086fa'),
  },
  {
    name: 'Strava',
    look: 'Sporty and social: a feed of activities with big stats and maps',
    takes:
      'a white canvas in edge-to-edge sections split by grey bands, not cards; each activity a post with an avatar, a title, a row of three or four big stats and a route map; a weekly snapshot of numbers that swipes; one hot colour for action; bold sans headings',
    mobbin: screen('b3fba3c0-9ad3-4cc7-ac17-e6bd4d136813'),
  },
  {
    name: 'Ladder',
    look: 'Dark and intense: full-screen workout video, a neon accent, big timers',
    takes:
      'a near-black canvas with dark see-through cards over photos; a neon accent for what’s live and done; the workout as a full-screen video with a big timer, reps and weight under it; sets as rows of rounded boxes; heavy condensed titles',
    mobbin: screen('d1169c75-4219-4bf1-aa2c-f5eb8fc0187a'),
  },
  {
    name: 'Gentler Streak',
    look: 'Warm and kind: an illustrated character, soft colour, gentle words',
    takes:
      'a white canvas with a soft sky at the top and a friendly illustrated character; a big bold headline for the day and a plain paragraph of advice; a coloured bar for the activity path; recommendations as chips; warm orange cards; a floating rounded tab bar',
    mobbin: screen('f9bf6004-fa31-4dbe-818a-6acbd51f0cae'),
  },
  {
    name: 'Oura',
    look: 'Calm and premium: a landscape behind your numbers, serif headlines',
    takes:
      'a full-screen landscape photo behind the whole Home, darkened; a row of round scores at the top; a big arc gauge with a large number and a serif headline under it; see-through dark cards and a floating pill tab bar; small uppercase labels',
    mobbin: screen('b4bc9e73-f29d-495e-8ff1-9cb625020ac3'),
  },
  {
    name: 'Headspace',
    look: 'Warm and gentle: an off-white canvas, soft cards, playful illustration',
    takes:
      'a warm off-white canvas and softly tinted, generously rounded cards; Today as a vertical timeline of steps with a dot for each (done, now, next); each card a bold title, its kind and minutes, and a bright flat picture on the right; a quiet three-tab bar',
    mobbin: screen('1cba404f-413c-4a8b-be36-d791e9ca4fed'),
  },
  {
    name: 'Calm',
    look: 'Serene and immersive: a landscape across the whole screen, soft glass',
    takes:
      'a full-screen landscape photo as Home’s background with the name centred over it; see-through blue glass cards; a big streak ring with the week’s days as circles under it; a large photo card for today’s session with its length; a floating glass tab bar',
    mobbin: screen('82e555db-347c-4690-95fe-fb1d395b9c7e'),
  },
  {
    name: 'Duolingo',
    look: 'Playful and game-like: a winding path of big round steps, bright colour',
    takes:
      'a white canvas; the path as a zig-zag of big chunky round buttons, the ones ahead greyed; a coloured banner for the unit; a streak and points along the top; rewards along the path; thick rounded shapes with a darker lower edge',
    mobbin: screen('02544e61-aefd-4d89-815e-ffcc83d83539'),
  },
  {
    name: 'Headway',
    look: 'Bright and editorial: colourful covers on sideways shelves',
    takes:
      'a warm off-white canvas; content as sideways strips of tall colourful covers; a “next for today” banner; one big featured card with Save; a floating search bar over five tabs; bold sans titles',
    mobbin: screen('339c7d3b-1ecd-4ebc-b3d1-60f50cdd850c'),
  },
]

/** The references named in an answer like "Runna, Strava, my own app": the ones we know, in its order. */
export function referencesIn(answer: string | undefined): Reference[] {
  const names = (answer ?? '').split(/,|\n| and /).map((x) => x.trim().toLowerCase())
  return REFERENCES.filter((r) => names.includes(r.name.toLowerCase())).sort(
    (a, b) => names.indexOf(a.name.toLowerCase()) - names.indexOf(b.name.toLowerCase()),
  )
}
