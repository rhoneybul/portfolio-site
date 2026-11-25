import assert from 'node:assert/strict'
import {test} from 'node:test'
import {resolveOptions, emptyAnswers} from './options'
import {contentFromAnswers, levelsFromAnswer, replaceConst, writeBrand, writeProgression} from './fill'

const SOURCE = `export const LEVELS: Level[] = [
  { id: 'start', title: 'Getting started', skills: [{ id: 'a', why: 'It’s [the] basics.' }] },
];
export const ASSESSMENT: { id: string; answers: { label: string; level: string }[] }[] = [
  { id: 'experience', question: 'How much?', answers: [] },
];
export const LIBRARY: { id: string; kind: 'video' | 'drill' }[] = [{ id: 'welcome' }];
export const INTERESTS: StepOption[] = [{ id: 'skills', label: 'New skills' }];
export const ONBOARDING: Onboarding = {
  hello: {
    lines: ['Want to get better?', \`\${APP.name} starts you.\`],
    photo: OPENING_PHOTO,
  },
};
`

const options = resolveOptions({
  ...emptyAnswers(),
  name: 'Swellready',
  levels: 'step-ups: paddle fitness, duck-dives. Heavy days: two-wave hold-downs',
  placing: 'Biggest wave? Done a course?',
  interests: 'Strength, Breath-holds, Mobility',
  keyValue: 'Want to feel calmer in big surf?',
}).options

test('levels come from the owner’s own words, capitalised', () => {
  assert.deepEqual(levelsFromAnswer(options.levels), [
    {title: 'Step-ups', skills: ['Paddle fitness', 'Duck-dives']},
    {title: 'Heavy days', skills: ['Two-wave hold-downs']},
  ])
})

test('a constant is replaced whatever its type annotation holds, brackets in strings included', () => {
  const out = replaceConst(SOURCE, 'ASSESSMENT', '[]')
  assert.match(out, /export const ASSESSMENT: \{ id: string; answers: \{ label: string; level: string \}\[\] \}\[\] = \[\];/)
  assert.match(out, /export const LEVELS/)
  assert.match(replaceConst(SOURCE, 'LEVELS', '[]'), /export const LEVELS: Level\[\] = \[\];\nexport const ASSESSMENT/)
})

test('the progression takes the levels, the placing questions, the interests and the opening', () => {
  const out = writeProgression(SOURCE, contentFromAnswers(options), options)
  assert.match(out, /"id": "step-ups"/)
  assert.match(out, /"id": "step-ups-paddle-fitness"/)
  assert.match(out, /"question": "Biggest wave\?"/)
  // The first answer places at the first level, the last at the furthest.
  assert.match(out, /"label": "Not yet, or only once or twice",\s+"level": "step-ups"/)
  assert.match(out, /"label": "Regularly, and I want to push on",\s+"level": "heavy-days"/)
  assert.match(out, /"id": "routine",\s+"icon": "repeat",\s+"label": "Breath-holds"/)
  assert.match(out, /"Want to feel calmer in big surf\?"/)
  assert.match(out, /photo: OPENING_PHOTO/)
})

test('the landing page takes the description, steps and features', () => {
  const brand = `export const APP = {\n  description: 'Old words.',\n  steps: [\n    { title: 'a' },\n  ],\n  features: [\n    { title: 'b' },\n  ],\n  kind: 'coaching',\n};\n`
  const out = writeBrand(brand, {...contentFromAnswers(options), description: 'It’s "new".'})
  assert.match(out, /description: "It’s \\"new\\".",/)
  assert.match(out, /"title": "Tell it where you are"/)
  assert.match(out, /kind: 'coaching'/)
})
