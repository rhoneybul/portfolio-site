import type {Answers} from './options'
import {referencesIn} from './references'

/**
 * Colour schemes to pick at the colour question, made for health, fitness and wellness apps: each a
 * palette of shades (a tinted canvas, its cards, the accent, a deep shade for bold bands and a soft
 * tint), on a light or dark canvas. They're ordered for each visitor: first the ones like the apps
 * they said they like (asked just before), then the ones that suit what their app is for. The
 * accent is the colour answer; the scheme's canvas and shades are decided for the plan and drawn by
 * the kit (prototype-doc.ts, Style.palette). Plain: browser and server.
 */

export interface Palette {
  /** The canvas behind everything. */
  bg: string
  /** Cards and rows on it. */
  surface: string
  /** A deep shade of the accent: bold bands, a goal card, the landing page's last call. */
  deep: string
  /** A soft tint of it: a quiet panel. */
  tint: string
}

export interface Scheme {
  id: string
  name: string
  accent: string
  canvas: 'light' | 'dark'
  palette: Palette
  /** How it feels, in a few words, for the person choosing. */
  feel: string
  /** The kinds of app it suits, matched against their answers. */
  suits: string[]
  /** The reference apps (references.ts) it looks like. */
  like: string[]
}

export const SCHEMES: Scheme[] = [
  {id: 'forest', name: 'Forest', accent: '#2F6B4F', canvas: 'light', palette: {bg: '#EEF2EC', surface: '#FFFFFF', deep: '#1E3B2E', tint: '#DCE8DF'}, feel: 'Calm and outdoors', suits: ['run', 'hike', 'walk', 'outdoor', 'trail', 'nature', 'golf'], like: []},
  {id: 'lagoon', name: 'Lagoon', accent: '#0E7490', canvas: 'light', palette: {bg: '#ECF3F5', surface: '#FFFFFF', deep: '#0B3B4A', tint: '#D3EBF0'}, feel: 'Fresh and clear', suits: ['swim', 'surf', 'row', 'water', 'recovery', 'hydration', 'triathlon'], like: []},
  {id: 'clay', name: 'Clay', accent: '#B4532A', canvas: 'light', palette: {bg: '#F5EFE8', surface: '#FFFCF8', deep: '#4A2A1C', tint: '#F1DCCD'}, feel: 'Warm and grounded', suits: ['yoga', 'pilates', 'studio', 'mobility', 'stretch', 'reformer', 'barre'], like: ['Gentler Streak', 'Headspace']},
  {id: 'sunrise', name: 'Sunrise', accent: '#E8611A', canvas: 'light', palette: {bg: '#FBF5EE', surface: '#FFFFFF', deep: '#5A2610', tint: '#FDE3CF'}, feel: 'Bright and uplifting', suits: ['habit', 'wellbeing', 'beginner', 'walk', 'energy', 'morning'], like: ['Headspace', 'Strava', 'Gentler Streak']},
  {id: 'plum', name: 'Plum', accent: '#6B4FA0', canvas: 'light', palette: {bg: '#F3F0F7', surface: '#FFFFFF', deep: '#2E2346', tint: '#E4DCF1'}, feel: 'Soft and mindful', suits: ['meditat', 'mind', 'breath', 'stress', 'therapy', 'mental', 'journal'], like: ['Headspace']},
  {id: 'rose', name: 'Rose', accent: '#BE185D', canvas: 'light', palette: {bg: '#F8EFF2', surface: '#FFFFFF', deep: '#4C0F2A', tint: '#F6D6E3'}, feel: 'Bold and caring', suits: ['women', 'pregnan', 'postnatal', 'period', 'dance', 'menopause'], like: ['Headway']},
  {id: 'cobalt', name: 'Cobalt', accent: '#1D4ED8', canvas: 'light', palette: {bg: '#EEF1F8', surface: '#FFFFFF', deep: '#13235B', tint: '#DBE4FB'}, feel: 'Clear and trusted', suits: ['physio', 'clinic', 'rehab', 'health', 'patient', 'injury', 'doctor', 'nutrition'], like: ['Headway', 'Runna']},
  {id: 'fresh', name: 'Fresh', accent: '#3E9B1C', canvas: 'light', palette: {bg: '#F1F8EC', surface: '#FFFFFF', deep: '#1F4D0C', tint: '#DDF2CF'}, feel: 'Playful and bright', suits: ['learn', 'habit', 'kids', 'game', 'streak', 'challenge', 'school'], like: ['Duolingo']},
  {id: 'volt', name: 'Volt', accent: '#C8F135', canvas: 'dark', palette: {bg: '#0E0F0C', surface: '#1A1C17', deep: '#2B3618', tint: '#262C1B'}, feel: 'Electric and intense', suits: ['strength', 'gym', 'hiit', 'lift', 'crossfit', 'weights', 'boxing', 'power'], like: ['Ladder']},
  {id: 'ember', name: 'Ember', accent: '#FF6B35', canvas: 'dark', palette: {bg: '#100D0C', surface: '#1D1817', deep: '#4A1E10', tint: '#33201A'}, feel: 'Hot and driven', suits: ['race', 'marathon', 'cycl', 'erg', 'speed', 'sprint', 'compet'], like: ['Strava', 'Runna']},
  {id: 'aurora', name: 'Aurora', accent: '#2DD4BF', canvas: 'dark', palette: {bg: '#0B0F10', surface: '#161C1E', deep: '#0F3A36', tint: '#133230'}, feel: 'Quiet and premium', suits: ['recovery', 'track', 'wearable', 'hrv', 'longevity', 'data'], like: ['Oura']},
  {id: 'night', name: 'Night', accent: '#8AB4FF', canvas: 'dark', palette: {bg: '#0B1426', surface: '#14213A', deep: '#1E3A6E', tint: '#1A2D52'}, feel: 'Deep and restful', suits: ['sleep', 'meditat', 'calm', 'night', 'rest', 'relax'], like: ['Calm']},
]

export const schemeById = (id?: string) => SCHEMES.find((s) => s.id === id)

/**
 * The schemes in the order to show them: those like the apps they like first (`like` names the
 * first such app), then those that suit what they've said (`fits`), then the rest in the list's order.
 */
export function schemesFor(answers: Answers): (Scheme & {fits: boolean; likeApp?: string})[] {
  const said = ['idea', 'business', 'doing', 'interests', 'goals', 'name'].map((k) => answers[k] ?? '').join(' ').toLowerCase()
  const liked = referencesIn(answers.inspiration).map((r) => r.name)
  return SCHEMES.map((s, i) => {
    const likeApp = liked.find((n) => s.like.includes(n))
    const fit = s.suits.filter((w) => said.includes(w)).length
    return {s, i, likeApp, fit, score: (likeApp ? 10 - liked.indexOf(likeApp) : 0) + fit}
  })
    .sort((a, b) => b.score - a.score || a.i - b.i)
    .map(({s, likeApp, fit}) => ({...s, fits: fit > 0, ...(likeApp ? {likeApp} : {})}))
}
