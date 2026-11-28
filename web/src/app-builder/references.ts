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
  /** Its app icon's mark, in a line, for the logo question and the logo round (logos.ts). */
  mark: string
}

const screen = (id: string) => `https://mobbin.com/screens/${id}`

export const REFERENCES: Reference[] = [
  {
    name: 'Runna',
    look: 'Clean and data-led: your plan’s progress first, light or dark',
    takes:
      'a grey canvas (or dark) with white rounded cards; the plan as one card with a segmented progress bar and weeks done and distance as big numbers; a strip of the week’s days on Today; kinds of workout as a grid of bold tiles; a solid black primary button; five tabs with thin icons; bold grotesk headings',
    mark: 'a bold white letterform on a saturated square: a monogram with momentum',
    mobbin: screen('00dbceb2-0ac2-41dc-8266-253a48e086fa'),
  },
  {
    name: 'Strava',
    look: 'Sporty and social: a feed of activities with big stats and maps',
    takes:
      'a white canvas in edge-to-edge sections split by grey bands, not cards; each activity a post with an avatar, a title, a row of three or four big stats and a route map; a weekly snapshot of numbers that swipes; one hot colour for action; bold sans headings',
    mark: 'two stacked white chevrons, like peaks, on hot orange: a symbol from what it is about',
    mobbin: screen('b3fba3c0-9ad3-4cc7-ac17-e6bd4d136813'),
  },
  {
    name: 'Ladder',
    look: 'Dark and intense: full-screen workout video, a neon accent, big timers',
    takes:
      'a near-black canvas with dark see-through cards over photos; a neon accent for what’s live and done; the workout as a full-screen video with a big timer, reps and weight under it; sets as rows of rounded boxes; heavy condensed titles',
    mark: 'a chunky geometric ladder glyph, black on a neon yellow square: heavy, blocky, sporty',
    mobbin: screen('d1169c75-4219-4bf1-aa2c-f5eb8fc0187a'),
  },
  {
    name: 'Gentler Streak',
    look: 'Warm and kind: an illustrated character, soft colour, gentle words',
    takes:
      'a white canvas with a soft sky at the top and a friendly illustrated character; a big bold headline for the day and a plain paragraph of advice; a coloured bar for the activity path; recommendations as chips; warm orange cards; a floating rounded tab bar',
    mark: 'its friendly round character on a soft colour: a mascot, not a symbol',
    mobbin: screen('06f36f85-e29b-4400-ba7d-90dde3d598b0'),
  },
  {
    name: 'Oura',
    look: 'Calm and premium: a landscape behind your numbers, serif headlines',
    takes:
      'a full-screen landscape photo behind the whole Home, darkened; a row of round scores at the top; a big arc gauge with a large number and a serif headline under it; see-through dark cards and a floating pill tab bar; small uppercase labels',
    mark: 'a thin white ring with a short bar over it on black: minimal and premium, from the product itself',
    mobbin: screen('b4bc9e73-f29d-495e-8ff1-9cb625020ac3'),
  },
  {
    name: 'Headspace',
    look: 'Warm and gentle: an off-white canvas, soft cards, playful illustration',
    takes:
      'a warm off-white canvas and softly tinted, generously rounded cards; Today as a vertical timeline of steps with a dot for each (done, now, next); each card a bold title, its kind and minutes, and a bright flat picture on the right; a quiet three-tab bar',
    mark: 'a single flat orange circle: as simple as a mark gets',
    mobbin: screen('1cba404f-413c-4a8b-be36-d791e9ca4fed'),
  },
  {
    name: 'Calm',
    look: 'Serene and immersive: a landscape across the whole screen, soft glass',
    takes:
      'a full-screen landscape photo as Home’s background with the name centred over it; see-through blue glass cards; a big streak ring with the week’s days as circles under it; a large photo card for today’s session with its length; a floating glass tab bar',
    mark: 'the word Calm in a white script on a soft blue gradient: a wordmark',
    mobbin: screen('82e555db-347c-4690-95fe-fb1d395b9c7e'),
  },
  {
    name: 'Duolingo',
    look: 'Playful and game-like: a winding path of big round steps, bright colour',
    takes:
      'a white canvas; the path as a zig-zag of big chunky round buttons, the ones ahead greyed; a coloured banner for the unit; a streak and points along the top; rewards along the path; thick rounded shapes with a darker lower edge',
    mark: 'its green owl’s face, chunky and cartoon: a mascot',
    mobbin: screen('02544e61-aefd-4d89-815e-ffcc83d83539'),
  },
  {
    name: 'Headway',
    look: 'Bright and editorial: colourful covers on sideways shelves',
    takes:
      'a warm off-white canvas; content as sideways strips of tall colourful covers; a “next for today” banner; one big featured card with Save; a floating search bar over five tabs; bold sans titles',
    mark: 'a white geometric H on a bright blue square: a monogram from simple bars',
    mobbin: screen('339c7d3b-1ecd-4ebc-b3d1-60f50cdd850c'),
  },
  {
    name: 'WHOOP',
    look: 'Dark and technical: three rings for sleep, recovery and strain',
    takes:
      'a deep charcoal canvas with a faint gradient; three small coloured rings across the top (sleep, recovery, strain); dark rounded cards with small uppercase labels; big tabular numbers; a floating round action button by a dark tab bar; spaced uppercase headings',
    mark: 'a white W inside a thin circle on black: a monogram kept quiet and technical',
    mobbin: screen('cf930277-904f-40d4-82df-5003e171613f'),
  },
  {
    name: 'Open',
    look: 'Moody and cinematic: full-bleed photos, black, thin type',
    takes:
      'a black canvas; a week strip of single letters and a pill-shaped “how do you feel?” prompt at the top; programs as tall full-bleed photo cards with a big title over them; small uppercase section labels with hairlines; a minimal icon tab bar with the time of sunrise under it',
    mark: 'a soft white abstract shape on black, like a seed or an open hand: an organic symbol',
    mobbin: screen('6710e116-3822-4f6b-94b4-56925d6de6bb'),
  },
  {
    name: 'ClassPass',
    look: 'Friendly and practical: a bright blue, photo cards of studios to book',
    takes:
      'a white canvas; bold black section headings with a “…” at the right; a solid blue banner card with a white button; sideways rows of studio photo cards with name, kind and a star rating; black pill buttons; a floating white tab bar with five icons',
    mark: 'two white interlocking loops on a bright blue square: an abstract symbol of a pass',
    mobbin: screen('e37212ba-a42a-43cc-9b92-ef2586f0cf31'),
  },
  {
    name: 'Cal AI',
    look: 'Crisp and minimal: black and white, big numbers in soft rings',
    takes:
      'a white canvas with the faintest grey cards; a week strip of dated circles with dashed rings; the day’s number huge in a card beside a ring; three small cards each with a ring and an icon; a black round “+” floating by a pill tab bar',
    mark: 'a simple white apple outline on black: one familiar object, drawn plainly',
    mobbin: screen('f0507a66-6524-46d6-a6a8-8b8f16057705'),
  },
  {
    name: 'BitePal',
    look: 'Cute and game-like: a cartoon pet on a bright scene above your numbers',
    takes:
      'a bright illustrated scene at the top with a big cartoon animal mascot and hearts; a white sheet over it holding numbers in rows, each with a small ring or sticker; heavy rounded sans numbers; a floating black “+” and a small pill tab bar',
    mark: 'its cartoon raccoon’s face on a dark square: a mascot',
    mobbin: screen('46a02ecf-d18a-4847-bb3c-6ba18e1b52bc'),
  },
  {
    name: 'Nike Training Club',
    look: 'Bold and athletic: big photos, heavy condensed capitals',
    takes:
      'a white canvas led by full-width athlete photos; heavy condensed uppercase headlines in white over them; a white pill button; program cards in black with a coloured condensed title and a segmented progress line; a plain four-tab bar with thin icons',
    mark: 'the swoosh over small capitals NTC in white on black: a parent brand’s mark with a short name',
    mobbin: screen('2ffe666f-2fb8-49dc-b7b4-78cf46b1e10d'),
  },
  {
    name: 'Insight Timer',
    look: 'Gentle and literary: serif titles, teal accents, a warm white',
    takes:
      'a warm white canvas; serif headlines and a teal accent; a progress line for the day; a grid of soft grey tiles each with a small coloured icon; video and talk cards with rounded photos and a rating line; a quiet four-tab bar',
    mark: 'a bronze singing bowl on a light square: one real object, drawn with a little depth',
    mobbin: screen('a57bfd7c-f452-4942-80a4-6626aea9c66e'),
  },
  {
    name: 'Fitbit',
    look: 'Soft and friendly: Material-style tiles of illustrated workouts',
    takes:
      'a pale tinted canvas; rounded chips for the kinds of workout; a grid of tall rounded tiles each with a warm illustration and its name; blue accents and a floating square action button; a four-tab bar with outline icons; plain Google sans type',
    mark: 'a heart of four colours on white: a symbol made from the parent brand’s colours',
    mobbin: screen('6778eb0e-b01a-4190-b129-8ff8ec31ec44'),
  },
  {
    name: 'Sweatcoin',
    look: 'Vivid and rewarding: a glowing gradient ring, purple and orange',
    takes:
      'a violet canvas with a glowing orange-to-pink gradient behind one huge number in a ring; a streak pill and a balance pill at the top; a row of day icons; bright gradient cards in a sideways strip, each with a white pill button; a dark four-tab bar',
    mark: 'a white S like a coin on a purple square: a monogram that is also the product',
    mobbin: screen('84dd5373-2592-40f6-8430-2bf97c53f300'),
  },
  {
    name: 'Future',
    look: 'Personal and light: your coach’s workout as a big photo card',
    takes:
      'a pale lavender-grey canvas; a large greeting in a light grotesk; today’s workout as one big rounded photo card with its name and length over it; a row of round icon buttons for more workouts; a frosted floating tab bar with the coach’s face in it',
    mark: 'a geometric white F on black: a monogram from straight bars',
    mobbin: screen('186461a8-d5e5-44f1-b990-5414b3886019'),
  },
  {
    name: 'Noom',
    look: 'Warm and coaching: today’s plan as a list of steps, serif headings',
    takes:
      'a light grey canvas; a serif “Today’s plan” heading; white rounded rows each with a round coloured icon (green, yellow, red) and a line; a week strip of circles at the top with points; small lesson diamonds; a three-tab bar with a red accent',
    mark: 'the lowercase wordmark noom in white on red: a name as the mark',
    mobbin: screen('8a44fa6e-f46b-4d33-b035-a7d7eab6fc4e'),
  },
  {
    name: 'Garmin Connect',
    look: 'Dense and data-rich: black, charts and scores for everything',
    takes:
      'a black canvas; a greeting and a written summary from the coach; dark grey rounded cards each with a label, a big score and a coloured bar chart; a week of a training plan as a row of square day tiles; bright blue links; a five-tab bar',
    mark: 'a white triangle-like arrow on a blue gradient: an abstract mark of direction',
    mobbin: screen('66366428-5782-43e0-92b6-b04b4fcd313a'),
  },
  {
    name: 'pushr',
    look: 'Stark and typographic: black on white, heavy lowercase numbers',
    takes:
      'a white canvas; a distorted lowercase logotype at the top; big white cards with a soft shadow, one huge number and a lowercase label; the week as black pill toggles with ticks; one black card with a global counter; a single white pill “start workout” button',
    mark: 'a small blocky pixel-like glyph in white on black: a playful abstract symbol',
    mobbin: screen('2d9dedab-7961-4927-ada0-5d9338d95bf7'),
  },
  {
    name: 'stoic.',
    look: 'Quiet and monochrome: soft grey cards, black and white illustrations',
    takes:
      'a light grey canvas; a lowercase greeting with a streak pill and a week strip of ticks; two big cards side by side, one white and one black, each with a pill button; square practice tiles with bold black-and-white pictograms; a floating pill tab bar with a black “+”',
    mark: 'the lowercase letter s and a full stop in white on black: a wordmark cut to its first letter',
    mobbin: screen('43f0d9ab-935e-4e60-bc0e-e36e1b00b568'),
  },
  {
    name: 'Opal',
    look: 'Glowing and calm: black with soft gradient cards like gemstones',
    takes:
      'a black canvas; tall rounded cards filled with soft blurred gradients (rose, green, violet), each with a centred title, a line and a glass pill button; short section headings with a grey line under them; a floating glass tab bar of three',
    mark: 'a thin white ring on black: one pure shape',
    mobbin: screen('8d175bb7-478a-4f0d-ac1e-3d1ee980c62b'),
  },
  {
    name: 'pillowtalk',
    look: 'Dreamy and journal-like: a blurred photo card with a big question',
    takes:
      'a black canvas holding one big rounded card of a blurred photo; a small greeting and a large light question over it; three round glass buttons at its foot (type, talk, transcribe); a lime streak flame and week letters at the top; a black tab bar',
    mark: 'a black symbol on a lime square: a bright colour carrying a simple mark',
    mobbin: screen('f6365c8f-6650-4a2e-aa2f-54d4515cf75f'),
  },
  {
    name: 'Flo',
    look: 'Soft and clear: pink accents, dotted timelines, a deep purple card',
    takes:
      'a light grey canvas; the logotype in pink script at the top; white rounded cards listing cycles, each a row of small coloured dots; a deep purple card with a big ring score; pink pill buttons; a five-tab bar with small badges',
    mark: 'a white petal or feather on pink: a soft organic symbol',
    mobbin: screen('f6d63077-ff15-4404-aa38-a076250b65e5'),
  },
  {
    name: 'Finch',
    look: 'Cosy and playful: a little bird to care for, warm paper colours',
    takes:
      'a warm cream and mustard canvas like paper; a cute round bird character; cards drawn like ID cards and notebooks with rings at the top; a streak card with a sun badge; chunky illustrated icons in a six-tab bar',
    mark: 'its little bird character on a soft blue-grey square: a mascot',
    mobbin: screen('ef6def48-4a50-4003-84c7-df80f8e8f0a3'),
  },
  {
    name: 'Hevy',
    look: 'Plain and practical: a logbook of sets, weights and reps',
    takes:
      'a white canvas; the exercise with a small picture and a blue name; a table of sets with columns for previous, weight and reps, and a tick for each; a blue rest timer line; a blue “Finish” button; plain system type, no decoration',
    mark: 'a white chain-link H on black: a monogram that hints at a barbell',
    mobbin: screen('fa1b4fe1-5d63-4e97-ac9a-ccdf41b86d7c'),
  },
  {
    name: 'Ahead',
    look: 'Soft and chatty: a lilac gradient and a friendly face that talks to you',
    takes:
      'a lilac-to-white gradient canvas; a week of circles under a topic with a thin progress line; chat bubbles from a smiling round character; a glassy floating tab bar and a big round purple chat button',
    mark: 'a smiling round lilac face: a mascot',
    mobbin: screen('63018274-790d-4f27-802e-e5d3edfd0229'),
  },
  {
    name: 'Joi',
    look: 'Bold and graphic: a huge date on black, a white sheet of habits',
    takes:
      'a black top half with a huge white date and a red dot, and a greeting in two tones of grey; a white sheet rising from below with a week strip and a list of habits with times; three floating round buttons at the foot',
    mark: 'a white letter on black: a plain monogram',
    mobbin: screen('290d2250-0025-4b54-8522-9cea52258fda'),
  },
  {
    name: 'MyFitnessPal',
    look: 'Clear and informative: tabs of numbers, plain words about your progress',
    takes:
      'a pale blue-grey canvas; a big bold page title over a row of text tabs; white rounded cards with a coloured label, a bold sentence and a small bar chart; sheets of plain explanation; blue accents',
    mark: 'a white running figure on a blue square: a symbol from what people do',
    mobbin: screen('ff12b84f-ae3a-431a-90fc-551c0a321ba1'),
  },
  {
    name: 'Waking Up',
    look: 'Thoughtful and artful: rich illustrated covers, plain lists',
    takes:
      'an off-white canvas; sections of courses each as a wide white card with a square, richly illustrated cover on the left and the session count, title and teacher on the right; a chevron by each heading; a plain four-tab bar',
    mark: 'a glowing circle on dark blue, like a sunrise: one abstract shape with light in it',
    mobbin: screen('b8ecc578-b643-42fd-bb13-64391a10c747'),
  },
]

/** The references named in an answer like "Runna, Strava, my own app": the ones we know, in its order. */
export function referencesIn(answer: string | undefined): Reference[] {
  const names = namesIn(answer)
  return REFERENCES.filter((r) => names.includes(r.name.toLowerCase())).sort(
    (a, b) => names.indexOf(a.name.toLowerCase()) - names.indexOf(b.name.toLowerCase()),
  )
}

const namesIn = (answer: string | undefined) => (answer ?? '').split(/,|\n| and /).map((x) => x.trim().toLowerCase())

/**
 * The logos named in an answer to the logo question's picks, each with its mark in words, for the
 * logo round: the marks it draws take their kind (a monogram, a mascot, one shape) from these.
 */
export const logoLines = (answer: string | undefined) => referencesIn(answer).map((r) => `${r.name}: ${r.mark}`)
