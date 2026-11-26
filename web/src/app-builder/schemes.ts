import type {Answers} from './options'

/**
 * Colour schemes to pick at the colour question: each a canvas (light or dark) and an accent, made
 * for health, fitness and wellness apps, and ordered for each visitor by what they've said their
 * app is for. The accent is the colour answer; the scheme's canvas is a decision the plan keeps
 * (prototype.ts). Plain: browser and server.
 */

export interface Scheme {
  id: string
  name: string
  accent: string
  canvas: 'light' | 'dark'
  /** How it feels, in a few words, for the person choosing. */
  feel: string
  /** The kinds of app it suits, matched against their answers. */
  suits: string[]
}

export const SCHEMES: Scheme[] = [
  {id: 'forest', name: 'Forest', accent: '#2F6B4F', canvas: 'light', feel: 'Calm and outdoors', suits: ['run', 'hike', 'walk', 'outdoor', 'trail', 'nature', 'golf']},
  {id: 'lagoon', name: 'Lagoon', accent: '#0E7490', canvas: 'light', feel: 'Fresh and clear', suits: ['swim', 'surf', 'row', 'water', 'recovery', 'hydration', 'triathlon']},
  {id: 'clay', name: 'Clay', accent: '#B4532A', canvas: 'light', feel: 'Warm and grounded', suits: ['yoga', 'pilates', 'studio', 'mobility', 'stretch', 'reformer', 'barre']},
  {id: 'plum', name: 'Plum', accent: '#6B4FA0', canvas: 'light', feel: 'Soft and mindful', suits: ['meditat', 'mind', 'sleep', 'breath', 'calm', 'stress', 'therapy', 'mental']},
  {id: 'rose', name: 'Rose', accent: '#BE185D', canvas: 'light', feel: 'Bold and caring', suits: ['women', 'pregnan', 'postnatal', 'cycle', 'period', 'dance', 'menopause']},
  {id: 'cobalt', name: 'Cobalt', accent: '#1D4ED8', canvas: 'light', feel: 'Clear and trusted', suits: ['physio', 'clinic', 'rehab', 'health', 'patient', 'injury', 'doctor', 'nutrition']},
  {id: 'volt', name: 'Volt', accent: '#C8F135', canvas: 'dark', feel: 'Electric and intense', suits: ['strength', 'gym', 'hiit', 'lift', 'crossfit', 'weights', 'boxing', 'power']},
  {id: 'ember', name: 'Ember', accent: '#FF6B35', canvas: 'dark', feel: 'Hot and driven', suits: ['race', 'marathon', 'cycl', 'run', 'erg', 'pb', 'speed', 'sprint', 'compet']},
  {id: 'aurora', name: 'Aurora', accent: '#2DD4BF', canvas: 'dark', feel: 'Quiet and premium', suits: ['sleep', 'recovery', 'track', 'wearable', 'hrv', 'longevity', 'data']},
]

export const schemeById = (id?: string) => SCHEMES.find((s) => s.id === id)

/** The schemes, the ones that suit what they've said first; ties keep the list's order. */
export function schemesFor(answers: Answers): (Scheme & {fits: boolean})[] {
  const said = ['idea', 'business', 'doing', 'interests', 'goals', 'name'].map((k) => answers[k] ?? '').join(' ').toLowerCase()
  const score = (s: Scheme) => s.suits.filter((w) => said.includes(w)).length
  return SCHEMES.map((s, i) => ({s, i, n: score(s)}))
    .sort((a, b) => b.n - a.n || a.i - b.i)
    .map(({s, n}) => ({...s, fits: n > 0}))
}
